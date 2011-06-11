$(function() {

  // Backbone
  var Noun = Backbone.Model.extend();
  
  var NounCollection = Backbone.Collection.extend({
    model: Noun
  });
  var userNouns = new NounCollection();
  
  var NounView = Backbone.View.extend({
    tagName: 'li',
    initialize: function(){
      _.bindAll(this, 'render');
    },
    render: function(){
      $(this.el).html(this.model.get('word'));
      return this;
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
  

  // Socket.IO
  var socket = new io.Socket(null, {port: 3001});
  socket.connect();

  // Handle update from server
  socket.on('message', function(msg){
    if(msg.event == 'new_card') {
      var noun = new Noun({word: msg.data});
      userNouns.add(noun);

    } else if(msg.event == 'add_user') {
      var user = new User({name: msg.data.name, id: msg.data.id});
      users.add(user);

    } else if(msg.event == 'remove_user') {
      users.remove(msg.data);

    } else { alert(msg) }
  });

  
});

