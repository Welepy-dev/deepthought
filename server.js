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

		socket.on('disconnect', () => {
				console.log('User disconnected:', socket.id);
		});
});

const PORT = 3000;
httpServer.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});