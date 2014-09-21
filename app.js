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

var rudies = ["fuck","shit","piss","bitch","cunt","crap","dick","cock"];

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
        console.log("Result: Swearing Confirmed!");
        increaseUserSwearCount(user_id);
    } else {
        console.log("Result: Wow, you kept this one clean!");
    }
}

// Get users last tweets and analyse them for swear words
function getTweets(user_id, last_id) {
    if(typeof(user_id)==='undefined') user_id = "2821769120";
    if(typeof(screen_name)==='undefined') screen_name = "twearjar";
    if(typeof(last_id)==='undefined') {
        twit.get('/statuses/user_timeline.json', {user_id: user_id}, function(data) {
            //console.log(data);
            data.reverse().map(function(tweet) {
                tweetStr = tweet.text;
                tweetId = tweet.id_str;
                //console.log("TWEET", tweet.text);
                //console.log("ID", tweet.id_str);
                analyseTweet(user_id, tweet.text, tweet.id_str);
            });
            //update latest_tweet_id in mongo
            console.log("Updating latest_tweet_id to:", tweetId);
            updateLastTweetId(user_id, tweetId);

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

function getUserTwitterInfo(user_id, callback) {
    twit.get('/users/show.json', {user_id: user_id}, function(data) {
            //console.log("GETINFO-DATA",data);
            user_id = data.id_str;
            //console.log("GETINFO-USER_ID",user_id);
            username = data.screen_name;
            // console.log("GETINFO-USERNAME",username);
            var user_info = {
                "user_id": user_id, 
                "username": username.toLowerCase()
            };
            // console.log("USER_INFO:", user_info);
            callback(user_info);
    });
}


// Retrieve the users total swear count from database
function getUserSwearCount(user_id) {
    var users = db.get("usercollection");
    users.findOne({user_id: user_id}, function(e, doc) {
        // console.log("SwearCount:", doc.swearCount);
        swearCount = doc.swearCount;
        return swearCount;
    });
};

// Retrieve the user data from database
function getUserData(user_id) {
    var users = db.get("usercollection");
    users.findOne({user_id: user_id}, function(e, doc) {
        // console.log("DOCUMENT:", doc);
        return doc;
    });
}

function addUser(user_id) {
    var users = db.get("usercollection");
    console.log("ADD-USER_ID", user_id);
    users.count({user_id: user_id}, function(e, count) {
    console.log("ADD-COUNT", count);
    if (count === 0) {
        console.log("ADDING:", user_id);
        getUserTwitterInfo(user_id, function(info){
            console.log("USER_INFO2:", info);
            users.insert({user_id:info.user_id, username:"@"+info.username, swearCount:0, totalSwearCount:0})
            
        });
    }
    });
}

// Get list of IDs following account
function getFollowers(user_id) {
    console.log("user_id", user_id)
   twit.get('/followers/ids.json', {user_id: user_id}, function(data) {
    console.log("DATA", data)
    console.log("IDS",data.ids);
    var followers = data.ids;
    followers.forEach(function(follower) {
        console.log("FOLLOWER",follower);
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
// //Read mongo record where user_id matches
// //  If latest_tweet_id == null:
// //     getTweets(username)
// //  else
// //     getTweets(username, last_tweet_id)

    //var userdata = getUserData("2821769120");
    //console.log("data:", userdata);

    //var count = getUserSwearCount("2821769120");
    //console.log("Count",count);

    getTweets("2821769120");
    //getTweets("2821769120", "513358333106225152");
    //getFollowers("2821769120")
    //getUserTwitterInfo("2821769120")//
}



setTimeout(function() { keepThePeace(); }, 5000);

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
