const { Client } = require("discord.js-selfbot-v13");
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

// --- CẤU HÌNH WEB SERVER ĐỂ TREO 24/7 ---
const app = express();
app.get('/', (req, res) => res.send('Bot đang chạy 24/7!'));
app.listen(3000, () => console.log("Web Server đã sẵn sàng."));

// --- CẤU HÌNH BOT ---
const client = new Client({ checkUpdate: false });

const TOKEN = "token_cua_ban"; // Khuyên dùng process.env.TOKEN nếu treo trên web
const VOICE_CHANNEL_ID = "1488399003908309032";

async function connectToVoice() {
    try {
        const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
        if (!channel || !channel.isVoice()) {
            return console.error("❌ ID không hợp lệ hoặc không phải kênh thoại.");
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`✅ Đã vào kênh: ${channel.name}`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (e) {
                console.log("🔄 Mất kết nối, đang thử lại sau 5 giây...");
                connection.destroy();
                setTimeout(connectToVoice, 5000);
            }
        });
    } catch (error) {
        console.error("❌ Lỗi khi kết nối voice:", error);
        setTimeout(connectToVoice, 10000);
    }
}

client.on("ready", () => {
    console.log(`>>> Đã đăng nhập: ${client.user.tag}`);
    connectToVoice();
});

// Xử lý lỗi crash bot đột ngột
process.on('unhandledRejection', (reason, promise) => {
    console.error('Phát hiện lỗi chưa xử lý:', reason);
});

client.login(TOKEN);
