
# Setup Options
Use with Google Cloud environment to configure the platform.

## Email Notification
* Enable email notification with: ```firebase functions:config:set email.enabled=true```

### Generic SMTP (Ex. MailGun)
* Set STMP URI endpoint with : ```firebase functions:config:set email.endpoint=smtp://<Username>:<password>@smtp.mailgun.org``` 
        (Unset with ```firebase functions:config:unset email.endpoint```)
### Gmail
* Set Gmail account with  : ```firebase functions:config:set email.gmail.user=frontiere21@gmail.com``` and ```firebase functions:config:set email.gmail.password=ft21gmail``` More info here https://community.nodemailer.com/using-gmail/ and here https://medium.com/@manojsinghnegi/sending-an-email-using-nodemailer-gmail-7cfa0712a799


# SUPPORT MODE
* Enable Support features with: ```firebase functions:config:set support.enabled=true```

# CHANNEL GENERAL

* Disable the option "Automatically join the General Group on signup" with ```firebase functions:config:set group.general.autojoin=false```

## BOT Setup
* Create a bot user with the mobile app or web app. Ex: email:bot@chat21.org, firstname: Bot, lastname: Chat21,etc.
* Retrieve the bot user id (<BOT_UID>) from the profile tab of the mobile app or from firebase autentication tab
* Set the bot user id <BOT_UID> parameter with ```firebase functions:config:set bot.uid=<BOT_UID>```

## FB Messenger
* Create an FB APP 
* Enable FB webhook with ```firebase functions:config:set webhook.enabled=true```
* Set FB secret with ```firebase functions:config:set webhook.secret=EAANskcQny4cBAIpgGUvuHNoHCpgIcyTTJpzZBZCjlZAxaMtTnJcfEBQZBniOUnNr92ThWbTOtMEZCfAazxaFhVnq1WpLmZBUhnTfJUlmO4xF37telaUZCpCECqaObMeyumZB4UGP0BZChSER9ce3uVA8HBMIJTAHa097V3bnNcLACB7qVTCySNg3c```