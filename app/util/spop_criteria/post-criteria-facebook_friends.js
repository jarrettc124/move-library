var async = require('async'),
    q = require('q'),
    _ = require('underscore'),
    fbGraphSDK = require('../facebook-graph-sdk'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

// to apply criteria
// 1) Find all posts that have the criteria field
// 2) check the user to make sure he / she matches the criteria.

/**
 * Adds the field necessary to filter criteria for facebook friends.
 **/
var plugin = function(schema, options) {
    // An array of Id's of the friends of the spop user that created the spop
    console.log("Adding facebook_friends criteria");
    schema.add({ facebook_friends: Mixed });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(facebookFriendIds, posts, filterCallback) {
    if (_.empty(facebookFriendIds)) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                var friends = _.intersection(facebookFriendIds, post.facebook_friends);
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
    console.log("owner = ", owner);
    if (params.facebook_friends) {
        // If facebook_friends is "true"
        new fbGraphSDK().myFriendsList(owner.accessToken).then(function(friendsList) {
            if (_.has(friendsList, 'error')) {
                cb(friendsList);
            } else {
                console.log("friendsList = ", friendsList);
                async.map(friendsList.data, function(friend, friendCallback) {
                     friendCallback(null, friend.id);
                }, function(err, friendIdArray) {
                    post.facebook_friends = friendIdArray;
                    cb(err, friendIdArray);
                });
            }
        }, function(err) {
            cb(err, {
                post: post
            });        
        });
    } else {
        cb(null, {
            post:post
        });
    }
}

/**
 * A test to determine if the passed-in object has a criteria or not.
 **/
var hasCriteria = function(obj) {
    if (_.has(obj, "facebook_friends")) {
        return true;
    } else {
        return false;
    }
};

var create = function(post, cb) {
    if (post.criteria.hasOwnProperty('facebook_friends')) {
        post.facebook_friends = post.criteria.facebook_friends;
    }
    cb(null, post);
};

var getQuery = function(params, cb) {
    var user = params.user;
    var access_token = params.access_token;
    // new fbGraphSDK().myFriendsList(access_token).then(function(friendsList) {
    //     if (_.has(friendsList, 'error')) {
    //         cb(friendsList);
    //     } else {
    //         console.log("friendsList = ", friendsList);
    //         async.map(friendsList.data, function(friend, friendCallback) {
    //              friendCallback(null, friend.id);
    //         }, function(err, friendIdArray) {
    
    // var queryFn = function() {
    //     return (this.criteria.hasOwnProperty('facebook_friends') && this.facebook_friends.contains(user._id)) 
    // };
    // cb(null, queryFn);
    
    var returnQuery = {
        $or: [ 
            {
                facebook_friends: { $exists: false }  
            },
            {
                facebook_friends: { $in: [user.facebookId] }
            }
        ]
    };
    console.log('friends return query: ',returnQuery);
    
    cb(null, returnQuery);
                // post.facebook_friends = friendIdArray;
                // cb(err, friendIdArray);
    //         });
    //     }
    // }, function(err) {
    //     cb(err);
    // });
}

module.exports = {
    plugin: plugin,
    filter: filter,
    hasCriteria: hasCriteria,
    process: process,
    getQuery: getQuery,
    create: create
};