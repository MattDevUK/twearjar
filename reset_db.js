use twearjar;
db.usercollection.update({"username": "@twearjar"}, {$set:{"swearCount":0, "totalSwearCount":0}});
db.usercollection.remove({username:"@matthdevuk"});
db.usercollection.remove({username:"@matthdev"});
db.usercollection.remove({username:"@mattdevuk"});