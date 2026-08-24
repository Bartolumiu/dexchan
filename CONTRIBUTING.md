# Contributing to Dex-chan

First off, thank you for considering contributing to Dex-chan! It's people like you that make this bot a great tool for everyone.

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## Ways to Contribute

### Code Contributions

- If you have suggestions for adding or removing features, feel free to [open an issue](https://github.com/Bartolumiu/dexchan/issues/new) to discuss it or directly create a pull request.
- Please make sure you check your spelling and grammar.
- Create individual PRs for each suggestion.

### Translation Contributions

If you want to help translate the bot, you can do so by visiting [Weblate](https://weblate.tr25.es/engage/dexchan/).
You can translate the bot into any language you want, and it will be automatically updated in the bot once the translated strings are approved and synced.

**For Project Maintainers:**
To sync translations between the codebase and Weblate, you must have write access to the Weblate project. Add your Personal API Token to your `.env` file (`WEBLATE_TOKEN=your_token`).

_(Note: Standard code contributors do not need to use these commands)_

Once authenticated, maintainers can use the following package scripts:

- `pnpm i18n:pull`: Downloads the latest translations from Weblate, cleans empty strings, and compiles them into heavily-typed TypeScript files.
- `pnpm i18n:push`: Extracts the base English TypeScript strings to JSON and pushes them to Weblate to update the source keys.

## Creating a Pull Request

1. Fork the Project
2. Create your Feature Branch based on `develop` (`git checkout -b feat/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat(module): add some amazing feature'`) - _See Commit Conventions below_
4. Push to the Branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## Development Guidelines

To maintain codebase health and consistency, all contributors must adhere to the following architecture and styling rules.

### 1. Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Commit messages should be lowercase and clearly state the intent of the changes.

| Type       | Purpose                                               | Example                                   |
| ---------- | ----------------------------------------------------- | ----------------------------------------- |
| `feat`     | A new feature or command                              | `feat(search): add pagination to results` |
| `fix`      | A bug fix                                             | `fix(button): fix button colour`          |
| `chore`    | Maintenance, dependencies, or configuration           | `chore(core). rewrite core`               |
| `refactor` | Code changes that neither fix a bug nor add a feature | `refactor(db): optimise prisma queries`   |
| `docs`     | Documentation updates (README, comments)              | `docs(readme): add docker instructions`   |
| `style`    | Formatting, missing semi-colons, etc.                 | `style(format): run prettier`             |

### 2. Branch Naming

Branch names should mirror the commit types and use `kebab-case` for the description.

- **Feature:** `feat/add-search-filters`
- **Bugfix:** `fix/presence-crash`
- **Maintenance:** `chore/update-dependencies`
- **Documentation:** `docs/update-readme`
- **Refactor:** `refactor/remove-unused-code`
- **Style:** `style/format-code`

### 3. Code Style & TypeScript Rules

Before submitting any code, you must run the formatters and checkers:

```shell
pnpm format
pnpm check:references
pnpm check:dependencies
```

- **Strict Typing:** Avoid `any`. Use custom interfaces, Prisma-generated types, or standard Discord.js types (e.g. `ChatInputCommandInteraction`).
- **Early Returns:** Avoid deep nesting (the "arrow code" antipattern). Check for errors or invalid states early and return immediately.
- **Await/Async:** Always use `async/await` over raw `.then()` chains.
- **Imports:** Group external module imports (e.g. `discord.js`) at the top, followed by internal absolute/relative imports.
- **Comments:** Use JSDoc comments for types and functions.

### 4. Naming Conventions

- **Variables & Functions:** `camelCase` (e.g. `fetchUserData`, `guildSettings`).
- **Classes, Types & Interfaces:** `PascalCase` (e.g. `CommandOptions`, `PresenceManager`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g. `MAX_EMBED_FIELDS`, `CACHE_TTL`).

### 5. File & Architecture Structure

File naming depends on the module's role in the bot.

| Directory / Role  | File Naming Convention | Example                | Description                                           |
| ----------------- | ---------------------- | ---------------------- | ----------------------------------------------------- |
| Commands          | `snake_case.ts`        | `title_stats.ts`       | Slash command definitions and execution logic.        |
| Events            | `camelCase.ts`         | `interactionCreate.ts` | Discord.js client event listeners.                    |
| Components        | `snake_case.ts`        | `search_select.ts`     | Buttons, select menus, and modals.                    |
| Utils / Functions | `camelCase.ts`         | `pickPresence.ts`      | Shared utilities, API fetchers, and helper functions. |

### 6. Database Operations

- **Prisma Client:** Never instantiate a new `PrismaClient` locally in a file. Always import the shared global singleton from `src/utils/prisma.ts` to prevent connection pool exhaustion.
- **Migrations:** Never manually modify the database schema via raw SQL. Update `prisma/schema.prisma` and run `pnpm db:migrate` (or `pnpm db:push` for local development).
