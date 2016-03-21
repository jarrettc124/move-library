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
    console.log("Adding university criteria");
    schema.add({ universities: Mixed });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(universityIds, posts, filterCallback) {
    if (_.empty(universityIds)) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                var universities = _.intersection(universityIds, post.universities);
                if (!_.isEmpty(universities)) {
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
    if (params.universities) {
        // If facebook_friends is "true"
        new fbGraphSDK().myEducation(owner.accessToken).then(function(schoolsList) {
            if (_.has(schoolsList, 'error')) {
                cb(schoolsList);
            } else {
                console.log("schoolsList = ", schoolsList);
                async.map(schoolsList.data, function(education, edCallback) {
                    if (education.school && education.type == "College") {
                        edCallback(null, education.school.id)
                    }
                }, function(err, schoolIdArray) {
                    post.universities = schoolIdArray;
                    cb(err, schoolIdArray);
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
    if (_.has(obj, "universities")) {
        return true;
    } else {
        return false;
    }
};

var create = function(post, cb) {
    if (post.criteria.hasOwnProperty('universities')) {
        post.universities = post.criteria.universities;
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
                universities: { $exists: false }  
            },
            {
                universities: { $in: [user.universities.toString()] }
            }
        ]
    };
    
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