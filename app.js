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
            console.error(error.message);
        }
    }
});

// Affichage des matchs du jour
cron.schedule('01 0 * * *', async function (){
    await showMatches(await winamaxChevalier.dayMatches(), null);
})

// Affichages des résultats du jour
cron.schedule('55 22 * * *', async function (){
    console.log("cron")
    await showResults(await winamaxChevalier.dayResults(), null);
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(5000) /// waiting 5 second.
    await showLeaderboard(await winamaxChevalier.leaderboardAll(), "ALL");
})

async function showMe(content, message) {
    const ratio = Number.parseFloat(content.Wins / (content.Wins + content.Looses)).toFixed(2);
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
                "\nWin : " + match.Win  + " - Draw : " + match.Draw + " - Loose : " + match.Loose)
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
    thread.send({embeds: [embedMe]});
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
    let desc = "";
    if(content.length === 0){
        desc = "Aucun pari en cours"
    }
    for(bet of content){
        desc += bet.paris + "\n";
    }
    const embedMe = new EmbedBuilder()
        .setColor("#8a7916")
        .setTitle("Pari en cours")
        .setDescription(desc)
        .setFooter({text: "Calcul des points tous les soirs à 22h30"});

    message.channel.send({content: message.author.toString(), embeds: [embedMe]});

}

async function showLeaderboard(content, type){
    const channel = await client.channels.cache.get(channelID).fetch(true);
    const thread = await channel.threads.cache.get(threadID).fetch(true);

    let index = 0;
    const colorsPodium = {Gold:"#C9B037",Silver:"#D7D7D7",Bronze:"#AD8A56",Default:"#FFFFFF"};
    for (let name in content){
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
            .setTitle(index + " - " + content[name].Name);

        let desc = "";
        if(type === "FD" || type === "ALL")
            desc += content[name].FeuillaDollars + "$FD\n";
        if(type === "wins" || type === "ALL")
            desc += content[name].Wins + " paris gagnants. Bravo";
        if(type === "ALL")
            embedLeaderboard.setFooter({text: content[name].Points + " points globaux / " + content[name].Ratio + "% de victoire"})
        embedLeaderboard.setDescription(desc);

        thread.send({embeds: [embedLeaderboard]});
    }
}

async function processRequest(message) {
    const request = message.content.substring(1, message.content.length).toLowerCase();
    let words = request.split(" ");
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
                await showMe(await winamaxChevalier.me(message.author), message);
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
        case "daymatches":
            try{
                await showMatches(await winamaxChevalier.dayMatches());
            } catch (error){
                console.log(error);
                message.channel.send(message.author.toString() + " " + error.message);
            }
            break;
        case "bets":
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
            await showLeaderboard(await winamaxChevalier.leaderboard("wins"), "wins");
            break;
        case "fd":
            await showLeaderboard(await winamaxChevalier.leaderboard("FD"), "FD");
            break;
        case "leaderboard":
            await showLeaderboard(await winamaxChevalier.leaderboardAll(), "ALL");
            break;
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Server on')
});