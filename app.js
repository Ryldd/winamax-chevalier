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
const threadID = process.env.THREADID;
const adminId = ["252450209546633216", "158263552539492353"];

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

client.on("ready", async function () {
    console.log("Mon BOT est Connecté");
    const channel = await client.channels.cache.get(channelID).fetch(true);
    const thread = await channel.threads.cache.get(threadID).fetch(true);
    if(thread.joinable) {
        await thread.join();
        console.log("Bot ajouté au fil")
    }
});

client.on("messageCreate", function (message) {
    if ((message.channel.id === channelID || message.channel.id === threadID)&& message.content.charAt(0) === delimiter) {
        processRequest(message)
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
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
            thread.send(error.message);
        }
    }
});

// Affichage des matchs du jour
cron.schedule('30 9 * * *', async function (){
    await showMatches(await winamaxChevalier.dayMatches(), null);
})

// Affichages des résultats du jour
cron.schedule('30 21 * * *', async function (){
    console.log("cron")
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
    const thread = await channel.threads.cache.get(threadID).fetch(true);

    if (content.length === 0) {
        thread.send("Il n'y a aucun match aujourd'hui");
    }
    for (const match of content) {
        const hour = Number.parseInt(match.StartHour) + 1;
        const embedMe = new EmbedBuilder()
            .setColor('#8D1B3D')
            .setTitle(match.EmojiHome + " " + match.Home + " VS " + match.EmojiAway + " " + match.Away)
            .setDescription("Côte :" +
                "\nWin : " + match.Win + " - Loose : " + match.Loose + " - Draw : " + match.Draw)
            .setFooter({text: match.StartDay + " à " + hour + "h00 #"+ match._id});
        thread.send({embeds: [embedMe]}).then(function (message){
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
    thread.send({content: "@everyone", embeds: [embedMe]});
}

async function showResults(content) {
    const channel = await client.channels.cache.get(channelID).fetch(true);
    const thread = await channel.threads.cache.get(threadID).fetch(true);

    if (content.length === 0) {
        thread.send("Il n'y a eu aucun match aujourd'hui");
    }
    for (const match of content) {
        const hour = Number.parseInt(match.StartHour) + 1;

        const embedMe = new EmbedBuilder()
            .setColor('#8D1B3D')
            .setTitle(match.Home + " 🆚 " + match.Away)
            .setDescription(match.EmojiHome + " " + match.ScoreHome +
                " - " + match.ScoreAway + " " + match.EmojiAway +
                "\nCôte gagnante : " + match.Cote +
                "\nVainqueurs : " + match.Winners
            )
            .setFooter({text: match.StartDay + " à " + hour + "h00"});

        thread.send({embeds: [embedMe]});
    }
    thread.send({content: "@everyone"})
}

async function showBets(content, message) {
    console.log(content)
    if(content.paris === ""){
        content.paris = "Aucun pari en cours"
    }
    const embedMe = new EmbedBuilder()
        .setColor("#8a7916")
        .setTitle("Pari en cours")
        .setDescription(content.paris)
        .setFooter({text: "Calcul des points tous les soirs à 22h30"});

    message.channel.send({content: message.author.toString(), embeds: [embedMe]});

}

function showLeaderboard(content, message, type){
    let index = 0;
    const colorsPodium = {Gold:"#C9B037",Silver:"#D7D7D7",Bronze:"#AD8A56",Default:"#FFFFFF"};
    for (let userEntry of content){
        index+=1;
        let color = colorsPodium.Default;
        if(index === 1)
            color = colorsPodium.Gold;
        else if(index === 2)
            color = colorsPodium.Silver;
        else if(index === 3)
            color = colorsPodium.Bronze;
        const embedLeaderboard = new EmbedBuilder()
            .setColor(color)
            .setTitle(index + " - " + userEntry.Name);
        if(type === "FD")
            embedLeaderboard.setDescription(userEntry.FeuillaDollars + "$FD");
        else
            embedLeaderboard.setDescription(userEntry.Wins + " paris gagnants. Bravo");
        message.channel.send({content: message.author.toString(), embeds: [embedLeaderboard]});
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
            if (adminId.includes(message.author.id)) {
                try {
                    await winamaxChevalier.init();
                    message.channel.send("Base de données initialisées");
                } catch (error) {
                    console.log(error);
                    message.channel.send(message.author.toString() + " " + error.message);
                }
            } else {
                message.channel.send(message.author.toString() + " non <:pascontent:851365340885024769>");
            }
            break;
        case "dayMatches":
            if (adminId.includes(message.author.id)) {
                try{
                    await showMatches(await winamaxChevalier.dayMatches());
                } catch (error){
                    console.log(error);
                    message.channel.send(message.author.toString() + " " + error.message);
                }
            } else {
                message.channel.send(message.author.toString() + " non <:pascontent:851365340885024769>");
            }
            break;
        case "myBets":
            try{
                await showBets(await winamaxChevalier.userBets(message.author), message);
            } catch (error){
                console.log(error);
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
        case "results":
            if (adminId.includes(message.author.id)) {
                try {
                    await showResults(await winamaxChevalier.dayResults(), null);
                } catch (error) {
                    console.log(error);
                    message.channel.send(message.author.toString() + " " + error.message);
                }
            } else {
                message.channel.send(message.author.toString() + " non <:pascontent:851365340885024769>");
            }
            break;
        case "wins":
            showLeaderboard(await winamaxChevalier.leaderboard("wins"),message, "wins");
            break;
        case "feuilladollars":
            showLeaderboard(await winamaxChevalier.leaderboard("FD"),message, "FD");
            break;
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Server on')
});