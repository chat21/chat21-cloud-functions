

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const chatSupportApi = require('./chat-support-api');


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

    var bot = "bot_6qI3oekSwabW9w05JHd2SQlV2rz2";

    var source_page = null;
    if (message.attributes && message.attributes.sourcePage) {
        source_page = message.attributes.sourcePage;
    }

    console.log("source_page", source_page);     

    if (source_page=="http://www.frontiere21.com/bppintranet/"){
        bot="bot_5a9d77df34b9de00143716da";
    }
    if (source_page=="http://www.frontiere21.com/bppit/" || source_page=="http://www.frontiere21.com/bppitm/"){
        bot="bot_5a9d77c834b9de00143716d9";
    }
    console.log("bot", bot);     



    var group_id = recipient_id; //recipient is the group id
    var group_name = "Support Group";
    var group_owner = "system";
    var group_members = {};
        group_members.system = 1;
        group_members[message.sender] = 1;  //add system
        group_members[bot] = 1; //bot
        // group_members["9EBA3VLhNKMFIVa0IOco82TkIzk1"] = 1;
        // group_members["LmBT2IKjMzeZ3wqyU8up8KIRB6J3"] = 1;
        // group_members["U4HL3GWjBsd8zLX4Vva0s7W2FN92"] = 1; //andrea.leo@frontiere21.it
        // group_members["AHNfnoWiF7SDVy6iKVTmgsAjLOv2"] = 1; //andrea.leo2@frontiere21.it
        
        

    // DEBUG console.log("group_members", group_members);     


    chatApi.createGroupWithId(group_id, group_name, group_owner, group_members, app_id);



//creare firestore conversation
    var newRequest = {};
    newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
    newRequest.requester_id = message.sender;
    newRequest.requester_fullname = message.sender_fullname;
    newRequest.first_text = message.text;

    // var members = {};
    // members.system = true;
    // members[requester_id] = true;

    newRequest.members = group_members;
    newRequest.membersCount = Object.keys(group_members).length;

    if (newRequest.membersCount==2){
     newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
    }else {
      newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.SERVED;
    }


    newRequest.app_id = app_id;
    

    chatApi.stopTyping("system", recipient_id, app_id);

    return admin.firestore().collection('conversations').doc(group_id).set(newRequest, { merge: true }).then(writeResult => {
    // return admin.firestore().collection('conversations').doc(groupId).update(message).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`Conversation with ID: ${group_id} created with value.`, newRequest);
      });

});






// exports.createSupportConversationToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate(event => {
//     const recipient_id = event.params.recipient_id;
//     const app_id = event.params.app_id;;
//     console.log("recipient_id : " + recipient_id + ", app_id: " + app_id);
    

//     const messageWithMessageId = event.data.current.val();
//     console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

//     const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
//     console.log('message ' + JSON.stringify(message));

//     if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
//         return 0;
//     }

//     if (recipient_id.indexOf("support-group")==-1 ){
//         console.log('exit for recipient');
//         return 0;
//     }

//     console.log('it s a support message ');


//     var newRequest = {};
//     newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
//     newRequest.support_status = 0; //CREATED
//     newRequest.requester_id = message.sender;
//     newRequest.requester_fullname = message.sender_fullname;
//     newRequest.first_text = message.text;

//     // var members = {};
//     // members.system = true;
//     // members[requester_id] = true;

//     // newRequest.members = members;
//     // newRequest.membersCount = 2;

//     newRequest.app_id = app_id;
    
//     // var conversationId = createConversationId(sender_id, recipient_id);
//     // console.log('conversationId', conversationId);
//     var groupId = recipient_id;

    
//     return admin.firestore().collection('conversations').doc(groupId).set(newRequest, { merge: true }).then(writeResult => {
//     // return admin.firestore().collection('conversations').doc(groupId).update(message).then(writeResult => {
//         // Send back a message that we've succesfully written the message
//         console.log(`Conversation with ID: ${groupId} created.`);
//       });
    

// });





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
                // 'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwic2VsZWN0ZWQiOnt9LCJnZXR0ZXJzIjp7fSwid2FzUG9wdWxhdGVkIjpmYWxzZSwiYWN0aXZlUGF0aHMiOnsicGF0aHMiOnsicGFzc3dvcmQiOiJpbml0IiwidXNlcm5hbWUiOiJpbml0IiwiX192IjoiaW5pdCIsIl9pZCI6ImluaXQifSwic3RhdGVzIjp7Imlnbm9yZSI6e30sImRlZmF1bHQiOnt9LCJpbml0Ijp7Il9fdiI6dHJ1ZSwicGFzc3dvcmQiOnRydWUsInVzZXJuYW1lIjp0cnVlLCJfaWQiOnRydWV9LCJtb2RpZnkiOnt9LCJyZXF1aXJlIjp7fX0sInN0YXRlTmFtZXMiOlsicmVxdWlyZSIsIm1vZGlmeSIsImluaXQiLCJkZWZhdWx0IiwiaWdub3JlIl19LCJlbWl0dGVyIjp7ImRvbWFpbiI6bnVsbCwiX2V2ZW50cyI6e30sIl9ldmVudHNDb3VudCI6MCwiX21heExpc3RlbmVycyI6MH19LCJpc05ldyI6ZmFsc2UsIl9kb2MiOnsiX192IjowLCJwYXNzd29yZCI6IiQyYSQxMCQ5SjlIUHZCL29NOUxGMFdVaEtZWHRPcmhTZ2wyOEY0ZmtZcGZUVGU3ZGdwRWFZRnFRQlFtdSIsInVzZXJuYW1lIjoiYW5kcmVhIiwiX2lkIjoiNWE2YzU4MzVjM2VjNjU5M2I0ZDk2YjRmIn0sImlhdCI6MTUxNzA1MDcyOX0.OafV9nTa_O48RkRGt6WoFW26ZNNw6AN-HCETkaT3oFU'
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
  

const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();


// curl -X POST -H "Ocp-Apim-Subscription-Key: 59c2511b9825415eb4254ab8a7d4b094" -H "Content-Type: application/json" -d '{"question":"quanto costa Smatt21?"}' https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/f486b8ed-b587-413a-948e-e02c9a129d12/generateAnswer


//lasciare questo bot cosi come è per essere usato dalla app ios
exports.botreply = functions.database.ref('/apps/{app_id}/users/bot_6qI3oekSwabW9w05JHd2SQlV2rz2/messages/{recipient_id}/{message_id}').onCreate(event => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = event.params.message_id;
    const sender_id = "bot_6qI3oekSwabW9w05JHd2SQlV2rz2";
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
//    DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();
    // DEBUG console.log('message ' + JSON.stringify(message));

    // DEBUG console.log("message.status : " + message.status);     

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (message.sender == "system"){  //evita che il bot risponda a messaggi di system (es: Gruppo Creato)
        return 0;
    }

    if (message.text.indexOf("\\agent") > -1) { //not reply to a message containing \\agent
        return 0;
    }


    console.log('it s a message to bot ', message);
    
    chatApi.typing(sender_id, recipient_id, app_id);

    // chatApi.sendGroupMessage(sender_id, "Bot", recipient_id, "Support Group", "Ciao sono il Bot, sto cercado una risposta alla tua domanda. Un attimo di pazienza...", app_id);


    return request({
        //uri: "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/f486b8ed-b587-413a-948e-e02c9a129d12/generateAnswer",

        uri :  "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/608f7647-2608-4600-b1e2-c7d4baf21e77/generateAnswer",
        headers: {
            //'Ocp-Apim-Subscription-Key': '59c2511b9825415eb4254ab8a7d4b094',
            'Ocp-Apim-Subscription-Key': '5e9c35eada754400852ccfb34e6711cb',
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

        var sender_fullname = "Bot";
        var recipient_group_fullname = message.recipient_fullname;


        var response_options;

        if (answer == "No good match found in the KB"){
            answer = "Non ho trovato una risposta nella knowledge base. \n Riformula la tua domanda oppure digita <b>\\agent</b> per parlare con un operatore.";

            response_options = { "question" : "Vuoi parlare con un operatore?",
            "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};
        }else {

            answer = answer + " Soddisfatto della risposta?. \n Digita <b>\\close</b> per chiudere la chat oppure <b>\\agent</b> per parlare con un operatore. Oppure formula una nuova domanda.";
            response_options = { "question" : "Sei soddisfatto della risposta?",
            "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

        }
       

        
        chatApi.stopTyping(sender_id, recipient_id, app_id);

        return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, answer, app_id, response_options);

        });

    
    
});

// curl -X POST -H "Ocp-Apim-Subscription-Key: 5e9c35eada754400852ccfb34e6711cb" -H "Content-Type: application/json" -d '{"question":"come si apre un conto corrente?"}' https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/608f7647-2608-4600-b1e2-c7d4baf21e77/generateAnswer
exports.bppitbotreply = functions.database.ref('/apps/{app_id}/users/bot_5a9d77c834b9de00143716d9/messages/{recipient_id}/{message_id}').onCreate(event => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = event.params.message_id;
    const sender_id = "bot_5a9d77c834b9de00143716d9";
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
//    DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();

    return replayWithBot(message_id, sender_id, recipient_id, message, app_id, "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/608f7647-2608-4600-b1e2-c7d4baf21e77/generateAnswer", "5e9c35eada754400852ccfb34e6711cb");

});

exports.bppintranetbotreply = functions.database.ref('/apps/{app_id}/users/bot_5a9d77df34b9de00143716da/messages/{recipient_id}/{message_id}').onCreate(event => {

    // CONTROLLARE SU NODEJS SE SONO UN BOT SE SI GET DI MICROSOFT URL QNA 
    const message_id = event.params.message_id;
    const sender_id = "bot_5a9d77df34b9de00143716da";
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
//    DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
    
    const message = event.data.current.val();

    return replayWithBot(message_id, sender_id, recipient_id, message, app_id, "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/4561aabb-8e3d-4925-8f43-3ee0693ed4bb/generateAnswer", '59c2511b9825415eb4254ab8a7d4b094');

});

function replayWithBot(message_id, sender_id, recipient_id, message, app_id, qnaServiceUrl, qnaKey) {
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    if (message.sender == "system"){  //evita che il bot risponda a messaggi di system (es: Gruppo Creato)
        return 0;
    }

    if (message.text.indexOf("\\agent") > -1) { //not reply to a message containing \\agent
        return 0;
    }


    console.log('it s a message to bot ', message);

    chatApi.typing(sender_id, recipient_id, app_id);


    console.log('qnaServiceUrl', qnaServiceUrl);
    console.log('qnaKey', qnaKey);

    
    // chatApi.sendGroupMessage(sender_id, "Bot", recipient_id, "Support Group", "Ciao sono il Bot, sto cercado una risposta alla tua domanda. Un attimo di pazienza...", app_id);


    return request({
        //uri: "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/f486b8ed-b587-413a-948e-e02c9a129d12/generateAnswer",

        uri :  qnaServiceUrl,
        headers: {
            //'Ocp-Apim-Subscription-Key': '59c2511b9825415eb4254ab8a7d4b094',
            'Ocp-Apim-Subscription-Key': qnaKey,
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

        // console.log('SUCCESS! Posted', event.data.ref);        
        console.log('SUCCESS! response', response);

        var answer = entities.decode(response.answers[0].answer);
        console.log('answer', answer);    

        var question = response.answers[0].questions[0];
        console.log('question', question);        

        var sender_fullname = "Bot";
        var recipient_group_fullname = message.recipient_fullname;


        var response_options;

        if (answer == "No good match found in the KB"){
            answer = "Non ho trovato una risposta nella knowledge base. \n Vuoi parlare con un operatore oppure riformulare la tua domanda ? \n Digita <b>\\agent</b> per parlare con un operatore oppure formula un nuova domanda.";

            response_options = { "question" : "Vuoi parlare con un operatore?",
            "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};
        }else if (answer == "\\agent"){ //if \\agent dont append se sei siddisfatto...

        }else {
            answer = answer + " Sei soddisfatto della risposta?. \n Se sei soddisfatto digita <b>\\close</b> per chiudere la chat di supporto oppure <b>\\agent</b> per parlare con un operatore.";
            response_options = { "question" : "Sei soddisfatto della risposta?",
            "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

        }
       

        
        chatApi.stopTyping(sender_id, recipient_id, app_id);

        return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, answer, app_id, response_options);

        });

}



// END SUPPORT


