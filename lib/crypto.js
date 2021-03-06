/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
 |                                                                            |
 | yyyyyyyyyyyysssssssssss+++osssssssssssyyyyyyyyyyyy                         |
 | yyyyyysssssssssssssss/----../sssssssssssssssyyyyyy                         |
 | sysssssssssssssssss/--:-`    `/sssssssssssssssssys                         |
 | sssssssssssssssso/--:-`        `/sssssssssssssssss   AppsForHere           |
 | sssssssssssssso/--:-`            `/sssssssssssssss                         |
 | sssssssssssso/-::-`                `/sssssssssssss   Advanced integration  |
 | sssssssssso/-::-`                    `/sssssssssss   for PayPal Here and   |
 | sssssssso/-::-`                        `/sssssssss   the PayPal retail     |
 | ssssoso:-::-`                            `/osossss   family of products.   |
 | osooos:-::-                                -soooso                         |
 | ooooooo:---.``````````````````````````````.+oooooo                         |
 | oooooooooooooooooooooooooooooooooooooooooooooooooo                         |
 \*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var crypto = require('crypto');
var logger = require('pine')();

exports.encryptToken = function (plainText, password, cb) {
    var salt = new Buffer(crypto.randomBytes(16), 'binary');
    var iv = new Buffer(crypto.randomBytes(16), 'binary');

    crypto.pbkdf2(password, salt, 1000, 32, function (err, key) {
        if (err) {
            logger.error('Failed to generate key.', err);
            cb(err, null);
            return;
        }

        var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        var buffer = new Buffer(cipher.update(plainText, 'utf8', 'binary'), 'binary');
        buffer = Buffer.concat([buffer, new Buffer(cipher.final('binary'), 'binary')]);

        var hashKey = crypto.createHash('sha1').update(key).digest('binary');
        var hmac = new Buffer(crypto.createHmac('sha1', hashKey).update(buffer).digest('binary'), 'binary');

        buffer = Buffer.concat([salt, iv, hmac, buffer]);
        cb(null, buffer.toString('base64'));
    });
};

exports.decryptToken = function (cipherText, password, cb) {
    var cipher = new Buffer(cipherText, 'base64');

    var salt = cipher.slice(0, 16);
    var iv = cipher.slice(16, 32);
    var hmac = cipher.slice(32, 52);
    cipherText = cipher.slice(52);

    crypto.pbkdf2(password, salt, 1000, 32, function (err, key) {
        if (err) {
            logger.error('Failed to generate key.', err);
            cb(err, null);
            return;
        }
        var cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        // Verify the HMAC first
        var hashKey = crypto.createHash('sha1').update(key).digest('binary');
        var hmacgen = new Buffer(crypto.createHmac('sha1', hashKey).update(cipherText).digest('binary'), 'binary');
        if (hmacgen.toString('base64') !== hmac.toString('base64')) {
            cb(new Error('HMAC Mismatch!'), null);
            return;
        }
        var buffer = new Buffer(cipher.update(cipherText), 'binary');
        buffer = Buffer.concat([buffer, new Buffer(cipher.final('binary'))]);
        cb(null, buffer.toString('utf8'), key);
    });
};

exports.decryptTokenWithKey = function (cipherText, key, cb) {
    var cipher = new Buffer(cipherText, 'base64');

    var salt = cipher.slice(0, 16);
    var iv = cipher.slice(16, 32);
    var hmac = cipher.slice(32, 52);
    cipherText = cipher.slice(52);

    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Verify the HMAC first
    var hashKey = crypto.createHash('sha1').update(key).digest('binary');
    var hmacgen = new Buffer(crypto.createHmac('sha1', hashKey).update(cipherText).digest('binary'), 'binary');
    if (hmacgen.toString('base64') !== hmac.toString('base64')) {
        cb(new Error('HMAC Mismatch!'), null);
        return;
    }
    var buffer = new Buffer(decipher.update(cipherText), 'binary');
    buffer = Buffer.concat([buffer, new Buffer(decipher.final('binary'))]);
    cb(null, buffer.toString('utf8'), key);
};
