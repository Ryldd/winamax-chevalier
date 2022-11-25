const matchModel = require("../model/matchModel");
const axios = require("axios");

async function init(){
    const response = await axios.get("https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=46816b9b3c089e830c9f9ee9fd20bde4&regions=eu&bookmakers=betclic");

    for(let match of response.data){
        const matchData = await matchModel.getMatch(match.id);

        let win = 0, loose = 0, draw = 0;
        for(cote of match.bookmakers[0].markets[0].outcomes){
            if(cote.name === match.home_team)
                win = cote.price;
            else if(cote.name === "Draw")
                draw = cote.price;
            else
                loose = cote.price
        }

        const day = match.commence_time.slice(0,10)
        const hour = match.commence_time.slice(11, 13)
        if(matchData){
            console.log("Match déjà ajouté")
            let now = new Date();
            now = now.toISOString().slice(0,10)
            if(day !== now)
                await updateCote(matchData, win, loose, draw);
        } else {
            const matchContent = {
                Id: match.id,
                Home: match.home_team,
                Away: match.away_team,
                Win: win,
                Loose: loose,
                Draw: draw,
                StartDay: day,
                StartHour: hour
            };

            await matchModel.addMatch(matchContent);
        }
    }
}

async function updateCote(matchData, win, loose, draw){
    await matchModel.updateCote(matchData, win, loose, draw);
}

async function dayMatches() {
    return await matchModel.getMatchesOfTheDay()
}

async function getMatch(matchId) {
    return await matchModel.getMatch(matchId)
}

module.exports = {init, dayMatches, getMatch}