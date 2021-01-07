'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const config = require('./config');

// const db = require("./db");
var db = functions.region(config.region).database;

if (config.databaseInstance) {
  console.log("databaseInstance", config.databaseInstance);
  db = db.instance(config.databaseInstance);
}
//console.log("push-notification.js loaded");

let webClickAction = "http://localhost:4200/";

if (functions.config().push && functions.config().push && functions.config().push.web.click_action) {
    webClickAction = functions.config().push.web.click_action;
    console.log('webClickAction', webClickAction);
}

//PUSH NOTIFICATION

 // invio di una singola notifica push ad un utente (direct)
 exports.sendNotification = db.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id; 
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;
    const message = data.val();

    var forcenotification = false;
    if (message.attributes && message.attributes.forcenotification) {
        forcenotification = message.attributes.forcenotification;
        console.log('forcenotification', forcenotification);
    }

    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
   
    // DEBUG console.log('message ' + JSON.stringify(message));


    // la funzione termina se si tenta di mandare la notifica ad un gruppo
    // if (message.channel_type!="direct") { //is a group message
    //     return 0;
    // }

//    DEBUG console.log("message.status : " + message.status);     
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    
    const promises = [];

    if (sender_id == "system"){
        console.log('not send push notification for system user');
        return 0;
    }

    if (sender_id == recipient_id) {
        console.log('not send push notification for the same user');
        //if sender is receiver, don't send notification
        return 0;
    }

    if (forcenotification == false) {

        if (message.sender == "system"){
            console.log('not send push notification for message with system as sender');
      
            return 0;
        }
      
    
        if (message.attributes && message.attributes.sendnotification==false) {
            console.log('not send push notification because sendnotification is false');
            return 0;
        }
    
    
        // if (functions.config().push && functions.config().push.disabled && functions.config().push.mute.for ) {
    
        if (recipient_id == "general_group" ) {
            console.log('dont send push notification for mute recipient');
            //if sender is receiver, don't send notification
            return 0;
        }

    } else {
        console.log('forcenotification is enabled');
    }
    

    const text = message.text;
    const messageTimestamp = JSON.stringify(message.timestamp);
    
    // DEBUG console.log(`--->/apps/${app_id}/users/${sender_id}/instanceId`);

    var path = `/apps/${app_id}/users/${sender_id}/instances`;

    return admin.database().ref(path).once('value').then(function(instancesIdAsFbObj) {
    // return admin.database().ref(`/apps/${app_id}/users/${sender_id}/instanceId`).once('value').then(function(instanceIdAsObj) {
      
        // console.log('instancesIdAsFbObj ' + instancesIdAsFbObj); 


        // Check if there are any device tokens.
        if (!instancesIdAsFbObj.hasChildren()) {
            return console.log('There are no notification tokens to send to.');
        }

        
        var instancesIdAsObj = instancesIdAsFbObj.val();

        const tokens = Object.keys(instancesIdAsObj);
        //console.log('tokens',tokens);



        
        for (var i = 0; i< tokens.length; i++ ){
        // instancesIdAsObj.forEach(function(instanceIdAsFbObj) {
            // console.log('instanceIdAsFbObj', instanceIdAsFbObj);

            

            const token = tokens[i];
            // console.log('token', token);


            var instanceIdAsObj = instancesIdAsObj[token];
            //console.log('instanceIdAsObj', instanceIdAsObj);

            const platform = instanceIdAsObj.platform;
            //console.log('platform', platform);


           
            var clickAction = "NEW_MESSAGE";
            var icon = "ic_notification_small";
            if (platform=="ionic" || platform.indexOf("web/")>-1){
                //clickAction="https://support.tiledesk.com/chat/?recipient="+message.sender;
                //clickAction="https://support.tiledesk.com/chat/#"+message.sender;
                //clickAction = "https://support.tiledesk.com/chat/";
                clickAction = webClickAction;
                icon = "/chat/assets/img/icon.png"
            }
            //console.log('clickAction', clickAction);


              //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
        const payload = {
            notification: {
                title: message.sender_fullname,
                body: text,
                icon : icon,
                sound : "default",
                click_action: clickAction,
                //click_action: "https://support.tiledesk.com/chat/",   // uncomment for intent filter in your custom project
                //click_action: "NEW_MESSAGE",   // uncomment for intent filter in your custom project
                
                // "content-available": "1",
                "content_available": "true",
                badge : "1"
            },
    
            data: {
                recipient: message.recipient,
                recipient_fullname: message.recipient_fullname,                    
                sender: message.sender,
                sender_fullname: message.sender_fullname,     
                channel_type: message.channel_type,
                text: text,
                //timestamp : JSON.stringify(admin.database.ServerValue.TIMESTAMP)
                timestamp : new Date().getTime().toString()
            }
            
            // ,webpush:{
            //     notification: {
            //         click_action: "https://support.tiledesk.com/chat/",
            //     }
            // }

        };
        
        // DEBUG console.log('payload ', payload);

         admin.messaging().sendToDevice(token, payload)
        // return admin.messaging().sendToDevice(tokens, payload)
        
             .then(function (response) {
            console.log("Push notification for message "+ JSON.stringify(message) + " with payload "+ JSON.stringify(payload) +" for token "+token+" and platform "+platform+" sent with response ",  JSON.stringify(response));
                        
            //console.log("Message.results[0]:", JSON.stringify(response.results[0]));


                        // For each message check if there was an error.
            // const tokensToRemove = [];

            response.results.forEach((result, index) => {
                const error = result.error;
                if (error) {

                //console.error('Failure sending notification to', tokens[index], error);
                console.error('Failure sending notification to', token, error);

                // Cleanup the tokens who are not registered anymore.
                    if (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered') {

                        var tokenToRemove = path+'/'+token;
                        // console.log('tokenToRemove',tokenToRemove);

                        console.error('Invalid regid. Removing it', token, ' from ',tokenToRemove,error);

                      

                       admin.database().ref(tokenToRemove).remove().then(function () {
                        console.log('tokenToRemove removed',tokenToRemove);
                       });

                            //ERRORE BUG
                        // tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());

                        
                    }

                    return error;


                }
            });

            // return Promise.all(tokensToRemove);

        })
        .catch(function (error) {
            console.error("Error sending message:", error);
            return 0;
        });






        }//end for

      
        
      

    });

    //return 0;

});





  
  
