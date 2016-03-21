/**
 * The fbGraphSdk is used to access the Facebook Graph API.
 **/

var qs = require('querystring'),
    Q = require('q'),
    https = require('https');

 // https://graph.facebook.com/v2.0/me?method=GET&format=json&suppress_http_code=1&access_token=CAACEdEose0cBAOXH0LafcZCep6GS5ZCLViw4O8NEd4wk7YDtKKiMNHZATkNky3hzF6rzq8qCk2Xn4j7WFRI0gRuelcxYBPX4mbwDqpVHOHOhsBLk83Y0qwrtOxam6duyUwE71uQsLP8t7v4jgrsBNQ6jZCyMpBePCnjZCT7GL2VMrzEJcKiUZBmY8g7fsZCvxn1HH8D2NvElAZDZD
var FacebookSDK = function(config) {
    var HOST = 'graph.facebook.com';
    var VERSION = 'v2.1';
    
    this.getVersion = function() {
        return VERSION;
    }
    
    this.getHost = function() {
        return HOST;
    }
    
    /**
     * @private
     * Builds a path with the target and endpoint (assuming the endpoint exists);
     **/
    this.getPath = function(endpoint) {
        if (endpoint) {
            return '/' + VERSION + '/' + endpoint;
        } else {
            return '/' + VERSION + '/';
        }
    }
    
    /**
     * @private
     * Make a request to an API using the api key, target, endpoint,
     * and any parameters that may be needed.
     **/
    this.makeRequest = function(endpoint, params, rawpath) {
        params = params || {};
        params.method = 'GET';
        params.format = 'json';
        params.suppress_http_code = 1;
        var path = "";
        if (rawpath) {
            path = rawpath;
        } else {
            path = this.getPath(endpoint);
        }
        var reqDefer = Q.defer();
        var error = false;
        path = path + "?" + qs.stringify(params);
        var options = {
            host: HOST,
            port: 443,
            path: path,
            method: 'GET'
        };
        var req = https.request(options, function(res) {
            var data = "";
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                if (error) {
                    reqDefer.reject(data);
                } else {
                    reqDefer.resolve(data);
                }
            })
        });
        req.on('response', function(message) {
            if (message.statusCode !== 200) {
                error = true;
            }
        })
        req.end();
        req.on('error', function(err) {
            console.error(err);
            reqDefer.reject(err);
        })
        return reqDefer.promise;
    }
}

/**
 * Get the user details for the user attached to the specified access token.
 * @param accessToken the access token for the user.
 * @return <promise> a promise that resolves when the call is complete.
 **/
FacebookSDK.prototype.me = function(accessToken) {
    var getMyDataDefer = Q.defer();
    var endpoint = 'me';
    this.makeRequest(endpoint, {"access_token": accessToken}).then(function(returnObj) {
        getMyDataDefer.resolve(JSON.parse(returnObj));
    }, function(err) {
        console.log(err);
        getMyDataDefer.reject(err);
    })
    return getMyDataDefer.promise;
}

/**
 * Get the number of friends a user has (by user number)
 **/
 FacebookSDK.prototype.userFriendsList = function(accessToken, userId) {
     var getFlDefer = Q.defer();
     var endpoint = '' + userId + '/friends';
     this.makeRequest(endpoint, {"access_token": accessToken}).then(function(returnObj) {
         getFlDefer.resolve(JSON.parse(returnObj));
     }, function(err) {
         console.log(err);
         getFlDefer.reject(err);
     });
     return getFlDefer.promise;
 }

/**
 * Get my friends
 **/
 FacebookSDK.prototype.myFriendsList = function(accessToken) {
     var getFlDefer = Q.defer();
     var endpoint = 'me/friends';
     this.makeRequest(endpoint, {"access_token": accessToken}).then(function(returnObj) {
         getFlDefer.resolve(JSON.parse(returnObj));
     }, function(err) {
         console.log(err);
         getFlDefer.reject(err);
     });
     return getFlDefer.promise;
 }
 
 /**
 * Get my friends
 **/
 FacebookSDK.prototype.myGroups = function(accessToken) {
     var getFlDefer = Q.defer();
     var endpoint = 'me/groups';
     this.makeRequest(endpoint, {"access_token": accessToken}).then(function(returnObj) {
         getFlDefer.resolve(JSON.parse(returnObj));
     }, function(err) {
         console.log(err);
         getFlDefer.reject(err);
     });
     return getFlDefer.promise;
 }

/**
 * Get the number of friends a user has (by user number)
 **/
 FacebookSDK.prototype.myEducation = function(accessToken, userId) {
     var getFlDefer = Q.defer();
     var endpoint = 'me';
     this.makeRequest(endpoint, {"fields": "education", "access_token": accessToken}).then(function(returnObj) {
         getFlDefer.resolve(JSON.parse(returnObj));
     }, function(err) {
         console.log(err);
         getFlDefer.reject(err);
     });
     return getFlDefer.promise;
 }

 
/**
 * Authenticate that the user with the specified access token is the same as the
 * user with the userId.
 * @param accessToken the access token of the user to be validated.
 * @param userId the user Id of the user to be validated.
 **/
 FacebookSDK.prototype.authenticateUser = function(accessToken, userId) {
     var authDefer = Q.defer();
     this.me(accessToken).then(function(userData) {
         if (userData.id == userId) {
             authDefer.resolve(userData);
         } else {
             authDefer.reject('User not authenticated');
         }
     }, function(err) {
         authDefer.reject(err);
     })
     return authDefer.promise;
 }


 module.exports = FacebookSDK;