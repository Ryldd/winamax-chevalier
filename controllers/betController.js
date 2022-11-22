const betModel = require("../model/betModel");
const axios = require("axios");

async function bet(matchId, playerId, cote, bet) {
    const betData = await betModel.getBetByMatchAndPlayer(matchId, playerId);

    if(betData.length > 0)
        console.log("Match déjà parié par ce joueur");
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

module.exports = {bet}
