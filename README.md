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
If the command fails, you may need to change npm permissions as described here https://docs.npmjs.com/getting-started/fixing-npm-permissions
* Login to Firebase CLI with ```firebase login```. More info here  https://firebase.google.com/docs/cli/
* Set up your Firebase project by running ```firebase use --add```, select your Project ID and follow the instructions.

You can find more info about Firebase Functions here https://firebase.google.com/docs/functions/get-started

# Deploy
* Clone or download this repo from github and run from command line:
```
cd functions 
npm install
```
* Deploy to Firebase using the following command: ```firebase deploy```

# Security (optional)
See the file database.rules.json to understand the databases security rules.


# Database structure

```
/apps/$appId/
            --> /users/$uid
                            --> /messages/$recipientId/$messageId
                                                                  --> {
                                                                        "channel_type" : "direct",                        // "direct" or "group"
                                                                        "language" : "it",
                                                                        "recipient" : "jjXVZKQSzMhOhhyIjSVOGqy4cMd2",    //recipient id
                                                                        "recipient_fullname" : "Stefano Depascalis",
                                                                        "sender" : "AHNfnoWiF7SDVy6iKVTmgsAjLOv2",        //sender id
                                                                        "sender_fullname" : "Andrea Leo",
                                                                        "status" : 150,
                                                                        "text" : "First message!!!",                     // text message
                                                                        "timestamp" : 1516288744310,
                                                                        "type" : "text"                                 // "text" or "image" or "file"                 
                                                                      }


                            --> /conversations/$recipientId
                                                             -->   {
                                                                    "channel_type" : "direct",
                                                                    "is_new" : true,
                                                                    "last_message_text" : "First message!!!",
                                                                    "recipient" : "jjXVZKQSzMhOhhyIjSVOGqy4cMd2",
                                                                    "recipient_fullname" : "Stefano Depascalis",
                                                                    "sender" : "AHNfnoWiF7SDVy6iKVTmgsAjLOv2",
                                                                    "sender_fullname" : "Andrea Leo",
                                                                    "status" : 2,
                                                                    "timestamp" : 1516291089368
                                                                    }
                            
                            
                            --> /contacts/$contactId       -->  {
                                                                "email" : "stefanodp91@gmail.com",
                                                                "firstname" : "Stefano",
                                                                "imageurl" : "",
                                                                "lastname" : "DePascalis",
                                                                "timestamp" : 1516276972508,
                                                                "uid" : "Ua1JIHK8VLVzsuRIPM2ai0xScNi2"
                                                                }


                            --> /groups/$groupId           --> {
                                                                "createdOn" : 1516278346153,
                                                                "members" : {
                                                                    "DQ6CmBKhRreONqnNvQdHVom5FEr1" : 1,
                                                                    "Ua1JIHK8VLVzsuRIPM2ai0xScNi2" : 1,
                                                                    "y4QN01LIgGPGnoV6ql07hwPAQg23" : 1,
                                                                    "yRzpS8hFulR2GnX5s85Ltj8xipv2" : 1
                                                                },
                                                                "name" : "First Group",
                                                                "owner" : "DQ6CmBKhRreONqnNvQdHVom5FEr1"
                                                                }
```                                                 




## Messages timeline
When a message is sent it's archived into the sender timeline. With a fan-out operation the message is placed into the recipient timeline.
