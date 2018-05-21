

'use strict';

const admin = require('firebase-admin');

class ChatApi {


// constructor(val) {
//     ChatApi.CHAT_MESSAGE_STATUS = {
//         FAILED : -100,
//         SENDING : 0,
//         SENT : 100, //saved into sender timeline
//         DELIVERED : 150, //delivered to recipient timeline
//         RECEIVED : 200, //received from the recipient client
//         RETURN_RECEIPT: 250, //return receipt from the recipient client
//         SEEN : 300 //seen

//     }
// }

// exports.CHAT_MESSAGE_STATUS = CHAT_MESSAGE_STATUS;

    sendDirectMessage(sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id, attributes) {

            var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_id;
            // console.log("path", path);
        
        
            var message = {};

            if (attributes)
                message.attributes = attributes;  //at first position because the following basic data will overwrite potencial inconsistence attributes

            // message.status = CHAT_MESSAGE_STATUS.SENDING;                                        
            message.sender = sender_id;
            message.sender_fullname = sender_fullname;
            message.recipient = recipient_id;
            message.recipient_fullname = recipient_fullname;
            // message.timestamp = admin.database.ServerValue.TIMESTAMP;
            message.channel_type = "direct";
            message.text = text;
            message.type = "text";
        
            console.log("sendDirectMessage with message " + JSON.stringify(message)  + " to " + path);
            return admin.database().ref(path).push(message);
        }





    sendGroupMessage(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id, attributes, projectid) {

        var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_group_id;
        // console.log("path", path);


        var message = {};

        if (attributes)
            message.attributes = attributes;  //at first position because the following basic data will overwrite potencial inconsistence attributes
            
        // message.status = CHAT_MESSAGE_STATUS.SENDING;                                        
        message.sender = sender_id;
        message.sender_fullname = sender_fullname;
        message.recipient = recipient_group_id;
        message.recipient_fullname = recipient_group_fullname;
        // message.timestamp = admin.database.ServerValue.TIMESTAMP;
        message.channel_type = "group";
        message.text = text;
        message.type = "text";

        if (projectid) {
            message.projectid = projectid;
        }

        console.log("sendGroupMessage with  message " + JSON.stringify(message)  + " to " + path);
        return admin.database().ref(path).push(message);   //send message to group timeline


        // var newMessageRef = admin.database().ref(path).push(message);   //send message to group timeline

        // var message_id = newMessageRef.key;

        // return sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id);


    }

    deleteMessageForAll(sender_id, recipient_id, message_id, app_id) {
        this.deleteMessage(sender_id, recipient_id, message_id, app_id);
        return this.deleteMessage(recipient_id, sender_id, message_id, app_id);
    }



    deleteMessage(sender_id, recipient_id, message_id, app_id) {
        var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_id+'/'+message_id;
        // console.log("path", path);

        console.log("deleteMessage from " + path);
        return admin.database().ref(path).remove()   

    }


    deleteMessageGroupForAll(group_id, message_id, app_id) {
        this.deleteMessageFromGroupTimeline(group_id, message_id, app_id);
        return  this.deleteMessageFromMembersTimeline(group_id, message_id, app_id);
    }

    deleteMessageFromGroupTimeline(group_id, message_id, app_id) {
        var path = '/apps/'+app_id+'/messages/'+group_id+'/'+message_id;
        // console.log("path", path);

        console.log("deleteMessageFromGroupTimeline from " + path);
        return admin.database().ref(path).remove()   

    }

    deleteMessageFromMembersTimeline(group_id, message_id, app_id) {

        var updates = {};

        return chatApi.getGroupMembers(group_id, app_id).then(function (groupMembers) {
            
            groupMembers.forEach(function(groupMember) {
            //   DEBUG console.log('groupMember ' + groupMember);            
                        updates['/'+groupMember+'/messages/'+group_id + '/'+ message_id] = null; 
                   
                });
        
                console.log('deleteMessageFromMembersTimeline with message  FROM ' + JSON.stringify(updates) );
                
                return admin.database().ref('/apps/'+app_id+'/users').update(updates);        
            }); 
    }



    getGroupById(group_id, app_id) {
        // DEBUG console.log("getting group with id " + group_id + " and app_id "+ app_id);

        return new Promise(function(resolve, reject) {
            // Do async job
            return admin.database().ref('/apps/'+app_id+'/groups/'+group_id).once('value').then(function(groupSnapshot) {
                // DEBUG console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
                //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );
        
                
                if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                    var group = groupSnapshot.val();
                    // DEBUG console.log('group ' + JSON.stringify(group) );
        
                    
                    return resolve(group);
                }else {
                    var error = 'Warning: Group '+ group_id +' not found ';
                    console.log(error );
                    //recipient_id is NOT a group
                    // return 0;
                    return reject(error);
                }
        
        
            });
        });
    }

    getGroupMembers(group_id, app_id) {
        // DEBUG console.log('getGroupMembers ', this );
        var that = this;

        return new Promise(function(resolve, reject) {

            return that.getGroupById(group_id, app_id).then(function(group) {

                // if (group) {
                    var groupMembers = group.members;

                    // DEBUG console.log("groupMembers", groupMembers);

                    var groupMembersAsArray = Object.keys(groupMembers);
                
                //    DEBUG  console.log("groupMembersAsArray", groupMembersAsArray);

                    return resolve(groupMembersAsArray);
                // }


            
            });
        });
    }

        
    createGroup(group_name, group_owner, group_members, app_id) {

        var path = '/apps/'+app_id+'/groups/';
        // console.log("path", path);


        var group = {};
        group.name = group_name;
        group.owner = group_owner;
        group.members = group_members;
        group.iconURL = "NOICON";
        group.createdOn = admin.database.ServerValue.TIMESTAMP;
        
        console.log("creating group " + JSON.stringify(group) + " to "+ path);
        return admin.database().ref(path).push(group);
    }

  
    createGroupWithId(group_id, group_name, group_owner, group_members, app_id, attributes) {

        var path = '/apps/'+app_id+'/groups/'+group_id;
        // console.log("path", path);


        var group = {};
        group.name = group_name;
        group.owner = group_owner;
        group.members = group_members;
        group.iconURL = "NOICON";
        group.createdOn = admin.database.ServerValue.TIMESTAMP;
        
        if (attributes) {
            group.attributes = attributes;
        }

        console.log("creating group " + JSON.stringify(group) + " to "+ path);
        return admin.database().ref(path).set(group);
    }



    joinGroup(member_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/members/';
        // DEBUG console.log("path", path);


        var member = {};
        member[member_id] = 1;
        
        console.log("member " + JSON.stringify(member) + " is joining group " + path);
        return admin.database().ref(path).update(member);
    }


    leaveGroup(member_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/members/'+member_id;
        // DEBUG console.log("path", path);

        
        console.log("leaving member from " + path);
        // return admin.database().ref(path).update(null);
        return admin.database().ref(path).remove();
    }



    setMembersGroup(members, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/members/';
        // DEBUG console.log("path", path);

        
        console.log("setting members " + JSON.stringify(members) + " for group " + path);
        return admin.database().ref(path).set(members);
    }


    createContactWithId(uid, firstname, lastname, email, app_id) {

        var path = '/apps/'+app_id+'/contacts/'+uid;
        console.log("path", path);


        var contact = {};
        contact.firstname = firstname;
        contact.lastname = lastname;
        contact.uid = uid;
        contact.email = email;
        contact.imageurl = "";
        contact.timestamp = admin.database.ServerValue.TIMESTAMP;
        
        console.log("creating contact " + JSON.stringify(contact) + " to "+ path);
        return admin.database().ref(path).set(contact);
    }

    updateContactWithId(uid, firstname, lastname, email, app_id) {

        var path = '/apps/'+app_id+'/contacts/'+uid;
        console.log("path", path);


        var contact = {};
        contact.firstname = firstname;
        contact.lastname = lastname;
        contact.uid = uid;
        contact.email = email;
        
        console.log("updating contact " + JSON.stringify(contact) + " to "+ path);
        return admin.database().ref(path).set(contact);
    }


    typing(writer_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/typings/'+group_id;
        // DEBUG  console.log("path", path);
    
    
        var typing = {};
        typing[writer_id] = 1;

        console.log("typing typing " + typing  + " to " + path);
        return admin.database().ref(path).update(typing);
    }

    stopTyping(writer_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/typings/'+group_id+"/"+ writer_id;
        // DEBUG  console.log("path", path);
    
    
        console.log("stopTyping for " + path);
        return admin.database().ref(path).remove();
    }


    //INTERNAL METHOD

    insertAndSendMessageInternal(messageRef, message, sender_id, recipient_id, message_id, app_id) {
        const timestamp = admin.database.ServerValue.TIMESTAMP

    
        this.insertMessageInternal(messageRef, message, sender_id, recipient_id, timestamp);

        return this.sendMessageToTimelineInternal(message, sender_id, recipient_id, message_id, app_id, timestamp);

        // return 0;
    }

    insertMessageInternal(messageRef, message, sender_id, recipient_id, timestamp) {
       
        var update = {};

        update.sender = sender_id;
        update.recipient = recipient_id;
        update.timestamp = timestamp;

        if (message.channel_type==null) {  //is a direct message
            update.channel_type = "direct"; 
        }
    //set the status = 100 only if message.status is null. If message.status==200 (came form sendMessage) saveMessage not must modify the value
    // console.log("message.status : " + message.status);        
        update.status = chatApi.CHAT_MESSAGE_STATUS.SENT; //MSG_STATUS_RECEIVED_ON_PERSIONAL_TIMELINE
      

        console.log('inserting new message  with ' + JSON.stringify(update));

        return messageRef.update(update);
    }



    sendMessageToTimelineInternal(message, sender_id, recipient_id, message_id, app_id, timestamp) {
   
        message.sender = sender_id;
        message.recipient = recipient_id;
        message.timestamp = timestamp;

        if (message.channel_type==null) {  //is a direct message
            message.channel_type = "direct"; 
        }

        message.status = chatApi.CHAT_MESSAGE_STATUS.DELIVERED;                                        

        if (message.channel_type=="direct") {  //is a direct message            
            // DEBUG console.log('sending direct message ' + JSON.stringify(message) );

            return chatApi.sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id);            
        }else {//is a group message
            // DEBUG console.log('sending group message ' + JSON.stringify(message) );
             //send to group timeline
             chatApi.sendMessageToGroupTimeline(recipient_id, message, message_id, app_id);            
            return chatApi.sendGroupMessageToMembersTimeline(sender_id, recipient_id, message, message_id, app_id);
        }

    }

    sendDirectMessageToRecipientTimeline(sender_id, recipient_id, message, message_id, app_id) {
        var updates = {};
        
        updates['/'+recipient_id+'/messages/'+sender_id + '/'+ message_id] = message;   
        // console.log('updates ' + JSON.stringify(updates) );
        
        console.log('sendDirectMessageToRecipientTimeline with message' + message + " TO: " + JSON.stringify(updates));           

        return admin.database().ref('/apps/'+app_id+'/users').update(updates);
    }


    sendMessageToGroupTimeline(group_id, message, message_id, app_id) {
        var updates = {};
        
        updates['/messages/' + group_id + '/'+ message_id] = message;   
        // console.log('updates ' + JSON.stringify(updates) );
        
        console.log('sendMessageToGroupTimeline with message' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );           

        return admin.database().ref('/apps/'+app_id).update(updates);
    }

    sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id) {

        var updates = {};
        
        return chatApi.getGroupMembers(recipient_group_id, app_id).then(function (groupMembers) {
          
            groupMembers.forEach(function(groupMember) {
              //   DEBUG console.log('groupMember ' + groupMember);
        
                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
        
                console.log('sendGroupMessageToMembersTimeline with message ' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );
                
                return admin.database().ref('/apps/'+app_id+'/users').update(updates);        
            }); 
    }

    // sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id) {

    //     var updates = {};
        
    //     return admin.database().ref('/apps/'+app_id+'/groups/'+recipient_group_id).once('value').then(function(groupSnapshot) {
    //             // DEBUG console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
    //             //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

    //             if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
    //                 var group = groupSnapshot.val();
    //                 console.log('group ' + JSON.stringify(group) );

    //                 var groupMembers = group.members;
    //                 var groupMembersAsArray = Object.keys(groupMembers);
    //                 // DEBUG console.log('groupMembers ' + JSON.stringify(groupMembersAsArray) );
                
                
    //                 //TODO check se sender è membro del gruppo
    //                 // if (groupMembersAsArray.indexOf(sender_id)<0) {
    //                 //     errore non sei membro del gruppo
    //                 // }


    //                 groupMembersAsArray.forEach(function(groupMember) {
    //                     // console.log('groupMember ' + groupMember);

    //                     //DON'T send a message to the sender of the message 
    //                     if (groupMember!=sender_id) { 
    //                         updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
    //                     }
    //                 });
    //             }else {
    //                 console.log('Warning: Group '+ recipient_group_id +' not found ' );
    //                 //recipient_id is NOT a group
    //                 return 0;
    //             }

    //             console.log('sendGroupMessageToMembersTimeline with message ' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );
                
    //             return admin.database().ref('/apps/'+app_id+'/users').update(updates);

    //         });
    // }




    // sendBroadcastChannelMessageToRecipientsTimeline(sender_id, recipient_channel_id, message, message_id, app_id) {
    //     var updates = {};
        
    //         admin.database().ref('/apps/'+app_id+'/groups/'+recipient_channel_id).once('value').then(function(groupSnapshot) {
    //             console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
    //             //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

    //             if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
    //                 var isBroadcastGroup = groupSnapshot.val().broadcast;
    //                 if (isBroadcastGroup==1) {

    //                 }
    //                 var groupMembers = groupSnapshot.val().members;
    //                 var groupMembersAsArray = Object.keys(groupMembers);
    //                 console.log('groupMembersAsArray ' + JSON.stringify(groupMembersAsArray) );
    //                 //TODO check se sender è membro del gruppo
    //                 // if (groupMembersAsArray.indexOf(sender_id)<0) {
    //                 //     errore non sei membro del gruppo
    //                 // }
    //                 groupMembersAsArray.forEach(function(groupMember) {
    //                     console.log('groupMember ' + groupMember);
    //                     //DON'T send a message to the sender of the message 
    //                     if (groupMember!=sender_id) { 
    //                         //here recipient_id is the group_id
    //                         updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
    //                     }
    //                 });
    //             }else {
    //                 console.warn('Warning: Group '+ recipient_group_id +' not found ' );
    //                 //recipient_id is NOT a group
                                
    //             }

    //             console.log('updates ' + JSON.stringify(updates) );
                
    //             return admin.database().ref('/apps/'+app_id+'/users').update(updates);

    //         });
    // }

    subscribeEmail(user_id, is_subscribed, app_id) {

        return new Promise(function (resolve, reject) {

            var updates = { email: is_subscribed };

            var firebaseUserSettingsRef = admin.database().ref('/apps/' + app_id + '/users/' + user_id + '/settings/');

            firebaseUserSettingsRef.update(updates).then(function () {
                console.log("Write completed");
                return resolve(updates);
            }).catch(function (error) {
                console.error("Write failed: " , error);
                return reject(error);
            });
        });
    }

    
}


var chatApi = new ChatApi();
chatApi.CHAT_MESSAGE_STATUS = {
            FAILED : -100,
            SENDING : 0,
            SENT : 100, //saved into sender timeline
            DELIVERED : 150, //delivered to recipient timeline
            RECEIVED : 200, //received from the recipient client
            RETURN_RECEIPT: 250, //return receipt from the recipient client
            SEEN : 300 //seen
    
        }
module.exports = chatApi;
