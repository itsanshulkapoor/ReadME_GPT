export function getBasicTemplate(
    projectName: string,
    description: string
): string {
    return `# ${projectName}

${description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
`;
}
