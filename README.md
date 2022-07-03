<!-- markdownlint-disable MD033 MD041 -->
<h1 align="center">Backend for TIPS</h1>

<p align="center"><img src="https://github.com/CodeToGather/TIPS-Backend/workflows/Lint/badge.svg" alt="Lint" />&nbsp;<img src="https://github.com/CodeToGather/TIPS-Backend/workflows/Test/badge.svg" alt="Test" /></p>

## Overview

TIPS is built to support the technical interview preparation for NUS SoC students. Its functionalities include:

- Collaborative Code Editor with Mock Interview Support
- LeetCode Question Tracking
- (Coming Soon) Interview Roleplay with Partner Matching and Question Generation

## Getting Started

This project requires Docker and Docker Compose to be installed for the database. We will be using the `docker-compose` family of commands.

1. Clone this repository:

   ```sh
   git clone https://github.com/CodeToGather/TIPS-Backend.git
   ```

1. Navigate to the project root and install the dependencies:

   ```sh
   cd TIPS-Backend
   yarn install
   ```

1. Make a copy of the default `.env` file, name it `.env.development` and fill it up:

   ```sh
   cp .env .env.development
   ```

   ```sh
   DATABASE_URL="postgresql://postgres:123@localhost:5433/tips?schema=public"
   JWT_SECRET="some_secret_here"
   PORT=3001
   CURRENT_ITERATION=1
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   AGORA_APP_ID=
   AGORA_APP_CERTIFICATE=
   ```

1. Setup the database by running:

   ```sh
   yarn db:dev:up
   ```

1. Start the application by running:

   ```sh
   yarn start:dev
   ```

1. The REST API and Socket.IO gateway can be found at `http://localhost:3001` and `ws://localhost:3001` respectively.

1. If you need to restart the database, i.e. delete all data and recreate, run `yrn db:dev:restart`.

1. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for our commit guidelines.

   The easiest way to start committing is to run the following command anywhere within the project directory:

   ```sh
   yarn commit
   ```

   You will be guided through an interactive prompt that will help you craft a beautiful commit message, using `commitizen`.

## Updating TIPS for Upcoming Iteration

To update TIPS for the coming iteration, you can simply update the JSON data at `src/data/jsons`.

**NOTE:** DO NOT OVERWRITE past windows in `windows.json`. Instead, append new windows using an incremental `id`.

## Contributors

TIPS is a monolithic rewrite of Code2Gather, the latter of which was originally developed by the following people for NUS CS3219:

- [He XinYue](https://github.com/eksinyue)
- [Wang Luo](https://github.com/Asthenosphere)
- [Wen Junhua](https://github.com/Jh123x)
- [Zhu Hanming](https://github.com/zhuhanming)
