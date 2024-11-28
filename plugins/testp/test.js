
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
            buttons: [{
               name: "single_select",
               buttonParamsJson: JSON.stringify({
                  title: "Tap!",
                  sections: [{
                     rows: [{
                        title: "Owner",
                        description: `X`,
                        id: `.owner`
                     }, ]
                  }]
               })
            }]
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
