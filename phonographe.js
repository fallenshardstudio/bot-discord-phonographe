require('./phonographe_log.js');
const context = require('./phonographe_context.js');
const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const client = new Discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (!msg.content.startsWith("+")) return;

    let ctx = context.getOrCreateNew(msg.guild.id);

    if (msg.content.startsWith("+play")) {
        execute(ctx, msg);
    } else if (msg.content.startsWith("+stop")) {
        if (ctx.getCurrentDispatcher() != null) {
            ctx.getCurrentDispatcher().end();
        }
        context.removeIfExists(ctx.getServerId());
    }
});

async function execute(ctx, msg) {
    const args = msg.content.split(" ");

    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel)
        return msg.channel.send(
            "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return msg.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    try {
        var connection = await voiceChannel.join();
        const dispatcher = connection
            .play(ytdl(song.url, {"quality": "highestaudio", "liveBuffer": 20000}))
            .on("finish", () => {
                voiceChannel.leave();
                context.removeIfExists(ctx.getServerId())
            })
            .on("error", error => console.error(error));

        //dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        ctx.setCurrentDispatcher(dispatcher);
        msg.channel.send(`Lecture de **${song.title}**`);
        console.log(`${msg.author.username} sur server="${msg.guild.name}" à démarré la lecture de "${song.title}"`);
    } catch (err) {
        console.log(err);
        return msg.channel.send(err);
    }
}

console.log("Use this link to register bot: https://discord.com/api/oauth2/authorize?client_id=715309773582762045&permissions=3147776&scope=bot");
console.log("Login to Discord...")

client.login(process.env.DISCORD_BOT_PHONOGRAPHE_TOKEN);
