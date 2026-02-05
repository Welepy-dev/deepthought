// 1. Establish the connection to the server
const socket = io();

// 2. Basic Phaser Configuration
const config = {
	type: Phaser.AUTO,
	parent: 'game-container',
	width: 800,
	height: 600,
	scene: {
		preload: preload,
		create: create
	}
};

const game = new Phaser.Game(config);

function preload() {
	// We'll load images here later
}

function create() {
	console.log("Phaser Game Created!");
	
	// 3. Listen for a message from the server
	socket.on('connect', () => {
		console.log("Connected to server with ID:", socket.id);
	});
}