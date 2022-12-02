const mongoose = require('mongoose');
const { Schema } = mongoose;

const emojiModel = new Schema({
    _id: Number,
    Emoji: String,
    Country: String
});

const Emoji = mongoose.model('Emoji', emojiModel);

async function getEmoji(country) {
    return Emoji.findOne({Country: country}, {Emoji: 1})
}

module.exports = {getEmoji}

