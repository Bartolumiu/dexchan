<br/>
<p align="center">
  <a href="https://github.com/Bartolumiu/dexchan">
    <img src="https://cdn.discordapp.com/avatars/794309204592033821/b1c4eda0575cd423a3f115c75c66f722.webp?size=4096" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Dex-chan</h3>

  <p align="center">
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
</p>

<p align="center">
  <img src="https://img.shields.io/github/contributors/Bartolumiu/dexchan?color=dark-green"/>
  <img src="https://img.shields.io/github/issues/Bartolumiu/dexchan"/>
  <img src="https://img.shields.io/github/license/Bartolumiu/dexchan"/>
  <a href="https://www.codefactor.io/repository/github/Bartolumiu/dexchan/overview/main">
    <img src="https://www.codefactor.io/repository/github/Bartolumiu/dexchan/badge/main"/>
  </a>
  <img src="https://img.shields.io/github/stars/Bartolumiu/dexchan?style=social"/>
  <img src="https://img.shields.io/github/forks/Bartolumiu/dexchan?style=social"/>
</p>

<p align="center">
  <a href="https://weblate.tr25.es/engage/dexchan/">
    <img src="https://weblate.tr25.es/widget/dexchan/discord-bot/287x66-black.png" alt="Translation status" />
  </a>
  <a href="https://weblate.tr25.es/engage/dexchan/">
    <img src="https://weblate.tr25.es/widget/dexchan/discord-bot/multi-auto.svg" alt="Translation status" />
  </a>
</p>


## Table Of Contents

* [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Authors](#authors)

## Built With



* [Node.JS](https://nodejs.org)
* [Discord.JS](https://discord.js.org)

## Getting Started

To get a local copy of the bot up and running follow these steps.

### Prerequisites

* Package Manager (choose one, but recommended to use either npm or pnpm)

  * npm
  ```sh
  npm install -g npm@latest
  ```

  * pnpm (via npm)
  ```sh
  npm install -g pnpm
  ```

  * pnpm (via corepack)
  ```sh
  corepack enable pnpm
  ```

* MongoDB (for storing data)
  * [MongoDB Atlas](https://www.mongodb.com/atlas/database) (recommended)
  * [Self-hosted MongoDB](https://www.mongodb.com/docs/manual/installation/)

* pm2 (optional)
```sh
npm install pm2 -g
```
or
```sh
pnpm add -g pm2
```

### Installation

1. Clone the repo

```sh
git clone https://github.com/Bartolumiu/dexchan.git
```

2. Install NPM packages

```sh
npm install
```

3. Rename `.env.template` to `.env` and enter the following:

```env
token=ULTRA_SECRET_BOT_TOKEN
dbToken=mongodbtoken
clientID=0123456789011121314
```

4. Start the bot

To start the bot, there are 4 different methods

* Node:
```sh
node src/index.js
```

* npm command
```sh
npm run start
```
* pnpm command
```sh
pnpm start
```

* pm2 (recommended)
```sh
pm2 start src/index.js
```

## Roadmap

See the [open issues](https://github.com/Bartolumiu/dexchan/issues) for a list of proposed features (and known issues).

## Contributing

### Code Contributions
Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.
* If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/Bartolumiu/dexchan/issues/new) to discuss it, or directly create a pull request after you edit the *README.md* file with necessary changes.
* Please make sure you check your spelling and grammar.
* Create individual PR for each suggestion.

### Translation Contributions
If you want to help translate the bot, you can do so by visiting [Weblate](https://weblate.tr25.es/engage/dexchan/). You can translate the bot into any language you want, and it will be automatically updated in the bot once the translated strings are approved.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch based on `develop` (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the Apache License 2.0. See [LICENSE](https://github.com/Bartolumiu/dexchan/blob/main/LICENSE) for more information.

## Authors

* [Bartolumiu](https://github.com/Bartolumiu/)
