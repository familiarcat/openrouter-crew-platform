/**
 * CLI Budget Commands Tests
 * Verify budget set and status commands
 */

import { expect, test } from '@oclif/test';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

describe('budget commands', () => {
  let costService: CostOptimizationService;

  beforeEach(() => {
    costService = new CostOptimizationService();
  });

  describe('budget set', () => {
    test
      .stdout()
      .command(['budget', 'set', '--crew', 'crew_1', '--amount', '100'])
      .it('sets a new budget', (ctx) => {
        expect(ctx.stdout).to.contain('Budget set for crew_1');
        expect(ctx.stdout).to.contain('$100');
        expect(ctx.stdout).to.contain('monthly');
      });

    test
      .stdout()
      .command(['budget', 'set', '--crew', 'crew_1', '--amount', '100', '--period', 'weekly'])
      .it('sets budget with custom period', (ctx) => {
        expect(ctx.stdout).to.contain('weekly');
      });

    test
      .stdout()
      .command([
        'budget',
        'set',
        '--crew',
        'crew_1',
        '--amount',
        '100',
        '--force',
      ])
      .it('forces override of existing budget', (ctx) => {
        expect(ctx.stdout).to.contain('✅');
      });
  });

  describe('budget status', () => {
    beforeEach(() => {
      costService.setBudget('crew_1', 100, 'monthly');
      costService.updateBudget('crew_1', 30);
    });

    test
      .stdout()
      .command(['budget', 'status', '--crew', 'crew_1'])
      .it('displays budget status in table format', (ctx) => {
        expect(ctx.stdout).to.contain('Crew ID');
        expect(ctx.stdout).to.contain('crew_1');
        expect(ctx.stdout).to.contain('Spent');
        expect(ctx.stdout).to.contain('Remaining');
      });

    test
      .stdout()
      .command(['budget', 'status', '--crew', 'crew_1', '--format', 'json'])
      .it('displays budget status in JSON format', (ctx) => {
        const output = JSON.parse(ctx.stdout);
        expect(output.crewId).to.equal('crew_1');
        expect(output.limit).to.equal(100);
        expect(output.spent).to.equal(30);
      });

    test
      .stdout()
      .command(['budget', 'status', '--crew', 'crew_1', '--format', 'simple'])
      .it('displays budget status in simple format', (ctx) => {
        expect(ctx.stdout).to.contain('Crew: crew_1');
        expect(ctx.stdout).to.contain('Period: monthly');
        expect(ctx.stdout).to.contain('Limit: $100.00');
      });

    test
      .stdout()
      .command(['budget', 'status', '--crew', 'nonexistent'])
      .it('shows error for nonexistent budget', (ctx) => {
        expect(ctx.stdout).to.contain('No budget found');
      });

    test
      .stdout()
      .it('shows alert status when threshold reached', (ctx) => {
        costService.setBudget('crew_2', 100, 'monthly');
        costService.updateBudget('crew_2', 85);

        expect(ctx.stdout).to.contain('⚠️');
      });
  });

  describe('budget integration', () => {
    test
      .stdout()
      .command(['budget', 'set', '--crew', 'crew_test', '--amount', '50'])
      .then(() => {
        return test()
          .stdout()
          .command(['budget', 'status', '--crew', 'crew_test'])
          .it('set and status work together', (ctx) => {
            expect(ctx.stdout).to.contain('crew_test');
            expect(ctx.stdout).to.contain('$50');
          });
      });
  });
});
