# Contributing to Jornify

Thank you for considering contributing to Jornify! We welcome contributions from the community.

## Branching

This project uses a simple branching model:

| Type    | Pattern          | Example                  |
| ------- | ---------------- | ------------------------ |
| Main    | `main`           | Production code          |
| Feature | `feature/<name>` | `feature/add-export`     |
| Hotfix  | `hotfix/<name>`  | `hotfix/fix-date-filter` |

### Workflow

1. Create a branch from `main`:

   ```sh
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit using conventional format.

3. Push and create a Pull Request to `main`.

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]
```

### Types

| Type       | Description             |
| ---------- | ----------------------- |
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `docs`     | Documentation only      |
| `style`    | Code style (formatting) |
| `refactor` | Code refactoring        |
| `perf`     | Performance improvement |
| `test`     | Adding/fixing tests     |
| `build`    | Build system changes    |
| `ci`       | CI configuration        |
| `chore`    | Maintenance tasks       |
| `revert`   | Revert previous commit  |

### Examples

```bash
feat: add export functionality for work history
fix: resolve date filter bug
docs: update API documentation
refactor: extract validation logic
```

Commits are validated automatically. Invalid commits will be rejected.

## How to Contribute

1. **Fork the repository**: Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**:

   ```sh
   git clone https://github.com/your-username/jornify-app.git
   cd jornify-app
   ```

3. **Install dependencies**:

   ```sh
   pnpm install
   cp .env.example .env.local
   ```

4. **Create a feature branch**:

   ```sh
   git checkout -b feature/my-feature
   ```

5. **Make your changes**: Follow the coding guidelines in [CLAUDE.md](CLAUDE.md).

6. **Run tests and lint**:

   ```sh
   pnpm test
   pnpm lint
   pnpm build
   ```

7. **Commit using conventional format**:

   ```sh
   git add .
   git commit -m "feat: description of changes"
   ```

8. **Push to your fork**:

   ```sh
   git push origin feature/my-feature
   ```

9. **Create a Pull Request**: Target the `main` branch.

## Pull Request Guidelines

- All status checks must pass (lint, test, build)
- Keep PRs focused on a single feature/fix
- Update documentation if needed
- Add tests for new features

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Reporting Issues

If you find a bug or have a feature request, please create an issue on GitHub with:

- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior

Thank you for your contributions!
