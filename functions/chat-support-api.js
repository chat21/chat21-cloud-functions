

'use strict';

const admin = require('firebase-admin');
const chatApi = require('./chat-api');

class ChatSupportApi {

    //unused
    updateSupportStatus(group_id, support_status) {
        
        var dataToUpdate = {
        "support_status": support_status
        }

        return admin.firestore().collection('conversations').doc(group_id).set(dataToUpdate,{merge:true}).then(writeResult => {
        // Send back a message that we've succesfully written the message
        console.log(`support_status updated with value: ${JSON.stringify(dataToUpdate)}`);

        return 0;
        });
    }

    closeChat(group_id, app_id) {
        var members = {"system":1};

        // this.updateSupportStatus(group_id, this.CHATSUPPORT_STATUS.CLOSED);

        var result =  chatApi.setMembersGroup(members, group_id, app_id);
      
        return result;
    }


    removeBotFromGroupMember(group_id, app_id) {
        // DEBUG console.log('removeBotFromGroupMember for group : ' + group_id);
      
        //remove bot from members
        return chatApi.getGroupMembers(group_id, app_id).then(function (groupMembers) {
          
          groupMembers.forEach(function(groupMember) {
            //   DEBUG console.log('groupMember ' + groupMember);
      
                  if (groupMember.startsWith("bot_")) { 
                      console.log('removing bot with id  ' + groupMember + " from group with id " + group_id);
                      return chatApi.leaveGroup(groupMember, group_id, app_id);
                  }
              });
      
              return 0;
      
          }); 
      }


      
  
}


var chatSupportApi = new ChatSupportApi();

chatSupportApi.CHATSUPPORT_STATUS = {
            CREATED : 0,
            UNSERVED : 100, 
            SERVED : 200, 
            CLOSED : 1000, 
        }
module.exports = chatSupportApi;