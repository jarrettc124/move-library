/**
 * Run this test using the MOCHA test runner (or something similar).
 **/
 
 /**
 * Test cases for the utils
 **/
var utils = require('../utils'),
    assert = require('assert'),
    _ = require('underscore'),
    sutil = require('util');

describe('utils', function() {
    describe('#emailParser', function() {
        it('should allow for parsing a well-formatted email', function(done) {
            this.timeout(5000);
            var testEmail = "joconnor@stanford.edu";
            utils.parseEmail(testEmail, function(err, emailParts) {
                assert.equal(null, err, 'err should be null');
                assert.equal(3, _.keys(emailParts).length, 'Parsed email should have 3 parts');
                done();
            })
        });
    });
});
