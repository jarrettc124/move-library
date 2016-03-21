var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    passwordUtils = require('../util/passwordUtils'),
//     ApiToken = require('./ApiToken'),
    Point = require('../util/point').Point,
    Post = require('./Post');
    
var SALT_LENGTH = 30;

var User = new Schema({
    id                  : String,
    facebookId          : String,
    universalToken      : String, 
    fbToken				: String,
    firstName           : String,
    email               : String,
    username			: String,
    password            : String,
    displayName			: String,
    lastName            : String,
    biography			: String,
    numNotif			: Number,
    isFollowing			: Boolean,
    blacklist			:[{type: ObjectId, ref: 'User'}],
    following			:[{type: ObjectId, ref: 'User'}],
    followers			:[{type: ObjectId, ref: 'User'}],
    notifications		: {
    						groupChat:{type: Boolean, default: true},
    						privateChat:{type: Boolean, default: true},
    						notificationAllOff:{type:Boolean, default:false}
    					},
	privacy				: {
	    					everyone:{type: Boolean, default: true},
    						followers:{type: Boolean, default: false},
    						nobody:{type: Boolean, default: false},
    						allowFacebookFollow:{type: Boolean, default: false}
						},
    gender              : String,
    password            : String,
    profileImageUrl		: String,
    FBprofileLink       : String, // The Facebook URL for this user.
    lastLocation        : { type: [Number], index: '2dsphere', default: [0, 0]},
    deviceToken         : String,
    deviceType          : String,
    lastActive          : {type: Date, default: new Date()}
}, {
toObject: { virtuals: true },
toJSON: { virtuals: true }
});
User.set('autoIndex', false);

User.index({lastLocation: '2dsphere',displayName: 1});




module.exports = mongoose.model('User', User);