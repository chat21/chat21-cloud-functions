

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const chatSupportApi = require('./chat-support-api');
const chatBotSupportApi = require('./chat-bot-support-api');

const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const chatUtil = require('./chat-util');



//const http = require('http');
//const agent = new http.Agent({keepAlive: true});
// attenzione modificato questo ma non portato in produzione 
const https = require('https');
const agent = new https.Agent({keepAlive: true});



//console.log("chat-support.js loaded");


exports.createGroupForNewSupportRequest = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate((data, context) => {
    // exports.createGroupForNewSupportRequest = functions.database.ref('/DEPRECATED/apps/{app_id}/messages/{recipient_id}').onCreate((data, context) => {

    // const sender_id = context.params.sender_id; 
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id );
    
    // const messageRef = data.ref;
    // console.log('messageRef ' + messageRef);

    // // const messageKey = data.current.key;
    // const messageKey = messageRef.key;
    // console.log('messageKey ' + messageKey);


    const messageWithMessageId = data.val();
    console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

    const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
    console.log('message ' + JSON.stringify(message));

    // console.log("message.status : " + message.status);     

    // if (message.status!=null || message.status!=chatApi.CHAT_MESSAGE_STATUS.SENDING) {  //createGroupForNewSupportRequest must run for message
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        console.log('exit for status');
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    var group_id = recipient_id; //recipient is the group id



    console.log("creating new request for message ", JSON.stringify(message));     
    


    chatApi.typing("system", group_id, app_id);


    // var projectid = message.projectid;
    // console.log('projectId',projectid);


    var departmentid = "default";
    var projectid = undefined;

    if (message.attributes) {

        if (message.attributes.departmentId && !message.attributes.departmentId==""){
            departmentid =  message.attributes.departmentId;
        }
        if (message.attributes.projectId) {
            projectid = message.attributes.projectId;
        }     
    } 

    if (!projectid) { //BACKcompatibility
        projectid = message.projectid
    }
    console.log('departmentid', departmentid);
    console.log('projectId',projectid);






    var group_members = {};
    var assigned_operator_id;
    var idBot;
    var agents = [];
    var availableAgents= [];
    var availableAgentsCount= 0;

    return chatSupportApi.getDepartmentOperator(projectid, departmentid,agent, false).then(response => {

        idBot = response.idBot;
        console.log("idBot", idBot);     

        assigned_operator_id= response.assigned_operator_id;
        console.log("assigned_operator_id", assigned_operator_id);     

        agents = response.agents;
        console.log("agents", agents);     

        availableAgents= response.availableAgents;
        console.log("availableAgents", availableAgents);     

        availableAgentsCount = response.availableAgentsCount;
        console.log("availableAgentsCount", availableAgentsCount);     

        departmentid = response.departmentid;
        console.log("departmentid", departmentid);     

        if (assigned_operator_id) {
            group_members[assigned_operator_id] = 1;
        }
        console.log("group_members", group_members);     


        // var ip = req.headers['x-forwarded-for'] || 
        //     req.connection.remoteAddress || 
        //     req.socket.remoteAddress ||
        //     (req.connection.socket ? req.connection.socket.remoteAddress : null);

        return createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
            departmentid, agents, availableAgents, assigned_operator_id, projectid);
    }).catch(error => {

        console.error("catch", error);     

        return createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
            departmentid, agents, availableAgents, assigned_operator_id, projectid);
    });

});

function createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
    departmentid, agents, availableAgents, assigned_operator_id, projectid) {
    
    if (!idBot) {
        if (availableAgentsCount==0) {
            chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"} });
        }else {
            chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}});
        }
    }

    chatApi.stopTyping("system", group_id, app_id);


    //pooled invite other members
    var invited_members;

    // if (!assigned_operator_id) {
    //     if (availableAgentsCount>0 ){
    //         invited_members = {};
    //         availableAgents.forEach(function(aAgent) {
    //             invited_members[aAgent.id_user] = 1;
    //         });
    //     }
        
    // }
    //end pooled

    console.debug("invited_members", invited_members);     

    return Promise.all([
        createNewGroup(message, group_id, group_members, app_id, projectid, invited_members), 
        saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id, projectid),
        chatSupportApi.sendEmail(group_id, assigned_operator_id, projectid, message)
    ]);

    // createNewGroup(message, group_id, group_members, app_id);
    // return saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id);

}



function createNewGroup(message, group_id, group_members, app_id, projectid, invited_members) {
    // var group_name = " Support Group";
    var group_name = "";

    if (message.sender_fullname) {
        group_name = message.sender_fullname;
    }else {
        group_name = "Guest";

    }

    var group_owner = "system";
    group_members.system = 1;
    group_members[message.sender] = 1;  //the requester user              



    console.log("group_members", group_members);     

    var gAttributes = {};

    if (message.attributes) {
        gAttributes =  message.attributes;
    }
     if (message.senderAuthInfo) {
        gAttributes["senderAuthInfo"] = message.senderAuthInfo;   
     }

     gAttributes["requester_id"] = message.sender;


     //TODO implement the case 
    

    // if (gAttributes) { //add projectid to the group attributes (for webhook)
    //     gAttributes.projectid = projectid;
    // }
    console.log('gAttributes', gAttributes);

    
    return chatApi.createGroupWithId(group_id, group_name, group_owner, group_members, app_id, gAttributes, invited_members);

}

function saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id, projectid) {
        //creare firestore conversation
        var newRequest = {};
        newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
        newRequest.requester_id = message.sender;
        newRequest.requester_fullname = message.sender_fullname;
        newRequest.first_text = message.text;
        newRequest.departmentid = departmentid;

        newRequest.members = group_members;
        newRequest.membersCount = Object.keys(group_members).length;
        newRequest.agents = agents;
        newRequest.availableAgents = availableAgents;

        if (assigned_operator_id) {
            newRequest.assigned_operator_id = assigned_operator_id;
        }

        if (newRequest.membersCount==2){
            newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
        }else {
            newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.SERVED;
        }

        if (message.attributes != null) {
            newRequest.attributes = message.attributes;
        }

        newRequest.app_id = app_id;

        newRequest.first_message = message;
        
        console.log('newRequest', newRequest);


       
        return admin.firestore().collection('conversations').doc(group_id).set(newRequest, { merge: true })
        // .then(writeResult => {
        //     // Send back a message that we've succesfully written the message
        //     console.log(`Conversation with ID: ${group_id} created with value.`, newRequest);
        //     return 0;
        // });

    //Save to mongo

    
    // if (functions.config().support.storetobackend && functions.config().support.storetobackend.enabled && functions.config().support.storetobackend.enabled=="true") {
    //     console.log('support.storetobackend', 'enabled');

    //     return chatSupportApi.createRequest(projectid, newRequest);
       
    // }else {
    //     console.log('support.storetobackend', 'disabled');
    // }
    

}




    // https://firebase.google.com/docs/firestore/manage-data/transactions
function updateMembersCount(group_id, operation, app_id) {

    // DEBUG console.log(`updatingMembersCount  for group ${group_id} with operation  ${operation}.`);

       //update membersCount
       var conversationDocRef = admin.firestore().collection("conversations").doc(group_id);
    
    
       return admin.firestore().runTransaction(function(transaction) {
           // This code may get re-run multiple times if there are conflicts.
           return transaction.get(conversationDocRef).then(function(conversationDoc) {
               if (!conversationDoc.exists) {
                   //throw "Document does not exist!";
                   console.error("Document does not exist!");
               }
   
               var oldMemberCount = 0; //default is 2
               if (conversationDoc.data().membersCount!=null){
                   oldMemberCount=conversationDoc.data().membersCount;
                   console.log("oldMemberCount", oldMemberCount);

               }
   
               var newMembersCount = oldMemberCount + operation;
               console.log("newMembersCount", newMembersCount);

               var updates = {};    

               if (newMembersCount<=1) {
                updates.support_status = chatSupportApi.CHATSUPPORT_STATUS.CLOSED; 
               } else if (newMembersCount==2) {
                updates.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED; 
               } else {  //>2
                updates.support_status = chatSupportApi.CHATSUPPORT_STATUS.SERVED; 
                
                    if (newMembersCount> 3) {
                        chatSupportApi.removeBotFromGroupMember(group_id, app_id);
                    }

               } 

               updates.membersCount = newMembersCount;
   
               transaction.update(conversationDocRef, updates);

               return newMembersCount;
           });
       }).then(function(membersCount) {
           console.log("Transaction successfully committed with membersCount: ", membersCount);
           return 0;
       }).catch(function(error) {
           console.log("Transaction failed: ", error);
           return error;
       });
   
}
exports.addMemberToReqFirestoreOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
   // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    

   if (group_id.indexOf("support-group")==-1 ){
    console.log('exit for recipient');
    return 0;
   }

    // DEBUG console.log('it s a support message ');

   

    var memberToAdd = {};
    memberToAdd[member_id] = true;
    // DEBUG console.log("memberToAdd ", memberToAdd);


    var dataToUpdate = {};
    dataToUpdate.members = memberToAdd;
//    DEBUG  console.log("dataToUpdate ", dataToUpdate);


   return admin.firestore().collection("conversations").doc(group_id).get().then(docConvRef => {
        if (docConvRef.exists) {

            // console.log("docConvRef", docConvRef);
                
                var docConv = docConvRef.data();

                console.log("docConv.members", docConv.members);

               
                if (!docConv.members.hasOwnProperty(member_id)) {

                //if (!docConv.members || !docConv.members.hasOwnProperty(member_id)) {
                    //generate the bot removing BUG becasue mombers count become 4 and bot is removed. TODO with !docConv.members

                    console.log(member_id + " not present into docConv");

                        return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
                
                            
                            // DEBUG console.log("writeResult ", writeResult);
                    
                                console.log(`Member with ID: ${JSON.stringify(memberToAdd)} added to ${group_id}.`);
                    
                                return updateMembersCount(group_id, 1, app_id);
                        });

                    // });
                } else {
                    console.log(member_id + " already present into docConv");
                    return 0;

                }
        }else {
            return 0;
        }
//   
    });
});


exports.removeMemberToReqFirestoreOnLeaveGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onDelete((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
   // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    

   if (group_id.indexOf("support-group")==-1 ){
    console.log('exit for recipient');
    return 0;
   }

    console.log('it s a support message ');

   

    // var memberToRemove = {};
    // memberToRemove[member_id] = true;
    // console.log("memberToRemove ", memberToRemove);


    // var dataToUpdate = {};
    // dataToUpdate.members = member_id;
    // console.log("dataToUpdate ", dataToUpdate);


     return admin.firestore().collection('conversations').doc(group_id).update({
        ['members.' + member_id]: FieldValue.delete()
      }).then(writeResult => {
       // Send back a message that we've succesfully written the message
       console.log(`Member with ID: ${JSON.stringify(member_id)} removed from ${group_id}.`);

       return updateMembersCount(group_id, -1, app_id);
    });
   
});





exports.saveSupportConversationToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    const message_id = context.params.message_id;
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
    console.log('message ' + JSON.stringify(message));

    console.log("message.status : " + message.status);     

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    console.log('it s a support message ');

    var groupId = recipient_id;


    //Don't overrride initial conversations.attributes created with the new request
    delete message.attributes;

   console.log('message ' + JSON.stringify(message));

    return admin.firestore().collection('conversations').doc(groupId).set(message, { merge: true });
    
    //     .then(writeResult => {
    //     // Send back a message that we've succesfully written the message
    //     console.log(`Conversation with ID: ${groupId} saved.`);
    //   });
    

});



    exports.saveSupportMessagesToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
        const message_id = context.params.message_id;
      
        const recipient_id = context.params.recipient_id;
        const app_id = context.params.app_id;;
        console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
        
        const message = data.val();
        console.log('message ' + JSON.stringify(message));
    
        console.log("message.status : " + message.status);     
    
        if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
            return 0;
        }
        if (recipient_id.indexOf("support-group")==-1 ){
            console.log('exit for recipient');
            return 0;
        }
    
    
        console.log('it s a support message ');
       
    
        return admin.firestore().collection('messages').doc(message_id).set(message);
        // .then(writeResult => {
        //     // Send back a message that we've succesfully written the message
        //     console.log(`Message with ID: ${message_id} created.`);
        //   });
        
    
    });


    // var path = '/apps/'+app_id+'/users/'+user_id+'/archived_conversations/'+recipient_id;
exports.reopenSupportRequest = functions.database.ref('/apps/{app_id}/users/{user_id}/archived_conversations/{recipient_id}').onDelete((snap, context) => {
    const app_id = context.params.app_id;
    const user_id = context.params.user_id;
    const recipient_id = context.params.recipient_id;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", user_id: " + user_id);

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }
    if (user_id!="system") {
        console.log('only system can reopen a support chat');
        return 0;
    }


    const deletedData = snap.val(); // data that was deleted

    console.log('deletedData', deletedData);

    return chatSupportApi.openChat(recipient_id, app_id);
});


exports.removeBotWhenTextContainsSlashAgent = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    
    const message_id = context.params.message_id;
      
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
    // DEBUG  console.log('message ' + JSON.stringify(message));

    // DEBUG console.log("message.status : " + message.status);     

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    // DEBUG console.log('it s a support message ');

    var group_id = recipient_id;

    //if contains \agent
    // if (message.sender.startsWith("bot_") == false && message.text.indexOf("\\agent") > -1) {
    if (message.text.indexOf("\\agent") == 0) {
        console.log('message contains \\agent');
        chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("TOUCHING_OPERATOR", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "TOUCHING_OPERATOR"} });

        chatSupportApi.removeBotFromGroupMember(group_id, app_id);


        var projectid = message.projectid;
        console.log('projectId',projectid);
    
    
        var departmentid = "default";
        if (message.attributes && message.attributes.departmentId && !message.attributes.departmentId==""){
            departmentid =  message.attributes.departmentId;
        }
        console.log('departmentid', departmentid);

        return chatSupportApi.getDepartmentOperator(projectid, departmentid, agent, true).then(response => {

            var assigned_operator_id= response.assigned_operator_id;

            console.log("assigned_operator_id", assigned_operator_id);     
            if (assigned_operator_id) {
               return chatApi.joinGroup(assigned_operator_id, group_id, app_id);
            } else {
                return 0;
            }              

    
    
            })
            .catch(function(error) { 
                console.log("Error getting department.", error); 
                return error;
            });
        








    }else {
        return 0;
    }
          
});


exports.closeSupportWhenTextContainsSlashClose = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    
    const message_id = context.params.message_id;
      
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
    // DEBUG  console.log('message ' + JSON.stringify(message));

    // DEBUG console.log("message.status : " + message.status);     

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    // DEBUG console.log('it s a support message ');


    var group_id = recipient_id;

    //if contains \agent
    // if (message.sender.startsWith("bot_") == false && message.text.indexOf("\\close") > -1) {
    if (message.text.indexOf("\\close") == 0) {
        console.log('message contains \\close');
        chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group",chatUtil.getMessage("THANKS_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "THANKS_MESSAGE"} });

        return chatSupportApi.closeChat(group_id, app_id);
    }else {
        return 0;
    }
          
});


// exports.sendInfoMessageOnGroupCreation = functions.database.ref('/apps/{app_id}/groups/{group_id}').onCreate((data, context) => {
    
//     const group_id = context.params.group_id;
//     const app_id = context.params.app_id;;
//     console.log("group_id: "+ group_id + ", app_id: " + app_id);
  
//     const group = data.val();
//     console.log("group",group);
    
//     if (group_id.indexOf("support-group")==-1 ){
//        console.log('send group creation message for support-group');
//        return 0;
//    }

//     var sender_id =  "system";
//     var sender_fullname = "System";

//     // chatApi.typing(sender_id, group_id, app_id);


//     var displaySupportGroup = group_id.replace("support_group","");
//     return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Richiesta creata: " + displaySupportGroup, app_id, {subtype:"info/support"});
    
// });


// if (functions.config().support.storetobackend && functions.config().support.storetobackend.enabled && functions.config().support.storetobackend.enabled=="true") {
//     exports.saveMessagesToNodeJs = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
//         const message_id = context.params.message_id;
//         const recipient_id = context.params.recipient_id;
//         const app_id = context.params.app_id;
//         // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
        
//         const message = data.val();
//         // DEBUG console.log('message ' + JSON.stringify(message));

//         // DEBUG console.log("message.status : " + message.status);     

//         if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
//             return 0;
//         }

//         if (recipient_id.indexOf("support-group")==-1 ){
//             console.log('exit for recipient');
//             return 0;
//         }

//         console.log('it s a message to nodejs ');

//         var projectid = message.projectid;
//         console.log('projectId',projectid);
        
//         return chatSupportApi.saveMessage(message, projectid);

        
        
//     });
// }  


exports.botreplyWithTwoReply = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = context.params.message_id;

    const sender_id = context.params.sender_id;

   
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;;
    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (message.sender == "system") {  //evita che il bot risponda a messaggi di system (es: Gruppo Creato)
        return 0;
    }

    if (!sender_id.startsWith("bot_")) {
        return 0;
    }


    if (message.text.indexOf("\\agent") > -1) { //not reply to a message containing \\agent
        return 0;
    }


    if (message.text.indexOf("\\close") > -1) { //not reply to a message containing \\close
        return 0;
    }


    if (message.text.startsWith("\\")) { //not reply to a message containing \
        return 0;
    }



    console.log('it s a message to bot ', message);

    const bot_id = sender_id.replace("bot_","");


    chatApi.typing(sender_id, recipient_id, app_id);


    var projectid = message.projectid;
    console.log('projectId',projectid);

    var departmentid="";
    if (message.attributes && message.attributes.departmentId && !message.attributes.departmentId==""){
        departmentid =  message.attributes.departmentId;
    }
    console.log('departmentid', departmentid);
    
       return chatSupportApi.getBot(bot_id, projectid, departmentid, agent).then(response => {
            let external = response.external;
            console.log('external', external); 

            if (external==true) {
                console.log('it s an external bot.exit'); 
                return chatApi.stopTyping(sender_id, recipient_id, app_id);
                // return 0;
            }

            // let kbkey_remote = response.kbkey_remote;
            // console.log('kbkey_remote', kbkey_remote); 
            
            
            // return chatBotSupportApi.askToQnaBot(message.text, "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/608f7647-2608-4600-b1e2-c7d4baf21e77/generateAnswer", "5e9c35eada754400852ccfb34e6711cb").then(function(qnaresp) {
            return chatBotSupportApi.askToInternalQnaBot(bot_id, message.text, projectid, message).then(function(qnaresp) {
            
                chatApi.stopTyping(sender_id, recipient_id, app_id);
        
                // var sender_fullname = "Bot";
                var sender_fullname = response.name;
                console.log('sender_fullname', sender_fullname); 

                var recipient_group_fullname = message.recipient_fullname;
        
              
                var answer;
                if (qnaresp.answer) {

                    answer = qnaresp.answer;

                    // response_options = { "question" : "Sei soddisfatto della risposta?",
                    // "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

                }

                var timestamp = Date.now();
                                            // getBotMessageOnlyDefaultFallBack(qnaresp, projectid, departmentid, message, bot, agent)
                var botask = chatBotSupportApi.getBotMessageOnlyDefaultFallBack(qnaresp, projectid, departmentid, message, response, agent).then(function(bot_answer) {
                // var botask = chatBotSupportApi.getBotMessage(qnaresp, projectid, departmentid, message, response, agent).then(function(bot_answer) {
                    
                    if (bot_answer.text) {
                        console.log('bot_answer.text', bot_answer.text); 
                                    // sendGroupMessage(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id, attributes, projectid, timestamp, type, metadata) {
                        return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, bot_answer.text, app_id, bot_answer.attributes, null, timestamp+1)
                        
                    }
                });


                
                var botreply = function() {
                    if (answer && answer.length>0) {
                        // getButtonFromText(text, message, bot) { 
                        chatBotSupportApi.getButtonFromText(answer, message, response,qnaresp).then(function(parsedText) {
                            // sendGroupMessage(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id, attributes, projectid, timestamp, type, metadata) {
                                chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, parsedText.text, app_id, parsedText.attributes, null, timestamp, parsedText.type, parsedText.metadata);
                        });

                      
                    }
                }
                               
                return Promise.all([botreply(), botask]);
                
        
            });

        //GET BOT END
        });





});
