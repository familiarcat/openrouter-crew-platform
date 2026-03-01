# Versioning System

Comprehensive milestone and versioning system for OpenRouter Crew Platform.

## Scripts

### `milestones.ts`

TypeScript class and utilities for managing milestones and versions.

**Features**:
- Track development milestones (alpha, beta, rc, release)
- Semantic versioning with auto-increment
- Codebase metrics calculation
- Milestone history tracking
- Version badge generation
- Changelog generation

**Usage**:
```typescript
import { MilestoneManager } from './milestones';

const manager = new MilestoneManager();

// Create new milestone
const milestone = await manager.createMilestone('alpha', {
  currentVersion: '1.0.0',
  features: ['New dashboard'],
  fixes: [],
  breaking: [],
  deployed: {
    local: '/dist/1.0.0',
    remote: ''
  }
});

// Save milestone
manager.saveMilestone(milestone);

// Add to history
manager.addToHistory(milestone);

// Generate changelog
const changelog = manager.generateChangelog(milestone);
```

### `generate-version-info.ts`

Generate version information files, badges, and metadata.

**Commands**:
```bash
# Generate all version information
ts-node scripts/versioning/generate-version-info.ts all

# Generate individual files
ts-node scripts/versioning/generate-version-info.ts badge
ts-node scripts/versioning/generate-version-info.ts api
ts-node scripts/versioning/generate-version-info.ts metadata
ts-node scripts/versioning/generate-version-info.ts status
ts-node scripts/versioning/generate-version-info.ts page
```

**Generated Files**:
- `.version-info/version.json` - Version API
- `.version-info/build-metadata.json` - Build information
- `.version-info/deployment-status.json` - Deployment tracking
- `.version-info/version-badge.svg` - SVG badge
- `.version-info/version-{VERSION}-{STAGE}.html` - Info page

## CLI Integration

Add to `package.json`:
```json
{
  "scripts": {
    "version:generate": "ts-node scripts/versioning/generate-version-info.ts all",
    "version:current": "node -e \"console.log(require('./package.json').version)\"",
    "version:badge": "ts-node scripts/versioning/generate-version-info.ts badge"
  }
}
```

## Files Structure

```
scripts/versioning/
├── README.md                      # This file
├── milestones.ts                  # Milestone management
└── generate-version-info.ts       # Version information generation
```

See [VERSIONING.md](../../VERSIONING.md) for complete documentation.
