# DEL LGBT Website version 1.x.x

![Compile](https://github.com/discordextremelist/lgbt-website/workflows/Compile/badge.svg)
[![DeepScan grade](https://deepscan.io/api/teams/8370/projects/12889/branches/206397/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8370&pid=12889&bid=206397)
![Snyk vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/discordextremelist/lgbt-website)
[![Code style](https://img.shields.io/badge/code%20style-prettier-ff69b4)](https://github.com/prettier/prettier)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdiscordextremelist%2Flgbt-website.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fdiscordextremelist%2Flgbt-website?ref=badge_shield)

Licensing information viewable in the [LICENSE](https://github.com/discordextremelist/lgbt-website/blob/master/LICENSE) file.

# Setup

## Requirements

### Node.js

DEL requires Node.js 14.

### nodemon (Optional)

nodemon is optional and allows you to use the `npm run dev` command which is ideal in development, nodemon auto restarts on file save.

### PM2 (Optional)

PM2 is optional and allows you to use the `npm run pm2` command which is ideal if you wish to run DEL in production.

### MongoDB

A MongoDB instance is required - it must match the configuration in the `settings.json` file.

### Redis

Redis must be installed for caching to work, the site will not function correctly without it - it must match the configuration in the `settings.json` file.

### NPM Packages
Install all of the dependencies by running `npm i` command.

## Configuration

1. Rename `settings.example.json` to `settings.json` and fill it out appropriately, changing anything you need to change.
2. (Optional) In addition to this you may wish to change some of the things in the `variables.ts` file located in `src/Util/Function`.

## Running DEL

### Compiling

#### First Start

**NOTE:** Please ensure the main website has been setup and is operational first, this is dependant on that.

When you first start DEL you will need to run the following command: `npm run compile && npm run editor-compile`

#### Making Changes

Every time you make a change to any of the `.ts` files you will need to run the `npm run compile` command to ensure everything is up to date.

### Production

We reccomend when running DEL in production you use the `npm run pm2` command, however you can still run DEL using the standard `npm run start` command.

### Development/Testing

We reccomend you run DEL using the `npm run start` command.


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdiscordextremelist%2Flgbt-website.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fdiscordextremelist%2Flgbt-website?ref=badge_large)