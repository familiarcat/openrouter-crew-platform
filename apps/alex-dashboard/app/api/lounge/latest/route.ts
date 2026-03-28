import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CrewMemory {
  crew_member: string;
  agent_id: string;
  title: string;
  summary: string;
  key_findings: string[];
  conclusions: string[];
  recommendations: string[];
  timestamp: string;
}

interface LoungeLatestResponse {
  crew: CrewMemory[];
}

interface CrewMemoryFile extends Partial<Omit<CrewMemory, 'agent_id'>> {
  member?: string;
  name?: string;
  topic?: string;
  brief?: string;
  date?: string;
}
/**
 * Lounge Latest API
 * - Strictly proxies to n8n (no direct Supabase access from UI)
 * - Reads webhook from env (N8N_LOUNGE_LATEST_WEBHOOK or N8N_URL + /webhook/lounge-latest)
 */

function buildWebhookUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_N8N_LOUNGE_LATEST_WEBHOOK || process.env.N8N_LOUNGE_LATEST_WEBHOOK;
  const base = process.env.NEXT_PUBLIC_N8N_URL || process.env.N8N_URL || 'https://n8n.pbradygeorgen.com';

  if (explicit) {
    if (/^https?:\/\//i.test(explicit)) return explicit;
    if (explicit.startsWith('/')) {
      return `${base.replace(/\/$/, '')}${explicit}`;
    }
  }

  return `${base.replace(/\/$/, '')}/webhook/lounge-latest`;
}

export async function GET() {
  try {
    const primary = buildWebhookUrl();
    const base = process.env.NEXT_PUBLIC_N8N_URL || process.env.N8N_URL || 'https://n8n.pbradygeorgen.com';
    const baseNorm = base.replace(/\/$/, '');
    const candidates = Array.from(new Set([
      primary,
      baseNorm ? `${baseNorm}/webhook/lounge-latest` : null,
      baseNorm ? `${baseNorm}/webhook/lounge-latest/` : null,
      baseNorm ? `${baseNorm}/n8n/webhook/lounge-latest` : null,
      baseNorm ? `${baseNorm}/n8n/webhook/lounge-latest/` : null,
      baseNorm ? `${baseNorm}/webhook-test/lounge-latest` : null,
      baseNorm ? `${baseNorm}/webhook-test/lounge-latest/` : null,
      baseNorm ? `${baseNorm}/n8n/webhook-test/lounge-latest` : null,
      baseNorm ? `${baseNorm}/n8n/webhook-test/lounge-latest/` : null,
    ].filter(Boolean) as string[]));

    let data: any = null;

    const sharedHeaders: Record<string, string> = {};
    const signingSecret = process.env.N8N_WEBHOOK_SECRET || process.env.N8N_CONTROLLER_TOKEN;
    if (signingSecret) {
      // simple shared-secret header; workflow should validate
      sharedHeaders['x-controller-token'] = signingSecret;
    }

    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { method: 'GET', signal: controller.signal, headers: { 'Accept': 'application/json', ...sharedHeaders } });
        clearTimeout(timeout);

        const responseData = await res.json().catch(() => null) as LoungeLatestResponse | null;
        if (res.ok && responseData && Array.isArray(responseData.crew)) {
          data = responseData;
          break;
        }
      } catch {
        // try next candidate
        continue;
      }
    }
    if (!data) {
      // Dev fallback: synthesize from local crew-memories if available
      try {
        const cwd = process.cwd();
        const roots = Array.from(new Set([
          cwd,
          path.resolve(cwd, '..'),
          path.resolve(cwd, '..', '..')
        ]));
        const searchPaths: string[] = [];
        for (const root of roots) {
          searchPaths.push(path.join(root, 'crew-memories', 'active'));
          searchPaths.push(path.join(root, 'crew-memories'));
        }
        const seen = new Set<string>();
        const crew: CrewMemory[] = [];

        const aliasToSlug: Record<string, string> = {
          // Geordi variants
          'geordi': 'la-forge',
          'geordi la forge': 'la-forge',
          'lt. cmdr. geordi': 'la-forge',
          'lieutenant commander geordi la forge': 'la-forge',
          'la forge': 'la-forge',
          // Common others (defensive)
          'picard': 'picard',
          'captain jean-luc picard': 'picard',
          'data': 'data',
          'commander data': 'data',
          'worf': 'worf',
          'deanna troi': 'troi',
          't roi': 'troi',
          'crusher': 'crusher',
          'beverly crusher': 'crusher',
          'riker': 'riker',
          'william riker': 'riker',
          'uhura': 'uhura'
        };

        const toSlug = (name: string): string => {
          const raw = String(name || '').trim().toLowerCase();
          if (!raw) return '';
          const mapped = aliasToSlug[raw] || raw;
          return mapped
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        for (const dir of searchPaths) {
          if (!fs.existsSync(dir)) continue;
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
          for (const file of files) {
            const filePath = path.join(dir, file);
            try {
              const json: CrewMemoryFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              const member = json.crew_member || json.member || json.name || path.basename(file, '.json');
              const slug = toSlug(member);
              if (seen.has(slug)) continue;
              seen.add(slug);
              crew.push({
                crew_member: String(member || ''),
                agent_id: slug,
                title: String(json.title || json.topic || 'Latest Briefing'),
                summary: String(json.summary || json.brief || ''),
                key_findings: Array.isArray(json.key_findings) ? json.key_findings.map(String) : [],
                conclusions: Array.isArray(json.conclusions) ? json.conclusions.map(String) : [],
                recommendations: Array.isArray(json.recommendations) ? json.recommendations.map(String) : [],
                timestamp: String(json.timestamp || json.date || new Date().toISOString())
              });
            } catch (parseError) {
              console.error(`[Lounge Dev Fallback] Failed to parse ${file}:`, parseError);
            }
          }
        }
        return NextResponse.json({ crew }, { status: 200 });
      } catch {}
      // Last resort: render with empty crew
      return NextResponse.json({ crew: [] }, { status: 200 });
    }

    // Minimal shape validation/sanitization
    // Expecting: { crew: [{ crew_member, title, summary, key_findings, conclusions, recommendations, timestamp }] }
    const crew: CrewMemory[] = data?.crew ?? [];
    const safe: CrewMemory[] = crew.map((m) => ({
      crew_member: String(m.crew_member || ''),
      agent_id: String((m as any).agent_id || ''), // Not in standard response, but keep for dev fallback consistency
      title: String(m.title || ''),
      summary: String(m.summary || ''),
      key_findings: Array.isArray(m.key_findings) ? m.key_findings.map(String) : [],
      conclusions: Array.isArray(m.conclusions) ? m.conclusions.map(String) : [],
      recommendations: Array.isArray(m.recommendations) ? m.recommendations.map(String) : [],
      timestamp: String(m.timestamp || '')
    }));

    return NextResponse.json({ crew: safe }, { status: 200 });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) {
        message = err.name === 'AbortError' ? 'Upstream timeout' : err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
