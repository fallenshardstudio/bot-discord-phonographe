require('./phonographe_log.js');
const context = require('./phonographe_context.js');
const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const ytsr = require('ytsr');
const client = new Discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.fetchApplication().then(function(app) {
        console.log(`Use this link to register bot: https://discord.com/api/oauth2/authorize?client_id=${app.id}&permissions=3147776&scope=bot`);
    })
});

client.on('message', msg => {
    if (!msg.content.startsWith("+")) return;

    let ctx = context.getOrCreateNew(msg.guild.id);

    if (msg.content.startsWith("+play")) {
        execute(ctx, msg);
    } else if (msg.content.startsWith("+stop")) {
        if (ctx.getConnection() != null) {
            ctx.getConnection().dispatcher.pause();
        }
    } else if (msg.content.startsWith("+leave")) {
        if (ctx.getConnection() != null) {
            msg.member.voice.channel.leave();
            context.removeIfExists(ctx.getServerId());
        }
    }
});

async function execute(ctx, msg) {
    const args = msg.content.split(/ (.*)/);

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


    var song = undefined;
    try {
        const songInfo = await ytdl.getInfo(args[1]);
        song = {
            title: songInfo.title,
            url: songInfo.video_url
        };
    } catch (UnhandledPromiseRejectionWarning) {
        let filter;

        await ytsr.getFilters(args[1], function (err, filters) {
            if (err) throw err;
            filter = filters.get('Type').find(o => o.name === 'Video');
            ytsr.getFilters(filter.ref, function (err, filters) {
                if (err) throw err;
                filter = filters.get('Duration').find(o => o.name.startsWith('Short'));
                var options = {
                    limit: 1,
                    nextpageRef: filter.ref,
                }
                ytsr(null, options, function (err, searchResults) {
                    if (!err) {
                        song = {
                            title: searchResults.items[0].title,
                            url: searchResults.items[0].link
                        };
                    } else {
                        song = null;
                    }
                });
            });
        });

        while (song === undefined) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    if (song != null) {
        try {
            if (ctx.getConnection() == null) {
                var connection = await voiceChannel.join();
                ctx.setConnection(connection);
            }

            ctx.getConnection()
                .play(ytdl(song.url, {"quality": "highestaudio", "liveBuffer": 20000}))
                .on("finish", () => {
                    voiceChannel.leave();
                    context.removeIfExists(ctx.getServerId())
                })
                .on("error", error => console.error(error));

            msg.channel.send(`Lecture de **${song.title}**`);
            console.log(`${msg.author.username} sur server="${msg.guild.name}" à démarré la lecture de "${song.title}"`);
        } catch (err) {
            console.log(err);
            return msg.channel.send(err);
        }
    } else {
        msg.channel.send(`*Votre recherche n'a donné aucun résultat :(`);
    }
}

console.log("Login to Discord...")

client.login(process.env.DISCORD_BOT_PHONOGRAPHE_TOKEN);
