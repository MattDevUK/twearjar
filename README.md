twearjar
========

A Swear Jar for Twitter.

The Aim
=======

*    When someone follows the `@twearjar` Twitter handle, their username is placed into our Mongo database. `getFollowers("2821769120") [RATE LIMITED]`.
*    Over time, the bot monitors the tweets of users in the database and analyses the contents for any listed "bad" words. `getTweets("2821769120")`
*    Every time a tweet contains one of the words a counter is incremented for that account. `increaseUserSwearCount(<USER_ID>)`
*    On a regular schedule, be it weekly or monthly, the score is totaled up and a link to donate the score amount in £ is generated and tweeted back to the person. `Not Implemented`

Techniques
=======

*    It polls for new followers every 5 minutes. `Not Implemented`
*    It polls tweets every 10 minutes. `Not Implemented`
*    It records the ID of the latest tweet so it doesn't constantly grab the entire tweet history. `updateLastTweetId(<USER_ID>, <LAST_TWEET_ID>)`
*    After the time period is up, one counter is cleared, the total keeps counting. `Not Implemented`
*    If a user unfollows, they should be removed from the database. `Not Implemented`

Usage
====

Dependencies
---------------------

*    NodeJS
*    NPM
*    MongoDB

Steps
--------

*    Clone this repo with ` git clone git@github.com:MattDevUK/twearjar.git`
*    Run `npm install` inside the directory.
*    Run `npm start` to start the app.