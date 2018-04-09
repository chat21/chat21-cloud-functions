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

const app = express();
const chatHttpAuth = require('./chat-http-auth');

// const language = new Language({projectId: process.env.GCLOUD_PROJECT});

// admin.initializeApp(functions.config().firebase);







/* AUTH REST

 * https://firebase.google.com/docs/reference/rest/auth/#section-sign-in-email-password
 * 

*/




app.use(chatHttpAuth.authenticate);



/**
 * Send a message.
 *
 * This endpoint supports CORS.
 */

app.post('/:app_id/messages', (req, res) => {
  console.log('sendMessage');

   
      if (req.method !== 'POST') {
        res.status(403).send('Forbidden!');
      }
      
      cors(req, res, () => {
        let sender_id = req.user.uid;

        if (!req.body.sender_fullname) {
            res.status(405).send('Sender Fullname is not present!');
        }
        if (!req.body.recipient_id) {
            res.status(405).send('Recipient id is not present!');
        }
        if (!req.body.recipient_fullname) {
            res.status(405).send('Recipient Fullname is not present!');
        }
        if (!req.body.text) {
            res.status(405).send('text  is not present!');
        }
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        if (req.body.sender_id) {
          sender_id = req.body.sender_id;
        }

        let sender_fullname = req.body.sender_fullname;
        let recipient_id = req.body.recipient_id;
        let recipient_fullname = req.body.recipient_fullname;
        let text = req.body.text;
        let app_id = req.params.app_id;
        let channel_type = req.body.channel_type;


        console.log('sender_id', sender_id);
        console.log('sender_fullname', sender_fullname);
        console.log('recipient_id', recipient_id);
        console.log('recipient_fullname', recipient_fullname);
        console.log('text', text);
        console.log('app_id', app_id);
        console.log('channel_type', channel_type);


        if (channel_type==null || channel_type=="direct") {  //is a direct message
          var result =  chatApi.sendDirectMessage(sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id);
        }else if (channel_type=="group") {
          var result =  chatApi.sendGroupMessage(sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id);
        }else {
          res.status(405).send('channel_type error!');
        }

        console.log('result', result);

        res.status(201).send(result);
        // [END sendResponse]
      });
    });



    /**
 * Delete a message
 * 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.delete('/:app_id/messages/:recipient_id/:message_id', (req, res) => {
  // app.delete('/groups/:group_id/members/:member_id', (req, res) => {
  console.log('delete a message');

   
    // if (req.method !== 'DELETE') {
    //   res.status(403).send('Forbidden!');
    // }
      
      cors(req, res, () => {

        let sender_id = req.user.uid;

        if (!req.params.recipient_id) {
          res.status(405).send('recipient_id is not present!');
        }

        if (!req.params.message_id) {
            res.status(405).send('message_id is not present!');
        }
    
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        if (req.body.sender_id) {
          sender_id = req.body.sender_id;
        }

        let recipient_id = req.params.recipient_id;
        let message_id = req.params.message_id;
        let app_id = req.params.app_id;

        let all = false;
        if (req.query.all) {
          all = true;
        }

        let channel_type = "direct";
        if (req.query.channel_type) {
          channel_type = req.query.channel_type;
        }

        console.log('recipient_id', recipient_id);
        console.log('message_id', message_id);
        console.log('app_id', app_id);
        console.log('all', all);
        console.log('channel_type', channel_type);


        var result;
        if (channel_type=="direct") {
          if (all==false) {
            result =  chatApi.deleteMessage(sender_id, recipient_id, message_id, app_id);
          }else {
            result =  chatApi.deleteMessageForAll(sender_id, recipient_id, message_id, app_id);
          }
        }else if (channel_type=="group") {
          if (all==false) {
            result =  chatApi.deleteMessage(sender_id, recipient_id, message_id, app_id);
          }else {
            result =  chatApi.deleteMessageGroupForAll(recipient_id, message_id, app_id);
          }
        }else {
          res.status(405).send('channel_type error');
        }
        
      
        console.log('result', result);

        res.status(204).send(result);
      });
    });



    /**
 * Create a group
 
 * This endpoint supports CORS.
 */
// [START trigger]
app.post('/:app_id/groups', (req, res) => {
  console.log('create a group');

   
    if (req.method !== 'POST') {
      res.status(403).send('Forbidden!');
    }
      
      cors(req, res, () => {

        if (!req.body.group_name) {
            res.status(405).send('group_name is not present!');
        }
        // if (!req.body.group_members) {
        //     res.status(405).send('group_members is not present!');
        // }
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        let group_name = req.body.group_name;
        let current_user = req.user.uid;

        if (req.body.current_user) {
          current_user = req.body.current_user;
        }

        let group_owner = current_user;

        let group_members = {};
        if (req.body.group_members) {
          group_members = req.body.group_members;
        }

        group_members[current_user] = 1;

        let app_id = req.params.app_id;


        console.log('group_name', group_name);
        console.log('group_owner', group_owner);
        console.log('group_members', group_members);
        console.log('app_id', app_id);


        var result =  chatApi.createGroup(group_name, group_owner, group_members, app_id);
      
        console.log('result', result);

        res.status(201).send(result);
      });
    });










    /**
 * Join a group
 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.post('/:app_id/groups/:group_id/members', (req, res) => {
  console.log('join group');

   
    if (req.method !== 'POST') {
      res.status(403).send('Forbidden!');
    }
      
      cors(req, res, () => {

        if (!req.body.member_id) {
            res.status(405).send('member_id is not present!');
        }
        if (!req.params.group_id) {
            res.status(405).send('group_id is not present!');
        }
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        let member_id = req.body.member_id;
        let group_id = req.params.group_id;
        let app_id = req.params.app_id;


        console.log('member_id', member_id);
        console.log('group_id', group_id);
        console.log('app_id', app_id);


        var result =  chatApi.joinGroup(member_id, group_id, app_id);
      
        console.log('result', result);

        res.status(201).send(result);
      });
    });









    /**
 * Leave a group
 * 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.delete('/:app_id/groups/:group_id/members/:member_id', (req, res) => {
  // app.delete('/groups/:group_id/members/:member_id', (req, res) => {
  console.log('leave group');

   
    // if (req.method !== 'DELETE') {
    //   res.status(403).send('Forbidden!');
    // }
      
      cors(req, res, () => {

        if (!req.params.member_id) {
            res.status(405).send('member_id is not present!');
        }
        if (!req.params.group_id) {
            res.status(405).send('group_id is not present!');
        }
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        let member_id = req.params.member_id;
        let group_id = req.params.group_id;
        let app_id = req.params.app_id;


        console.log('member_id', member_id);
        console.log('group_id', group_id);
        console.log('app_id', app_id);


        var result =  chatApi.leaveGroup(member_id, group_id, app_id);
      
        console.log('result', result);

        res.status(204).send(result);
      });
    });

  
 /**
 * Set members of a group
 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.put('/:app_id/groups/:group_id/members', (req, res) => {
  console.log('set members group');

   
    if (req.method !== 'PUT') {
      res.status(403).send('Forbidden!');
    }
      
      cors(req, res, () => {

        if (!req.params.group_id) {
            res.status(405).send('group_id is not present!');
        }
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        let members = req.body.members;
        let group_id = req.params.group_id;
        let app_id = req.params.app_id;


        console.log('members', members);
        console.log('group_id', group_id);
        console.log('app_id', app_id);


        var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        console.log('result', result);

        res.status(200).send(result);
      });
    });



    /**
 * Create a contact
 
 * This endpoint supports CORS.
 */
// [START trigger]
app.post('/:app_id/contacts', (req, res) => {
  console.log('create a contact');

   
    if (req.method !== 'POST') {
      res.status(403).send('Forbidden!');
    }
      
      cors(req, res, () => {

        if (!req.body.firstname) {
            res.status(405).send('firstname is not present!');
        }
        if (!req.body.lastname) {
          res.status(405).send('lastname is not present!');
        }
       
        if (!req.params.app_id) {
            res.status(405).send('app_id is not present!');
        }

        let firstname = req.body.firstname;
        let lastname = req.body.lastname;
        let email = req.body.email;

        let current_user = req.user.uid;

        let app_id = req.params.app_id;


        console.log('firstname', firstname);
        console.log('lastname', lastname);
        console.log('current_user', current_user);
        console.log('app_id', app_id);


        var result =  chatApi.createContactWithId(current_user, firstname, lastname, email, app_id);
      
        console.log('result', result);

        res.status(201).send(result);
      });
    });



    /**
 * Auth check
 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.get('/verifytoken', (req, res) => {
  console.log('verifytoken');

   
    if (req.method !== 'GET') {
      res.status(403).send('Forbidden!');
    }
      
      cors(req, res, () => {

        res.status(200).send();
      });
    });
    



// Expose the API as a function
exports.api = functions.https.onRequest(app);

