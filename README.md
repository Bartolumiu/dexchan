<br/>
<div style="text-align: center;">
  <a href="https://github.com/Bartolumiu/dexchan">
    <img src="https://cdn.discordapp.com/avatars/794309204592033821/b1c4eda0575cd423a3f115c75c66f722.webp?size=4096" alt="Logo" width="80" height="80">
  </a>

  <h3 style="text-align: center;">Dex-chan</h3>

  <p style="text-align: center;">
    Base code for the "Dex-chan" Discord bot
    <br/>
    <br/>
    <a href="https://github.com/Bartolumiu/dexchan"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://discord.com/application-directory/810942628152868905">Add the bot</a>
    ·
    <a href="https://github.com/Bartolumiu/dexchan/issues">Report Bug</a>
    ·
    <a href="https://github.com/Bartolumiu/dexchan/issues">Request Feature</a>
    ·
    <a href="https://weblate.tr25.es/engage/dexchan/">Translate Dex-chan</a>
  </p>
</div>

<div style="text-align: center;">
  <img src="https://img.shields.io/github/contributors/Bartolumiu/dexchan?color=dark-green" alt="Contributors"/>
  <img src="https://img.shields.io/github/issues/Bartolumiu/dexchan" alt="Open Issues"/>
  <img src="https://img.shields.io/github/license/Bartolumiu/dexchan" alt="Project License"/>
  <a href="https://www.codefactor.io/repository/github/Bartolumiu/dexchan/overview/main">
    <img src="https://www.codefactor.io/repository/github/Bartolumiu/dexchan/badge/main" alt="CodeFactor"/>
  </a>
  <img src="https://img.shields.io/github/stars/Bartolumiu/dexchan?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/Bartolumiu/dexchan?style=social" alt="Forks"/>
</div>

<div style="text-align: center;">
  <a href="https://weblate.tr25.es/engage/dexchan/">
    <img src="https://weblate.tr25.es/widget/dexchan/discord-bot/287x66-black.png" alt="Translation status" />
  </a>
  <a href="https://weblate.tr25.es/engage/dexchan/">
    <img src="https://weblate.tr25.es/widget/dexchan/discord-bot/multi-auto.svg" alt="Translation status" />
  </a>
</div>

## Table Of Contents

- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Docker Installation (Recommended)](#docker-installation-recommended)
  - [Manual Installation](#manual-installation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)

## Built With

- [Node.JS](https://nodejs.org)
- [TypeScript](https://typescriptlang.org)
- [Discord.JS](https://discord.js.org)
- [Prisma](https://prisma.io)
- [PostgreSQL](https://postgresql.org)
- [Docker](https://docker.com)

## Getting Started

To get a local copy of the bot up and running, follow these steps.

### Docker Installation (Recommended)

The easiest way to get the bot running along with its database is by using the standalone Docker Compose configuration.

1. Clone the repo:

```shell
git clone https://github.com/Bartolumiu/dexchan.git
cd dexchan
```

2. Rename `.env.template` to `.env` and configure your Discord bot credentials (the database connection is handled automatically by Docker):

```
DEXCHAN_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_CLIENT_ID
POSTGRES_USER=POSTGRES_DB_USER
POSTGRES_PASSWORD=POSTGRES_DB_PASSWORD
POSTGRES_DB=POSTGRES_DB
```

3. Start the stack:

```shell
docker compose -f docker-compose.standalone.yml up -d
```

_This spins up the bot, a PostgreSQL instance, pushes the Prisma schema, and seeds the initial database value automatically._

### Manual Installation

#### Prerequisites

- **Package Manager**: Only `pnpm` is allowed. Any other package manager will display an error message and exit the process.

  ```shell
  corepack enable pnpm
  ```

- **Database**: A running PostgreSQL database instance.

#### Installation

1. Clone the repo

```shell
git clone https://github.com/Bartolumiu/dexchan.git
cd dexchan
```

2. Install dependencies

```sh
pnpm install --frozen-lockfile
```

3. Rename `.env.template` to `.env` and fill in your connection details:

```env
DEXCHAN_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DATABASE_URL=YOUR_DATABASE_URL

# Optional: Routes global commands to a specific server for instant dev testing
TEST_GUILD_ID=YOUR_TEST_SERVER_ID

# Optional: Required only for project admins with write access to sync translations
WEBLATE_TOKEN=YOUR_WEBLATE_API_TOKEN
```

4. Start the bot

```shell
pnpm start
```

_This automatically syncs your database schema, runs the seed script, and boots the bot via `tsx`._

If you want to run the bot in development mode (without automatically syncing the database schema):

```shell
pnpm dev
```

## Roadmap

See the [open issues](https://github.com/Bartolumiu/dexchan/issues) for a list of proposed features (and known issues).

## Contributing

### Code Contributions

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read the [Contributing Guidelines](CONTRIBUTING.md) for details on our code style, architecture rules, and the process for submitting pull requests.

We also expect all contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and includive environment for everyone.

If you want to help translate the bot, you can do so by visiting [Weblate](https://weblate.tr25.es/engage/dexchan/).

## License

Distributed under the GPL-3.0 Licence. See [LICENSE](LICENSE) for more information.

## Authors

- [Bartolumiu](https://github.com/Bartolumiu/)
