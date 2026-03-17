import { Command } from 'commander';
import * as readline from 'readline';
import chalk from 'chalk';
import { ProjectService } from '../services/project-service';

function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(['y', 'yes'].includes(answer.toLowerCase()));
    });
  });
}

export function registerProjectCommands(program: Command) {
  const project = program.command('project')
    .description('Manage projects');

  project.command('new')
    .description('Setup a new project with budget and initial sprint')
    .requiredOption('-n, --name <name>', 'Project name')
    .requiredOption('-b, --budget <amount>', 'Initial budget')
    .requiredOption('--sprint-name <name>', 'Sprint name')
    .requiredOption('--sprint-goal <goal>', 'Sprint goal')
    .option('--sprint-duration <days>', 'Sprint duration in days', '14')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Starting new project setup...`);
        console.log(`---------------------------------`);
        console.log(`  Project Name:    ${options.name}`);
        console.log(`  Budget:          $${options.budget}`);
        console.log(`  Sprint Name:     ${options.sprintName}`);
        console.log(`  Sprint Goal:     '${options.sprintGoal}'`);
        console.log(`  Sprint Duration: ${options.sprintDuration} days`);
        console.log(`---------------------------------\n`);

        console.log(`STEP 1: Creating project '${options.name}'...`);
        const project = await service.createProject(options.name);
        console.log(`✅ Project created. ID: ${project.id}\n`);

        console.log(`STEP 2: Setting budget for '${options.name}' to $${options.budget}...`);
        await service.setBudget(project.id, parseFloat(options.budget));
        console.log(`✅ Budget set.\n`);

        console.log(`STEP 3: Creating sprint '${options.sprintName}'...`);
        const sprint = await service.createSprint(
          project.id,
          options.sprintName,
          options.sprintGoal,
          parseInt(options.sprintDuration, 10)
        );
        console.log(`✅ Sprint created. ID: ${sprint.id}\n`);

        console.log(`🎉 Project setup complete for '${options.name}'.`);
        console.log(`Run 'crew project list' to see your new project.`);
      } catch (error: any) {
        console.error(`❌ Error setting up project: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('list')
    .description('List all projects')
    .option('--archived', 'Show archived projects only')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(options.archived ? '🚀 Fetching archived projects...' : '🚀 Fetching projects...');
        const projects = await service.getProjects(options.archived);

        if (projects.length === 0) {
          console.log(options.archived ? 'No archived projects found.' : 'No projects found.');
          return;
        }

        console.table(projects.map(p => ({
          ID: p.id,
          Name: p.name,
          Status: p.status || 'N/A',
          Budget: p.budget ? `$${p.budget.toFixed(2)}` : 'N/A'
        })));
      } catch (error: any) {
        console.error(`❌ Error fetching projects: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('info <id>')
    .description('Display detailed information about a single project')
    .action(async (id: string) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Fetching project info for ${id}...`);
        const project = await service.getProject(id);

        console.log(chalk.bold.yellow(`\n📁 Project Details`));
        console.log('----------------------------------------');
        console.log(`  ID:          ${project.id}`);
        console.log(`  Name:        ${chalk.bold(project.name)}`);
        console.log(`  Status:      ${project.status || 'N/A'}`);
        console.log(`  Budget:      ${project.budget ? `$${project.budget.toFixed(2)}` : 'N/A'}`);
        console.log(`  Created:     ${new Date(project.created_at).toLocaleString()}`);
        console.log('----------------------------------------\n');
      } catch (error: any) {
        console.error(`\n❌ Error fetching project info: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('update <id>')
    .description('Update project details like name or budget')
    .option('--name <name>', 'New project name')
    .option('--budget <amount>', 'New budget amount')
    .action(async (id: string, options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const updates: { name?: string; budget?: number } = {};
      if (options.name) updates.name = options.name;
      if (options.budget) updates.budget = parseFloat(options.budget);

      if (Object.keys(updates).length === 0) {
        console.error(chalk.red('❌ Error: At least one option (--name or --budget) must be provided.'));
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`\n⚙️  Updating project ${id}...`);
        await service.updateProject(id, updates);
        console.log(chalk.green(`✅ Project with ID '${id}' has been updated.`));

      } catch (error: any) {
        console.error(`\n❌ Error updating project: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('delete <id>')
    .description('Permanently delete a project and all associated data')
    .action(async (id: string) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(chalk.red.bold(`\n🚨 WARNING: You are about to permanently delete project with ID: ${id}.`));
        console.log(chalk.red.bold('This action cannot be undone and will delete all associated sprints, stories, and other data.\n'));

        const confirmed = await askForConfirmation('Are you sure you want to proceed? (y/n) ');

        if (!confirmed) {
          console.log(chalk.blue('\nProject deletion cancelled.'));
          process.exit(0);
        }

        console.log('\n🗑️  Deleting project...');
        await service.deleteProject(id);
        console.log(chalk.green(`✅ Project with ID '${id}' has been deleted.`));

      } catch (error: any) {
        console.error(`\n❌ Error deleting project: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('archive <id>')
    .description('Archive a project by setting its status to "archived"')
    .action(async (id: string) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(chalk.yellow.bold(`\n⚠️  WARNING: You are about to archive project with ID: ${id}.`));
        console.log(chalk.yellow.bold('Archived projects will no longer appear in active lists but can be restored.\n'));

        const confirmed = await askForConfirmation('Are you sure you want to archive this project? (y/n) ');

        if (!confirmed) {
          console.log(chalk.blue('\nProject archiving cancelled.'));
          process.exit(0);
        }

        console.log('\n📦 Archiving project...');
        await service.archiveProject(id);
        console.log(chalk.green(`✅ Project with ID '${id}' has been archived.`));
        console.log(`   You can restore it later using 'crew project restore ${id}' (if implemented).`);

      } catch (error: any) {
        console.error(`\n❌ Error archiving project: ${error.message}`);
        process.exit(1);
      }
    });

  project.command('restore <id>')
    .description('Restore an archived project by setting its status to "active"')
    .action(async (id: string) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`\n🔄 Restoring project...`);
        await service.restoreProject(id);
        console.log(chalk.green(`✅ Project with ID '${id}' has been restored.`));

      } catch (error: any) {
        console.error(`\n❌ Error restoring project: ${error.message}`);
        process.exit(1);
      }
    });

  const sprint = project.command('sprint')
    .description('Manage sprints');

  sprint.command('list <projectId>')
    .description('List all sprints for a specific project')
    .action(async (projectId) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Fetching sprints for project ${projectId}...`);
        const sprints = await service.getSprints(projectId);

        if (sprints.length === 0) {
          console.log(chalk.yellow('No sprints found for this project.'));
          return;
        }

        console.log(chalk.bold.yellow(`\n🏃 Sprints for Project ${projectId}`));
        console.table(sprints.map(s => ({
          ID: s.id,
          Name: s.name,
          Status: s.status,
          Goal: s.goal || 'N/A',
          Start: new Date(s.start_date).toLocaleDateString(),
          End: new Date(s.end_date).toLocaleDateString()
        })));
        console.log('');

      } catch (error: any) {
        console.error(`\n❌ Error fetching sprints: ${error.message}`);
        process.exit(1);
      }
    });

  const story = project.command('story')
    .description('Manage stories');

  story.command('list <sprintId>')
    .description('List all stories in a sprint')
    .action(async (sprintId) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Fetching stories for sprint ${sprintId}...`);
        const stories = await service.getStories(sprintId);

        if (stories.length === 0) {
          console.log(chalk.yellow('No stories found for this sprint.'));
          return;
        }

        console.log(chalk.bold.yellow(`\n📖 Stories for Sprint ${sprintId}`));
        console.table(stories.map(s => ({
          ID: s.id,
          Title: s.title,
          Status: s.status,
          Points: s.story_points || '-',
          Priority: s.priority || '-'
        })));
        console.log('');

      } catch (error: any) {
        console.error(`\n❌ Error fetching stories: ${error.message}`);
        process.exit(1);
      }
    });

  story.command('create')
    .description('Create a new story')
    .requiredOption('--project-id <id>', 'Project ID')
    .requiredOption('--title <title>', 'Story title')
    .requiredOption('--type <type>', 'Story type (user_story, developer_story, bug_fix, technical_task)')
    .requiredOption('--priority <number>', 'Priority (1-5)')
    .option('--sprint-id <id>', 'Sprint ID')
    .option('--description <text>', 'Story description')
    .option('--points <number>', 'Story points')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Creating new story '${options.title}'...`);

        const story = await service.createStory(
          options.projectId,
          options.title,
          options.type,
          parseInt(options.priority, 10),
          options.sprintId,
          options.description,
          options.points ? parseInt(options.points, 10) : undefined
        );

        console.log(chalk.green(`\n✅ Story created successfully!`));
        console.log(`   ID: ${story.id}`);
        console.log(`   Title: ${story.title}`);

      } catch (error: any) {
        console.error(`\n❌ Error creating story: ${error.message}`);
        process.exit(1);
      }
    });

  story.command('update <storyId>')
    .description("Update a story's details, such as status or points")
    .option('--title <title>', 'New story title')
    .option('--description <text>', 'New story description')
    .option('--status <status>', 'New story status (e.g., backlog, in_progress, completed)')
    .option('--priority <number>', 'New priority (1-5)')
    .option('--points <number>', 'New story points')
    .option('--sprint-id <id>', 'Move story to a different sprint')
    .action(async (storyId, options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const updates: {
        title?: string;
        description?: string;
        status?: string;
        priority?: number;
        story_points?: number;
        sprint_id?: string;
      } = {};
      if (options.title) updates.title = options.title;
      if (options.description) updates.description = options.description;
      if (options.status) updates.status = options.status;
      if (options.priority) updates.priority = parseInt(options.priority, 10);
      if (options.points) updates.story_points = parseInt(options.points, 10);
      if (options.sprintId) updates.sprint_id = options.sprintId;

      if (Object.keys(updates).length === 0) {
        console.error(chalk.red('❌ Error: At least one update option must be provided.'));
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Updating story ${storyId}...`);
        await service.updateStory(storyId, updates);
        console.log(chalk.green(`\n✅ Story with ID '${storyId}' has been updated.`));
      } catch (error: any) {
        console.error(`\n❌ Error updating story: ${error.message}`);
        process.exit(1);
      }
    });

  story.command('move <storyId>')
    .description("Move a story to a different sprint (shortcut for 'update --sprint-id')")
    .requiredOption('--sprint <sprintId>', 'The ID of the sprint to move the story to')
    .action(async (storyId, options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Moving story ${storyId} to sprint ${options.sprint}...`);
        await service.updateStory(storyId, { sprint_id: options.sprint });
        console.log(chalk.green(`\n✅ Story '${storyId}' has been moved to sprint '${options.sprint}'.`));
      } catch (error: any) {
        console.error(`\n❌ Error moving story: ${error.message}`);
        process.exit(1);
      }
    });

  sprint.command('create')
    .description('Create a new sprint for an existing project')
    .requiredOption('--project-id <id>', 'The ID of the project to add the sprint to')
    .requiredOption('--name <name>', 'The name of the new sprint')
    .requiredOption('--goal <goal>', 'The primary goal for the sprint')
    .option('--duration <days>', 'Sprint duration in days', '14')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Creating new sprint '${options.name}' for project ${options.projectId}...`);

        const sprint = await service.createSprint(
          options.projectId,
          options.name,
          options.goal,
          parseInt(options.duration, 10)
        );

        console.log(chalk.green(`\n✅ Sprint created successfully!`));
        console.log(`   ID: ${sprint.id}`);
        console.log(`   Name: ${sprint.name}`);

      } catch (error: any) {
        console.error(`\n❌ Error creating sprint: ${error.message}`);
        process.exit(1);
      }
    });

  sprint.command('update <sprintId>')
    .description("Update a sprint's details")
    .option('--name <name>', 'New sprint name')
    .option('--goal <goal>', 'New sprint goal')
    .option('--status <status>', 'New sprint status (e.g., planned, active, completed)')
    .action(async (sprintId, options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const updates: { name?: string; goal?: string; status?: string } = {};
      if (options.name) updates.name = options.name;
      if (options.goal) updates.goal = options.goal;
      if (options.status) updates.status = options.status;

      if (Object.keys(updates).length === 0) {
        console.error(chalk.red('❌ Error: At least one option (--name, --goal, or --status) must be provided.'));
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Updating sprint ${sprintId}...`);
        await service.updateSprint(sprintId, updates);
        console.log(chalk.green(`\n✅ Sprint with ID '${sprintId}' has been updated.`));
      } catch (error: any) {
        console.error(`\n❌ Error updating sprint: ${error.message}`);
        process.exit(1);
      }
    });

  sprint.command('start <sprintId>')
    .description("Start a sprint by setting its status to 'active'")
    .action(async (sprintId) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Starting sprint ${sprintId}...`);
        await service.updateSprint(sprintId, { status: 'active' });
        console.log(chalk.green(`\n✅ Sprint with ID '${sprintId}' is now active.`));
      } catch (error: any) {
        console.error(`\n❌ Error starting sprint: ${error.message}`);
        process.exit(1);
      }
    });

  sprint.command('complete <sprintId>')
    .description("Complete a sprint by setting its status to 'completed'")
    .action(async (sprintId) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
        process.exit(1);
      }

      const service = new ProjectService(supabaseUrl, supabaseKey);

      try {
        console.log(`🚀 Completing sprint ${sprintId}...`);
        await service.updateSprint(sprintId, { status: 'completed' });
        console.log(chalk.green(`\n✅ Sprint with ID '${sprintId}' has been marked as completed.`));
      } catch (error: any) {
        console.error(`\n❌ Error completing sprint: ${error.message}`);
        process.exit(1);
      }
    });
}