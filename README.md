twearjar
========

A Swear Jar for Twitter.

The Aim
=======

*    When someone follows the @twearjar Twitter handle, their username is placed into our database.
*    Over time, the bot monitors the tweets of users in the database and analyses the contents for any listed "bad" words.
*    Every time a tweet contains one of the words a counter is incremented for that account.
*    On a regular schedule, be it weekly or monthly, the score is totaled up and a link to donate the score amount in £ is generated and tweeted back to the person.

Techniques
==========

*    It polls for new followers every 5 minutes.
*    It polls tweets every 10 minutes.
*    It records the ID of the latest tweet so it doesn't constantly grab the entire tweet history.
*    After the time period is up, one counter is cleared, the total keeps counting.
*    If a user unfollows, they should be removed from the database.
