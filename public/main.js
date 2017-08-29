$(function(){

//top level object
var table = {
  players: [],
  tableCards: [], //an array of cards... because cards don't HAVE to be in piles
  openSpots: [1,2,3,4,5,6]
}
var player = {
  name: username,
  hand: [],
  spot: -1,
  spotCards: [] //the cards that are sitting on this player's place mat.
}

//players can contain hands and dragGroups. 

var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username

var game = new Phaser.Game(960, 540, Phaser.CANVAS, 'gameContainer', { preload: preload, create: create, update: update });
var isHost = false;
var bg, handArea;
const CARD_SCALE = .3;
var deckInfo = [];
var cardSelectionRect; //The drag selection rectangle.
var rectStartPoint = new Phaser.Point(0,0);
var rectMouseDown = false;
var cardSelectionPosition;
var selectionDidChange = false;
var tableGroup, dragGroup, handGroup, actionButtonGroup;
var dragArray = [], allCardSprites = [];

function preload() {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.setMinMax(400, 225, 1920, 1080);

  var basePath = '/decks/classic/';
  
  //bg
  game.load.image('bg', basePath + cardPaths.bg);

  //hand hit area
  game.load.image('hitArea', 'images/hitArea.png');

  //buttons
  game.load.image('btnStagger', 'images/btnStagger.png');
  game.load.image('btnShuffle', 'images/btnShuffle.png');
  game.load.image('btnFlip', 'images/btnFlip.png');
  game.load.image('btnDeckify', 'images/btnDeckify.png');
  game.load.image('btnDeal', 'images/btnDeal.png');

  //load the card back textures
  //now get all of the cards...
  cardPaths.cardBacks.forEach(card => {
    game.load.image(card.image.replace('.png', ''), basePath + card.image);
  });

  //now get all of the cards...
  cardPaths.cards.forEach(card => {
    deckInfo.push(card);
    game.load.image(card.image.replace('.png', ''), basePath + card.image);
  });
  
}

function create() {
 bg = game.add.sprite(0, 0, 'bg');
 bg.inputEnabled = true;
 bg.events.onInputDown.add(bg_Mouse_Down, this);
 game.input.addMoveCallback(bg_Mouse_Move, this);
 bg.events.onInputUp.add(bg_Mouse_Up, this);
 bg.cacheAsBitmap = true;
 bg.smoothed = true;
  
//hand area
handArea = game.add.sprite(0, 0, 'hitArea');
handArea.width = bg.width/3;
handArea.height = 40;
handArea.inputEnabled = true;
handArea.input.useHandCursor = true;
handArea.anchor = new Phaser.Point(.5, 0);
handArea.x = bg.width/2;
handArea.y = bg.height - handArea.height;

 tableGroup = game.add.group();
 handGroup = game.add.group();
 dragGroup = game.add.group();
 actionButtonGroup = game.add.group();

 //action buttons
addActionButtons();

 for(var i=0; i<deckInfo.length; i++)
  {
    var cardKey = deckInfo[i].image.replace('.png', '');
    var sprite = game.add.sprite(i*2, i*2, cardKey);
    sprite.id = i;
    allCardSprites.push(sprite);
    tableGroup.add(sprite);
    sprite.anchor = new Phaser.Point(.5, .5);
    sprite.scale.setTo(CARD_SCALE, CARD_SCALE);
    //added properties for this card game.
    sprite.front = deckInfo[i].image.replace('.png', '');
    sprite.back = deckInfo[i].back.replace('.png', '');
    sprite.isFaceUp = true;

    sprite.inputEnabled = true;
    sprite.input.enableDrag(false, true, false, 255, null, bg);
    //sprite.input.enableSnap(46, 65, true);

    // Click events
    sprite.events.onInputDown.add(card_OnDown);
    sprite.events.onInputUp.add(card_OnUp);

    //  Drag events
    sprite.events.onDragUpdate.add(dragUpdate);
    sprite.events.onDragStop.add(dragStop);
  }

}

//ACTION BUTTONS/////////////////////
function addActionButtons()
{
  const gap = 20;

  var btnStagger = game.add.sprite(0, 0, 'btnStagger');
  btnStagger.x = bg.width - btnStagger.width - gap;
  btnStagger.y = gap;
  btnStagger.inputEnabled = true;
  btnStagger.events.onInputUp.add(btnStagger_Up);

  var btnShuffle = game.add.sprite(0, 0, 'btnShuffle');
  btnShuffle.x = bg.width - ((btnStagger.width + gap) * 2);
  btnShuffle.y = gap;
  btnShuffle.inputEnabled = true;
  btnShuffle.events.onInputUp.add(btnShuffle_Up);

  var btnFlip = game.add.sprite(0, 0, 'btnFlip');
  btnFlip.x = bg.width - ((btnStagger.width + gap) * 3);
  btnFlip.y = gap;
  btnFlip.inputEnabled = true;
  btnFlip.events.onInputUp.add(btnFlip_Up);

  var btnDeckify = game.add.sprite(0, 0, 'btnDeckify');
  btnDeckify.x = bg.width - ((btnStagger.width + gap) * 4);
  btnDeckify.y = gap;
  btnDeckify.inputEnabled = true;
  btnDeckify.events.onInputUp.add(btnDeckify_Up);

  var btnDeal = game.add.sprite(0, 0, 'btnDeal');
  btnDeal.x = bg.width - ((btnStagger.width + gap) * 5);
  btnDeal.y = gap;
  btnDeal.inputEnabled = true;
  btnDeal.events.onInputUp.add(btnDeal_Up);

  actionButtonGroup.add(btnStagger);
  actionButtonGroup.add(btnShuffle);
  actionButtonGroup.add(btnFlip);
  actionButtonGroup.add(btnDeckify);
  actionButtonGroup.add(btnDeal);

  actionButtonGroup.alpha = 0;
}

function btnStagger_Up(){

  deckify();

  const heightArea = 150;
  var gap = heightArea / dragArray.length;

  var counter = 0;
  var minY = dragArray.sort(function (a, b) {
    return a.y - b.y;
    })[0].y;
  dragArray.forEach(function(sprite)
  {
    game.add.tween(sprite).to( {y: minY + (gap * counter)}, 250, "Sine", true, 0);
    counter++;

    tableGroup.add(sprite);
    dragGroup.add(sprite);
  });

  selectionDidChange = true;

}

function btnShuffle_Up(){
  deckify();
  shuffle(dragArray);
  
  
}

function btnFlip_Up(){
  dragArray.forEach(function(sprite)
  {
    flipCard(sprite);
  });

  selectionDidChange = true;
}

function btnDeckify_Up(){
  deckify();

  selectionDidChange = true;
}
function deckify()
{
  var midPointX = dragArray.reduce(function(sum, sprite) {
    return sum + sprite.x;
  }, 0) / dragGroup.length;

  var midPointY = dragArray.reduce(function(sum, sprite) {
    return sum + sprite.y;
  }, 0) / dragGroup.length;

  var centerPoint = new Phaser.Point(midPointX, midPointY);
  dragArray.forEach(function(sprite)
  {
    game.add.tween(sprite).to( { x: centerPoint.x, y: centerPoint.y}, 250, "Sine", true, 0);
  });
}

//thanks Fisher-Yates!
function shuffle (array) {
  var i = 0
    , j = 0
    , temp = null;

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    tableGroup.add(array[j]);
    dragGroup.add(array[j]);
  }

  selectionDidChange = true;
}

function btnDeal_Up(){
  
}

function flipCard(sprite)
{
  if(sprite.isFaceUp)
  {
    sprite.isFaceUp = false;
    sprite.loadTexture(sprite.back);
  } else {
    sprite.isFaceUp = true;
    sprite.loadTexture(sprite.front);
  }
}
///////////////////////////////////////






//CARD INPUT/////////////////////////////////
function card_OnDown(thisSprite) {
  if(dragArray.length == 0)
  {
   thisSprite.scale.setTo(1.5,1.5);
  }
}

function card_OnUp(thisSprite) {
  if(dragArray.length == 0)
  {
   thisSprite.scale.setTo(CARD_SCALE,CARD_SCALE); 
  }
}






//CARD DRAG HANDLING//////////////////
function dragUpdate(thisSprite, pointer, dragX, dragY, snapPoint) {

  //HACK - ensure the dragged card(s) are on top
  //dragGroup = game.add.group();
  if(dragArray.length == 0 && !handGroup.children.includes(thisSprite)) dragGroup.add(thisSprite);
  
  //is the dragged card over the hand area?
  if(thisSprite.overlap(handArea))
  {
    logMessage('card(s) over hand area');
  }

  //if the sprite being dragged isn't in the card selection
  if(dragArray.indexOf(thisSprite) == -1)
  {
    resetCardSelection();
    return;
  } 

  thisSprite.input.enableDrag(false, false, false, 255, null, bg);
  dragArray.forEach(function(sprite)
  {
    if(thisSprite != sprite)
      {
        if(sprite.dx === undefined) sprite.dx = dragX - sprite.x;
        if(sprite.dy === undefined) sprite.dy = dragY - sprite.y;
        sprite.x = dragX - sprite.dx;
        sprite.y = dragY - sprite.dy;
      }
  });

  

}

function dragStop(thisSprite) {

  //HACK - ensure the dragged card(s) are on top
  if(dragArray.length == 0  && !handGroup.children.includes(thisSprite)) tableGroup.add(thisSprite);

  //is the dragged card over the hand area?
  if(thisSprite.overlap(handArea))
  {
    addCardsToHand(thisSprite);
  } else {
    removeCardFromHand(thisSprite);
  }

  dragArray.forEach(function(sprite)
  {
    if(thisSprite != sprite)
      {
        sprite.dx = sprite.dy = undefined;
      }
  });

  if(dragArray.length > 0)
  {
    selectionDidChange = (cardSelectionPosition.x - dragArray[0].x != 0) || (cardSelectionPosition.y - dragArray[0].y != 0);
  } else {
    logMessage(username + " moved one card to a new position"); 
    
    //SERVER
    compileTable();
    socket.emit('update table', table);

  }

}

function update() {


}

function render() {

 
}


//DRAGGING SELECTION///////////////////
  function bg_Mouse_Down(pointer, x, y) {

    rectStartPoint = new Phaser.Point(game.input.x,game.input.y);
    rectMouseDown = true;

    resetCardSelection();
    
    drawCardSelectionRect(x, y);

  }

  function bg_Mouse_Move(pointer, x, y){
    if(!rectMouseDown) return;

    drawCardSelectionRect(x, y);

    //check to see which sprites the rect overlaps
    doCardSelection();
    
  }

  function drawCardSelectionRect(x, y)
  {
    if(cardSelectionRect) cardSelectionRect.destroy();
    cardSelectionRect = game.add.graphics(0, 0);
    cardSelectionRect.beginFill(0xFFFFFF, .30);
    cardSelectionRect.lineStyle(1, 0xFFFFFF, .7);
    var width = x - rectStartPoint.x + 1;
    var height = y - rectStartPoint.y + 1;
    cardSelectionRect.drawRect(rectStartPoint.x, rectStartPoint.y, width, height);
    window.graphics = cardSelectionRect;
  }

  //resets the drag array
  function resetCardSelection(group)
  {
    if(dragArray.length == 0) return;

    dragArray.forEach(function(sprite){
      if(!handGroup.children.includes(sprite)) tableGroup.add(sprite);
      
      sprite.input.enableDrag(false, true, false, 255, null, bg);
      sprite.dx = sprite.dy = undefined;
    });
    dragArray = []; //reset the drag group.

    doCardSelection();

    //tell the server that the cards can be unlocked for everyone :).
    logMessage("reseting " + username + "'s selection"); //TODO:SERVER

    //did they actually move the cards?
    if(selectionDidChange)
    {
      logMessage(username + " moved the card(s) to a new position"); //TODO:SERVER

      compileTable();
      socket.emit('update table', table);
    } 

    tableGroup.forEach(function(sprite){
      if(sprite.tint != 0xffffff){
        sprite.tint = 0xffffff;
        sprite.scale.setTo(CARD_SCALE, CARD_SCALE);
        game.tweens.remove(sprite.colorFlash);
      }
    });

    selectionDidChange = undefined;
    cardSelectionPosition = undefined;

    game.add.tween(actionButtonGroup).to({alpha:0, y:-100}, 250, "Sine", true);
  }


  function doCardSelection()
  {
    if(cardSelectionRect === undefined){
      resetCardSelection();
      return;
    } 

    tableGroup.forEach(function(sprite){
        if(sprite.overlap(cardSelectionRect))
          {
            sprite.tint = 0xffdd00;
          } else {
            if(sprite.tint != 0xffffff)
            {
              sprite.tint = 0xffffff;
              sprite.scale.setTo(CARD_SCALE, CARD_SCALE);
              game.tweens.remove(sprite.colorFlash);
            }
          }
    } );
  }

function bg_Mouse_Up(){
  rectMouseDown = false;

  if(cardSelectionRect === undefined) return;

  tableGroup.forEach(function(sprite){
      if(sprite.overlap(cardSelectionRect))
      {
        dragArray.push(sprite);
        
      } else {
        sprite.tint = 0xffffff;
      }
  } );

  dragArray.forEach(function(sprite){
    dragGroup.add(sprite);
    sprite.colorFlash = game.add.tween(sprite).to( { tint: 0xffdd00, height: sprite.height*.92, width:sprite.width*.92}, 250, "Sine", true, 0, -1, true);
  });

  if(cardSelectionRect)
  {
    cardSelectionRect.destroy();
    cardSelectionRect = undefined;
  } 

  //if we have selected some cards, time to tell the Server.
  if(dragArray.length > 0)
  {
    cardSelectionPosition = new Phaser.Point(dragArray[0].x, dragArray[0].y); //track the first cards position to see if it ever changes.
    game.add.tween(actionButtonGroup).to({alpha:1, y: 10}, 250, "Sine", true);
    logMessage(username + " selected some cards."); //TODO:SERVER 
  }
}

//THE HAND OF CARDS///////////////
function addCardsToHand(thisSprite)
{

  if(dragArray.length > 0)
  {
    
    dragArray.forEach(function(sprite){
      handGroup.add(sprite);
      sprite.input.enableDrag(false, true, false, 255, null, bg);
      sprite.scale.setTo(1.5,1.5);
      sprite.tint = 0xffffff;
      game.tweens.remove(sprite.colorFlash);
    });
  } else {
    logMessage('card DROPPED over hand area');
    handGroup.add(thisSprite);
    thisSprite.input.enableDrag(false, true, false, 255, null, bg);
    thisSprite.scale.setTo(1.5,1.5);
  }
  
  //now arrange the cards in the hand from left to right...
  arrangeCardsInHand();

  resetCardSelection();

  //TODO:SERVER
}

function arrangeCardsInHand()
{
  handGroup.sort('x', Phaser.Group.SORT_ASCENDING);
  var gap = bg.width*.70 / handGroup.length;
  if(gap > 30) gap = 30;
  var counter = 0;
  handGroup.forEach(function(sprite){
    sprite.y = bg.height;
    sprite.x = (counter * gap) + (bg.width/2)  - ((gap*handGroup.length)/2);
    counter++;
  });
}

function removeCardFromHand(thisSprite)
{

  if(!handGroup.children.includes(thisSprite)) return;

  tableGroup.add(thisSprite);
  thisSprite.scale.setTo(CARD_SCALE, CARD_SCALE);

  arrangeCardsInHand();
  
  logMessage('card TAKEN FROM hand area');

  //TODO:SERVER

}





//Messaging functions//////////////////////
function getFullTableLayout()
{


  //loop through the tableGroup

  //loop through the drag array, and broadcast the player that is controlling it

  //loop through the handGroups of each player and broadcast them.
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

      // Tell the server about yourself.
      player.name = username;
      socket.emit('add user', player);
    }
  }

  function compileTable()
  {
    //get the position of every card on the table.
    table.tableCards = [];
    tableGroup.forEach(function(sprite){
      var card = {
        id: sprite.id,
        x: sprite.x,
        y: sprite.y,
        isFaceUp: sprite.isFaceUp
      }

      table.tableCards.push(card);
    })
  }

  function synchTable(animate)
  {
    if(animate === undefined) animate = false;

    var animSpeed = 1;
    if(animate) animSpeed = 300;
    
    //put all of the table cards in place.
    var sprite;
    table.tableCards.forEach(function(card)
    {
      sprite = allCardSprites[card.id];
      if(sprite != undefined)
      {
        sprite.bringToTop();
        game.add.tween(sprite).to( {x: card.x,
                                    y: card.y}, animSpeed, "Sine", true, 0);
        sprite.isFaceUp = card.isFaceUp;
        tableizeCard(sprite);
      }
    });

  }

  function tableizeCard(sprite)
  {
    sprite.scale.setTo(CARD_SCALE, CARD_SCALE);
    sprite.tint = 0xffffff;
    game.tweens.remove(sprite.colorFlash);
    sprite.isFaceUp = !sprite.isFaceUp;
    flipCard(sprite);
  }


  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }



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
        typing = false;
      } else {
        setUsername();
      }
    }
  });


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

// socket.on('secret', function(data){
//   logMessage('SECRET!');
//   logMessage(data);
// })


  //whenever the host disconnects, the server asks for auditions for a new
  //host that can inform new game joinees what is happening in the game.
  socket.on('auditions', function(data){
    socket.emit("sign me up");
  });

  socket.on('assign host', function(){
    isHost = true;
    logMessage('You are now the host.');
  });

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    if(data.numUsers === 1) isHost = true;
    if(isHost)
    {
      logMessage("you are the host. " + data.numUsers);
    }
    
    logMessage("Welcome to Play Cards – ");

    player.spot = table.openSpots.shift();
    table.players.push(player);
    logMessage(table.players);
  });


  socket.on('synchronize tables', function(data)
  {
    table = data.table;
    logMessage("Incoming table:");
    logMessage(table);
    synchTable(true);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    table.players.push(data.player);
    logMessage(data.player.name + " joined.");
    logMessage(table);

    if(isHost)
    {

      //set the player positions for each player.
      var lastVal = 1;
      table.players.forEach(function(player){

        if(player.spot == -1)
        {
          player.spot = table.openSpots.shift();
        }
        
      });
      logMessage('sending the table');
      //compile all of the game state and send it over.
      compileTable();
      socket.emit('setup table', table);
    }
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    logMessage(data.username + ' left');
    table.openSpots.unshift(table.players.find(x => x.name === data.username).spot);
    table.players = table.players.filter(function( player ) {
                                      return player.name !== data.username;
                                  });
                                
    logMessage(table.players);
  });


  socket.on('disconnect', function () {
    logMessage('you have been disconnected');
    table.players = table.players.filter(function( player ) {
                                      return player.name !== username;
                                  });
  });

  socket.on('reconnect', function () {
    logMessage('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
      table.players.add(player);
    }
  });

  socket.on('reconnect_error', function () {
    logMessage('attempt to reconnect has failed');
  });






});






var debug = true;
function logMessage(message)
{
  if(debug) console.log(message);
}





















































