const { Youtube } = require('@neoxr/youtube-scraper')
const yt = new Youtube({
   fileAsUrl: false
})

exports.run = {
    usage: ['session'],
    category: 'test',
    async: async (m, { client, text, body }) => {
       // import { gpt } from "gpti";
       yt.play('wide awake').then(console.log)

    },
    error: false
};
