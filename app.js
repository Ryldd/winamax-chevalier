const {Discord, GatewayIntentBits, Client, EmbedBuilder} = require('discord.js');
const cron = require("node-cron");
const express = require('express');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'MEMBERS']
});
const delimiter = process.env.DELIMITER;
const channelID = process.env.CHANNELID;

// MONGOnpm
const mongoose = require("mongoose");
const mongoURL = process.env.MONGO_CONNECT;
const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const app = express();

const winamaxChevalier = require("./controllers/winamaxChevalier")


mongoose.connect(mongoURL, connectionParams)
    .then(() => {
        console.log('Connected to database ')
    })
    .catch((err) => {
        console.error(`Error connecting to the database. \n${err}`);
    });

client.login(process.env.BOT_LOGIN)

client.on("ready", function () {
    console.log("Mon BOT est Connecté");
});

client.on("messageCreate", function (message) {
    if (message.channel.id === channelID && message.content.charAt(0) === delimiter) {
        processRequest(message)
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    const channel = await client.channels.cache.get(channelID).fetch(true);
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    if(reaction.message.author.id === "1044327951681998948" && user.id !== "1044327951681998948"){
        try {
            console.log("react")
            await winamaxChevalier.bet(reaction.emoji.name, reaction.message.embeds[0].data.footer.text, user);
        } catch(error) {
            channel.send(error.message);
        }
    }
});

// Affichage des matchs du jour
cron.schedule('10 11 * * *', async function (){
    await showMatches(await winamaxChevalier.dayMatches(), null);
})

// Affichages des résultats du jour
cron.schedule('30 22 * * *', async function (){
    await showResults(await winamaxChevalier.dayResults(), null);
})

function showMe(content, message) {
    const ratio = content.Wins / (content.Wins + content.Looses);
    const ratioTxt = "Ratio: " + ratio*100 + "%";
    console.log(content);
    const embedMe = new EmbedBuilder()
        .setColor('#ffffff')
        .setTitle(message.author.username + " (" + content.FeuillaDollars + "$FD)")
        .setDescription("Récap :" +
            "\nWins : " + content.Wins + " - Looses : " + content.Looses)
        .setFooter({text: ratioTxt});

    message.channel.send({content: message.author.toString(), embeds: [embedMe]});
}

async function showMatches(content) {
    const channel = await client.channels.cache.get(channelID).fetch(true);
    if (content.length === 0) {
        channel.send("Il n'y a aucun match aujourd'hui");
    }
    for (const match of content) {
        const hour = Number.parseInt(match.StartHour) + 1;
        const embedMe = new EmbedBuilder()
            .setColor('#8D1B3D')
            .setTitle(match.EmojiHome + " " + match.Home + " VS " + match.EmojiAway + " " + match.Away)
            .setDescription("Côte :" +
                "\nWin : " + match.Win + " - Loose : " + match.Loose + " - Draw : " + match.Draw)
            .setFooter({text: match.StartDay + " à " + hour + "h00 #"+ match._id});
        channel.send({embeds: [embedMe]}).then(function (message){
            message.react(match.EmojiHome)
            message.react("🏳️")
            message.react(match.EmojiAway)
        });
    }
    const embedMe = new EmbedBuilder()
        .setColor('#8a7916')
        .setTitle("⚠️Avertissement⚠️")
        .setDescription("Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09-74-75-13-13 (appel non surtaxé)")
        .setFooter({text: "Seul votre premier pari est pris en compte"});
    channel.send({embeds: [embedMe]});
}

async function showResults(content) {
    if (content.length === 0) {
        channel.send("Il n'y a eu aucun match aujourd'hui");
    }
    for (const match of content) {
        const hour = Number.parseInt(match.StartHour) + 1;

        if(content.result === "Win")
            cote = content.Win
        else if(content.result === "Loose")
            cote = content.Loose
        else
            cote = content.Draw

        const embedMe = new EmbedBuilder()
            .setColor('#8D1B3D')
            .setTitle(match.Home + " VS " + match.Away)
            .setDescription("Résultat :" +
                content.Home + content.ScoreHome + " - " + content.Away + + content.ScoreAway +
                "Côte gagnante : " + cote
            )
            .setFooter({text: match.StartDay + " à " + hour + "h00 #"});

        const channel = await client.channels.cache.get(channelID).fetch(true);
        channel.send({embeds: [embedMe]});
    }
}

async function processRequest(message) {
    const request = message.content.substring(1, message.content.length);
    var words = request.split(" ");
    switch (words[0]) {
        case "register":
            try {
                await winamaxChevalier.register(message.author);
                message.channel.send(message.author.toString() + " enregistré");
            } catch (error) {
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
        case "me":
            try {
                showMe(await winamaxChevalier.me(message.author), message);
            } catch (error) {
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
        case "init":
            try{
                await winamaxChevalier.init();
                message.channel.send("Base de données initialisées");
            } catch (error) {
                console.log(error);
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
        case "dayMatches":
            try{
                showMatches(await winamaxChevalier.dayMatches());
            } catch (error){
                console.log(error);
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Server on')
});