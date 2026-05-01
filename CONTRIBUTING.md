# Contributing to OpenVision AI

Thank you for your interest in contributing to OpenVision AI!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/animvsh/secureos.git
   cd openvision-ai
   ```

2. **Install dependencies**
   ```bash
   # Frontend (apps/dashboard)
   cd apps/dashboard
   npm install

   # Backend (services/api)
   cd services/api
   pip install -r requirements.txt
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env
   # Configure your AWS credentials and database connection
   ```

4. **Run locally**
   ```bash
   # Frontend
   cd apps/dashboard
   npm run dev

   # Backend (Lambda)
   cd services/api
   python handler.py
   ```

## Code Style

- **TypeScript**: Use ESLint and Prettier with the project's config
- **Python**: Follow PEP 8, use type hints, max line length 100
- **Commits**: Follow conventional commits format (feat, fix, refactor, etc.)

## Testing Requirements

- **Minimum test coverage: 80%**
- All new features must include unit tests
- Integration tests required for API endpoints
- E2E tests required for critical user flows

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests first (TDD approach)
3. Ensure all tests pass and coverage meets 80%+
4. Update documentation if needed
5. Request code review
6. Squash and merge after approval

## Code of Conduct

Please be respectful and professional in all interactions.
