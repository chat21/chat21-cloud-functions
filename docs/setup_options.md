
# Retrieve your configuration
Run the follow command to retrieve your environment config variables 
```
firebase functions:config:get
``` 

# Admin token
To change the default admin token (default = chat21-secret-orgAa,) run with firebase functions :
```
firebase functions:config:set secretToken=MYSECRET
```

# Push Notification
* With click_action parameter you can choose which page the browser open when a user click on a push nofification. Push notification is supported by chat21-ionic component.

Set the click_action parameter with: 
```
firebase functions:config:set push.web.click_action=https://www.your_chat_url.com
``` 
for example:  
```
firebase functions:config:set push.web.click_action=https://support.YOURDOMAIN.COM/chat
```

# Email Notification
* You can decide to send an email notification for each message sent to a recupient. 

You can enable email notification with: 
```
firebase functions:config:set email.enabled=true
```

## Generic SMTP (Ex. MailGun)
* Configure the SMTP URI endpoint with : 
```
firebase functions:config:set email.endpoint=smtp://<Username>:<password>@smtp.mailgun.org
``` 

* Set email sender with: 
```
firebase functions:config:set email.from=<sender_email>
```

## Example for Gmail
* Configure SMTP with a Gmail account using the following properties: 
```
firebase functions:config:set email.gmail.user=<EMAIL>
``` 
and 
```
firebase functions:config:set email.gmail.password=<PASSWORD>
```

More info here https://community.nodemailer.com/using-gmail/ and here https://medium.com/@manojsinghnegi/sending-an-email-using-nodemailer-gmail-7cfa0712a799

# WebHook

* Configure billing account to make external network call to web services
* Enable webhook with :
```
firebase functions:config:set webhook.enabled=true
```
* Set webhook endpoint with:
```
firebase functions:config:set webhook.url=https://<YOUR_TILEDESK_SERVER>/chat21/requests
```
For example: 
```
firebase functions:config:set webhook.url=https://tiledesk-server-pre.herokuapp.com/chat21/requests
```




# Experimental features and configurations

## Support Mode
* Enable Support features with: ```firebase functions:config:set support.enabled=true```
* Set Tiledesk-server endpoint with: ```firebase functions:config:set support.api.url=https://<YOUR_TILEDESK_SERVER>```. For example 
```firebase functions:config:set support.api.url=https://tiledesk-server-test03.herokuapp.com```
* Create a Tiledesk user with ```curl -v -X POST -d 'email=api@f21.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup```
* Set the api basic auth token for the new user with: ```firebase functions:config:set support.api.authtoken='Basic BLABLA'```
* Enable Firestore database under Firebase Console with Allow All permissions

## Channel general

* Disable the option "Automatically join the General Group on signup" with ```firebase functions:config:set group.general.autojoin=false```

## BOT Setup
* Create a bot user with the mobile app or web app. Ex: email:bot@chat21.org, firstname: Bot, lastname: Chat21,etc.
* Retrieve the bot user id (<BOT_UID>) from the profile tab of the mobile app or from firebase autentication tab
* Set the bot user id <BOT_UID> parameter with ```firebase functions:config:set bot.uid=<BOT_UID>```

## FB Messenger
* Create an FB APP. More info here https://developers.facebook.com/docs/messenger-platform/webhook
* Create a webhook with a URL like this https://us-central1-chat-v2-dev.cloudfunctions.net/webhookapi/<PROJECT_ID>.  
    Example: https://us-central1-chat-v2-dev.cloudfunctions.net/webhookapi/5ae1aaca86724100146e1e74/

* Enable FB webhook with ```firebase functions:config:set fbwebhook.enabled=true```
* Set FB secret with ```firebase functions:config:set fbwebhook.secret=<WEBHOOK FB SECRET>```
