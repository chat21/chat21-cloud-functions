const functions = require('firebase-functions');

var admin = require('firebase-admin');
admin.initializeApp();



const chatApi = require('./chat-api');
// const chatSupportApi = require('./chat-support-api');

const chatHttpApi = require('./chat-http-api');
exports.api = functions.https.onRequest(chatHttpApi.api);

//let functions.config() = JSON.parse(process.env.FIREBASE_CONFIG);
//console.log("functions.config()", functions.config());


if (functions.config().support && functions.config().support.enabled) {
    const supportChat = require('./chat-support');
    exports.support = supportChat;

    const chatSupportHttpApi = require('./chat-support-http-api');
    exports.supportapi = functions.https.onRequest(chatSupportHttpApi.api);
}


if (functions.config().webhook && functions.config().webhook.enabled) {
    const chatWebHookHttpApi = require('./chat-webhook-http-api');
    exports.webhookapi = functions.https.onRequest(chatWebHookHttpApi.api);

    const chatWebHook = require('./chat-webhook');
    exports.webhook = chatWebHook;
}

  exports.insertAndSendMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
   
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id;
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
    console.log('message ' + JSON.stringify(message));

    const messageRef = data.ref;
    //console.log('messageRef ' + messageRef );

    

    //set the status = 100 only if message.status is null. If message.status==200 (came form sendMessage) saveMessage not must modify the value
    // console.log("message.status : " + message.status);        
    if (message.status==null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING) {
        return chatApi.insertAndSendMessageInternal(messageRef, message, sender_id, recipient_id, message_id, app_id);
    }else {
        // DEBUG console.log("It's not a SENDING message. Nothing to update for insert");
        return 0;
    }

   
   
  });
  




//se metto {uid} prende utente corrente
exports.createConversation = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
   
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id;    
    const recipient_id = context.params.recipient_id;  
    const app_id = context.params.app_id;;
//    DEBUG  console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);

   
    const message = data.val();
    console.log('message ' + JSON.stringify(message));

    if (message.attributes && message.attributes.updateconversation==false) {
        console.log('not update the conversation because updateconversation is false');
        return 0;
    }

    var conversation = {};
    // console.log("message.status : " + message.status);       

    if (message.status == null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING) { //i'm the sender
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
    
    if (message.type!=null) {
        conversation.type = message.type;
    }

    //conversation.status = message.status;
    conversation.status = 2;
    conversation.timestamp = admin.database.ServerValue.TIMESTAMP;

    //delete archived conv if present
//    chatApi.deleteArchivedConversation(sender_id, recipient_id, app_id);

    // chatApi.deleteArchivedConversationIfExists(sender_id, recipient_id, app_id).then(function(archived_conversation) {
    //     // console.log('archived_conversation', archived_conversation);
    //     if (archived_conversation && 
    //         archived_conversation.recipient.indexOf("support-group")>-1 &&
    //         (message.status == null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING)
    //         ){ //the message sender will reopen the support group
    //         console.log('reopening the support request', archived_conversation);
    //         if (functions.config().support && functions.config().support.enabled) {
    //             return chatSupportApi.openChat(archived_conversation.recipient, app_id);
    //         }
            
    //     }
    // });



    
    var path = '/apps/'+app_id+'/users/'+sender_id+'/conversations/'+recipient_id;

    console.log('creating conversation ' + JSON.stringify(conversation) + " to: "+ path);

    return admin.database().ref(path).set(conversation);
        
   
  });

  exports.deleteArchivedConversation = functions.database.ref('/apps/{app_id}/users/{sender_id}/conversations/{recipient_id}').onCreate((data, context) => {
    const sender_id = context.params.sender_id;    
    const recipient_id = context.params.recipient_id;  
    const app_id = context.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id);

   
    const conversation = data.val();
    console.log('conversation ' + JSON.stringify(conversation));

    return chatApi.deleteArchivedConversation(sender_id, recipient_id, app_id);

    
  });


//only for direct message
  exports.sendMessageReturnReceipt = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onUpdate((change, context) => {
   
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id;
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
//    DEBUG  console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = change.after.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // const messageRef = event.ref;
    //console.log('messageRef ' + messageRef );

    // DEBUG console.log("message.status : " + message.status);      
    //console.log("message.is_group : " + message.is_group);      
    



    //var messageStatusSnapshot = change.child('status');
    //console.log("messageStatusSnapshot : " + messageStatusSnapshot);      

    if (
        (message.channel_type==null  || message.channel_type=="direct") //only for direct message
        //TODO ATTENTION && messageStatusSnapshot.changed() 
        && message.status==chatApi.CHAT_MESSAGE_STATUS.RECEIVED
        ) {

        var path = '/apps/'+app_id+'/users/'+recipient_id+'/messages/'+sender_id + '/'+ message_id;

        console.log("sending return receipt for message " + JSON.stringify(message) + " to  : " + path );      

            //TODO controlla prima se il nodo su cui stai facendo l'update esiste altrimenti si crea una spazzatura
        return admin.database().ref(path).update({"status":chatApi.CHAT_MESSAGE_STATUS.RETURN_RECEIPT});
    }

       
    
    return 0;
   
  });
  









  exports.fanOutGroup = functions.database.ref('/apps/{tenantId}/groups/{groupId}').onWrite((data, context) => {
    
     //console.log('event: ' +  event);
   
     const tenantId = context.params.tenantId;
     console.log("tenantId : " + tenantId);
   
     const groupId = context.params.groupId;
     console.log("groupId : " + groupId);
   
   
     const group = data.after.val();
     
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
     if (data.before.exists()) {
       previousMembers = data.before.val().members;
       console.log('previousMembers ' + JSON.stringify(previousMembers));
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
   
         //COLDSTART PROBLEM RETURN??
           admin.database().ref('/apps/'+tenantId+'/users/'+memberToUpdate+'/groups/'+groupId).set(group).then(snapshot => {
               console.log("snapshot",snapshot);   
               return 0;
           });    
         });

         return 0;
     }

     return 0;
   });

  

   exports.sendInfoMessageOnGroupCreation = functions.database.ref('/apps/{app_id}/groups/{group_id}').onCreate((data, context) => {
    
     const group_id = context.params.group_id;
     const app_id = context.params.app_id;;
     console.log("group_id: "+ group_id + ", app_id: " + app_id);
   
     const group = data.val();
     console.log("group",group);
     
     if (group_id.indexOf("support-group")>-1 ){
        console.log('dont send group creation message for support-group');
        return 0;
     }

     var sender_id =  "system";
     var sender_fullname = "System";


     if (group && group.name) {
        return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Group created", app_id, {subtype:"info", updateconversation : true, messagelabel: {key: "GROUP_CREATED", parameters:{creator: group.owner}} });
        //  return sendGroupMessageToRecipientsTimeline(sender_id, group_id, message, "123456-DAMODIFICARE", app_id);
     }
     
  });


exports.duplicateTimelineOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
     const member_id = context.params.member_id;
     const group_id = context.params.group_id;
     const app_id = context.params.app_id;;
    // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
     
     
     const fromPath = '/apps/'+app_id+'/messages/' + group_id;
    //  console.log("fromPath", fromPath);

     return admin.database().ref(fromPath).orderByChild("timestamp").once('value').then(function(messageSnap) {
        // console.log('messagesSnap ' + JSON.stringify(messagesSnap) );

        //called multiple time for each message
            if (messageSnap.val()!=null){
                var message = messageSnap.val();
                console.log('message ' + JSON.stringify(message) );

                //disable notification
                // if (message.attributes) {
                //     message.attributes.sendnotification = false;
                // }

                //disable notification
                // var i = 0;
                // messages.forEach(function(message) {
                //     if (i>0) {
                //         if (message.attributes) {
                //             message.attributes.sendnotification = false;
                //         }
                //     }                          
                //     console.log('message ' + message);    
                // });
                
                const toPath = '/apps/'+app_id+'/users/' + member_id+'/messages/'+group_id;
                // console.log("toPath", toPath);

                console.log('duplicating message ' + JSON.stringify(message) + " from : " + fromPath + " to " + toPath);
                return admin.database().ref(toPath).update(message);
            } else {
                console.log("message is null. Nothing to duplicate");
                return 0;
            }
        });
    
});


exports.sendInfoMessageOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
     const member_id = context.params.member_id;
     const group_id = context.params.group_id;
     const app_id = context.params.app_id;;
     console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
     
     const member = data.val();
     console.log("member", member);


     if (member_id == "system"){
         return 0;
     }

     var updateconversation = true;

     if (group_id.indexOf("support-group")>-1 ){
        console.log('dont update conversation for group creation message for support-group');
         updateconversation = false;
     }

     var sender_id =  "system";
     var sender_fullname = "System";


     return chatApi.getGroupById(group_id, app_id).then(function (group) {
        console.log("group", group);
        if (group) {

            return chatApi.getContactById(member_id, app_id).then(function (contact) {
                console.log("contact", contact);
                var fullname = contact.firstname + " " + contact.lastname;
                console.log("fullname", fullname);
                return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, fullname + " added to group", app_id, {subtype:"info", "updateconversation" : updateconversation, messagelabel: {key: "MEMBER_JOINED_GROUP", parameters:{member_id: member_id, fullname:fullname} }});
            }, function (error) {
                return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "New member added to group", app_id, {subtype:"info", "updateconversation" : updateconversation, messagelabel: {key: "MEMBER_JOINED_GROUP", parameters:{member_id: member_id} }});
            });
    
        }
     });
    
});

if (functions.config().group && functions.config().group.general && functions.config().group.general.autojoin ) {
    exports.addToGeneralMembersOnContantCreation = functions.database.ref('/apps/{app_id}/contacts/{contact_id}').onCreate((data, context) => {
        
        const contact_id = context.params.contact_id;
        const app_id = context.params.app_id;;
        // DEBUG console.log("contact_id: "+ contact_id + ", app_id: " + app_id);
    
        var group_id = "general_group";

        return chatApi.getGroupById(group_id, app_id).then(function (group) {
            // DEBUG console.log("group", group);

            if (group){
                var groupMembersAsArray = Object.keys(group.members);
                if (groupMembersAsArray.indexOf(contact_id) == -1) {
                    console.log("contact_id is joinig general group");
                    return chatApi.joinGroup(contact_id, group_id, app_id);
                }else {
                    console.log("contact_id " + contact_id + " already present");
                }
            }else {
                console.log("error group is null");

            }
        }, function (error) {
            var group_members = {};
            group_members.system = 1;
            group_members[contact_id] = 1;

            console.log("general group not exist. Creating general group with members", group_members);

            return chatApi.createGroupWithId(group_id, "General", "system", group_members, app_id);
        });

    });
}








const pushNotificationsFunction = require('./push-notification');
exports.pushNotificationsFunction = pushNotificationsFunction;


if (functions.config().email && functions.config().email.enabled ) {
    const emailNotificationsFunction = require('./email-notification');
    exports.emailNotificationsFunction = emailNotificationsFunction;
}
