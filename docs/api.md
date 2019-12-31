
# REST API
Below are described the REST API of Chat21:

## Authentication

We support two authentication methods : JWT and Shared Secret

### JWT Authentication
Generate a Firebase token with:

```
 curl 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=<API_KEY>' \
    -H 'Content-Type: application/json' \
    -d '{"email":"<USER_EMAIL>","password":"<USER_PASSWORD>","returnSecureToken":true}'
```

The API_KEY is the firebase API KEY available under the Settings page of your Firebase project. 
You can find the API KEY in:
(gear-next-to-project-name) > Project Settings > Cloud Messaging

A successful authentication is indicated by a 200 OK HTTP status code. The response contains the Firebase ID token and refresh token associated with the existing email/password account.

Example:

```
curl 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDWMsqHBKmWVT7mWiSqBfRpS5U8YwTl7H0' \
    -H 'Content-Type: application/json' \
    -d '{"email":"andrea.leo@frontiere21.it","password":"123456","returnSecureToken":true}'
```

More info here : https://firebase.google.com/docs/reference/rest/auth/#section-sign-in-email-password

### Secret Authentication (for admin)

To authenticate you can add the token query parameter to the endpoints. Example : ```?token=chat21-secret-orgAa,```
You can change the secret token for your installation with ```firebase functions:config:set secretToken=MYSECRET```

## Send a message

You can send a message making a POST call to the endpoint :

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"sender_fullname": "<SENDER_FULLNAME>", "recipient_id": "<RECIPIENT_ID>", "recipient_fullname":"<RECIPIENT_FULLNAME>","text":"<MESSAGE_TEXT>", "channel_type": "<CHANNEL_TYPE>", "type": "<TYPE>", "attributes": "<ATTRIBUTES>", "metadata": "<METADATA>"}' \
      'https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/messages'
```
Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <SENDER_FULLNAME>: is the Sender Fullname. Ex: Andrea Leo
- <RECIPIENT_ID>: it's the recipient id of the message. The recipient id is the user id for direct message and the group id for group messaging.
- <RECIPIENT_FULLNAME>: is the Recipient Fullname. Ex: Andrea Sponziello
- <MESSAGE_TEXT>: it's the message text
- <CHANNEL_TYPE>: it's the channel type. "direct" value for one-to-one direct message and "group" for group messaging. Available values: direct (default) and group.
- <TYPE>: Optional -  it's the message type. "text" value for textual message and "image" for sending image message. Available values: text (default) and image.
- <ATTRIBUTES>: Optional -  it's the message custom attributes. Example: attributes = {"custom_attribute1": "value1"}
- <METADATA>: Optional - it's the image properties: src is the absolute source path of the image, width is the image width, height is the image height. Example: metadata = { "src": "https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png", "width": 200, "height": 200 }
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value

Example. Send a direct message to recipient id U4HL3GWjBsd8zLX4Vva0s7W2FN92 : 

```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTQ1NjY3NSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxNDU2Njc1LCJleHAiOjE1MjE0NjAyNzUsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.U6oVwcSu1IWqUxPahnjr-kfAojWtTN0mofQRB_VYibgWJohhK_p4acuncPNCyOchgulydVfNTkF_7b_OV5GrpO5Nu305R_F7smhtwZSoJcSB1TVpDzclH47jYU0uUCDmo5G-bKPlreN730qDnLB0zBW7a-pB3xecWqyxQ-eBOsQDaLvyYBUYeqGckgNyfiLM_V8eMbBpL35sHJAz6bokUkkq3WWC5v3MtdusfsFWv4u9LaVUuenGUDu6ilcsGPoa1gGwr1KbeoWkUGgZTIt_RNM01g4vhtdJwX-sIyau9lpJnOlMatjVekQVD3nLrb3SPUxuMrx-ZjrPTEvIflWO_w' \
       -d '{"sender_fullname": "Andrea Leo", "recipient_id": "U4HL3GWjBsd8zLX4Vva0s7W2FN92", "recipient_fullname":"Andrea Leo","text":"hello from API"}' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages'
```

Example. Send a group message : 

```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjY3NmY5MmU1MGQ5ZmUxNzdiM2I5NTJjNGM4ZWU2YjY1ZDk3ZWIwZmMifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUzNDgzNzQ0OCwidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUzNDgzNzQ0OCwiZXhwIjoxNTM0ODQxMDQ4LCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.XcP7TiYf1ESbKSs9qXgRIw1o5U5DHC2APSd_r6WQF4h7KlFtXKs34KPuxcrK2tuqtWts7RBPuZC0BXK_uPThN45W-rcN5900r2UaFxwr-VjWoqLAYzWNE3bM4oDM_ib0owijMSfAfIyqX1yzCl1SQ7UnyHH9ntTZBjPHEUOw0adjiM5dsE_tON-zFyOG6M-mSxgpGoQa7My9w7pInFltSPZLbVanvCeb2ZxYRQXIbR-v5aqHb_d4OyOH3cqb7Mn8XLirQIV5z_Rzs-GPxQVJFn-zYZsfNnfw3xeNllLFlM7u6afOMknMFh79bP4flp95XUNC-qIO7MTQcpVSCvC85Q' \
       -d '{"sender_fullname": "Andrea Leo", "recipient_id": "-LKQQxIY4DDyG17FDiOM", "recipient_fullname":"Test group","text":"hello group from API","channel_type":"group"}' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages'
```


Example. Send an image to recipient id U4HL3GWjBsd8zLX4Vva0s7W2FN92 : 

```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImNlNWNlZDZlNDBkY2QxZWZmNDA3MDQ4ODY3YjFlZDFlNzA2Njg2YTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTU3Nzc4OTk1OCwidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTU3Nzc4OTk1OCwiZXhwIjoxNTc3NzkzNTU4LCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.ayGVDUpP0GcPyEHo8dQ82EY6Kz2Wt2pVi8yeLvXeu4GITb4n3BZ-5XeQUFYQbshFx5GSL4gjTOZSdnoMAPoutrNRQNo0MBbnaENsbjpLBqUAomQ0l7BPIGs_S4Hwx69s2N3C5Jr6l3jp0f9PprUZhSxbCbRqx8TO-K3hYpsZ8efMl5NO0gBRl7GH_Dqu95ROZxRMxWNrQcUk0cihL0PtaKr-EcE9V547Og2FgF7p_iUomTKeSZ6Ili3N9m02aAOkEzoYqO0hPGKRnm_1Xi-1UnhTiSiDdAWuuz1hmsiWtYXz5Lru66QVUY6YE8rPWfufz0KYyBFiP2h2akBitHdyuQ' \
       -d '{"sender_fullname": "Andrea Leo", "recipient_id": "U4HL3GWjBsd8zLX4Vva0s7W2FN92", "recipient_fullname":"Andrea Leo","text":"alt text", "type":"image", "metadata": { "src": "https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png", "width": 200, "height": 200 } }' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages'
```


## Create a Group

Create a chat user's group making the following POST call :

```

  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      -d '{"group_name": "<GROUP_NAME>", "group_members": {"<MEMBER_ID>":1}}' \
      'https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/groups'
```

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <GROUP_NAME>: it's the new group name
- <MEMBER_ID>: it's the user ids of the group members
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value

Example:

```
   curl -v -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
       -d '{"group_name": "TestGroup1", "group_members": {"y4QN01LIgGPGnoV6ql07hwPAQg23":1}}' 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups'
```


## Join a Group

With this API the user can join (become a member) of an existing group:

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"member_id": "<MEMBER_ID>"}' \
       https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <MEMBER_ID>: it's the user id of the user you want to joing (become a member)
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <GROUP_ID>: it's the existing group id


Example:

```
    curl -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
       -d '{"member_id": "81gLZhYmpTZM0GGuUI9ovD7RaCZ2"}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/-L5hnLkBGQoW05ax9ehg/members
```

## Leave a Group

With this API the user can leave of an existing group:


```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members/<MEMBERID>
```

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <GROUP_ID>: it's the existing group id
- <MEMBER_ID>: it's the user id of the user you want to leave a group

Example:

```
    curl -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNmI4ZWFlNTczOTk2NGM1MWJjMTUyNWI1ZmU2ZmRjY2Y1ODJjZDQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTAzOTAwNywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MDM5MDA4LCJleHAiOjE1MTkwNDI2MDgsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Ri3_R60-vTpSLd6uJBTo1d9inKhGppq3A3gONS0ZcMsFlGnqti_x55fC4h4O-GInLzUnCGt-dS6Pt89svIHxjz2cnZORj9dhrKU3AyMrYIniqiuzxqWSiUvRs3mhVCAoiUvWBSbiyhSb9fStH74ihqEVE9WIu4BzalqAQP7Q-d1fkRAoHqLH4T1HpRgyvOPlvP0mMiujai6Q3xkKzcahTD-3--Hl5RtYQzNLEhy-83k2YR4pbUzPRGlfJpjFZgWdPEyM2pLt1xK91wLBB3pHRa79ciTKhxUHqXpQCWXRErVPp6ELSx0bAu5_tsjWHfQjnsJ_aQDg4xiKcrhKDePoYQ' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/-L5hnLkBGQoW05ax9ehg/members/81gLZhYmpTZM0GGuUI9ovD7RaCZ2
```



## Set Group members

With this API you can set the group members


```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"members": {"<member_id1>":1},{"<member_id2>":1}}' \
       https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members
```

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <MEMBER_IDs>: it's the user ids of the group members
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <GROUP_ID>: it's the existing group id

Example:

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjExNGFiNTViNjc5OTE3Y2EwMzdkZmYwMDBlM2JjOTdkNmU0N2UxYjkifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUxOTMwOTQwMywidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTE5MzA5NDAzLCJleHAiOjE1MTkzMTMwMDMsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.bq7UINsCUGvTK1cLB_fHS-ekhyfgz_B8VUfjkrE0uhnsT1zzBBrXSfbqOp5vajYRgoAeekNlDKgIkQhLji7ttKEuJUK8jAIRQ81S3gVZvNeW1Ii4hP1uY1esszizJEKpsUCSzjbLDvf9ttXe-niBTVkcN4gzGUgZpNo6MZ9IpqbVsm7it3F97BMOA4c-muFu-6IgCnTfMpbUBRhFtIySU3DRcLv8v3hFFq0sVY6g7VAZ_ubK46vLtSvTTR18pHaWw7biiPbprk7NQLw6TbAEmWTrhd1R-XMpDoJGmHNKFVdfBeR68t3iDh0JPGmB_J0xpLpUjA9aQWxNhZFjqHWdew' \
       -d '{"members": {"system":1}}' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/support-group-L5xro2P81zHs7YA7-DX/members
```


## Delete a message from the personal timeline

Delete a message from the personal timeline of a conversation specified by a RECIPIENT_ID

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/messages/<RECIPIENT_ID>/<MESSAGE_ID>
```

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <RECIPIENT_ID>: it's the recipient id
- <MESSAGE_ID>: it's the message id

Example:

```
    curl -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTE5NTM1MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxMTk1MzUxLCJleHAiOjE1MjExOTg5NTEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.EOfzeeAWjhTJfI16TyR8e1JRkk_N1ix16AFbaqw6l6YiMBwhxsIya5ZZ4lgIFByKpm0ZUqBvMZ6jbhG368w_wRDNJCDE_08eVGKRGq_428A8f5D6nUB57rRRI1umxj4y50LJ66Px5F7mekcBSPOfPEDrCzn9K7kPj3r1pd-Yc0nhWxTqDKiR_kAFitvmT1ptQGojEfeoIRLoPsv4XtTkWp7NJi-jLZp3dlRAJWp3483lsce3nX2oy4v7OleYIXEzPbJNFW7-qXf04Ovc6__mEShj2RoMntcntxNUsu3rO9ZpJtDIlUK-BMB5XPdEoQ1G9GBcoLRKc76WCqeGKikZIA' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages/y4QN01LIgGPGnoV6ql07hwPAQg23/-L7iJ5QljBP7sPkN73Km
```

## Delete a group message for me and other users

Delete a message from all the timelines of a conversation specified by a RECIPIENT_ID


```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       'https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/messages/<RECIPIENT_ID>/<MESSAGE_ID>?all=true&channel_type=group'
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <RECIPIENT_ID>: it's the recipient id
- <MESSAGE_ID>: it's the message id


Example:

```
    curl -v -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhNWZiMGJkZTJlMzUwMmZkZTE1YzAwMWE0MWIxYzkxNDc4MTI0NzYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMTE5NTM1MSwidXNlcl9pZCI6IlU0SEwzR1dqQnNkOHpMWDRWdmEwczdXMkZOOTIiLCJzdWIiOiJVNEhMM0dXakJzZDh6TFg0VnZhMHM3VzJGTjkyIiwiaWF0IjoxNTIxMTk1MzUxLCJleHAiOjE1MjExOTg5NTEsImVtYWlsIjoiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhbmRyZWEubGVvQGZyb250aWVyZTIxLml0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.EOfzeeAWjhTJfI16TyR8e1JRkk_N1ix16AFbaqw6l6YiMBwhxsIya5ZZ4lgIFByKpm0ZUqBvMZ6jbhG368w_wRDNJCDE_08eVGKRGq_428A8f5D6nUB57rRRI1umxj4y50LJ66Px5F7mekcBSPOfPEDrCzn9K7kPj3r1pd-Yc0nhWxTqDKiR_kAFitvmT1ptQGojEfeoIRLoPsv4XtTkWp7NJi-jLZp3dlRAJWp3483lsce3nX2oy4v7OleYIXEzPbJNFW7-qXf04Ovc6__mEShj2RoMntcntxNUsu3rO9ZpJtDIlUK-BMB5XPdEoQ1G9GBcoLRKc76WCqeGKikZIA' \
        'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/messages/-L7iM75Pweqz2Atl7w1z/-L7iMFJKt06ixZFG_p4e?all=true&channel_type=group'


```


## Archive or delete a conversation

Archive or delete a conversation from the personal timeline specified by a RECIPIENT_ID

```
    curl  -X DELETE \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/conversations/<RECIPIENT_ID>?delete=<BOOLEAN_VALUE>
```

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value
- <RECIPIENT_ID>: it's the recipient id
- delete:  (Optional) if true permanently deletes the conversation, if false archives the conversation

Example:

```
    curl -v -X DELETE \
      -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjdhM2QxOTA0ZjE4ZTI1Nzk0ODgzMWVhYjgwM2UxMmI3OTcxZTEzYWIifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyODg3NjAwNywidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUyODg3NjAwNywiZXhwIjoxNTI4ODc5NjA3LCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.OMLzWOQ9tQroiZuHKZSkWf_JDPAjueYthJXD86ZRIX1LOxlXfewJG3Reb71gXcIggLtrrqfDLw7h9JLSpMuuSl8sZW6ppiMPcwHMdZbFT4kMz-k5wEjkIQaRSua8BKVXnl65TR3hX7xqAvV8F65pRzyndauBOv1mq6o1JfDBKXPDk5O-sXufa3G7ShApjvtW9XAqC6PxnutuoniUGxZhZj1pXn2zlBLFnFcONZNaT1vDfRruAZatmxh41Gc5i04aj0mhqcu2HciJ37qIF2uDY1WkrMs4VUDd-PH1iI4IKKh3k2CXNrPVKQEzR_nL_NyLh_ZnfL8kewLaGFjQOGo0Xg' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/conversations/y4QN01LIgGPGnoV6ql07hwPAQg23/
```


## Create a Contact

Create a new contact.

```

  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      -d '{"firstname": "<FIRSTNAME>", "lastname": "<LASTNAME>","email": "<EMAIL>"}' \
      https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/contacts
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIRSTNAME>: it's the firstname of the contact
- <LASTNAME>: it's the lastname of the contact
- <EMAIL>: it's the contact email
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value



Example:

```
   curl -v -X POST \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMwNmEyMTQ5YjdmOTU3MjgwNTJhOTg1YWRlY2JmNWRlMDQ3Y2RhNmYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyMzI2NTgwNiwidXNlcl9pZCI6ImZBSUR4dTAzTnNWUXZQbG9Eb2M2VDdtbVdSNDMiLCJzdWIiOiJmQUlEeHUwM05zVlF2UGxvRG9jNlQ3bW1XUjQzIiwiaWF0IjoxNTIzMjY1ODA2LCJleHAiOjE1MjMyNjk0MDYsImVtYWlsIjoic0BzLml0IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInNAcy5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.kjyCaKs9o5xYVt92gnvGn-7bkI0-HuChU7LxcDFiQ8rz5gJT0B5-R-qHIzifJ42socqWPC-N8hH-ZSiDO8I9PYNaCOcfWuyIw5Fo487MTNJK9pmkjujq8F254zZmhTWPVF1jdWmZg241Z2KoWZckpXThHMbfVPuVH6kENBfqw7vFXXB_blm7kqn2vuzsMYuFyUd7vlUour2KXHVsY5pDagv_EmDcPUhS0akynf1dn8N6j1WK9JV26XMY3yy1t-bMKXq-GPJ5uw-_rmritndqVTea2MS7o5cynFdlrPsqeVMX68hgBBnb-6ZdQMrmOo1nErclbuSZpAqsuQDXEjWhUQ' \
        -d '{"firstname": "firstname", "lastname": "lastname","email": "email"}' \
    https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/contacts
```


## Update my FirstName and Last Name

Change my first and lastname:

```

  curl -X PUT \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      -d '{"firstname": "<FIRSTNAME>", "lastname": "<LASTNAME>"}' \
      https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/contacts/me
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIRSTNAME>: it's the firstname of the contact
- <LASTNAME>: it's the lastname of the contact
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value



Example:

```
   curl -v -X PUT \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE1ZjUyYTRhNGE5Y2MzNmZjOGEyNWZmMmQ0NzY4NmE0OGM2YjcxZWQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUyODQ2ODAyMSwidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUyODQ2ODAyMSwiZXhwIjoxNTI4NDcxNjIxLCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.I1Iy3ed1tuujsoz0Ii4UvUzTKQuKGmo94U1UrJ3qG9DhH7f1oTK_v_EF1H8xLonu4qM3RyTXDtHW2Ux8ugZAO3D-wuHLRQGV5zy_csl5Js9wMQvws5q9y-SYmaxxKCgVqGg9VKWjNiq0dk-1RJPOErJragGbi11GrfXAHO6QVBd3gSpdlXikbsYQrqX2w57rw30WW_iVCrjXAqAccXrCoK21vVHJOxX1O4BSgegFuwouvF9wvxhY-APu5lOuo6qMY7zhWHcuEkIk0yK3ortBp2UrRBiqUPzM-EohkeUNGrBp-fdDtAX11z-UfsNQeDVOTRxsEgEKQihn5Ss1zv8Q5g' \
        -d '{"firstname": "firstname", "lastname": "lastname"}' \
    https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/contacts/me
```


## Upload photo profile

Upload my photo profile

```

  curl -X PUT \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/contacts/me/photo
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value


Example:

```
   curl -v -X PUT \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImEwY2ViNDY3NDJhNjNlMTk2NDIxNjNhNzI4NmRjZDQyZjc0MzYzNjYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUzNjIyNzExMywidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUzNjIyNzExMywiZXhwIjoxNTM2MjMwNzEzLCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.P4S3eNL7o6MN97JF_mKcfH3qc8neO4Hf66SgdJn_Nzkmn78v9Pl6rZWQS4zohufNcocHwkZow-Cc1Mg3-X9q_huttBGhFqyhH5bMqT5cojXivgcvlHOYNZk84tFXzCHakgh9ahucJy_Fgc3s6dnglcSr5xm83TOfeL5vr4wbGJJE17WnPKxr2lhnw_T0hyJuLrG3Cdjo37FI6sMZDLw1rgqEBScTcwoC-TwxjuvT43mGhlX_aIlM0RpJz4zg56iAqARaTpoZOM7icIqx-MfVRo2A766PUrciS-54h2NZ98dLXsdqZV9eZ4Sftctfrax9mrPV2XiXxd3vpgtdc85A1A' \
       -F "image=@/Users/andrealeo/Downloads/a.jpg" \
    https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/contacts/me/photo
```


## Delete photo profile

Delete my photo profile

```

  curl -X DELETE \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/contacts/me/photo
```


Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value


Example:

```
   curl -v -X DELETE \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImEwY2ViNDY3NDJhNjNlMTk2NDIxNjNhNzI4NmRjZDQyZjc0MzYzNjYifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUzNjIyNzExMywidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUzNjIyNzExMywiZXhwIjoxNTM2MjMwNzEzLCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.P4S3eNL7o6MN97JF_mKcfH3qc8neO4Hf66SgdJn_Nzkmn78v9Pl6rZWQS4zohufNcocHwkZow-Cc1Mg3-X9q_huttBGhFqyhH5bMqT5cojXivgcvlHOYNZk84tFXzCHakgh9ahucJy_Fgc3s6dnglcSr5xm83TOfeL5vr4wbGJJE17WnPKxr2lhnw_T0hyJuLrG3Cdjo37FI6sMZDLw1rgqEBScTcwoC-TwxjuvT43mGhlX_aIlM0RpJz4zg56iAqARaTpoZOM7icIqx-MfVRo2A766PUrciS-54h2NZ98dLXsdqZV9eZ4Sftctfrax9mrPV2XiXxd3vpgtdc85A1A' \
    https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/contacts/me/photo
```


# REST API for Support

## Create support request

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       -d '{"sender_fullname": "<FULLNAME>","text":"helo from API","projectid":"<Project_id>"}' \
      https://us-central1-<project-id>.cloudfunctions.net/supportapi/<APP_ID>/requests
```

Example: 
```
   curl -X POST \
       -H 'Content-Type: application/json' \
       -d '{"sender_fullname": "Andrea Leo", "text":"hello from API","projectid":"5ab0f32757066e0014bfd718"}' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/requests?token=chat21-secret-orgAa,'
```



## Rate the request

```
  curl -X PUT \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
      https://us-central1-<project-id>.cloudfunctions.net/supportapi/<APP_ID>/requests/<REQUEST_ID>/rate?rating=2&rating_message=ciao
```

Example: 
```
   curl -X PUT \
       -H 'Content-Type: application/json' \
       'https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/requests/support-group-LM879tEdviVwDkNmo94/rate?token=chat21-secret-orgAa,&rating=2&rating_message=ciao'
```

## Close Support group

Where :
- <FIREBASE_ID_TOKEN> : is a JWT token generated using JWT Authentication Method
- <GROUP_ID>: is the group id to close
- open: (Optional)If true reopen an existing closed group
- <FIREBASE_PROJECT_ID>: it's the Firebase project id. Find it on Firebase Console
- <APP_ID>: It's the appid usend on multitenant environment. Use  "default" as default value

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
       https://us-central1-<project-id>.cloudfunctions.net/supportapi/<APP_ID>/groups/<GROUP_ID>?open=true/false
```

Example:

```
    curl -X PUT \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjAwOTZhZDZmZjdjMTIwMzc5MzFiMGM0Yzk4YWE4M2U2ZmFkOTNlMGEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY2hhdC12Mi1kZXYiLCJhdWQiOiJjaGF0LXYyLWRldiIsImF1dGhfdGltZSI6MTUzMDExOTQ4NywidXNlcl9pZCI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsInN1YiI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImlhdCI6MTUzMDExOTQ4NywiZXhwIjoxNTMwMTIzMDg3LCJlbWFpbCI6ImFuZHJlYS5sZW9AZnJvbnRpZXJlMjEuaXQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYW5kcmVhLmxlb0Bmcm9udGllcmUyMS5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.DlxO2AnvK5KB41p-U3fncDsGKK8grzLwAXFm0UnLnpwXpVmECNL7QVwraNcA1LO4GhwcMD5ddnNdjIwJoY3Zr0aPL3Km3o1MOPOL-iAMx41veYyb3xQ3d5ZJTqXuFvf1YodKqwBiBuxm_-QEEhMb-eONCSMGy20F_Opiyrqtq56wRwBNH1TNqj6MYSL3ytQ3z64KEaDqHUxPy7SGqDxCsjzphdy-g3U5YaembbOMm5QfwM7F2TvJA8R-Bo2sPk0Pl-aQkgGHTmf4aLR72byZjliYb_iu-Lg3A9QK38MmN47BrjXSIhbFV7p9zHT_-OXVDt6Cybs_Q0PHOx76ASB9yg' \
        https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/groups/support-group-LBqsOVQS59IZPWWY_me
```

## Subscribe/unsubscribe to receive emails

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -d '{"user_id": "<USER_ID>", "is_subscribed": "<IS_SUBSCRIBED>"}' \
      https://us-central1-<project-id>.cloudfunctions.net/api/<APP_ID>/users/<USER_ID>/settings/email?token=chat21-secret-orgAa,
```

Example:

```
  curl -X POST \
      -H 'Content-Type: application/json' \
      -d '{"user_id": "u2K7nLo2dTZEOYYTykrufN6BDF92", "is_subscribed": "true"}' \
      https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/users/u2K7nLo2dTZEOYYTykrufN6BDF92/settings/email?token=chat21-secret-orgAa,
```


## Webhook

* Enable webhook with ```firebase functions:config:set webhook.enabled=true```
* Set on new message webhook url with : ```firebase functions:config:set webhook.onmessage.url=http://localhost:3000/requests```


TODO

```
  curl -v -X GET \
      -H 'Content-Type: application/json' \
      'https://us-central1-chat-v2-dev.cloudfunctions.net/webhookapi/?hub.mode=subscribe&hub.verify_token=webhooksecret'
```
