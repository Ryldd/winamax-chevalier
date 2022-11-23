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

async function userBets(user) {
    const bets = await betController.getUserBets(user.id);
    const content = {paris: ""};
    for(bet of bets){
        if(!bet.Over) {
            const match = await matchController.getMatch(bet.Match);
            content.paris += match.EmojiHome + " vs " + match.EmojiAway + " : " + bet.Bet + " à " + bet.Cote + "\n"
        }
    }
    console.log(content)
    return content;
}

async function dayResults() {
    const scores = await betController.dayResults();
    const content = [];

    for (const score of scores){
        const score_home = score.scores[0].name === score.home_team ? score.scores[0].score : score.scores[1].score;
        const score_away = score.scores[0].name === score.away_team ? score.scores[0].score : score.scores[1].score;
        const match = await matchController.getMatch(score.id);

        let result = "Draw";
        let cote = match.Draw;
        if(score_home > score_away) {
            result = "Win";
            cote = match.Win;
        }
        else if(score_home < score_away) {
            result = "Loose";
            cote = match.Loose;
        }

        const winners = await betController.processBet(score.id, result, cote);

        content.push({
            Home: score.home_team,
            EmojiHome: match.EmojiHome,
            Away: score.away_team,
            EmojiAway: match.EmojiAway,
            ScoreHome: score_home,
            ScoreAway: score_away,
            Cote: cote,
            StartDay: match.StartDay,
            StartHour: match.StartHour,
            Winners: winners.join(", ")
        })
    }
    return content;
}

async function leaderboard(type) {
    let players = await playerController.getAllPlayers();
    let content = [];
    for (let player of players) {
        const ratio = player.Wins / (player.Wins + player.Looses) * 100;
        content.push({
            id: player._id,
            Name: player.Name,
            Wins: player.Wins,
            FeuillaDollars: player.FeuillaDollars,
            Ratio: ratio
        });
    }
    if(type === "FD")
        content.sort(function(a, b) {
            if(b.FeuillaDollars === a.FeuillaDollars){
                return b.Wins - a.Wins
            }
            return b.FeuillaDollars - a.FeuillaDollars
        });
    else if(type === "wins")
        content.sort(function(a, b) {
            if(b.Wins === a.Wins){
                return b.FeuillaDollars - a.FeuillaDollars
            }
            return b.Wins - a.Wins
        });
    return content;
}

async function leaderboardAll() {
    let content = [];
    let wins = await leaderboard("wins");
    let cpt = wins.length;
    for (win of wins) {
        content[win.Name] = {
            id: win._id,
            Name: win.Name,
            Wins: win.Wins,
            FeuillaDollars: win.FeuillaDollars,
            Points: cpt,
            Ratio: win.Ratio
        };
        cpt--;
    }

    const fds = await leaderboard("FD");
    cpt = fds.length;
    for (fd of fds) {
        content[fd.Name].Points += cpt;
        cpt--;
    }

    content.sort(function (a, b) {
        if(b.Points === a.Points)
            return b.Ratio - a.Ratio
        return b.Points - a.Points
    });
    return content;
}

module.exports = {register, me, init, dayMatches, bet, userBets, dayResults, leaderboard, leaderboardAll}