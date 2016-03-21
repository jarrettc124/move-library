var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Like = new Schema({
    user                : {type: ObjectId, ref: "User"},
    post                : {type: ObjectId, ref: "Post"},
    notification        : {type: ObjectId, ref: "Notification"}
}, {
toObject: { virtuals: true },
toJSON: { virtuals: true }
});

module.exports = mongoose.model('Like', Like);