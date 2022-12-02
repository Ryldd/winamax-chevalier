const mongoose = require('mongoose');
const { Schema } = mongoose;

const matchModel = new Schema({
    _id: String,
    Home: String,
    Away: String,
    Win: Number,
    Loose: Number,
    Draw: Number,
    StartDay: String,
    StartHour: String,
    EmojiHome: String,
    EmojiAway: String
});

const Match = mongoose.model('Match', matchModel);

async function addMatch(match){
    const matchDB = new Match();
    matchDB._id = match.Id;
    matchDB.Home = match.Home;
    matchDB.Away = match.Away;
    matchDB.Win = match.Win;
    matchDB.Loose = match.Loose;
    matchDB.Draw = match.Draw;
    matchDB.StartDay = match.StartDay;
    matchDB.StartHour = match.StartHour;
    matchDB.EmojiHome = match.EmojiHome;
    matchDB.EmojiAway = match.EmojiAway;
    await matchDB.save();
}

async function getMatch(matchId){
    return Match.findById(matchId);
}

async function getMatchesOfTheDay() {
    let date = new Date();
    date = date.toISOString().slice(0,10)
    return Match.find({
        StartDay: date
    });
}

async function updateCote(matchData, win, loose, draw) {
    matchData.Win = win;
    matchData.Loose = loose;
    matchData.Draw = draw;
    await matchData.save();
}

async function getEmojiCountry(country){
    let emoji = "";
    let match = await Match.find({Home: country});

    if (match.length === 0) {
        match = await Match.find({Away: country});
        emoji = match[0].EmojiAway;
    } else {
        emoji = match[0].EmojiHome;
    }
    return emoji;
}

module.exports = {addMatch, getMatch, getMatchesOfTheDay, updateCote}

