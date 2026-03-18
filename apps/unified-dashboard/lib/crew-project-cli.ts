import path from 'node:path'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

function resolveRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..', '..'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'scripts', 'crew-project-cli.mjs'))) {
      return candidate
    }
  }

  return path.resolve(process.cwd(), '..', '..')
}

const repoRoot = resolveRepoRoot()
const cliScriptPath = path.join(repoRoot, 'scripts', 'crew-project-cli.mjs')

interface ProjectCliOptions {
  id?: string
  payload?: Record<string, unknown>
  status?: string
  limit?: number
}

export async function runCrewProjectCli<T>(
  command:
    | 'list'
    | 'create'
    | 'get'
    | 'update'
    | 'delete'
    | 'list-sprints'
    | 'create-sprint'
    | 'list-stories'
    | 'get-story'
    | 'create-story'
    | 'update-story',
  options: ProjectCliOptions = {},
): Promise<T> {
  const args = [cliScriptPath, command]
  if (options.id && !['list-sprints', 'list-stories'].includes(command)) {
    args.push('--id', options.id)
  }
  if ((command === 'list-sprints') && options.id) {
    args.push('--project-id', options.id)
  }
  if ((command === 'list-stories') && options.id) {
    args.push('--sprint-id', options.id)
  }
  if (options.status) {
    args.push('--status', options.status)
  }
  if (typeof options.limit === 'number') {
    args.push('--limit', String(options.limit))
  }
  if (options.payload) {
    args.push('--payload', JSON.stringify(options.payload))
  }

  const stdout = execFileSync(process.execPath, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 5,
  })

  return JSON.parse(stdout) as T
}
