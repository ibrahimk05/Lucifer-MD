const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

exports.run = {
    usage: ['aria2'],
    use: 'url',
    category: 'special',
    async: async (m, { client, args, isPrefix, command, users, env, Func, Scraper }) => {
        if (!args || !args[0]) 
            return client.reply(m.chat, Func.example(isPrefix, command, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'), m);

        const url = args[0]; // URL to download
        const outputDir = path.resolve(__dirname, 'downloads'); // Directory to save the download
        const scriptPath = path.resolve(__dirname, 'aria2_downloader.py'); // Python script path

        // Ensure the downloads directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true }); // Create directory and its parent if they don't exist
        }

        const safeUrl = `'${url}'`; // Ensure URL is quoted to protect special characters
        const safeOutputDir = `'${outputDir}'`;

        const executeDownload = async () => {
            try {
                await client.reply(m.chat, '⏳ Your file is being downloaded. This may take some time.', m);

                const command = `python3 "${scriptPath}" ${safeUrl} ${safeOutputDir}`;
                console.log(`📜 Running command: ${command}`);

                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ exec error: ${error.message}`);
                        await client.reply(m.chat, `❌ Error downloading file: ${error.message}`, m);
                        return;
                    }

                    if (stderr) console.warn(`⚠️ stderr: ${stderr}`);

                    console.log(`📜 stdout: ${stdout}`);

                    let output;
                    try {
                        output = JSON.parse(stdout.trim());
                    } catch (err) {
                        console.error(`❌ Failed to parse JSON: ${err.message}`);
                        await client.reply(m.chat, `❌ Unexpected response from download script.`, m);
                        return;
                    }

                    if (!output.filePath) {
                        await client.reply(m.chat, '❌ Downloaded file path is undefined or missing.', m);
                        return;
                    }

                    const resolvedPath = path.resolve(output.filePath);
                    const extname = path.extname(resolvedPath); // Extract the extension
                    const filenameWithExt = path.basename(resolvedPath); // Extract full filename with extension

                    if (!fs.existsSync(resolvedPath)) {
                        await client.reply(m.chat, '❌ Downloaded file does not exist.', m);
                        return;
                    }

                    const fileSize = fs.statSync(resolvedPath).size;
                    const fileSizeStr = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;

                    console.log(`📦 File Path: ${resolvedPath}`);
                    console.log(`📦 File Name: ${filenameWithExt}`);
                    console.log(`📦 File Size: ${fileSizeStr}`);

                    if (fileSize > 1980 * 1024 * 1024) { // 1980MB limit
                        await client.reply(m.chat, `💀 File size (${fileSizeStr}) exceeds the maximum limit of 1980MB.`, m);
                        fs.unlinkSync(resolvedPath); // Delete the file
                        return;
                    }

                    const maxUpload = users.premium ? env.max_upload : env.max_upload_free;
                    const chSize = Func.sizeLimit(fileSize.toString(), maxUpload.toString());

                    if (chSize.oversize) {
                        await client.reply(m.chat, `💀 File size (${fileSizeStr}) exceeds the maximum limit.`, m);
                        fs.unlinkSync(resolvedPath); // Delete the file
                        return;
                    }

                    await client.reply(m.chat, `✅ Your file (${fileSizeStr}) is being uploaded.`, m);

                    const isVideo = ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(extname.toLowerCase());
                    const isDocument = isVideo && fileSize / (1024 * 1024) > 99;

                    try {
                        await client.sendFile(m.chat, resolvedPath, filenameWithExt, '', m, { document: isDocument });
                        console.log('✅ File sent successfully.');
                    } catch (sendError) {
                        console.error(`❌ Error sending file: ${sendError.message}`);
                        await client.reply(m.chat, `❌ Failed to upload file.`, m);
                    } finally {
                        if (fs.existsSync(resolvedPath)) {
                            fs.unlinkSync(resolvedPath); // Delete the file after sending
                            console.log('🗑️ File deleted after sending.');
                        }
                    }
                });
            } catch (err) {
                console.error('❌ Error starting download:', err);
                await client.reply(m.chat, `❌ Error starting download: ${err.message}`, m);
            }
        };

        executeDownload();
    }
};
