$(function(){

var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username

var game = new Phaser.Game(960, 540, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update });
var cardKeys = [];

function preload() {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.setMinMax(400, 225, 1920, 1080);

  var basePath = '/decks/classic/';
  

  //bg
  game.load.image('bg', basePath + cardPaths.bg);

  //now get all of the cards...
  cardPaths.cards.forEach(file => {
    var imgKey = file.replace('.png', '');
    cardKeys.push(imgKey);
    game.load.image(imgKey, basePath + file);
  });
  
}

function create() {
 var bg = game.add.sprite(0, 0, 'bg');
 bg.inputEnabled = true;
 bg.events.onInputDown.add(doSomething, this);
 bg.events.onInputUp.add(doSomething, this);

 for(var i=0; i<cardKeys.length; i++)
  {
    var cardKey = cardKeys[i];
    var sprite = game.add.sprite(i*2, i*2, cardKey);
    sprite.scale.setTo(.12, .12);
    sprite.smoothed = true;
    sprite.cacheAsBitmap = true;

    sprite.inputEnabled = true;
    sprite.input.enableDrag(true, true, false, 255, null, bg);
    //sprite.input.enableSnap(46, 65, true);

    //draw a rectangle
    var graphics = game.add.graphics(100, 100);
    graphics.beginFill(0xFF3300);
    graphics.lineStyle(2, 0x0000FF, 1);
    graphics.drawRect(50, 250, 100, 100);
    window.graphics = graphics;
    
    



  }

  function doSomething() {

    console.log('mouse is doing something');

  }

}

function update() {
}


// var FADE_TIME = 150; // ms
// var TYPING_TIMER_LENGTH = 400; // ms
// var COLORS = [
//   '#e21400', '#91580f', '#f8a700', '#f78b00',
//   '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
//   '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
// ];


  var $loginPage = $('.login.page'); // The login page
  var $gamePage = $('.game.page'); // The game page

  // Prompt for setting a username
  var username;
  var connected = false;
  //var typing = false;
  //var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  // function addParticipantsMessage (data) {
  //   var message = '';
  //   if (data.numUsers === 1) {
  //     message += "there's 1 participant";
  //   } else {
  //     message += "there are " + data.numUsers + " participants";
  //   }
  //   log(message);
  // }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $gamePage.show();
      $loginPage.off('click');

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Sends a chat message
  // function sendMessage () {
  //   var message = $inputMessage.val();
  //   // Prevent markup from being injected into the message
  //   message = cleanInput(message);
  //   // if there is a non-empty message and a socket connection
  //   if (message && connected) {
  //     $inputMessage.val('');
  //     addChatMessage({
  //       username: username,
  //       message: message
  //     });
  //     // tell server to execute 'new message' and send along one parameter
  //     socket.emit('new message', message);
  //   }
  // }

  // Adds the visual chat message to the message list
  // function addChatMessage (data, options) {
  //   // Don't fade the message in if there is an 'X was typing'
  //   var $typingMessages = getTypingMessages(data);
  //   options = options || {};
  //   if ($typingMessages.length !== 0) {
  //     options.fade = false;
  //     $typingMessages.remove();
  //   }

  //   var $usernameDiv = $('<span class="username"/>')
  //     .text(data.username)
  //     .css('color', getUsernameColor(data.username));
  //   var $messageBodyDiv = $('<span class="messageBody">')
  //     .text(data.message);

  //   var typingClass = data.typing ? 'typing' : '';
  //   var $messageDiv = $('<li class="message"/>')
  //     .data('username', data.username)
  //     .addClass(typingClass)
  //     .append($usernameDiv, $messageBodyDiv);

  //   addMessageElement($messageDiv, options);
  // }

  // // Adds the visual chat typing message
  // function addChatTyping (data) {
  //   data.typing = true;
  //   data.message = 'is typing';
  //   addChatMessage(data);
  // }

  // // Removes the visual chat typing message
  // function removeChatTyping (data) {
  //   getTypingMessages(data).fadeOut(function () {
  //     $(this).remove();
  //   });
  // }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  // function addMessageElement (el, options) {
  //   var $el = $(el);

  //   // Setup default options
  //   if (!options) {
  //     options = {};
  //   }
  //   if (typeof options.fade === 'undefined') {
  //     options.fade = true;
  //   }
  //   if (typeof options.prepend === 'undefined') {
  //     options.prepend = false;
  //   }

  //   // Apply options
  //   if (options.fade) {
  //     $el.hide().fadeIn(FADE_TIME);
  //   }
  //   if (options.prepend) {
  //     $messages.prepend($el);
  //   } else {
  //     $messages.append($el);
  //   }
  //   $messages[0].scrollTop = $messages[0].scrollHeight;
  // }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  // function updateTyping () {
  //   if (connected) {
  //     if (!typing) {
  //       typing = true;
  //       socket.emit('typing');
  //     }
  //     lastTypingTime = (new Date()).getTime();

  //     setTimeout(function () {
  //       var typingTimer = (new Date()).getTime();
  //       var timeDiff = typingTimer - lastTypingTime;
  //       if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
  //         socket.emit('stop typing');
  //         typing = false;
  //       }
  //     }, TYPING_TIMER_LENGTH);
  //   }
  // }

  // Gets the 'X is typing' messages of a user
  // function getTypingMessages (data) {
  //   return $('.typing.message').filter(function (i) {
  //     return $(this).data('username') === data.username;
  //   });
  // }

  // Gets the color of a username through our hash function
  // function getUsernameColor (username) {
  //   // Compute hash code
  //   var hash = 7;
  //   for (var i = 0; i < username.length; i++) {
  //      hash = username.charCodeAt(i) + (hash << 5) - hash;
  //   }
  //   // Calculate color
  //   var index = Math.abs(hash % COLORS.length);
  //   return COLORS[index];
  // }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  // $inputMessage.on('input', function() {
  //   updateTyping();
  // });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  // $inputMessage.click(function () {
  //   $inputMessage.focus();
  // });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    // log(message, {
    //   prepend: true
    // });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });

});

























































