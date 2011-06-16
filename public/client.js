$(function() {

  function event_obj(event_name, data_obj) {
    return { event: event_name,
              data: data_obj };
  }

  // Socket.IO
  var socket = new io.Socket(null, {port: 3009});
  socket.connect();

  // Backbone
  var Noun = Backbone.Model.extend();
  
  var NounCollection = Backbone.Collection.extend({
    model: Noun
  });
  var userNouns = new NounCollection();
  
  var NounView = Backbone.View.extend({
    tagName: 'li',

    events: {
      'click span.play_noun': 'play'
    },

    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'play');
    
      this.model.bind('remove', this.unrender);
    },
    render: function(){
      $(this.el).html(this.model.get('word')+' <span class="play_noun">Play</span>');
      $(this.el).children('.play_noun').hide();
      return this;
    },
    unrender: function(){
      $(this.el).remove();
    },
    play: function(){
      userNounView.disablePlay();
      socket.send(event_obj('play_card', this.model.id));
    }
  });

  var NounListView = Backbone.View.extend({
    el: $('#my_nouns'),
    initialize: function(){ 
      _.bindAll(this, 'appendNoun');

      this.collection = userNouns;    
      this.collection.bind('add', this.appendNoun);
    },
    appendNoun: function(noun) {
      var nounView = new NounView({
        model: noun
      });
      this.el.append(nounView.render().el);
    },
    enablePlay: function() {
      $('.play_noun').show();
    },
    disablePlay: function() {
      $('.play_noun').hide();
    }
  });
  var userNounView = new NounListView();
 
  var User = Backbone.Model.extend();
  
  var UserCollection = Backbone.Collection.extend({
    model: User
  });
  var users = new UserCollection();

  var UserView = Backbone.View.extend({
    tagName: 'li',
    initialize: function(){
      _.bindAll(this, 'render', 'unrender');

      this.model.bind('remove', this.unrender);
    },
    render: function(){
      $(this.el).html(this.model.get('name'));
      return this;
    },
    unrender: function(){
      $(this.el).remove();
    }
  });

  var UserListView = Backbone.View.extend({
    el: $('#user_list'),
    initialize: function(){
      _.bindAll(this, 'appendUser');
  
      this.collection = users;
      this.collection.bind('add', this.appendUser);
    },
    appendUser: function(user) {
      var userView = new UserView({
        model: user
      });
      this.el.append(userView.render().el);
    },
  });
  var usersListView = new UserListView();
  
  var PlayedNoun = Backbone.Model.extend();
  
  var PlayedNounCollection = Backbone.Collection.extend({
    model: PlayedNoun
  });
  var nounPile = new PlayedNounCollection();
  
  var PlayedNounView = Backbone.View.extend({
    tagName: 'li',

    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'reveal');

      this.model.view = this;
      this.model.bind('remove', this.unrender);
    },
    render: function(){
      $(this.el).html('Facedown card');
      return this;
    },
    unrender: function(){
      $(this.el).remove();
    },
    reveal: function(){
      $(this.el).html(this.model.get('word'));
    }
  });

  var NounPileView = Backbone.View.extend({
    el: $('#played_nouns'),
    initialize: function(){ 
      _.bindAll(this, 'appendNoun');

      this.collection = nounPile;    
      this.collection.bind('add', this.appendNoun);
    },
    appendNoun: function(noun) {
      var nounView = new PlayedNounView({
        model: noun
      });
      this.el.append(nounView.render().el);
    },
  });
  var nounPileView = new NounPileView();
 
  // Handle update from server
  socket.on('message', function(msg){
    if(msg.event == 'new_card') {
      var noun = new Noun({word: msg.data.word, id: msg.data.id});
      userNouns.add(noun);

    } else if(msg.event == 'add_user') {
      var user = new User({name: msg.data.name, id: msg.data.id});
      users.add(user);

    } else if(msg.event == 'remove_user') {
      users.remove(msg.data);

    } else if(msg.event == 'remove_card') {
      userNouns.remove(msg.data);

    } else if(msg.event == 'mode_playing') {
      nounPile.remove(nounPile.models.slice(0));
      userNounView.enablePlay();
      $('#adj').html(msg.data.word);
      $('#judge').html(msg.data.judge);

    } else if(msg.event == 'mode_judging') {
      userNounView.disablePlay();
      nounPile.each(function(noun){
        noun.view.reveal();
      });
    
    } else if(msg.event == 'add_to_pile') {
      nounPile.add(new PlayedNoun(msg.data));

    } else { alert(msg) }
  });

  
});
