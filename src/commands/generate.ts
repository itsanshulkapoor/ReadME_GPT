import chalk from 'chalk';
import ora from 'ora';
import { GitHubService } from '../utils/github.js';
import { AIService } from '../utils/ai.js';
import { FileWriter } from '../utils/fileWriter.js';

type GenerateOptions = {
    output: string;
    aiModel: string;
};

function parseGitHubUrl(url: string): { owner: string; repo: string } {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(regex);

    if (!match || !match[1] || !match[2]) {
        throw new Error(
            'Invalid GitHub URL format. Expected: https://github.com/owner/repo'
        );
    }

    return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
    };
}

export async function generateCommand(
    repoUrl: string,
    options: GenerateOptions
) {
    console.log(chalk.blue('🚀 Starting README generation...'));

    const spinner = ora('Analyzing repository...').start();

    try {
        // Parse GitHub URL
        const { owner, repo } = parseGitHubUrl(repoUrl);

        // Initialize services
        const githubService = new GitHubService();
        const aiService = new AIService(options.aiModel);
        const fileWriter = new FileWriter();

        // Fetch repository data
        spinner.text = 'Fetching repository information...';
        const repoData = await githubService.getRepositoryData(owner, repo);

        // Generate README content
        spinner.text = 'Generating README content with AI...';
        const readmeContent = await aiService.generateReadme(repoData);

        // Write README file
        spinner.text = 'Writing README file...';
        await fileWriter.writeFile(options.output, readmeContent);

        spinner.succeed(
            chalk.green(`✅ README generated successfully at ${options.output}`)
        );
    } catch (error) {
        spinner.fail(chalk.red('❌ Failed to generate README'));
        console.error(
            chalk.red(
                `Error: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            )
        );
        process.exit(1);
    }
}
