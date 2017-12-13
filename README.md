# Build
Run ```npm install```

# Deploy

Run 
* ```cd functions```
* ```firebase deploy --only functions```

# Security

Add these line to Firebase Realtime Database Rules:

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