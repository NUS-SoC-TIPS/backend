<!-- markdownlint-disable MD033 MD041 -->
<p align="center"><img src="cover.png" width="80%"/></p>

<h1 align="center">Backend for TIPS</h1>

## Overview

TIPS is a monolithic rewrite of Code2Gather to support the technical interview preparation for NUS SoC students. Its functionalities include:

- Collaborative Code Editor with Mock Interview Support
- LeetCode Question Tracking with Telegram Integration
- Interview Roleplay with Partner Matching and Question Generation

## Contributors

Code2Gather was originally developed by the following people for NUS CS3219:

- [He XinYue](https://github.com/eksinyue)
- [Wang Luo](https://github.com/Asthenosphere)
- [Wen Junhua](https://github.com/Jh123x)
- [Zhu Hanming](https://github.com/zhuhanming)

## Project Requirements

This project requires Docker and Docker Compose to be installed. We will be using the `docker-compose` family of commands.

We will also have some local dependencies to help with developer UX. This will require the following:

### Node.js v14 LTS

One easy way to install Node is to simply download from [their website](https://nodejs.org/en/).

Another alternative way is to utilise [`nodenv`](https://github.com/nodenv/nodenv). Do check out their `README.md` for OS-specific installation instructions.

### Yarn

Once you have Node installed, simply install Yarn using `npm`:

```sh
npm install --global yarn
```

We will be using Yarn for Node dependency management, as well as for its workspaces functionality, the latter of which will streamline some project-level processes, such as pre-commit checks.

## Contributing to TIPS

### Installation

First, clone this repository:

```sh
git clone https://github.com/CodeToGather/TIPS-Backend.git
```

Then, navigate to the project root and install the dependencies:

```sh
cd TIPS-Backend
yarn install
```

### Set up database instance

Simply run:

```sh
yarn db:dev:up
```

Then, start developing by running:

```sh
yarn start:dev
```

### Others

If you need to restart the database, i.e. delete all data and restart, run `yarn db:dev:restart`.

### Committing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for our commit guidelines.

The easiest way to start committing is to run the following command anywhere within the project directory:

```sh
yarn commit
```

You will be guided through an interactive prompt that will help you craft a beautiful commit message, using `commitizen`.
