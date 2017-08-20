//other requires
var gulp = require("gulp");

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('../..')(server);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

//redis fun times.
var pub = require('redis').createClient(6380,'playcards.redis.cache.windows.net', {auth_pass: 'f8bSDDP6Vl3C8vVw2zqUQ6aD+3li8Vpj2D9NtTJsPNc=', return_buffers: true});
var sub = require('redis').createClient(6380,'playcards.redis.cache.windows.net', {auth_pass: 'f8bSDDP6Vl3C8vVw2zqUQ6aD+3li8Vpj2D9NtTJsPNc=', return_buffers: true});

var redis = require('socket.io-redis');

//server
io.adapter(redis({pubClient: pub, subClient: sub}));

//localhost
//io.adapter(redis({ host: 'localhost', port: 6379 }));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  //do we already have a host? If so, get the state of the game from player 1,
  //and broadcast it back to all of the players.
  if(numUsers >= 1) //there is a host.
  {
    
  }

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


  // when a non-host player joins, they will ask for the state of the table.
  socket.on('get setup', function(){
    //send a message to the host, to round up the table state and broadcast it out.
    //for now, the host will be our source of truth.
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



//quick reference//////////////////
/*
socket.emit('message', "this is a test"); //sending to sender-client only
socket.broadcast.emit('message', "this is a test"); //sending to all clients except sender
socket.broadcast.to('game').emit('message', 'nice game'); //sending to all clients in 'game' room(channel) except sender
socket.to('game').emit('message', 'enjoy the game'); //sending to sender client, only if they are in 'game' room(channel)
socket.broadcast.to(socketid).emit('message', 'for your eyes only'); //sending to individual socketid
io.emit('message', "this is a test"); //sending to all clients, include sender
io.in('game').emit('message', 'cool game'); //sending to all clients in 'game' room(channel), include sender
io.of('myNamespace').emit('message', 'gg'); //sending to all clients in namespace 'myNamespace', include sender
socket.emit(); //send to all connected clients
socket.broadcast.emit(); //send to all connected clients except the one that sent the message
socket.on(); //event listener, can be called on client to execute on server
io.sockets.socket(); //for emiting to specific clients
io.sockets.emit(); //send to all connected clients (same as socket.emit)
io.sockets.on() ; //initial connection from a client.
*/