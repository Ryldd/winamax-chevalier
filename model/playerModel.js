const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerModel = new Schema({
   _id: String,
   Name: String,
   FeuillaDollars: Number,
   Wins: Number,
   Looses: Number
});

const Player = mongoose.model('Player', playerModel);

async function addPlayer(player){
   const playerDB = new Player();
   playerDB._id = player.id;
   playerDB.Name = player.username;
   playerDB.FeuillaDollars = 0;
   playerDB.Wins = 0;
   playerDB.Looses = 0;
   await playerDB.save();
}

async function getPlayer(playerId){
   return Player.findById(playerId);
}

module.exports = {addPlayer, getPlayer}

