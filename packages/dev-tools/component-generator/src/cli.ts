#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { generateComponent } from './generator.js';
import { validateGenerateOptions } from './validators.js';
import type { GenerateOptions, ComponentType, GeneratedFile } from './types.js';

interface CliOptions {
  type: string;
  variants?: string;
  sizes?: string;
  props?: string;
  interactive?: boolean;
  dryRun?: boolean;
  outputDir?: string;
}

const program = new Command();

program
  .name('generate-component')
  .description('Generate React components for the design system')
  .version('0.1.0');

program
  .argument('<name>', 'Component name (PascalCase)')
  .option('-t, --type <type>', 'Component type (form|display|layout|utility)', 'display')
  .option('-v, --variants <variants>', 'Comma-separated list of variants')
  .option('-s, --sizes <sizes>', 'Comma-separated list of sizes')
  .option('-p, --props <props>', 'Comma-separated list of custom props')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .option('-d, --dry-run', 'Preview generated files without writing them')
  .option('-o, --output-dir <dir>', 'Output directory (relative to project root)')
  .action(async (name: string, options: CliOptions) => {
    try {
      let generateOptions: GenerateOptions = {
        name,
        type: options.type as ComponentType,
        variants: options.variants ? options.variants.split(',').map((v: string) => v.trim()) : undefined,
        sizes: options.sizes ? options.sizes.split(',').map((s: string) => s.trim()) : undefined,
        props: options.props ? options.props.split(',').map((p: string) => p.trim()) : undefined,
        interactive: options.interactive,
        dryRun: options.dryRun,
        outputDir: options.outputDir
      };

      // Interactive mode
      if (options.interactive) {
        generateOptions = await runInteractiveMode(generateOptions);
      }

      // Validate options
      const validation = validateGenerateOptions(generateOptions);
      if (!validation.valid) {
        console.error(chalk.red('❌ Validation errors:'));
        validation.errors.forEach(error => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      // Show what we're generating
      console.log(chalk.blue('🚀 Generating component with the following configuration:'));
      console.log(chalk.gray(`  Name: ${generateOptions.name}`));
      console.log(chalk.gray(`  Type: ${generateOptions.type}`));
      if (generateOptions.variants?.length) {
        console.log(chalk.gray(`  Variants: ${generateOptions.variants.join(', ')}`));
      }
      if (generateOptions.sizes?.length) {
        console.log(chalk.gray(`  Sizes: ${generateOptions.sizes.join(', ')}`));
      }
      if (generateOptions.props?.length) {
        console.log(chalk.gray(`  Props: ${generateOptions.props.join(', ')}`));
      }
      if (generateOptions.dryRun) {
        console.log(chalk.yellow('  Mode: Dry run (preview only)'));
      }
      console.log();

      // Generate component
      const spinner = ora('Generating component files...').start();
      
      try {
        const result = await generateComponent(generateOptions);
        
        if (result.success) {
          spinner.succeed(chalk.green('✅ Component generated successfully!'));
          
          console.log(chalk.blue('\n📁 Generated files:'));
          result.files.forEach((file: GeneratedFile) => {
            const icon = getFileIcon(file.type);
            console.log(chalk.gray(`  ${icon} ${file.path}`));
          });

          if (result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            result.warnings.forEach((warning: string) => {
              console.log(chalk.yellow(`  • ${warning}`));
            });
          }

          if (!generateOptions.dryRun) {
            console.log(chalk.green('\n🎉 Your component is ready to use!'));
            console.log(chalk.gray('Next steps:'));
            console.log(chalk.gray('  1. Review the generated files'));
            console.log(chalk.gray('  2. Customize the component implementation'));
            console.log(chalk.gray('  3. Run tests: pnpm test'));
            console.log(chalk.gray('  4. View in Storybook: pnpm storybook'));
          } else {
            console.log(chalk.blue('\n👀 This was a dry run. Use without --dry-run to create the files.'));
          }
        } else {
          spinner.fail(chalk.red('❌ Component generation failed'));
          
          console.error(chalk.red('\nErrors:'));
          result.errors.forEach((error: string) => {
            console.error(chalk.red(`  • ${error}`));
          });
          
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(chalk.red('❌ Component generation failed'));
        console.error(chalk.red(`\nUnexpected error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ CLI error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

async function runInteractiveMode(initialOptions: GenerateOptions): Promise<GenerateOptions> {
  console.log(chalk.blue('🎯 Interactive Component Generator'));
  console.log(chalk.gray('Answer the following questions to configure your component:\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Component name (PascalCase):',
      default: initialOptions.name,
      validate: (input: string) => {
        if (!input.trim()) return 'Component name is required';
        if (!/^[A-Z]/.test(input)) return 'Component name must start with uppercase letter';
        return true;
      }
    },
    {
      type: 'list',
      name: 'type',
      message: 'Component type:',
      choices: [
        { name: 'Display - Visual components (buttons, badges, avatars)', value: 'display' },
        { name: 'Form - Input components (select, checkbox, textarea)', value: 'form' },
        { name: 'Layout - Structural components (containers, grids)', value: 'layout' },
        { name: 'Utility - Helper components (tooltips, modals)', value: 'utility' }
      ],
      default: initialOptions.type || 'display'
    },
    {
      type: 'input',
      name: 'variants',
      message: 'Variants (comma-separated, e.g., primary,secondary,danger):',
      default: initialOptions.variants?.join(',') || '',
      filter: (input: string) => input ? input.split(',').map(v => v.trim()).filter(Boolean) : []
    },
    {
      type: 'input',
      name: 'sizes',
      message: 'Sizes (comma-separated, e.g., sm,md,lg):',
      default: initialOptions.sizes?.join(',') || '',
      filter: (input: string) => input ? input.split(',').map(s => s.trim()).filter(Boolean) : []
    },
    {
      type: 'input',
      name: 'props',
      message: 'Custom props (comma-separated, e.g., placeholder,disabled):',
      default: initialOptions.props?.join(',') || '',
      filter: (input: string) => input ? input.split(',').map(p => p.trim()).filter(Boolean) : []
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Dry run (preview without creating files)?',
      default: initialOptions.dryRun || false
    }
  ]);

  return {
    ...initialOptions,
    ...answers,
    interactive: true
  };
}

function getFileIcon(type: string): string {
  switch (type) {
    case 'component': return '⚛️';
    case 'stories': return '📚';
    case 'test': return '🧪';
    case 'styles': return '🎨';
    case 'export': return '📦';
    default: return '📄';
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught exception:'), error);
  process.exit(1);
});

program.parse();
