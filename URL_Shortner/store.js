const mongoose = require('mongoose')

const UrlSchema = new mongoose.Schema({
    url: String,
    shortUrl: String
});

const Url = mongoose.model('Url',UrlSchema);

module.exports = Url;