import { Octokit } from '@octokit/rest';

export interface RepositoryData {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    license: string | null;
    topics: string[];
    hasPackageJson?: boolean;
    packageJsonContent?: any;
    filesStructure: string[];
    recentCommits: string[];
}

export class GitHubService {
    private octokit: Octokit;

    constructor(token?: string) {
        const authToken = token || process.env.GITHUB_TOKEN;
        if (!authToken) {
            console.warn(
                'No GitHub token provided. API rate limits will be lower for unauthenticated requests.'
            );
        }

        this.octokit = new Octokit({
            auth: authToken,
        });
    }

    async getRepositoryData(
        owner: string,
        repo: string
    ): Promise<RepositoryData> {
        try {
            // Get basic repository information
            const { data: repoInfo } = await this.octokit.rest.repos.get({
                owner,
                repo,
            });

            // Get repository contents
            const { data: contents } = await this.octokit.rest.repos.getContent(
                {
                    owner,
                    repo,
                    path: '',
                }
            );

            // Filter out files or folders mentioned in .gitignore
            const filteredContents = await this.filterByGitIgnore(
                owner,
                repo,
                contents
            );

            // Get recent commits
            const { data: commits } = await this.octokit.rest.repos.listCommits(
                {
                    owner,
                    repo,
                    per_page: 5,
                }
            );

            const filesStructure = Array.isArray(contents)
                ? contents.map((item) => item.name)
                : [];

            return {
                name: repoInfo.name,
                description: repoInfo.description || '',
                language: repoInfo.language || 'Unknown',
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count,
                license: repoInfo.license?.name || null,
                topics: repoInfo.topics || [],
                filesStructure,
                recentCommits: commits.map((commit) => commit.commit.message),
            };
        } catch (error) {
            throw new Error(
                `Failed to fetch repository data: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    private async filterByGitIgnore(
        owner: string,
        repo: string,
        contents: any
    ): Promise<any[]> {
        // Early return if contents is not an array
        if (!Array.isArray(contents)) {
            return [];
        }

        const gitIgnoreFile = contents.find(
            (file) => file.name === '.gitignore'
        );

        // Early return if no .gitignore file found
        if (!gitIgnoreFile) {
            return contents;
        }

        try {
            const gitIgnoreContent = await this.fetchGitIgnoreContent(
                owner,
                repo
            );

            // Early return if no content found
            if (!gitIgnoreContent) {
                return contents;
            }

            const gitIgnoreLines = this.parseGitIgnoreLines(gitIgnoreContent);
            const validContents = this.filterContentsByGitIgnore(
                contents,
                gitIgnoreLines
            );

            console.log('\n\nValidContents\n\n', validContents);
            return validContents;
        } catch (error) {
            console.error('Failed to fetch .gitignore content');
            return contents; // Return original contents on error
        }
    }

    private async fetchGitIgnoreContent(
        owner: string,
        repo: string
    ): Promise<string | null> {
        const { data: gitIgnoreData } =
            await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path: '.gitignore',
            });

        // Guard clause: return null if no content
        if (!('content' in gitIgnoreData)) {
            return null;
        }

        return Buffer.from(gitIgnoreData.content, 'base64').toString();
    }

    private parseGitIgnoreLines(gitIgnoreContent: string): string[] {
        return gitIgnoreContent
            .split('\n')
            .filter((item) => item.trim() !== '')
            .filter((item) => !item.startsWith('#'));
    }

    private filterContentsByGitIgnore(
        contents: any[],
        gitIgnoreLines: string[]
    ): any[] {
        return contents.filter((file) => {
            if (file.type === 'dir' && !file.name.startsWith('.')) {
                return !gitIgnoreLines.includes(`/${file.name}`);
            }
            return !gitIgnoreLines.includes(file.name);
        });
    }
}
