import OpenAI from 'openai';
import { RepositoryData } from './github.js';

export class AIService {
    private openai: OpenAI;
    private model: string;

    constructor(model: string = 'gpt-3.5-turbo') {
        this.model = model;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateReadme(repoData: RepositoryData): Promise<string> {
        const prompt = this.buildPrompt(repoData);

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert technical writer specializing in creating comprehensive, well-structured README files for GitHub repositories. Generate README content that follows best practices and includes all essential sections.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 2000,
                temperature: 0.7,
            });

            return (
                response.choices[0]?.message?.content ||
                'Failed to generate README content'
            );
        } catch (error) {
            throw new Error(
                `Failed to generate README with AI: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    private buildPrompt(repoData: RepositoryData): string {
        return `
Create a comprehensive README.md file for a GitHub repository with the following information:

**Repository Details:**
- Name: ${repoData.name}
- Description: ${repoData.description}
- Primary Language: ${repoData.language}
- Stars: ${repoData.stars}
- Forks: ${repoData.forks}
- License: ${repoData.license || 'Not specified'}
- Topics: ${repoData.topics.join(', ') || 'None'}

**Project Structure:**
Files in root directory: ${repoData.filesStructure.join(', ')}

**Package Information:**
${
    repoData.hasPackageJson
        ? `
- Has package.json: Yes
- Package name: ${repoData.packageJsonContent?.name || 'N/A'}
- Dependencies: ${
              repoData.packageJsonContent?.dependencies
                  ? Object.keys(repoData.packageJsonContent.dependencies).join(
                        ', '
                    )
                  : 'None listed'
          }
- Scripts: ${
              repoData.packageJsonContent?.scripts
                  ? Object.keys(repoData.packageJsonContent.scripts).join(', ')
                  : 'None listed'
          }
`
        : '- Has package.json: No'
}

**Recent Activity:**
Recent commit messages:
${repoData.recentCommits.map((commit) => `- ${commit}`).join('\n')}

Please generate a professional README.md that includes:
1. Project title and description
2. Installation instructions (appropriate for ${repoData.language})
3. Usage examples
4. Features section
5. Contributing guidelines
6. License information
7. Any other relevant sections based on the project type

Make sure the README is engaging, informative, and follows GitHub README best practices. Use proper markdown formatting with appropriate headers, code blocks, and badges where applicable.
    `.trim();
    }
}
