/**
 * The POST controller contains all of the business logic for getting and creating
 * SPOP posts.  This contains all of the logic for spops and routes for getting
 * and creating them.
 **/
var Post = require('../../models/Post'),
    User = require('../../models/User'),
    Like = require('../../models/Like'),
    querystring = require('querystring'),
    Comment = require('../../models/Comment'),
    Notification = require('../../models/Notification'),
    _ = require('underscore'),
    passport = require('passport'),
    util = require('../../util/utils'),
    pushUtils = require('../../util/pushUtils'),
    Point = require('../../util/point').Point,
    toGeoJson = require('../../util/point').toGeoJson,
    cloudinary = require('cloudinary'),
    config = require('../../config'),
    environment = config.environment,
    fbGraphSDK = require('../../util/facebook-graph-sdk'),
    async = require('async'),
    allCriteria = require('../../util/spop_criteria/criteria'),
    geoJsonUtils = require('geojson-utils'),
    express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    $q = require('q');

cloudinary.config({
    cloud_name: config[environment].cloudinary.cloud_name,
    api_key: config[environment].cloudinary.api_key,
    api_secret: config[environment].cloudinary.api_secret
});


function filterPostsByCriteria(posts, criteria, res) {
    var returnPosts = [];
    async.each(_.keys(criteria), function(criterion, criteriaCb) {
        allCriteria[criterion].filter(criteria[criterion], posts, function(finalPosts) {
            returnPosts.concat(finalPosts);
        });
    }, function(err) {
        console.log(returnPosts);
        res.send(util.success({
            "posts": returnPosts,
            "criteria": criteria
        }))
    })
            // res.send(400, util.failure(err));
};


var api = {

    getPostsNearMe: function(req, res, next) {
    
        var user = req.user,
            latitude = req.param('latitude'),
            longitude = req.param('longitude'),
            radius = 21;        
                        
        // console.log("criteria = " + sutil.inspect(criteria));
        if (!user ||
            !latitude ||
            !longitude) {
            // console.log(user, latitude, longitude, radius);
            res.send(400, util.failure("Unable to get posts near user: missing required parameter"));
        }
        else {	
				var params = {};
				params.user = user;
				params.access_token = user.accessToken;
	
// 				Post.find().exec(function(err, docs){
// 														console.log('near ',docs);
// 
// 				});
				
				// Radius is in KM, so convert from km to radians
				radius = radius / 6371;
				var point = {
					type: "Point",
					coordinates: [Number(longitude), Number(latitude)]
				};
			
						var queryParams = {
							spherical: true,
							maxDistance: radius,
							distanceMultiplier: 6378.137, //before 6378137 radians to meters. (The radius of the Earth is approximately 3,959 miles or 6,371 kilometers.)
							query: {reportCount:{$ne:user._id}}
						};
					
						// Post.geoNear(point, queryParams, function(err, results, stats) {
						Post.geoNear(point, queryParams, function(err, results, stats) {
							// Post.geoNear({type: "Point", coordinates: point}, {maxDistance: radius, spherical: true, distanceMultiplier:6378.137}, function(err, results, stats) {
							if (!err) {
								if (results) {
								
																
									res.send(util.success({
										posts: results
									}));

// 									Post.populate(results,  {
// 										path: "obj.owner", 
// 										model:User,
// 										select:'firstName lastName profileImageUrl'
// 									}, function (err, owners) {
// 								
// 										Post.populate(results, {
// 											path: "obj.thread", 
// 											model: Comment
// 										}, function (err, threads) {
// 											Post.populate(results, {
// 												path: 'obj.thread.from',
// 												model: 'User',
// 												select:'firstName lastName'
// 											}, function (err, threadOwners) {
// // 												Post.populate(results, {
// // 													path:'obj.members',
// // 													model: 'User',
// // 													select:'firstName lastName'
// // 												}, function (err, subscribers) {
// 	//                                                 console.log("subscribers: " + subscribers);
// 													if (err) {
// 														res.send(400, util.failure(err));
// 													} else {
// 
// 													}
// // 												});
// 											});
// 										});
// 									}
// 									);
								
								}
								else {
									res.send(util.success({
										"posts": []
									}));
								}
							}
							else {
								res.send(400, util.failure(err));
							}
							// console.log(err, results, stats);
						});
					
				// console.log("radius = " + radius);
		
			}
    },
    getMyPrivateMessages: function(req, res, next) {
//         console.log("Inside of getMyPrivateMessages");
        var myself = req.user;
//         console.log("Myself = ", myself);
        // Find private posts where the user is either
        // the owner or a subscriber and the recipient
        // is either the owner or a subscriber.
        Post.find({
            "privacy": "private"
        })
        .where('subscribers').in([myself._id])
        .populate('subscribers')
        .populate('owner')
        .exec(function(err, posts) {
            Post.populate(posts, {
                path: "thread", model: Comment
            }, function (err, threads) {
                Post.populate(posts, {
                    path: 'thread.from',
                    model: 'User',
                    select:'firstName lastName gender description networks lastActive profileLink'
                }, function (err, threadOwners) {
                    if (err) {
                        res.send(400, util.failure(err));
                    } else {
                        res.send(util.success({
                            posts: posts
                        }));
                    }
                });
            });

            // if (err) {
            //     console.log("Error encountered in getting subscribers: ", err);
            //     res.send(400, util.failure(err));
            // } else {
            //     res.send(util.success({
            //         posts: posts
            //     }));
            // }
        });
        // res.send(util.success("Cool"));
    },
    getPostsByUser: function(req, res, next) {
        var userId = req.param('owner'),
            criteria = req.param('criteria');
        Post.find({
                "owner": userId,
                "privacy": "public"
            })
            .populate('thread')
            .populate('owner')
            .exec(function(err, posts) {
                posts = posts.toObject();
                if (!err) {
                    if (!posts) {
                        res.send(404, util.failure("Unable to get posts: no posts found"));
                    } else if (criteria) {
                        filterPostsByCriteria(posts, criteria, res);
                    } else {
                        res.send(util.success({
                            posts: posts
                        }));
                    }
                }
                else {
//                     console.log("Inside of getPostsByUser");
                    res.send(400, util.failure("Unable to get posts: " + err));
                }
            });
    },
    getExplorePosts: function(req, res, next) {
        
		Post.find({
			"type": "explore",
			"reportCount":{$ne:req.user._id}
        })
        .populate('owner')
        .populate('thread')
        .populate('likeCount')
        .populate('imageUrl.tags.user')
        .sort( { timestamp : 'desc' } )
        .exec(function(err, posts) {
			if(!err){

				var options = {
					path: 'thread.from',
					model:'User',
					select:'firstName lastName username profileImageUrl privacy'
				}
				Post.populate(posts, options, function (err, comments) {
					res.send(util.success({
						posts: posts
					}));
				});

			}
        
        });
    },
    getFollowingExplorePosts: function(req, res, next){
        var followingArray = req.user.following;
    
		Post.find({
			"type": "explore",
			"reportCount":{$ne:req.user._id},
            "owner": { $in: followingArray}
        })
        .populate('owner')
        .populate('thread')
        .populate('likeCount')
        .populate('imageUrl.tags.user')
        .sort( { timestamp : 'desc' } )
        .exec(function(err, posts) {
			if(!err){
				
				var options = {
					path: 'thread.from',
					model:'User',
					select:'firstName lastName username profileImageUrl privacy'
				}
				Post.populate(posts, options, function (err, comments) {
					res.send(util.success({
						posts: posts
					}));
				});

			}
        
        });
    
    },
    getMyPosts: function(req, res, next) {
    
        Post.find({
                "owner": req.user._id,
                "privacy": "public"
            })
            .populate('thread')
            .populate('owner')
            .exec(function(err, posts) {
                if (!err) {
                    if (!posts) {
                        res.send(404, util.failure("No posts found for this user"));
                    }
                    else {
                        var options = {
                            path: 'thread.from',
                            model:'User',
                            select:'firstName lastName gender description networks lastActive profileLink'

                        }
                        Post.populate(posts, options, function (err, comments) {
                            res.send(util.success({
                                posts: posts
                            }));
                        });
                    }
                }
                else {
                    res.send(400, util.failure("Unable to get my posts: " + err));
                }
            });
    },
    getPost: function(req, res, next) {
        if (!req.param('id')) {
            res.send(400, util.failure("Unable to get post: id is a required parameter."));
            return;
        }
        Post.findOne({
                _id: req.param('id')
            })
            // .select('title type status owner thread')
            .populate('owner')
            .populate('privateTo')
            .populate('thread')
            .exec(function(err, post) {
                if (!err) {
                    if (!post) {
                        res.send(404, util.failure("Post not found with id " + req.param('id')));
                    }
                    else {
                        var options = {
                            path: 'from',
                            model:'User',
                            select:'firstName lastName profileImageUrl username'
                        }
                        Post.populate(post.thread, options, function (err, comments)
                        {
                            post.thread = comments;
                            res.send(util.success({
                                posts: post
                            }));
                        });
                    }
                }
                else {
                    res.send(400, util.failure("Unable to get post: " + err));
                }
            });
    },
    getExplorePost: function(req, res, next){
        if (!req.param('id')) {
            res.send(400, util.failure("Unable to get post: id is a required parameter."));
            return;
        }
        Post.findOne({
                _id: req.param('id')
		})
        .populate('owner')
        .populate('thread')
        .populate('likeCount')
        .populate('imageUrl.tags.user')
        .sort( { timestamp : 'desc' } )
        .exec(function(err, post) {
			if(!err){

				var options = {
					path: 'thread.from',
					model:'User',
					select:'firstName lastName username profileImageUrl privacy'
				}
				Post.populate(post, options, function (err, comments) {
					res.send(util.success({
						post: post
					}));
				});

			}
        
        });
    
    },
    createPost: function(req, res, next) {
//         if (!req.param('message')) {
//                 console.log("Made it into errror");
// 
//                 var missing = [];
//                 if (!req.body.longitude) missing.push('message');
// //                 console.log(req);
//                 res.send(400, util.failure("Missing a required parameter: " + JSON.stringify(missing)));
//         }
//         else {
            console.log("Made it into createPost");
			
			var post = new Post();
			post.type = req.param('type');
			if(post.type == 'group'){
	 			var longitude = req.param('longitude');
	 			var latitude = req.param('latitude');
	 			post.location = [longitude, latitude];
	 			post.capacity = req.param('capacity');
	  			post.members = req.param('members') || [];
	 			post.members.push(req.user);
			}
			else if(post.type == 'explore'){
				 post.imageUrl.tags = req.param('tagArray')||[];
			}
			post.title = req.param('title');
			post.owner = req.user;
			post.timestamp = Date.now();
			post.message = req.param('message');
			post.imageUrl.pictureUrl = req.param('imageUrl');
			
			post.save(function(err, post) {
				if (!err) {
					if (!post) {

						res.send(400, util.failure("Unable to save post: post not created"));
						
					}
					else {  
						
						if(post.type == 'group'){
							if(post.members.length>0){
	
								var i = post.members.indexOf(req.user._id);
								post.members.splice(i,1);
								
								async.each(post.members, function (member, callback) {
								
									var message = req.user.firstName+" "+req.user.lastName+" added you to "+post.title;
									var info = JSON.stringify({imageUrl:post.imageUrl.pictureUrl,threadID:post._id});
									var notification = new Notification({ message: message,to: member,type:"group",user:req.user,info:info});
									notification.save(function(err){
						
										callback();
									});

				
				
								},function(err){
								
									if(!err){
								
										var message = req.user.firstName+" "+req.user.lastName+" added you to "+post.title;
										pushUtils.sendNotificationToPostSubscribers(post.members,{"alert":message,"sound":'default'},{"type":'acceptGroup'}, function(err){

											if(err){
			// 									console.log('Push did not send'+spopMessage);
											}	
											else{
			// 									console.log('Push '+spopMessage+' to'+senderName);
											}
				
										});
									}
								});
							}
						
						}
						
						res.send(util.success({
							posts: post
						}));
						
					
					}
				}
				else{
					res.send(400, util.failure("Unable to save post: post not created"));
				}
			});    
//         }
    },
    notify: function(req, res, next) {
        var postId = req.param('post');
        sendNotificationToPostSubscribers(postId, function(err, message) {
            if (err) {
                res.send(400, util.failure("An error was encountered getting post " + err));
            } else {
                res.send(message);
            }
        });
    },
    deletePost: function(req, res, next) {
        var postId = req.param('id');
        Post.findById(postId).exec(function(err, post) {
            if (!err) {
                if (!post) {
                    res.send(404, util.failure("Unable to find post with id " + postId));
                }
                else {
                
                	if(post.type == 'private'){
                		console.log('userID: '+req.user._id);
                		var index = post.members.indexOf(req.user._id);

						if (index > -1) {
							post.members.splice(index, 1);

						}

						if(post.members.length == 0){
									
							Comment.remove({'_id': { $in: post.thread}}, function (err) {

							});
							
				
							post.remove(function(err, post) {
								if (!err) {
									if (!post) {
										res.send(400, util.failure("Did not remove post: post not returned"));
									}
									else {
										res.send(util.success({
											posts: post
										}));
									}
								}
								else {
									res.send(400, util.failure("Unable to remove post: " + err));
								}
							});
						}
						else{
							post.save(function(err, post) {
								res.send(util.success({
									posts: post
								}));
							});
						}

					}
					else{
						Comment.remove({'_id': { $in: post.thread}}, function (err) {});
						Like.remove({'_id': {$in:post.likeCount}},function(err){
						});
						post.remove(function(err, post) {
							if (!err) {
								if (!post) {
									res.send(400, util.failure("Did not remove post: post not returned"));
								}
								else {
									res.send(util.success({
										posts: post
									}));
								}
							}
							else {
								res.send(400, util.failure("Unable to remove post: " + err));
							}
						});
					}
					
                }
            }
            else {
                res.send(400, util.failure("Unable to find post to delete: " + err));
            }
        });
    },
    startComment: function(req, res, next) {
        console.log("Starting comment");
        var postId = req.data.postId;
        var fromUser = req.data.fromUserId;
        
        if(!postId){
        	var toUser = req.data.toUserId;

            Post.findOne({
        	     $or: [
						  { $and: [{"owner": toUser}, {"privateTo": fromUser}] },
						  { $and: [{"owner": fromUser}, {"privateTo": toUser}] }
				  ]
			})
			.populate('thread')
			.populate('owner')
			.populate('privateTo')
			.exec(function(err, post) {
				if (!err) {
					if (!post) {
						req.io.emit('noPost',{});     
					}
					else {
					    
					    req.io.join(post._id);
					    
					    var options = {
                            path: 'from',
                            model:'User',
                            select:'firstName lastName profileImageUrl'
                        }
                        Post.populate(post.thread, options, function (err, comments)
                        {
                            post.thread = comments;
							req.io.emit('getPrivateThread', post);     

                        });
					
					}
				}
				else {
					req.io.respond(400, util.failure("There was an error attempting to start your comment: " + err));
				}
			});
        
        }else{
            Post.findOne({
				"_id": req.data.postId
			})
			.exec(function(err, post) {
				if (!err) {
					if (!post) {

						req.io.emit('popped', "The owner has deleted this post");
					}
					else {
					
						if(post.members.length>0){
					
							var i = post.members.indexOf(fromUser)
				
							if(i == -1){
								req.io.emit('popped', 'You have already left this group');     
							}else{
								req.io.join(req.data.postId);
							}
						}else{
							req.io.join(req.data.postId);
						}
					
					}
				}
				else {
					console.log('err');
					req.io.emit('popped', "The owner has deleted this post");
				}
			});
			
        }            
    },
    reportPost: function(req, res, next) {
    
		if (
				_.isNull(req.param('threadID')) ||
				_.isUndefined(req.param('threadID')) ||
				_.isNull(req.param('threadID')) ||
			_.isUndefined(req.param('threadID'))
		){
		
			res.send(500, util.failure("Server error!"));

		 }
		 else{
        	
        	Post.findOne({
                "_id": req.param('threadID')
            })
            .exec(function(err, post) {
            
                if (!err) {
												
					if (
							_.isNull(post.reportCount) ||
							_.isUndefined(post.reportCount) ||
							_.isNull(post.reportCount) ||
						_.isUndefined(post.reportCount)
					) {
						post.reportCount = [];
					}
					
					var i = post.reportCount.indexOf(req.user._id);					

					if(i == -1) {
						
						if(post.reportCount.length > 4){

							Comment.remove({'_id': { $in: post.thread}}, function (err) {});
											Like.remove({'_id': {$in:post.likeCount}},function(err){
							});
							post.remove(function(err, post) {
								if (!err) {
									if (!post) {
										res.send(400, util.failure("Did not remove post: post not returned"));
									}
									else {
								 
										res.send(util.success({
											posts: post
										}));
									}
								}
								else {
									res.send(400, util.failure("Unable to remove post: " + err));
								}
							});
						
						}else{
							
							post.reportCount.push(req.user._id);	
							post.save(function(err, post) {
									res.send(util.success({
									}));
							});
						}
					}						
					else{

						res.send(500, util.failure("You have already reported to this post!"));
					}	
	
                }
                else {
                          
                    res.send(404, util.failure("Post Error"));

                }
                
            });		
		}
    
    },
    postComment: function(req, res, next) {

			var postId = req.data.postId,
            user = req.data.user,
            messageArray = req.data.messageArray,
			toUser = req.data.toUser;

			if (!postId) {
				var commentArray = [];
								
				var post = new Post();
				if(messageArray[0].message){
					post.message = messageArray[0].message;
				}
				else{
					post.message = 'Attachment';
				}
			
				post.type = 'private';
            	post.owner = user._id;
            	post.privateTo = toUser._id;   
            	post.timestamp = Date.now();
            	post.members = [user._id,toUser._id];
        		var lastMessage;
		
				async.each(messageArray, function (message, callback) {	
					var t = new Comment();
					t.from = post.owner;
					t.postTime = Date.now();
				
					if(message.message){
						t.message = message.message;
						lastMessage = message.message;

					}
					else{
						t.imageUrl = message.image;
						lastMessage = "Sent an Attachment";
					}

					t.save(function(err, thread) {

						if (!err) {
							if (!thread) {
								console.log('comment '+t.message);
								res.send(400, util.failure("Unable to save post: thread not created"));
							} else {
								post.thread.push(t._id);
								commentArray.push(t);

								callback();
							}
						}

					}); //end t.save
				},function(err){
					post.save(function(err, post) {
						if (!err) {
							if (!post) {
								res.send(400, util.failure("Unable to save post: post not created"));
							}
                    		else {
                    		  
								var returnInfo = {
									_newPost: post._id,
									from: user,
									messageThread: commentArray,
									postTime: post.timestamp
								};
                        		req.io.join(post._id);
								
								req.io.emit('newPrivate', returnInfo);     

								User.findOne({
									"_id": toUser._id
								})
								.exec(function(err, user) {
									if(user){

										//Send notification to party
										var senderName = user.firstName+': ';
										var totalStr = senderName.concat(lastMessage);

										pushUtils.sendNotificationToPostSubscribers([user._id],{'alert':totalStr,'sound':'default'},{type:'private',"id":post._id}, function(err){
										});
										
									}
			
								});

							}// end if !post 
						}
						else {
							res.send(400, util.failure("Unable to save post: " + err));
						} // end if !err
					}); // end post.save                     

				});	
	   
			}
			else if (!messageArray) {
				req.io.respond(400, util.failure('No message sent'));
			}
			else {
				Post.findById(postId).exec(function(err, post) {
					if (!err) {
						if (!post) {						
							req.io.respond(400, "Unable to find post: " + postId);
						}
						else {
							User.findById(user._id).exec(function (err, resolvedUser) {

								var lastMessage;
							
								async.each(messageArray, function (message, callback) {
					
									var t = new Comment();
					
									t.from = resolvedUser;
									t.postTime = Date.now();
				
									if(!_.isUndefined(message.message) &&
									!_.isNull(message.message) &&
									!_.isUndefined(message.message) &&
									!_.isNull(message.message)){
										lastMessage = message.message;
										t.message = message.message;
									}
									else{
										lastMessage = 'Attachment';
										t.imageUrl = message.image;
									}
									
									t.save(function (err, newComment) {
									
										if (!err) {
											if (!newComment) {
												res.send(400, util.failure("Unable to save post: thread not created"));
											} else {
											
												post.thread.push(newComment._id);
										
												var returnInfo = {
													_id: newComment._id,
													// from: (privacy === "private" ? null : resolvedUser),
													// from: (type == "anonymous" ? null : resolvedUser),
													from: resolvedUser,
													message: newComment.message,
													imageUrl: newComment.imageUrl,
													postTime: newComment.postTime
												};
									
												req.io.room(postId).broadcast('newComment', returnInfo);
												req.io.emit('newComment', returnInfo);     
												callback();
		
																						
											}
										}
									}); //end t.save
					
								},function(err){
									if(post.type == 'private'){
									    post.timestamp = Date.now();
				            			post.members = [post.owner,post.privateTo];
				            		}

									post.save(function(err, post) {
										
										if (!err) {
											var i = post.members.indexOf(user._id);
											post.members.splice(i,1);
											var totalStr;
											var sendNotifTo;
											if(post.type == 'explore'){
												var senderName = user.firstName+' has commented on your post: ';
												totalStr = senderName.concat(post.message);
												sendNotifTo = [post.owner];
											
											}else{
												var senderName = user.firstName+': ';
												totalStr = senderName.concat(lastMessage);
												sendNotifTo = post.members;
											}								
											
											
											pushUtils.sendNotificationToPostSubscribers(sendNotifTo,{"alert":totalStr,"sound":'default'},{"type":post.type,"id":post._id}, function(err){

												if(err){
				// 									console.log('Push did not send'+spopMessage);
												}	
												else{
				// 									console.log('Push '+spopMessage+' to'+senderName);
												}
							
											});

										}
									});
								});	
							});
						}
					}
					else{
						req.io.respond(404, "There was an error finding your post: " + err);
					}
				
				
				});

			}
    },
    pushMessage: function(req, res, next) { 
    
		
// 		User.find({'deviceToken': { $exists: true }}, function(err, users) {   
// 					
// 		
// 										
// 					async.map(users, function(deviceUser,callback){
// 					
// 						callback(null,deviceUser.deviceToken);
// 						
// 					}, function(err, deviceTokenArray){
// 						
// 						
// // 						res.send(deviceTokenArray);
// 						var message = "";
// 						
// 						
//  						sendNotification(deviceTokenArray,message);	
// 						
// 						res.send('Sent sucessfully');
// 
// 					});
// 		
// 		
// 		
// 		}); 

		User.find({'notifyNew': { $exists: false }}, function(err, users) {   
					
			console.log("Count is ",users.length);

// 			for(var i =0; i< users.length; i++){
// 				console.log("id is ",users[i]._id);
// 				User.findById(users[i]._id).exec(function(err, user) {
// 				
// 					user.notifyNew = true;
// 					user.save(function(err,user){
// 					});
// 				});
// 			}

			res.send(users);

		});
//		Push Everywhere to friends
//     	var at = req.param('accesstoken');
// 
// 		var post = {'location':[-119.339694, 36.306073],
// 					'radius':800 };
// 
// 		var message = "THIS IS A TEST";	
// 		
// 		sendNotificationToFriendsWithAccessToken(at,post,message,function(){
// 	
// 			res.send('Friends notification sent');
// 	
// 		});
    	
    
//     	var postId = req.param('postid');
// 		var ownerId = req.param('userid');
// 		
// 		Post.findById(postId).exec(function(err, post) {	
// 			if(err){
// 			
// 			}
// 			else{
// 				
// 				Comment.find({
// 					'_id': { $in: post.thread},
// 
// 					}).where('from', ownerId).exec(function(err, docs){
// 				
// 					res.send(docs);				
// 					});
// 				
// 				
// 			}
// 		});
				
    },
    getAllMyPosts: function(req,res,next){

    
    	//Owner
        Post.find({
			"owner": req.user._id,
			"privacy": "public"
		})
		.populate('thread')
		.populate('owner')
		.exec(function(err, posts) {
			if (!err) {
				if (!posts) {
					res.send(404, util.failure("No posts found for this user"));
				}
				else {
					var options = {
						path: 'thread.from',
						model:'User',
						select:'firstName lastName gender description networks lastActive profileLink'

					}
					Post.populate(posts, options, function (err, comments) {
					
						var totalObject = { 
							publicPosts: posts
						};
					
						//Private
							Post.find({
								"privacy": "private"
							})
							.where('subscribers').in([req.user._id])
							.populate('subscribers')
							.populate('owner')
							.exec(function(err, posts) {
								Post.populate(posts, {
									path: "thread", model: Comment
								}, function (err, threads) {
									Post.populate(posts, {
										path: 'thread.from',
										model: 'User',
										select:'firstName lastName gender description networks lastActive profileLink'
									}, function (err, threadOwners) {
										if (err) {
											res.send(400, util.failure(err));
										} else {
											
											totalObject.privatePosts = posts;
											
											
											res.send(util.success(totalObject));
						
						
										}
									});
								});

							});						
					
	
					});
				}
			}
			else {
				res.send(400, util.failure("Unable to get my posts: " + err));
			}
		});
	
    },
    getUserExplorePosts: function(req,res,next){
        if (!req.param('id')) {
            res.send(400, util.failure("Unable to get post: id is a required parameter."));
            return;
        }
        
		Post.find({
			"owner": req.param('id'),
			"type": "explore"
		})
		.populate('owner')
		.populate('thread')
		.populate('likeCount')
		.populate('imageUrl.tags.user')
		.sort( { timestamp : 'desc' } )
		.exec(function(err, posts) {
			if(!err){
				var options = {
					path: 'thread.from',
					model:'User',
					select:'firstName lastName username profileImageUrl'
				}
				Post.populate(posts, options, function (err, comments) {
				
					User.findOne({
						'_id': req.param('id')
					}).exec(function(err, user) {
// 						Notification.count({to: req.param('id')}, function(err, c) {
// 							user.numNotif = c;
							User.find({
								"following": user._id
							},{_id:1})
							.exec(function(err, users) {
								user.followers = users;
								res.send(util.success({
									posts: posts,
									user:user
								}));
							});
	
// 						});
					});

				});

			}
	
		});

    },
    getChatMessages: function(req,res,next){
    
        Post.find({
        	members: req.user 
        })
		.populate('thread')
		.populate('privateTo')
		.populate('owner')
		.sort( { timestamp : 'desc' } )
		.lean()
		.exec(function(err, posts) {
		
			if(err){
				res.send(400, util.failure("Unable to get my posts: " + err));
			}
			else{
				res.send(util.success({
					posts: posts
				}));
    		
    		}
    	});
    
    
    },
    addAdditionalMembers: function(req,res,next){
    	    Post.findOne({
                "_id": req.param('threadID')
            })
            .exec(function(err, post) {
            
				if(!err){
					if(post){
		
						var membersToAdd = req.param('members');
				
						var membersCount = post.members.length + membersToAdd.length;
				
						var requestBool = false;
				
						if(!post.capacity){
							requestBool = true;
						}else{
							if(membersCount<=post.capacity){
								requestBool=true;
							}
						}
				
						if(requestBool){
				
							async.each(membersToAdd, function (member, callback) {
								var i = post.members.indexOf(member);					
								
								var j = post.requests.indexOf(member);
								if(j != -1){
									post.requests.splice(j, 1);	
								}					
															
								if(i == -1) {
									post.members.push(member);
									var message = req.user.firstName+" "+req.user.lastName+" added you to "+post.title;
									var info = JSON.stringify({imageUrl:post.imageUrl.pictureUrl,threadID:post._id});
									var notification = new Notification({ message: message,to: member,type:"group",user:req.user,info:info});
									notification.save(function(err){
								
										callback();
									});
								}else{
									callback();
								}
					
					
							},function(err){
				
								post.save(function(err,post){
									if(!err){
										var message = req.user.firstName+" "+req.user.lastName+" added you to "+post.title;

										pushUtils.sendNotificationToPostSubscribers(membersToAdd,{"alert":message,"sound":'default'},{"type":'acceptGroup'}, function(err){

											if(err){
			// 									console.log('Push did not send'+spopMessage);
											}	
											else{
			// 									console.log('Push '+spopMessage+' to'+senderName);
											}
										});

										res.send(util.success({
											newMembers: post.members
										}));
									}
									else{

										res.send(404, util.failure("Failed"));
									}
				
								});
				
				
				
							});
						}else{
							res.send(500, util.failure("Over Capacity"));				

						} 
					}   
				}
            });
            	
    },
    requestMembers: function(req,res,next){
        if (!req.param('threadID')) {
                console.log("Made it into errror");
                res.send(400, util.failure("Missing a required parameters"));
        }
        else {
        	
        	Post.findOne({
                "_id": req.param('threadID')
            })
            .exec(function(err, post) {
            	
            	if(err){
            		console.log('error '+err);
            		res.send(400, util.failure("Failed"));
            	}else{
            		if(!post){
            			res.send(401, util.failure("Group could not be found"));
            		}else{
		
						var requestBool = false;
				
						if(!post.capacity){
							console.log('unlimited');
							requestBool = true;
						}else{
							console.log('capacity '+post.capacity);
							if(post.members.length<post.capacity){
								requestBool=true;
							}
						}
				
						if(requestBool){
				
							if(	!post.requests){
								post.requests = [];
							}
			
							var i = post.requests.indexOf(req.user._id);					
																										
							if(i != -1) {
								 res.send(501, util.failure("Already requested"));
							}
							else{
			
								post.requests.push(req.user._id);
								post.save(function(err,post){
									if(!err){
						
										var message = req.user.firstName+" "+req.user.lastName+" wants to join "+post.title;
										var info = JSON.stringify({threadID:post._id});

										var notification = new Notification({ message: message,to: post.owner,type:"request",user:req.user,info:info});
										notification.save(function(err){
											if(!err){
											
												pushUtils.sendSingleNotification(post.owner,{'alert':message},{"type":"requestGroup"}, function(err){
													if(err){
														console.log('Push did not send '+message);
													}
													else{
													}
												});
											}
										
										});
										
										res.send(util.success({
											post: post
										}));
									}
									else{

										res.send(404, util.failure("Failed"));
									}
					
								});

							}
						}else{
							res.send(500, util.failure("Over Capacity"));				
						}            		
            		}
            	}
            });        
        }
    },
    acceptMembers: function(req,res,next){
    	var userToAccept = req.param('userIdToAccept');
		Post.findOne({
			"_id": req.param('threadID')
		})
		.exec(function(err, post) {
			
			if(err){
				console.log('error '+err);
				res.send(400, util.failure("Failed"));
			}else{
				if(!post){
					res.send(401, util.failure("Group could not be found"));
				}else{	
				
					var requestBool = false;
			
					if(!post.capacity){
						requestBool = true;
					}else{
						if(post.members.length<post.capacity){
							requestBool=true;
						}
					}
			
			
					if(requestBool){

						var i = post.requests.indexOf(userToAccept);					
																									
						if(i != -1) {
				
							post.requests.splice(i, 1);
							
							var j = post.members.indexOf(userToAccept);
							if(j == -1){
								post.members.push(userToAccept);
							}
							post.save(function(err,post){
								if(!err){
					
									Notification.remove({ "_id": req.param('notificationId') }, function(err) {
									});
					
									var message = "You've been accepted to "+post.title;
									var info = JSON.stringify({imageUrl:post.imageUrl.pictureUrl,threadID:post._id});
									var notification = new Notification({ message: message,to: userToAccept,type:"group",user:req.user,info:info});
									notification.save(function(err){
										if(!err){
										
											pushUtils.sendSingleNotification(userToAccept,{'alert':message},{"type":"acceptGroup"}, function(err){
												if(err){
													console.log('Push did not send'+message);
												}
												else{
												}
											});
										}

									});
									
									res.send(util.success({
										post: post
									}));
								}
								else{

									res.send(404, util.failure("Failed"));
								}
				
							});
			
						}
						else{
							 res.send(501, util.failure("Already added"));				
						}
					}else{
						 res.send(500, util.failure("Over Capacity"));				
					}			

				}
			}
            		
		});    	
	
    },
    denyMembers: function(req,res,next){
        var userToDeny = req.param('userIdToDeny');
    	
		Post.findOne({
			"_id": req.param('threadID')
		})
		.exec(function(err, post) {
			
			
			if(err){
				console.log('error '+err);
				res.send(400, util.failure("Failed"));
			}else{
				if(!post){
					res.send(401, util.failure("Group could not be found"));
				}else{	
					var i = post.requests.indexOf(userToDeny);					
																									
					if(i != -1) {
				
						post.requests.splice(i, 1);
						post.save(function(err,post){
							if(!err){
					
								Notification.remove({ "_id": req.param('notificationId') }, function(err) {
								});

								res.send(util.success({
									post: post
								}));
							}
							else{

								res.send(404, util.failure("Failed"));
							}
				
						});
			
					}
					else{
						 res.send(501, util.failure("Already denied"));				
					}				
				}
			}
		});    		
    
    
    },
    leaveMember: function(req,res,next){
    
        var userToLeave = req.param('userIdToLeave');
    	
		Post.findOne({
			"_id": req.param('threadID')
		})
		.exec(function(err, post) {
			if(err){
				console.log('error '+err);
				res.send(400, util.failure("Failed"));
			}else{
				if(!post){
					res.send(401, util.failure("Group could not be found"));
				}else{		
					var i = post.members.indexOf(userToLeave);					
																									
					if(i != -1) {
						post.members.splice(i, 1);
						post.save(function(err,post){
							if(!err){
								res.send(util.success({}));
							}
							else{

								res.send(404, util.failure("Failed"));
							}
				
						});
						
					}else{
						res.send(502, util.failure("Already Left"));
					}
					
				}
			}
		});
    
    },
    likeCount: function(req, res, next){

		var exploreId = req.param('exploreId'),
		user = req.user;
		            
    	if (
                _.isNull(exploreId) ||
                _.isUndefined(exploreId) ||
                _.isNull(exploreId) ||
            _.isUndefined(exploreId)
        ) {
            res.send(400, util.failure("Explore ID are required"));
        }
        else {
        
            Post.findOne({
                "_id": exploreId
            })
            .populate('likeCount')
            .exec(function(err, post) {
            
            	if(!err){
            
					if (
							_.isNull(post.likeCount) ||
							_.isUndefined(post.likeCount) ||
							_.isNull(post.likeCount) ||
						_.isUndefined(post.likeCount)
					) {
						post.likeCount = [];
					}
					
					var i = -1;	
					var j = 0;
					for( j =0;j<post.likeCount.length;j++){


						if(post.likeCount[j].user.equals(user._id)){
	
							i=j;
						}
					}					
					
					var isLiked = false;
					
					if(i == -1) {
						var message = user.username+" likes your post "+post.message;
						var like = new Like({user:user._id});

						if(!post.owner.equals(user._id)){
									
							var info = JSON.stringify({threadID:post._id});
							var notification = new Notification({ message: message,to: post.owner,type:"like",user:req.user,info:info});
							like.notification = notification._id;
							notification.save(function(err,notification){
						
								var message = user.username+" likes your post "+post.message;
								pushUtils.sendSingleNotification(post.owner,{'alert':message},{"type":"like","id":post._id}, function(err){
									if(err){
										console.log('Push did not send err'+message+" ("+err);
									}
									else{
									}
								});
						
							});
						}
						
						like.save(function(err,like){
						});
						post.likeCount.push(like);	
						isLiked = true;
					}else{
					
					
						Notification.remove({ "_id": post.likeCount[i].notification }, function(err) {

						});
						Like.remove({ "_id": post.likeCount[i] }, function(err) {
						});
										
						post.likeCount.splice(i, 1);
					}
				
					post.save(function(err, post) {
				
						if(err){
							res.send(400, util.failure("Failed save"));
						}
						else{

							res.send(util.success({
								_id: post._id,
								likeCountLength: post.likeCount.length
							}));

				   
						}
					});
				
				}
			});
        
        }
    
    },
    getPostMembers: function(req, res, next){
    
    	var membersArray = req.param('membersArray');
		User.find({
			'_id': { $in: membersArray}
			
		}).exec(function(err, users){
			if(err){
				res.send(404, util.failure("Error!"));				
			}else{
				res.send(util.success({
					user: users
				}));
				
			}
		});
					
    
    }
}


module.exports = {
    routes: [
        {
        method: api.getPostsNearMe,
        verb: 'get',
        route: '/post/find/:longitude/:latitude',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.getPost,
        verb: 'get',
        route: '/post/postById',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
    	method: api.getExplorePost,
    	verb: 'get',
    	route: '/post/explorebyid'
    
    }, {
        method: api.getPostsByUser,
        verb: 'get',
        route: '/post/user/:owner',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.getMyPosts,
        verb: 'get',
        route: '/post/user',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.createPost,
        verb: 'post',
        route: '/post',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.notify,
        verb: 'post',
        route: '/post/:id/notify',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.deletePost,
        verb: 'del',
        route: '/post/:id',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.startComment,
        verb: 'io',
        route: '/startComment'
    }, {
        method: api.postComment,
        verb: 'io',
        route: '/comment'
    }, {
        method: api.getExplorePosts,
        verb: 'get',
        route: '/post/getexploreposts',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.getFollowingExplorePosts,
        verb: 'get',
        route: '/post/getfollowingexploreposts',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.getMyPrivateMessages,
        verb: 'get',
        route: '/post/getPrivateMessages',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.pushMessage,
        verb: 'get',
        route: '/examp'
    }, {
        method: api.getAllMyPosts,
        verb: 'get',
        route: '/post/getallmyposts',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
    	method: api.getUserExplorePosts,
    	verb: 'post',
        route: '/post/getuserexploreposts'
    
    }, {
        method: api.getChatMessages,
        verb: 'get',
        route: '/post/getchatmessages',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.addAdditionalMembers,
        verb: 'post',
        route: '/post/addadditionalmembers',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.requestMembers,
        verb: 'post',
        route: '/post/requestmembers',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.acceptMembers,
        verb: 'post',
        route: '/post/acceptmembers',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.denyMembers,
        verb: 'post',
        route: '/post/denymembers',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.leaveMember,
        verb: 'post',
        route: '/post/leavemember'
    }, {
        method: api.likeCount,
        verb: 'post',
        route: '/post/like',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.reportPost,
        verb: 'post',
        route: '/post/report',
        middleware: [
            passport.authenticate('jwt', {
                session: false
            })
        ]
    }, {
        method: api.getPostMembers,
        verb: 'post',
        route: '/post/getPostMembers'
    }
    
    ]
};
//   app.get('/post/find/:longitude/:latitude/:radius', passport.authenticate('facebook-token', {session: false}), posts.getPostsNearMe);
//   app.get('/post/user', passport.authenticate('facebook-token', {session: false}), posts.myPosts);
//   app.get('/post/:id', passport.authenticate('facebook-token', {session: false}), posts.getPost);
//   app.get('/post/user/:owner', passport.authenticate('facebook-token', {session: false}), posts.getPostsByUser);
//   app.post('/post/:id/notify', passport.authenticate('facebook-token', {session: false}), posts.subscribePost);
//   app.post('/post', passport.authenticate('facebook-token', {session: false}), posts.newPost);
//   app.del('/post/:id', passport.authenticate('facebook-token', {session: false}), function(req, res) {
//     req.app = app;
//     posts.popPost(req, res);
//   });
//   app.io.route('startComment', posts.startComment);
//   app.io.route('comment', function(req){
//     req.app = app;
//     posts.postComment(req);
//   });
