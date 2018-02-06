const functions = require('firebase-functions');

var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const CHAT_MESSAGE_STATUS = {
    FAILED : -100,
    SENDING : 0,
    SENT : 100, //saved into sender timeline
    DELIVERED : 150, //delivered to recipient timeline
    RECEIVED : 200, //received from the recipient client
    RETURN_RECEIPT: 250, //return receipt from the recipient client
    SEEN : 300 //seen

}

/*

How to send a message (direct and group) from curl. It's work if the authentication is disabled for Firebase.

curl -v -X POST \
-d '{"channel_type":"direct", "sender_fullname" : "Andrea Leo", "type": "TEXT", "recipient_fullname": "Andrea Sponziello","text":"ciao"}' \
 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_leo/messages/andrea_sponziello.json'

curl -v -X POST \
-d '{"channel_type":"direct", "sender_fullname" : "Andrea Sponziello", "type": "TEXT", "recipient_fullname": "Andrea Leo","text":"ciao2"}' \
 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_sponziello/messages/andrea_leo.json'

curl -v -X POST  -d '{"channel_type":"group", "sender_fullname" : "Andrea Sponziello", "type": "TEXT", "recipient_fullname": "Gruppo1","text":"ciao gruppo"}' 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_sponziello/messages/gruppo1.json'

curl -v -X POST  -d '{"channel_type":"group", "sender_fullname" : "Andrea Leo", "type": "TEXT", "recipient_fullname": "Gruppo1","text":"ciao gruppo2"}' 'https://chat-v2-dev.firebaseio.com/apps/chat/users/andrea_leo/messages/gruppo1.json'

*/

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
    if (message.status==null || message.status==CHAT_MESSAGE_STATUS.SENDING){
        sendMessageToRecipients=true;
    }
    
    // console.log('sendMessageToRecipients ' + sendMessageToRecipients );

    if (sendMessageToRecipients==true){

        var updates = {};
   
        message.status = CHAT_MESSAGE_STATUS.DELIVERED;                                        
        message.sender = sender_id;
        message.recipient = recipient_id;
        message.timestamp = admin.database.ServerValue.TIMESTAMP;
        

        if (message.channel_type==null || message.channel_type=="direct") {  //is a direct message
            message.channel_type = "direct"; 
            
            // DEBUG console.log('sending direct message ' + JSON.stringify(message) );

            return sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id);            
        }else {//is a group message
            // DEBUG console.log('sending group message ' + JSON.stringify(message) );
             //send to group timeline
             sendMessageToGroupTimeline(recipient_id, message, message_id, app_id);            
            return sendGroupMessageToMembersTimeline(sender_id, recipient_id, message, message_id, app_id);
        }

    } else {
        // DEBUG console.log('Nothing to send because message.status is not CHAT_MESSAGE_STATUS.SENDING  ');
    }

    return 0;
   
  });

  function sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id) {
    var updates = {};
    
    updates['/'+recipient_id+'/messages/'+sender_id + '/'+ message_id] = message;   
    // console.log('updates ' + JSON.stringify(updates) );
    
    console.log('sendDirectMessageToRecipientTimeline with message' + message + " TO: " + JSON.stringify(updates));           

    return admin.database().ref('/apps/'+app_id+'/users').update(updates);
  }


  function sendMessageToGroupTimeline(group_id, message, message_id, app_id) {
    var updates = {};
    
    updates['/messages/' + group_id + '/'+ message_id] = message;   
    // console.log('updates ' + JSON.stringify(updates) );
    
    console.log('sendMessageToGroupTimeline with message' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );           

    return admin.database().ref('/apps/'+app_id).update(updates);
  }


  function sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id) {

    var updates = {};
    
       return admin.database().ref('/apps/'+app_id+'/groups/'+recipient_group_id).once('value').then(function(groupSnapshot) {
            // DEBUG console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                var group = groupSnapshot.val();
                console.log('group ' + JSON.stringify(group) );

                var groupMembers = group.members;
                var groupMembersAsArray = Object.keys(groupMembers);
                // DEBUG console.log('groupMembers ' + JSON.stringify(groupMembersAsArray) );
               
               
                //TODO check se sender è membro del gruppo
                // if (groupMembersAsArray.indexOf(sender_id)<0) {
                //     errore non sei membro del gruppo
                // }


                groupMembersAsArray.forEach(function(groupMember) {
                    // console.log('groupMember ' + groupMember);

                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
            }else {
                console.log('Warning: Group '+ recipient_group_id +' not found ' );
                //recipient_id is NOT a group
                return 0;
            }

            console.log('sendGroupMessageToMembersTimeline with message ' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );
            
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

  function sendDirectMessage(sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id) {

    var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_id;
    // console.log("path", path);


    var message = {};
    // message.status = CHAT_MESSAGE_STATUS.SENDING;                                        
    message.sender = sender_id;
    message.sender_fullname = sender_fullname;
    message.recipient = recipient_id;
    message.recipient_fullname = recipient_fullname;
    // message.timestamp = admin.database.ServerValue.TIMESTAMP;
    message.channel_type = "direct";
    message.text = text;
    message.type = "text";

    console.log("sendDirectMessage with message " + JSON.stringify(message)  + " to " + path);
    return admin.database().ref(path).push(message);
  }


  function sendGroupMessage(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id) {

    var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_group_id;
    // console.log("path", path);


    var message = {};
    // message.status = CHAT_MESSAGE_STATUS.SENDING;                                        
    message.sender = sender_id;
    message.sender_fullname = sender_fullname;
    message.recipient = recipient_group_id;
    message.recipient_fullname = recipient_group_fullname;
    // message.timestamp = admin.database.ServerValue.TIMESTAMP;
    message.channel_type = "group";
    message.text = text;
    message.type = "text";

    console.log("sendGroupMessage with  message " + JSON.stringify(message)  + " to " + path);
    return admin.database().ref(path).push(message);   //send message to group timeline


    // var newMessageRef = admin.database().ref(path).push(message);   //send message to group timeline
    
    // var message_id = newMessageRef.key;

    // return sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id);


  }



  function createGroup(group_id, group_name, group_owner, group_members, app_id) {

    var path = '/apps/'+app_id+'/groups/'+group_id;
    // console.log("path", path);


    var group = {};
    group.name = group_name;
    group.owner = group_owner;
    group.members = group_members;
    group.iconURL = "NOICON";
    group.createdOn = admin.database.ServerValue.TIMESTAMP;
   
    console.log("creating group " + JSON.stringify(group) + " to "+ path);
    return admin.database().ref(path).set(group);
  }




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
    if (message.status==null || message.status==CHAT_MESSAGE_STATUS.SENDING) {
        fixedMessageFields.status = CHAT_MESSAGE_STATUS.SENT; //MSG_STATUS_RECEIVED_ON_PERSIONAL_TIMELINE
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

    if (message.status == null || message.status==CHAT_MESSAGE_STATUS.SENDING) {
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
        && messageStatusSnapshot.changed() && message.status==CHAT_MESSAGE_STATUS.RECEIVED
        ) {

        var path = '/apps/'+app_id+'/users/'+recipient_id+'/messages/'+sender_id + '/'+ message_id;

        console.log("sending return receipt for message " + JSON.stringify(message) + " to  : " + path );      

            //TODO controlla prima se il nodo su cui stai facendo l'update esiste altrimenti si crea una spazzatura
        return admin.database().ref(path).update({"status":CHAT_MESSAGE_STATUS.RETURN_RECEIPT});
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
     
     var sender_id =  "system";
     var sender_fullname = "Sistema";

    //  var message = {};
    //  message.status = CHAT_MESSAGE_STATUS.DELIVERED;                                        
    //  message.sender = sender_id;
    //  message.recipient = group_id;
    //  message.recipient_fullname = group.name;
    //  message.timestamp = admin.database.ServerValue.TIMESTAMP;
    //  message.channel_type = "group";
    //  message.text = "Gruppo creato";
    //  message.type = "text";
    //  console.log("message",message);


     return sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Gruppo creato", app_id);
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
//      message.status = CHAT_MESSAGE_STATUS.DELIVERED;                                        
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






// START SUPPORT

exports.createGroupForNewSupportRequest = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate(event => {
    // const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id );
    
    // const messageRef = event.data.ref;
    // console.log('messageRef ' + messageRef);

    // // const messageKey = event.data.current.key;
    // const messageKey = messageRef.key;
    // console.log('messageKey ' + messageKey);


    const messageWithMessageId = event.data.current.val();
    console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

    const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
    console.log('message ' + JSON.stringify(message));

    // console.log("message.status : " + message.status);     

    // if (message.status!=null || message.status!=CHAT_MESSAGE_STATUS.SENDING) {  //createGroupForNewSupportRequest must run for message
    if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
        console.log('exit for status');
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }


    console.log("new request!!! ");     
    
    var group_id = recipient_id; //recipient is the group id
    var group_name = "Support Group";
    var group_owner = "system";
    var group_members = {};
        group_members.system = 1;
        group_members[message.sender] = 1;  //add customer
        group_members["6qI3oekSwabW9w05JHd2SQlV2rz2"] = 1; //bot
        group_members["9EBA3VLhNKMFIVa0IOco82TkIzk1"] = 1;
        group_members["LmBT2IKjMzeZ3wqyU8up8KIRB6J3"] = 1;
        group_members["U4HL3GWjBsd8zLX4Vva0s7W2FN92"] = 1; //andrea.leo@frontiere21.it
        group_members["AHNfnoWiF7SDVy6iKVTmgsAjLOv2"] = 1; //andrea.leo2@frontiere21.it
        
        

    console.log("group_members", group_members);     


    return createGroup(group_id, group_name, group_owner, group_members, app_id);

});
//   exports.sendToSupport = functions.database.ref('/apps/{app_id}/users/jjXVZKQSzMhOhhyIjSVOGqy4cMd2/messages/{recipient_id}/{message_id}').onCreate(event => {
exports.saveSupportMessagesToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    const message_id = event.params.message_id;
  
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    console.log("message.status : " + message.status);     

    if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }


    console.log('it s a support message ');
    // var conversationId = recipient_id;
    // message.conversationId = conversationId;

    return admin.firestore().collection('messages').doc(message_id).set(message).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`Message with ID: ${message_id} created.`);
      });
    

});


exports.saveSupportConversationToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    const message_id = event.params.message_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    console.log('message ' + JSON.stringify(message));

    console.log("message.status : " + message.status);     

    if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    console.log('it s a support message ');

    // var conversationId = createConversationId(sender_id, recipient_id);
    // console.log('conversationId', conversationId);
    var groupId = recipient_id;

    return admin.firestore().collection('conversations').doc(groupId).set(message).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`Message with ID: ${groupId} created.`);
        });
    

});


exports.saveMemberToRequestFirestoreOnMemberJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate(event => {
    
    const member_id = event.params.member_id;
    const group_id = event.params.group_id;
    const app_id = event.params.app_id;;
   // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    
    var memberToAdd = {};
    memberToAdd[member_id] = true;
    console.log("memberToAdd ", memberToAdd);

   return admin.firestore().collection('conversations').doc(group_id).set(memberToAdd).then(writeResult => {
       // Send back a message that we've succesfully written the message
       console.log(`Member with ID: ${memberToAdd} added.`);
       });
   
});


    // function createConversationId(senderId, recipientId) {
    //     var conversationId = "";

    //     if (senderId<=recipientId){
    //         conversationId = senderId + "-" + recipientId;
    //     }else {
    //         conversationId = recipientId + "-" + senderId;
    //     }

    //     return conversationId;
    // }


    exports.saveMessagesToNodeJs = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
        const message_id = event.params.message_id;
        const sender_id = event.params.sender_id; 
        const recipient_id = event.params.recipient_id;
        const app_id = event.params.app_id;;
        console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
        
        const message = event.data.current.val();
        console.log('message ' + JSON.stringify(message));
    
        console.log("message.status : " + message.status);     
    
        if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
            return 0;
        }
    
        console.log('it s a message to nodejs ');
        
        return request({
            uri: "http://api.chat21.org/"+app_id+"/messages",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwic2VsZWN0ZWQiOnt9LCJnZXR0ZXJzIjp7fSwid2FzUG9wdWxhdGVkIjpmYWxzZSwiYWN0aXZlUGF0aHMiOnsicGF0aHMiOnsicGFzc3dvcmQiOiJpbml0IiwidXNlcm5hbWUiOiJpbml0IiwiX192IjoiaW5pdCIsIl9pZCI6ImluaXQifSwic3RhdGVzIjp7Imlnbm9yZSI6e30sImRlZmF1bHQiOnt9LCJpbml0Ijp7Il9fdiI6dHJ1ZSwicGFzc3dvcmQiOnRydWUsInVzZXJuYW1lIjp0cnVlLCJfaWQiOnRydWV9LCJtb2RpZnkiOnt9LCJyZXF1aXJlIjp7fX0sInN0YXRlTmFtZXMiOlsicmVxdWlyZSIsIm1vZGlmeSIsImluaXQiLCJkZWZhdWx0IiwiaWdub3JlIl19LCJlbWl0dGVyIjp7ImRvbWFpbiI6bnVsbCwiX2V2ZW50cyI6e30sIl9ldmVudHNDb3VudCI6MCwiX21heExpc3RlbmVycyI6MH19LCJpc05ldyI6ZmFsc2UsIl9kb2MiOnsiX192IjowLCJwYXNzd29yZCI6IiQyYSQxMCQ5SjlIUHZCL29NOUxGMFdVaEtZWHRPcmhTZ2wyOEY0ZmtZcGZUVGU3ZGdwRWFZRnFRQlFtdSIsInVzZXJuYW1lIjoiYW5kcmVhIiwiX2lkIjoiNWE2YzU4MzVjM2VjNjU5M2I0ZDk2YjRmIn0sImlhdCI6MTUxNzA1MDcyOX0.OafV9nTa_O48RkRGt6WoFW26ZNNw6AN-HCETkaT3oFU'
            },
            method: 'POST',
            json: true,
            body: message,
            //resolveWithFullResponse: true
            }).then(response => {
            if (response.statusCode >= 400) {
                throw new Error(`HTTP Error: ${response.statusCode}`);
            }
    
            console.log('SUCCESS! Posted', event.data.ref);        
            console.log('SUCCESS! response', response);           
            
            });
    
        
        
    });
  

const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();


//lasciare questo bot cosi come è per essere usato dalla app ios
exports.botreply = functions.database.ref('/apps/{app_id}/users/6qI3oekSwabW9w05JHd2SQlV2rz2/messages/{recipient_id}/{message_id}').onCreate(event => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = event.params.message_id;
    const sender_id = "6qI3oekSwabW9w05JHd2SQlV2rz2";
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
//    DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // DEBUG console.log("message.status : " + message.status);     

    if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (message.sender == "system"){  //evita che il bot risponda a messaggi di system (es: Gruppo Creato)
        return 0;
    }


    console.log('it s a message to bot ', message);
    
    return request({
        uri: "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/f486b8ed-b587-413a-948e-e02c9a129d12/generateAnswer",
        headers: {
            'Ocp-Apim-Subscription-Key': '59c2511b9825415eb4254ab8a7d4b094',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        json: true,
        body: {"question": message.text},
        //resolveWithFullResponse: true
        }).then(response => {
        if (response.statusCode >= 400) {
            throw new Error(`HTTP Error: ${response.statusCode}`);
        }

        console.log('SUCCESS! Posted', event.data.ref);        
        console.log('SUCCESS! response', response);

        var answer = entities.decode(response.answers[0].answer);
        console.log('answer', answer);    

        var question = response.answers[0].questions[0];
        console.log('question', question);        

        if (answer == "No good match found in the KB"){
            answer = "Non ho trovato una risposta nella knowledge base. Riformula la tua domanda";
        }
        var sender_fullname = "Bot";
        var recipient_group_fullname = message.recipient_fullname;
        // return sendDirectMessage(sender_id, message.recipient_fullname, recipient_id, message.sender_fullname, answer, app_id);            
        return sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, answer, app_id);

        });

    
    
});




// END SUPPORT






//PUSH NOTIFICATION

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
        if (message.channel_type!="direct") { //is a group message
            return 0;
        }

        console.log("message.status : " + message.status);     
        if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
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
        
        console.log(`--->/apps/${app_id}/users/${sender_id}/instanceId`);

        return admin.database().ref(`/apps/${app_id}/users/${sender_id}/instanceId`).once('value').then(function(instanceIdAsObj) {
          
            //console.log('instanceIdAsObj ' + instanceIdAsObj); 

            var instanceId = instanceIdAsObj.val();

            console.log('instanceId ' + instanceId); 
            
            //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
            const payload = {
                notification: {
                title: message.sender_fullname,
                body: text,
                icon : "ic_notification_small",
                sound : "default",
                //click_action: "ACTION_DEFAULT_CHAT_INTENT", // uncomment for default intent filter in the sdk module
                click_action: "ACTION_CUSTOM_CHAT_INTENT", // uncomment for intent filter in your custom project
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
            
            console.log('payload ', payload);

            return admin.messaging().sendToDevice(instanceId, payload)
                 .then(function (response) {
                console.log("Push notification sent with response ", response);
                
                console.log("Push notification sent with response as string ", JSON.stringify(response));


                //             // For each message check if there was an error.
                // const tokensToRemove = [];
                // response.results.forEach((result, index) => {
                //     const error = result.error;
                //     if (error) {
                //     console.error('Failure sending notification to', tokens[index], error);
                //     // Cleanup the tokens who are not registered anymore.
                //     if (error.code === 'messaging/invalid-registration-token' ||
                //         error.code === 'messaging/registration-token-not-registered') {
                //         tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                //     }
                //     }
                // });
                // return Promise.all(tokensToRemove);

            })
            .catch(function (error) {
                console.log("Error sending message:", error);
            });

        });

        //return 0;

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


  
    if (message.channel_type!="group") { 
        console.log('it s not a message to a group. exit');
        return 0;
    }

    console.log("message.status : " + message.status);     
    if (message.status != CHAT_MESSAGE_STATUS.DELIVERED){
        console.log('it s not a message to a recipient timeline with status= '+CHAT_MESSAGE_STATUS.DELIVERED + ' . exit');
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
                //click_action: "ACTION_DEFAULT_CHAT_INTENT", // uncomment for default intent filter in the sdk module
                click_action: "NEW_MESSAGE", // uncomment for intent filter in your custom project
                badge : "1"
              },
  
              data: {
                recipient: recipient_group_id,
                recipient_fullname: groupName,
                channel_type: message.channel_type,                
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