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

            //filter out files or folders mentioned in .gitignore
            if (Array.isArray(contents)) {
                const maybeGitIgnore = contents.find(
                    (file) => file.name === '.gitignore'
                );
                if (maybeGitIgnore) {
                    try {
                        const { data: gitIgnoreData } =
                            await this.octokit.rest.repos.getContent({
                                owner,
                                repo,
                                path: '.gitignore',
                            });
                        if ('content' in gitIgnoreData) {
                            const gitIgnoreContent = Buffer.from(
                                gitIgnoreData.content,
                                'base64'
                            ).toString();

                            //split the gitIgnoreContent into lines
                            const gitIgnoreLines = gitIgnoreContent
                                .split('\n')
                                .filter((item) => item.trim() !== '')
                                .filter((item) => !item.startsWith('#'));
                            console.log(
                                '\n\ngitIgnoreLines\n\n',
                                gitIgnoreLines
                            );
                            //filter out the files or folders mentioned in .gitignore
                            const validContents = contents.filter((file) => {
                                if (
                                    file.type === 'dir' &&
                                    !file.name.startsWith('.')
                                ) {
                                    return !gitIgnoreLines.includes(
                                        `/${file.name}`
                                    );
                                }
                                return !gitIgnoreLines.includes(file.name);
                            });
                            console.log('\n\nValidContents\n\n', validContents);
                        }
                    } catch (error) {
                        console.warn('Failed to fetch .gitignore content');
                    }
                }
            }

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
                            // Decode base64 content from GitHub API response to readable string
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

            const responseData = {
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
            // console.log('\n\nresponseData');
            return responseData;
        } catch (error) {
            throw new Error(
                `Failed to fetch repository data: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }
}
