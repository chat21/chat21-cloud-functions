
'use strict';

const admin = require('firebase-admin');
const cors = require('cors')({origin: true});



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

            if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
                console.log('authorization not present');
                res.status(403).send('Unauthorized');
                return;
            }
            const idToken = req.headers.authorization.split('Bearer ')[1];
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

