

'use strict';


class ChatUtil {

    //unused
    getMessage(key, lang, labelsObject) {
        if (!lang) {
            lang = "EN";
        }

        lang = lang.toUpperCase();
        
        var label = "";

        try {
         label = labelsObject[lang][key];
        } catch(e) {
            label = labelsObject["EN"][key];
        }
        return label;
     
    }

   


      
  
}


var chatUtil = new ChatUtil();


module.exports = chatUtil;