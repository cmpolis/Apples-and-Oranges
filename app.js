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

// Helper functions
function event_obj(event_name, data_obj) {
  return { event: event_name,
           data: data_obj };
}

var adj; // Adjective that is in play

// Assign user a noun card
var deal_noun = function(user_id, client) {
  var word = nouns[Math.floor(Math.random()*nouns.length)];
  var new_noun = ar.Noun.create({word: word, user_id: user_id});
   
  new_noun.save(function(err, db_res){
    
    // Notify client of each card after save
    client.send(event_obj('new_card', {
      id: new_noun.id, 
      word: new_noun.word,
      status: 'in_hand'
    }));
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

// Handle socket events
socket.on('connection', function(client) {
  var user = ar.User.create({
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
        client.send(event_obj('add_user', {
          id: other_user.id, 
          name: other_user.name
        }));
      });
    });

    // Notify other clients of this client
    client.broadcast(event_obj('add_user', {
      id: user.id, 
      name: user.name
    }));
  });

  // Update client status in db, alert other clients
  client.on('disconnect', function() {
    user.status = 'disconnected';
    user.save(function(err, db_res) {
      socket.broadcast(event_obj('remove_user', user.id));
    });    
  });
  
  // Respond to updates from client
  client.on('message', function(msg) {
 
    // User picks a noun card 
    if(msg.event == 'play_card') {
      
      // Update noun card
      ar.Noun.findById(msg.data, function(card) {
        card.status = 'played';
        card.adj_id = adj.id;
        card.save(function(err,res){ });         
        client.send(event_obj('remove_card', card.id));

        // Place card in pile
        socket.broadcast(event_obj('add_to_pile', {id: card.id, word: card.word}));
      });
      deal_noun(user.id, client);
    
    // Judge picks winning card
    } else if(msg.event == 'judge_pick') {
    
    } else { console.log(msg) }
  });

});

// Game processes
var mode; // ie: waiting, playing, judging
var playInt, judgeInt;

// while(true) {
  // Start in waiting mode, wait 30 sec
  mode = 'waiting';

function start_judge_timer(){
  judgeInt = setInterval(function(){
    mode = 'judging';
    console.log("MODE CHANGED TO PLAYING");

    // Create an adjective(game) object - choose adj and judge
    var word = adjectives[Math.floor(Math.random()*adjectives.length)];
    ar.User.findAllByStatus('active', function(users) {

      var user = users[Math.floor(Math.random()*users.length)];

      adj = ar.Adj.create({
        word: word, 
        judge_id: user.id,
        status: 'playing'
      });

      adj.save(function(err, db_res){ });
      
      console.log("  word: " + word);
      console.log("  judge: " + user.name);

      socket.broadcast(event_obj('mode_playing',{
        judge: user.name,
        word: word
      }));
    });

    start_play_timer();
    clearInterval(judgeInt);
  }, 10000);
}

function start_play_timer(){
  playInt = setInterval(function(){
    mode = 'judging';
    console.log("MODE CHANGED TO JUDGING");
   
    // Notify client, reveal cards
    socket.broadcast(event_obj('mode_judging',''));

    start_judge_timer();
    clearInterval(playInt);
  }, 10000);
}

start_play_timer();

  // Go into selection mode 
  // Enable users to pick a card
  // Set timer
  // Handle event if all active users have selected or timer is triggered

  // Switch to judging mode
  // Enable judge to pick card
  // Set timer
  // Handle event if judge picks a card or timer is triggered
// }
