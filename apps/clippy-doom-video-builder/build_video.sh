#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENGINE_DIR="${ROOT_DIR}/packages/creative-pipeline-engine"
ENGINE_DIST="${ENGINE_DIR}/dist/cli.js"

resolve_tool() {
  local tool_name="$1"

  if command -v "${tool_name}" >/dev/null 2>&1; then
    command -v "${tool_name}"
    return 0
  fi

  if [ -x "/opt/homebrew/bin/${tool_name}" ]; then
    echo "/opt/homebrew/bin/${tool_name}"
    return 0
  fi

  if [ -d "${HOME}/.nvm/versions/node" ]; then
    local candidate
    candidate="$(find "${HOME}/.nvm/versions/node" -path "*/bin/${tool_name}" | sort | tail -n 1)"
    if [ -n "${candidate}" ] && [ -x "${candidate}" ]; then
      echo "${candidate}"
      return 0
    fi
  fi

  return 1
}

PNPM_BIN="$(resolve_tool pnpm)"
NODE_BIN="$(resolve_tool node)"
export PATH="$(dirname "${NODE_BIN}")":"$(dirname "${PNPM_BIN}")":"${PATH}"

if [ ! -f "${ENGINE_DIST}" ]; then
  "${PNPM_BIN}" --dir "${ENGINE_DIR}" build
elif find "${ENGINE_DIR}/src" -type f -newer "${ENGINE_DIST}" -print -quit | grep -q .; then
  "${PNPM_BIN}" --dir "${ENGINE_DIR}" build
fi

"${NODE_BIN}" "${ENGINE_DIST}" run --app "${SCRIPT_DIR}" "$@"
