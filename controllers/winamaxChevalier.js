const playerController = require("./playerController")
const matchController = require("./matchController")
const betController = require("./betController")

async function register(user) {
    try {
        await playerController.addPlayer(user);
    } catch (error) {
        throw new Error(error.message);
    }
}

async function init() {
    try {
        await matchController.init();
    } catch (error) {
        throw new Error(error.message);
    }
}

async function me(user) {
    let userData = await playerController.getPlayer(user);
    if (userData) {
        let content = {
            "FeuillaDollars": userData.FeuillaDollars,
            "Wins": userData.Wins,
            "Looses": userData.Looses
        };
        return content;
    } else
        throw new Error("Il faut s'enregistrer (*register) <:NAVARRE:776793943001923585>");
}

async function dayMatches() {
    return await matchController.dayMatches();
}

async function bet(flag, footer, user) {
    const matchId = footer.split("#")[1];
    const matchData = await matchController.getMatch(matchId);
    let cote = 0, bet = "";

    if(matchData){
        if(flag === matchData.EmojiAway){
            cote = matchData.Loose;
            bet = "Loose";
        } else if(flag === matchData.EmojiHome) {
            cote = matchData.Win;
            bet = "Win";
        } else if (flag === "🏳️") {
            cote = matchData.Draw;
            bet = "Draw";
        }
        await betController.bet(matchData._id, user.id, cote, bet);
    } else {
        throw new Error("Le match n'existe pas <:pascontent:851365340885024769>");
    }

}

module.exports = {register, me, init, dayMatches, bet}