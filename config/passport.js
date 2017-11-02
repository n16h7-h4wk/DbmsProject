const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const db = require('../db.js');

passport.serializeUser(function (user, done) {
    return done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    db.findById(id, function (err, res) {
        if(err) done(err);
        if(!res.found) return done({err : "Not found."});
        return done(null, res);
    });
});


passport.use('local-login', new localStrategy({
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true
}, function (req, username, password, done) {

    db.findUser(username, function (err, res) {
        if(err) return done(err);

        if(!res.found){
            console.log('Login : No User');
            return done(null, false, req.flash('loginMessage','No user has been found'));
        }

        if(password !== res.password){
            console.log('Login : Wrong Password');
            return done(null, false, req.flash('loginMessage','Oops! Wrong Password'));
        }

        console.log('Access Granted');
        return done(null, res);
    });

}));

module.exports = passport;