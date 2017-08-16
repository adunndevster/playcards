//other requires
var gulp = require("gulp");

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('../..')(server);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});






//generate card array
const cardsFolder = './public/decks/classic/';
const fs = require('fs');
var cardsobj = {
  bg: '',
  cardBacks: [],
  cards: []
}



//bg
fs.readdir(cardsFolder + "bg/", (err, files) => {
  cardsobj.bg = '/bg/' + files[0];
});

//cards
//card back
cardsobj.cardBacks.push({image: '/bg/card-back.png'});



fs.readdir(cardsFolder, (err, files) => {
  files.forEach(file => {
    if(file.indexOf('.png')>-1)
    {
      var card = new Object();
      card.image = file;
      card.back = "/bg/card-back.png";
      cardsobj.cards.push(card);
    }
    
  });

  console.log(cardsobj);
});




//obj examples
var card = {
  image:"Jack-1.png",
  back:"card-back.png",
  rotation: 23,
  x: 323,
  y: 174,
  faceUp:true
}

var pile = {
  cards: [], //just a stack array of cards
  rotation: 22,
  x: 113,
  y: 443,
  faceUp:false
}

var hand = {
  cards: [], //just an array of cards
}

var player = {
  hand: hand,
  name: "Jimmy",
  pos: 1,
  connected: true //this denotes that the player with this hand is online.
}


var table = {
  bg:"happy.png",
  piles: [], //just an array of piles
  cards: [], //an array of cards... because cards don't HAVE to be in piles
  players: [] //an array of players
}