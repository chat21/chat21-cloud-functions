const functions = require('firebase-functions');
const config = require('./config');
console.log("config", config);

var admin = require('firebase-admin');

// https://firebase.google.com/docs/database/admin/start#authenticate-with-admin-privileges
var firebaseConfig = {};
if (config.databaseURL) {
    firebaseConfig.databaseURL = config.databaseURL;
    console.log("firebaseConfig", firebaseConfig);
    admin.initializeApp(firebaseConfig);
} else {
    admin.initializeApp();
}


const removeEmpty = (obj) => 
  Object.entries(obj).forEach(([key, val]) => {
    if (val && typeof val === 'object') removeEmpty(val)
    else if (val == null) delete obj[key]
});

const chatApi = require('./chat-api');
// const chatSupportApi = require('./chat-support-api');

const chatHttpApi = require('./chat-http-api');


//console.log("index.js loaded");

exports.api = functions.region(config.region).https.onRequest(chatHttpApi.api);
//.runWith({minInstances: config.minInstances})

//let functions.region(config.region).config() = JSON.parse(process.env.FIREBASE_CONFIG);
//console.log("functions.region(config.region).config()", functions.region(config.region).config());


if (functions.config().support && functions.config().support.enabled && functions.config().support.enabled=="true") {
    const supportChat = require('./chat-support');
    exports.support = supportChat;
}
const chatSupportHttpApi = require('./chat-support-http-api');
//support api is used by close a conversation method
exports.supportapi = functions.region(config.region).https.onRequest(chatSupportHttpApi.api);



if (functions.config().webhook && functions.config().webhook.enabled && functions.config().webhook.enabled=="true") {

    const chatWebHook = require('./chat-webhook');
    exports.webhook = chatWebHook;
}


if (functions.config().fbwebhook && functions.config().fbwebhook.enabled && functions.config().fbwebhook.enabled=="true") {
    const chatFBWebHookHttpApi = require('./chat-fbwebhook-http-api');
    exports.fbwebhookapi = functions.region(config.region).https.onRequest(chatFBWebHookHttpApi.api);

    const chatFBWebHook = require('./chat-fbwebhook');
    exports.fbwebhook = chatFBWebHook;
}


// const db = require("./db");
var db = functions.region(config.region).database;

if (config.databaseInstance) {
  console.log("databaseInstance", config.databaseInstance);
  db = db.instance(config.databaseInstance);
}


exports.insertAndSendMessage = db.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id;
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
    console.log('message ' + JSON.stringify(message));

    const messageRef = data.ref;
    //console.log('messageRef ' + messageRef );

    
    const authVar = context.auth; // Auth information for the user.
    console.log('authVar ' + JSON.stringify(authVar) );
    const authType = context.authType; // Permissions level for the user.
    console.log('authType ' + JSON.stringify(authType) );

   

    // elimina
    if (authVar && authType) {//First argument contains undefined in property 'apps.bbb2.messages.-LPkg7hrcixsLUSu7DAz.-LPkg8BKMeO-6AWEgNxy.senderAuthInfo.authVar'
        //Object.keys(authVar).forEach(key => authVar[key] === undefined ? delete userRecord[key] : '');
        message.senderAuthInfo = {"authVar":authVar, "authType": authType};
        //message.senderAuthInfo = {"authVar":removeEmpty(authVar), "authType": authType};
    }
    
    


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
exports.createConversation = db.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
   
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id;    
    const recipient_id = context.params.recipient_id;  
    const app_id = context.params.app_id;
    // console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
  

    const arrived_message = data.val();
    //console.log('arrived message ' + JSON.stringify(arrived_message));

    return chatApi.getLastMessage(sender_id, recipient_id, app_id).then(function(lastmessage) {
        //  console.log('message',message);
        //  console.log('message.timestamp',message.timestamp);
        // console.log('arrived_message.timestamp',arrived_message.timestamp);
        if (lastmessage.timestamp && arrived_message.timestamp 
            && arrived_message.attributes.updateconversation!=false //arriva un messaggio che deve aggiornare la conversazione
            && lastmessage.attributes.updateconversation!=false //last message è un messaggio che deve aggiornare la conversazione
            && lastmessage.timestamp > arrived_message.timestamp) {
            console.log('lastmessage.timestamp',lastmessage.timestamp, "greater than arrived_message", arrived_message.timestamp);
            return chatApi.createConversationInternal(sender_id, recipient_id, app_id, lastmessage);
        }else {
            //console.log('message.timestamp',message.timestamp, "<= than arrived_message", arrived_message.timestamp);
            return chatApi.createConversationInternal(sender_id, recipient_id, app_id, arrived_message);
        }
        
    }).catch(function(error) {
        console.log('catch arrived_message',arrived_message);
        return chatApi.createConversationInternal(sender_id, recipient_id, app_id, arrived_message);
    })
   
  });

  exports.deleteArchivedConversation = db.ref('/apps/{app_id}/users/{sender_id}/conversations/{recipient_id}').onCreate((data, context) => {
    const sender_id = context.params.sender_id;    
    const recipient_id = context.params.recipient_id;  
    const app_id = context.params.app_id;;
    console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id);

   
    const conversation = data.val();
    console.log('conversation ' + JSON.stringify(conversation));

    // return chatApi.deleteArchivedConversationIfExists(sender_id, recipient_id, app_id).then(function(deletedConversation) {
    //     if (deletedConversation && deletedConversation.attributes) {
    //         //merge archived conv attributes to standard conv attributes
    //         console.log('deletedConversation.attributes ' + JSON.stringify(deletedConversation.attributes));
    //         chatApi.updateAttributesConversation(sender_id, recipient_id, app_id, deletedConversation.attributes);
    //     }
    // });

    return chatApi.deleteArchivedConversation(sender_id, recipient_id, app_id);

    

    
  });


//only for direct message
  exports.sendMessageReturnReceipt = db.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onUpdate((change, context) => {
   
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
  









  exports.fanOutGroup = db.ref('/apps/{tenantId}/groups/{groupId}').onWrite((data, context) => {
    
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

  

   exports.sendInfoMessageOnGroupCreation = db.ref('/apps/{app_id}/groups/{group_id}').onCreate((data, context) => {
    
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


exports.duplicateTimelineOnJoinGroup = db.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
     const member_id = context.params.member_id;
     const group_id = context.params.group_id;
     const app_id = context.params.app_id;;
    // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
     
     
    return chatApi.copyGroupMessagesToUserTimeline(group_id, member_id, app_id);
    
});


exports.duplicateTimelineOnJoinGroupForInvitedMembers = db.ref('/apps/{app_id}/groups/{group_id}/invited_members/{member_id}').onCreate((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
   // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    
    
   return chatApi.copyGroupMessagesToUserTimeline(group_id, member_id, app_id);
});



exports.sendInfoMessageOnJoinGroup = db.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
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
     var forcenotification = true;

     if (group_id.indexOf("support-group")>-1 ){
        console.log('dont update conversation for group creation message for support-group');
         updateconversation = false;
         forcenotification = false;   //dont force notification for MEMBER_JOINED_GROUP for support-group
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
                return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, fullname + " added to group", app_id, {subtype:"info", "updateconversation" : updateconversation, forcenotification: forcenotification, messagelabel: {key: "MEMBER_JOINED_GROUP", parameters:{member_id: member_id, fullname:fullname, firstname: contact.firstname,lastname: contact.lastname} }});
            }, function (error) {
            
                var parameters = {member_id: member_id};
                
                if (member_id.startsWith("bot_")) { 
                    
                    parameters["fullname"] = "Bot";
                    parameters["firstname"] = contact.firstname;
                    parameters["lastname"] = contact.lastname;
                    
                    console.log("parameters", parameters);
    
                    return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "New member added to group", app_id, {subtype:"info", "updateconversation" : updateconversation, forcenotification: forcenotification, messagelabel: {key: "MEMBER_JOINED_GROUP",  parameters}});


                } else {

                    if (group.attributes) {
                        var prechatFullname = "";
                        if (group.attributes.userName) {
                            prechatFullname = group.attributes.userName;
                        }
                        if (group.attributes.userEmail) {
                            prechatFullname = prechatFullname + " (" + group.attributes.userEmail + ")";
                        }
                        if (prechatFullname.length>0) {
                            parameters["fullname"] = prechatFullname;
                        }
                    }
    
                    console.log("parameters", parameters);
    
                    return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "New member added to group", app_id, {subtype:"info", "updateconversation" : updateconversation, messagelabel: {key: "MEMBER_JOINED_GROUP",  parameters}});

                }
                
                
            });
    
        }
     });
    
});


//DEPRECATED UNUSED. REMOVE IT
exports.saveMemberInfoOnJoinGroup = db.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
    console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    
    // const member = data.val();
    // console.log("member", member);

    return chatApi.saveMemberInfo(member_id, group_id, app_id);

});
//DEPRECATED UNUSED. REMOVE IT
exports.removeMemberInfoOnLeaveGroup = db.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onDelete((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
    console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);

   return chatApi.deleteMemberInfo(member_id, group_id, app_id);
});



if (functions.config().group && functions.config().group.general && functions.config().group.general.autojoin ) {
    exports.addToGeneralMembersOnContantCreation = db.ref('/apps/{app_id}/contacts/{contact_id}').onCreate((data, context) => {
        
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



const thumbnailFunction = require('./chat-thumbnail');
exports.thumbnailFunction = thumbnailFunction;
