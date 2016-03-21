var User = require('../../models/User'),
    _ = require('underscore'),
    path = require("path"),
    Notification = require('../../models/Notification'),
    util = require('../../util/utils'),
	pushUtils = require('../../util/pushUtils'),
    q = require('q'),
    passwordUtils = require('../../util/passwordUtils'),
    fbGraphSDK = require('../../util/facebook-graph-sdk'),
    async = require('async'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    FacebookTokenStrategy = require('passport-facebook-token'),
    JwtStrategy = require('passport-jwt').Strategy,
    jwt = require('jsonwebtoken'), 
    config = require('../../config'),
    environment = config.environment,
    mandrill = require('mandrill-api/mandrill'),
    nodemailer = require('nodemailer'), 
    request = require('request'),
    crypto = require('crypto'),
    Like = require('../../models/Like');
    Point = require('../../util/point');

passport.use(
    new FacebookTokenStrategy({
            clientID: config[environment].facebook.clientID,
            clientSecret: config[environment].facebook.clientSecret,
            profileFields: config[environment].facebook.profileFields,
            callbackURL: 'http://localhost:3000/auth/facebook/callback'
        },
        function(accessToken, refreshToken, profile, done) {
        
            User.findOne({
                'facebookId': profile.id
            }).exec(function(err, user) {
                if (err) {
                    console.error("Unable to authenticate: ", err);
                }
                else {
                    if (!user) {
                        done(err, null);
                    }
                    else {
                        user.fbToken = accessToken;
                        user.universalToken = jwt.sign({"_id":user._id}, 'movett');
                        user.save(function(error) {
                            done(error, user);
                        });
                    }
                }
            });
        }
    )
);

var opts = {}
opts.secretOrKey = 'movett';
opts.algorithms = ["HS256"];
passport.use(
	new JwtStrategy(opts,
			function(jwt_payload, done) {			    

				User.findOne({"_id": jwt_payload._id}, function(err, user) {
					if (err) {
						done(err, false);
					}
					if (user) {
						done(null, user);
			
					} else {
						done(null, false);
					}
				});
		}
	)
);

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({$or:[{ 'username' : username },{"email":username}]}, function(err, user) {
		if (err) {
			console.error("Unable to authenticate: ", err);
			done(err, null);
		}
		else{
			if (!user) {
				done(err, null);
			}
			else{
			
			    if (user.password != password) {			    
        			done(err,null);
      			}
      			else{
                    done(err, user);
      			}
      
			}
		
		}
    });
  }
));

var api = {
    /**
     * Retrieve the user from the system.
     **/
    getUser: function(req, res, next) {
        var userId = req.param('userId');
        User.findOne({
                "_id": userId
            })
            .select('firstName lastName lastActive FBprofileLink')
            .exec(function(err, user) {
                if (!err) {
                    if (!user || user.status < 0) {
                        res.send(404, util.failure('User not found'));
                    }
                    else {
                        res.send(util.success(user));
                    }
                }
                else {
                    res.send(400, util.failure(err));
                }
            });
    },
    updateLocation: function(req, res, next) {
        var latitude = req.param('latitude'),
            longitude = req.param('longitude'),
            user = req.user;
        if (!_.isUndefined(user)) {
            if (!_.isUndefined(latitude) &&
                !_.isNull(latitude) &&
                !_.isUndefined(longitude) &&
                !_.isNull(longitude)
            ) {
//                 user.lastLocation.latitude = latitude;
//                 user.lastLocation.longitude = longitude;
                
                
                user.lastLocation = [longitude,latitude];

//                 console.log('This is last location ',latitude,' ',longitude,' ',user.lastLocation);
                
                
                user.save(function(err, user) {
				
					
					res.send(util.success({
						user: user
					}));
                    
                });
            }
            else {
                res.send(400, util.failure("Location is a required parameter"));
            }

        }
        else {
            res.send(404, util.failure("User was not found"));
        }
    },
    login: function(req, res, next) {
    
    	    console.log("Should hit the login method: ",req.user);
        
			var latitude = req.param('latitude'),
				longitude = req.param('longitude'),
				user = req.user;
			if (!_.isUndefined(user) && !_.isNull(user)) {
				if (!_.isUndefined(latitude) &&
					!_.isNull(latitude) &&
					!_.isUndefined(longitude) &&
					!_.isNull(longitude)
				) {

					user.lastLocation = [longitude,latitude];
				}

				/**
				 * Use UTC so time is universal.  Eliminates server / client time zone difference issues.
				 **/
				user.lastActive = util.getUtcDate();
				user.save(function(err, user) {		
					if (!err) {
					
						//Find Followers
						User.find({
							"following": req.user._id
						},{_id:1})
						.exec(function(err, users) {
// 							Notification.count({to: user._id}, function(err, c) {
// 							   user.numNotif = c;
							   user.followers = users;
							   res.send(util.success({
									user: user
								}));	
// 							});						
						});	
					}
				});
			}

    },
    signup: function(req, res, next) {
//     	console.log("signup: "+req.body['extId']);
//     	console.log("username1: "+req.param('username')+"username2: "+req.body["username"]);

    	if(!_.isUndefined(req.body['extId']) && !_.isNull(req.body['extId'])){
    		//Facebook Signup
			User.findOne({"facebookId": req.body['extId']}).exec(function(err, u) {
				if (err) {
					res.send(400, util.failure(err));
				} else if (!_.isUndefined(u) && !_.isNull(u)) {
					console.log("user found = ", u);
					res.send(util.success({
						user: u
					}));
				} else {
					var user = new User();
					user.firstName = req.param('firstName');
					user.lastName = req.param('lastName');
					user.displayName = user.firstName+' '+user.lastName;
					user.facebookId = req.param('extId');
					user.gender = req.param('gender');
					user.username = req.param('username');
					user.profileImageUrl = req.param('profileImageUrl');
					user.imageUrl = req.param('imageUrl');
					user.profileLink = req.param('profileLink');
					user.email = req.param('email');
					user.fbToken = req.param('fbToken');
					user.password = req.param('password');
					user.biography = req.param('biography');
					user.following = [];
					user.followers =[];
					user.blacklist =[];
					user.universalToken = jwt.sign({"_id":user._id}, 'movett');
					user.save(function(err, u) {
						console.log('inside of user save');
						if (!err) {
							if (!u) {
								console.log("400 error: no user was created");
								res.send(400, util.failure("Unable to create user: no user was created"));
							}
							else {
								
								res.send(util.success({
									user: u
								}));
							}
							
						} else {
							res.send(400, util.failure(err));
						}
					});

				}
			});
    	}
    	else if(!_.isUndefined(req.param('username')) && !_.isNull(req.param('username'))){
    	    
    		User.findOne({"username": req.param('username')}).exec(function(err, u) {
    	
				if (err) {
					res.send(400, util.failure(err));
				} else if (!_.isUndefined(u) && !_.isNull(u)) {
					res.send(430, util.failure('User already created'));

				} else {
				
					var user = new User();
					user.username = req.param('username');
					user.email = req.param('email');
					user.password = req.param('password');
					user.profileImageUrl = req.param('profileImageUrl');
					user.imageUrl = req.param('imageUrl');
					user.firstName = req.param('firstName');
					user.lastName = req.param('lastName');
	                user.displayName = user.firstName+' '+user.lastName;
					user.gender = req.param('gender');
					user.email = req.param('email');
					user.biography = req.param('biography');
					user.following = [];
					user.followers =[];
					user.blacklist =[];
					user.universalToken = jwt.sign({"_id":user._id}, 'movett');
					user.save(function(err, u) {
						console.log('inside of user saved');
						if (!err) {
							if (!u) {
// 								console.log("400 error: no user was created");
								res.send(400, util.failure("Unable to create user: no user was created"));
							}
							else {
								res.send(util.success({
									user: u
								}));
							}
						} else {
							res.send(400, util.failure(err));
						}
					});

				}
			});
				
    	}else{
			res.send(400, util.failure(err));

    	}
    },
    update: function(req, res, next) {
        var user = req.user;
        
		if(	!_.isNull(req.param('groupChat')) &&
    		!_.isUndefined(req.param('groupChat'))&&
            !_.isNull(req.param('privateChat')) &&
            !_.isUndefined(req.param('privateChat')) &&
            !_.isNull(req.param('notificationAllOff')) &&
            !_.isUndefined(req.param('notificationAllOff'))
            ){            
            
            
		    user.notifications.groupChat = req.param('groupChat');
        	user.notifications.privateChat = req.param('privateChat');
        	user.notifications.notificationAllOff = req.param('notificationAllOff');
        	
		}else if(!_.isNull(req.param('facebookFollow')) &&
    			!_.isUndefined(req.param('facebookFollow'))
        ){
        	console.log('Update Facebook');
			user.privacy.allowFacebookFollow = req.param('facebookFollow');
		
		}else if(
			!_.isNull(req.param('everyone')) &&
    		!_.isUndefined(req.param('everyone')) &&
            !_.isNull(req.param('followers')) &&
            !_.isUndefined(req.param('followers')) &&
            !_.isNull(req.param('nobody')) &&
            !_.isUndefined(req.param('nobody'))
            ){
    		console.log('Update Privacy');
			user.privacy.everyone = req.param('everyone');
			user.privacy.followers = req.param('followers');
			user.privacy.nobody = req.param('nobody');
    	}
        
        user.lastActive = util.getUtcDate();
		user.save(function (err, user) {
			if (!err) {
				if (!user) {
					res.send(500, util.failure("Unable to save"));
				}
				else {
					res.send(util.success({
						user: user
					}));
				}
			}
			else {
				res.send(500, util.failure("Unable to update"));
			}
		});

    },
    notifications: function(req, res, next) {
            var user = req.user;
            if (
                _.isNull(req.param('deviceToken')) ||
                _.isUndefined(req.param('deviceToken')) ||
                _.isNull(req.param('deviceType')) ||
            _.isUndefined(req.param('deviceType'))
        ) {
            res.send(400, util.failure("Device Token and Device Type are required"));
        }
        else {
            user.deviceToken = req.param('deviceToken');
            user.deviceType = req.param('deviceType');
            user.save(function(err, user) {
                if (!err) {
                    if (!user) {
                        res.send(404, util.failure("User not found"));
                    }
                    else {
                        res.send(util.success({
                            user: user
                        }));
                        /**
                         * Notifications can also be sent from here.
                         **/
                    }
                }
                else {
                    res.send(400, util.failure("Unable to update device token: " + err));
                }
            });
        }
    },
	userFromUT: function(req, res, next){
// 	    Notification.count({to: req.user._id}, function(err, c) {
//            req.user.numNotif = c;
    
           	//Find Followers
			User.find({
				"following": req.user._id
			},{_id:1})
			.exec(function(err, users) {
				req.user.followers = users;
				res.send(util.success({
					user: req.user
				}));	
			});
           
//       	});
	},
	changePassword: function(req,res,next){
		if (!_.isUndefined(req.param('newhashpass')) &&
			!_.isNull(req.param('newhashpass')) &&
			!_.isUndefined(req.param('oldhashpass')) &&
			!_.isNull(req.param('oldhashpass')) 
		) {
    		if(req.param('oldhashpass') == req.user.password){
    			req.user.password = req.param('newhashpass');
    			req.user.save(function(err, user) {
					if (!err) {
						res.send(util.success({
						}));
					}
					else{
					    res.send(401, util.failure("Your new password did not save"));
					}
				});
    		}else{
    		    res.send(401, util.failure("Your current password is invalid"));
    		}

    	}else{
    	   res.send(401, util.failure("Need old and new password"));
    	}
    },
    auto: function(req, res, next) {
//     	User.find( { firstName: /^J/ }).exec(function(err, users) {
//     	                res.send(users);
//     	});
// 		new RegExp('^'+name+'$', "i")
// 		console.time("dbsearch");
		var q = unescape(req.param('q'));
		var re = new RegExp('^'+q+'.*','i' );
		
    	User.find( {$or:[ { displayName: re}, { username: re}]}, { _id : 1,displayName:1,username:1,profileImageUrl:1,firstName:1,lastName:1 } ).limit(7).lean().exec(function(err, users) {
//     		console.timeEnd("dbsearch");
    	    res.send(users);
    	});
		
    },
    unFollowUser: function(req, res, next){

        if (
                _.isNull(req.param('unFollowUserID')) ||
                _.isUndefined(req.param('unFollowUserID'))
        ) {
            res.send(400, util.failure("unFollowUserID is required"));
        }
        else {
        	
        	var otherUserId = req.param('unFollowUserID');
        	User.findOne({
                "_id": otherUserId
            })
            .select('followers firstName lastName')
            .exec(function(err, user) {
                if (!err) {
                    if (!user) {
                        res.send(404, util.failure('User not found'));
                    }
                    else {
                                        
                    	if(	!user.followers){
                    		user.followers = [];
                    	}
                    	
                    	if(!req.user.following){
                    	    req.user.following = [];
                    	}
											
						var i = user.followers.indexOf(req.user._id);					
						var j = req.user.following.indexOf(user._id);
											                    	
											                    	
                    	if((i != -1) || (j != -1)) {
// 							 user.requested.splice(i, 1);
// 							 res.send(404, util.failure("Already added"));
							 user.followers.splice(i,1);							 
							 user.save(function(err, user) {
								if(err){
									res.send(404, util.failure('User not found'));

								}else{			
									req.user.following.splice(j,1);					
									req.user.save(function(err,myuser){
										if(err){
											res.send(404, util.failure('User not found'));

										}else{
											res.send(util.success({
												user: myuser
											}));
											
											
										}
									
									});
							
								}
							
							});
							 
						}
						else{
                        res.send(404, util.failure('User not found'));

						}
	
						                          
                    }
                }
                else {
                    res.send(400, util.failure(err));
                }
            });   	
        }
    },
    followUser: function(req, res, next){
    	if (
                _.isNull(req.param('followUserID')) ||
                _.isUndefined(req.param('followUserID'))
        ) {
            res.send(400, util.failure("followUserID is required"));
        }
        else {
        	
        	var otherUserId = req.param('followUserID');
        	User.findOne({
                "_id": otherUserId
            })
            .select('followers firstName lastName')
            .exec(function(err, user) {
                if (!err) {
                    if (!user) {

                        res.send(404, util.failure('User not found'));
                    }
                    else {
                    	if(	!user.followers){
                    		user.followers = [];
                    	}
                    	
                    	if(!req.user.following){
                    	    req.user.following = [];
                    	}
											
						var i = user.followers.indexOf(req.user._id);					
						var j = req.user.following.indexOf(user._id);
											                    	
											                    	
                    	if((i != -1) || (j != -1)) {
// 							 user.requested.splice(i, 1);
							 res.send(500, util.failure("Already added"));
						}
						else{
							user.save(function(err, user) {
								req.user.following.push(user._id);
								req.user.save(function(err,myuser){

									if (!err) {
										if (!myuser) {
											res.send(404, util.failure("User not found"));
										}
										else {
									
											var message = req.user.username+" started following you";				
											var notification = new Notification({ message: message,to: [user._id],type:"follow",user:req.user});
											notification.save(function(err){
												if(!err){
												
													pushUtils.sendSingleNotification(user._id,{'alert':message},{"type":"follow"}, function(err){

														if(err){
															console.log('Push did not send'+message);
														}
														else{
														}
													});			
												}
											});
										
											res.send(util.success({
												user: myuser
											}));

										}
									}
									else {
										res.send(400, util.failure("Unable send request: " + err));
									}
							
								});
							
							});
						
						}
	
						                          
                    }
                }
                else {
                    res.send(400, util.failure(err));
                }
            });   	
        }
    },
    allMyUsers: function(req, res, next){
    
		User.find({ $or:[{"_id": { "$in" : req.user.following}},{"following": req.user._id}]}
		)
		.exec(function(err, users) {
			if (!err) {		
			
				res.send(util.success({
					user: users
				}));
    		}else{
    		    res.send(400, util.failure(err));
    		}
    	});
    
    },
    getNotifications : function(req, res, next) {
    	
    	Notification.find()
        .where('to').in([req.user._id]).sort( { _id : -1 } )
        .limit(10)
        .populate('user')
        .lean()
		.exec(function(err, notifications) {
		
			if (!err) {
					
					if(req.user.numNotif){
					
						req.user.numNotif = undefined;
						req.user.save(function(err) {	
						});
						
					}
					
					res.send(util.success({
						 notifications: notifications
					}));
			}
			else{
					res.send(404, util.failure("Could not get notifications"));
			}
		
		});
    
    
    },
    linkFacebook: function(req,res,next){
    	var user = req.user;

		if (!_.isUndefined(req.param('extId')) &&
			!_.isNull(req.param('extId')) 
		) {
					
			User.findOne({
				'facebookId': req.param('extId')
			}).exec(function(err, userDuplicate) {
				if (err) {
					res.send(500, util.failure("Unable to find"));
				}
				else {
					if (userDuplicate) {
					
						userDuplicate.facebookId = undefined;
						userDuplicate.fbToken = undefined;
						userDuplicate.save(function(error) {});
					
					}
	
					user.fbToken = req.param('fbToken');
					user.facebookId = req.param('extId');
					user.save(function(err, u) {
			
						if (!err) {
							if (!u) {
								res.send(400, util.failure("Unable to create user: no user was created"));
							}
							else {
								res.send(util.success({
									user: u
								}));
							}
						} else {
							res.send(400, util.failure(err));
						}
		
					});
				
				}
			});
		}else{
			user.fbToken = undefined;;
			user.facebookId = undefined;;
			user.save(function(err, u) {
	
				if (!err) {
					if (!u) {
						res.send(400, util.failure("Unable to create user: no user was created"));
					}
					else {
						res.send(util.success({
							user: u
						}));
					}
				} else {
					res.send(400, util.failure(err));
				}

			});
		
		}	
    },
    blacklistManager: function(req,res,next){
    	
    	if (!_.isUndefined(req.param('verb')) &&
			!_.isNull(req.param('verb')) 
		) {
			var userIdToAdd = req.param('userIdToAdd');
			var verb = req.param('verb');
			var blacklist = req.user.blacklist || [];

			if(verb == 'add'){
			
				User.findOne({
					'_id': req.param('userIdToAdd')
				}).exec(function(err, userToAdd) {
					
					//
					var j = userToAdd.following.indexOf(req.user._id);
					if(j!=-1){
						userToAdd.following.splice(j,1);
						userToAdd.save(function(err, userToAdd) {});
					}
					
					blacklist.push(userIdToAdd);
					var i = req.user.following.indexOf(userIdToAdd);
					console.log('blacklist '+blacklist +': '+req.user.following);
					
					if(i != -1){
						req.user.following.splice(i,1);
						console.log('after following: '+req.user.following);

					}
					
					req.user.blacklist = blacklist;
					console.log('after blacklist: '+req.user.blacklist);

					req.user.save(function(err, u) {
						console.log('after save');

						if(!err){
							res.send(util.success({
								blacklist: u.blacklist
							}));
						}
					});
					
				});					
			}else if(verb == 'delete'){
			
				var i = blacklist.indexOf(userIdToAdd);
				if(i != -1){
					blacklist.splice(i,1);
				}
				
				req.user.blacklist = blacklist;
				console.log('after blacklist: '+req.user.following);

				req.user.save(function(err, u) {
					console.log('after save');

					if(!err){
						res.send(util.success({
							blacklist: u.blacklist
						}));
					}
				});
			}
		

		}else{
			res.send(600, util.failure("Missing parameter"));
		}
    },
    getblacklist: function(req,res,next){
		var options = {
			path: 'blacklist',
			model:'User',
			select:'firstName lastName profileImageUrl username biography following displayName privacy'
		}
		
		User.populate(req.user, options, function (err, user)
		{
			res.send(util.success({
				blacklist: user.blacklist
			}));
		});
	},
	userValidation: function(req,res,next){
		
		User.count({username: req.param('username')}, function(err, c) {
			if(err){
				res.send(400, util.failure("Count error"));
			}else{
				var isTakenBool = true;
			
				if(c<1){
					isTakenBool = false;
				}
			
				res.send({isTaken:isTakenBool});
			}
		
		});
	},
	emailValidation: function(req,res,next){
		User.count({email: req.param('email')}, function(err, c) {
			if(err){
				res.send(400, util.failure("Count error"));
			}else{
				var isTakenBool = true;
			
				if(c<1){
					isTakenBool = false;
				}
			
				res.send({isTaken:isTakenBool});
			}
		
		});
	},
	forgotPassword: function(req,res,next){
		User.findOne({
			'email': req.param('email')
		}).exec(function(err, user) {
			if(user){
				var token = jwt.sign({"_id":user._id}, 'movett');
				var smtpTransport = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
					  user: 'freakybananainc@gmail.com',
					  pass: '1Wdvhi00'
					}
				  });
				  var mailOptions = {
					to: user.email,
					from: 'Freaky Banana Inc. <freakybananainc@gmail.com>',
					subject: 'Movett Password Reset',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					  'Please click on the following link (This email will expire in 1 hour for security reasons):\n\n' +
					  'http://' + req.headers.host + '/v1.0/user/resetpass/' + token + '\n\n' +
					  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				  };
				  smtpTransport.sendMail(mailOptions, function(err) {
						
						if(err){
							console.log(err);
							res.send(500, util.failure('Not found'));	
						}
						else{
							res.send(util.success({
								email:'sent'
							}));	
						}				
				  });
			
			
			}else{
				res.send(500, util.failure('Not found'));	
			}
		});
	},
	resetPassword: function(req,res,next){
		
		var token = req.param('token');

		jwt.verify(token, 'movett', function(err, decoded) {
			if (err) {
				console.error("Unable to authenticate: ", err);
			}else{
				console.log(decoded._id) // bar
			
				User.findOne({
					'_id': decoded._id
				}).exec(function(err, user) {
					if(err){
						
					}
					else{
						if(user){		
							var passHash = crypto.createHash('sha256').update(req.param('password')).digest('hex');
							user.password = passHash;
							user.save(function(err, u) {
								console.log('after save');

								if(err){
									console.log(err);

									res.render(path.join(__dirname, '../../passviews/reset'), {
									  user: user
									});
								}else{
									if(user){
										console.log('success');
										
										res.render(path.join(__dirname, '../../passviews/done'), {
										  user: user
										});

									}
								}
							});
						}
					}
				});
		
			}
		
		});
	},
	resetView: function(req,res,next){
		var token = req.param('token');
		console.log('tokenis '+token);
		jwt.verify(token, 'movett', function(err, decoded) {
		        
			if (err) {
				console.error("Unable to authenticate: ", err);
			}else{
				console.log(decoded._id) // bar
			
				User.findOne({
					'_id': decoded._id
				}).exec(function(err, user) {
					if(err){
				
					}
					else{
						res.render(path.join(__dirname, '../../passviews/reset'), {
						  user: user
						});
					}
				});
		
			}
		
		});
	},
	getFollowingOrFollowers: function(req,res,next){
		
		User.findOne({
			'_id': req.param('userId')
		}).exec(function(err, user) {
			if (err) {
    		    res.send(405, util.failure('Unable to find users'));
			}
			else {
				if (!user) {
    		    	res.send(405, util.failure('Unable to find users'));
				}
				else {
					var type = req.param('type');
					var query;
					if(type == 'followers'){
						query = {"following": user._id};

					}else if(type == 'following'){
						query = {"_id": { "$in" : user.following}};

					}else{
						query = { $or:[{"_id": { "$in" : user.following}},{"following": user._id}]};
					}
		
					User.find(query)
					.exec(function(err, users) {
						if (!err) {		
							res.send(util.success({
								user: users
							}));
						}else{
							res.send(400, util.failure(err));
						}
					});									
					
				}
			}
		});
		
	}
};

module.exports = {
    routes: [{
        method: api.getUser,
        verb: 'get',
        route: '/user/:userId',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.signup,
        verb: 'post',
        route: '/user/signup'
    }, {
        method: api.updateLocation,
        verb: 'post',
        route: '/user/location',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.login,
        verb: 'post',
        route: '/user/usernamelogin',
        middleware: [
            passport.authenticate('local', {
                session: false
            }),
        ]
    }, {
        method: api.login,
        verb: 'post',
        route: '/user/facebooklogin',
        middleware: [
            passport.authenticate('facebook-token', {
                session: false
            }),
        ]
    }, {
        method: api.update,
        verb: 'post',
        route: '/user/update',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.notifications,
        verb: 'post',
        route: '/user/notifications',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
    
        method: api.userFromUT,
        verb: 'post',
        route: '/user',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
        method: api.auto,
        verb: 'get',
        route: '/auto'    
    }, {
    	method: api.followUser,
    	verb: 'post',
    	route: '/user/followuser',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    	method: api.unFollowUser,
    	verb: 'post',
    	route: '/user/unfollowuser',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    
        method: api.allMyUsers,
        verb: 'post',
        route: '/user/allmyusers',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    
        method: api.getNotifications,
        verb: 'post',
        route: '/user/getNotifications',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    	method: api.changePassword,
    	verb: 'post',
    	route: '/user/changepass',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    	method: api.linkFacebook,
    	verb: 'post',
    	route: '/user/linkfacebook',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]  
    }, {
    	method: api.blacklistManager,
        verb: 'post',
    	route: '/user/blacklistmanager',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ] 
    
    }, {
    	method: api.getblacklist,
        verb: 'post',
    	route: '/user/getblacklist',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ] 
    
    }, {
    	method: api.emailValidation,
        verb: 'get',
    	route: '/emailvalidation'
    }, {
    	method: api.userValidation,
        verb: 'get',
    	route: '/uservalidation'
    }, {
    	method: api.forgotPassword,
        verb: 'post',
    	route: '/user/forgot'
    }, {     
        method: api.resetPassword,
        verb: 'post',
    	route: '/user/resetpass/:token'
    }, {     
        method: api.resetView,
        verb: 'get',
    	route: '/user/resetpass/:token'
    }, {     
        method: api.getFollowingOrFollowers,
        verb: 'post',
    	route: '/user/getfollowingorfollowers'
    }
    
]
};

//   app.get('/user/:userId', passport.authenticate('facebook-token', {session: false}), users.getUser);
//   app.get('/user/:userId/picture', passport.authenticate('facebook-token', {session: false}), users.getUserPicture);
//   app.post('/user/signup', users.createUser);
//   app.post('/user/location', passport.authenticate('facebook-token', {session: false}), users.updateLocation);
//   app.post('/user/login', passport.authenticate('facebook-token', {session: false}), users.loginUser);
//   app.post('/user/verify', passport.authenticate('facebook-token', {session: false}), users.verifyEmail);
//   app.post('/user/update', passport.authenticate('facebook-token', {session: false}), users.updateUserInfo);
//   app.post('/user/notifications', passport.authenticate('facebook-token', {session: false}), users.setUserDeviceToken);
