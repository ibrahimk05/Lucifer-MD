const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Initialize global sessions if they don't exist
if (!global.xhMasterSessions) global.xhMasterSessions = {};
if (!global.videoSessions) global.videoSessions = {};

// Function to fetch video qualities
async function fetchQualities(url) {
    const scriptPath = path.resolve(__dirname, 'fetch_qualities.py');
    const command = `python3 ${scriptPath} ${url}`;

    try {
        const { stdout, stderr } = await execPromise(command, { shell: true });
        if (stderr) throw new Error(stderr);

        const result = JSON.parse(stdout);
        if (Array.isArray(result)) return result;
        if (result.error) throw new Error(result.error);
        throw new Error('Unexpected response format');
    } catch (error) {
        console.error(`Error fetching qualities: ${error.message}`);
        return { error: error.message };
    }
}

// Function to handle the /xhmaster command (Search videos)
async function handleXhMasterRequest(m, { client, text, isPrefix, command, Func }) {
    if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'step mom'), m);

    client.sendReact(m.chat, '🕒', m.key);

    // Fetch search results from XHamster API
    let json = await Func.fetchJson(`https://lust.scathach.id/xhamster/search?key=${text}`);
    if (!json.success) return client.reply(m.chat, global.status.fail, m);

    // Prepare results
    const data = json.data;
    if (data.length === 0) {
        return client.reply(m.chat, 'No results found.', m);
    }

    // Store search results in session
    global.xhMasterSessions[m.chat] = { data };

    // Prepare the list of results
    let resultMessage = "*🎬 X H A M S T E R   S E A R C H*\n\nHere are the results for your search: " + text + ".\n\nPlease select a video from the list below. Reply with `/getxhmaster <number>` to select a video.\n\n";
    data.forEach((v, index) => {
        resultMessage += `*${index + 1}*: ${v.title}\n\n`;
    });

    await client.reply(m.chat, resultMessage, m);
}

// Function to handle the /getxhmaster command (Fetch and list qualities)
async function handleGetXhMasterCommand(m, { client, text }) {
    const index = parseInt(text.trim(), 10) - 1;
    const session = global.xhMasterSessions[m.chat];

    // Validate session and selection
    if (!session || !session.data || !session.data[index]) {
        return client.reply(m.chat, "❌ Invalid selection. Please select a valid video from the list.", m);
    }

    const selectedVideo = session.data[index];
    const url = selectedVideo.link;
    const result = await fetchQualities(url);

    if (result.error) return client.reply(m.chat, `Error fetching qualities: ${result.error}`, m);

    const formats = result;
    if (formats.length === 0) return client.reply(m.chat, "❌ No qualities found. Please try another video.", m);

    // Store session data for later use with 2-minute timeout
    global.videoSessions[m.chat] = {
        url,
        formats,
        timeout: setTimeout(() => {
            delete global.videoSessions[m.chat]; // Just delete the session when it expires
        }, 120000) // 2 minutes
    };

    // Stylish quality selection menu
    let qualityMessage = "*🎬 Quality Selector*\n\n";
    qualityMessage += `*Please select a quality for the video.*\n\n`;
    formats.forEach((format, index) => {
        qualityMessage += `*${index + 1}**️⃣ - ${format.label}\n`;
        qualityMessage += `  📦 *Size*: ${format.size ? format.size : "Not available"}\n`;
        qualityMessage += `  🖥️ *Type*: ${format.container}\n\n`;
    });

    qualityMessage += `💡 To select a quality, reply with \`/getytdl <number>\` (e.g., \`/getytdl 1\`).\n`;
    qualityMessage += `⏳ You have 2 minutes to select a quality. Default quality will be used if no choice is made.`;

    client.reply(m.chat, qualityMessage, m);
}

// Function to handle the /getytdl command (Fetch and execute download)
async function handleGetYtdlCommand(m, { client, text }) {
    const session = global.videoSessions[m.chat];
    if (!session) {
        return client.reply(m.chat, "❌ No active session. Please start with /ytdl command first.", m);
    }

    // Handle default quality or user choice
    let choice = text.trim().toLowerCase();

    if (choice === 'default') {
        choice = 1; // Use the first quality as default if no choice is made
    } else {
        choice = parseInt(choice, 10);
    }

    if (isNaN(choice) || choice < 1 || choice > session.formats.length) {
        return client.reply(m.chat, "⚠️ Invalid choice. Please reply with a valid number between 1 and 9, or type 'default'.", m);
    }

    const selectedFormat = session.formats[choice - 1];
    const downloadUrl = session.url;
    const quality = selectedFormat.id;

    // Execute the download command
    execDownloadCommand(m, client, downloadUrl, quality);
}

// Function to execute the /cvbi download command
async function execDownloadCommand(m, client, url, quality) {
    const outputDir = path.resolve(__dirname, 'downloads'); // Directory to save the download
    const scriptPath = path.resolve(__dirname, 'downloader.py'); // Path to Python script

    // Ensure the downloads directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Notify user that the download is starting
    await client.reply(m.chat, 'Your file is being downloaded. This may take some time...', m);

    exec(`python3 ${scriptPath} ${url} ${outputDir} ${quality}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error.message}`);
            await client.reply(m.chat, `Error downloading video: ${error.message}`, m);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            await client.reply(m.chat, `Error downloading video: ${stderr}`, m);
            return;
        }

        console.log(`stdout: ${stdout}`);

        // Parse the stdout to get the original file name and path
        const output = JSON.parse(stdout.trim());
        if (output.error) {
            await client.reply(m.chat, `Download failed: ${output.message}`, m);
            return;
        }

        const filePath = output.filePath; // The full path to the downloaded file
        const fileName = path.basename(filePath); // Extract file name from path

        // Handle file and send to user
        try {
            const fileSize = fs.statSync(filePath).size;
            const fileSizeStr = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;

            if (fileSize > 930 * 1024 * 1024) { // 930MB
                await client.reply(m.chat, `💀 File size (${fileSizeStr}) exceeds the maximum limit of 930MB`, m);
                fs.unlinkSync(filePath); // Delete the file
                return;
            }

            await client.reply(m.chat, `Your file (${fileSizeStr}) is being uploaded.`, m);

            const extname = path.extname(fileName).toLowerCase();
            const isVideo = ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(extname);
            const isDocument = isVideo && fileSize / (1024 * 1024) > 99; // 99 MB threshold

            await client.sendFile(m.chat, filePath, fileName, '', m, { document: isDocument });

            // Delete session after sending the file
            delete global.videoSessions[m.chat];
            fs.unlinkSync(filePath); // Delete the file after sending
        } catch (parseError) {
            console.error(`Error handling file: ${parseError.message}`);
            await client.reply(m.chat, `Error handling file: ${parseError.message}`, m);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete on error
        }
    });
}

// Main exportable handler
exports.run = {
    usage: ['xhmaster'],
    hidden: ['getxhmaster'],
    use: 'query <𝘱𝘳𝘦𝘮𝘪𝘶𝘮>',
    category: 'porn',
    async: async (m, { client, text, isPrefix, command, Func }) => {
        try {
            if (command === 'xhmaster') {
                await handleXhMasterRequest(m, { client, text, isPrefix, command, Func });
            } else if (command === 'getxhmaster') {
                await handleGetXhMasterCommand(m, { client, text });
            } else if (command === 'getytdl') {
                await handleGetYtdlCommand(m, { client, text });
            }
        } catch (error) {
            console.error(`Error in command execution: ${error.message}`);
        }
    }
};
