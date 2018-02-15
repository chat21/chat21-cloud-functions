# Introduction

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
If the command fails, you may need to change npm permissions as described here https://docs.npmjs.com/getting-started/fixing-npm-permissions or try to install Firebase CLI locally with ```npm install firebase-tools```

You can find more info about Firebase Functions here https://firebase.google.com/docs/functions/get-started

# Project setup
* Clone or download this repo from github 
* Run from command line:
```
cd functions 
npm install
```
* Login to Firebase CLI with ```firebase login```. More info here  https://firebase.google.com/docs/cli/
* Set up your Firebase project by running ```firebase use --add```, select your Project ID and follow the instructions.

# Test locally

This project comes with a web-based UI for testing the function. To test locally do:

* Start serving your project locally using ```firebase serve --only hosting,functions```
* Open the app in a browser at https://localhost:5000.
* Sign in to the web app in the browser using Google Sign-In
* Create messages and explore them using the List and Detail sections.
* Sign out. You should no longer be able to access the API.

# Deploy
* Deploy to Firebase using the following command: ```firebase deploy```. You can see the deployed functions on the Firebase Console under Functions menu.
* Open the app using firebase open hosting:site, this will open a browser.
