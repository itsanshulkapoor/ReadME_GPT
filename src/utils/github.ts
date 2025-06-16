import { Octokit } from '@octokit/rest';

export interface RepositoryData {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    license: string | null;
    topics: string[];
    hasPackageJson: boolean;
    packageJsonContent?: any;
    filesStructure: string[];
    recentCommits: string[];
}

export class GitHubService {
    private octokit: Octokit;

    constructor(token?: string) {
        this.octokit = new Octokit({
            auth: token || process.env.GITHUB_TOKEN,
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

            // Check for package.json
            let hasPackageJson = false;
            let packageJsonContent;

            if (Array.isArray(contents)) {
                const packageJsonFile = contents.find(
                    (file) => file.name === 'package.json'
                );
                if (packageJsonFile) {
                    hasPackageJson = true;
                    try {
                        const { data: packageData } =
                            await this.octokit.rest.repos.getContent({
                                owner,
                                repo,
                                path: 'package.json',
                            });
                        if ('content' in packageData) {
                            const content = Buffer.from(
                                packageData.content,
                                'base64'
                            ).toString();
                            packageJsonContent = JSON.parse(content);
                        }
                    } catch (error) {
                        console.warn('Failed to fetch package.json content');
                    }
                }
            }

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
                hasPackageJson,
                packageJsonContent,
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
}
