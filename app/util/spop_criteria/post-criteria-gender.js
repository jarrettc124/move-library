var async = require('async'),
    q = require('q'),
    _ = require('underscore'),
    fbGraphSDK = require('../facebook-graph-sdk');

/**
 * Adds the field necessary to filter criteria for facebook friends.
 **/
var plugin = function(schema, options) {
    console.log("Adding gender criteria");
    schema.add({ "gender": {type: String} });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(gender, posts, filterCallback) {
    if (!gender) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                if (gender == post.gender) {
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
    post.gender = params.gender;
    console.log("Should've set post gender to ", params.gender);
    cb(null, {
        post: post
    });
};

/**
 * A test to determine if the passed-in object has a criteria or not.
 **/
var hasCriteria = function(obj) {
    if (_.has(obj, "gender")) {
        return true;
    } else {
        return false;
    }
};

var create = function(post, cb) {
    if (post.criteria.hasOwnProperty('gender')) {
        post.gender = post.criteria.gender;
    }
    cb(null, post);
};

var getQuery = function(params, cb) {
    var access_token = params.access_token;
    new fbGraphSDK().me(access_token).then(function(userData) {
        console.log("Groups = ", userData);
        if (_.has(userData, 'error')) {
            cb(userData);
        } else {
            var returnQuery = {
                $or: [ 
                    {
                        gender: { $exists: false }  
                    },
                    {
                        gender: userData.gender
                    }
                ]
            };
            
            cb(null, returnQuery);
        };
    }, function(err) {
        cb(err);
    });

};

module.exports = {
    plugin: plugin,
    filter: filter,
    hasCriteria: hasCriteria,
    process: process,
    getQuery: getQuery,
    create: create
};