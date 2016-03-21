var async = require('async'),
    q = require('q'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    fbGraphSDK = require('../facebook-graph-sdk'),
    Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

/**
 * Adds the field necessary to filter criteria for facebook friends.
 **/
var plugin = function(schema, options) {
    console.log("Adding facebook_groups criteria");
    schema.add({ facebook_groups: Mixed });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(facebookGroupIds, posts, filterCallback) {
    if (_.empty(facebookGroupIds)) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                var groups = _.intersection(facebookGroupIds, post.facebook_groups);
                if (!_.isEmpty(groups)) {
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
};

var process = function(post, params, owner, cb) {
    console.log("owner = ", owner);
    post.facebook_groups = params.facebook_groups;
    // new fbGraphSDK().myGroups(owner.accessToken).then(function(groups) {
    //     console.log("Groups = ", groups);
    //     if (_.has(groups, 'error')) {
    //         cb(groups);
    //     } else {
    //         async.map(groups.data, function(item, groupCallback) {
    //             console.log("Group = ", item);
    //              groupCallback(null, item.id);
    //         }, function(err, groupIdArray) {
    //             post.facebook_groups = groupIdArray;
    //             cb(err, groupIdArray);
    //         });
    //     }
    // }, function(err) {
    //     cb(err);
    // });
    cb(null, {
        post: post
    });
};


/**
 * A test to determine if the passed-in object has a criteria or not.
 **/
var hasCriteria = function(obj) {
    if (_.has(obj, "facebook_groups")) {
        return true;
    } else {
        return false;
    }
}

var create = function(post, cb) {
    if (post.criteria.hasOwnProperty('facebook_groups')) {
        post.facebook_groups = post.criteria.facebook_groups;
    }
    cb(null, post);
};

var getQuery = function(params, cb) {
    var access_token = params.access_token;
    new fbGraphSDK().myGroups(access_token).then(function(groups) {
        console.log("Groups = ", groups);
        if (_.has(groups, 'error')) {
            cb(groups);
        } else {
            async.map(groups.data, function(item, groupCallback) {
                 groupCallback(null, item.id);
            }, function(err, groupIdArray) {
                var returnQuery = {
                    $or: [ 
                        {
                            facebook_groups: { $exists: false }  
                        },
                        {
                            facebook_groups: { $in: groupIdArray }
                        }
                    ]
                };
                cb(err, returnQuery);
            });
        }
    });
        // cb(null, returnQuery);
};

module.exports = {
    plugin: plugin,
    filter: filter,
    hasCriteria: hasCriteria,
    process: process,
    getQuery: getQuery,
    create: create
}