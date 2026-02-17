# Changelog

## [Unreleased]

### Fixed
- **Local Development**: Increased `n8n` service health check timeout from 30s to 90s in `scripts/start-local-dev.sh` to accommodate slower startup times.
- **Local Development**: Updated `check_service` to use `curl -sf` to ensure services return a valid HTTP 200 status before being marked as healthy.
- **Local Development**: Increased `API Server` health check timeout from 30s to 60s in `scripts/start-local-dev.sh` to prevent premature script failure on slower machines.
- **Local Development**: Added a health check for Supabase in `scripts/start-local-dev.sh` to ensure the database is ready before starting dependent services, preventing API server startup timeouts.
- **Local Development**: Improved `start-local-dev.sh` to automatically display the last 50 lines of a service's log file if its health check fails, aiding in faster debugging.
- **Local Development**: Updated `start-local-dev.sh` to support remote Supabase instances by checking `NEXT_PUBLIC_SUPABASE_URL` and skipping local startup if a remote URL is detected.
- **Local Development**: Fixed API Server health check URL to `/api/health` and explicitly set ports for API Server (3001) and Web Portal (3000) to prevent conflicts.
- **Local Development**: Increased Web Portal health check timeout to 60s to accommodate initial build times.
- **Local Development**: Added automatic generation of `/api/health` endpoint for Web Portal and updated health check to use it, ensuring reliable startup verification.
- **Local Development**: Updated `start-local-dev.sh` to automatically open all web interfaces (Dashboards, n8n, Supabase) in the default browser upon successful startup.
- **Local Development**: Enhanced `pnpm dev` to automatically open all dashboard URLs (ports 3000, 3002, 3003, 3004) once they are ready, mirroring the behavior of `dev:full`.