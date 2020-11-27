'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config');

const chatApi = require('./chat-api');
//let functions.region(config.region).config() = JSON.parse(process.env.FIREBASE_CONFIG);


//
// ################ BEGIN EMAIL ################ //  
const nodemailer = require('nodemailer'); 
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: 
// Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// run 'firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"'

//get existing properties with: firebase functions:config:get
var moment = require('moment');


//console.log("email-notification.js loaded");

let mailTransport;

if (!mailTransport) {
  if (functions.config().email.endpoint) {
    //console.log('mail enabled with mailTrasport endpoint ',functions.config().email.endpoint);
    mailTransport = nodemailer.createTransport(functions.config().email.endpoint);
  }

  if (functions.config().email.gmail && functions.config().email.gmail.user  && functions.config().email.gmail.password) {
    // console.log('mail enabled with mailTrasport gmail user',functions.config().email.gmail.user);
    // console.log('mail enabled with mailTrasport gmail password',functions.config().email.gmail.password);

    mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: functions.config().email.gmail.user,
          pass:functions.config().email.gmail.password
        }
      });
  }
}else{
  // console.log('mailTransport already init');
}


exports.sendEmailNotification = functions.region(config.region).database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate((data, context) => {
    const message_id = context.params.message_id;
    const sender_id = context.params.sender_id; 
    const recipient_id = context.params.recipient_id;
    const app_id = context.params.app_id;
    const message = data.val();

    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
   
    // DEBUG console.log('message ' + JSON.stringify(message));


    // la funzione termina se si tenta di mandare la notifica ad un gruppo
    // if (message.channel_type!="direct") { //is a group message
    //     return 0;
    // }

//    DEBUG console.log("message.status : " + message.status);     
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED) {
        return 0;
    }
    
    const promises = [];

    if (sender_id == recipient_id || message.sender == sender_id) {
        console.log('not send push notification for the same user');
        //if sender is receiver, don't send notification
        return 0;
    }

    if (message.sender == "system"){
      console.log('not send email notification for message with system as sender');

      return 0;
    }

    if (sender_id == "system"){
      console.log('not send email notification for system user');

      return 0;
    }

    if (message.attributes && message.attributes.sendnotification==false) {
      console.log('not send push notification because sendnotification is false');
      return 0;
    }

    if (recipient_id.indexOf("support-group")>-1 ){
      console.log('exit for support-group');
      return 0;
     }


    const text = message.text;
    const messageTimestamp = JSON.stringify(message.timestamp);

    // console.log("functions.config().email", functions.config().email);
    // console.log("functions.config().email.enabled", functions.config().email.enabled);

    if (functions.config().email && functions.config().email.enabled && (functions.config().email.enabled === true || functions.config().email.enabled === "true")) {
        return sendNewMessageNotificationEmail(message.sender_fullname, sender_id, message.recipient_fullname, text, app_id, messageTimestamp);
    }else {
        console.log('email is not configured. skip');
        return 0;
    }

    //return 0;

});












// Sends a welcome email to the given user.
function sendNewMessageNotificationEmail(sender_fullname, recipient, recipient_fullname, messageText, tenant, messageTimestamp) {
    // DEBUG console.log("sendWelcomeEmail: sender_fullname == " + sender_fullname + ", recipient == "+ recipient + ", recipient_fullname == " + recipient_fullname + ", messageText == " + messageText + ", tenant == " + tenant + ", messageTimestamp == " + messageTimestamp);
  
    return admin.database().ref(`/apps/${tenant}/contacts/${recipient}/email`).once('value', function(snapshot) {
      // DEBUG console.log("nodeContacts-> snapshotKey: " + snapshot.key + ", snapshotVal: " + snapshot.val());
  
        var recipientEmail = snapshot.val();
  
        var formattedMessageTimestamp = formatTimestamp(messageTimestamp);
        // DEBUG console.log("formattedMessageTimestamp : " + formattedMessageTimestamp);
  
        // var unsubscribe_url = "http://script.chat21.org/chat21/dev/unsubscription/unsubscribe.php?user_id=" + recipient + "&app_id=" + tenant;
        var unsubscribe_url = "http://script.chat21.org/chat21/unsubscription/unsubscribe.php?user_id=" + recipient + "&app_id=" + tenant;
       
        console.log("sendWelcomeEmail: recipientEmail == " + recipientEmail);
  
        if (!recipientEmail){
          console.log("recipientEmail is null");
          return 0;
        }
     
  
        // setup email data with unicode symbols
        let mailOptions = {
          from: `${tenant} <${functions.config().email.from}>`, // sender address
           
            to: recipientEmail, // list of receivers,
            bcc: "andrea.leo@frontiere21.it",
            subject: `New message from ${tenant}`, // Subject line
            // text: `${messageText}`, // plain text body
            // html: `<b>${sender}</b> : ${messageText} <br> to : <b>${recipient}</b>` // html body
            html: 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
  
              <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>New email from Chat21</title>
  
                <style type="text/css">
                  img {
                    max-width: 100%;
                    margin-left:16px;
                    margin-bottom:16px;
                    text-align:center !important;
                  }
                  body {
                    -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;
                  }
                  body {
                    background-color: #f6f6f6;
                  }
  
                  @media only screen and (max-width: 640px) {
                    body {
                      padding: 0 !important;
                    }
                    h1 {
                      font-weight: 800 !important; margin: 20px 0 5px !important;
                      text-align:center !important;
                    }
                    h2 {
                      font-weight: 800 !important; margin: 20px 0 5px !important;
                    }
                    h3 {
                      font-weight: 800 !important; margin: 20px 0 5px !important;
                    }
                    h4 {
                      font-weight: 800 !important; margin: 20px 0 5px !important;
                    }
                    h1 {
                      font-size: 22px !important;
                    }
                    h2 {
                      font-size: 18px !important;
                    }
                    h3 {
                      font-size: 16px !important;
                    }
                    .container {
                      padding: 0 !important; width: 100% !important;
                    }
                    .content {
                      padding: 0 !important;
                    }
                    .content-wrap {
                      padding: 10px !important;
                    }
                    .invoice {
                      width: 100% !important;
                    }
                  }
                </style>
              </head>
  
              <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
  
                <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                    <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                      <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                        <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
  
                            <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; color: #fff; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; background-color: #3A699B; margin: 0;" align="center" bgcolor="#3A699B" valign="top">
                              <div>
                                <p style="float: left;"><img src="http://script.smart21.it/chat21/header_logo.png" height="48px" width="48px" border="1px"></p>
                                <h2>New message from</h2>
                                <h1>${tenant}</h1>
                              </div>
  
                            </td>
                          </tr>
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
  
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    Sender: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${sender_fullname}</strong>
                                  </td>
                                </tr>
  
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    Recipient: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${recipient_fullname}</strong>
                                  </td>
                                </tr>
  
  
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    Message: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${messageText}</strong>
                                  </td>
                                </tr>
  
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    Date: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${formattedMessageTimestamp}</strong>
                                  </td>
                                </tr>
  
                                <!--  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
            <a href="http://www.mailgun.com" class="btn-primary" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #348eda; margin: 0; border-color: #348eda; border-style: solid; border-width: 10px 20px;">Upgrade my account</a>
            </td>
            </tr> -->
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                          <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              <td class="aligncenter content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">
                                <span><a href="http://www.chat21.org" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;" > Chat21 </a> - Open Source chat SDK build on Firebase.</span>
                                <br><span>Powered by <a href="http://www.frontiere21.com" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Frontiere21</a></span>
                                <br><span>Se non desideri ricevere i messaggi di chat tramite email <a href="${unsubscribe_url}">clicca qui</a></span>                  
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </td>
                    <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                  </tr>
                </table>
              </body>
            </html>
            ` // html body
        };

        if (functions.config().email && functions.config().email.enabled) {
        
          if (!mailTransport) {
            throw "mailTransport is not defined";
          }

          console.log('mailOptions', mailOptions);

          // return mailTransport.sendMail(mailOptions).then(() => {
          //   console.log('New email sent to:' +  mailingList);
          //   });

          // get the email settings value
          return admin.database().ref(`/apps/${tenant}/users/${recipient}/settings/email`).once('value').then(function (snapshot) {
            // The Promise was succeeded

            // send the email if the email subscription is enabled
            var isEnabled = snapshot.val();
            console.log("sendNewMessageNotificationEmail: isEnabled == " + isEnabled);

            if(isEnabled === false || isEnabled === "false" ) {
              return 0;
            } else  {
              return mailTransport.sendMail(mailOptions).then(() => {
                console.log('New email sent to:' + recipientEmail);
                return 0;
              });
            }
          }, function (error) {
            // The Promise was rejected.
            console.error(error);
            return error;
          });
        }else {
          console.log('Email not enabled');
          return 0;
        }
  
       
    });
  }


  // it returns an user friendly representation of the timestamp
function formatTimestamp(timestampMS) {
    // DEBUG console.log("timestampMS: " + timestampMS);
  
    // converts unix timestamp to normal
    var timestamp = timestampMS / 1000;
     // DEBUG console.log("timestamp/1000: " + timestamp);
  
    // var pattern = 'dddd MMMM Do YYYY, h:mm:ss a'; // set the format pattern
    var pattern = 'dddd DD/MM/YYYY, HH:mm'; // set the format pattern
  
    moment.locale('it'); // set the locale
    
    var date = moment.unix(timestamp); 
  
    var startdate = moment(date);
    //date = moment(startdate).add(1, 'hours');
  
    var userReadableTimestamp = date.format(pattern);
     // DEBUG  console.log("userReadableTimestamp: " + userReadableTimestamp);
   
    return userReadableTimestamp;
  }
  
  
  
