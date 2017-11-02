const router = require('express').Router();
const passport = require('../config/passport');
const db = require('../db');
const async = require('async');

router.get('/',function (req, res) {
    if(req.user){
        db.findProfileById(req.user.id, function (err, user) {
            if(err) return next(err);
            res.render('mains/home',{
                user : user
            });
        });
    } else {
        res.render('mains/home');
    }
});

function checkLoggedIn(req, res, next) {
    if(req.user) {
        next();
    }
    else {
        res.redirect('/login');
    }
}

router.get('/people', function (req, res, next) {
    db.findAllUsers(function (err, people) {
        if(err) return next(err);
        if(req.user){
            db.findProfileById(req.user.id, function (err, user) {
                if(err) return next(err);
                db.findFriends(req.user.id, function (err, friends) {
                    if(err) return next(err);
                    friends = friends.map(function (value) {
                        return value.friend_id
                    });
                    db.findFriendsHelp(req.user.id, function (err, friendsHelp) {
                        if(err) return next(err);
                        friendsHelp = friendsHelp.map(function (value) {
                            return value.user_id
                        });
                        res.render('mains/people',{
                            user : user,
                            people : people,
                            friends : friends,
                            friendsHelp : friendsHelp
                        });
                    });
                });
            });
        } else {
            res.render('mains/people',{
                people : people
            });
        }
    });
});

router.post('/people',function (req, res, next) {
    db.sendRequest(req.body.user, req.body.profile, function (err) {
        if(err) return next(err);
        res.redirect('/people');
    });
});

router.post('/friends',function (req, res, next) {
    db.acceptRequest(req.body.user, req.body.friend, function (err) {
        if(err) return next(err);
        db.con.query('insert into friends(user_id,friend_id,pending) values('+req.body.friend+','+req.body.user+',false)',function (err) {
            if(err) next(err);
            res.redirect('/friends');
        });
    });
});

router.get('/friends',checkLoggedIn, function (req, res, next) {
    db.findProfileById(req.user.id, function (err, user) {
        if(err) return next(err);
        db.findFriendsHelp(req.user.id, function (err, friends) {
            if(err) return next(err);
            res.render('mains/friends',{
                user : user,
                friends : friends
            });
        });
    });
});

router.get('/profile',checkLoggedIn, function (req, res, next) {
    db.findProfileById(req.user.id, function (err, user) {
        if(err) return next(err);
        res.render('accounts/profile',{
            user : user
        });
    });
});

router.get('/wall', checkLoggedIn , function (req, res, next) {
    db.findProfileById(req.user.id, function (err, user) {
        if(err) return next(err);
        db.findStatus(function (err, status) {
            if(err) return next(err);
            db.findAcceptedFriends(req.user.id, function (err, friends) {
                if(err) return next(err);
                friends = friends.map(function (value) {
                    return value.friend_id
                });
                res.render('mains/wall',{
                    user : user,
                    status : status,
                    friends : friends
                });
            });
        });
    });
});

router.post('/wall', function (req, res, next) {
    let text = req.body.text;
    let type = req.body.type;
    db.addStatus(text, type,req.user.id, function (err) {
        if(err) return next(err);
        res.redirect('/wall');
    });
});

router.get('/login', function (req, res) {
    if(req.user)
        res.redirect('/profile');
    res.render('accounts/login',{
        message : req.flash('message')
    });
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/signup',function (req, res) {
    res.render('accounts/signup',{
        errors : req.flash('errors')
    });
});

router.post('/signup', function (req, res, next) {


    let userAdd = 'insert into user(username,password) values("'+req.body.username+'","'+req.body.password+'")';
    let profileAdd = 'insert into profile(firstname,lastname,dob,occupation,address_zip) values("'+req.body.name.split(" ")[0]+'","'+req.body.name.split(" ")[1]+'","'+req.body.dob+'","'+req.body.occupation+'","'+req.body.zip+'")';
    let addressAdd = 'insert into address(address_zip,address_district,address_city,address_state) values('+req.body.zip+',"'+req.body.district+'","'+req.body.city+'","'+req.body.state+'")';
    let addressCheck = 'select * from address where address_zip='+req.body.zip;

    async.waterfall([
        function (callback) {
            db.findUser(req.body.username, function (err, result) {
                if(err) return next(err);
                if(result.found){
                    req.flash('errors', 'Account with this username already exists.');
                    res.redirect('/signup');
                    return;
                }
                callback();
            });
        },
        function (callback) {
            db.con.query(profileAdd, function (err) {
                if(err) {
                    req.flash('errors', err.message);
                    res.redirect('/signup');
                    return;
                }
                callback();
            });
        },
        function (callback) {
            db.con.query(userAdd, function (err) {
                if(err) return next(err);
                callback();
            });
        },
        function () {
            db.con.query(addressCheck, function (err, result) {
                if(err) next(err);
                if(result.length<=0){
                    db.con.query(addressAdd, function (err) {
                        if(err) next(err);
                        req.flash('errors', 'Successful');
                        res.redirect('/signup');
                    });
                }
            });
        }
    ]);
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
});

module.exports = router;