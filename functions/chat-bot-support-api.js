

'use strict';

// const admin = require('firebase-admin');
const request = require('request-promise');  

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const chatUtil = require('./chat-util');
const chatSupportApi = require('./chat-support-api');




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


class ChatBotSupportApi {




    askToInternalQnaBot (id_faq_kb, question, message) {

        
        var url = BASE_API_URL+ "/"+projectid+"/faq_kb/askbot";

        console.log('url', url);

        console.log('question', question);



        return new Promise(function(resolve, reject) {

                return request({            
                    uri :  url,
                    headers: {
                        // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
                        'Authorization': AUTHORIZATION_TOKEN_API,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    json: true,
                    body: {"id_faq_kb":id_faq_kb ,"question": question},
                    //resolveWithFullResponse: true
                    }).then(response => {
                    if (response.statusCode >= 400) {
                        // throw new Error(`HTTP Error: ${response.statusCode}`);
                        return reject(`HTTP Error: ${response.statusCode}`);
                    }
            
                    // console.log('SUCCESS! Posted', event.data.ref);        
                    console.log('SUCCESS! response', JSON.stringify(response));
                    

                    var answer = null;
                    // var response_options;
                    var score = 0;

                    if (response.hits && response.hits.length>0) {
                        answer = entities.decode(response.hits[0].answer);
                        console.log('answer', answer);    

                        score = response.hits[0].score;
                        console.log('score', score);    

                    }
                        // answer = answer + " " +  chatUtil.getMessage("DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE", message.language, chatBotSupportApi.LABELS);

                        // response_options = { "question" : "Sei soddisfatto della risposta?",
                        // "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

                    // }else if (answer == "\\agent"){ //if \\agent dont append se sei siddisfatto...
            
                    // }else {
                    //     answer = "Non ho trovato una risposta nella knowledge base. \n Vuoi parlare con un operatore oppure riformulare la tua domanda ? \n Digita \\agent per parlare con un operatore oppure formula un nuova domanda.";
            
                    //     response_options = { "question" : "Vuoi parlare con un operatore?",
                    //     "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};

                    // }
                        
            
                    // let resp = {answer:answer, response_options:response_options};
                    let resp = {answer:answer, score: score};

                    
                    
                    return resolve(resp);

                });

        });

    }


    /*

    curl -v -X POST \
    -H "Content-Type: application/json"  \
    -u 'frontiere21:password' \
    -d '{"question":"come ti chiami?","doctype":"normal","min_score":0.0}' \
'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/2f5d6f6e-fb26-4ba2-b705-91d24b96cf79/generateAnswer'

*/
    askToInternalAdvancedQnaBot (kq_id, question, message) {

        let qnaServiceUrl = "http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/"+kq_id+"/generateAnswer";
        
        console.log('qnaServiceUrl', qnaServiceUrl);

        try {
            if (question.toLowerCase().indexOf("oggi")>-1) {
                question = question + " " + new Date().toJSON().slice(0,10);
            }
            if (question.toLowerCase().indexOf("domani")>-1) {
                var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                question = question + " " + tomorrow.toJSON().slice(0,10);
            }
        }catch(e){
            console.log('error adding date extra');
        }
        

        console.log('question', question);



        return new Promise(function(resolve, reject) {

                return request({            
                    uri :  qnaServiceUrl,
                    headers: {
                        //'Authorization': "Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ=",
                        'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA==',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    json: true,
                    body: {"question": question,"doctype":"normal","min_score":0.0},
                    //resolveWithFullResponse: true
                    }).then(response => {
                    if (response.statusCode >= 400) {
                        // throw new Error(`HTTP Error: ${response.statusCode}`);
                        return reject(`HTTP Error: ${response.statusCode}`);
                    }
            
                    // console.log('SUCCESS! Posted', event.data.ref);        
                    console.log('SUCCESS! response', JSON.stringify(response));
                    

                    var answer = null;
                    // var response_options;
                    var score = 0;

                    if (response.hits && response.hits.length>0) {
                        answer = entities.decode(response.hits[0].document.answer);
                        console.log('answer', answer);    

                        score = response.hits[0].score;
                        console.log('score', score);    

                    }
                        // answer = answer + " " +  chatUtil.getMessage("DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE", message.language, chatBotSupportApi.LABELS);

                        // response_options = { "question" : "Sei soddisfatto della risposta?",
                        // "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};

                    // }else if (answer == "\\agent"){ //if \\agent dont append se sei siddisfatto...
            
                    // }else {
                    //     answer = "Non ho trovato una risposta nella knowledge base. \n Vuoi parlare con un operatore oppure riformulare la tua domanda ? \n Digita \\agent per parlare con un operatore oppure formula un nuova domanda.";
            
                    //     response_options = { "question" : "Vuoi parlare con un operatore?",
                    //     "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};

                    // }
                        
            
                    // let resp = {answer:answer, response_options:response_options};
                    let resp = {answer:answer, score: score};

                    
                    
                    return resolve(resp);

                });

        });

    }

    askToQnaBot (question, qnaServiceUrl, qnaKey, message) {
          
        console.log('qnaServiceUrl', qnaServiceUrl);
        console.log('qnaKey', qnaKey);
    
        
        // chatApi.sendGroupMessage(sender_id, "Bot", recipient_id, "Support Group", "Ciao sono il Bot, sto cercado una risposta alla tua domanda. Un attimo di pazienza...", app_id);
    
        return new Promise(function(resolve, reject) {

                return request({
                    //uri: "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/f486b8ed-b587-413a-948e-e02c9a129d12/generateAnswer",
            
                    uri :  qnaServiceUrl,
                    headers: {
                        //'Ocp-Apim-Subscription-Key': '59c2511b9825415eb4254ab8a7d4b094',
                        'Ocp-Apim-Subscription-Key': qnaKey,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    json: true,
                    body: {"question": question},
                    //resolveWithFullResponse: true
                    }).then(response => {
                    if (response.statusCode >= 400) {
                        // throw new Error(`HTTP Error: ${response.statusCode}`);
                        return reject(`HTTP Error: ${response.statusCode}`);
                    }
            
                    // console.log('SUCCESS! Posted', event.data.ref);        
                    console.log('SUCCESS! response', response);
            
                    var answer = entities.decode(response.answers[0].answer);
                    console.log('answer', answer);    
            
                    var question = response.answers[0].questions[0];
                    console.log('question', question);        
            
            
                    var response_options;
            
                    if (answer == "No good match found in the KB"){
                        answer = "Non ho trovato una risposta nella knowledge base. \n Vuoi parlare con un operatore oppure riformulare la tua domanda ? \n Digita \\agent per parlare con un operatore oppure formula un nuova domanda.";
            
                        response_options = { "question" : "Vuoi parlare con un operatore?",
                        "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};
                    }else if (answer == "\\agent"){ //if \\agent dont append se sei siddisfatto...
            
                    }else {
                        answer = answer + " Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure \\agent per parlare con un operatore.";
                        response_options = { "question" : "Sei soddisfatto della risposta?",
                        "answers":[{"close":"Si grazie, chiudi la chat di supporto."}, {"agent":"NO, voglio parlare con un operatore"}]};
            
                    }
                    let resp = {answer:answer, response_options:response_options};

                    return resolve(resp);

                });

        });

    }
      

    getBotMessage(qnaresp, projectid, departmentid, message, bot, agent) {

        return new Promise(function(resolve, reject) {


            return chatSupportApi.getDepartmentOperator(projectid, departmentid, agent, false).then(dep_op_response => {

                    var bot_answer="";
                    // var response_options;

                    if (qnaresp.answer) {

                        if (qnaresp.answer.startsWith("\\")) { //if \\agent dont append se sei siddisfatto...

                        } else {
                            if (qnaresp.score>100) {

                            }else {

                                if (dep_op_response.availableAgentsCount>0) {
                                    var message_key = "DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE";
                                    if (bot.department.bot_only){
                                        message_key = "DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE";
                                    }
                                } else {
                                    message_key = "DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE";
                                }
                                

                                bot_answer = chatUtil.getMessage(message_key, message.language, chatBotSupportApi.LABELS);
                            }
                        }
                       

                    } else {

                        if (dep_op_response.availableAgentsCount>0) {

                            var message_key = "DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE";
                            if (bot.department.bot_only){
                                message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";                            
                            }

                        }else {
                            message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";
                        }   
                        bot_answer = chatUtil.getMessage(message_key, message.language, chatBotSupportApi.LABELS);

                        // response_options = { "question" : "Vuoi parlare con un operatore?",
                        // "answers":[{"agent":"Si, voglio parlare con un operatore."}, {"noperation":"NO, riformulo la domanda"}]};

                    }


                
                    if (bot_answer.length>0) {
                        return resolve(bot_answer);
                    } else {
                        return resolve(null);
                    }
                
            });

    });

    }
  
}


var chatBotSupportApi = new ChatBotSupportApi();

chatBotSupportApi.LABELS = {
    EN : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "If you want digit \\agent to talk to a human agent.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "I can not provide an adequate answer. \n Write a new question or type \\agent to talk to a human agent.",
        //DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Are you satisfied with the answer ?. \ n If you are satisfied, type \\ close to close the support chat or reformulate your question.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "I did not find an answer in the knowledge base. \n Please reformulate your question?"
    },
    IT : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "Se vuoi digita \\agent per parlare con un operatore umano.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Formula una nuova domanda oppure digita \\agent per parlare con un operatore umano.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        // DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure riformula la tua domanda.",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    },
    "IT-IT" : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "Se vuoi digita \\agent per parlare con un operatore umano.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Formula una nuova domanda oppure digita \\agent per parlare con un operatore umano.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        // DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure riformula la tua domanda.",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    }
}

module.exports = chatBotSupportApi;