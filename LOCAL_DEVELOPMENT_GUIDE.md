# Local Development Guide

## Goal

Run a locally testable version of the platform with:

- dashboard on `http://localhost:3000`
- n8n on `http://localhost:5678`
- local infra via Docker
- shared UI packages built for dashboard and VS Code

## First-Time Setup

```bash
pnpm local:setup
```

That will:

- create `.env.local` from `.env.local.example` if needed
- install workspace dependencies
- build the shared UI package

## Start Local Infra

```bash
pnpm local:infra:up
```

This starts:

- `supabase-db`
- `supabase-studio`
- `n8n`
- `redis`

To stop it:

```bash
pnpm local:infra:down
```

## Start the Dashboard

```bash
pnpm dev:dashboard
```

Recommended host-based development path:

- run infra in Docker
- run the dashboard from the host for fast iteration

## Shared UI Development

If you are changing shared dashboard / VS Code UI packages:

```bash
pnpm dev:shared-ui
```

Then in a second terminal:

```bash
pnpm dev:dashboard
```

## VS Code Extension Development

Watch the extension build:

```bash
pnpm dev:vscode
```

Then launch extension development from VS Code against:

- platform URL: `http://localhost:3000`
- CLI path: `crew`

## Verify the Local Platform

```bash
pnpm local:verify
```

This checks:

- shared UI build
- dashboard build
- CLI bridge syntax

## AWS Deployment

The production AWS path remains:

```bash
pnpm deploy:aws
```

CI/CD still uses the EC2/ECR/SSM workflow already aligned in the repo.
