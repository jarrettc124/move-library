var async = require('async'),
    q = require('q'),
    _ = require('underscore'),
    fbGraphSDK = require('../facebook-graph-sdk'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

/**
 * Adds the field necessary to filter criteria for facebook friends.
 **/
var plugin = function(schema, options) {
    // An array of Id's of the friends of the spop user that created the spop
    console.log("Adding phone_contacts criteria");
    schema.add({ phone_contacts: Mixed });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(phoneContacts, posts, filterCallback) {
    if (_.empty(phoneContacts)) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                var friends = _.intersection(phoneContacts, post.phoneContacts);
                if (!_.isEmpty(friends)) {
                    cb(true);
                } else {
                    cb(false);
                }
            }, 
            function(finalPosts){
                filterCallback(finalPosts);
                // res.send(util.success({"posts": finalPosts}));
            }
        );
    }
}

var process = function(post, params, owner, cb) {
    post.phone_contacts = params.phone_contacts;
    cb();
}

/**
 * A test to determine if the passed-in object has a criteria or not.
 **/
var hasCriteria = function(obj) {
    if (_.has(obj, "phone_contacts")) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    plugin: plugin,
    filter: filter,
    hasCriteria: hasCriteria,
    process: process
}