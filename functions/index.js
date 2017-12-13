const functions = require('firebase-functions');

var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
/*
STATUS
0 GENERATO
100 SENDING
150 MESSAGE SENT to recipient inbox
200 RICEVUTO DAL DESTINATARIO (MESSAGE DELIVERED to recipient client app)
250 RICEVUTO DAL DESTINATARIO (RETURN RECEIPT from the recipient client app)
300 SEEN (VISTO)
*/
/*

curl -v -X POST \
-d '{"sender_fullname" : "Andrea Leo", "type": "TEXT", "recipient_fullname": "Andrea Sponziello","text":"ciao"}' \
 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_leo/messages/andrea_sponziello.json'

curl -v -X POST \
-d '{"sender_fullname" : "Andrea Sponziello", "type": "TEXT", "recipient_fullname": "Andrea Leo","text":"ciao2"}' \
 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_sponziello/messages/andrea_leo.json'

curl -v -X POST  -d '{"is_group":1, "sender_fullname" : "Andrea Sponziello", "type": "TEXT", "recipient_fullname": "Gruppo1","text":"ciao gruppo"}' 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_sponziello/messages/gruppo1.json'

curl -v -X POST  -d '{"is_group":1, "sender_fullname" : "Andrea Leo", "type": "TEXT", "recipient_fullname": "Gruppo1","text":"ciao gruppo2"}' 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_leo/messages/gruppo1.json'

*/

//se metto {uid} prende utente corrente
exports.sendMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {

    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
  
   
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    console.log("message.status : " + message.status);     

    const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );
    
    var sendMessageToRecipients = false;
    //sendMessageToRecipient if i'm the sender (author) of the message and the message is not a self message
    //if (messageSender_id==sender_id && sender_id!=recipient_id){
    if (message.status==null || message.status==0){
        sendMessageToRecipients=true;
    }
    
    console.log('sendMessageToRecipients ' + sendMessageToRecipients );

    if (sendMessageToRecipients==true){

        var updates = {};
   
        //set statuts = 150 (MSG_STATUS_SENT_TO_RECIPIENT_TIMELINE) of the message
        message.status = 150;                                        
        message.sender = sender_id;
        message.recipient = recipient_id;

        if (message.is_group==1) { //is a group message
            return sendGroupMessageToRecipientsTimeline(sender_id, recipient_id, message, message_id, app_id);
        }else {//is a direct message
           
            return sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id);
        }

    }

    return 0;
   
  });

  function sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id) {
    var updates = {};
    
    updates['/'+recipient_id+'/messages/'+sender_id + '/'+ message_id] = message;   
    console.log('updates ' + JSON.stringify(updates) );
    
    return admin.database().ref('/apps/'+app_id+'/users').update(updates);
  }

  function sendGroupMessageToRecipientsTimeline(sender_id, recipient_group_id, message, message_id, app_id) {
    var updates = {};
    
        admin.database().ref('/apps/'+app_id+'/groups/'+recipient_group_id).once('value').then(function(groupSnapshot) {
            console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                var groupMembers = groupSnapshot.val().members;
                var groupMembersAsArray = Object.keys(groupMembers);
                console.log('groupMembersAsArray ' + JSON.stringify(groupMembersAsArray) );
                //TODO check se sender è membro del gruppo
                // if (groupMembersAsArray.indexOf(sender_id)<0) {
                //     errore non sei membro del gruppo
                // }
                groupMembersAsArray.forEach(function(groupMember) {
                    console.log('groupMember ' + groupMember);
                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        //here recipient_id is the group_id
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
            }else {
                console.log('Warning: Group '+ recipient_group_id +' not found ' );
                //recipient_id is NOT a group
                            
            }

            console.log('updates ' + JSON.stringify(updates) );
            
            return admin.database().ref('/apps/'+app_id+'/users').update(updates);

        });
  }

  function sendBroadcastChannelMessageToRecipientsTimeline(sender_id, recipient_channel_id, message, message_id, app_id) {
    var updates = {};
    
        admin.database().ref('/apps/'+app_id+'/groups/'+recipient_channel_id).once('value').then(function(groupSnapshot) {
            console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                var isBroadcastGroup = groupSnapshot.val().broadcast;
                if (isBroadcastGroup==1) {

                }
                var groupMembers = groupSnapshot.val().members;
                var groupMembersAsArray = Object.keys(groupMembers);
                console.log('groupMembersAsArray ' + JSON.stringify(groupMembersAsArray) );
                //TODO check se sender è membro del gruppo
                // if (groupMembersAsArray.indexOf(sender_id)<0) {
                //     errore non sei membro del gruppo
                // }
                groupMembersAsArray.forEach(function(groupMember) {
                    console.log('groupMember ' + groupMember);
                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        //here recipient_id is the group_id
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
            }else {
                console.warn('Warning: Group '+ recipient_group_id +' not found ' );
                //recipient_id is NOT a group
                            
            }

            console.log('updates ' + JSON.stringify(updates) );
            
            return admin.database().ref('/apps/'+app_id+'/users').update(updates);

        });
  }

  exports.insertMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );

    var fixedMessageFields = {};
    
    fixedMessageFields.timestamp = admin.database.ServerValue.TIMESTAMP;

    //set the status = 100 only if message.status is null. If message.status==200 (came form sendMessage) saveMessage not must modify the value
    console.log("message.status : " + message.status);        
    if (message.status==null || message.status==0) {
        fixedMessageFields.status = 100; //MSG_STATUS_RECEIVED_ON_PERSIONAL_TIMELINE
        fixedMessageFields.sender = sender_id; //for security set message.sender =  sender_id of the path
        fixedMessageFields.recipient = recipient_id; //for security set message.recipient =  recipient_id of the path
   //TODO se nn passo fullname di sender e recipient vado in contacts e prendo i nomi
    }
    return messageRef.update(fixedMessageFields);
   
  });
  




//se metto {uid} prende utente corrente
exports.createConversation = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;    
    const recipient_id = event.params.recipient_id;  
    const app_id = event.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);

   
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    var conversation = {};
    console.log("message.status : " + message.status);       

    if (message.status == null || message.status==0) {
        conversation.is_new = false;
        conversation.sender = sender_id; //message.sender could be null because saveMessage could be called after
        conversation.recipient = recipient_id;  ///message.recipient could be null because saveMessage could be called after
    // }
    // else if (message.status == 150) {
    //     conversation.is_new = true;
    //     conversation.sender = recipient_id; //oppure lo puoi prendere dal messaggio che questa volta è valorizzato correttametente visto che viene da sendmessage
    //     conversation.recipient = sender_id;    
    // }else if (message.status == 175) {
    //     conversation.is_new = true;
    //     conversation.sender = recipient_id; //oppure lo puoi prendere dal messaggio che questa volta è valorizzato correttametente visto che viene da sendmessage
    //     conversation.recipient = sender_id;    
    }else {
        conversation.is_new = true;
        conversation.sender = message.sender;
        conversation.recipient = message.recipient;  
    }
   
    conversation.last_message_text = message.text;
    if (message.sender_fullname){ //message potrebbe non avere il sender fullname perche la app non l'ha passato. in questo caso se nn c'è il fullname anche la conversation non ha il fullname
        conversation.sender_fullname = message.sender_fullname;
    }
    if (message.recipient_fullname){        
        conversation.recipient_fullname = message.recipient_fullname;
    }
    //conversation.status = message.status;
    conversation.status = 2;
    conversation.timestamp = admin.database.ServerValue.TIMESTAMP;

    console.log('conversation ' + JSON.stringify(conversation));

    return admin.database().ref('/apps/'+app_id+'/users/'+sender_id+'/conversations/'+recipient_id).set(conversation);
        
   
  });



//only for direct message
  exports.sendMessageReturnReceipt = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onUpdate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );

    console.log("message.status : " + message.status);      
    console.log("message.is_group : " + message.is_group);      
    
    var eventSnapshot = event.data;
    var messageStatusSnapshot = eventSnapshot.child('status');
    if (
        (message.is_group==null  || message.is_group==0) //only for direct message
        && messageStatusSnapshot.changed() && message.status==200
        ) {


            //TODO controlla prima se il nodo su cui stai facendo l'update esiste altrimenti si crea una spazzatura
        return admin.database().ref('/apps/'+app_id+'/users/'+recipient_id+'/messages/'+sender_id + '/'+ message_id).update({"status":250});
    }

       
    
    return 0;
   
  });
  









  exports.fanOutGroup = functions.database.ref('/apps/{tenantId}/groups/{groupId}').onWrite(event => {
    
     //console.log('event.data: ' +  event.data);
   
     const tenantId = event.params.tenantId;
     console.log("tenantId : " + tenantId);
   
     const groupId = event.params.groupId;
     console.log("groupId : " + groupId);
   
   
     const group = event.data.current.val();
     
     console.log('group ' + JSON.stringify(group) );
   
    
     if (group && group.owner) {
           const owner = group.owner;
       console.log('owner ' + owner);
     }
   
    
     if (group && group.name) {
       const name = group.name;
       console.log('group name ' + name);
     }
   
     var members = null
     var membersAsArray = [];
     if (group && group.members) {
       members = group.members;
       //console.log('members ' + JSON.stringify(members));
       membersAsArray = Object.keys(members);
       console.log('membersAsArray ' + JSON.stringify(membersAsArray));
     }
   
   
     //POTREI ITERARE I PREVIES MEMBER E AGGIORNALI TUTTI CON IL NUOVO GRUPPO
    
     var previousMembers = null;
     var previousMembersAsArray = [];
     
     //var deletedMembers = [];
     if (event.data.previous.exists()) {
       previousMembers = event.data.previous.val().members;
       //console.log('previousMembers ' + JSON.stringify(previousMembers));
       previousMembersAsArray = Object.keys(previousMembers);
       console.log('previousMembersAsArray ' + JSON.stringify(previousMembersAsArray));
     }
   
   
     var membersToUpdate = membersAsArray.concat(previousMembersAsArray.filter(function (item) {
       return membersAsArray.indexOf(item) < 0;
      }));
     console.log('membersToUpdate ' + JSON.stringify(membersToUpdate));
     
   
     //aggiorno i gruppi replicati dei membri 
     if (membersToUpdate)  {
         //Object.keys(membersToUpdate).forEach(function(key) {
         membersToUpdate.forEach(function(memberToUpdate) {
         console.log('memberToUpdate ' + memberToUpdate);
   
           admin.database().ref('/apps/'+tenantId+'/users/'+memberToUpdate+'/groups/'+groupId).set(group).then(snapshot => {
               console.log("snapshot",snapshot);   
           });    
         });
     }
   });



 // invio di una singola notifica push ad un utente (direct)
exports.sendNotification = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
        const message_id = event.params.message_id;
        const sender_id = event.params.sender_id; 
        const recipient_id = event.params.recipient_id;
        const app_id = event.params.app_id;
        const message = event.data.current.val();

        console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
       
        console.log('message ' + JSON.stringify(message));
    
    
        // se esiste il parametro "recipientGroupId" allora si Ã¨ in presenza di un gruppo
        // la funzione termina se si tenta di mandare la notifica ad un gruppo
        if (message.is_group==1) { //is a group message
            return 0;
        }

        console.log("message.status : " + message.status);     
        if (message.status != 150){
            return 0;
        }
        
        const promises = [];
    
        if (sender_id == recipient_id) {
        console.log('not send push notification for the same user');
        //if sender is receiver, don't send notification
        return 0;
        }
    
        const text = message.text;
        const messageTimestamp = JSON.stringify(message.timestamp);
        const senderFullname = message.sender_fullname;
        
        const getInstanceIdPromise = admin.database().ref(`/apps/${app_id}/users/${recipient_id}/instanceId`).once('value');
        const getSenderUidPromise = admin.auth().getUser(sender_id);
    
        return Promise.all([getInstanceIdPromise, getSenderUidPromise]).then(results => {
        const instanceId = results[0].val(); // risultato di getInstanceIdPromise
        const sender = results[1];  // risutalto di getSenderUidPromise
    
        console.log('instanceId ' + instanceId);
        console.log('sender ' + sender);
        
        
        //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
        const payload = {
            notification: {
            title: senderFullname,
            body: text,
            icon : "ic_notification_small",
            sound : "default",
            click_action: "OPEN_MESSAGE_LIST_ACTIVITY", // for intent filter in your activity
            badge : "1"
        },
    
            data: {
                recipient: recipient_id,
                sender: sender_id,
                sender_fullname: senderFullname,     
                text: text,
                //timestamp : JSON.stringify(admin.database.ServerValue.TIMESTAMP)
                timestamp : new Date().getTime().toString()
            }
        };
        
        console.log('payload ', payload);

        admin.messaging().sendToDevice(instanceId, payload)
        .then(function (response) {
            console.log("Push notification sent with response ", response);
            
            // { results: [ { error: [Object] } ],
            // canonicalRegistrationTokenCount: 0,
            // failureCount: 1,
            // successCount: 0,
            // multicastId: 8632601518674035000 }

            console.log("Push notification sent with response as string ", JSON.stringify(response));
            //console.log("Successfully sent message.results[0]:", response.results[0]);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });
        });
});

// const pushNotificationsFunction = require('./push_notifications');

// exports.sendNotification = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
       
//         const message_id = event.params.message_id;
//         const sender_id = event.params.sender_id; 
//         const recipient_id = event.params.recipient_id;
//         const app_id = event.params.app_id;
//         const message = event.data.current.val();

//   return pushNotificationsFunction.sendNotification(app_id, sender_id, recipient_id, message_id, message);
// });







exports.sendNotificationToGroup = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {

    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;
    const message = event.data.current.val();

    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
   
    console.log('message ' + JSON.stringify(message));


  
    if (message.is_group!=1) { 
        console.log('it s not a message to a group. exit');
        return 0;
    }

    console.log("message.status : " + message.status);     
    if (message.status != 150){
        console.log('it s not a message to a recipient timeline with status=150. exit');
        return 0;
    }
  
    const text = message.text;
    //const messageTimestamp = JSON.stringify(message.timestamp);
    const senderFullname = message.sender_fullname;
    const recipient_group_id = recipient_id;
  
    const promises = [];
  

    admin.database().ref(`/apps/${app_id}/groups/${recipient_group_id}/members`).once('value', function(groupMembersSnapshot) {

      var userInstanceIdPromises = [];
  
      groupMembersSnapshot.forEach(function(groupMemberObj) {
        // la mappa degli utenti Ã¨ nel formato Map<String, Integer>
        // es. <test.monitoraggio, 1>
        // dove: 
        // String: Ã¨ il nome utente
        // Integer: Ã¨ un valore di default utilizzato per poter create la mappa (scelta progettuale dettata dalle limitazioni di firebase)
        var groupMemberUserId = groupMemberObj.key; // corrisponde allo userId dell'utente
        console.log("groupMemberUserId: " + groupMemberUserId); 
  
        if(groupMemberUserId !== sender_id) {
          const userInstanceIdPromise = admin.database().ref(`/apps/${app_id}/users/${groupMemberUserId}/instanceId`).once('value');
          userInstanceIdPromises.push(userInstanceIdPromise);
        }
      });
  
      console.log("userInstanceIdPromises: " + JSON.stringify(userInstanceIdPromises));
  
      Promise.all(userInstanceIdPromises).then(usersInstancesId => {

        console.log("usersInstancesId: ",  JSON.stringify(usersInstancesId));
  
        if (usersInstancesId.length==0) {
            console.log("no members have an instanceId registered. usersInstancesId.length is 0. exit");
            return 0;
        }

        var usersInstancesIdToSend = [];
  
        usersInstancesId.forEach(function(userInstanceIdObj) {
          // var usersId = instance.key; // corrisponde allo userId dell'utente
          var userInstanceid = userInstanceIdObj.val(); // corrisponde al valore di defautl dell'utente
          console.log("userInstanceid: " + userInstanceid);
  
          if(userInstanceid !== null && userInstanceid !== undefined)
             usersInstancesIdToSend.push(userInstanceid);
          });
  
          if (usersInstancesIdToSend.length==0){
              console.log("usersInstancesIdToSend is 0. exit");
              return 0;
          }

          console.log("usersInstancesIdToSend", usersInstancesIdToSend);

          const nodeGroupRef = admin.database().ref(`/apps/${app_id}/groups/${recipient_group_id}`).once('value', function(groupSnapshot) {
            //console.log("nodeGroupRef-> groupSnapshot: " + groupSnapshot.key + ", groupSnapshot.val: " + groupSnapshot.val());
  
            var groupName = groupSnapshot.val().name;
            console.log("groupName", groupName);

            //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
            const payload = {
              notification: {
                title: groupName,
                body: senderFullname + ": "+ text,
                icon : "ic_notification_small",
                sound : "default",
                click_action: "OPEN_MESSAGE_LIST_ACTIVITY", // for intent filter in your activity
                // badge : badgeCount.toString()
                badge : "1"
              },
  
              data: {
                group_id: recipient_group_id,
                group_name: groupName,
                sender: sender_id,
                sender_fullname: senderFullname,     
                text: text,
                timestamp : new Date().getTime().toString()
              }
            };
    
  
            console.log("payload: " + JSON.stringify(payload));
  
            admin.messaging().sendToDevice(usersInstancesIdToSend, payload)
              .then(function (response) {
                console.log("Successfully sent message:", response);
                console.log("Successfully sent message: stringifiedresponse: ", JSON.stringify(response));
                console.log("Successfully sent message.results[0]:", response.results[0]);
              })
              .catch(function (error) {
                console.log("Error sending message:", error);
              });

            });
        });
      });

      return 0;
  });