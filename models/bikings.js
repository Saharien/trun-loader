const mongoose = require('mongoose');

let bikingsSchema = new mongoose.Schema({
    activity: String,
    url: String,
    timestamp: String,
    name: String,
    distance: Number,
    elevgain: Number,
    type: String,
    date: Date
});

let Biking = mongoose.model('Biking', bikingsSchema);

module.exports = Biking;