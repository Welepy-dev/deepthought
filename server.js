import express from "express";
import { createServer } from "http"; //http server
import { Server } from "socket.io"; //engine for real-time, two way talk

import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 

const app = express(); //initialize express
const httpServer = createServer(app); // create http server using express app/tell the http server to use app to handle requests
const io = new Server(httpServer); //initialize socket.io server to handle real-time communication

// Serve static files from the "public" directory
app.use(express.static(join(__dirname, "public"))); // serve files from this dir when requested

// Handle socket.io connections
io.on('connection', (socket) => {
		console.log('A user connected:', socket.id);
		//socket -> utilizador que se conectou
		//socket.id -> identificador da conexao

		// 1. Create a new player state for this specific socket
		players[socket.id] = {
			x: Math.floor(Math.random() * 700) + 50, // Random X between 50-750
			y: Math.floor(Math.random() * 500) + 50, // Random Y between 50-550
			id: socket.id
		};

		// 2. Send the current players list to the NEW player only
		socket.emit('currentPlayers', players);

		// 3. Tell all OTHER players that a new player has joined
		socket.broadcast.emit('newPlayer', players[socket.id]);

		socket.on('disconnect', () => {
				console.log('User disconnected:', socket.id);
				// 4. Remove player from our object and tell everyone
				delete players[socket.id];
				io.emit('playerDisconnected', socket.id);
		});
});

const PORT = 3000;
httpServer.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});