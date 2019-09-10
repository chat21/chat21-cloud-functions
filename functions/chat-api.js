

'use strict';

const admin = require('firebase-admin');
const gcs = require('@google-cloud/storage');

const removeEmpty = (obj) => 
  Object.entries(obj).forEach(([key, val]) => {
    if (val && typeof val === 'object') removeEmpty(val)
    else if (val == null) delete obj[key]
});

class ChatApi {



    sendDirectMessage(sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id, attributes, timestamp, type, metadata) {

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
            
            message.timestamp = admin.database.ServerValue.TIMESTAMP;
            if (timestamp) {
                message.timestamp = timestamp;
            }

            message.channel_type = "direct";
            message.text = text;


            if (type) {
                message.type = type;
            }else {
                message.type = "text";
            }

        
            if (metadata) {
                message.metadata = metadata;
            }

            console.log("sendDirectMessage with message " + JSON.stringify(message)  + " to " + path);
            return admin.database().ref(path).push(message);
        }





    sendGroupMessage(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id, attributes, projectid, timestamp, type, metadata) {

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

        message.timestamp = admin.database.ServerValue.TIMESTAMP;
        if (timestamp) {
            message.timestamp = timestamp;
        }

        message.channel_type = "group";
        message.text = text;
      
        
        if (type) {
            message.type = type;
        }else {
            message.type = "text";
        }

        if (projectid) {
            message.projectid = projectid;
        }

        if (metadata) {
            message.metadata = metadata;
        }


        console.log("sendGroupMessage with  message " + JSON.stringify(message)  + " to " + path);
        return admin.database().ref(path).push(message);   //send message to group timeline


        // var newMessageRef = admin.database().ref(path).push(message);   //send message to group timeline

        // var message_id = newMessageRef.key;

        // return sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id);


    }

    copyGroupMessagesToUserTimeline(group_id, user_id, app_id) {

      
        const fromPath = '/apps/'+app_id+'/messages/' + group_id;
       //  console.log("fromPath", fromPath);
   
       return admin.database().ref(fromPath).orderByChild("timestamp").once('value').then(function(messagesSnap) {
        // console.log('messagesSnap ' + JSON.stringify(messagesSnap) );
       
            //called multiple time for each message
            if (messagesSnap.val()!=null){
                    var messagesWithMessageIdAsObject = messagesSnap.val();
                    console.log('messagesWithMessageIdAsObject ' + JSON.stringify(messagesWithMessageIdAsObject) );
                
                    var messagesIdasArray = Object.keys(messagesWithMessageIdAsObject);
                    console.log('messagesIdasArray ' + JSON.stringify(messagesIdasArray) );
                    
                    //disable notification
                    // if (message.attributes) {
                    // message.attributes.sendnotification = false;
                    // }
                
                    // disable notification
                    var i = 0;
                    messagesIdasArray.forEach(function(messageId) {
                
                        const message = messagesWithMessageIdAsObject[messageId];
                        // console.log('messageWithOutMessageId ' + JSON.stringify(messageWithOutMessageId));
                    
                    
                        if (i>0) {
                            if (message.attributes) {
                                message.attributes.sendnotification = false;
                            }
                        } 
                        console.log('message ' + JSON.stringify(message));
                        i++;
                    });
                    
                    const toPath = '/apps/'+app_id+'/users/' + user_id+'/messages/'+group_id;
                    // console.log("toPath", toPath);
                
                    console.log('duplicating message ' + JSON.stringify(messagesWithMessageIdAsObject) + " from : " + fromPath + " to " + toPath);
                    return admin.database().ref(toPath).update(messagesWithMessageIdAsObject);
            } else {
                console.log("message is null. Nothing to duplicate");
                return 0;
            }
        });
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

        return chatApi.getAllGroupMembers(group_id, app_id).then(function (groupMembers) {
            
            groupMembers.forEach(function(groupMember) {
            //   DEBUG console.log('groupMember ' + groupMember);            
                        updates['/'+groupMember+'/messages/'+group_id + '/'+ message_id] = null; 
                   
                });
        
                console.log('deleteMessageFromMembersTimeline with message  FROM ' + JSON.stringify(updates) );
                
                return admin.database().ref('/apps/'+app_id+'/users').update(updates);        
            }); 
    }

    deleteConversation(user_id, recipient_id, app_id) {
        var path = '/apps/'+app_id+'/users/'+user_id+'/conversations/'+recipient_id;

        console.log("deleteConversation from " + path);
        return admin.database().ref(path).remove();

    }
    //NOT in use
    deleteArchivedConversationIfExists(user_id, recipient_id, app_id) {
        var that = this;
        return new Promise(function(resolve, reject) {

            var path = '/apps/'+app_id+'/users/'+user_id+'/archived_conversations/'+recipient_id;
            return admin.database().ref(path).once('value').then(function(conversationSnapshot) {
                //console.log('conversationSnapshot ' + JSON.stringify(conversationSnapshot) );
                if (conversationSnapshot.val()){ //exists
                    console.log('conversationSnapshot exists ' + JSON.stringify(conversationSnapshot.val()) );
                    return that.deleteArchivedConversation(user_id, recipient_id, app_id).then(function(){
                        return resolve(conversationSnapshot.val());
                    });
                }else {
                    console.log('conversationSnapshot not exists ');
                    return resolve();
                }
            });

             
        });
    }

    deleteArchivedConversation(user_id, recipient_id, app_id) {
        // return new Promise(function(resolve, reject) {

            var path = '/apps/'+app_id+'/users/'+user_id+'/archived_conversations/'+recipient_id;

            console.log("deleteArchivedConversation from " + path);
            return admin.database().ref(path).remove();
            // .then(function(a) {
            //     console.log("aXXXX " + a);
            //     return resolve(a);
            // })
        // });

    }

    archiveConversationForAllGroupMembers(group_id, app_id) {
        var that = this;
        return chatApi.getAllGroupMembers(group_id, app_id).then(function (groupMembers) {
            
            groupMembers.forEach(function(groupMember) {
                    console.log('groupMember ' + groupMember);            
                    that.archiveConversation(groupMember, group_id, app_id);
                   
                });
        
                console.log('archiveConversationForAllMembers');
                
                return 0;
            }); 

    }

    archiveConversation(user_id, recipient_id, app_id) {
        var path = '/apps/'+app_id+'/users/'+user_id+'/conversations/'+recipient_id;

        var that = this;
        
        return admin.database().ref(path).once('value').then(function(conversationSnapshot) {
            console.log('conversationSnapshot ' + JSON.stringify(conversationSnapshot) );
            
    
            
            if (conversationSnapshot.val()!=null){ 
                var conversation = conversationSnapshot.val();

                //update timestamp
                conversation.timestamp = admin.database.ServerValue.TIMESTAMP;

                var newpath = '/apps/'+app_id+'/users/'+user_id+'/archived_conversations/'+recipient_id;

                console.log("archiving conversation from " + path + " to path "+ newpath);
                return admin.database().ref(newpath).set(conversation).then(writeResult => {
                    // Send back a message that we've succesfully written the message
                    console.log(`successfully copied`);
            
                    return that.deleteConversation(user_id, recipient_id, app_id);
                });
        
            }else {
                console.log("conversation not found under " + path);
                return 0;
            }
        });
        
    }

    getLastMessage(sender_id, recipient_id, app_id) {
        const messagePath = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_id;
        //console.log("messagePath:",messagePath);

        return new Promise(function(resolve, reject) {
            return admin.database().ref(messagePath).orderByChild("timestamp").limitToLast(1).once('value').then(function(lastMessageSnapshot) {
                //console.log('lastMessageSnapshot ' + JSON.stringify(lastMessageSnapshot) );
                
                if (lastMessageSnapshot.val()!=null){ 
                
                    var messageWithId = lastMessageSnapshot.val();
                    // console.log('messageWithId ' + JSON.stringify(messageWithId) );
        

                    const message =  messageWithId[Object.keys(messageWithId)[0]]; 
                    
                    return resolve(message);
                }else {
                    var error = 'Empty message for  sender_id'+ sender_id +' and recipient_id ' + recipient_id;
                    console.log(error );
                    //recipient_id is NOT a group
                    // return 0;
                    return reject(error);
                }
        
        
            }).catch(function(error) {
                return reject(error);
            })
        });
    
    }


    createConversationInternal(sender_id, recipient_id, app_id, message) {
        //console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message: " + message);

        if (message.attributes && message.attributes.updateconversation==false) {
            console.log('not update the conversation because updateconversation is false');
            return 0;
        }
    
        var conversation = {};
        // console.log("message.status : " + message.status);       
    
        if (message.status == null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING) { //i'm the sender
            conversation.is_new = false;
            conversation.sender = sender_id; //message.sender could be null because saveMessage could be called after
            conversation.recipient = recipient_id;  ///message.recipient could be null because saveMessage could be called after  
            conversation.status = chatApi.CHAT_MESSAGE_STATUS.SENDING;
        } else {
            conversation.is_new = true;
            conversation.sender = message.sender;
            conversation.recipient = message.recipient;  
            conversation.status = message.status;
        }
       
        conversation.last_message_text = message.text;
        if (message.sender_fullname){ //message potrebbe non avere il sender fullname perche la app non l'ha passato. in questo caso se nn c'è il fullname anche la conversation non ha il fullname
            conversation.sender_fullname = message.sender_fullname;
        }
        if (message.recipient_fullname){        
            conversation.recipient_fullname = message.recipient_fullname;
        }
    
        if (message.channel_type!=null) {
            conversation.channel_type = message.channel_type;
        }else {
            conversation.channel_type = "direct";
        }
        
        if (message.type!=null) {
            conversation.type = message.type;
        }
    
        //conversation.status = message.status;
        //conversation.status = 2;
    
        conversation.timestamp = admin.database.ServerValue.TIMESTAMP;
        if (message.timestamp) {
            //console.log("message.timestamp",message.timestamp);
            conversation.timestamp = message.timestamp;
        }

        // if (message.attributes) {
        //     conversation.attributes = message.attributes;
        // }
        
        if (message.senderAuthInfo) {
            conversation.senderAuthInfo = message.senderAuthInfo;
        }
    



        // // Reference.update failed: First argument contains a path /5c596c7872b9dc001611eab7 that is ancestor of another path /5c596c7872b9dc001611eab7/attributes 
        // var path = '/apps/'+app_id+'/users/'+sender_id+'/conversations';    
        // var updates = {};
        // updates["/"+recipient_id] = conversation;
        // updates["/"+recipient_id+"/attributes"] = message.attributes;
        // console.log('creating conversation updates ' + JSON.stringify(updates) + " to: "+ path);    
        // return admin.database().ref(path).update(updates);



        //delete archived conv if present
    //    chatApi.deleteArchivedConversation(sender_id, recipient_id, app_id);
    
        // chatApi.deleteArchivedConversationIfExists(sender_id, recipient_id, app_id).then(function(archived_conversation) {
        //     // console.log('archived_conversation', archived_conversation);
        //     if (archived_conversation && 
        //         archived_conversation.recipient.indexOf("support-group")>-1 &&
        //         (message.status == null || message.status==chatApi.CHAT_MESSAGE_STATUS.SENDING)
        //         ){ //the message sender will reopen the support group
        //         console.log('reopening the support request', archived_conversation);
        //         if (functions.config().support && functions.config().support.enabled) {
        //             return chatSupportApi.openChat(archived_conversation.recipient, app_id);
        //         }
                
        //     }
        // });
    
    
    
        
        var path = '/apps/'+app_id+'/users/'+sender_id+'/conversations/'+recipient_id;
    
        console.log('creating conversation ' + JSON.stringify(conversation) + " to: "+ path);
    
        return admin.database().ref(path).update(conversation).then(writeResult => {
            console.log(`conversation created`);
    
            if (message.attributes) {
                return admin.database().ref(path + '/attributes').update(message.attributes);
            }
            return 0;

            
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
        
        
            }).catch(function(error) {
                return reject(error);
            })
        });
    }

    getGroupMembers(group_id, app_id) {
        // DEBUG console.log('getGroupMembers ', this );
        var that = this;

        return new Promise(function(resolve, reject) {

            return that.getGroupById(group_id, app_id)
                .then(function(group) {

                    // if (group) {
                        var groupMembers = group.members;

                        // DEBUG console.log("groupMembers", groupMembers);

                        var groupMembersAsArray = Object.keys(groupMembers);
                    
                    //    DEBUG  console.log("groupMembersAsArray", groupMembersAsArray);

                        return resolve(groupMembersAsArray);
                    // }


                
                }).catch(function(error){
                    return reject(error);
                });
        });
    }

    getAllGroupMembers(group_id, app_id) {
        // DEBUG console.log('getGroupMembers ', this );
        var that = this;

        return new Promise(function(resolve, reject) {

            return that.getGroupById(group_id, app_id)
                .then(function(group) {

                    var groupMembers = group.members;

                     if (groupMembers) {
                        
                        // DEBUG console.log("groupMembers", groupMembers);
                        var groupMembersAsArray = Object.keys(groupMembers);
                        
                        var allMembers = groupMembersAsArray;

                        var invitedGroupMembers = group.invited_members;

                        if (invitedGroupMembers) {
                            var invitedGroupMembersAsArray = Object.keys(invitedGroupMembers);
                            console.log("invitedGroupMembersAsArray", invitedGroupMembersAsArray);
    
                            allMembers = groupMembersAsArray.concat(invitedGroupMembersAsArray);
                        }
                       

                        console.log("allMembers", allMembers);

                        return resolve(allMembers);

                     } else {
                        var error = 'Warning: Group members for '+ group_id +' not found ';
                        console.log(error );
                        return reject(error);
                     }


                
                }).catch(function(error){
                    return reject(error);
                });
        });
    }

        
    createGroup(group_name, group_owner, group_members, app_id, attributes, invited_members) {

        var path = '/apps/'+app_id+'/groups/';
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

        if (invited_members) {
            group.invited_members = invited_members;
        }
        
        console.log("creating group " + JSON.stringify(group) + " to "+ path);
        return admin.database().ref(path).push(group);
    }

  
    createGroupWithId(group_id, group_name, group_owner, group_members, app_id, attributes, invited_members) {

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

        if (invited_members) {
            group.invited_members = invited_members;
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

    saveMemberInfo(member_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/membersinfo/'+member_id;
        // DEBUG console.log("path", path);


        return admin.auth().getUser(member_id)
            .then(function(userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                // console.log("Successfully fetched user data:", userRecord.toJSON());
                console.log("saving membersinfo " + JSON.stringify(userRecord) + " to group " + path);
                
                //Object.keys(userRecord).forEach(key => userRecord[key] === undefined ? delete userRecord[key] : '');
                var userRecordJson = userRecord.toJSON();

                removeEmpty(userRecordJson);
                console.log("userRecordJson",userRecordJson);
                
                return admin.database().ref(path).set(userRecordJson);

            })
            .catch(function(error) {
                console.log("Error fetching user data:", error);
                return 0;
            });

       
    }
    deleteMemberInfo(member_id, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/membersinfo/'+member_id;
        // DEBUG console.log("path", path);

        
        console.log("deleteMemberInfo " + path);
        
        return admin.database().ref(path).remove();
    }



    setMembersGroup(members, group_id, app_id) {

        var path = '/apps/'+app_id+'/groups/'+group_id+'/members/';
        // DEBUG console.log("path", path);

        
        console.log("setting members " + JSON.stringify(members) + " for group " + path);
        return admin.database().ref(path).set(members);
    }


    getContactById(contact_id, app_id) {
        //console.log("getting contact with id " + contact_id + " and app_id "+ app_id);

        return new Promise(function(resolve, reject) {
            // Do async job
            return admin.database().ref('/apps/'+app_id+'/contacts/'+contact_id).once('value').then(function(contactSnapshot) {
               //console.log('contactSnapshot ' + JSON.stringify(contactSnapshot) );        
                
                if (contactSnapshot.val()!=null){ 
                    var contact = contactSnapshot.val();
                    //console.log('contact ' + JSON.stringify(contact) );
        
                    
                    return resolve(contact);
                }else {
                    var error = 'Warning: Contact '+ contact_id +' not found ';
                    console.log(error );
                    //recipient_id is NOT a group
                    // return 0;
                    return reject(error);
                }
        
        
            });
        });
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

    changeContactFullname(uid, firstname, lastname, app_id) {

        var path = '/apps/'+app_id+'/contacts/'+uid;
        console.log("path", path);


        var contact = {};
        contact.firstname = firstname;
        contact.lastname = lastname;
    
        
        console.log("updating contact " + JSON.stringify(contact) + " to "+ path);
        return admin.database().ref(path).update(contact);
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

    deleteContactBucket(uid, app_id) {
        // https://stackoverflow.com/questions/37749647/firebasestorage-how-to-delete-directory
        //var fileBucket = 'profiles/'+uid+'/';
        var fileBucket = uid+'/';
        //var fileBucket = 'a.jpg';
        //var fileBucket = '1234/';
        console.log("fileBucket", fileBucket);
        //const bucket = admin.storage().bucket(functions.config().firebase.storageBucket);

        //return gcs.bucket('gs://chat-v2-dev.appspot.com').file(fileBucket).delete();
        //return admin.storage().bucket(functions.config().firebase.storageBucket).file('profile/').file(fileBucket).delete();
        //return admin.storage().bucket('chat-v2-dev.appspot.com').file('profile/').file(fileBucket).delete();

        return admin.storage().bucket('chat-v2-dev.appspot.com').deleteFiles({
            prefix: `profiles/${uid}/`
          });
        //   , function(err) {
        //     if (err) {
        //       console.log(err);
        //     } else {
        //       console.log(`All the Firebase Storage files in users/${userId}/ have been deleted`);
        //     }
        //   });

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
        let timestamp = admin.database.ServerValue.TIMESTAMP;
        console.log("server cloud function timestamp", timestamp);
        console.log("server cloud function timestamp", new Date());

        if (message && message.timestamp) {
            console.log("message.timestamp", message.timestamp);
            timestamp = message.timestamp;
        }

        // var senderUser =  admin.auth().currentUser;
        // console.log("senderUser", senderUser);
        // var senderUserInfo = senderUser.toJSON();
        // console.log("senderUserInfo", senderUserInfo);

        // if (message.attributes) {
        //     message.reserved_attributes = senderUserInfo;
        // }

        console.log("insertAndSendMessageInternal.message", message);
    
        return Promise.all([ this.insertMessageInternal(messageRef, message, sender_id, recipient_id, timestamp),
            this.sendMessageToTimelineInternal(message, sender_id, recipient_id, message_id, app_id, timestamp)]);
                //.then(function(snapshots) {
        // });
        
        // this.insertMessageInternal(messageRef, message, sender_id, recipient_id, timestamp);
        // return this.sendMessageToTimelineInternal(message, sender_id, recipient_id, message_id, app_id, timestamp);

    }

    insertAndSendMessageInternalUpdates(messageRef, message, sender_id, recipient_id, message_id, app_id) {
        var updates= [];
        const timestamp = admin.database.ServerValue.TIMESTAMP
        
    }

    insertMessageInternalUpdates(message, sender_id, recipient_id, timestamp) {
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

        return update;
    }

    insertMessageInternal(messageRef, message, sender_id, recipient_id, timestamp) {       
        return messageRef.update(this.insertMessageInternalUpdates(message, sender_id, recipient_id, timestamp));
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

             return Promise.all([ chatApi.sendMessageToGroupTimeline(recipient_id, message, message_id, app_id),
                chatApi.sendGroupMessageToMembersTimeline(sender_id, recipient_id, message, message_id, app_id)]);


            //  chatApi.sendMessageToGroupTimeline(recipient_id, message, message_id, app_id);            
            // return chatApi.sendGroupMessageToMembersTimeline(sender_id, recipient_id, message, message_id, app_id);
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
        
        return chatApi.getAllGroupMembers(recipient_group_id, app_id).then(function (groupMembers) {
          
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

chatApi.CHAT_MESSAGE_OPTIONS_KEY = {
            UPDATE_CONVERSATION : "updateconversation",   //Boolean
}

chatApi.LABELS = {
    EN : {
        GROUP_CREATED_MESSAGE : "Group created",
    },
    IT : {
        GROUP_CREATED_MESSAGE : "Gruppo creato",
    },
    "IT-IT" : {
        GROUP_CREATED_MESSAGE : "Gruppo creato",
    }
}

module.exports = chatApi;
