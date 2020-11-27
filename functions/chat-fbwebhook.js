'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config');

const chatApi = require('./chat-api');
const request = require('request-promise');  
//let functions.region(config.region).config() = JSON.parse(process.env.FIREBASE_CONFIG);

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  console.log('request_body',request_body);


  // Send the HTTP request to the Messenger Platform
  return request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    // "qs": { "access_token": "EAANskcQny4cBAIpgGUvuHNoHCpgIcyTTJpzZBZCjlZAxaMtTnJcfEBQZBniOUnNr92ThWbTOtMEZCfAazxaFhVnq1WpLmZBUhnTfJUlmO4xF37telaUZCpCECqaObMeyumZB4UGP0BZChSER9ce3uVA8HBMIJTAHa097V3bnNcLACB7qVTCySNg3c" },
    "qs": { "access_token": functions.config().webhook.secret},
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
      return 0;
    } else {
      console.error("Unable to send message:" + err);
      return err;
    }
  }); 
}

exports.sendToFB = functions.region(config.region).database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {

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
  if (message.sender == "system"){  //evita che il bot risponda a messaggi di system (es: Gruppo Creato)
      return 0;
  }

  if (!sender_id.startsWith("fb_")){
      return 0;
  }


  if (message.text.indexOf("\\agent") > -1) { //not reply to a message containing \\agent
      return 0;
  }


  console.log('it s a message to fb ', message);

  // typing(writer_id, recipient_id, text, timestamp, app_id) 
  chatApi.typing(sender_id, recipient_id, message.text, undefined, app_id);

  const fb_sender_id = sender_id.replace("fb_","");

  var fbresponse = {
    "text": message.text
    }

  console.log('fbresponse',fbresponse);

  return callSendAPI(fb_sender_id, fbresponse);


});





  
  
