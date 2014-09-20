var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');



// TWITTER
var util = require('util'),
    twitter = require('twitter');
var twit = new twitter({
    consumer_key: 'JplMpBToraYFwcDuy9vumwR1d',
    consumer_secret: '5LJSXMEEu8nYTU7fSE2dcECNBtujtXsq6eXS3llai92uKdgulW',
    access_token_key: '2821769120-oMJYGrCtZFRB3yudx2dyXCdSOMAL2RAswtgZkqT',
    access_token_secret: 'StIf08gotStMfBY6onj0E3k68SVe2SsRfq7zH1WpmIWVC'
});

twit.get('/statuses/user_timeline.json', {user_id: "2821769120", screen_name: "twearjar"}, function(data) {
    // console.log(util.inspect(data));
    data.map(function(tweet) {
        console.log("TWEET", tweet.text);
    });
});
// END TWITTER

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
