var _ = require('underscore'),
    // apikeys = require('./apikeys.json'),
    _ = require('underscore');

function restrictToLoggedIn(req, res, next) {
    if (req.session.user !== null && req.session.user !== undefined) {
        next();
    } else {
        res.redirect('/');
    }
};

function getUser(req) {
    return req.session.user;
}

function restrictToSelf(req, res, next) {
    if (req.session.user !== null && req.session.user !== undefined) {
        if (req.session.user._id.toString() !== req.user._id.toString()) {
            req.flash('error', 'This action is restricted.');
            res.redirect('/');
        }
    } else {
            // req.flash('error', 'You are not logged in');
            res.redirect('/');
    }
}





/**
 * Call this function to format a failure response.
 **/
var failure = function(err) {
    return { 'result': {
        'status': 'error',
        'error': err
    }};
};

/**
 * Call this function to format a success response.
 **/
var success = function(result) {
    var returnValue = {};
    if (result) {
        returnValue = result;
    }
    result.status = 'success';
    return result;
};

var getUtcDate = function() {
    var now = new Date(); 
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
};

/**
 * Used to parse an email address into its component parts.
 **/
var parseEmail = function(pEmail, cb) {
    if (!_.isString(pEmail)) {
        cb("Email should be a string");
    } else {
        var emailRegex = /(.+)\@([A-Za-z0-9]+)\.(.+)/;
        var match = emailRegex.exec(pEmail);
        console.log(match);
        if (_.size(match) < 3) {
            cb("Email should be properly formatted with 3 parts");
        } else {
            cb(null, {
                emailDomain: match[2] + "." + match[3],
                emailDomainParts: [match[2], match[3]],
                emailSuffix: match[3]
            });
        }
            // emailDomain = email.substr(email.indexOf("@") + 1),
            // emailDomainParts = emailDomain.split('.'),
            // emailSuffix = emailDomainParts.slice(-2).join('.');
    }
};

module.exports = {
    failure: failure,
    success: success,
    parseEmail: parseEmail,
    getUtcDate: getUtcDate
};

