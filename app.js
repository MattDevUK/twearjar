var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/twearjar');

var routes = require('./routes/index');
var users = require('./routes/users');

var interval = 60000;

var rudies = ["damn","hell","bloody","shit","crap","fuck","bitch","cunt"];

// TWITTER AUTH
var util = require('util'),
    twitter = require('twitter');
var twit = new twitter({
    consumer_key: 'JplMpBToraYFwcDuy9vumwR1d',
    consumer_secret: '5LJSXMEEu8nYTU7fSE2dcECNBtujtXsq6eXS3llai92uKdgulW',
    access_token_key: '2821769120-oMJYGrCtZFRB3yudx2dyXCdSOMAL2RAswtgZkqT',
    access_token_secret: 'StIf08gotStMfBY6onj0E3k68SVe2SsRfq7zH1WpmIWVC'
});


// Increase the users total swear count in database
function increaseUserSwearCount(user_id) {
    var users = db.get("usercollection");
    users.findAndModify({user_id: user_id}, { $inc: {swearCount: 1, totalSwearCount: 1} });
}

// Check tweet contents for swear words, if found, increase counter
function analyseTweet(user_id, tweet, tweet_id) {
    console.log("Analysing: '"+tweet+"'");
    if (rudies.some(function(v) { return tweet.indexOf(v) >= 0; })) {
        console.log("Result: Obscenities Confirmed!\n");
        increaseUserSwearCount(user_id);
    } else {
        console.log("Result: Wow, you kept this one clean!\n");
    }
}

// Get user's last tweets and analyse them for swear words
function getTweets(user_id, last_id) {
    if(typeof(user_id)==='undefined') user_id = "2821769120";
    if(typeof(last_id)==='undefined') {
        console.log("Reading Tweets for "+user_id+"...\n");
        twit.get('/statuses/user_timeline.json', {user_id: user_id}, function(data) {
            if (data.length < 1) {
                console.log("No new tweets from "+user_id+"!");
                interval = interval * 2;
            } else {
                data.reverse().map(function(tweet) {
                    tweetStr = tweet.text;
                    tweetId = tweet.id_str;
                    analyseTweet(user_id, tweetStr, tweetId);
                });
                //update latest_tweet_id in mongo
                console.log("Updating latest_tweet_id to:", tweetId, "for:", user_id);
                updateLastTweetId(user_id, tweetId);
            }
        });
    } else {
        console.log("Reading Tweets for "+user_id+" since "+last_id+"...\n");
        twit.get('/statuses/user_timeline.json', {since_id:last_id,user_id:user_id}, function(data) {
            if (data.length < 1) {
                console.log("No new tweets from "+user_id+"!");
                interval = interval * 2;
            } else {
                data.map(function(tweet) {
                    tweetStr = tweet.text;
                    tweetId = tweet.id_str;
                    analyseTweet(user_id, tweetStr, tweetId);
                });
                //update latest_tweet_id in mongo
                console.log("Updating latest_tweet_id to:", tweetId, "for:", user_id);
                updateLastTweetId(user_id, tweetId);
            }
        });
    }
}

// Get specific user's Twitter info from API
function getUserTwitterInfo(user_id, callback) {
    twit.get('/users/show.json', {user_id: user_id}, function(data) {
            user_id = data.id_str;
            username = data.screen_name;
            var user_info = {
                "user_id": user_id, 
                "username": username.toLowerCase(),
                "last_tweet_id": data.status.id_str
            };
            callback(user_info);
    });
}


// Retrieve the users total swear count from database
function getUserSwearCount(user_id) {
    var users = db.get("usercollection");
    users.findOne({user_id: user_id}, function(e, doc) {
        swearCount = doc.swearCount;
        return swearCount;
    });
}

// Retrieve the user data from database
function getUsersData(fieldsArr, callback) {
    var users = db.get("usercollection");
    var fields = fieldsArr.join().replace(/,/g," ");
    users.find({},fields, function(e, doc) {
        callback(doc);
    });
}

// Check if user already exists, otherwise add them
function addUser(user_id) {
    var users = db.get("usercollection");
    users.count({user_id: user_id}, function(e, count) {
    if (count === 0) {
        console.log("ADDING USER:", user_id);
        getUserTwitterInfo(user_id, function(info){
            users.insert({
                user_id:info.user_id,
                username:"@"+info.username,
                swearCount:0,
                totalSwearCount:0,
                last_tweet_id:info.last_tweet_id
            });
        });
    } else {
        console.log("User: "+user_id+" already exists in the system");
    }
    });
}

// Get list of IDs following account
function getFollowers(user_id) {
    console.log("Checking for new followers");
    twit.get('/followers/ids.json', {user_id: user_id}, function(data) {
        var followers = data.ids;
        followers.forEach(function(follower) {
            addUser(String(follower), function(callback) {
                callback();
            });
        });
    }); 
}


// Update last_tweet_id in database
function updateLastTweetId(user_id, last_tweet_id) {
    var users = db.get("usercollection");
    users.findAndModify({user_id: user_id}, { $set: {last_tweet_id: last_tweet_id} });
}

// Main function
function keepThePeace() {
    console.log("Interval: "+interval);
    // Check for new followers
    getFollowers("2821769120");

    // For each user in the DB, check tweets
    getUsersData(['user_id','last_tweet_id'],function(users) {
        users.forEach(function(user) {
            if (typeof user.last_tweet_id === 'undefined') {
                getTweets(user.user_id);
            } else {
                getTweets(user.user_id, user.last_tweet_id);
            }
        });
    });
}

// Set timeout on main function to make it repeat
setInterval(function() { keepThePeace(); }, interval);






























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

//keepThePeace();

module.exports = app;
