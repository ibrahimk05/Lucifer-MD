// Create a session object to store search results per user
const userSessions = {};

exports.run = {
   usage: ['xvideos'],
   hidden: ['getxvideos'],
   use: 'query <𝘱𝘳𝘦𝘮𝘪𝘶𝘮>',
   category: 'porn',
   async: async (m, { client, text, args, isPrefix, command, Func }) => {
      try {
         if (command === 'xvideos') {
            if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'step mom'), m);

            client.sendReact(m.chat, '🕒', m.key);

            // Call the new API with the search query
            let json = await Func.fetchJson(`https://lust.scathach.id/xvideos/search?key=${text}`);
            if (!json.success) return client.reply(m.chat, global.status.fail, m);

            const results = json.data; // Use all results from the API response

            // Store the search results in the user's session
            userSessions[m.chat] = results;

            // Stylish message with search results
            let responseText = `*🔍 XVIDEOS SEARCH RESULTS* \n\n`;
            responseText += `*Query:* _${text}_\n\n`;
            results.forEach((result, index) => {
                responseText += `*${index + 1}. ${result.title}*\n`;
                responseText += `  _Duration:_ ${result.duration}\n`;
            });

            responseText += `To download a video, type: /getxvideos <number>\nExample: /getxvideos 1 for the first video.`;

            // Send the list of search results
            await client.reply(m.chat, responseText, m);


         } else if (command === 'getxvideos') {
            if (!args || !args[0]) return client.reply(m.chat, Func.example(isPrefix, command, '1'), m);
            const videoIndex = parseInt(args[0]) - 1; // Convert to zero-based index

            // Check if the user has searched for videos
            if (!userSessions[m.chat]) {
               return client.reply(m.chat, 'You need to search for videos first using the /xvideos command.', m);
            }

            const results = userSessions[m.chat]; // Fetch search results from session
            if (videoIndex < 0 || videoIndex >= results.length) {
                return client.reply(m.chat, 'Invalid video selection. Please select a valid number from the list.', m);
            }

            const selectedVideo = results[videoIndex];

            client.sendReact(m.chat, '🕒', m.key);

            let videoJson = await Func.fetchJson(`https://api.betabotz.eu.org/api/download/xvideosdl?url=${selectedVideo.link}&apikey=beta-Ibrahim1209`);
            if (!videoJson.status) return client.reply(m.chat, Func.jsonFormat(videoJson), m);

            // Build the caption with video details
            let teks = `乂  *XVIDEOS VIDEO*\n\n`;
            teks += '◦  *Name* : ' + videoJson.result.title + '\n';
            teks += '◦  *Views* : ' + videoJson.result.views + '\n';
            teks += '◦  *Keywords* : ' + videoJson.result.keyword + '\n';
            teks += global.footer;

            // Send the video file directly
            await client.sendFile(m.chat, videoJson.result.url, '', teks, m);

            // Optionally, clear the session after use
            delete userSessions[m.chat];

         }
      } catch (e) {
         console.log(e);
         return client.reply(m.chat, global.status.error, m);
      }
   },
   error: false,
   limit: true,
   premium: true
};
