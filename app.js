// Noun and adj list are fixtures for now
var nouns = ['speakers', 'oranges', 'sweaters', 'lamps', 'writing a blog', 'semicolons'];
var adjectives = ['loud', 'fun', 'nerdy'];

// Dependencies
var express = require('express'),
    io = require('socket.io'),
    ar = require('couch-ar'),
    jade = require('jade');

// Connect to database and load models from /models dir
ar.init({
  dbName: 'apples',
  root: __dirname + '/models'
}, function(db){ 
 
  // Ensure enough time for models to load
  setTimeout(1000);
});

// Setup express
var app = express.createServer(express.bodyParser());
app.set('view engine', 'jade');
app.set('view options', {layout: false});
app.use(express.static(__dirname + '/public'));
app.use(express.logger());

app.get('/', function(req, res){
  res.render('index');
});

app.listen(3001);

// Assign user a noun card
var deal_noun = function(user_id, client) {
  var word = nouns[Math.floor(Math.random()*nouns.length)];
  var new_noun = ar.Noun.create({word: word, user_id: user_id});
   
  new_noun.save(function(err, db_res){
    
    // Notify client of each card after save
    client.send({
      event: 'new_card',
      data: new_noun.word
    });
  });

};

// Assign user 7 cards
var deal_nouns = function(user_id, client) {
  for(var ndx = 0; ndx < 7; ndx++) {
    deal_noun(user_id, client);
  }
};

// Setup Socket.IO
var socket = io.listen(app);

socket.on('connection', function(client) {
  user = ar.User.create({
    name: client.sessionId,
    status: 'active'
  });
  
  // Add user to database, send relavent data to client
  user.save(function(err, db_res) {
 
    // Deal 7 cards
    deal_nouns(user.id, client);

    // Notify this client of other active clients
    ar.User.findAllByStatus('active', function(users) {
      users.forEach(function(other_user){
        client.send({
          event: 'add_user',
          data: other_user.name
        });
      })
    });

    // Notify other clients of this client
    client.broadcast({
      event: 'add_user',
      data: user.name
    });
  });

  // Update client status in db, alert other clients
  client.on('disconnect', function() {
    user.status = 'disconnected';
    user.save(function(err, db_res) {;
      socket.broadcast({
        event: 'remove_user',
        data: user.name
      });
    });    
  });

});
