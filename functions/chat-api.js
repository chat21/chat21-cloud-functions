

'use strict';

const admin = require('firebase-admin');

const CHAT_MESSAGE_STATUS = {
    FAILED : -100,
    SENDING : 0,
    SENT : 100, //saved into sender timeline
    DELIVERED : 150, //delivered to recipient timeline
    RECEIVED : 200, //received from the recipient client
    RETURN_RECEIPT: 250, //return receipt from the recipient client
    SEEN : 300 //seen

}
exports.CHAT_MESSAGE_STATUS = CHAT_MESSAGE_STATUS;


exports.sendDirectMessage = function (sender_id, sender_fullname, recipient_id, recipient_fullname, text, app_id, custom_data) {

        var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_id;
        // console.log("path", path);
    
    
        var message = {};
        message.custom_data = custom_data;  //at first position because the following basic data will overwrite potencial inconsistence customdata
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




exports.sendGroupMessage = function(sender_id, sender_fullname, recipient_group_id, recipient_group_fullname, text, app_id, custom_data) {

    var path = '/apps/'+app_id+'/users/'+sender_id+'/messages/'+recipient_group_id;
    // console.log("path", path);


    var message = {};
    message.custom_data = custom_data;  //at first position because the following basic data will overwrite potencial inconsistence customdata
    // message.status = CHAT_MESSAGE_STATUS.SENDING;                                        
    message.sender = sender_id;
    message.sender_fullname = sender_fullname;
    message.recipient = recipient_group_id;
    message.recipient_fullname = recipient_group_fullname;
    // message.timestamp = admin.database.ServerValue.TIMESTAMP;
    message.channel_type = "group";
    message.text = text;
    message.type = "text";

    console.log("sendGroupMessage with  message " + JSON.stringify(message)  + " to " + path);
    return admin.database().ref(path).push(message);   //send message to group timeline


    // var newMessageRef = admin.database().ref(path).push(message);   //send message to group timeline

    // var message_id = newMessageRef.key;

    // return sendGroupMessageToMembersTimeline(sender_id, recipient_group_id, message, message_id, app_id);


}


exports.createGroup = function(group_name, group_owner, group_members, app_id) {

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


exports.createGroupWithId = function(group_id, group_name, group_owner, group_members, app_id) {

    var path = '/apps/'+app_id+'/groups/'+group_id;
    // console.log("path", path);


    var group = {};
    group.name = group_name;
    group.owner = group_owner;
    group.members = group_members;
    group.iconURL = "NOICON";
    group.createdOn = admin.database.ServerValue.TIMESTAMP;
    
    console.log("creating group " + JSON.stringify(group) + " to "+ path);
    return admin.database().ref(path).set(group);
}



exports.joinGroup = function(member_id, group_id, app_id) {

    var path = '/apps/'+app_id+'/groups/'+group_id+'/members/';
    console.log("path", path);


    var member = {};
    member[member_id] = 1;
    
    console.log("adding member " + JSON.stringify(member) + " is joining group " + path);
    return admin.database().ref(path).update(member);
}


exports.leaveGroup = function(member_id, group_id, app_id) {

    var path = '/apps/'+app_id+'/groups/'+group_id+'/members/'+member_id;
    console.log("path", path);

    
    console.log("leaving member from " + path);
    // return admin.database().ref(path).update(null);
    return admin.database().ref(path).remove();
}




exports.sendDirectMessageToRecipientTimeline = function (sender_id, recipient_id, message, message_id, app_id) {
    var updates = {};
    
    updates['/'+recipient_id+'/messages/'+sender_id + '/'+ message_id] = message;   
    // console.log('updates ' + JSON.stringify(updates) );
    
    console.log('sendDirectMessageToRecipientTimeline with message' + message + " TO: " + JSON.stringify(updates));           

    return admin.database().ref('/apps/'+app_id+'/users').update(updates);
  }


exports.sendMessageToGroupTimeline = function(group_id, message, message_id, app_id) {
    var updates = {};
    
    updates['/messages/' + group_id + '/'+ message_id] = message;   
    // console.log('updates ' + JSON.stringify(updates) );
    
    console.log('sendMessageToGroupTimeline with message' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );           

    return admin.database().ref('/apps/'+app_id).update(updates);
}


exports.sendGroupMessageToMembersTimeline = function(sender_id, recipient_group_id, message, message_id, app_id) {

    var updates = {};
    
       return admin.database().ref('/apps/'+app_id+'/groups/'+recipient_group_id).once('value').then(function(groupSnapshot) {
            // DEBUG console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                var group = groupSnapshot.val();
                console.log('group ' + JSON.stringify(group) );

                var groupMembers = group.members;
                var groupMembersAsArray = Object.keys(groupMembers);
                // DEBUG console.log('groupMembers ' + JSON.stringify(groupMembersAsArray) );
               
               
                //TODO check se sender è membro del gruppo
                // if (groupMembersAsArray.indexOf(sender_id)<0) {
                //     errore non sei membro del gruppo
                // }


                groupMembersAsArray.forEach(function(groupMember) {
                    // console.log('groupMember ' + groupMember);

                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
            }else {
                console.log('Warning: Group '+ recipient_group_id +' not found ' );
                //recipient_id is NOT a group
                return 0;
            }

            console.log('sendGroupMessageToMembersTimeline with message ' + JSON.stringify(message) + " TO: " + JSON.stringify(updates) );
            
            return admin.database().ref('/apps/'+app_id+'/users').update(updates);

        });
  }




exports.sendBroadcastChannelMessageToRecipientsTimeline = function(sender_id, recipient_channel_id, message, message_id, app_id) {
    var updates = {};
    
        admin.database().ref('/apps/'+app_id+'/groups/'+recipient_channel_id).once('value').then(function(groupSnapshot) {
            console.log('groupSnapshot ' + JSON.stringify(groupSnapshot) );
            //console.log('snapshot.val() ' + JSON.stringify(snapshot.val()) );

            if (groupSnapshot.val()!=null){ //recipient_id is a GROUP
                var isBroadcastGroup = groupSnapshot.val().broadcast;
                if (isBroadcastGroup==1) {

                }
                var groupMembers = groupSnapshot.val().members;
                var groupMembersAsArray = Object.keys(groupMembers);
                console.log('groupMembersAsArray ' + JSON.stringify(groupMembersAsArray) );
                //TODO check se sender è membro del gruppo
                // if (groupMembersAsArray.indexOf(sender_id)<0) {
                //     errore non sei membro del gruppo
                // }
                groupMembersAsArray.forEach(function(groupMember) {
                    console.log('groupMember ' + groupMember);
                    //DON'T send a message to the sender of the message 
                    if (groupMember!=sender_id) { 
                        //here recipient_id is the group_id
                        updates['/'+groupMember+'/messages/'+recipient_group_id + '/'+ message_id] = message; 
                    }
                });
            }else {
                console.warn('Warning: Group '+ recipient_group_id +' not found ' );
                //recipient_id is NOT a group
                            
            }

            console.log('updates ' + JSON.stringify(updates) );
            
            return admin.database().ref('/apps/'+app_id+'/users').update(updates);

        });
  }