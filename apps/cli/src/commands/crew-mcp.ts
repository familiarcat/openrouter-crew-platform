/**
 * Crew MCP Commands
 *
 * CLI commands for running crew agents as MCP servers
 * and using Claude with crew agents to solve problems.
 *
 * Commands:
 * - pnpm crew:run [agent] - Start MCP server for agent
 * - pnpm crew:solve "problem" - Use Claude with crew to solve problem
 * - pnpm crew:status - Show active crew agents
 */

import { Command } from 'commander'
import * as chalk from 'chalk'
import { DataAgentServer, WorfAgentServer, CrewOrchestrator } from '@openrouter-crew/agent-orchestration'

/**
 * Register crew MCP commands
 */
export function registerCrewMCPCommands(program: Command) {
  const crewProgram = program.command('crew').description('Crew agent management and operations')

  /**
   * crew run [agent] - Start an MCP server
   */
  crewProgram
    .command('run [agent]')
    .description('Start crew agent as MCP server')
    .option('--all', 'Start all agents', false)
    .option('--port <number>', 'Port for MCP server (simulated)', '3000')
    .action(async (agent: string | undefined, options: any) => {
      try {
        if (options.all) {
          console.log(chalk.blue('🚀 Starting all crew agents...\n'))
          await startAllAgents()
        } else if (agent) {
          console.log(chalk.blue(`🚀 Starting ${agent} agent...\n`))
          await startAgent(agent, options.port)
        } else {
          console.log(
            chalk.yellow('Usage: crew run [agent] or crew run --all\n') +
              chalk.dim('Available agents: data, worf, troi, geordi, crusher\n')
          )
        }
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })

  /**
   * crew solve "problem" - Use Claude with crew to solve problem
   */
  crewProgram
    .command('solve <problem>')
    .description('Use Claude with crew agents to solve a problem')
    .option('--agents <list>', 'Comma-separated list of agents to use', 'data,worf')
    .option('--verbose', 'Show detailed output', false)
    .action(async (problem: string, options: any) => {
      try {
        const agents = options.agents.split(',').map((a: string) => a.trim())

        console.log(chalk.blue('\n🎯 Crew Problem Solving System\n'))
        console.log(chalk.bold('Problem:'), problem)
        console.log(chalk.bold('Crew:'), agents.join(', '))
        console.log('')

        // Initialize orchestrator
        const orchestrator = new CrewOrchestrator()

        // Start agents
        await orchestrator.startAgents(agents)

        // Solve problem
        console.log(chalk.cyan('Analyzing problem and gathering crew intelligence...\n'))
        const result = await orchestrator.solveProblem(problem)

        // Display results
        console.log(chalk.green('\n✅ Analysis Complete\n'))
        console.log(chalk.bold('\nFindings:'))
        result.findings.forEach((finding: any) => {
          console.log(`\n${chalk.cyan(finding.tool)} (${finding.agent})`)
          console.log(JSON.stringify(finding.result, null, 2))
        })

        console.log('\n' + chalk.bold('Synthesis:'))
        console.log(chalk.dim(result.synthesis))

        console.log('\n' + chalk.bold('Performance:'))
        console.log(`  Execution time: ${result.metadata.execution_time_ms}ms`)
        console.log(`  Model: ${result.metadata.model}`)

        // Stop agents
        await orchestrator.stopAgents()

        console.log(chalk.green('\n✅ Done!\n'))
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })

  /**
   * crew status - Show active agents
   */
  crewProgram
    .command('status')
    .description('Show status of crew agents')
    .action(async () => {
      try {
        console.log(chalk.blue('\n📊 Crew Agent Status\n'))

        const agents = [
          {
            name: 'Data',
            role: 'pragmatic-solutions',
            tools: 4,
            status: 'Ready'
          },
          {
            name: 'Worf',
            role: 'security-compliance',
            tools: 4,
            status: 'Ready'
          },
          {
            name: 'Troi',
            role: 'user-experience',
            tools: 0,
            status: 'Coming soon'
          },
          {
            name: 'Geordi',
            role: 'infrastructure',
            tools: 0,
            status: 'Coming soon'
          },
          {
            name: 'Crusher',
            role: 'system-health',
            tools: 0,
            status: 'Coming soon'
          }
        ]

        console.log(chalk.dim('Agent Name       Role                    Tools   Status'))
        console.log(chalk.dim('─'.repeat(65)))

        agents.forEach(agent => {
          const statusColor =
            agent.status === 'Ready' ? chalk.green(agent.status) : chalk.yellow(agent.status)
          console.log(
            `${agent.name.padEnd(16)} ${agent.role.padEnd(22)} ${agent.tools}       ${statusColor}`
          )
        })

        console.log('\n' + chalk.bold('Quick Start:'))
        console.log(`  ${chalk.cyan('pnpm crew:run data')}             Start Data agent (cost analysis)`)
        console.log(`  ${chalk.cyan('pnpm crew:run worf')}             Start Worf agent (security)`)
        console.log(
          `  ${chalk.cyan("pnpm crew:solve 'problem text'")}  Solve a problem using crew`
        )
        console.log('')
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })
}

/**
 * Start individual agent as MCP server
 */
async function startAgent(agentName: string, port: string): Promise<void> {
  switch (agentName.toLowerCase()) {
    case 'data':
      console.log(chalk.green(`✅ Data Agent MCP Server Started`))
      console.log(chalk.dim(`   Agent: Data (Pragmatic Solutions)`))
      console.log(chalk.dim(`   Tools: analyze-costs, forecast-costs, calculate-roi, identify-anomalies`))
      console.log(chalk.dim(`   Ready to accept requests from Claude`))
      console.log(chalk.dim(`\n   Press Ctrl+C to stop`))

      const dataServer = new DataAgentServer()
      await dataServer.start()
      break

    case 'worf':
      console.log(chalk.green(`✅ Worf Agent MCP Server Started`))
      console.log(chalk.dim(`   Agent: Worf (Security & Compliance)`))
      console.log(chalk.dim(`   Tools: verify-compliance, assess-risks, validate-audit-trail, check-policy-adherence`))
      console.log(chalk.dim(`   Ready to accept requests from Claude`))
      console.log(chalk.dim(`\n   Press Ctrl+C to stop`))

      const worfServer = new WorfAgentServer()
      await worfServer.start()
      break

    default:
      throw new Error(`Unknown agent: ${agentName}. Available: data, worf, troi, geordi, crusher`)
  }
}

/**
 * Start all available agents
 */
async function startAllAgents(): Promise<void> {
  console.log(chalk.green(`✅ All Crew Agents Started`))
  console.log(chalk.dim(`   Agents: Data, Worf, Troi, Geordi, Crusher`))
  console.log(chalk.dim(`   Status: Data and Worf ready, others coming soon`))
  console.log(chalk.dim(`\n   Press Ctrl+C to stop all agents`))

  const dataServer = new DataAgentServer()
  const worfServer = new WorfAgentServer()

  await Promise.all([dataServer.start(), worfServer.start()])
}
