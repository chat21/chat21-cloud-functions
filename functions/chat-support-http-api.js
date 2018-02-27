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
// const language = new Language({projectId: process.env.GCLOUD_PROJECT});

// admin.initializeApp(functions.config().firebase);

const chatHttpAuth = require('./chat-http-auth');
app.use(chatHttpAuth.authenticate);




  
 /**
 * Close support group
 
 *
 * This endpoint supports CORS.
 */
// [START trigger]
app.put('/:app_id/groups/:group_id', (req, res) => {
  console.log('close support group');

   
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

        let group_id = req.params.group_id;
        let app_id = req.params.app_id;


        console.log('group_id', group_id);
        console.log('app_id', app_id);

        var members = {"system":1};

        var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        updateSupportStatus(group_id, 1000);

        console.log('result', result);

        res.status(200).send(result);
      });
    });



    function updateSupportStatus(group_id, support_status) {
     
      var dataToUpdate = {
        "support_status": support_status
      }

      return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`support_status updated with value: ${JSON.stringify(dataToUpdate)}`);
 
        return 0;
     });
  }


// Expose the API as a function
exports.api = functions.https.onRequest(app);

