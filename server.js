const express = require('express');
const morgan = require('morgan');
const bp = require('body-parser');
const ejs = require('ejs');
const engine = require('ejs-mate');

const session = require('express-session');
const flash = require('express-flash');
const cp = require('cookie-parser');

const userRouter = require('./routes/user');
const passport = require('./config/passport');
const config = require('./config/config');

const app = express();

app.use('/',express.static(__dirname+"/public"));

app.use(morgan('dev'));
app.use(bp.json());
app.use(bp.urlencoded({extended : true}));

app.use(cp(config.secretKey));
app.use(session({
    resave : true,
    saveUninitialized : true,
    secret : config.secretKey
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
   res.locals.user = req.user;
   next();
});

app.engine('ejs',engine);
app.set('view engine','ejs');

app.use(userRouter);

process.env.PORT = process.env.PORT || config.port;

app.listen(process.env.PORT,function(){
console.log("Server started on http://localhost:"+process.env.PORT);
});