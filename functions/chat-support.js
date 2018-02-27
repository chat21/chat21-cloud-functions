

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const FieldValue = require('firebase-admin').firestore.FieldValue;


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

    // if (message.status!=null || message.status!=chatApi.CHAT_MESSAGE_STATUS.SENDING) {  //createGroupForNewSupportRequest must run for message
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
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
        group_members[message.sender] = 1;  //add system
        group_members["bot_6qI3oekSwabW9w05JHd2SQlV2rz2"] = 1; //bot
        // group_members["9EBA3VLhNKMFIVa0IOco82TkIzk1"] = 1;
        // group_members["LmBT2IKjMzeZ3wqyU8up8KIRB6J3"] = 1;
        // group_members["U4HL3GWjBsd8zLX4Vva0s7W2FN92"] = 1; //andrea.leo@frontiere21.it
        // group_members["AHNfnoWiF7SDVy6iKVTmgsAjLOv2"] = 1; //andrea.leo2@frontiere21.it
        
        

    console.log("group_members", group_members);     


    return chatApi.createGroupWithId(group_id, group_name, group_owner, group_members, app_id);

});

exports.createSupportConversationToFirestore = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate(event => {
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;;
    console.log("recipient_id : " + recipient_id + ", app_id: " + app_id);
    

    const messageWithMessageId = event.data.current.val();
    console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

    const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
    console.log('message ' + JSON.stringify(message));

    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }

    if (recipient_id.indexOf("support-group")==-1 ){
        console.log('exit for recipient');
        return 0;
    }

    console.log('it s a support message ');


    var newRequest = {};
    newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
    newRequest.support_status = 0; //CREATED
    newRequest.requester_id = message.sender;
    newRequest.requester_fullname = message.sender_fullname;
    newRequest.app_id = app_id;
    
    // var conversationId = createConversationId(sender_id, recipient_id);
    // console.log('conversationId', conversationId);
    var groupId = recipient_id;

    
    return admin.firestore().collection('conversations').doc(groupId).set(newRequest, { merge: true }).then(writeResult => {
    // return admin.firestore().collection('conversations').doc(groupId).update(message).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`Conversation with ID: ${groupId} created.`);
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



function updateMembersCount(group_id, operation) {

    console.log(`updateMembersCount  ${group_id}   ${operation}.`);

       //update membersCount
       var conversationDocRef = admin.firestore().collection("conversations").doc(group_id);
    
    
       return admin.firestore().runTransaction(function(transaction) {
           // This code may get re-run multiple times if there are conflicts.
           return transaction.get(conversationDocRef).then(function(conversationDoc) {
               if (!conversationDoc.exists) {
                   throw "Document does not exist!";
               }
   
               var oldMemberCount = 0;
               if (conversationDoc.data().membersCount!=null){
                   oldMemberCount=conversationDoc.data().membersCount;
               }
   
               var newMembersCount = oldMemberCount + operation;
   
               var updates = {};    
               if (newMembersCount>2) {
                updates.support_status = 200; //SERVED
               }else {
                updates.support_status = 100; //UNSERVED

               }

               updates.membersCount = newMembersCount;
   
               transaction.update(conversationDocRef, updates);
           });
       }).then(function() {
           console.log("Transaction successfully committed!");
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

    console.log('it s a support message ');

   

    var memberToAdd = {};
    memberToAdd[member_id] = true;
    console.log("memberToAdd ", memberToAdd);


    var dataToUpdate = {};
    dataToUpdate.members = memberToAdd;
    console.log("dataToUpdate ", dataToUpdate);


//    return admin.firestore().collection('conversations').doc(group_id).update({members:memberToAdd}).then(writeResult => {
     return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
       // Send back a message that we've succesfully written the message
       console.log(`Member with ID: ${JSON.stringify(memberToAdd)} added to ${group_id}.`);

       return updateMembersCount(group_id, 1);
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

       return updateMembersCount(group_id, -1);
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
    if (message.sender.startsWith("bot_") == false && message.text.indexOf("\\agent") > -1) {
        console.log('message contains \\agent');

        //remove bot from members
        return chatApi.getGroupMembers(group_id, app_id).then(function (groupMembers) {
    
            groupMembers.forEach(function(groupMember) {
                console.log('groupMember ' + groupMember);
    
                if (groupMember.startsWith("bot_")) { 
                    chatApi.leaveGroup(groupMember, group_id, app_id);
                    console.log('removed bot with id  ' + groupMember + " from group with id " + group_id);
    


                //     //update firestore
                //     var dataToUpdate = {};
                //     //TODO REMOVE BOT MEMBER
                //     var memberRemoved;
                //     // dataToUpdate.members = memberToAdd;
                //     dataToUpdate.support_status = 100; //UNSERVED
                //     console.log("dataToUpdate ", dataToUpdate);
                
                
                // //    return admin.firestore().collection('conversations').doc(group_id).update({members:memberToAdd}).then(writeResult => {
                //      return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
                //        // Send back a message that we've succesfully written the message
                //        console.log(`Member with ID: ${JSON.stringify(memberRemoved)} removed from ${group_id}.`);
                //         return 0;
                //     //    return updateMembersCount(group_id);
                //     });



                    return 0;
    
                }
            });
    
            return 0;
    
        });
    }else {
        return 0;
    }
          
    });


// exports.removeBotOnAgentJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate(event => {
    
//     const member_id = event.params.member_id;
//     const group_id = event.params.group_id;
//     const app_id = event.params.app_id;;
//    // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    

//    if (group_id.indexOf("support-group")==-1 ){
//     console.log('exit for recipient');
//     return 0;
//    }

//     console.log('it s a support message ');

//     if (member_id.startsWith("bot_"))
//         return 0;
   
   
//     //remove bot from members
//     return chatApi.getGroupMembers(group_id, app_id).then(function (groupMembers) {

//         groupMembers.forEach(function(groupMember) {
//             console.log('groupMember ' + groupMember);

//             if (groupMember.startsWith("bot_")) { 
//                 chatApi.leaveGroup(groupMember, group_id, app_id);
//                 console.log('removed bot with id  ' + groupMember);

//                 return 0;

//             }
//         });

//         return 0;

//     });
      
// });


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

        var sender_fullname = "Bot";
        var recipient_group_fullname = message.recipient_fullname;


        var response_options;

        if (answer == "No good match found in the KB"){
            answer = "Non ho trovato una risposta nella knowledge base. \n Vuoi parlare con un operatore oppure riformuli la tua domanda ? \n Digita \\agent per parlare con un operatore oppure riformula un altra domanda.";

            response_options = { "question" : "Vuoi parlare con un operatore?",
            "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};
        }else {

            answer = answer + " Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure \\agent per parlare con un operatore.";
            response_options = { "question" : "Sei soddisfatto della risposta?",
            "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

        }
       

        

        return chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_group_fullname, answer, app_id, response_options);

        });

    
    
});




// END SUPPORT


