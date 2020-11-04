[![npm version](https://badge.fury.io/js/%40chat21%2Fchat21-cloud-functions-public.svg)](https://badge.fury.io/js/%40chat21%2Fchat21-cloud-functions-public)

Chat21 is the core of the open source live chat platform [Tiledesk.com](http://www.tiledesk.com).

# Introduction

Chat21-cloud function is the backend module required for the operation of the other chat21 modules.

* Send a direct message
* Send a group message
* Create a conversation for each message
* Send the push notification for direct and group message
* Send an info message to notify the creation of a group or a member joining

# Pre requisites

* NPM installed. More info here https://nodejs.org/en/
* Create a Firebase Project on https://console.firebase.google.com/. Follow the Firebase Documentation to create a new project on the Firebase console.
* Install Firebase CLI running ```npm install -g firebase-tools```.
More info here https://firebase.google.com/docs/cli/ 
If the command fails, you may need to change npm permissions as described here https://docs.npmjs.com/getting-started/fixing-npm-permissions or try to install Firebase CLI locally with ```npm install firebase-tools@```

You can find more info about Firebase Functions here https://firebase.google.com/docs/functions/get-started

# Project building
* Clone or download this repo from github 
* Run from command line:
```
cd functions 
npm install
```

# Project setup
* Login to Firebase CLI with ```firebase login```. If you are not in localhost run ```firebase login --no-localhost```
 More info here  https://firebase.google.com/docs/cli/
* Set up your Firebase project by running ```firebase use --add```, select your Project ID and follow the instructions.

# Deploy
* Deploy to Firebase using the following commands: 
* Go in the project root directory with ```cd ..```.
* Deploy with  ```firebase deploy```.
You can see the deployed functions on the Firebase Console under Functions menu.

# Tips

* If you get Error 403 "Your client does not have permission to the requested URL" please enable unauthenticated function for /api e /supportapi cloud functions following this guide: https://cloud.google.com/functions/docs/securing/managing-access-iam#allowing_unauthenticated_function_invocation

# Run with Docker 
If you prefer you can use a pre-built docker image to deploy the cloud functions to the Firebase project:

Run: 
```
docker run -it chat21/chat21-cloud-functions sh
```
After that follow the "Project setup" and "Deploy paragraphs.


# Test
## Send your first message 

* Create a new user on the Firebase Console under Authentication Menu. 
* Select Email/Password for Authentication Provider
* Click on "Add New User" and populate Email and Password field with for example : email = a@a.com, password = 123456
* Get a JWT token calling JWT Authentication method as described here [JWT Authentication](docs/api.md#jwt-authentication)
* Send a new message using Send Message API with JWT Authentication as described here [Send message](docs/api.md#send-a-message)



# Advanced Setup Options
[Read the Setup Options page](docs/setup_options.md)

# REST API
[Read the REST API page](docs/api.md)
