import { NextResponse } from 'next/server'
import { getMockProjectRecords } from '@/lib/project-platform'
import { runCrewProjectCli } from '@/lib/crew-project-cli'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function applyProjectFilters(
  projects: ReturnType<typeof getMockProjectRecords>,
  status?: string | null,
  limit?: number,
) {
  const filtered = status ? projects.filter((project) => project.status === status) : projects
  return typeof limit === 'number' ? filtered.slice(0, limit) : filtered
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limitParam = searchParams.get('limit')
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined
  const limit = typeof parsedLimit === 'number' && Number.isFinite(parsedLimit) ? parsedLimit : undefined

  try {
    const payload = await runCrewProjectCli<{ projects: ReturnType<typeof getMockProjectRecords>; source: string }>('list', {
      status: status || undefined,
      limit,
    })
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({
      projects: applyProjectFilters(getMockProjectRecords(), status, limit),
      source: 'mock',
      warning: error instanceof Error ? error.message : 'Project CLI query failed',
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 },
      )
    }

    const budgetUsd =
      typeof body?.budgetUsd === 'number'
        ? body.budgetUsd
        : typeof body?.budgetUsd === 'string' && body.budgetUsd.trim()
          ? Number.parseFloat(body.budgetUsd)
          : undefined

    if (typeof budgetUsd === 'number' && (!Number.isFinite(budgetUsd) || budgetUsd < 0)) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 },
      )
    }

    const payload = await runCrewProjectCli<{ project: unknown }>('create', {
      payload: {
        name,
        description: typeof body?.description === 'string' ? body.description : undefined,
        domainId: typeof body?.domainId === 'string' ? body.domainId : undefined,
        type: typeof body?.type === 'string' ? body.type : undefined,
        template: typeof body?.template === 'string' ? body.template : undefined,
        budgetUsd,
        status: typeof body?.status === 'string' ? body.status : undefined,
      },
    })
    return NextResponse.json(
      payload,
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
