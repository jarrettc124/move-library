/**
 * This is the lightweight app.js file that runs your new express-powered Ghiraldi app.
 * Run this to run your entire application.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * Copyright (C) 2012, John O'Connor
 **/
 
/**
 * Module dependencies.
 */
// see http://jquerymobile.com/themeroller/?ver=1.3.2&style_id=20130917-99 for colors
 
var express = require('express.io'),
    path = require('path'),
    app = express(),
    mongoose = require('mongoose');

app.http().io();

mongoose.set('debug', true)


// Boot the MVC framework and start listening if the boot completes successfully.
require('./mvc').boot(app, function(bootParams) {
    if (bootParams.status === true) {
        app.server.listen(bootParams.port, function(){
            console.log('ghiraldi app started on port ' + bootParams.port);
        });
        // app.listen(bootParams.port);
    } else{
        console.log("ghiraldi app failed to start: " + bootParams.errors);
    }
});