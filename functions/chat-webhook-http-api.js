/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// const Language = require('@google-cloud/language');
const chatApi = require('./chat-api');
const express = require('express');
const cors = require('cors')({origin: true});

const appWebHook = express();
const chatHttpAuth = require('./chat-http-auth');
var md5 = require('md5');
// const request = require('request');

const request = require('request-promise');  

// const language = new Language({projectId: process.env.GCLOUD_PROJECT});

// admin.initializeApp(functions.config().firebase);






// appWebHook.use(chatHttpAuth.authenticate);


// Creates the endpoint for our webhook 
appWebHook.post('/', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      var sender_id = "fb_"+webhook_event.sender.id;
      console.log("sender_id",sender_id);

      var sender_fullname = "Utente Facebook";
      console.log("sender_fullname",sender_fullname);

      let recipient_fullname = "Support Group";

      let text = webhook_event.message.text;
      console.log("text",text);


      let hased_request_id = "support-group-"+md5(sender_id+"-"+webhook_event.recipient.id);
      console.log("hased_request_id",hased_request_id);

      let app_id = "tilechat";
      // let app_id = SUPPORT_APP_ID;

      let projectid = "5ab0f32757066e0014bfd718";

       chatApi.sendGroupMessage(sender_id, sender_fullname, hased_request_id, recipient_fullname, text, app_id, null, projectid);

      

    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});



// Adds support for GET requests to our webhook
appWebHook.get('/', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "webhooksecret"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
  res.sendStatus(403);      
});



// Expose the API as a function
exports.api = functions.https.onRequest(appWebHook);

