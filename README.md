# Build
From the project folder run ```npm install```

# Deploy

From the project folder run :
* ```cd functions```
* ```firebase deploy --only functions```

# Security

Add these lines to Firebase Realtime Database Rules:

```

{
  "rules": {
    "apps": {
      "$app_id": {
        "contacts": {
          ".read": true,
      		".write": true,
        },
        "presence": {
          ".read": true,
      		".write": true,
        },
        "users":{
          "$uid":{
           	".read": "$uid === auth.uid",
      		  ".write": "$uid === auth.uid",
              "messages" : {
                "$message_id":{
                  ".validate": "newData.hasChildren(['type'])"
                }
              }
          }
        }
      }	
    }
  }
}

```