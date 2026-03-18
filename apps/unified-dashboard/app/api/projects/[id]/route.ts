import { NextResponse } from 'next/server'
import { runCrewProjectCli } from '@/lib/crew-project-cli'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = context.params
    const payload = await runCrewProjectCli<{ project: unknown }>('get', { id })
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = context.params
    const body = await request.json()
    if (body?.budgetUsd !== undefined) {
      const budgetUsd =
        typeof body.budgetUsd === 'number'
          ? body.budgetUsd
          : Number.parseFloat(String(body.budgetUsd))
      if (!Number.isFinite(budgetUsd) || budgetUsd < 0) {
        return NextResponse.json(
          { error: 'Budget must be a positive number' },
          { status: 400 },
        )
      }
      body.budgetUsd = budgetUsd
    }

    const payload = await runCrewProjectCli<{ project: unknown }>('update', {
      id,
      payload: body,
    })
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = context.params
    const payload = await runCrewProjectCli<{ success: boolean; deletedId: string }>('delete', { id })
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
