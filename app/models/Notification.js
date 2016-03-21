var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    User = require('./User'),
    async = require('async'),
    util = require('../util/utils');

// mongoose.set('debug', true);

var Notification = new Schema({
    message     : String,
    postTime    : {type: Date, default: (function() { // Default to UTC for timestamp
                                return Date.now();
                            })()},
    to		    : [{type: ObjectId, ref: 'User'}],
    type		: String,
    user		: {type: ObjectId, ref: 'User'},
    info		: String
});

Notification.pre('save', function(next) {    
    
    User.find({"_id": { "$in" : this.to}},{numNotif:1}).exec(function(err, users) {
    	if(users.length > 0){
    
			async.each(users, function (user, callback) {	
			
				if(!user.numNotif){
					user.numNotif = 1;
				}
				else{
					user.numNotif= user.numNotif+1;

				}
				user.save(function(err, user) {
					callback();
				});
	
			},function(err){
				if (!err) {
					next();
				} 
			});
		}else{
			next();
		}
    });
        
});

module.exports = mongoose.model('Notification', Notification);