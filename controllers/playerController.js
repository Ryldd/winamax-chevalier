const playerSchema = require("../model/playerModel");

async function addPlayer(user) {
    const userData = await playerSchema.getPlayer(user.id);
    if(userData){
        throw new Error("Utilisateur déjà enregistré <:pascontent:851365340885024769>");
    }
    await playerSchema.addPlayer(user);
}

async function getPlayer(user){
    return await playerSchema.getPlayer(user.id);
}

async function getAllPlayers() {
    return await playerSchema.getAllPlayers();
}

module.exports = {addPlayer, getPlayer, getAllPlayers}