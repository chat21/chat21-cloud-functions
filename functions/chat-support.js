

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

exports.createGroupForNewSupportRequest = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate((data, context) => {
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


    var projectid = message.projectid;
    console.log('projectId',projectid);


    var departmentid = "default";
    if (message.attributes && message.attributes.departmentId && !message.attributes.departmentId==""){
        departmentid =  message.attributes.departmentId;
    }
    console.log('departmentid', departmentid);






    var group_members = {};
    var assigned_operator_id;
    var idBot;
    var agents = [];
    var availableAgents= [];
    var availableAgentsCount= 0;

    return chatSupportApi.getDepartmentOperator(projectid, departmentid).then(response => {

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

        group_members[assigned_operator_id] = 1;
        console.log("group_members", group_members);     


        return createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
            departmentid, agents, availableAgents, assigned_operator_id);
    }).catch(error => {

        console.error("catch", error);     

        return createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
            departmentid, agents, availableAgents, assigned_operator_id);
    });

});

function createNewGroupAndSaveNewRequest(idBot, availableAgentsCount, group_id, message, app_id, group_members, 
    departmentid, agents, availableAgents, assigned_operator_id) {
    
    if (!idBot) {
        if (availableAgentsCount==0) {
            chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support", "updateconversation" : false});
        }else {
            chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support", "updateconversation" : false});
        }
    }

    chatApi.stopTyping("system", group_id, app_id);

    return Promise.all([createNewGroup(message, group_id, group_members, app_id), saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id)]);

    // createNewGroup(message, group_id, group_members, app_id);
    // return saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id);

}

function createNewGroup(message, group_id, group_members, app_id) {
    // var group_name = " Support Group";
    var group_name = "";

    if (message.sender_fullname) {
        group_name = message.sender_fullname;
    }else {
        group_name = "Guest";

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

    
    return chatApi.createGroupWithId(group_id, group_name, group_owner, group_members, app_id, gAttributes);

}

function saveNewRequest (message, departmentid, group_members, agents, availableAgents, assigned_operator_id, group_id, app_id) {
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


        return admin.firestore().collection('conversations').doc(group_id).set(newRequest, { merge: true });
        // .then(writeResult => {
        //     // Send back a message that we've succesfully written the message
        //     console.log(`Conversation with ID: ${group_id} created with value.`, newRequest);
        //     return 0;
        // });

    //Save to mongo

    // return request({
    //     uri: "http://api.chat21.org/"+projectid+"/requests",
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
    //     },
    //     method: 'POST',
    //     json: true,
    //     body: newRequest,
    //     //resolveWithFullResponse: true
    //     }).then(response => {
    //     if (response.statusCode >= 400) {
    //         // throw new Error(`HTTP Error: ${response.statusCode}`);
    //         console.error(`HTTP Error: ${response.statusCode}`);
    //     }else {
    //         console.log('Saved successfully to backend with response', response);  
    //     }

    //     return response;             
        
    // });
    

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

            console.log("docConvRef", docConvRef);
                
                var docConv = docConvRef.data();

                console.log("docConv.members", docConv.members);

                if (!docConv.members || !docConv.members.hasOwnProperty(member_id)) {

                    console.log("member_id not present into docConv");

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






exports.removeBotWhenTextContainsSlashAgent = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    
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
    // if (message.sender.startsWith("bot_") == false && message.text.indexOf("\\agent") > -1) {
    if (message.text.indexOf("\\agent") == 0) {
        console.log('message contains \\agent');
        chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group", chatUtil.getMessage("TOUCHING_OPERATOR", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support", "updateconversation" : false});

        chatSupportApi.removeBotFromGroupMember(group_id, app_id);


        var projectid = message.projectid;
        console.log('projectId',projectid);
    
    
        var departmentid = "default";
        if (message.attributes && message.attributes.departmentId && !message.attributes.departmentId==""){
            departmentid =  message.attributes.departmentId;
        }
        console.log('departmentid', departmentid);

        
        return request({
            uri :  "http://api.chat21.org/"+projectid+"/departments/"+departmentid+"/operators?nobot=true",
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
                            var assigned_operator_id = response.operators[0].id_user;
                            console.log('assigned_operator_id', assigned_operator_id);

                            chatApi.joinGroup(assigned_operator_id, group_id, app_id);
    
                        }                        
                    }
                }
            
    
            })
            .catch(function(error) { 
                console.log("Error getting department.", error); 
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
        chatApi.sendGroupMessage("system", "Sistema", group_id, "Support Group",chatUtil.getMessage("THANKS_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {subtype:"info/support", "updateconversation" : false});

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
//     var sender_fullname = "Sistema";

//     // chatApi.typing(sender_id, group_id, app_id);


//     var displaySupportGroup = group_id.replace("support_group","");
//     return chatApi.sendGroupMessage(sender_id, sender_fullname, group_id, group.name, "Richiesta creata: " + displaySupportGroup, app_id, {subtype:"info/support"});
    
// });



exports.saveMessagesToNodeJs = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    const message_id = context.params.message_id;
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;
    // DEBUG console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = data.val();
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

    var projectid = message.projectid;
    console.log('projectId',projectid);
    
    return request({
        uri: "http://api.chat21.org/"+projectid+"/messages",
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
            // throw new Error(`HTTP Error: ${response.statusCode}`);
            console.error(`HTTP Error: ${response.statusCode}`);
        }else {
            console.log('SUCCESS! Posted', data.ref);        
            console.log('SUCCESS! response', response);        
        }

        console.log('SUCCESS! Posted', data.ref);        
        console.log('SUCCESS! response', response);           
        
        return response;

        });

    
    
});
  




exports.botreply = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {

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

    return request({
        uri: "http://api.chat21.org/"+projectid+"/faq_kb/"+bot_id+"?departmentid="+departmentid,
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
            
             
        
                var answer="";
                // var response_options;

                if (qnaresp.answer) {

                    if (qnaresp.score>100) {
                        answer = qnaresp.answer;

                    }else {
                        var message_key = "DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE";
                        if (response.department.bot_only){
                            message_key = "DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE";
                        }
    
                        answer = qnaresp.answer + ". " +  chatUtil.getMessage(message_key, message.language, chatBotSupportApi.LABELS);
                    }
                   

                    // response_options = { "question" : "Sei soddisfatto della risposta?",
                    // "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

                }else if (qnaresp.answer == "\\agent"){ //if \\agent dont append se sei siddisfatto...
        
                }else {

                    var message_key = "DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE";
                    if (response.department.bot_only){
                        message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";
                    }

                    answer = chatUtil.getMessage(message_key, message.language, chatBotSupportApi.LABELS);
        
                    // response_options = { "question" : "Vuoi parlare con un operatore?",
                    // "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};

                }


                chatApi.stopTyping(sender_id, recipient_id, app_id);
        
                // var sender_fullname = "Bot";
                var sender_fullname = response.name;
                console.log('sender_fullname', sender_fullname); 

                var recipient_group_fullname = message.recipient_fullname;

                return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, answer, app_id);
                // return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, qnaresp.answer, app_id, qnaresp.response_options);
        
            });

        });





});


