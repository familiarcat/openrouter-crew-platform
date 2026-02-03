import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { UNIVERSAL_ACTIONS } from '@/lib/action-registry';

export async function POST(req: NextRequest) {
  try {
    // Security: Ensure this only runs in development or explicitly enabled environments
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_LOCAL_EXECUTION) {
       return NextResponse.json({ error: 'Local execution not allowed in production' }, { status: 403 });
    }

    const body = await req.json();
    const { actionId, params } = body;
    
    const action = UNIVERSAL_ACTIONS[actionId];
    if (!action) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Resolve script path relative to monorepo root
    // Assuming dashboard is at domains/alex-ai-universal/dashboard
    const rootDir = path.resolve(process.cwd(), '../../..');
    const scriptPath = path.join(rootDir, action.script);

    // Construct command
    let command = `bash "${scriptPath}"`;
    
    // Append args based on action definition
    if (actionId === 'domain:create') {
        if (params.name) command += ` "${params.name}"`;
    } else if (actionId === 'sync:all') {
        if (params.n8n_direction) command += ` --n8n=${params.n8n_direction}`;
        if (params.db_push) command += ` --db-push`;
    } else if (actionId === 'story:create') {
        if (params.project) command += ` --project="${params.project}"`;
        if (params.sprint) command += ` --sprint="${params.sprint}"`;
        if (params.name) command += ` "${params.name}"`;
    }

    // Execute
    return new Promise((resolve) => {
      exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
        if (error) {
          resolve(NextResponse.json({ success: false, error: error.message, stdout, stderr }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true, stdout, stderr }));
        }
      });
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
