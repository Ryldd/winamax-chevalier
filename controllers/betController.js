const betModel = require("../model/betModel");
const matchModel = require("../model/matchModel");
const playerModel = require("../model/playerModel");
const axios = require("axios");

async function bet(matchId, playerId, cote, bet) {
    const betData = await betModel.getBetByMatchAndPlayer(matchId, playerId);
    const matchData = await matchModel.getMatch(matchId);
    const date = new Date();

    if(betData.length > 0)
        console.log("Match déjà parié par ce joueur");
    else if(matchData.StartHour < date.getHours())
        console.log("Match déjà joué connard")
    else {
        const betContent = {
            Match: matchId,
            Player: playerId,
            Cote: cote,
            Bet: bet
        };

        await betModel.addBet(betContent);
    }

}

async function getUserBets(userId) {
    return await betModel.getUserBets(userId);
}

async function dayResults() {
    const response = await axios.get("https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=46816b9b3c089e830c9f9ee9fd20bde4&daysFrom=1");
    const scores = [];
    let date = new Date();
    date = date.toISOString().slice(0,10)
    for (const match of response.data){
        if(match.commence_time.slice(0,10) === date && match.completed === true){
            scores.push(match);
        }
    }
    return scores;
}

async function processBet(matchId, result, cote) {
    const bets = await betModel.getBetsByMatch(matchId);
    const winners = [];
    for(const bet of bets){
        if(!bet.Over) {
            if (result === bet.Bet) {
                const player = await playerModel.getPlayer(bet.Player);
                winners.push(player.Name);
                await playerModel.creditPlayer(bet.Player, cote);
            } else {
                await playerModel.debitPlayer(bet.Player, 1);
            }
            await betModel.setOver(bet, true);
        }
    }
    return winners;
}

module.exports = {bet, getUserBets, dayResults, processBet}
