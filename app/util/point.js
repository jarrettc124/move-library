
var Point = {
    latitude: 0,
    longitude: 0
};

var toGeoJson = function(point) {
    return {
        type: 'Point',
        coordinates: [
            point.latitude,
            point.longitude
        ]
    };
};

// Point.methods.toGeoJson = function() {
//     return {
//         type: 'Point',
//         coordinates: [
//             this.latitude,
//             this.longitude
//         ]
//     };
// };

module.exports = {
    Point: Point,
    toGeoJson: toGeoJson
};