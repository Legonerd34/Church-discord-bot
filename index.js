const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const express = require('express');
const app = express();
const port = process.env.PORT || "PORT";

// Basic route to respond to UptimeRobot pings
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const SOUND_PATH = 'mixkit-church-bells-ending-627.wav'; // Change this to your sound file path
const TARGET_VOICE_CHANNEL_ID = 'VOICE_CHANNEL_ID';
let times = 0;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkHour(); // Start checking for the top of the hour
});

client.on('messageCreate', async (message) => {
    if (message.content === '!playsound') {
        const channel = message.member.voice.channel;
        if (!channel) {
            return message.reply('You need to be in a voice channel to play a sound!');
        }
        await playSound(channel);
    }
});

async function playSound(channel) {
    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(SOUND_PATH);

        player.play(resource);
        connection.subscribe(player);

        player.on('idle', () => {
            console.log('Finished playing sound, leaving the voice channel.');
            connection.destroy(); // Disconnect from the voice channel after sound finishes
        });

        player.on('error', (error) => {
            console.error('Error playing sound:', error);
            connection.destroy(); // Disconnect if there is an error
        });

        console.log('Playing sound in the voice channel!');
    } catch (error) {
        console.error('Error joining or playing sound:', error);
    }
}

function checkHour() {
    setInterval(async () => {
        const now = new Date();
        
        if (now.getMinutes() === 0 && times === 0) { // Check if it's the top of the hour
            const channel = client.channels.cache.get(TARGET_VOICE_CHANNEL_ID);
            if (channel && channel.isVoiceBased()) {
                console.log('It\'s the top of the hour, playing sound in:', channel.name);
                await playSound(channel); // Play sound in the specified voice channel
                times = 1
                console.log(`bell has struck ${times} time(s)`);
            } else if (now.getMinutes !== 0) {
                
                times = 0;
                console.log(`bell has struck ${times} time(s)`);
            }
            else {
                console.log('Voice channel not found or invalid.');
            }
        }
    }, 22000); // Check every minute
}

client.login('YOUR_TOKEN'); // Replace 'YOUR_TOKEN' with your bot's token
