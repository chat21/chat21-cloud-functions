// UNUSED
const functions = require('firebase-functions');
const config = require('./config');

var db = functions.region(config.region).database;

if (config.databaseInstance) {
  console.log("databaseInstance", config.databaseInstance);
  db = db.instance(config.databaseInstance);
}

return db;
