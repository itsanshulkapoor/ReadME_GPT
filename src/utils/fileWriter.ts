import { writeFile, access, constants } from 'fs/promises';
import { dirname } from 'path';
import { ensureDir } from 'fs-extra';

export class FileWriter {
    async writeFile(filePath: string, content: string): Promise<void> {
        try {
            // Ensure the directory exists
            const dir = dirname(filePath);
            await ensureDir(dir);

            // Check if file already exists
            const fileExists = await this.fileExists(filePath);

            if (fileExists) {
                // Create backup of existing file
                const backupPath = `${filePath}.backup.${Date.now()}`;
                const existingContent = await this.readFile(filePath);
                await writeFile(backupPath, existingContent);
                console.log(`Existing file backed up to: ${backupPath}`);
            }

            // Write the new content
            await writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(
                `Failed to write file: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    private async readFile(filePath: string): Promise<string> {
        const { readFile } = await import('fs/promises');
        return readFile(filePath, 'utf8');
    }
}
