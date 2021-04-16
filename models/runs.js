const mongoose = require('mongoose');

let runsSchema = new mongoose.Schema({
    activity: String,
    url: String,
    timestamp: String,
    name: String,
    distance: Number,
    date: Date
});

let Run = mongoose.model('Run', runsSchema);

module.exports = Run;