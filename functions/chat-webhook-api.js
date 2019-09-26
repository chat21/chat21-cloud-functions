

'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');



class ChatTenantApi {

   getById(app_id) {
        // DEBUG console.log("ChatWebhookApi getById " + app_id + ");

        return new Promise(function(resolve, reject) {
            // Do async job
            return admin.database().ref('/apps/'+app_id+'/setting/').once('value').then(function(snapshot) {
                    
                
                if (snapshot.val()!=null){ //recipient_id is a GROUP
                    var setting = snapshot.val();
                    // DEBUG console.log('group ' + JSON.stringify(group) );
        
                    
                    return resolve(setting);
                }else {
                    var error = 'Warning: webhooks '+ app_id +' not found ';
                    console.log(error );                 
                    return reject(error);
                }
        
        
            }).catch(function(error) {
                return reject(error);
            })
        });
    }

   
   
     create(app_id, owner, webhookUrl) {

        var path = '/apps/'+app_id+'/setting/';
        // console.log("path", path);


        var setting = {};
        setting.owner = owner;
        setting.webhookUrl = webhookUrl;       
        group.createdOn = admin.database.ServerValue.TIMESTAMP;
                     
        console.log("creating tenant " + JSON.stringify(setting) + " to "+ path);
        return admin.database().ref(path).push(setting);
    }

    
}


var chatTenantApi = new ChatTenantApi();


module.exports = chatTenantApi;
