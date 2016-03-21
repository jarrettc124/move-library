var crypto = require('crypto');

var SaltLength = 9;

function createHash(password, salt) {
  var hash = sha1(password + salt);
  return hash;
}

function validateHash(hash, password, salt) {
  var validHash = sha1(password + salt);
  return hash === validHash;
}

function generateSalt(len) {
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
      setLen = set.length,
      salt = '';
  for (var i = 0; i < len; i++) {
    var p = Math.floor(Math.random() * setLen);
    salt += set[p];
  }
  return salt;
}

function generateCode(len) {
  var set = '0123456789',
      setLen = set.length,
      salt = '';
  for (var i = 0; i < len; i++) {
    var p = Math.floor(Math.random() * setLen);
    salt += set[p];
  }
  return salt;
}


function sha1(string) {
    return crypto.createHash('sha1').update(string).digest('hex');
}

module.exports = {
  'hash': createHash,
  'generateSalt': generateSalt,
  'validate': validateHash,
  'generateCode': generateCode
};
