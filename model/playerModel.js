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

async function debitPlayer(playerId, number) {
   let player = await getPlayer(playerId);
   player.Looses++;
   player.FeuillaDollars -= number;
   await player.save();
}

async function creditPlayer(playerId, number) {
   let player = await getPlayer(playerId);
   player.Wins++;
   player.FeuillaDollars += number;
   await player.save();
}

async function getAllPlayers() {
   return Promise.resolve(undefined);
}

module.exports = {addPlayer, getPlayer, creditPlayer, debitPlayer, getAllPlayers}

