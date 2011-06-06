// Noun and adj list are fixtures for now
var nouns = ['speakers', 'oranges', 'sweaters', 'lamps', 'writing a blog', 'semicolons'];
var adjectives = ['loud', 'fun', 'nerdy'];

var express = require('express');
var io = require('socket.io');

// Connect to database and load models from /models dir
var ar = require('couch-ar')
ar.init({
  dbName: 'apples',
  root: __dirname + '/models'
}, function(db){ 
  // Ensure enough time for models to load
  setTimeout(1000);
});

// Setup express
var app = express.createServer(express.bodyParser());

// Game logic functions

// Assign user 7 noun cards
var deal_nouns = function(user_id, client) {
  for(var ndx = 0; ndx < 7; ndx++) {
    var word = nouns[Math.floor(Math.random()*nouns.length)];
    var new_noun = ar.Noun.create({word: word, user_id: user_id});
    
    new_noun.save(function(err, db_res){});
    
    // Notify on client side
    client.send({
      event: 'new_card',
      data: new_noun.word
    });
  }
}

//Setup game


require('jade');
app.set('view engine', 'jade');
app.set('view options', {layout: false});
app.use(express.logger());

app.get('/', function(req, res){
  res.render('index');
});


app.listen(3001);

var socket = io.listen(app);

socket.on('connection', function(client){
  console.log('user has connected');
  console.log(client.ip);

  user = ar.User.create({name: client.sessionID});
  user.save(function(err, db_res){
    deal_nouns(user.id, client);
  });

});
