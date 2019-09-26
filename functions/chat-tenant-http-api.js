'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatTenantApi = require('./chat-webhook-api.js');
const express = require('express');
const cors = require('cors')({origin: true});

const app = express();
const chatHttpAuth = require('./chat-http-auth');







/* AUTH REST

 * https://firebase.google.com/docs/reference/rest/auth/#section-sign-in-email-password
 * 

*/




app.use(chatHttpAuth.authenticate);



/**
 * create a tenant.
 *
 * This endpoint supports CORS.
 */

app.post('/apps', (req, res) => {
  console.log('create a tenant');

   
      if (req.method !== 'POST') {
        res.status(403).send('Forbidden!');
      }
      
      cors(req, res, () => {
        let owner = req.user.uid;

        if (!req.body.app_id) {
            res.status(405).send('app_id is not present!');
        }
       

        let app_id = req.body.app_id;
        let webhookUrl = req.body.webhookUrl;
      
     
        console.log('app_id', app_id);
        console.log('webhookUrl', webhookUrl);
       


        //create(app_id, owner, webhookUrl) {
        chatTenantApi.create(app_id, owner, webhookUrl).then(function(result) {
            console.log('result', result);
            res.status(201).send(result);
          });
       

        
        // [END sendResponse]
      });
    });



});




// Expose the API as a function
exports.apiapps = functions.https.onRequest(app);
