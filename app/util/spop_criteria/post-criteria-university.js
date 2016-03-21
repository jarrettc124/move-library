var async = require('async'),
    q = require('q'),
    _ = require('underscore'),
    fbGraphSDK = require('../facebook-graph-sdk');

/**
 * Adds the field necessary to filter criteria for facebook friends.
 **/
var plugin = function(schema, options) {
    console.log("Adding university criteria");
    schema.add({ "university": {type: String} });
}

/** 
 * Filter the posts based on criteria.
 **/
var filter = function(university, posts, filterCallback) {
    if (!university) {
        filterCallback(posts);
    } else {
        async.filter(
            posts, 
            function(post, cb) {
                if (university == post.university) {
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
    post.university = params.university;
    console.log("Should've set post university to ", params.university);
    cb(null, {
        post: post
    });
};

/**
 * A test to determine if the passed-in object has a criteria or not.
 **/
var hasCriteria = function(obj) {
    if (_.has(obj, "university")) {
        return true;
    } else {
        return false;
    }
};

var create = function(post, cb) {
    if (post.criteria.hasOwnProperty('university')) {
        post.university = post.criteria.university;
    }
    cb(null, post);
};

var getQuery = function(params, cb) {
	
    var access_token = params.access_token;
    new fbGraphSDK().me(access_token).then(function(userData) {
        console.log("University Groups = ", userData);
        if (_.has(userData, 'error')) {
        	console.log("university inside");
            cb(userData);
        } else {
            console.log("university else",userData.education);
            
            if(!userData.education){
            	userData.education = [];
            };
            
            
            async.map(userData.education, function(item, schoolCallback) {
                 schoolCallback(null, item.school.id);
                 
            }, function(err, universityIdArray) {
                console.log("University ID array = ", universityIdArray);
                var returnQuery = {
                    $or: [ 
                        {
                            university: { $exists: false }  
                        },
                        {
                            university: { $in: universityIdArray }
                        }
                    ]
                };
                cb(err, returnQuery);
            });
        }
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