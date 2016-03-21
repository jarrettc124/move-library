var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Point = require('../util/point').Point,
    // Post = require('./Post'),
    User = require('./User'),
    util = require('../util/utils');

// mongoose.set('debug', true);

var Comment = new Schema({
    from        : { type: ObjectId, ref: 'User'},
    message     : String,
    type        : {type: String, default: "onymous"},
    privacy     : {type: String, default: "public"},
    postTime    : {type: Date, default: util.getUtcDate()},
    imageUrl    : String,
    location    : { type: [Number], index: '2dsphere'}
});

Comment.pre('save', function(next) {
    var thisThread = this;
    User.findOne({_id: this.from})
        .exec(function(err, user) {
            if (user) {
//                 user.lastLocation = thisThread.location;
                user.lastActive = util.getUtcDate();
                user.save(function(err, usr) {
                    if (!err) {
                        next();
                    } 
                });
            }
        });
});

module.exports = mongoose.model('Comment', Comment);