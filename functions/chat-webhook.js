'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request-promise');  
const chatApi = require('./chat-api');


var ONMESSAGE_URL;

if (functions.config().webhook.onmessage && functions.config().webhook.onmessage.url) {
  ONMESSAGE_URL = functions.config().webhook.onmessage.url;
    console.log('ONMESSAGE_URL', ONMESSAGE_URL);

}
if (!ONMESSAGE_URL) {
    console.info('ONMESSAGE_URL is not defined');
}


exports.onMessage = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {

  const message_id = context.params.message_id;

  const sender_id = context.params.sender_id;

 
  const recipient_id = context.params.recipient_id;
  const app_id = context.params.app_id;;
  console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
  
  const message = data.val();

  if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
      return 0;
  }

  console.log('message', message);


  var json = {
    event_type: "new-message",
    createdAt: new Date().getTime(),
    data: message
  };

  return request({
    "uri": ONMESSAGE_URL,
    "method": "POST",
    "json": json
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
      return 0;
    } else {
      console.error("Unable to send message:" + err);
      return 0;
    }
  }); 


});





  
  
