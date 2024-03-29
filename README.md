# Chat21 - Firebase Cloud Functions

[![npm version](https://badge.fury.io/js/%40chat21%2Fchat21-cloud-functions-public.svg)](https://badge.fury.io/js/%40chat21%2Fchat21-cloud-functions-public)

Chat21 is the core of the open source live chat platform [Tiledesk.com](http://www.tiledesk.com).

- [Chat21 - Firebase Cloud Functions](#chat21---firebase-cloud-functions)
  - [Introduction](#introduction)
  - [Pre requisites](#pre-requisites)
  - [Project building](#project-building)
  - [Project setup](#project-setup)
  - [Deploy](#deploy)
  - [Tips](#tips)
  - [Run with Docker](#run-with-docker)
  - [Test](#test)
    - [Send your first message](#send-your-first-message)
  - [Advanced Setup Options](#advanced-setup-options)
  - [REST API](#rest-api)

## Introduction

Chat21-cloud function is the backend module required for the operation of the other chat21 modules.

- Send a direct message
- Send a group message
- Create a conversation for each message
- Send the push notification for direct and group message
- Send an info message to notify the creation of a group or a member joining

## Pre requisites

- NPM installed. More info here <https://nodejs.org/en/>
- Create a Firebase Project on <https://console.firebase.google.com/>. Follow the Firebase Documentation to create a new project on the Firebase console.
- Install Firebase CLI running `npm install -g firebase-tools`.
  More info here <https://firebase.google.com/docs/cli/>
  If the command fails, you may need to change npm permissions as described here <https://docs.npmjs.com/getting-started/fixing-npm-permissions> or try to install Firebase CLI locally with `npm install firebase-tools`

You can find more info about Firebase Functions here <https://firebase.google.com/docs/functions/get-started>

## Project building

```bash
git clone git@github.com:chat21/chat21-cloud-functions.git
cd functions
npm install
```

## Project setup

1. Login on the Firebase CLI with `firebase login` - it requires access to a web browser.

   - To log into the CLI in remote environments that don't allow access to localhost, use the --no-localhost flag. `firebase login --no-localhost`
     More info here <https://firebase.google.com/docs/cli/>

2. Set up your Firebase project by running `firebase use --add`, select your Project ID

## Deploy

Deploy to Firebase using the following commands:

1. Go in the project root directory with

   ```bash
   cd ..
   ```

2. Deploy

   ```bash
   firebase deploy
   ```

You can now see the deployed functions on the Firebase Console under Functions menu.

## Tips

- If you get Error 403 "Your client does not have permission to the requested URL" please enable unauthenticated function for /api e /supportapi cloud functions following this guide: <https://cloud.google.com/functions/docs/securing/managing-access-iam#allowing_unauthenticated_function_invocation>

## Run with Docker

If you prefer you can use a pre-built docker image to deploy the cloud functions to the Firebase project:

Run:

```bash
docker run -it chat21/chat21-cloud-functions sh
```

After that follow the "Project setup" and "Deploy paragraphs.

## Test

### Send your first message

- Create a new user on the Firebase Console under Authentication Menu.
- Select Email/Password for Authentication Provider
- Click on "Add New User" and populate Email and Password field with for example : email = a@a.com, password = 123456
- Get a JWT token calling JWT Authentication method as described here [JWT Authentication](docs/api.md#jwt-authentication)
- Send a new message using Send Message API with JWT Authentication as described here [Send message](docs/api.md#send-a-message)

## Advanced Setup Options

[Read the Setup Options page](docs/setup_options.md)

## REST API

[Read the REST API page](docs/api.md)
