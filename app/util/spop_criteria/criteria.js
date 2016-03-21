/**
 * This file exports all of the available criteria based on criteria name.
 * It allows for easy access for mapping of criteria from string name to 
 * criteria object.
 **/
 
var facebook_friends = require('./post-criteria-facebook_friends'),
//     facebook_groups = require('./post-criteria-facebook_groups'),
    gender = require('./post-criteria-gender'),
    university = require('./post-criteria-university');

module.exports = {
    facebook_friends: facebook_friends,
//     facebook_groups: facebook_groups,
    gender: gender,
    university: university
}