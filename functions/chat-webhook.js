'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request-promise');  
const chatApi = require('./chat-api');
const http = require('http');
// const agent = new http.Agent({keepAlive: true});


var URL;

if (functions.config().webhook && functions.config().webhook.url) {
    URL = functions.config().webhook.url;
    console.log('URL', URL);

}
if (!URL) {
    console.info('URL is not defined');
}

//rename to onGroupMessage
exports.onMessage = functions.database.ref('/apps/{app_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {

  const message_id = context.params.message_id;

 
  const recipient_id = context.params.recipient_id;
  const app_id = context.params.app_id;;
  // console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
  

  console.log('data', JSON.stringify(data));
  console.log('context', JSON.stringify(context));
  
  const message = data.val();

  if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
      return 0;
  }

  console.log('message', message);


  var json = {
    event_type: "new-message",
    createdAt: new Date().getTime(),
    recipient_id: recipient_id,
    app_id: app_id,
    message_id: message_id,
    data: message
  };

  return request({
    "uri": URL,
    "method": "POST",
     //"agent": agent,
    "json": json
  }, (err, res, body) => {
    if (!err) {
      console.log('http sent!');
      return 0;
    } else {
      console.error("Unable to send http:" + err);
      return 0;
    }
  }); 


});




//DEPRECATED REMOVE IT
// exports.onFirstMessage = functions.database.ref('/apps/{app_id}/messages/{recipient_id}').onCreate((data, context) => {
//   // const sender_id = context.params.sender_id; 
//   const recipient_id = context.params.recipient_id;
//   const app_id = context.params.app_id;;
//   // console.log("recipient_id : " + recipient_id + ", app_id: " + app_id );
  
//   console.log('data', JSON.stringify(data));
//   console.log('context', JSON.stringify(context));

//   // const messageRef = data.ref;
//   // console.log('messageRef ' + messageRef);

//   // // const messageKey = data.current.key;
//   // const messageKey = messageRef.key;
//   // console.log('messageKey ' + messageKey);


//   const messageWithMessageId = data.val();
//   // console.log('messageWithMessageId ' + JSON.stringify(messageWithMessageId));

//   const message =  messageWithMessageId[Object.keys(messageWithMessageId)[0]]; //returns 'someVal'
//   // console.log('message ' + JSON.stringify(message));

//   // console.log("message.status : " + message.status);     

//   if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
//       console.log('exit for status');
//       return 0;
//   }


//   console.log("message ", JSON.stringify(message));     
  
//   var json = {
//     event_type: "first-message",
//     createdAt: new Date().getTime(),
//     recipient_id: recipient_id,
//     app_id: app_id,
//     data: message
//   };

//   return request({
//     "uri": URL,
//     "method": "POST",
//     //"agent": agent,
//     "json": json
//   }, (err, res, body) => {
//     if (!err) {
//       console.log('http sent!');
//       return 0;
//     } else {
//       console.error("Unable to send http:" + err);
//       return 0;
//     }
//   }); 


// });




exports.onDeleteConversation = functions.database.ref('/apps/{app_id}/users/{user_id}/conversations/{recipient_id}').onDelete((snap, context) => {
  const app_id = context.params.app_id;
  const user_id = context.params.user_id;
  const recipient_id = context.params.recipient_id;
  console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", user_id: " + user_id);



  const deletedData = snap.val(); // data that was deleted

  console.log('deletedData', deletedData);



  var json = {
    event_type: "deleted-conversation",
    createdAt: new Date().getTime(),
    app_id: app_id,
    user_id: user_id,
    recipient_id: recipient_id,
    data: deletedData
  };

  return request({
    "uri": URL,
    "method": "POST",
    //"agent": agent,
    "json": json
  }, (err, res, body) => {
    if (!err) {
      console.log('http sent!');
      return 0;
    } else {
      console.error("Unable to send http:" + err);
      return 0;
    }
  }); 


});

exports.onDeleteArchivedConversation = functions.database.ref('/apps/{app_id}/users/{user_id}/archived_conversations/{recipient_id}').onDelete((snap, context) => {
  const app_id = context.params.app_id;
  const user_id = context.params.user_id;
  const recipient_id = context.params.recipient_id;
  console.log("recipient_id : " + recipient_id + ", app_id: " + app_id + ", user_id: " + user_id);



  const deletedData = snap.val(); // data that was deleted

  console.log('deletedData', deletedData);



  var json = {
    event_type: "deleted-archivedconversation",
    createdAt: new Date().getTime(),
    app_id: app_id,
    user_id: user_id,
    recipient_id: recipient_id,
    data: deletedData
  };

  return request({
    "uri": URL,
    "method": "POST",
    //"agent": agent,
    "json": json
  }, (err, res, body) => {
    if (!err) {
      console.log('http sent!');
      return 0;
    } else {
      console.error("Unable to send http:" + err);
      return 0;
    }
  }); 


});




exports.onGroupCreated = functions.database.ref('/apps/{app_id}/groups/{group_id}').onCreate((data, context) => {
    
  const group_id = context.params.group_id;
  const app_id = context.params.app_id;;
  console.log("group_id: "+ group_id + ", app_id: " + app_id);

  const group = data.val();
  console.log("group",group);

  
  var json = {
    event_type: "new-group",
    createdAt: new Date().getTime(),
    app_id: app_id,
    group_id: group_id,
    data: group
  };

  return request({
    "uri": URL,
    "method": "POST",
    //"agent": agent,
    "json": json
  }, (err, res, body) => {
    if (!err) {
      console.log('http sent!');
      return 0;
    } else {
      console.error("Unable to send http:" + err);
      return 0;
    }
  }); 

});


exports.onMemberJoinGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onCreate((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
    console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);
    
    const member = data.val();
    console.log("member", member);



 var data = {
  member_id: member_id
 };

  var json = {
    event_type: "join-member",
    createdAt: new Date().getTime(),
    group_id: group_id,
    app_id: app_id,
    member_id: member_id,
    data: data
  };

  return chatApi.getGroupById(group_id, app_id).then(function (group) {
    console.log("group", group);
    if (group) {
    
      data.group = group;

        return request({
          "uri": URL,
          "method": "POST",
          //"agent": agent,
          "json": json
        }, (err, res, body) => {
          if (!err) {
            console.log('http sent!');
            return 0;
          } else {
            console.error("Unable to send http:" + err);
            return 0;
          }
        }); 

    }
  });

});


exports.onMemberLeaveGroup = functions.database.ref('/apps/{app_id}/groups/{group_id}/members/{member_id}').onDelete((data, context) => {
    
    const member_id = context.params.member_id;
    const group_id = context.params.group_id;
    const app_id = context.params.app_id;;
   // DEBUG  console.log("member_id: "+ member_id + ", group_id : " + group_id + ", app_id: " + app_id);



  var data = {
    member_id: member_id
  };

  var json = {
    event_type: "leave-member",
    createdAt: new Date().getTime(),
    group_id: group_id,
    app_id: app_id,
    member_id: member_id,
    data: data
  };

  return chatApi.getGroupById(group_id, app_id).then(function (group) {
    console.log("group", group);
    if (group) {
    
      data.group = group;

        return request({
          "uri": URL,
          "method": "POST",
          //"agent": agent,
          "json": json
        }, (err, res, body) => {
          if (!err) {
            console.log('http sent!');
            return 0;
          } else {
            console.error("Unable to send http:" + err);
            return 0;
          }
        }); 

    }

  });


});
  
  
