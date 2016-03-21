/**
 * Run this test using the MOCHA test runner (or something similar).
 **/
 
 /**
 * Test cases for the facebook API
 **/
var fbGraphSDK = require('../lib/fbGraphSdk'),
    assert = require('assert'),
    _ = require('underscore'),
    sutil = require('util');

var testAccessToken = 'CAAU9UStdZAwoBAMQePhxodZCPwqGTlelCJs1TKV0jmaDDAT1JFWLld8L72ZAs3VAYlPX48CFdN5gwZBvgLFkwZAkVyNOLcYeEHumIqKHFoZA39kGMmAo0Ya9ieh6MdunqJ7WHUi5oZCZA5qaWioZCBLZCGlGeJbIpEwyLpuV8DBgHaSCdZB9qZA1bSRuVhgBKkNC3IS7dprB5f4bsKdakmedKVZBK754NzIyVvjYZD'

describe('fbGraphSDK', function() {
    it('should instantiate', function(done) {
        assert.doesNotThrow(function() {
            var fb = new fbGraphSDK();
            done();
        })
    });
    
    describe('#me', function() {
        it('should allow for getting my profile', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                // searchSpec.storeName = "men";
                new fbGraphSDK().me(testAccessToken).then(function(userData) {
                    if (_.has(userData, 'error')) {
                        done(new Error(userData.error.message));
                    } else {
                        console.log(userData);
                        done();
                    }
                }, function(err) {
                    console.log("Getting user data failed", err);
                    console.log("Did you forget to generate a new access token?")
                    done(new Error(err));
                })
            })
        })
    })
    
    describe('#myFriendsList', function() {
        it('should allow for getting my friends list', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                // searchSpec.storeName = "men";
                new fbGraphSDK().myFriendsList(testAccessToken).then(function(friendsList) {
                    console.log("Friends list = ", friendsList);
                    if (_.has(friendsList, 'error')) {
                        done(new Error(friendsList.error.message));
                    } else {
                        done();
                    }
                }, function(err) {
                    console.log("Getting user data failed", err);
                    console.log("Did you forget to generate a new access token?")
                    done(new Error(err));
                })
            })
        })
    })
    
    
        describe('#myEducation', function() {
        it('should allow for getting my groups', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                // searchSpec.storeName = "men";
                new fbGraphSDK().myEducation(testAccessToken).then(function(groups) {
                    console.log("Education = ", sutil.inspect(groups, { showHidden: true, depth: null }));
                    if (_.has(groups, 'error')) {
                        done(new Error(groups.error.message));
                    } else {
                        done();
                    }
                }, function(err) {
                    console.log("Getting user data failed", err);
                    console.log("Did you forget to generate a new access token?")
                    done(new Error(err));
                })
            })
        })
    })

    describe('#myGroups', function() {
        it('should allow for getting my groups', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                // searchSpec.storeName = "men";
                new fbGraphSDK().myGroups(testAccessToken).then(function(groups) {
                    console.log("Groups = ", groups);
                    if (_.has(groups, 'error')) {
                        done(new Error(groups.error.message));
                    } else {
                        done();
                    }
                }, function(err) {
                    console.log("Getting user data failed", err);
                    console.log("Did you forget to generate a new access token?")
                    done(new Error(err));
                })
            })
        })
    })
    
    
    describe('#userFriendsList', function() {
        it('should allow for getting another users friends', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                // searchSpec.storeName = "men";
                var testUser = '847190203';
                new fbGraphSDK().userFriendsList(testAccessToken, testUser).then(function(friendsList) {
                    console.log("friends of 10801767 = ", friendsList);
                    if (_.has(friendsList, 'error')) {
                        done(new Error(friendsList.error.message));
                    } else {
                        done();
                    }
                }, function(err) {
                    console.log("Getting user data failed", err);
                    console.log("Did you forget to generate a new access token?")
                    done(new Error(err));
                })
            })
        })
    })
    
    describe('#validateUser', function() {
        it('should verify that an access token is valid for the specified user', function(done) {
            this.timeout(5000);
            assert.doesNotThrow(function() {
                var testUserId = '847190203';
                new fbGraphSDK().authenticateUser(testAccessToken, testUserId).then(function(userData) {
                    // If valid, returns the user info for the specified user.
                    done();
                }, function(err) {
                    done(new Error(err));
                })
            })
        });
    })


});
