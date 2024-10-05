<br/>
<p align="center">
  <a href="https://github.com/Bartolumiu/dexchan_rework">
    <img src="https://cdn.discordapp.com/avatars/794309204592033821/b1c4eda0575cd423a3f115c75c66f722.webp?size=4096" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Dex-chan (MangaDex ES)</h3>

  <p align="center">
    Base code for the "Dex-chan" Discord bot
    <br/>
    <br/>
    <a href="https://github.com/Bartolumiu/dexchan_rework"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://discord.gg/5MsyHbbvyc">View Demo</a>
    .
    <a href="https://github.com/Bartolumiu/dexchan_rework/issues">Report Bug</a>
    .
    <a href="https://github.com/Bartolumiu/dexchan_rework/issues">Request Feature</a>
  </p>
</p>

![Contributors](https://img.shields.io/github/contributors/Bartolumiu/dexchan_rework?color=dark-green) ![Issues](https://img.shields.io/github/issues/Bartolumiu/dexchan_rework) ![License](https://img.shields.io/github/license/Bartolumiu/dexchan_rework) [![CodeFactor](https://www.codefactor.io/repository/github/Bartolumiu/dexchan_rework/badge/main)](https://www.codefactor.io/repository/github/Bartolumiu/dexchan_rework/overview/main)

## Table Of Contents

* [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Authors](#authors)
* [Acknowledgements](#acknowledgements)

## Built With



* [Node.JS](https://nodejs.org)
* [Discord.JS](https://discord.js.org)

## Getting Started

To get a local copy of the bot up and running follow these steps.

### Prerequisites

* npm

```sh
npm install npm@latest -g
```

* pm2 (optional)
```sh
npm install pm2 -g
```

### Installation

1. Clone the repo

```sh
git clone https://github.com/Bartolumiu/dexchan_rework.git
```

2. Install NPM packages

```sh
npm install
```

2.1 Install PM2 (Optional / Needed for 4.3)

```sh
npm install -g pm2
```

3. Rename `.env.template` to `.env` and enter the following:

```env
token=ULTRA_SECRET_BOT_TOKEN
databaseToken=mongodbtoken
clientId=0123456789011121314
```

4. Start the bot

To start the bot, there are 3 different methods

4.1. Node:
```sh
node src/index.js
```

4.2. npm command
```sh
npm run test
```

4.3. pm2 (recommended)
```sh
pm2 start src/bot.js
```

## Roadmap

See the [open issues](https://github.com/Bartolumiu/dexchan_rework/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.
* If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/Bartolumiu/dexchan_rework/issues/new) to discuss it, or directly create a pull request after you edit the *README.md* file with necessary changes.
* Please make sure you check your spelling and grammar.
* Create individual PR for each suggestion.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the Apache License 2.0. See [LICENSE](https://github.com/Bartolumiu/dexchan_rework/blob/main/LICENSE) for more information.

## Authors

* [Bartolumiu](https://github.com/Bartolumiu/)