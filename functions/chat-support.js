

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


// START SUPPORT

exports.createGroupForNewSupportRequest = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate(event => {
    // const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id );
    
    // const messageRef = event.data.ref;
    // console.log('messageRef ' + messageRef);

    // // const messageKey = event.data.current.key;
    // const messageKey = messageRef.key;
    // console.log('messageKey ' + messageKey);


    const messageWithMessageId = event.data.current.val();
    // DEBUG console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

    const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
//    DEBUG console.log('message ' + JSON.stringify(message));

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


    console.log("creating new request for message ", JSON.stringify(message));     
    
    chatApi.typing("system", recipient_id, app_id);


    var projectid = message.projectid;
    console.log('projectId',projectid);


    var departmentid = "default";
    if (message.attributes && message.attributes.departmentId && !message.attributes.departmentId==""){
        departmentid =  message.attributes.departmentId;
    }
    console.log('departmentid', departmentid);

    var group_id = recipient_id; //recipient is the group id


    var group_members = {};

    var agents = [];
    var availableAgents= [];
    var availableAgentsCount= 0;
    var assigned_operator_id;

    return request({
        //uri :  "http://api.chat21.org/"+projectid+"/departments/"+departmentid,
        uri :  "http://api.chat21.org/"+projectid+"/departments/"+departmentid+"/operators",
        headers: {
            'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
            'Content-Type': 'application/json'
        },
        method: 'GET',
        json: true,
        //resolveWithFullResponse: true
        }).then(response => {
           
            if (!response) {
                // throw new Error(`HTTP Error: ${response.statusCode}`);
                console.log(`Error getting department.`);
            }else {
                console.log('SUCCESS! response', response);

                if (response) {
                    if (response.operators  && response.operators.length>0) {
                        // var id_bot = "bot_"+response.id_bot;
                        assigned_operator_id = response.operators[0].id_user;
                        console.log('assigned_operator_id', assigned_operator_id);

                        group_members[assigned_operator_id] = 1; //bot
                    }
                    if (response.agents) {
                        agents = response.agents;
                        console.log('agents', agents);
                    }
                    if (response.available_agents) {
                        availableAgents = response.available_agents;
                        console.log('availableAgents', availableAgents);
                        
                        availableAgentsCount = availableAgents.length;
                        console.log('availableAgentsCount', availableAgentsCount);
                    }
                }
            }
        

        })
        .catch(function(error) { 
            console.log("Error getting department.", error); 
        })
        .finally(function() { 
            // console.log("finally"); 



            if (availableAgents==0) {
                chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support"});
            }else {
                chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support"});
                // chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", "La stiamo mettendo in contatto con un operatore. Attenda...", app_id, {subtype:"info/support"});
            }


            var group_name = " Support Group";

            if (message.sender_fullname) {
                group_name = message.sender_fullname + group_name;
            }else {
                group_name = "Guest" + group_name;

            }

            var group_owner = "system";
            group_members.system = 1;
            group_members[message.sender] = 1;  //add system                

        
        
            console.log("group_members", group_members);     

            var gAttributes = null;
            if (message.attributes){
                gAttributes =  message.attributes;
            }
            console.log('gAttributes', gAttributes);

            
            chatApi.createGroupWithId(group_id, group_name, group_owner, group_members, app_id, gAttributes);

            

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
            
            console.log('newRequest', newRequest);


            chatApi.stopTyping("system", recipient_id, app_id);







            admin.firestore().collection('conversations').doc(group_id).set(newRequest, { merge: true }).then(writeResult => {
                // Send back a message that we've succesfully written the message
                console.log(`Conversation with ID: ${group_id} created with value.`, newRequest);
                return 0;
            });


            return request({
                uri: "http://api.chat21.org/"+projectid+"/requests",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
                },
                method: 'POST',
                json: true,
                body: newRequest,
                //resolveWithFullResponse: true
                }).then(response => {
                if (response.statusCode >= 400) {
                    throw new Error(`HTTP Error: ${response.statusCode}`);
                }
                console.log('Saved successfully to backend with response', response);           
                
            });


        });;

});


    // https://firebase.google.com/docs/firestore/manage-data/transactions
function updateMembersCount(group_id, operation, app_id) {

    // DEBUG console.log(`updatingMembersCount  for group ${group_id} with operation  ${operation}.`);

       //update membersCount
       var conversationDocRef = admin.firestore().collection("conversations").doc(group_id);
    
    
       return admin.firestore().runTransaction(function(transaction) {
           // This code may get re-run multiple times if there are conflicts.
           return transaction.get(conversationDocRef).then(function(conversationDoc) {
               if (!conversationDoc.exists) {
                   throw "Document does not exist!";
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
       }).catch(function(error) {
           console.log("Transaction failed: ", error);
       });
   
}
exports.addMemberToReqFirestoreOnJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate(event => {
    
    const member_id = event.params.member_id;
    const group_id = event.params.group_id;
    const app_id = event.params.app_id;;
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

            console.log("docConvRef", docConvRef);
                
                var docConv = docConvRef.data();

                if (!docConv.members.hasOwnProperty(member_id)) {

                    console.log("member_id not present into docConv");

                    // return admin.firestore().collection('conversations').doc(group_id).update({members:dataToUpdate}).then(writeResult => {
                        //  return admin.firestore().collection('conversations').doc(group_id).create(dataToUpdate).then(writeResult => {
                        return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
                
                            
                            // DEBUG console.log("writeResult ", writeResult);
                    
                                console.log(`Member with ID: ${JSON.stringify(memberToAdd)} added to ${group_id}.`);
                    
                                return updateMembersCount(group_id, 1, app_id);
                        });

                    // });
                } else {
                    console.log("member_id already present into docConv");

                }
        }
//   
    });
});


exports.removeMemberToReqFirestoreOnLeaveGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onDelete(event => {
    
    const member_id = event.params.member_id;
    const group_id = event.params.group_id;
    const app_id = event.params.app_id;;
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


//    return admin.firestore().collection('conversations').doc(group_id).update({members:memberToAdd}).then(writeResult => {
     return admin.firestore().collection('conversations').doc(group_id).update({
        ['members.' + member_id]: FieldValue.delete()
      }).then(writeResult => {
       // Send back a message that we've succesfully written the message
       console.log(`Member with ID: ${JSON.stringify(member_id)} removed from ${group_id}.`);

       return updateMembersCount(group_id, -1, app_id);
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

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
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


    //Don't overrride initial conversations.attributes created with the new request
    delete message.attributes;

   console.log('message ' + JSON.stringify(message));

    return admin.firestore().collection('conversations').doc(groupId).set(message, { merge: true }).then(writeResult => {
    // return admin.firestore().collection('conversations').doc(groupId).update(message).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`Conversation with ID: ${groupId} saved.`);
      });
    

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
    
        if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
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






exports.removeBotWhenTextContainsSlashAgent = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    
    const message_id = event.params.message_id;
      
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
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
        chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", "La stiamo mettendo in contatto con un operatore. Attenda...", app_id, {subtype:"info/support"});

        return chatSupportApi.removeBotFromGroupMember(group_id, app_id);
    }else {
        return 0;
    }
          
});


exports.closeSupportWhenTextContainsSlashClose = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    
    const message_id = event.params.message_id;
      
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
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
        chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", "Grazie per aver utilizzato il nostro sistema di supporto", app_id, {subtype:"info/support"});

        return chatSupportApi.closeChat(group_id, app_id);
    }else {
        return 0;
    }
          
});


// exports.sendInfoMessageOnGroupCreation = functions.database.ref('/apps/{app_id}/groups/{group_id}').onCreate(event => {
    
//     const group_id = event.params.group_id;
//     const app_id = event.params.app_id;;
//     console.log("group_id: "+ group_id + ", app_id: " + app_id);
  
//     const group = event.data.current.val();
//     console.log("group",group);
    
//     if (group_id.indexOf("support-group")==-1 ){
//        console.log('send group creation message for support-group');
//        return 0;
//    }

//     var sender_id =  "system";
//     var sender_fullname = "Sistema";

//     // chatApi.typing(sender_id, group_id, app_id);


//     var displaySupportGroup = group_id.replace("support_group","");
//     return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Richiesta creata: " + displaySupportGroup, app_id, {subtype:"info/support"});
    
// });



exports.saveMessagesToNodeJs = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    const message_id = event.params.message_id;
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // DEBUG console.log("message.status : " + message.status);     

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    console.log('it s a message to nodejs ');
    
    return request({
        uri: "http://api.chat21.org/"+app_id+"/messages",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
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
  




exports.botreply = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = event.params.message_id;

    const sender_id = event.params.sender_id;

   
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();

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


    console.log('it s a message to bot ', message);

    const bot_id = sender_id.replace("bot_","");


    chatApi.typing(sender_id, recipient_id, app_id);



    return request({
        uri: "http://api.chat21.org/"+app_id+"/faq_kb/"+bot_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
        },
        method: 'GET',
        json: true,
        //resolveWithFullResponse: true
        }).then(response => {
            if (!response) {
                throw new Error(`HTTP Error`);
            }

            console.log('SUCCESS! response', response);           
            
            let kbkey_remote = response.kbkey_remote;
            console.log('kbkey_remote', kbkey_remote); 
            
            
            // return chatBotSupportApi.askToQnaBot(message.text, "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/608f7647-2608-4600-b1e2-c7d4baf21e77/generateAnswer", "5e9c35eada754400852ccfb34e6711cb").then(function(qnaresp) {
            return chatBotSupportApi.askToInternalQnaBot(kbkey_remote, message.text, message).then(function(qnaresp) {
            
                chatApi.stopTyping(sender_id, recipient_id, app_id);
        
                var sender_fullname = "Bot";
                var recipient_group_fullname = message.recipient_fullname;
        
                return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, qnaresp.answer, app_id, qnaresp.response_options);
        
            });

        });





});


