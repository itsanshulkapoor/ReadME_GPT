# ReadME_GPT
AI-powered README generator

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- OpenAI API key
- GitHub personal access token (optional, but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ReadME_GPT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your API keys:
   - Get OpenAI API key: https://platform.openai.com/account/api-keys
   - Get GitHub token: https://github.com/settings/tokens (with `repo` and `read:user` scopes)

4. **Build the project**
   ```bash
   npm run build
   ```

### Usage

Generate a README for any GitHub repository:

```bash
npm start generate https://github.com/user/repository
```

Or for development:

```bash
npm run dev generate https://github.com/user/repository
```

## 🔧 Configuration

All configuration is done through environment variables in the `.env` file:

- `OPENAI_API_KEY` - Required: Your OpenAI API key
- `GITHUB_TOKEN` - Optional: GitHub personal access token for higher rate limits
- `DEFAULT_AI_MODEL` - Optional: AI model to use (default: gpt-3.5-turbo)

## 📝 License

MIT License - see LICENSE file for details.
