
exports.run = {
    usage: ['session'],
    category: 'test',
    async: async (m, { client, text, body }) => {
      const cards = [{
         header: {
            imageMessage: global.db.setting.cover,
            hasMediaAttachment: true,
         },
         body: {
            text: "P"
         },
         nativeFlowMessage: {
            buttons: [
               {
                  name: "cta_call",
                  buttonParamsJson: JSON.stringify({
                     display_text: "Call",
                     phone_number: "6285887776722"
                  })
               }
            ]
         }
         
         
      }, {
         header: {
            imageMessage: global.db.setting.cover,
            hasMediaAttachment: true,
         },
         body: {
            text: "P"
         },
         nativeFlowMessage: {
            buttons: [{
               name: "cta_url",
               buttonParamsJson: JSON.stringify({
                  display_text: 'Contact Owner',
                  url: 'https://api.neoxr.eu',
                  webview_presentation: null
               })
            }]
         }
      }]
      
      client.sendCarousel(m.chat, cards, m, {
         content: 'Hi!'
      })
    },
    error: false
};
