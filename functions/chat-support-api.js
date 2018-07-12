

'use strict';

const admin = require('firebase-admin');
const chatApi = require('./chat-api');
const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

class ChatSupportApi {

    //unused
    updateSupportStatus(group_id, support_status) {
        
        var dataToUpdate = {
        "support_status": support_status
        }

        return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`support_status updated with value: ${JSON.stringify(dataToUpdate)}`);

        return 0;
        });
    }

    closeChat(group_id, app_id) {
        var members = {"system":1};

        // this.updateSupportStatus(group_id, this.CHATSUPPORT_STATUS.CLOSED);

        var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        return result;
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


      getDepartmentOperator(projectid, departmentid) {


        var that = this;

        return new Promise(function(resolve, reject) {

            var assigned_operator_id;
            var idBot;
            var agents = [];
            var availableAgents= [];
            var availableAgentsCount= 0;
            
            var objectyToReturn = {};

            
            // {
            //     department:{
            //        _id:'5b439a78e10db0001461d991',
            //        updatedAt:'2018-07-09T17:48:53.788Z',
            //        createdAt:'2018-07-09T17:25:12.972Z',
            //        name:'Default Department',
            //        id_project:'5b439a78e10db0001461d98f',
            //        createdBy:'5aaa99024c3b110014b478f0',
            //        __v:0,
            //        id_bot:'5b439b28e10db0001461d992',
            //        bot_only:true,
            //        default:true,
            //        routing:'assigned'
            //     },
            //     available_agents:[
            //        {
            //           _id:'5b439a78e10db0001461d990',
            //           updatedAt:'2018-07-09T17:25:12.961Z',
            //           createdAt:'2018-07-09T17:25:12.961Z',
            //           id_project:'5b439a78e10db0001461d98f',
            //           id_user:'5aaa99024c3b110014b478f0',
            //           role:'owner',
            //           user_available:true,
            //           createdBy:'5aaa99024c3b110014b478f0',
            //           __v:0
            //        },
            //        {
            //           _id:'5b44d4b2ef5dca0014d77828',
            //           updatedAt:'2018-07-10T15:45:54.460Z',
            //           createdAt:'2018-07-10T15:45:54.460Z',
            //           id_project:'5b439a78e10db0001461d98f',
            //           id_user:'5ad5bd40c975820014ba9009',
            //           role:'admin',
            //           user_available:true,
            //           createdBy:'5aaa99024c3b110014b478f0',
            //           __v:0
            //        }
            //     ],
            //     agents:[
            //        {
            //           _id:'5b439a78e10db0001461d990',
            //           updatedAt:'2018-07-09T17:25:12.961Z',
            //           createdAt:'2018-07-09T17:25:12.961Z',
            //           id_project:'5b439a78e10db0001461d98f',
            //           id_user:'5aaa99024c3b110014b478f0',
            //           role:'owner',
            //           user_available:true,
            //           createdBy:'5aaa99024c3b110014b478f0',
            //           __v:0
            //        },
            //        {
            //           _id:'5b44d4b2ef5dca0014d77828',
            //           updatedAt:'2018-07-10T15:45:54.460Z',
            //           createdAt:'2018-07-10T15:45:54.460Z',
            //           id_project:'5b439a78e10db0001461d98f',
            //           id_user:'5ad5bd40c975820014ba9009',
            //           role:'admin',
            //           user_available:true,
            //           createdBy:'5aaa99024c3b110014b478f0',
            //           __v:0
            //        }
            //     ],
            //     operators:[
            //        {
            //           id_user:'bot_5b439b28e10db0001461d992'
            //        }
            //     ]
            //  }

            if (projectid=="5b439a78e10db0001461d98f") {

                objectyToReturn["assigned_operator_id"] = "bot_5b439b28e10db0001461d992";
                objectyToReturn["idBot"] = "5b439b28e10db0001461d992";
                objectyToReturn["agents"] = 
                    [
                           {
                              _id:'5b439a78e10db0001461d990',
                              updatedAt:'2018-07-09T17:25:12.961Z',
                              createdAt:'2018-07-09T17:25:12.961Z',
                              id_project:'5b439a78e10db0001461d98f',
                              id_user:'5aaa99024c3b110014b478f0',
                              role:'owner',
                              user_available:true,
                              createdBy:'5aaa99024c3b110014b478f0',
                              __v:0
                           },
                           {
                              _id:'5b44d4b2ef5dca0014d77828',
                              updatedAt:'2018-07-10T15:45:54.460Z',
                              createdAt:'2018-07-10T15:45:54.460Z',
                              id_project:'5b439a78e10db0001461d98f',
                              id_user:'5ad5bd40c975820014ba9009',
                              role:'admin',
                              user_available:true,
                              createdBy:'5aaa99024c3b110014b478f0',
                              __v:0
                           }
                        ];

                objectyToReturn["availableAgents"] = 

                [
                           {
                              _id:'5b439a78e10db0001461d990',
                              updatedAt:'2018-07-09T17:25:12.961Z',
                              createdAt:'2018-07-09T17:25:12.961Z',
                              id_project:'5b439a78e10db0001461d98f',
                              id_user:'5aaa99024c3b110014b478f0',
                              role:'owner',
                              user_available:true,
                              createdBy:'5aaa99024c3b110014b478f0',
                              __v:0
                           },
                           {
                              _id:'5b44d4b2ef5dca0014d77828',
                              updatedAt:'2018-07-10T15:45:54.460Z',
                              createdAt:'2018-07-10T15:45:54.460Z',
                              id_project:'5b439a78e10db0001461d98f',
                              id_user:'5ad5bd40c975820014ba9009',
                              role:'admin',
                              user_available:true,
                              createdBy:'5aaa99024c3b110014b478f0',
                              __v:0
                           }
                        ];

                objectyToReturn["availableAgentsCount"] = 2;
                console.log('objectyToReturn special for 5b439a78e10db0001461d98f', objectyToReturn);


                return resolve(objectyToReturn);

            } else {

           

                return request({
                    uri :  "http://api.chat21.org/"+projectid+"/departments/"+departmentid+"/operators",
                    headers: {
                        'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
                        'Content-Type': 'application/json'
                    },
                    method: 'GET',
                    json: true,
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
                                console.log('objectyToReturn', objectyToReturn);


                                return resolve(objectyToReturn);
                            }
                        }
                    
            
                    }) .catch(function(error) { 
                        console.log("Error getting department.", error); 
                        return reject(error);
                    });
            }




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
        THANKS_MESSAGE: "Thank you for using our support system"
    },
    IT : {
        JOIN_OPERATOR_MESSAGE : "La stiamo mettendo in contatto con un operatore. Attenda...",
        NO_AVAILABLE_OPERATOR_MESSAGE : "Salve al momento non è disponibile alcun operatore. Lasci un messaggio in chat, la contatteremo presto.",
        TOUCHING_OPERATOR :"La stiamo mettendo in contatto con un operatore. Attenda...",
        THANKS_MESSAGE: "Grazie per aver utilizzato il nostro sistema di supporto"
    },
    "IT-IT" : {
        JOIN_OPERATOR_MESSAGE : "La stiamo mettendo in contatto con un operatore. Attenda...",
        NO_AVAILABLE_OPERATOR_MESSAGE : "Salve al momento non è disponibile alcun operatore. Lasci un messaggio in chat, la contatteremo presto.",
        TOUCHING_OPERATOR :"La stiamo mettendo in contatto con un operatore. Attenda...",
        THANKS_MESSAGE: "Grazie per aver utilizzato il nostro sistema di supporto"
    }
}


module.exports = chatSupportApi;