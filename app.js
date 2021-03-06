//other requires
var gulp = require("gulp");

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('../..')(server);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var roomsObj = new Object();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (player) {
    if (addedUser) return;

    socket.username = player.name;
    socket.room = player.room;
    if(roomsObj[socket.room] === undefined) roomsObj[socket.room] = {hostId: null, numUsers:0};

    ++roomsObj[socket.room].numUsers;
    addedUser = true;
    socket.join(player.room);
    console.log(socket.username + ' joined the room "' + socket.room + '"');
    socket.emit('login', {
      numUsers: roomsObj[socket.room].numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.room).emit('user joined', {
      player: player,
      numUsers: roomsObj[socket.room].numUsers
    });

    // we store the username in the socket session for this client
    //do we already have a host? If so, get the state of the game from player 1,
    //and broadcast it back to all of the players.
    console.log(roomsObj[socket.room].hostId);
    if(roomsObj[socket.room].hostId === null) //there is a host.
    {
      roomsObj[socket.room].hostId = socket.id;
      console.log('new host for room "' + socket.room + '", ' + roomsObj[socket.room].hostId);
      console.log(JSON.stringify(roomsObj));
      //io.to(hostId).emit('secret', 'for your eyes only');
    }
  });


  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --roomsObj[socket.room].numUsers;
      
      if(roomsObj[socket.room].hostId == socket.id || roomsObj[socket.room].numUsers === 0)
      {
        roomsObj[socket.room].hostId = null;
        
        //now audition for a new host.
        socket.broadcast.to(socket.room).emit('auditions');
      } 

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: roomsObj[socket.room].numUsers
      });
    }
  });


  socket.on('sign me up', function(){
    
    if(roomsObj[socket.room].hostId == null)
    {
      roomsObj[socket.room].hostId = socket.id;
      io.to(socket.id).emit('assign host');
    }
  });

  // when a non-host player joins, they will ask for the state of the table.
  socket.on('setup table', function(table){

    //for now, the host will be our source of truth.
    socket.broadcast.to(socket.room).emit('synchronize tables', {
      table: table
    });
  });

  socket.on('update table', function(table){
    console.log('room: ' + socket.room);
    //for now, the host will be our source of truth.
    socket.broadcast.to(socket.room).emit('synchronize tables', {
      table: table
    });
  })
});






//generate card array
const cardsFolder = './public/decks/classic/';
const fs = require('fs');
var cardsobj = {
  bg: '',
  images: new Object(),
  cardBacks: [],
  cards: []
}



//bg
fs.readdir(cardsFolder + "bg/", (err, files) => {
  cardsobj.bg = '/bg/bg.png';
});

//images
fs.readdir(cardsFolder + "images/", (err, files) => {
  cardsobj.images.handOfCards = '/images/HandOfCards.png';
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

  fs.writeFile("./cardz.txt", JSON.stringify(cardsobj, null, "\t"), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 


  //console.log(cardsobj);
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
  spot: 1,
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