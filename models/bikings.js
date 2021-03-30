const mongoose = require('mongoose');

let bikingsSchema = new mongoose.Schema({
    url: String,
    timestamp: String,
    name: String,
    distance: Number,
    type: String,
    date: Date
});

let Biking = mongoose.model('Biking', bikingsSchema);

module.exports = Biking;