#!/usr/bin/env bash
# ============================================================
#  crew-env-bridge.sh
#
#  Bridges your zsh environment into bash deploy scripts.
#  Searches (in priority order):
#   1. Already-exported shell env (from your current session)
#   2. .env.local in repo root
#   3. ~/.zshenv  (always sourced by zsh)
#   4. ~/.zprofile (login shells)
#   5. ~/.config/openrouter-crew/.env (custom location)
#   6. AWS credential chain for cloud deploy vars
#
#  Modes:
#   --audit          Print what's found/missing (default)
#   --write          Write resolved vars to .env.local
#   --source         Print export statements (eval-able)
#   --fix-zshrc      Append missing exports to ~/.zshrc
# ============================================================

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
miss() { echo -e "  ${RED}✗${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}~${RESET}  $*"; }
log()  { echo -e "${CYAN}[env-bridge]${RESET} $*"; }
hdr()  { echo -e "\n${BOLD}$*${RESET}"; }

# ── locate repo root (works whether called from scripts/ or root) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../package.json" ]]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [[ -f "$SCRIPT_DIR/package.json" ]]; then
  REPO_ROOT="$SCRIPT_DIR"
else
  REPO_ROOT="$(pwd)"
fi

MODE="${1:-audit}"
ENV_FILE="$REPO_ROOT/.env.local"
ENV_EXAMPLE="$REPO_ROOT/.env.local.example"

# ════════════════════════════════════════════════════════════
#  KNOWN VARIABLE MAP
#  Format: "CANONICAL_NAME|alt1|alt2|description|required_for"
#
#  Canonical = what the scripts expect
#  alts      = common names in zsh configs / other tools
# ════════════════════════════════════════════════════════════
declare -a VAR_MAP=(
  # OpenRouter
  "OPENROUTER_API_KEY|OPENROUTER_KEY|OR_API_KEY|OpenRouter API key|all"
  # Supabase — Next.js public vars vs raw
  "NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL|SUPABASE_PROJECT_URL|Supabase project URL|all"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|SUPABASE_PUBLIC_KEY|Supabase anon key|all"
  "SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY|SUPABASE_SECRET_KEY|Supabase service role|staging,production"
  # Supabase DB
  "DATABASE_URL|SUPABASE_DB_URL|POSTGRES_URL|Postgres connection string|optional"
  # AWS
  "AWS_ACCESS_KEY_ID|AWS_KEY_ID|AWS_KEY|AWS access key|staging,production"
  "AWS_SECRET_ACCESS_KEY|AWS_SECRET|AWS_ACCESS_SECRET|AWS secret key|staging,production"
  "AWS_DEFAULT_REGION|AWS_REGION|AWS_DEPLOYMENT_REGION|AWS region|staging,production"
  # n8n
  "N8N_WEBHOOK_URL|N8N_URL|N8N_ENDPOINT|n8n webhook base URL|optional"
  "N8N_API_KEY|N8N_TOKEN|n8n API key|optional"
  "N8N_WEBHOOK_SECRET|WEBHOOK_SECRET|N8N_SECRET|n8n incoming webhook secret|optional"
  # Anthropic direct (used by some agents before routing)
  "ANTHROPIC_API_KEY|CLAUDE_API_KEY|CLAUDE_KEY|Anthropic API key|optional"
  # App URLs
  "NEXT_PUBLIC_APP_URL|APP_URL|PUBLIC_URL|Public app URL|optional"
  "NEXTAUTH_SECRET|AUTH_SECRET|JWT_SECRET|NextAuth secret|optional"
  "NEXTAUTH_URL|AUTH_URL|Auth callback URL|optional"
  # Google
  "GOOGLE_MAPS_API_KEY|GOOGLE_MAPS_KEY|MAPS_API_KEY|Google Maps key (BarItalia)|optional"
)

# ════════════════════════════════════════════════════════════
#  SOURCE COLLECTION — gather from all locations
# ════════════════════════════════════════════════════════════
declare -A RESOLVED   # canonical → value
declare -A SOURCES    # canonical → where it came from
declare -A MAPPING    # canonical → which alt name was actually found

collect_from_env() {
  # Current bash/zsh session environment
  for entry in "${VAR_MAP[@]}"; do
    IFS='|' read -ra parts <<< "$entry"
    local canonical="${parts[0]}"
    [[ -n "${!canonical:-}" ]] && {
      RESOLVED["$canonical"]="${!canonical}"
      SOURCES["$canonical"]="shell session"
      MAPPING["$canonical"]="$canonical"
      continue
    }
    # Try alt names
    for i in 1 2; do
      local alt="${parts[$i]:-}"
      [[ -z "$alt" || "$alt" == *" "* ]] && continue
      [[ -n "${!alt:-}" ]] && {
        RESOLVED["$canonical"]="${!alt}"
        SOURCES["$canonical"]="shell session (as \$$alt)"
        MAPPING["$canonical"]="$alt"
        break
      }
    done
  done
}

collect_from_file() {
  local file="$1" label="$2"
  [[ ! -f "$file" ]] && return

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blanks
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue

    # Handle "export KEY=VALUE" and "KEY=VALUE"
    line="${line#export }"
    local key="${line%%=*}"
    local val="${line#*=}"
    # Strip surrounding quotes
    val="${val#\"}" val="${val%\"}"
    val="${val#\'}"  val="${val%\'}"

    [[ -z "$key" || "$key" == "$line" ]] && continue

    # Check if this key matches any canonical or alt
    for entry in "${VAR_MAP[@]}"; do
      IFS='|' read -ra parts <<< "$entry"
      local canonical="${parts[0]}"
      [[ -n "${RESOLVED[$canonical]:-}" ]] && continue  # already resolved (higher priority)
      # Check only Canonical, Alt1, and Alt2 indices
      for i in 0 1 2; do
        local candidate="${parts[$i]:-}"
        [[ -z "$candidate" || "$candidate" == *" "* ]] && continue
        if [[ "$key" == "$candidate" ]]; then
          RESOLVED["$canonical"]="$val"
          SOURCES["$canonical"]="$label"
          MAPPING["$canonical"]="$key"
          break
        fi
      done
    done
  done < "$file"
}

collect_from_aws() {
  # Check AWS credential chain
  local aws_creds="$HOME/.aws/credentials"
  local aws_config="$HOME/.aws/config"

  if [[ -f "$aws_creds" ]] && [[ -z "${RESOLVED[AWS_ACCESS_KEY_ID]:-}" ]]; then
    local key_id secret
    key_id=$(grep -A2 '^\[default\]' "$aws_creds" 2>/dev/null | grep 'aws_access_key_id' | cut -d= -f2 | tr -d ' ' || echo "")
    secret=$(grep -A3 '^\[default\]' "$aws_creds" 2>/dev/null | grep 'aws_secret_access_key' | cut -d= -f2 | tr -d ' ' || echo "")
    [[ -n "$key_id" ]] && { RESOLVED["AWS_ACCESS_KEY_ID"]="$key_id"; SOURCES["AWS_ACCESS_KEY_ID"]="~/.aws/credentials"; }
    [[ -n "$secret" ]] && { RESOLVED["AWS_SECRET_ACCESS_KEY"]="$secret"; SOURCES["AWS_SECRET_ACCESS_KEY"]="~/.aws/credentials"; }
  fi

  if [[ -f "$aws_config" ]] && [[ -z "${RESOLVED[AWS_DEFAULT_REGION]:-}" ]]; then
    local region
    region=$(grep -A5 '^\[default\]' "$aws_config" 2>/dev/null | grep 'region' | cut -d= -f2 | tr -d ' ' || echo "")
    [[ -n "$region" ]] && { RESOLVED["AWS_DEFAULT_REGION"]="$region"; SOURCES["AWS_DEFAULT_REGION"]="~/.aws/config"; }
  fi
}

collect_all() {
  log "Scanning environment sources..."

  # Priority order: current session wins, then files from most to least specific
  collect_from_env

  [[ -f "$ENV_FILE" ]]                       && collect_from_file "$ENV_FILE"          ".env.local"
  [[ -f "$HOME/.zshenv" ]]                   && collect_from_file "$HOME/.zshenv"      "~/.zshenv"
  [[ -f "$HOME/.zprofile" ]]                 && collect_from_file "$HOME/.zprofile"    "~/.zprofile"
  [[ -f "$HOME/.zshrc" ]]                    && collect_from_file "$HOME/.zshrc"       "~/.zshrc"
  [[ -f "$HOME/.bash_profile" ]]             && collect_from_file "$HOME/.bash_profile" "~/.bash_profile"
  [[ -f "$HOME/.config/openrouter-crew/.env" ]] && \
    collect_from_file "$HOME/.config/openrouter-crew/.env" "~/.config/openrouter-crew/.env"

  collect_from_aws
}

# ════════════════════════════════════════════════════════════
#  AUDIT — print full resolution report
# ════════════════════════════════════════════════════════════
audit() {
  hdr "Environment Audit — OpenRouter Crew Platform"
  echo -e "${DIM}  Repo: $REPO_ROOT${RESET}"
  echo ""

  local found=0 missing=0 optional_miss=0

  for entry in "${VAR_MAP[@]}"; do
    IFS='|' read -ra parts <<< "$entry"
    local canonical="${parts[0]}"
    local desc="${parts[4]:-unknown}"
    local required_for="${parts[5]:-}"
    # Handle 5-element vs 6-element entries
    [[ "${#parts[@]}" -eq 5 ]] && { desc="${parts[3]}"; required_for="${parts[4]}"; }
    [[ "${#parts[@]}" -eq 6 ]] && { desc="${parts[4]}"; required_for="${parts[5]}"; }

    if [[ -n "${RESOLVED[$canonical]:-}" ]]; then
      local val="${RESOLVED[$canonical]}"
      local src="${SOURCES[$canonical]:-unknown}"
      local mapped="${MAPPING[$canonical]:-$canonical}"
      # Mask sensitive values
      local masked
      if [[ ${#val} -gt 8 ]]; then
        masked="${val:0:4}****${val: -4}"
      else
        masked="****"
      fi
      local map_note=""
      [[ "$mapped" != "$canonical" ]] && map_note=" ${DIM}(found as \$$mapped)${RESET}"
      ok "${BOLD}$canonical${RESET} = $masked  ${DIM}← $src${RESET}$map_note"
      ((found++)) || true
    else
      case "$required_for" in
        all)   miss "${BOLD}$canonical${RESET}  ${DIM}— $desc [REQUIRED]${RESET}"; ((missing++)) || true ;;
        optional) warn "${BOLD}$canonical${RESET}  ${DIM}— $desc [optional]${RESET}"; ((optional_miss++)) || true ;;
        *)     warn "${BOLD}$canonical${RESET}  ${DIM}— $desc [needed for: $required_for]${RESET}"; ((optional_miss++)) || true ;;
      esac
    fi
  done

  echo ""
  echo -e "${BOLD}Summary:${RESET}  ${GREEN}$found resolved${RESET}  |  ${RED}$missing required missing${RESET}  |  ${YELLOW}$optional_miss optional missing${RESET}"

  if [[ $missing -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}To fix required vars:${RESET}"
    echo "  Option A: Add to ~/.zshenv (persists across all shells):"
    for entry in "${VAR_MAP[@]}"; do
      IFS='|' read -ra parts <<< "$entry"
      local canonical="${parts[0]}"
      local required_for="${parts[${#parts[@]}-1]}"
      [[ -z "${RESOLVED[$canonical]:-}" ]] && [[ "$required_for" == "all" ]] && \
        echo "    export $canonical=\"your-value-here\""
    done
    echo ""
    echo "  Option B: Run this script with --write to generate .env.local"
    echo "  Option C: Run with --fix-zshrc to append exports to ~/.zshrc"
  fi
}

# ════════════════════════════════════════════════════════════
#  WRITE — create/update .env.local from resolved values
# ════════════════════════════════════════════════════════════
write_env_local() {
  log "Writing resolved vars to $ENV_FILE"

  local tmp="$ENV_FILE.tmp.$$"
  {
    echo "# Auto-generated by crew-env-bridge.sh — $(date -u +"%Y-%m-%d %H:%M UTC")"
    echo "# Edit this file to override any value."
    echo "# DO NOT commit to git — it is in .gitignore"
    echo ""

    for entry in "${VAR_MAP[@]}"; do
      IFS='|' read -ra parts <<< "$entry"
      local canonical="${parts[0]}"
      local desc
      [[ "${#parts[@]}" -eq 5 ]] && desc="${parts[3]}" || desc="${parts[4]}"

      echo "# $desc"
      if [[ -n "${RESOLVED[$canonical]:-}" ]]; then
        echo "$canonical=\"${RESOLVED[$canonical]}\""
      else
        echo "# $canonical=  # NOT FOUND — set this manually"
      fi
      echo ""
    done
  } > "$tmp"

  mv "$tmp" "$ENV_FILE"
  ok "Written: $ENV_FILE"
  echo ""
  echo "  🔍 Review with: cat $ENV_FILE"
  echo "  🚀 Then re-run: pnpm deploy:aws staging"
}

# ════════════════════════════════════════════════════════════
#  SOURCE — print export statements for eval
# ════════════════════════════════════════════════════════════
source_mode() {
  # This mode is meant to be eval'd:
  # eval "$(bash scripts/crew-env-bridge.sh --source)"
  for entry in "${VAR_MAP[@]}"; do
    IFS='|' read -ra parts <<< "$entry"
    local canonical="${parts[0]}"
    [[ -n "${RESOLVED[$canonical]:-}" ]] && \
      printf "export %s=%q\n" "$canonical" "${RESOLVED[$canonical]}"
  done
  # Data's fix: Export generation flags for automation scripts
  for canonical in "${!SOURCES[@]}"; do
    [[ "${SOURCES[$canonical]}" == "auto-generated" ]] && printf "export %s_IS_GENERATED=true\n" "$canonical"
  done
}

# ════════════════════════════════════════════════════════════
#  FIX-ZSHRC — append missing exports to ~/.zshrc
# ════════════════════════════════════════════════════════════
fix_zshrc() {
  local zshrc="$HOME/.zshrc"
  log "Checking ~/.zshrc for missing exports..."

  local appended=0
  local block=""
  block+="\n# Added by crew-env-bridge.sh — $(date -u +"%Y-%m-%d")\n"

  for entry in "${VAR_MAP[@]}"; do
    IFS='|' read -ra parts <<< "$entry"
    local canonical="${parts[0]}"
    local required_for="${parts[${#parts[@]}-1]}"
    local desc
    [[ "${#parts[@]}" -eq 5 ]] && desc="${parts[3]}" || desc="${parts[4]}"

    [[ -n "${RESOLVED[$canonical]:-}" ]] && continue
    [[ "$required_for" == "optional" ]] && continue

    block+="# $desc\n"
    block+="export $canonical=\"\"\n"
    ((appended++)) || true
  done

  if [[ $appended -gt 0 ]]; then
    echo ""
    warn "$appended missing required vars not found anywhere."
    echo -e "The following will be appended to $zshrc (with empty values):"
    echo -e "$block"
    read -r -p "Append to ~/.zshrc? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] && {
      echo -e "$block" >> "$zshrc"
      ok "Appended to ~/.zshrc — fill in the empty values, then run: source ~/.zshrc"
    } || log "Aborted, no changes made."
  else
    ok "All required vars already present — ~/.zshrc is fine"
  fi
}

# ════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════
collect_all

case "$MODE" in
  --audit|audit)       audit ;;
  --write|write)       audit; echo ""; write_env_local ;;
  --source|source)     source_mode ;;
  --fix-zshrc|fix-zshrc) audit; fix_zshrc ;;
  --help|-h)
    echo "Usage: $0 [--audit|--write|--source|--fix-zshrc]"
    echo ""
    echo "  --audit      Show what's found/missing (default)"
    echo "  --write      Write resolved vars to .env.local"
    echo "  --source     Print exports for eval (eval \"\$($0 --source)\")"
    echo "  --fix-zshrc  Append missing exports to ~/.zshrc"
    ;;
  *) warn "Unknown mode: $MODE"; exit 1 ;;
esac
