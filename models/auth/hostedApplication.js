'use strict';

var mongoose = require('mongoose'),
    util = require('util'),
    crypto = require('../../lib/crypto'),
    findOrCreate = require('mongoose-findorcreate');

var hostedApplication = function () {

    var hostedAppSchema = mongoose.Schema({
        owner_id: mongoose.Schema.Types.ObjectId,
        encryptedConfiguration: Buffer,
        environment: String,
        return_urls: [String]
    });

    util._extend(hostedAppSchema.methods, require('../secureConfig'));

    hostedAppSchema.methods.generateRefreshToken = function (refresh_token, key, callback) {
      crypto.encryptToken(refresh_token, key, callback);
    };

    hostedAppSchema.methods.decryptRefreshToken = function (enc_refresh_token, key, callback) {
        crypto.decryptToken(enc_refresh_token, key, callback);
    };

    return mongoose.model('HostedApplication', hostedAppSchema);
};

// In case you somehow require this twice when it thinks they're separate modules.
module.exports = mongoose.models.HostedApplication || new hostedApplication();
