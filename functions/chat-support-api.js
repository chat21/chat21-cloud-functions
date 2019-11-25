

'use strict';

const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

var BASE_API_URL;
var AUTHORIZATION_TOKEN_API;

const functions = require('firebase-functions');

if (functions.config().support.api && functions.config().support.api.url) {
    BASE_API_URL = functions.config().support.api.url;
    console.log('BASE_API_URL', BASE_API_URL);

}
if (!BASE_API_URL) {
    console.error('BASE_API_URL is not defined');
}


if (functions.config().support.api && functions.config().support.api.authtoken) {
    AUTHORIZATION_TOKEN_API = functions.config().support.api.authtoken;
    console.log('AUTHORIZATION_TOKEN_API', AUTHORIZATION_TOKEN_API);

}
if (!AUTHORIZATION_TOKEN_API) {
    console.error('AUTHORIZATION_TOKEN_API is not defined');
}

class ChatSupportApi {

    //unused
    updateSupportStatus(group_id, support_status) {
        return new Promise(function(resolve, reject) {

            var dataToUpdate = {
                "support_status": support_status
            }

            return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
                // Send back a message that we've succesfully written the message
                console.log(`support_status updated with value: ${JSON.stringify(dataToUpdate)}`);
                return resolve(writeResult);
            });
        });
    }
    openChat(group_id, app_id) {

        return admin.firestore().collection("conversations").doc(group_id).get().then(docConvRef => {
            if (docConvRef.exists) {
    
                console.log("docConvRef", docConvRef);
                    
                    var docConv = docConvRef.data();
    
                    console.log("docConv.members", docConv.members);
    
                    if (docConv.members) {

                        var newMembersCount = Object.keys(docConv.members).length
                        console.log("newMembersCount", newMembersCount);

                        var newStatus;
                        if (newMembersCount<=1) {
                            newStatus = this.CHATSUPPORT_STATUS.CLOSED;                            
                           } else if (newMembersCount==2) {
                            newStatus = this.CHATSUPPORT_STATUS.UNSERVED;                            
                           } else {  //>2
                            newStatus = this.CHATSUPPORT_STATUS.SERVED;                            
                           }     
                        
                           return this.updateSupportStatus(group_id, newStatus).then(function() {
                                return chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", "Chat reopened", app_id, {subtype:"info/support","updateconversation" : false, messagelabel: {key: "CHAT_REOPENED"} });
                           });
                        } else {
                            console.log("no members");
                            return 0;
                        }
            }else {
                return 0;
            }

    });

        
      
        // var members = {"system":1};
        // var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        // return result;
    }


    closeChat(group_id, app_id) {

        return this.updateSupportStatus(group_id, this.CHATSUPPORT_STATUS.CLOSED).then(function() {
            return chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", "Chat closed", app_id, {subtype:"info/support","updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"} });
       });
      
        // var members = {"system":1};
        // var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        // return result;
    }


    removeBotFromGroupMember(group_id, app_id) {
        // DEBUG console.log('removeBotFromGroupMember for group : ' + group_id);
      
        //remove bot from members
        return chatApi.getGroupMembers(group_id, app_id).then(function (groupMembers) {
          
          groupMembers.forEach(function(groupMember) {
            //   DEBUG console.log('groupMember ' + groupMember);
      
                  if (groupMember.startsWith("bot_")) { 
                      console.log('removing bot with id  ' + groupMember + " from group with id " + group_id);
                      return chatApi.leaveGroup(groupMember, group_id, app_id);
                  }
              });
      
              return 0;
      
          }); 
      }


      getDepartmentOperator(projectid, departmentid, agent, nobot) {


        var that = this;

        return new Promise(function(resolve, reject) {

            var assigned_operator_id;
            var idBot;
            var agents = [];
            var availableAgents= [];
            var availableAgentsCount= 0;
            
            var objectyToReturn = {};

            var url = BASE_API_URL+ "/"+projectid+"/departments/"+departmentid+"/operators";
            
            if (nobot){
                url = url + '?nobot=true';
            }

            console.log(`url`, url);


                return request({
                    uri : url,
                    headers: {
                        // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
                        'Authorization': AUTHORIZATION_TOKEN_API,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET',
                    json: true,
                    agent: agent //The same approach works for HTTPS—just use https.Agent instead of http.Agent.
                    //resolveWithFullResponse: true
                    }).then(response => {
                    
                        if (!response) {
                            // throw new Error(`HTTP Error: ${response.statusCode}`);
                            console.log(`Error getting department.`);
                            return reject(response);

                        }else {
                            console.log('SUCCESS! response', response);
            
                            if (response) {

                                if (response.operators  && response.operators.length>0) {
                                    // var id_bot = "bot_"+response.id_bot;
                                    assigned_operator_id = response.operators[0].id_user;
                                    console.log('assigned_operator_id', assigned_operator_id);

                                    //group_members[assigned_operator_id] = 1; //bot
                                }
                                idBot = response.department.id_bot;
                                console.log('idBot', idBot);

                                if (response.agents) {
                                    agents = response.agents;
                                    console.log('agents', agents);

                                }
                                if (response.available_agents) {
                                    availableAgents = response.available_agents;
                                    console.log('availableAgents', availableAgents);

                                    availableAgentsCount = availableAgents.length;
                                    console.log('availableAgentsCount', availableAgentsCount);
                                }

                                objectyToReturn["assigned_operator_id"] = assigned_operator_id;
                                objectyToReturn["idBot"] = idBot;
                                objectyToReturn["agents"] = agents;
                                objectyToReturn["availableAgents"] = availableAgents;
                                objectyToReturn["availableAgentsCount"] = availableAgentsCount;
                                objectyToReturn["departmentid"] = response.department._id;
                                console.log('objectyToReturn', objectyToReturn);


                                return resolve(objectyToReturn);
                            }
                        }
                    
            
                    }) .catch(function(error) { 
                        console.log("Error getting department.", error); 
                        return reject(error);
                    });
            


        });

      }

    sendEmail(request_id, user_id, projectid, message) {

        var url = BASE_API_URL + "/public/requests/" + request_id + "/notify/email?user_id=" + user_id;
        console.log(`url`, url);

        var requestData = {
            first_text: message.text,
            requester_id: message.sender,
            id_project: projectid,
            request_id: request_id
          };

        // var data = {
        //     // request_id: request_id,
        //     user_id: user_id,
        //     // app_id: app_id,
        //     // projectid: projectid
        // };

        console.log(`requestData`, requestData);

        return request({
            uri : url,
            headers: {
                // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
                'Authorization': AUTHORIZATION_TOKEN_API,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            json: true,
            body: requestData,
            //agent: agent //The same approach works for HTTPS—just use https.Agent instead of http.Agent.
            //resolveWithFullResponse: true
            }).then(response => {
            
                if (!response) {
                    // throw new Error(`HTTP Error: ${response.statusCode}`);
                    console.log(`Error sending email.`);
                    return 0;

                }else {
                    console.log(`Email sent from cloud code.`);
                    return 0;
                }
            }).catch(function(error) { 
                console.log("Error sending email.", error); 
                return 0;
            });
    }

      getBot(bot_id, projectid, departmentid, agent) {
        var that = this;

        return new Promise(function(resolve, reject) {

            var url = BASE_API_URL+ "/" +projectid+"/faq_kb/"+bot_id;

            if (departmentid) {
                url = url +"?departmentid="+departmentid;
            }
            console.log('url', url);  

            return request({
                uri: url,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTHORIZATION_TOKEN_API,
                    //'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
                },
                method: 'GET',
                json: true,
                agent: agent,
                //resolveWithFullResponse: true
                }).then(response => {
                    if (!response) {
                       // throw new Error(`HTTP Error`);
                       console.error('HTTP Error', response);  
                       return reject(response);       
                    }else {
                        console.log('SUCCESS! response', response);

                        return resolve(response);
                    }
                });
        });
      }




      getFaq(bot_id, projectid, text, agent) {
        var that = this;

        return new Promise(function(resolve, reject) {

            var url = BASE_API_URL+ "/" +projectid+"/faqpub/?id_faq_kb="+bot_id;
            // var url = BASE_API_URL+ "/" +projectid+"/faq/?id_faq_kb="+bot_id+"&text="+text;

           
            console.log('url', url);  

            return request({
                uri: url,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTHORIZATION_TOKEN_API,
                    //'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
                },
                method: 'GET',
                json: true,
                agent: agent,
                //resolveWithFullResponse: true
                }).then(response => {
                    if (!response) {
                       // throw new Error(`HTTP Error`);
                       console.error('HTTP Error', response);  
                       return reject(response);       
                    }else {
                        console.log('SUCCESS! response', response);

                        var faqfound = response.filter(function (item) {
                            return item.question===text;
                           });
                           console.log('SUCCESS! faqfound', faqfound);

                        return resolve(faqfound);
                    }
                });
        });
      }


   
      //UNUSED
      createRequest(projectid, newRequest) {
        var that = this;

        return new Promise(function(resolve, reject) {

            return request({
                uri: BASE_API_URL+ "/" + projectid + "/requests",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTHORIZATION_TOKEN_API,
                    // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
                },
                method: 'POST',
                json: true,
                body: newRequest,
                //resolveWithFullResponse: true
                }).then(response => {
                if (response.statusCode >= 400) {
                    // throw new Error(`HTTP Error: ${response.statusCode}`);
                    console.error(`HTTP Error: ${response.statusCode}`);
                   return reject(response); 
                   // return resolve(response);

                }else {
                    console.log('Saved successfully to backend with response', response);  
                }

                return resolve(response);
                // return response;             
                
            });
        });
      }

      //UNUSED
      saveMessage(message,projectid ) {
        var that = this;

        return new Promise(function(resolve, reject) {
            return request({
                uri: BASE_API_URL+ "/" + projectid + "/messages",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTHORIZATION_TOKEN_API,
                    // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA=='
                },
                method: 'POST',
                json: true,
                body: message,
                //resolveWithFullResponse: true
                }).then(response => {
                if (response.statusCode >= 400) {
                    // throw new Error(`HTTP Error: ${response.statusCode}`);
                    console.error(`HTTP Error: ${response.statusCode}`);
                    return reject(response);  
                }

                // console.log('SUCCESS! Posted', data.ref);        
                console.log('SUCCESS! response', response);           
                
                return resolve(response);

                });
        });

      }
      
  





      //class end
}


var chatSupportApi = new ChatSupportApi();

chatSupportApi.CHATSUPPORT_STATUS = {
            CREATED : 0,
            UNSERVED : 100, 
            SERVED : 200, 
            CLOSED : 1000, 
        }

chatSupportApi.SUPPORT_APP_ID = "tiledesk";

chatSupportApi.LABELS = {
    EN : {
        JOIN_OPERATOR_MESSAGE : "We are putting you in touch with an operator..",
        NO_AVAILABLE_OPERATOR_MESSAGE : "Hello, no operators are available at the moment. Please leave a chat message, we will reply to you soon.",
        TOUCHING_OPERATOR: "We are putting you in touch with an operator. Please wait..",
        THANKS_MESSAGE: "Thank you for using our support system",
        REOPEN_MESSAGE : "Chat re-opened"
    },
    IT : {
        JOIN_OPERATOR_MESSAGE : "La stiamo mettendo in contatto con un operatore. Attenda...",
        NO_AVAILABLE_OPERATOR_MESSAGE : "Salve al momento non è disponibile alcun operatore. Lasci un messaggio in chat, la contatteremo presto.",
        TOUCHING_OPERATOR :"La stiamo mettendo in contatto con un operatore. Attenda...",
        THANKS_MESSAGE: "Grazie per aver utilizzato il nostro sistema di supporto",
        REOPEN_MESSAGE : "Chat riaperta"
    },
    "IT-IT" : {
        JOIN_OPERATOR_MESSAGE : "La stiamo mettendo in contatto con un operatore. Attenda...",
        NO_AVAILABLE_OPERATOR_MESSAGE : "Salve al momento non è disponibile alcun operatore. Lasci un messaggio in chat, la contatteremo presto.",
        TOUCHING_OPERATOR :"La stiamo mettendo in contatto con un operatore. Attenda...",
        THANKS_MESSAGE: "Grazie per aver utilizzato il nostro sistema di supporto",
        REOPEN_MESSAGE : "Chat riaperta"
    }
}


module.exports = chatSupportApi;