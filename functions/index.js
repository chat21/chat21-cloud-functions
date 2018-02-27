const functions = require('firebase-functions');

var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);



const chatApi = require('./chat-api');

const chatHttpApi = require('./chat-http-api');
exports.api = functions.https.onRequest(chatHttpApi.api);



var supportChat = require('./chat-support');
exports.SupportCreateGroupForNewSupportRequest = supportChat.createGroupForNewSupportRequest;
exports.SupportCreateSupportConversationToFirestore = supportChat.createSupportConversationToFirestore;
exports.SupportSaveSupportMessagesToFirestore = supportChat.saveSupportMessagesToFirestore;
exports.SupportSaveSupportConversationToFirestore = supportChat.saveSupportConversationToFirestore;
exports.SupportAddMemberToReqFirestoreOnJoinGroup = supportChat.addMemberToReqFirestoreOnJoinGroup;
exports.SupportRemoveMemberToReqFirestoreOnLeaveGroup = supportChat.removeMemberToReqFirestoreOnLeaveGroup;
exports.SupportSaveMessagesToNodeJs = supportChat.saveMessagesToNodeJs;
exports.SupportBotreply = supportChat.botreply;
exports.SupportRemoveBotWhenTextContainsSlashAgent = supportChat.removeBotWhenTextContainsSlashAgent;


const chatSupportHttpApi = require('./chat-support-http-api');
exports.supportapi = functions.https.onRequest(chatSupportHttpApi.api);






//se metto {uid} prende utente corrente
exports.sendMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {

    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;
   
    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
  
   
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // console.log("message.status : " + message.status);     

    const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );
    
    var sendMessageToRecipients = false;
    //sendMessageToRecipient if i'm the sender (author) of the message and the message is not a self message
    //if (messageSender_id==sender_id && sender_id!=recipient_id){
    if (message.status==null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING){
        sendMessageToRecipients=true;
    }
    
    // console.log('sendMessageToRecipients ' + sendMessageToRecipients );

    if (sendMessageToRecipients==true){

        var updates = {};
   
        message.status = chatApi.CHAT_MESSAGE_STATUS.DELIVERED;                                        
        message.sender = sender_id;
        message.recipient = recipient_id;
        message.timestamp = admin.database.ServerValue.TIMESTAMP;
        

        if (message.channel_type==null || message.channel_type=="direct") {  //is a direct message
            message.channel_type = "direct"; 
            
            // DEBUG console.log('sending direct message ' + JSON.stringify(message) );

            return chatApi.sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id);            
        }else {//is a group message
            // DEBUG console.log('sending group message ' + JSON.stringify(message) );
             //send to group timeline
             chatApi.sendMessageToGroupTimeline(recipient_id, message, message_id, app_id);            
            return chatApi.sendGroupMessageToMembersTimeline(sender_id, recipient_id, message, message_id, app_id);
        }

    } else {
        // DEBUG console.log('Nothing to send because message.status is not chatApi.CHAT_MESSAGE_STATUS.SENDING  ');
    }

    return 0;
   
  });




  exports.insertMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );

    var fixedMessageFields = {};
    

    //set the status = 100 only if message.status is null. If message.status==200 (came form sendMessage) saveMessage not must modify the value
    // console.log("message.status : " + message.status);        
    if (message.status==null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING) {
        fixedMessageFields.status = chatApi.CHAT_MESSAGE_STATUS.SENT; //MSG_STATUS_RECEIVED_ON_PERSIONAL_TIMELINE
        fixedMessageFields.sender = sender_id; //for security set message.sender =  sender_id of the path
        fixedMessageFields.recipient = recipient_id; //for security set message.recipient =  recipient_id of the path
   //TODO se nn passo fullname di sender e recipient vado in contacts e prendo i nomi

       
        fixedMessageFields.timestamp = admin.database.ServerValue.TIMESTAMP;


        if (message.channel_type==null) {
          fixedMessageFields.channel_type = "direct";
         }

        console.log('inserting new message ' + JSON.stringify(message) + " updating with " + JSON.stringify(fixedMessageFields));

        return messageRef.update(fixedMessageFields);

    }else {
        // DEBUG console.log("It's not a SENDING message. Nothing to update for insert");
        return 0;
    }

   
   
  });
  




//se metto {uid} prende utente corrente
exports.createConversation = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;    
    const recipient_id = event.params.recipient_id;  
    const app_id = event.params.app_id;;
//    DEBUG  console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);

   
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    var conversation = {};
    // console.log("message.status : " + message.status);       

    if (message.status == null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING) {
        conversation.is_new = false;
        conversation.sender = sender_id; //message.sender could be null because saveMessage could be called after
        conversation.recipient = recipient_id;  ///message.recipient could be null because saveMessage could be called after  
    } else {
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

    if (message.channel_type!=null) {
        conversation.channel_type = message.channel_type;
    }else {
        conversation.channel_type = "direct";
    }
    

    //conversation.status = message.status;
    conversation.status = 2;
    conversation.timestamp = admin.database.ServerValue.TIMESTAMP;

    var path = '/apps/'+app_id+'/users/'+sender_id+'/conversations/'+recipient_id;

    console.log('creating conversation ' + JSON.stringify(conversation) + " to: "+ path);

    return admin.database().ref(path).set(conversation);
        
   
  });



//only for direct message
  exports.sendMessageReturnReceipt = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onUpdate(event => {
   
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
//    DEBUG  console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // const messageRef = event.data.ref;
    //console.log('messageRef ' + messageRef );

    // DEBUG console.log("message.status : " + message.status);      
    //console.log("message.is_group : " + message.is_group);      
    
    var eventSnapshot = event.data;
    var messageStatusSnapshot = eventSnapshot.child('status');
    if (
        (message.channel_type==null  || message.channel_type=="direct") //only for direct message
        && messageStatusSnapshot.changed() && message.status==chatApi.CHAT_MESSAGE_STATUS.RECEIVED
        ) {

        var path = '/apps/'+app_id+'/users/'+recipient_id+'/messages/'+sender_id + '/'+ message_id;

        console.log("sending return receipt for message " + JSON.stringify(message) + " to  : " + path );      

            //TODO controlla prima se il nodo su cui stai facendo l'update esiste altrimenti si crea una spazzatura
        return admin.database().ref(path).update({"status":chatApi.CHAT_MESSAGE_STATUS.RETURN_RECEIPT});
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

     return 0;
   });

  

   exports.sendInfoMessageOnGroupCreation = functions.database.ref('/apps/{app_id}/groups/{group_id}').onCreate(event => {
    
     const group_id = event.params.group_id;
     const app_id = event.params.app_id;;
     console.log("group_id: "+ group_id + ", app_id: " + app_id);
   
     const group = event.data.current.val();
     console.log("group",group);
     
     if (group_id.indexOf("support-group")>-1 ){
        console.log('dont send group creation message for support-group');
        return 0;
    }

     var sender_id =  "system";
     var sender_fullname = "Sistema";

    //  var message = {};
    //  message.status = chatApi.CHAT_MESSAGE_STATUS.DELIVERED;                                        
    //  message.sender = sender_id;
    //  message.recipient = group_id;
    //  message.recipient_fullname = group.name;
    //  message.timestamp = admin.database.ServerValue.TIMESTAMP;
    //  message.channel_type = "group";
    //  message.text = "Gruppo creato";
    //  message.type = "text";
    //  console.log("message",message);


     return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Gruppo creato", app_id);
    //  return sendGroupMessageToRecipientsTimeline(sender_id, group_id, message, "123456-DAMODIFICARE", app_id);
     
});

exports.duplicateTimelineOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate(event => {
    
     const member_id = event.params.member_id;
     const group_id = event.params.group_id;
     const app_id = event.params.app_id;;
    // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
     
     
     const fromPath = '/apps/'+app_id+'/messages/' + group_id;
    //  console.log("fromPath", fromPath);

     return admin.database().ref(fromPath).once('value').then(function(messagesSnap) {
        // console.log('messagesSnap ' + JSON.stringify(messagesSnap) );

            if (messagesSnap.val()!=null){
                var messages = messagesSnap.val();
                // console.log('messages ' + JSON.stringify(messages) );

                const toPath = '/apps/'+app_id+'/users/' + member_id+'/messages/'+group_id;
                // console.log("toPath", toPath);

                console.log('duplicating messages ' + JSON.stringify(messages) + " from : " + fromPath + " to " + toPath);
                return admin.database().ref(toPath).update(messages);
            } else {
                console.log("messages is null. Nothing to duplicate");
            }
        });
    
});


// exports.sendInfoMessageOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate(event => {
    
//      const member_id = event.params.member_id;
//      const group_id = event.params.group_id;
//      const app_id = event.params.app_id;;
//      console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
     
//      const member = event.data.current.val();
//      console.log("member", member);



//      var sender_id =  "system";

//      var message = {};
//      message.status = chatApi.CHAT_MESSAGE_STATUS.DELIVERED;                                        
//      message.sender = sender_id;
//      message.recipient = group_id;
//      message.recipient_fullname = group.name;
//      message.timestamp = admin.database.ServerValue.TIMESTAMP;
//      message.channel_type = "group";
//      message.text = member_id + "Membro aggiunto";
//      message.type = "text";
//      console.log("message", message);


//      return sendGroupMessageToRecipientsTimeline(sender_id, group_id, message, "123456-DAMODIFICARE", app_id);
    
// });












const pushNotificationsFunction = require('./push-notification');
exports.sendNotification = pushNotificationsFunction.sendNotification;
exports.sendEmailNotification = pushNotificationsFunction.sendEmailNotification;

// exports.sendNotification = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
       
//         const message_id = event.params.message_id;
//         const sender_id = event.params.sender_id; 
//         const recipient_id = event.params.recipient_id;
//         const app_id = event.params.app_id;
//         const message = event.data.current.val();

//   return pushNotificationsFunction.sendNotification(app_id, sender_id, recipient_id, message_id, message);
// });







// exports.sendNotificationToGroup = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {

//     const message_id = event.params.message_id;
//     const sender_id = event.params.sender_id; 
//     const recipient_id = event.params.recipient_id;
//     const app_id = event.params.app_id;
//     const message = event.data.current.val();

//     console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
   
//     console.log('message ' + JSON.stringify(message));


  
//     if (message.channel_type!="group") { 
//         console.log('it s not a message to a group. exit');
//         return 0;
//     }

//     console.log("message.status : " + message.status);     
//     if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
//         console.log('it s not a message to a recipient timeline with status= '+chatApi.CHAT_MESSAGE_STATUS.DELIVERED + ' . exit');
//         return 0;
//     }
  
//     const text = message.text;
//     //const messageTimestamp = JSON.stringify(message.timestamp);
//     const senderFullname = message.sender_fullname;
//     const recipient_group_id = recipient_id;
  
//     const promises = [];
  

//     admin.database().ref(`/apps/${app_id}/groups/${recipient_group_id}/members`).once('value', function(groupMembersSnapshot) {

//       var userInstanceIdPromises = [];
  
//       groupMembersSnapshot.forEach(function(groupMemberObj) {
//         // la mappa degli utenti Ã¨ nel formato Map<String, Integer>
//         // es. <test.monitoraggio, 1>
//         // dove: 
//         // String: Ã¨ il nome utente
//         // Integer: Ã¨ un valore di default utilizzato per poter create la mappa (scelta progettuale dettata dalle limitazioni di firebase)
//         var groupMemberUserId = groupMemberObj.key; // corrisponde allo userId dell'utente
//         console.log("groupMemberUserId: " + groupMemberUserId); 
  
//         if(groupMemberUserId !== sender_id) {
//           const userInstanceIdPromise = admin.database().ref(`/apps/${app_id}/users/${groupMemberUserId}/instanceId`).once('value');
//           userInstanceIdPromises.push(userInstanceIdPromise);
//         }
//       });
  
//       console.log("userInstanceIdPromises: " + JSON.stringify(userInstanceIdPromises));
  
//       Promise.all(userInstanceIdPromises).then(usersInstancesId => {

//         console.log("usersInstancesId: ",  JSON.stringify(usersInstancesId));
  
//         if (usersInstancesId.length==0) {
//             console.log("no members have an instanceId registered. usersInstancesId.length is 0. exit");
//             return 0;
//         }

//         var usersInstancesIdToSend = [];
  
//         usersInstancesId.forEach(function(userInstanceIdObj) {
//           // var usersId = instance.key; // corrisponde allo userId dell'utente
//           var userInstanceid = userInstanceIdObj.val(); // corrisponde al valore di defautl dell'utente
//           console.log("userInstanceid: " + userInstanceid);
  
//           if(userInstanceid !== null && userInstanceid !== undefined)
//              usersInstancesIdToSend.push(userInstanceid);
//           });
  
//           if (usersInstancesIdToSend.length==0){
//               console.log("usersInstancesIdToSend is 0. exit");
//               return 0;
//           }

//           console.log("usersInstancesIdToSend", usersInstancesIdToSend);

//           const nodeGroupRef = admin.database().ref(`/apps/${app_id}/groups/${recipient_group_id}`).once('value', function(groupSnapshot) {
//             //console.log("nodeGroupRef-> groupSnapshot: " + groupSnapshot.key + ", groupSnapshot.val: " + groupSnapshot.val());
  
//             var groupName = groupSnapshot.val().name;
//             console.log("groupName", groupName);

//             //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
//             const payload = {
//               notification: {
//                 title: groupName,
//                 body: senderFullname + ": "+ text,
//                 icon : "ic_notification_small",
//                 sound : "default",
//                 //click_action: "ACTION_DEFAULT_CHAT_INTENT", // uncomment for default intent filter in the sdk module
//                 click_action: "NEW_MESSAGE", // uncomment for intent filter in your custom project
//                 badge : "1"
//               },
  
//               data: {
//                 recipient: recipient_group_id,
//                 recipient_fullname: groupName,
//                 channel_type: message.channel_type,                
//                 sender: sender_id,
//                 sender_fullname: senderFullname,     
//                 text: text,
//                 timestamp : new Date().getTime().toString()
//               }
//             };
    
  
//             console.log("payload: " + JSON.stringify(payload));
  
//             admin.messaging().sendToDevice(usersInstancesIdToSend, payload)
//               .then(function (response) {
//                 console.log("Successfully sent message:", response);
//                 console.log("Successfully sent message: stringifiedresponse: ", JSON.stringify(response));
//                 console.log("Successfully sent message.results[0]:", response.results[0]);
//               })
//               .catch(function (error) {
//                 console.log("Error sending message:", error);
//               });

//             });
//         });
//       });

//       return 0;
//   });