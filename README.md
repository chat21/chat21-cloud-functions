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

## Setup Options
Use with Google Cloud environment to configure the platform.
* Enable Support features with: ```firebase functions:config:set support.enabled=true```
* Enable email notification with: ```firebase functions:config:set email.enabled=true```
* Disable the option "Automatically join the General Group on signup" with ```firebase functions:config:set group.general.autojoin=false```



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
       -d '{"sender_fullname": "<FULLNAME>", "recipient_id": "<ID>", "recipient_fullname":"<FULLNAME>","text":"helo from API"}' \
      https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/messages
```

Example: 
```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTQ1NjY3NSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxNDU2Njc1LCJleHAiOjE1MjE0NjAyNzUsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.U6oVwcSu1IWqUxPahnjr-kfAojWtTN0mofQRB_VYibgWJohhK_p4acuncPNCyOchgulydVfNTkF_7b_OV5GrpO5Nu305R_F7smhtwZSoJcSB1TVpDzclH47jYU0uUCDmo5G-bKPlreN730qDnLB0zBW7a-pB3xecWqyxQ-eBOsQDaLvyYBUYeqGckgNyfiLM_V8eMbBpL35sHJAz6bokUkkq3WWC5v3MtdusfsFWv4u9LaVUuenGUDu6ilcsGPoa1gGwr1KbeoWkUGgZTIt_RNM01g4vhtdJwX-sIyau9lpJnOlMatjVekQVD3nLrb3SPUxuMrx-ZjrPTEvIflWO_w' \
       -d '{"sender_fullname": "Andrea Leo", "recipient_id": "U4HL3GWjBsd8zLX4Vva0s7W2FN92", "recipient_fullname":"Andrea Leo","text":"hello from API"}' \
       https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages
```



## Create a Group

```

  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <Firebase ID Token>" \
      -d '{"group_name": "group_name", "app_id":"<APP_ID>"}' \
      https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/groups
```

Example:

```
   curl -v -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
       -d '{"group_name": "TestGroup1", "group_members": {"y4QN01LIgGPGnoV6ql07hwPAQg23":1}}' https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups
```


## Join a Group

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"member_id": "<member_id>"}' \
       https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members
```

Example:

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
       -d '{"member_id": "81gLZhYmpTZM0GGuUI9ovD7RaCZ2"}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/-L5hnLkBGQoW05ax9ehg/members
```

## Leave a Group

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members/<MEMBERID>
```

Example:

```
    curl -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/-L5hnLkBGQoW05ax9ehg/members/81gLZhYmpTZM0GGuUI9ovD7RaCZ2
```



## Set Group members

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"members": {"<member_id1>":1},{"<member_id2>":1}}' \
       https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members
```

Example:

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjExNGFiNTViNjc5OTE3Y2EwMzdkZmYwMDBlM2JjOTdkNmU0N2UxYjkifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTMwOTQwMywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MzA5NDAzLCJleHAiOjE1MTkzMTMwMDMsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.bq7UINsCUGvTK1cLB_fHS-ekhyfgz_B8VUfjkrE0uhnsT1zzBBrXSfbqOp5vajYRgoAeekNlDKgIkQhLji7ttKEuJUK8jAIRQ81S3gVZvNeW1Ii4hP1uY1esszizJEKpsUCSzjbLDvf9ttXe-niBTVkcN4gzGUgZpNo6MZ9IpqbVsm7it3F97BMOA4c-muFu-6IgCnTfMpbUBRhFtIySU3DRcLv8v3hFFq0sVY6g7VAZ_ubK46vLtSvTTR18pHaWw7biiPbprk7NQLw6TbAEmWTrhd1R-XMpDoJGmHNKFVdfBeR68t3iDh0JPGmB_J0xpLpUjA9aQWxNhZFjqHWdew' \
       -d '{"members": {"system":1}}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/support-group-L5xro2P81zHs7YA7-DX/members
```


## Delete a my message

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/messages/<RECIPIENT_ID>/<MESSAGE_ID>
```

Example:

```
    curl -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTE5NTM1MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxMTk1MzUxLCJleHAiOjE1MjExOTg5NTEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.EOfzeeAWjhTJfI16TyR8e1JRkk_N1ix16AFbaqw6l6YiMBwhxsIya5ZZ4lgIFByKpm0ZUqBvMZ6jbhG368w_wRDNJCDE_08eVGKRGq_428A8f5D6nUB57rRRI1umxj4y50LJ66Px5F7mekcBSPOfPEDrCzn9K7kPj3r1pd-Yc0nhWxTqDKiR_kAFitvmT1ptQGojEfeoIRLoPsv4XtTkWp7NJi-jLZp3dlRAJWp3483lsce3nX2oy4v7OleYIXEzPbJNFW7-qXf04Ovc6__mEShj2RoMntcntxNUsu3rO9ZpJtDIlUK-BMB5XPdEoQ1G9GBcoLRKc76WCqeGKikZIA' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages/y4QN01LIgGPGnoV6ql07hwPAQg23/-L7iJ5QljBP7sPkN73Km
```

## Delete a group message for me and other users

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       'https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/messages/<RECIPIENT_ID>/<MESSAGE_ID>?all=true&channel_type=group'
```
Example:

```
    curl -v -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTE5NTM1MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxMTk1MzUxLCJleHAiOjE1MjExOTg5NTEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.EOfzeeAWjhTJfI16TyR8e1JRkk_N1ix16AFbaqw6l6YiMBwhxsIya5ZZ4lgIFByKpm0ZUqBvMZ6jbhG368w_wRDNJCDE_08eVGKRGq_428A8f5D6nUB57rRRI1umxj4y50LJ66Px5F7mekcBSPOfPEDrCzn9K7kPj3r1pd-Yc0nhWxTqDKiR_kAFitvmT1ptQGojEfeoIRLoPsv4XtTkWp7NJi-jLZp3dlRAJWp3483lsce3nX2oy4v7OleYIXEzPbJNFW7-qXf04Ovc6__mEShj2RoMntcntxNUsu3rO9ZpJtDIlUK-BMB5XPdEoQ1G9GBcoLRKc76WCqeGKikZIA' \
        'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages/-L7iM75Pweqz2Atl7w1z/-L7iMFJKt06ixZFG_p4e?all=true&channel_type=group'


```


# REST API for Support

## Create support request

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <Firebase ID Token>" \
       -d '{"sender_fullname": "<FULLNAME>", "request_id": "<ID>", "recipient_fullname":"<FULLNAME>","text":"helo from API"}' \
      https://us-central1-<project-id>.cloudfunctions.net/supportapi/<APP_ID>/requests
```

Example: 
```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -d '{"sender_fullname": "Andrea Leo", "request_id": "andrea.leo@f21.it-Re: subject", "recipient_fullname":"Andrea Leo","text":"hello from API","projectid":"5ab0f32757066e0014bfd718"}' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/requests?token=chat21-secret-orgAa,'
```

## Close Support group

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <Firebase ID Token>" \
       https://us-central1-<project-id>.cloudfunctions.net/supportapi/<APP_ID>/groups/<GROUP_ID>
```

Example:

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjQzZTFiMGIyOTllNDIxZjU2ZWI1YTQ2NjhkMWNmMjNmNGFjNjk2NGMifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMDg2Njk4MywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIwODY2OTgzLCJleHAiOjE1MjA4NzA1ODMsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.zzdAPcqr8aGWQ-i_2kejYZz5mvE92zk-UxsrLN1Wm8VbfgwyvC9X3C-vR46fkXhcBO96GsU4U6sJoQIzy8XPiENMmACSbtZsQBkWV7Dlcij08TqBO_HOYA7LVk4fCOCdJ_jaL8DgmbbaP6uYIy_fkBg43-FSLV7x21TqAGIT8f-IDSUAfU_J9jbdy3bcwl2Rpr7P8PbmK8RgKgFNXwoY8T1g2PXM4fUzZU2MszLycRMzP4eoDQPgGEB7Kk2RdDDdez2i5fxJtashYQ5tWy5jAf6bSMR1wm3Ng-27YzeEmZ-rW0ve3liRqNhSJJ_KPp-2dHfTNsgL-odw_3cP_lvSWw' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/groups/support-group-L5xro2P81zHs7YA7-DX/
```


# BOT Setup
* Create a bot user with the mobile app or web app. Ex: email:bot@chat21.org, firstname: Bot, lastname: Chat21,etc.
* Retrieve the bot user id (<BOT_UID>) from the profile tab of the mobile app or from firebase autentication tab
* Set the bot user id <BOT_UID> parameter with ```firebase functions:config:set bot.uid=<BOT_UID>```
