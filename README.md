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


# REST API

## Authentication

Generate a Firebase token with:

```
 curl 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=<API_KEY>' \
-H 'Content-Type: application/json' \
-d '{"email":"<USER_EMAIL>","password":"<USER_PASSWORD>","returnSecureToken":true}'
```

A successful authentication is indicated by a 200 OK HTTP status code. The response contains the Firebase ID token and refresh token associated with the existing email/password account.

Example:

```
curl 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDWMsqHBKmWVT7mWiSqBfRpS5U8YwTl7H0' \
 -H 'Content-Type: application/json' \
 -d '{"email":"andrea.leo@frontiere21.it","password":"123456","returnSecureToken":true}'
```

More info here : https://firebase.google.com/docs/reference/rest/auth/#section-sign-in-email-password



## Send a message

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"sender_fullname": "<FULLNAME>", "recipient_id": "<ID>", "recipient_fullname":"<FULLNAME>","text":"helo from API", "app_id":"<APP_ID>"}' \
      https://us-central1-<project-id>.cloudfunctions.net/api/messages
```

Example: 
```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxYTg1OWFmNjkxNTZjODMwMGY2NzllMGMxODJlMGJkMjBmNzA4MDEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxODYyNjA0MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE4NjI2MDQxLCJleHAiOjE1MTg2Mjk2NDEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.jn4yBVdB3qjqaKe1VzEExKEp4RqJl72Uoa-5-z5gWbEaP7JqG51ljoKsjT22_kCbQl2GnOl2FJ5RX-ovL3w5nfixHKKKaK9fy-95YjfhX7aLZl7piEqxO-P64QpQfBCoALXlGHT7WT_P17CNetC3F3ojwiQuf9B4Yw_WM3FGUQJkAeC7nfOgD0JRw3miQADilSgM9y7MLGsxkwAR6e_Azf7DW9RHjGg2IyA4_F2oDh9kfyF4IHEe-Snl7EdvCMDFOv9poU25AKEAM08SZG3a4Am9TqaUD0Gs4mULnu4Z4lm4SflPzV16JWd5duG7CHE9C0qe30hYiI1MMJqaUUyH4g' \
       -d '{"sender_fullname": "Andrea Leo", "recipient_id": "U4HL3GWjBsd8zLX4Vva0s7W2FN92", "recipient_fullname":"Andrea Leo","text":"hello from API", "app_id":"tilechat"}' \
       https://us-central1-chat-v2-dev.cloudfunctions.net/api/messages
```


## Create a Group

```

  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <Firebase ID Token>" \
      -d '{"group_name": "group_name", "app_id":"<APP_ID>"}' \
      https://us-central1-<project-id>.cloudfunctions.net/api/groups
```

Example:

```
   curl -v -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxYTg1OWFmNjkxNTZjODMwMGY2NzllMGMxODJlMGJkMjBmNzA4MDEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxODYyNjA0MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE4NjI2MDQxLCJleHAiOjE1MTg2Mjk2NDEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.jn4yBVdB3qjqaKe1VzEExKEp4RqJl72Uoa-5-z5gWbEaP7JqG51ljoKsjT22_kCbQl2GnOl2FJ5RX-ovL3w5nfixHKKKaK9fy-95YjfhX7aLZl7piEqxO-P64QpQfBCoALXlGHT7WT_P17CNetC3F3ojwiQuf9B4Yw_WM3FGUQJkAeC7nfOgD0JRw3miQADilSgM9y7MLGsxkwAR6e_Azf7DW9RHjGg2IyA4_F2oDh9kfyF4IHEe-Snl7EdvCMDFOv9poU25AKEAM08SZG3a4Am9TqaUD0Gs4mULnu4Z4lm4SflPzV16JWd5duG7CHE9C0qe30hYiI1MMJqaUUyH4g' \
       -d '{"group_name": "TestGroup1", "group_members": {"y4QN01LIgGPGnoV6ql07hwPAQg23":1}, "app_id":"tilechat"}' https://us-central1-chat-v2-dev.cloudfunctions.net/api/groups
```


## Join a Group

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"member_id": "<member_id>", "app_id": "<app_id>"}' 
       https://us-central1-<project-id>.cloudfunctions.net/api/groups/<GROUP_ID>/members
```

Example:

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxYTg1OWFmNjkxNTZjODMwMGY2NzllMGMxODJlMGJkMjBmNzA4MDEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxODYzMDQ5MiwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE4NjMwNDkyLCJleHAiOjE1MTg2MzQwOTIsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.CvuvvkGeEl3m_xhBSEABAsPkqxmB6g5pjPMV8Ztai3_s35y6vwZleG38Tv7FO0aWo9XbwzrYhql-XYzihoMtsHF0TWn3ZL4QnbeIgC5FVCIbWFdz98OOySko9tbMq2IOdCpQGqUH_acwJJLmjJD8YL010tXBS3dgKBnf8000PubTZAIBBMMJwdqCG6AddMbcxvCwgBllyOqGVeryyrkfsEH4e-Zww7EFgLvMCff53Uz0-jU_0bST4Tk_IflNlOX1ov7g7UXzEC499DuOl8Vil5J1uwvBad5HoL7OBC_yGCZ0U_eICWYzjaJG3Zf9xwkmk1SbktTPJckfnMBW_ibnwA' \
       -d '{"member_id": "81gLZhYmpTZM0GGuUI9ovD7RaCZ2", "app_id": "tilechat"}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/groups/-L5KLYXVUzMWj4Lbtu7F/members
```

## Leave a Group

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"app_id": "<app_id>"}' 
       https://us-central1-<project-id>.cloudfunctions.net/api/groups/<GROUP_ID>/members/<MEMBERID>
```

Example:

```
    curl -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxYTg1OWFmNjkxNTZjODMwMGY2NzllMGMxODJlMGJkMjBmNzA4MDEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxODYzMDQ5MiwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE4NjMwNDkyLCJleHAiOjE1MTg2MzQwOTIsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.CvuvvkGeEl3m_xhBSEABAsPkqxmB6g5pjPMV8Ztai3_s35y6vwZleG38Tv7FO0aWo9XbwzrYhql-XYzihoMtsHF0TWn3ZL4QnbeIgC5FVCIbWFdz98OOySko9tbMq2IOdCpQGqUH_acwJJLmjJD8YL010tXBS3dgKBnf8000PubTZAIBBMMJwdqCG6AddMbcxvCwgBllyOqGVeryyrkfsEH4e-Zww7EFgLvMCff53Uz0-jU_0bST4Tk_IflNlOX1ov7g7UXzEC499DuOl8Vil5J1uwvBad5HoL7OBC_yGCZ0U_eICWYzjaJG3Zf9xwkmk1SbktTPJckfnMBW_ibnwA' \
       -d '{"app_id": "tilechat"}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/groups/-L5KLYXVUzMWj4Lbtu7F/members/81gLZhYmpTZM0GGuUI9ovD7RaCZ2
```