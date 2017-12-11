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
            // admin.database().ref('/apps/'+app_id+'/groups/'+recipient_id).once('value').then(function(groupSnapshot) {
            //     console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //     //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            //     if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
            //         var group_id = recipient_id;
            //         var groupMembers = groupSnapshot.val().members;
            //         var groupMembersAsArray = Object.keys(groupMembers);
            //         console.log('groupMembersAsArray ' + JSON.stringify(groupMembersAsArray) );
            //         //TODO check se sender è membro del gruppo
            //         // if (groupMembersAsArray.indexOf(sender_id)<0) {
            //         //     errore non sei membro del gruppo
            //         // }
            //         groupMembersAsArray.forEach(function(groupMember) {
            //             console.log('groupMember ' + groupMember);
            //             //DON'T send a message to the sender of the message 
            //             if (groupMember!=sender_id) { 
            //                 //here recipient_id is the group_id
            //                 updates['/'+groupMember+'/messages/'+group_id + '/'+ message_id] = message; 
            //             }
            //         });
            //     }else {
            //         console.log('group not found ' );
            //          //recipient_id is NOT a group
                                
            //     }


            //     console.log('updates ' + JSON.stringify(updates) );
                
            //     return admin.database().ref('/apps/'+app_id+'/users').update(updates);

            // });
        }else {//is a direct message
           
            return sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id);
             //updates['/'+recipient_id+'/messages/'+sender_id + '/'+ message_id] = message;   
            //console.log('updates ' + JSON.stringify(updates) );
            
            //return admin.database().ref('/apps/'+app_id+'/users').update(updates);

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
                console.log('Warning: Group '+ recipient_group_id +' not found ' );
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
    conversation.status = message.status;
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
  