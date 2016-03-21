var User = require('../models/User'),
    http = require('http'),
    querystring = require('querystring'),
    apn = require("apn");


function sendNotificationToPostSubscribers(postSubscribers,aps,body,fn) {		

		User.find({
			'_id': { $in: postSubscribers}
// 			'notifications.groupChat':true
			}).exec(function(err, docs){
				if(err){
					fn(err);
				}
				else{		
					var deviceTokenArray = [];
			
					for(var i =0; i< docs.length; i++){
						
						
						if (docs[i]['deviceType'] === "iOS") {
							var deviceToken = docs[i]['deviceToken'];
							if(deviceToken){

								var tokenDict;
								
								if(docs[i]['notifications']['notificationAllOff']){
									tokenDict = {'token':deviceToken,'pushEnabled':false};
								}else{
											
									if(body.type == 'private'){
										tokenDict = {'token':deviceToken,'pushEnabled':docs[i]['notifications']['privateChat']};
									}else if(body.type=='group'){
										tokenDict = {'token':deviceToken,'pushEnabled':docs[i]['notifications']['groupChat']};
									}else{
										tokenDict = {'token':deviceToken,'pushEnabled':true};
									}
								}
								deviceTokenArray.push(tokenDict);
							}
						}
					}
					
					sendNotification(deviceTokenArray,aps,body);  

					fn();
				}
		});

};

function sendSingleNotification(userId,aps,body,fn){

    User.findById(userId).exec(function(err, user) {
        if (err) {
            fn(err);
        } else if (!user) {
            fn("No user found");
        } else {
        
			if (user.deviceType === "iOS") {
			  if(user.deviceToken) {
			  
			  	var devArray = [];
			  	
    			devArray.push({'token':user.deviceToken,'pushEnabled':!user['notifications']['notificationAllOff']});
				sendNotification(devArray,aps,body);  
				  
				fn();
			  }
			} else {
				fn("User device type not supported");   
			}      
          
        }
    });

};


function addNotificationCount(userId){

    User.findById(userId).select('numNotif').exec(function(err, user) {
		
		if (user) {
			user.numNotif = user.numNotif+1;
			user.save(function(err, user) {
			});
		}
    });
}


function sendNotification(deviceTokenArray,aps,body){

//     	var jsonDevArray = JSON.stringify(deviceTokenArray);
//     	var jsonBody = JSON.stringify(body);
//     	var jsonAps = JSON.stringify(aps);
// 		    	    	
// 		var post_data = querystring.stringify({
// 		  'deviceTokenArray' : jsonDevArray,
// 		  'aps': jsonAps,
// 		  'body': jsonBody
// 		});
		
		
		var path = require('path');
		
    	var options = {
		   key : path.join(__dirname, '/movettProdKey.pem'),
		   cert : path.join(__dirname, '/movettProdCert.pem'),
		   passphrase: "movett"
		};
 
		var connection = new apn.Connection(options);
 
 		var i=0;

 		for(i =0;i< deviceTokenArray.length;i++){
 			if(deviceTokenArray[i]["pushEnabled"]==true){

				var notification = new apn.Notification();
		
				notification.alert = aps["alert"];
				notification.sound = aps["sound"];
				notification.payload = body;
				connection.pushNotification(notification,deviceTokenArray[0]["token"]);
			}
 		}

    	
//     	console.log("post data "+post_data);
    	
//     	var options = {
// 		  host: 'www.pixelandprocessor.com',
// 		  path: '/movett/push/dev/devpush.php',
// 		  method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/x-www-form-urlencoded',
// 				'Content-Length': Buffer.byteLength(post_data)
// 			}
// 		};
// 		
// 		
// 		var httpreq = http.request(options, function(res) {
// 
// 		  res.setEncoding('utf8');
// 		  res.on('data', function(chunk) {
// 			console.log('Response: ' + chunk);
// 		  });
// 		  res.on('end', function() {
// 			console.log('done');
// 		  });
// 		  		  
// 		});
// 
// 		httpreq.write(post_data);
// 		httpreq.end();
};

function sendNotificationToFriendsWithAccessToken(at,post,message,cb){

    
	var point = {
		type: "Point",
		coordinates: post.location
	};



	new fbGraphSDK().myFriendsList(at).then(function(friendsList) {
	
		console.log('friendslist: ',friendsList);
	
		if (_.has(friendsList, 'error')) {
		
			console.log(friendsList);
			cb('Cant send notification with access token');
			
		} else {
			
			async.map(friendsList.data, function(friend, friendCallback) {
				 
				 friendCallback(null, friend.id);
				 
				 
				 
			}, function(err, friendIdArray) {
				 
				 
				var query = {
					'facebookId': { $in: friendIdArray},
					'deviceToken': { $exists: true }
				}; 
				console.log('the radius is: ',post.radius);
				var radiusOfPost = Number(post.radius)/1000;
				 
				//max distance in km
				var queryParams = {
					spherical: true,
					query: query,
					maxDistance: radiusOfPost / 6378.137,
					distanceMultiplier: 6378.137 //before 6378137 radians to meters. (The radius of the Earth is approximately 3,959 miles or 6,371 kilometers.)
				};
				 
				 
				 User.geoNear(point, queryParams, function(err, results, stats) { 
					
					async.map(results, function(deviceUser,callback){
					
						callback(null,deviceUser.obj.deviceToken);
						
					}, function(err, deviceTokenArray){
						
						console.log(deviceTokenArray);
						sendNotification(deviceTokenArray,message);	
						cb('success');


					});
				 
				 });

			});
		}
	}, function(err) {
		res.send(err);

	});


};

function sendNotificationToALLFriendsWithAccessToken(at,message,cb){

    
	new fbGraphSDK().myFriendsList(at).then(function(friendsList) {
	
	
		if (_.has(friendsList, 'error')) {
		
			cb('Cant send notification with access token');
			
		} else {
			
			async.map(friendsList.data, function(friend, friendCallback) {
				 
				 friendCallback(null, friend.id);
				 
				 
				 
			}, function(err, friendIdArray) {
				
				 
				User.find({
				
					'facebookId': { $in: friendIdArray},
					'deviceToken': { $exists: true }
				

				}).exec(function(err, docs){
				
					async.map(docs, function(deviceUser,callback){
					
						callback(null,deviceUser.deviceToken);
						
					}, function(err, deviceTokenArray){
						
						console.log('to all friends',deviceTokenArray);
						sendNotification(deviceTokenArray,message);	
						cb('success');


					});
					
				});
				 
				 
				 
				
			});
		}
	}, function(err) {
		res.send(err);

	});
};

module.exports = {
  'sendSingleNotification':sendSingleNotification,
  'sendNotificationToPostSubscribers':sendNotificationToPostSubscribers
};
