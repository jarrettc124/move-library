/**
 * This is the install file for your new express-powered Ghiraldi app.
 * If you have tasks that need to be completed prior to running the Ghiraldi framework (such as creating initial
 * user types or admin users), you can do so using this install script.
 *
 **/

/** INSTALL TASKS GO HERE **/
var mongoose = require('mongoose'),
    Network = require('./app/models/Network'),
    q = require('q'),
    express = require('express.io'),
    app = express().http().io();
    
/** 
 * First, lets set up some methods to run in the init after the MVC
 * app has booted.
 * 
 * Here we'll be creating the allowable types.
 **/
var stanfordInit = function() {
    var stanfordInitDefer = q.defer();
    var stanford = new Network();
    stanford.networkName = "Stanford University";
    stanford.limitToEmail = "stanford.edu";
    Network.findOne({
            'networkName': stanford.networkName
        })
        .exec(function(err, network) {
            if (err) {
                stanfordInitDefer.reject(err);
            }
            else {
                if (!network) {
                    console.log("Network ", stanford.networkName, ' not found.  Creating anew');
                    // Create new network.
                    stanford.save(function(err, stan) {
                        if (err) {
                            stanfordInitDefer.reject(err);
                        }
                        else {
                            console.log("Network ", stanford.networkName, ' created.');
                            stanfordInitDefer.resolve(stan);
                        }
                    });
                }
                else {
                    console.log("Network ", stanford.networkName, ' already existed.');
                    stanfordInitDefer.resolve(network);
                }
            }
        });
        return stanfordInitDefer.promise;
};

var USCInit = function() {
    var SCInitDefer = q.defer();
    var USC = new Network();
    USC.networkName = "University of Southern California";
    USC.limitToEmail = "usc.edu";
    Network.findOne({
            'networkName': USC.networkName
        })
        .exec(function(err, network) {
            if (err) {
                SCInitDefer.reject(err);
            }
            else {
                if (!network) {
                    console.log("Network ", USC.networkName, ' not found.  Creating anew');
                    // Create new network.
                    USC.save(function(err, sc) {
                        if (err) {
                            SCInitDefer.reject(err);
                        }
                        else {
                            console.log("Network ", USC.networkName, ' created.');
                            SCInitDefer.resolve(sc);
                        }
                    });
                }
                else {
                    console.log("Network ", USC.networkName, ' already existed.');
                    SCInitDefer.resolve(network);
                }
            }
        });
        return SCInitDefer.promise;
}

var gmailInit = function() {
    var gmailInitDefer = q.defer();
    var gmail = new Network();
    gmail.networkName = "John's test using Gmail";
    gmail.limitToEmail = "gmail.com";
    Network.findOne({
            'networkName': gmail.networkName
        })
        .exec(function(err, network) {
            if (err) {
                gmailInitDefer.reject(err);
            }
            else {
                if (!network) {
                    console.log("Network ", gmail.networkName, ' not found.  Creating anew');
                    // Create new network.
                    gmail.save(function(err, stan) {
                        if (err) {
                            gmailInitDefer.reject(err);
                        }
                        else {
                            console.log("Network ", gmail.networkName, ' created successfully');
                            gmailInitDefer.resolve(stan);
                        }
                    });
                }
                else {
                    console.log("Network ", gmail.networkName, ' already existed');
                    gmailInitDefer.resolve(network);
                }
            }
        });
        return gmailInitDefer.promise;
}


require('./mvc').boot(app, function(bootParams) {
    if (bootParams.status === true) {
        console.log("Right before q.all");
        q.fcall(stanfordInit)
        .then(USCInit)
        .then(gmailInit)
        .catch(function (error) {
            console.error(error);
            process.exit();
        })
        .done(function() {
            console.log("Installation Complete");
            process.exit();
        }, function(err) {
            console.error("Installation failed: ", err);
            process.exit();
        });
    }
    else {
        console.error('Installation failed: could not boot app');
        process.exit();
    }
});
//         // var port = 8888;
//     if (bootParams.status === true) {
//         var adminRole = function(errorFn, completeFn) {
//             Role.findOne({title: 'admin'}).exec(function(err, role) {
//                 if (err) {
//                     errorFn(err);
//                 } else {
//                     if (!_.isUndefined(role) && !_.isNull(role)) {
//                         completeFn();
//                     } else {
//                         // Admin role does not exist. Create it.
//                         var adminRole = new Role();
//                         adminRole.title = 'admin';
//                         adminRole.save(function(err, role) {
//                             if (err) {
//                                 errorFn(err);
//                             } else {
//                                 completeFn();
//                             }
//                         });
//                     }
//                 }
//             });
//         };

//         var userRole = function(errorFn, completeFn) {
//             Role.findOne({title: 'user'}).exec(function(err, role) {
//                 if (err) {
//                     errorFn(err);
//                 } else {
//                     if (!_.isUndefined(role) && !_.isNull(role)) {
//                         completeFn();
//                     } else {
//                         // Admin role does not exist. Create it.
//                         var userRole = new Role();
//                         userRole.title = 'user';
//                         userRole.save(function(err, role) {
//                             if (err) {
//                                 errorFn(err);
//                             } else {
//                                 completeFn();
//                             }
//                         });
//                     }
//                 }
//             });
//         };

//         var adminUser = function(errorFn, completeFn) {
//             Role.findOne({title: 'admin'}).exec(function(err, role) {
//                 User.findOne({username: 'admin'}).exec(function(err, user) {
//                     if (err) {
//                         errorFn(err);
//                     } else {
//                         if (!_.isUndefined(user) && !_.isNull(user)) {
//                             console.log("Admin user already defined.  Would you like to reset this user (type 'yes' or 'no')?");
//                             var stdin = process.openStdin();
//                             stdin.on('data', function(chunk) { 
//                                 var answer = "" + chunk;
//                                 if (answer.match(/^y/i)) {
//                                     var newPassword = passwordUtils.generateSalt(12);
//                                     user.password = newPassword;
//                                     user.save(function(err, u) {
//                                         if (err) {
//                                             completeFn(err);
//                                         } else {
//                                             console.log("Created a new password for admin user:");
//                                             console.log("Username: " + u.username);
//                                             console.log("Password: " + newPassword);
//                                             console.log("NOTE: Please record this password as it is non-recoverable.  If you forget your admin password, you'll need to re-run this install script.");  
//                                             completeFn(null, u);
//                                         }
//                                     });
//                                 } else {
//                                     console.log("Ok - skipping creating an admin user");
//                                     completeFn();
//                                 }
//                             });
//                         } else {
//                             createNewUser('admin', role, function(err, user) {
//                                 if (err) {
//                                     errorFn(err);
//                                 } else {
//                                     completeFn();
//                                 }
//                             });
//                         }
//                     }
//                 });                
//             });
//         };

//         var createNewUser = function(username, role, completeFn) {
//             // Admin role does not exist. Create it.
//             var u = new User();
//             u.username = username;
//             u.role = role._id;
//             // Generate a new password that's 12 characters long.
//             var newPassword = passwordUtils.generateSalt(12);
//             u.password = newPassword;
//             u.save(function(err, u) {
//                 if (err) {
//                     completeFn(err);
//                 } else {
//                     console.log("Created a new user:");
//                     console.log("Username: " + u.username);
//                     console.log("Password: " + newPassword);
//                     console.log("NOTE: Please record this password as it is non-recoverable.  If you forget your admin password, you'll need to re-run this install script.");  
//                     completeFn(null, u);
//                 }
//             });
//         }
//         console.log("Ready to run install script");
//         adminRole(function(err) {
//             console.log("An error occurred creating the admin role during installation: " + err);
//             }, function() {
//                 console.log("Created the admin role");
//                 userRole(function(err) {
//                     console.log("An error occurred creating the user role during installation: " + err);
//                 }, function() {
//                     console.log("Created the user role");
//                     adminUser(function(err) {
//                         console.log("An error occurred while creating the admin user during installation: " + err);
//                     }, function() {
//                         console.log("Installation complete.");
//                         process.exit();
//                     }); 
//                 });
//             });
//     } else{
//         console.log("Unable to start the installation script.");
//     }
// });
