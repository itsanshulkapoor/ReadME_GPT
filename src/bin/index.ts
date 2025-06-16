#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { generateCommand } from '../commands/generate.js';

// Set up the CLI program
program
    .name('readme-gpt')
    .description('AI-powered README generator CLI tool')
    .version('1.0.0');

// Add the generate command
program
    .command('generate')
    .description('Generate a README file from a GitHub repository')
    .argument('<repo-url>', 'GitHub repository URL')
    .option('-o, --output <file>', 'Output file path', 'README.md')
    .option('--ai-model <model>', 'AI model to use', 'gpt-3.5-turbo')
    .action(generateCommand);

// Add help command
program
    .command('help')
    .description('Display help information')
    .action(() => {
        console.log(chalk.blue('📚 README-GPT - AI-powered README generator'));
        console.log(chalk.yellow('\nUsage:'));
        console.log('  readme-gpt generate <repo-url> [options]');
        console.log(chalk.yellow('\nExamples:'));
        console.log('  readme-gpt generate https://github.com/user/repo');
        console.log(
            '  readme-gpt generate https://github.com/user/repo --output ./docs/README.md'
        );
        program.help();
    });

// Parse command line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
