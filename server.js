import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const app = express();

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "view")));
app.use(express.static(path.join(__dirname, "images")));

app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: __dirname });
});

const server = app.listen(PORT);
const io = new Server(server);

let room = {};

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("createRoom", (data) => {
    const roomID = data.roomID;
    const playerName = data.playerName;

    // Check if room already exists
    if (room[roomID]) {
      return socket.emit("roomExists");
    }

    // Create new room
    room[roomID] = {
      p1Choice: null,
      p1Score: 0,
      p2Choice: null,
      p2Score: 0,
      p1Name: playerName,
      p2Name: null,
    };

    socket.join(roomID);
    socket.emit("playersConnected");
  });

  socket.on("joinRoom", (data) => {
    const roomID = data.roomID;
    const playerName = data.playerName;

    // Check if room exists
    if (!room[roomID]) {
      return socket.emit("roomNotFound");
    }

    // Check if room is full (more than 1 player)
    const roomSize = io.sockets.adapter.rooms.get(roomID)?.size || 0;
    if (roomSize > 1) {
      return socket.emit("roomFull");
    }

    // Join the room
    room[roomID].p2Name = playerName;
    socket.join(roomID);

    // Notify the joining player about the opponent's name
    socket.emit("playersConnected", { opponentName: room[roomID].p1Name });

    // Notify the room creator that an opponent has joined
    socket.to(roomID).emit("opponentJoined", { playerName: playerName });
  });

  socket.on("p1Choice", (data) => {
    if (data) {
      const choice = data.rpschoice;
      const roomID = data.roomID;

      if (!room[roomID]) return;

      room[roomID].p1Choice = choice;

      // Notify player 2 that player 1 has made a choice
      socket.to(roomID).emit("opponentMadeChoice");

      socket.to(roomID).emit("p1Choice", {
        rpsValue: choice,
        score: room[roomID].p1Score,
      });

      if (room[roomID].p2Choice) {
        declareWinner(roomID);
      }
    }
  });

  socket.on("p2Choice", (data) => {
    if (data) {
      const choice = data.rpschoice;
      const roomID = data.roomID;

      if (!room[roomID]) return;

      room[roomID].p2Choice = choice;

      // Notify player 1 that player 2 has made a choice
      socket.to(roomID).emit("opponentMadeChoice");

      socket.to(roomID).emit("p2Choice", {
        rpsValue: choice,
        score: room[roomID].p2Score,
      });

      if (room[roomID].p1Choice) {
        declareWinner(roomID);
      }
    }
  });

  socket.on("playerClicked", (data) => {
    const roomID = data.roomID;

    if (!room[roomID]) return;

    room[roomID].p1Choice = null;
    room[roomID].p2Choice = null;
    socket.to(roomID).emit("playAgain");
  });

  socket.on("exitGame", (data) => {
    const roomID = data.roomID;

    if (!room[roomID]) return;

    if (data.player) {
      socket.to(roomID).emit("player1Left");
    } else {
      socket.to(roomID).emit("player2Left");
    }

    // Check if room is empty after player leaves
    const roomSize = io.sockets.adapter.rooms.get(roomID)?.size || 0;
    if (roomSize <= 1) {
      delete room[roomID]; // Clean up room data if empty
    }

    socket.leave(roomID);
  });
});

const declareWinner = (roomID) => {
  if (!room[roomID]) return;

  let winner;
  const p1Choice = room[roomID].p1Choice;
  const p2Choice = room[roomID].p2Choice;

  if (p1Choice === p2Choice) {
    winner = "draw";
  } else if (p1Choice === "rock") {
    winner = p2Choice === "scissor" ? "p1" : "p2";
  } else if (p1Choice === "paper") {
    winner = p2Choice === "rock" ? "p1" : "p2";
  } else if (p1Choice === "scissor") {
    winner = p2Choice === "paper" ? "p1" : "p2";
  }

  // Update scores
  if (winner === "p1") {
    room[roomID].p1Score += 1;
  } else if (winner === "p2") {
    room[roomID].p2Score += 1;
  }

  io.to(roomID).emit("winner", {
    winner: winner,
    p1Score: room[roomID].p1Score,
    p2Score: room[roomID].p2Score,
  });
};

console.log(`Server running on port ${PORT}`);
