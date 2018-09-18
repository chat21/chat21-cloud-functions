'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');


//console.log("push-notification.js loaded");


//PUSH NOTIFICATION

 // invio di una singola notifica push ad un utente (direct)
 exports.sendNotification = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id; 
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;
    const message = data.val();

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

    if (sender_id == recipient_id) {
        console.log('not send push notification for the same user');
        //if sender is receiver, don't send notification
        return 0;
    }

    if (message.sender == "system"){
        console.log('not send push notification for message with system as sender');
  
        return 0;
    }
  
    if (sender_id == "system"){
        console.log('not send push notification for system user');
  
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

    const text = message.text;
    const messageTimestamp = JSON.stringify(message.timestamp);
    
    // DEBUG console.log(`--->/apps/${app_id}/users/${sender_id}/instanceId`);

    return admin.database().ref(`/apps/${app_id}/users/${sender_id}/instances`).once('value').then(function(instancesIdAsObj) {
    // return admin.database().ref(`/apps/${app_id}/users/${sender_id}/instanceId`).once('value').then(function(instanceIdAsObj) {
      
        console.log('instancesIdAsObj ' + instancesIdAsObj); 

        // var instancesId = instancesIdAsObj.val();

        // Check if there are any device tokens.
        if (!instancesIdAsObj.hasChildren()) {
            return console.log('There are no notification tokens to send to.');
        }

        const tokens = Object.keys(instancesIdAsObj.val());
        console.log('tokens',tokens);

        // DEBUG console.log('instanceId ' + instanceId); 
        
        //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
        const payload = {
            notification: {
            title: message.sender_fullname,
            body: text,
            icon : "ic_notification_small",
            sound : "default",
            //click_action: "ACTION_DEFAULT_CHAT_INTENT", // uncomment for default intent filter in the sdk module
            click_action: "NEW_MESSAGE",   // uncomment for intent filter in your custom project
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
        };
        
        // DEBUG console.log('payload ', payload);

        return admin.messaging().sendToDevice(tokens, payload)
             .then(function (response) {
            console.log("Push notification for message "+ JSON.stringify(message) + " with payload "+ JSON.stringify(payload) +" sent with response ",  JSON.stringify(response));
            
            // console.log("Successfully sent message: stringifiedresponse: ", JSON.stringify(response));
            console.log("Message.results[0]:", JSON.stringify(response.results[0]));


                        // For each message check if there was an error.
            const tokensToRemove = [];
            response.results.forEach((result, index) => {
                const error = result.error;
                if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens who are not registered anymore.
                    if (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered') {
                        tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                    }

                    return error;
                }
            });
            return Promise.all(tokensToRemove);

        })
        .catch(function (error) {
            console.log("Error sending message:", error);
            return 0;
        });

    });

    //return 0;

});





  
  
