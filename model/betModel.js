const mongoose = require('mongoose');
const { Schema } = mongoose;
const autoIncrement = require('mongoose-sequence')(mongoose);

const betModel = new Schema({
    _id: Number,
    Match: String,
    Player: String,
    Cote: String,
    Bet: String
}, {_id: false});
betModel.plugin(autoIncrement);

const Bet = mongoose.model('Bet', betModel);

async function addBet(bet){
    const betDB = new Bet();
    betDB.Match = bet.Match;
    betDB.Player = bet.Player;
    betDB.Cote = bet.Cote;
    betDB.Bet = bet.Bet;
    await betDB.save();
}

async function getBet(betId){
    return Bet.findById(betId);
}

async function getBetsByMatch(matchId){
    return Bet.find({Match: matchId});
}

async function getBetByMatchAndPlayer(matchId, playerId){
    return Bet.find({Match: matchId, Player: playerId});
}

module.exports = {addBet, getBet, getBetsByMatch, getBetByMatchAndPlayer}

