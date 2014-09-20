var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// New Code
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/twearjar');

var routes = require('./routes/index');
var users = require('./routes/users');

var rudies = ["fuck","shit","piss","bitch","cunt","crap"]


// TWITTER
var util = require('util'),
    twitter = require('twitter');
var twit = new twitter({
    consumer_key: 'JplMpBToraYFwcDuy9vumwR1d',
    consumer_secret: '5LJSXMEEu8nYTU7fSE2dcECNBtujtXsq6eXS3llai92uKdgulW',
    access_token_key: '2821769120-oMJYGrCtZFRB3yudx2dyXCdSOMAL2RAswtgZkqT',
    access_token_secret: 'StIf08gotStMfBY6onj0E3k68SVe2SsRfq7zH1WpmIWVC'
});

function getTweets(user_id, last_id) {
    if(typeof(user_id)==='undefined') user_id = "2821769120";
    if(typeof(screen_name)==='undefined') screen_name = "twearjar";
    if(typeof(last_id)==='undefined') {
        twit.get('/statuses/user_timeline.json', {user_id: user_id}, function(data) {
            // console.log(util.inspect(data));
            data.reverse().map(function(tweet) {
                tweetStr = tweet.text;
                tweetId = tweet.id_str;
                //console.log("TWEET", tweet.text);
                //console.log("ID", tweet.id_str);
                analyseTweet(tweet.text, tweet.id_str);
            });
            //update latest_tweet_id in mongo
            console.log("Updating latest_tweet_id to:", tweetId)

        });
    } else {
        twit.get('/statuses/user_timeline.json', {user_id: user_id, screen_name: screen_name, since_id: last_id}, function(data) {
            // console.log(util.inspect(data));
            data.map(function(tweet) {
                //console.log("TWEET", tweet.text);
                //console.log("ID", tweet.id_str);
            });
        });
    }
}
// END TWITTER

function analyseTweet(tweet, tweet_id) {
    console.log("Analysing:", tweet)
    if (rudies.some(function(v) { return tweet.indexOf(v) >= 0; })) {
        console.log("Swearing Confirmed!");

        // Update Mongo to increase counter by one
    }
}

function keepThePeace() {
//Read mongo record where user_id matches
//  If latest_tweet_id == null:
//     getTweets(username)
//  else
//     getTweets(username, last_tweet_id)
getTweets();
}

//setTimeout(function() { keepThePeace(); }, 5000);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
