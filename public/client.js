var socket = new io.Socket(null, {port: 3001});
socket.connect();

// Handle update from server
socket.on('message', function(msg){
  if(msg.event == 'new_card') {
    $("#my_nouns").append('<li>'+msg.data+'</li>');

  } else if(msg.event == 'add_user') {
   $("#user_list").append('<li id='+msg.data+'>'+msg.data+'</li>');

  } else if(msg.event == 'remove_user') {
    $("#"+msg.data).remove();

  } else { alert(msg) }
});

