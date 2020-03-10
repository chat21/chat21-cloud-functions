
'use strict';

const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const functions = require('firebase-functions');

//let functions.config() = JSON.parse(process.env.FIREBASE_CONFIG);

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
module.exports = {
    authenticate : function(req, res, next) {
        console.log('authenticate');

        // if (req.method === `OPTIONS`) {
        //   return next();
        // }

        cors(req, res, () => {

            console.log('req.headers.authorization', req.headers.authorization);
            console.log('req.query.token', req.query.token);
            let authHeader = false;
            let authQueryStr = false;

            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))  {
                authHeader = true;
            }

            if (req.query.token) {
                authQueryStr = true;
            }

            if (authHeader==false && authQueryStr==false){
                console.log('authorization not present');
                res.status(403).send('Unauthorized');
                return;
            }
            let idToken;
            if (authHeader) {
                idToken = req.headers.authorization.split('Bearer ')[1];  
            }
           
            if (authQueryStr) {
                idToken = req.query.token;
                
                let secretToken = functions.config().secret && functions.config().secret.token ? functions.config().secret.token : "chat21-secret-orgAa,";
                console.log('secretToken',secretToken);

                //TODO move to firebase config 
                if (idToken==secretToken){
                    var newUser = {uid:"system"};
                    req.user = newUser
                    return next();
                }
            }

            console.log('idToken', idToken);
            admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
                req.user = decodedIdToken;
                console.log('req.user', req.user);

                return next();
            }).catch(() => {
                res.status(403).send('Unauthorized');
            });


        });


    }


}

