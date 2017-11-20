var gameRoomInfo = getParameterByName('game').split('~~~');
var gameRoom = gameRoomInfo[0];
var gameId = gameRoomInfo[1];
var gameRoomFull = gameRoom + "~~~" + gameId;;
var baseUrl = (window.location.href.indexOf('localhost') > -1) ? 'http://localhost:5000/' : 'http://cardslanding.azurewebsites.net/';
if(gameId === undefined)
{
  gameId = generateGameRoomId();
  gameRoomFull = gameRoom + "~~~" + gameId;
  window.history.pushState("Cardslanding", "Cardslanding", "?game=" + gameRoomFull);
}
$('.gameUrl').html("<a href=\"javascript:copyToClipboard('" + window.location.href + "')\">" + gameRoomFull + "</a>")


//get the right deck...
$.getScript("/decks/" + gameRoom + "/cards.js", function() {
  
logMessage("Loaded.")



$(function(){
  
  //get the user details
$.ajax({
  type: "GET",    
  url: baseUrl + "api/external/getuserdetails",
  cache: false,
  crossDomain: true,
  dataType: 'json',
  xhrFields: {
      withCredentials: true
  },
  success: function (data) {
    if(data.success)
    {
      setUsername(data.email);
    } else {
      window.location = baseUrl + 'Account/Login?referrer=game&returnUrl=' + window.location.href;
    }
  },
  fail: function(){
    window.location = baseUrl + 'Account/Login?referrer=game&returnUrl=' + window.location.href;
  }
});
    //top level object
var table = {
  players: [],
  tableCards: [], //an array of cards... because cards don't HAVE to be in piles
  handCards: [],
  openSpots: [1,2,3,4,5,6]
}
var player = {
  name: username,
  handCards: [],
  spot: -1,
  spotCards: [] //the cards that are sitting on this player's place mat.
}


//set up the player spots.
var playerSpots = [];
var playerSpot;
const  SPOT_WIDTH = 360, SPOT_HEIGHT= 252;
const CARD_WIDTH_LARGE = 640, CARD_HEIGHT_LARGE = 930;
const CARD_WIDTH_MED = 200, CARD_HEIGHT_MED = 290;
const CARD_WIDTH_SM = 100, CARD_HEIGHT_SM = 146;
const CARD_WIDTH_TINY = 44, CARD_HEIGHT_TINY = 64;

playerSpot = {
  id:0,
  x: 0,
  y: -844,
  label: null,
  bounds: null,
  playerName: '',
  group: null
}
playerSpots.push(playerSpot);

playerSpot = {
  id:1,
  x: 336,
  y: -844,
  label: null,
  bounds: null
}
playerSpots.push(playerSpot);

playerSpot = {
  id:2,
  x: 672,
  y: -844,
  label: null,
  bounds: null
}
playerSpots.push(playerSpot);

playerSpot = {
  id:3,
  x: 1008,
  y: -844,
  label: null,
  bounds: null
}
playerSpots.push(playerSpot);

playerSpot = {
  id:4,
  x: 1345,
  y: -844,
  label: null,
  bounds: null
}
playerSpots.push(playerSpot);

playerSpot = {
  id:5,
  x: 672,
  y: 1923,
  label: null,
  bounds: null
}
playerSpots.push(playerSpot);

//players can contain hands and dragGroups. 

var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username

var game = new Phaser.Game(1920, 1080, Phaser.CANVAS, 'gameContainer', { preload: preload, create: create, update: update });
var isHost = false;
var bg, handArea, handGraphic;
const CARD_SCALE = .3;
var deckInfo = [];
var cardSelectionRect; //The drag selection rectangle.
var rectStartPoint = new Phaser.Point(0,0);
var rectMouseDown = false;
var cardSelectionPosition;
var selectionDidChange = false;
var tableGroup, dragGroup, handGroup, actionButtonGroup, spotsGroup;
var allCardSprites = [];
var isSynchRequired;


function preload() {
  
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.setMinMax(400, 225, 1920, 1080);

  var basePath = '/decks/' + gameRoom + '/';
  
  //bg
  game.load.image('bg', basePath + cardPaths.bg);

  //hand hit area
  game.load.image('hitArea', 'images/hitArea.png');

  //hand graphic
  game.load.image('handGraphic', basePath + cardPaths.images.handOfCards);

  //player spot
  game.load.image('playerSpot', 'images/gPlayerSpot.png');

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

//visibility changes for synching
document.addEventListener("visibilitychange", handleVisibilityChange, false);

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
handArea.anchor = new Phaser.Point(1, 1);
handArea.x = bg.width;
handArea.y = bg.height;

//hand graphic
handGraphic = game.add.sprite(handArea.x - handArea.width, handArea.y - handArea.height, 'handGraphic');

 //setup groups
 tableGroup = game.add.group();
 spotsGroup = game.add.group();
 handGroup = game.add.group();
 dragGroup = game.add.group();
 actionButtonGroup = game.add.group();
  



//playerspots
var newSpot;
for(var i=0; i<playerSpots.length; i++)
{
  newSpot = game.add.sprite(playerSpots[i].x, playerSpots[i].y, 'playerSpot');
  newSpot.id = i;
  newSpot.x = playerSpots[i].x + newSpot.width/2;
  //newSpot.width = (i !== 0 && i !== 4) ? SPOT_WIDTH : SPOT_HEIGHT;
  //newSpot.height = (i !== 0 && i !== 4) ? SPOT_HEIGHT : SPOT_WIDTH;
  newSpot.anchor = new Phaser.Point(.5, 0);
  
  //input for the group...
  newSpot.inputEnabled = true;
  newSpot.input.pixelPerfectAlpha = 100;
  newSpot.input.pixelPerfectClick = true;
  //newSpot.input.pixelPerfectOver = true;
  newSpot.events.onInputUp.add(playerSpot_OnUp);

  //newSpot.label.alpha = .6;
  if(i === 5)
  {
    newSpot.label = addText('', newSpot.x, newSpot.y - newSpot.height + 12);
    newSpot.angle = 180;
  } else {
    newSpot.label = addText('', newSpot.x, playerSpots[i].y + newSpot.height - 10);
  }
  playerSpots[i].label = newSpot.label;
  playerSpots[i].bounds = newSpot;
  playerSpots[i].group = game.add.group();
  playerSpots[i].group.add(newSpot);
  playerSpots[i].group.add(newSpot.label);
  spotsGroup.add(playerSpots[i].group);
  playerSpots[i].isHidden = true;
}

 

 //action buttons
addActionButtons();

 for(var i=0; i<deckInfo.length; i++)
  {
    var cardKey = deckInfo[i].image.replace('.png', '');
    var sprite = game.add.sprite(game.world.centerX, game.world.centerY, cardKey);
    sprite.id = i;
    allCardSprites.push(sprite);
    tableGroup.add(sprite);
    sprite.anchor = new Phaser.Point(.5, .5);
    sprite.width = CARD_WIDTH_SM;
    sprite.height = CARD_HEIGHT_SM;
    //added properties for this card game.
    sprite.front = deckInfo[i].image.replace('.png', '');
    sprite.back = deckInfo[i].back.replace('.png', '');
    sprite.isFaceUp = true;
    flipCard(sprite);

    sprite.inputEnabled = true;
    sprite.input.enableDrag(false, true, false, 255, null);
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
  const gap = 40;

  var btnStagger = game.add.sprite(0, 0, 'btnStagger');
  btnStagger.x = gap;
  btnStagger.y = bg.height - 240;
  btnStagger.inputEnabled = true;
  btnStagger.events.onInputUp.add(btnStagger_Up);

  var btnShuffle = game.add.sprite(0, 0, 'btnShuffle');
  btnShuffle.x = gap + btnShuffle.width;
  btnShuffle.y = bg.height - 240;
  btnShuffle.inputEnabled = true;
  btnShuffle.events.onInputUp.add(btnShuffle_Up);

  var btnFlip = game.add.sprite(0, 0, 'btnFlip');
  btnFlip.x = gap + btnShuffle.width*2;
  btnFlip.y = bg.height - 240;
  btnFlip.inputEnabled = true;
  btnFlip.events.onInputUp.add(btnFlip_Up);

  var btnDeckify = game.add.sprite(0, 0, 'btnDeckify');
  btnDeckify.x = gap + btnShuffle.width*3;
  btnDeckify.y = bg.height - 240;
  btnDeckify.inputEnabled = true;
  btnDeckify.events.onInputUp.add(btnDeckify_Up);

  var btnDeal = game.add.sprite(0, 0, 'btnDeal');
  btnDeal.x = gap + btnShuffle.width*4;
  btnDeal.y = bg.height - 240;
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
  var gap = heightArea / dragGroup.length;

  var counter = 0;
  var dragArray = dragGroup.children.slice();
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
  shuffle();
}

function btnFlip_Up(){

  dragGroup.forEach(function(sprite)
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
  var dragArray = dragGroup.children.slice();

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
function shuffle () {
  var i = 0
    , j = 0
    , temp = null;

  var array = dragGroup.children.slice();
  logMessage(array[50].id);
  array = Phaser.ArrayUtils.shuffle(array);
  logMessage(array[50].id);

  for (i = 0; i < array.length; i++) {
    tableGroup.add(array[i]);
    dragGroup.add(array[i]);
  }

  selectionDidChange = true;
}

function btnDeal_Up(){
  playerSpots.filter(spot => spot.playerName !== '').forEach(spot => {
    //get the top card from the draggroup, and send 1 card to each player
    for(var i=0; i<3; i++)
    {
      if(dragGroup.length > 0)
      {
        var topSprite = dragGroup.getTop();
        game.add.tween(topSprite).to( {x: spot.x + 80,
                                    y: spot.y + 80,
                                    angle:getSpotRotationAngle(spot)}, 
                                    250, "Sine", true);
        tableGroup.add(topSprite);
        tableizeCard(topSprite);
      }
    }
  });

  //SERVER
  compileTable();
  socket.emit('update table', table);
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
  rotateCard(thisSprite, 0, true);
}

function card_OnUp(thisSprite) {

}

//PLAYER SPOT INPUT//////////////////////////
function playerSpot_OnUp(spotSprite) {
  togglePlayerSpot(spotSprite);
}
function openPlayerSpot(spotSprite)
{
  playerSpots[spotSprite.id].isHidden = false;
  game.add.tween(playerSpots[spotSprite.id].group).to({y:getToggleSpotPosition(spotSprite)}, 250, "Sine", true);
  //spotsGroup.bringToTop(playerSpots[spotSprite.id].group);

  closePlayerSpots(spotSprite);
}
function togglePlayerSpot(spotSprite)
{
  
  playerSpots[spotSprite.id].isHidden = !playerSpots[spotSprite.id].isHidden;
  game.add.tween(playerSpots[spotSprite.id].group).to({y:getToggleSpotPosition(spotSprite)}, 250, "Sine", true);
  //spotsGroup.bringToTop(playerSpots[spotSprite.id].group);

  closePlayerSpots(spotSprite);
}
function closePlayerSpots(spotSprite)
{
  playerSpots.forEach(spot => {
    if(spot.bounds !== spotSprite)
    {
      playerSpots[spot.id].isHidden = true;
      game.add.tween(playerSpots[spot.id].group).to({y:getToggleSpotPosition(spot.bounds)}, 250, "Sine", true);
    }
  });
}
function getToggleSpotPosition(spotSprite)
{
  var newY;
  if(spotSprite.id != 5){
    newY = playerSpots[spotSprite.id].isHidden ? 0 : 422;
  } else {
    newY = playerSpots[spotSprite.id].isHidden ? 0 : -422;
  }

  return newY;
}






//CARD DRAG HANDLING//////////////////
function dragUpdate(thisSprite, pointer, dragX, dragY, snapPoint) {

  //HACK - ensure the dragged card(s) are on top
  //dragGroup = game.add.group();
  if(dragGroup.length == 0 && !handGroup.children.includes(thisSprite)) dragGroup.add(thisSprite);
  
  //is the dragged card over the hand area?
  if(thisSprite.overlap(handArea))
  {
    logMessage('card(s) over hand area');
  }

  //are we dragging the drag group over the playerspots?
  playerSpots.forEach(spot => {
    if(spot.bounds.overlap(thisSprite))
    {
      openPlayerSpot(spot.bounds);
    }
  });

  //if the sprite being dragged isn't in the card selection
  if(dragGroup.children.indexOf(thisSprite) == -1)
  {
    resetCardSelection();
    return;
  } 

  thisSprite.input.enableDrag(false, false, false, 255, null);
  dragGroup.forEach(function(sprite)
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
  //if(dragGroup.length == 0  && !handGroup.children.includes(thisSprite)) tableGroup.add(thisSprite);

  //is the dragged card over a player's spot?
  var doesOverlapASpot = false;
  playerSpots.forEach(spot => {
    if(spot.bounds.overlap(thisSprite))
    {
      addCardsToSpot(spot, thisSprite);
      doesOverlapASpot = true;
    }
  });
  if(!doesOverlapASpot)
  {
    rotateCards(0, thisSprite);
  }

  //is the dragged card over the hand area?
  if(thisSprite.overlap(handArea))
  {
    addCardsToHand(thisSprite);
    return;
  } else {
    removeCardFromHand(thisSprite, doesOverlapASpot);
  }

  dragGroup.forEach(function(sprite)
  {
    if(thisSprite != sprite)
      {
        sprite.dx = sprite.dy = undefined;
      }
  });

  if(dragGroup.length > 1)
  {
    selectionDidChange = (cardSelectionPosition.x - dragGroup.children[0].x != 0) || (cardSelectionPosition.y - dragGroup.children[0].y != 0);
  } else {
    logMessage(username + " moved one card to a new position");
    if(dragGroup.contains(thisSprite)) tableGroup.add(thisSprite);
    
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

    closePlayerSpots();

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
    if(dragGroup.length == 0) return;

    var dragArray = dragGroup.children.slice();
    dragArray.forEach(function(sprite){
      if(!handGroup.children.includes(sprite)) tableGroup.add(sprite);
      
      sprite.input.enableDrag(false, true, false, 255, null);
      sprite.dx = sprite.dy = undefined;
    });

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
        game.add.tween(sprite).to({width:CARD_WIDTH_SM, height:CARD_HEIGHT_SM}, 250, "Sine", true);
        game.tweens.remove(sprite.colorFlash);
      }
    });

    selectionDidChange = undefined;
    cardSelectionPosition = undefined;

    game.add.tween(actionButtonGroup).to({alpha:0, y: 100}, 250, "Sine", true);
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
              game.add.tween(sprite).to({width:CARD_WIDTH_SM, height:CARD_HEIGHT_SM}, 250, "Sine", true);
              game.tweens.remove(sprite.colorFlash);
            }
          }
    } );
  }

function bg_Mouse_Up(){
  rectMouseDown = false;

  if(cardSelectionRect === undefined) return;

  var dragArray = dragGroup.children.slice();
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
  if(dragGroup.length > 0)
  {
    cardSelectionPosition = new Phaser.Point(dragGroup.children[0].x, dragGroup.children[0].y); //track the first cards position to see if it ever changes.
    game.add.tween(actionButtonGroup).to({alpha:1, y: 10}, bg.height - 150, "Sine", true);
    logMessage(username + " selected some cards."); //TODO:SERVER 
  }
}


//THE PLAYER SPOTS/////////////////
function addCardsToSpot(spot, thisSprite)
{

  var dragArray = dragGroup.children.slice();
  if(dragArray.length > 0)
  {
    dragArray.forEach(function(sprite){
      arrangeCardInSpot(spot, sprite, thisSprite);
    });
  } else {
    logMessage("card DROPPED over player's spot");
    arrangeCardInSpot(spot, thisSprite, thisSprite);
  }
  
  //resetCardSelection();

  //TODO:SERVER
}

function arrangeCardInSpot(spot, thisSprite, dragSprite)
{
  if(dragSprite === undefined) dragSprite = thisSprite;

  thisSprite.tint = 0xffffff;
  game.tweens.remove(thisSprite.colorFlash);
  var rand = 3 - (Math.random() * 6);
  if(spot.id != 5)
  {
    thisSprite.y -= 422;
  } else {
    thisSprite.y += 422;
  }
  game.add.tween(thisSprite).to({angle: getSpotRotationAngle(spot),
                                width:CARD_WIDTH_SM,
                                height:CARD_HEIGHT_SM}, 250, 'Sine', true);
  spot.group.add(thisSprite);
  
}
function getSpotRotationAngle(spot)
{
  var rand = 4 - Math.round((Math.random() * 8));
  // if(spot.id === 0)
  // {
  //   return 90 + rand;
  // } else if(spot.id === 1 || spot.id === 2 || spot.id === 3){
  //   return -180 + rand;
  // } else if(spot.id === 4){
  //   return -90 + rand;
  // } else if(spot.id === 5){
  //   return 0 + rand;
  // }

  return 0 + rand;
}

function rotateCards(angle, thisSprite)
{

  if(dragGroup.length > 0)
  {
    dragGroup.forEach(function(sprite){
      rotateCard(sprite, angle);
    });
  } else {
    rotateCard(thisSprite, angle);
  }
}

function rotateCard(thisSprite, angle, makePerfect)
{
  var rand = (makePerfect === true) ? 0 : 4 - Math.round((Math.random() * 8));
  game.add.tween(thisSprite).to({angle:angle + rand}, 250, "Sine", true);
}


//THE HAND OF CARDS///////////////
function addCardsToHand(thisSprite)
{

  var dragArray = dragGroup.children.slice();
  if(dragArray.length > 0)
  {
    
    dragArray.forEach(function(sprite){
      handGroup.add(sprite);
      sprite.input.enableDrag(false, true, false, 255, null);
      //game.add.tween(sprite).to({width:CARD_WIDTH_MED, height:CARD_HEIGHT_MED}, 250, "Sine", true);
      //sprite.width = CARD_WIDTH_MED;
      //sprite.height = CARD_HEIGHT_MED;
      sprite.tint = 0xffffff;
      game.tweens.remove(sprite.colorFlash);
      sprite.isFaceUp = false;
      flipCard(sprite);
    });
  } else {
    logMessage('card DROPPED over hand area');
    handGroup.add(thisSprite);
    thisSprite.input.enableDrag(false, true, false, 255, null);
    //game.add.tween(thisSprite).to({width:CARD_WIDTH_MED, height:CARD_HEIGHT_MED}, 250, "Sine", true);
    //thisSprite.width = CARD_WIDTH_MED;
    //thisSprite.height = CARD_HEIGHT_MED;
    thisSprite.isFaceUp = false;
    flipCard(thisSprite);
  }
  
  //now arrange the cards in the hand from left to right...
  arrangeCardsInHand();

  resetCardSelection();

  //update the server
  if(update !== false)
  {
    compileTable();
    socket.emit('update table', table);
  }
  
}

function arrangeCardsInHand()
{
  //take the cards that don't belong to this player out of the hand group momentarily.
  var tempArray = [];
  logMessage('arranging cards');
  logMessage('handGroup.length: ' + handGroup.length);
  handGroup.forEach(function(sprite){
    if(!sprite.overlap(handArea))
    {
      logMessage('adding to tablegroup');
      tempArray.push(sprite);
    }
  });
  tempArray.forEach(sprite => tableGroup.add(sprite));

  logMessage('handGroup.length: ' + handGroup.length);
  
  var gap = (handArea.width - 60) / handGroup.length;
  if(gap > CARD_WIDTH_MED + 5) gap = CARD_WIDTH_MED + 5;
  var counter = 0;
  handGroup.forEach(sprite => {
    handGroup.sort('x', Phaser.Group.SORT_DESCENDING);
    let newX = bg.width - (CARD_WIDTH_MED/2) - (gap * counter);
    let newY = bg.height;
    var tween = game.add.tween(sprite).to({x:newX,
                               y:newY,
                               width:CARD_WIDTH_MED, 
                               height:CARD_HEIGHT_MED}, 250, "Sine", true);
    tween.onComplete.add(sortHand, this);
    function sortHand()
    {
      handGroup.forEach(sprite => {
        handGroup.sort('x', Phaser.Group.SORT_ASCENDING);
        //handGroup.sendToBack(sprite);
      });
    }
    
    sprite.input.enableDrag(false, true, false, 255, null);
    counter++;
  });

  //put the cards that don't belong to this player back in the hand group.
  tempArray.forEach(sprite => handGroup.add(sprite));

  
}

function removeCardFromHand(thisSprite, doesOverlapASpot)
{

  logMessage('Removing card from hand.');
  //if(handGroup.children.includes(thisSprite)) return;

  if(!doesOverlapASpot)
  {
    tableGroup.add(thisSprite);
    game.add.tween(thisSprite).to({width:CARD_WIDTH_SM, height:CARD_HEIGHT_SM}, 250, "Sine", true);
  }

  var index = table.players.findIndex(x => x.name === username);
  table.players[index].handCards = table.players[index].handCards.filter(function( card ) {
                                      return card.id !== thisSprite.id;
                                  });
  logMessage('HAND CARDS!');
  logMessage(table.players[index].handCards);

  arrangeCardsInHand();
  
  logMessage('card TAKEN FROM hand area');

  //TODO:SERVER

}


//TEXT/////////////
function addText(textString, x, y)
{
  var style = { font: "bold 16px Arial", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };
  text = game.add.text(x, y, textString, style);
  text.anchor.set(0.5, .5);

  //text.setShadow(0, 0, 'rgba(0, 0, 0, 0.5)', 1);

  return text;
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
  function setUsername (name) {
    username = cleanInput(name.trim());
    
    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $gamePage.show();
      $loginPage.off('click');

      // Tell the server about yourself.
      player.name = username;
      player.room = gameRoomFull;
      socket.emit('add user', player);
    }
  }

  function compileTable()
  {
    //start with a clean state.
    table.tableCards = [];
    table.handCards = [];
    table.players.forEach(player => {
      player.spotCards = [];
      //player.handCards = [];
    })

    //table
    tableGroup.forEach(function(sprite){
      var card = {
        id: sprite.id,
        x: sprite.x,
        y: sprite.y,
        isFaceUp: sprite.isFaceUp
      }


      
      table.tableCards.push(card);
    });

    //check to see which cards are over each player's spot, and add them to their spotCards
    //clear the spot cards to begin with...
    playerSpots.forEach(spot => {
      spot.group.children.forEach(sprite => {
        if(sprite.isFaceUp != undefined) //that means it's a card.
        {
          logMessage('compileTable :: adding card to spot. ' + sprite.x + " " + sprite.y + ' || ' + spot.bounds.x + ' ' + spot.bounds.y);
          
          var newY;
          if(spot.id !== 5)
          {
            newY = spot.bounds.y - sprite.y;
          } else {
            newY = sprite.y - spot.bounds.y;
          }

          var card = {
            id: sprite.id,
            x: spot.bounds.x - sprite.x,
            y: newY,
            isFaceUp: sprite.isFaceUp
          }
          if(spot.playerName != '') table.players.find(x => x.name === spot.playerName).spotCards.push(card);
        }
      });
      
      
    });

    //check to see which cards are in your hand
    handGroup.forEach(sprite => {
      var card = {
        id: sprite.id,
        x: sprite.x,
        y: sprite.y,
        isFaceUp: sprite.isFaceUp
      }
      logMessage('card in hand...');

      if(handArea.overlap(sprite))
      {
        //is this card already in this player's hand?
        var cardNotInHand = table.players.find(x => x.name === username).handCards.findIndex(cc => cc.id === sprite.id) === -1; 
        if(cardNotInHand) table.players.find(x => x.name === username).handCards.push(card);
      }
      
      
    });

    
  }

  function synchTable(animate)
  {
    logMessage('SYNCHING');
    if(animate === undefined) animate = false;

    var animSpeed = 1;
    if(animate) animSpeed = 300;
    
    //update names
    updateLabels();

    //put all of the table cards in place.
    var sprite;
    table.tableCards.forEach(function(card)
    {
      sprite = allCardSprites[card.id];
      if(sprite != undefined)
      {
        tableGroup.add(sprite);
        sprite.bringToTop();
        logMessage('moving card to: ' + card.x + ' ' + card.y);
        game.add.tween(sprite).to( {x: card.x,
                                    y: card.y}, animSpeed, "Sine", true);
        sprite.isFaceUp = card.isFaceUp;
        tableizeCard(sprite);
        rotateCard(sprite, 0);
      }
    });

    //move the spot and hand cards to their places
    table.players.forEach(player => {
      player.spotCards.forEach(card => {
          var spot = playerSpots.find(x => x.playerName === player.name);
          sprite = allCardSprites[card.id];
          if(sprite != undefined)
          {
            spot.group.add(sprite);
            spot.group.bringToTop(sprite);
            var newY;
            if(spot.id !== 5)
            {
              newY = spot.bounds.y - card.y;
            } else {
              newY = spot.bounds.y + card.y;
              spot.group.sendToBack(sprite);
            }
            logMessage()
            game.add.tween(sprite).to( {x: ((spot.bounds.width/2) - card.x) + spot.x,
                                        y: newY,
                                        width: CARD_WIDTH_SM,
                                        height:CARD_HEIGHT_SM,
                                        angle:getSpotRotationAngle(spot)}, 
                                        animSpeed, "Sine", true);
            sprite.isFaceUp = card.isFaceUp;
            spot.group.sendToBack(spot.bounds);
            tableizeCard(sprite);
          }
      });

      var counter = 0;
      player.handCards.forEach(card => {
          
            //put the cards where they belong.
            if(player.name === username)
            {
              //all good.
            } else {
              counter++;
              logMessage("Moving card to " + player.name + "'s hand.");
              var spot = playerSpots.find(x => x.playerName === player.name);
              sprite = allCardSprites[card.id];
              if(sprite != undefined)
              {
                sprite.bringToTop();

                //how to stagger.
                var xStagger = 3, yStagger = 0, xOffset = 0, yOffset = 0;
                
                var handTween = game.add.tween(sprite).to( {x: spot.bounds.x - 70 + (counter * xStagger),
                                          y: spot.bounds.y + 422,
                                          width: CARD_WIDTH_TINY,
                                          height:CARD_HEIGHT_TINY,
                                          angle:getSpotRotationAngle(spot)}, 
                                          animSpeed, "Sine", true);
                //handTween.onComplete.add(checkHand, this);
                handGroup.add(sprite);
                    sprite.input.draggable = false;
                function checkHand () {
                  //if(handArea.overlap(sprite) || spot.bounds.overlap(sprite))
                  //{
                    handGroup.add(sprite);
                    sprite.input.draggable = false;
                  //} else {
                  //  tableGroup.add(sprite);
                  //  tableizeCard(sprite);
                  //}
                }

                sprite.isFaceUp = true;
                flipCard(sprite);
                
            }
            
            
          }
      });
    });

    isSynchRequired = false;

  }

  function tableizeCard(sprite)
  {
    game.add.tween(sprite).to({width:CARD_WIDTH_SM, height:CARD_HEIGHT_SM}, 250, "Sine", true);
    sprite.tint = 0xffffff;
    game.tweens.remove(sprite.colorFlash);
    sprite.inputEnabled;
    sprite.input.enableDrag(false, true, false, 255, null);
    sprite.isFaceUp = !sprite.isFaceUp;
    flipCard(sprite);
  }

  function updateLabels()
  {
    logMessage('updating names');
    logMessage(table.players.find(x => x.name === username));
    var thisPlayersSpot = table.players.find(x => x.name === username).spot - 1;
    var shiftVal = 5 - thisPlayersSpot;
    playerSpots.forEach(spot => {
      spot.label.setText('');
      spot.playerName = '';
    });
    table.players.forEach(function(player){
      var spotPos = (player.spot - 1) + shiftVal;
      if(spotPos >= 6) spotPos = spotPos - 6;
      logMessage('player.spot: ' + player.spot + ', shiftVal: ' + shiftVal +  ', spotPos: ' + spotPos);
      var spot = playerSpots[spotPos];
      spot.label.setText(player.name);
      spot.playerName = player.name;
    });
  }

  function returnCardsToTable(){

    logMessage("returning a player's cards back to the table." )
    
    //get all of the cards that are not accounted for and move them back to the table...
    var allAccountedCardSprites = tableGroup.children;
    //var allCardsSet = new Set(allCardSprites);
    playerSpots.forEach(spot => {
      allAccountedCardSprites.concat(spot.group.children); 
    });
    
    allAccountedCardSprites.concat(dragGroup.children);
    
    allAccountedCardSprites.concat(handGroup.children);
    
    var accountedForSet = new Set(allAccountedCardSprites);
    var lostCards = allCardSprites.reduce(function(foundCards, sprite)
    {
      if(!accountedForSet.has(sprite))
      {
        return foundCards.concat([sprite]);
      } else {
        return foundCards;
      }
      
    }, []);
    
    lostCards.forEach(sprite => {
      game.add.tween(sprite).to( {x: 250,
                                  y: 200}, 
                                  250, "Sine", true);
      rotateCard(sprite, 0);
      tableizeCard(sprite);
      tableGroup.add(sprite);
      sprite.isFaceUp = true;
      flipCard(sprite);
    });

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
    logMessage('synchronize tables called.');
    table = data.table;
    logMessage("Incoming table:");
    logMessage(table);

    isSynchRequired = true;
    
    if(!document.hidden) synchTable(true);
    
  });


  function handleVisibilityChange() {
  if (!document.hidden && isSynchRequired) {
    synchTable(true);
  }
}

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
          logMessage('assigning ' + player.name + ' spot ' + player.spot);
        }
        
      });
      logMessage('sending the table');
      //compile all of the game state and send it over.
      compileTable();
      updateLabels();
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

    //return all of the players cards to the table
    //synchTable(true);
    returnCardsToTable();
    //synchTable(false);

    
    updateLabels();
    //SERVER
    // compileTable();
    // socket.emit('update table', table);

    // logMessage(table.players);
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


});







var debug = true;
function logMessage(message)
{
  if(debug) console.log(message);
}
























































function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function generateGameRoomId()
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function copyToClipboard(text) {
  alert(text);
  var $temp = $("<input type='text' value='" + text + "'></input>");
  $("body").append($temp);
  $temp.select();
  alert($temp.val());
  document.execCommand("copy");
  $temp.remove();
}