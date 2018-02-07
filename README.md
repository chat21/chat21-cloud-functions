# Introduction

* Send a direct message to the recipient timeline
* Send a group message to the members timelines
* Create a conversation for each message
* Send the push notification for direct and group message
* Send an info message to notify of the creation of a group or the member joining

# Pre requisites

* NPM installed. More info here https://nodejs.org/en/
* Create a Firebase Project on https://console.firebase.google.com/. Follow the Firebase Documentation to create a new project on the Firebase console.
* Install Firebase CLI running ```npm install -g firebase-tools```. 
More info here https://firebase.google.com/docs/cli/ 
If the command fails, you may need to change npm permissions as described here https://docs.npmjs.com/getting-started/fixing-npm-permissions or try to install Firebase CLI locally with ```npm install firebase-tools```
* Login to Firebase CLI with ```firebase login```. More info here  https://firebase.google.com/docs/cli/
* Set up your Firebase project by running ```firebase use --add```, select your Project ID and follow the instructions.

You can find more info about Firebase Functions here https://firebase.google.com/docs/functions/get-started

# Deploy
* Clone or download this repo from github and run from command line:
```
cd functions 
npm install
```
* Deploy to Firebase using the following command: ```firebase deploy```. You can see the deployed functions on the Firebase Console under Functions menu.