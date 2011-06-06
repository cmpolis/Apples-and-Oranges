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

//Assign user 7 cards
var deal_nouns = function(user_id, client) {
  for(var ndx = 0; ndx < 7; ndx++) {
    deal_noun(user_id, client);
  }
};

var socket = io.listen(app);

socket.on('connection', function(client){
  user = ar.User.create({name: client.sessionID});
  user.save(function(err, db_res){
    deal_nouns(user.id, client);
  });

});
