var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req,res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server Started");

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Entity = function(){
	var self = {
		x:250,
		y:250,
		id:"",
		spdX:0,
		spdY:0,
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += spdX;
		self.Y += spdY;
	}
	return self;
}

var Player = function(id){
	var self = Entity();
	self.number = "" + Math.floor(10 * Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.maxSpd = 10;

	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();
	}

	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdX = self.maxSpd;
		else if(self.pressingLeft)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;

		if(self.pressingUp)
			self.spdY = -self.maxSpd;
		else if(self.pressingDown)
			self.spdY = self.maxSpd;
		else
			self.spdY = 0;
	}
	Player.list[id] = self;
	return self;
}
Player.list = {};

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	var player = Player(socket.id);
	
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete Player.list[socket.id];
	});

	socket.on('keyPress', function(data){
		if(data.inputId === 'l')
			player.pressingLeft = data.state;
		if(data.inputId === 'r')
			player.pressingRight = data.state;
		if(data.inputId === 'd')
			player.pressingDown = data.state;
		if(data.inputId === 'u')
			player.pressingUp = data.state;
	});

});

setInterval(function(){
	var pack = [];
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}
},1000/25)
