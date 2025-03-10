const gameArea = document.querySelector(".main");
const rock = document.querySelector(".choice__rock");
const paper = document.querySelector(".choice__paper");
const scissor = document.querySelector(".choice__scissor");

const header = document.querySelector(".header");
const scoreNum = document.querySelector(".score__number");

const oppoTitle = document.querySelector(".opponents__result");
const yourTitle = document.querySelector(".your__result");

const exitBtn = document.querySelector(".exit__btn");
const rulesBtn = document.querySelector(".rules__button");
const rulesBoard = document.querySelector(".rules");
const closeRules = document.querySelector(".close-btn");

const gameFooter = document.querySelector(".footer");

const resultBoard = document.querySelector(".result__board");
const oppoChoice = document.querySelector(".oppo__choice");
const yourChoice = document.querySelector(".your__choice");

const results = document.querySelector(".results");
const resultsHeading = document.querySelector(".results__heading");
const resultButton = document.querySelector(".results__button");

const joinPage = document.querySelector(".join");
const roomId = document.getElementById("room-id");
const playerNameInput = document.getElementById("player-name");
const playerStatus = document.querySelector(".player-status");
const opponentName = document.querySelector(".opponent-name");
const waitingMessage = document.querySelector(".waiting-message");

const paperChoice = `
    <button class="choice__paper" onclick="clickChoice('paper')">
        <div class="choice">
            <img
              src="/icon-paper.svg"
              alt="Paper"
              class="choice__img"
            />
        </div>
    </button>
`;
const rockChoice = `
    <button class="choice__rock" onclick="clickChoice('rock')">
        <div class="choice">
            <img 
                src="/icon-rock.svg" 
                alt="Rock" 
                class="choice__img"
            />
        </div>
    </button>
`;

const scissorChoice = `
    <button class="choice__scissor" onclick="clickChoice('scissor')">
        <div class="choice">
            <img
                src="/icon-scissors.svg"
                alt="Scissor"
                class="choice__img"
            />
        </div>
    </button>
`;
rulesBtn.addEventListener("click", () => {
  rulesBoard.classList.toggle("show__rules_board");
  closeRules.style.cursor = "pointer";
});

closeRules.addEventListener("click", () => {
  rulesBoard.classList.toggle("show__rules_board");
});

let roomID;
let player1 = false;
let winner;
let player1Score = 0;
let player2Score = 0;
let playerName = "";
let opponentPlayerName = "";
let playerHasChosen = false;
let opponentHasChosen = false;

// Socket connection
const socket = io.connect(window.location.origin, {
  secure: true,
  transports: ["websocket", "polling"],
});

const createRoom = () => {
  playerName = playerNameInput.value;
  roomID = roomId.value;

  if (!roomID) {
    alert("Please enter a Room ID to create a room");
    return;
  }

  if (!playerName) {
    alert("Please enter your name");
    return;
  }

  player1 = true;
  socket.emit("createRoom", { roomID, playerName });
  waitingMessage.classList.remove("none");
  waitingMessage.innerText = "Waiting for opponent to join...";
};

const joinRoom = () => {
  playerName = playerNameInput.value;
  roomID = roomId.value;

  if (!roomID) {
    alert("Room ID is required");
    return;
  }

  if (!playerName) {
    alert("Please enter your name");
    return;
  }

  socket.emit("joinRoom", { roomID, playerName });
};

socket.on("roomExists", () => {
  alert("Room already exists. Please choose a different Room ID.");
});

socket.on("roomNotFound", () => {
  alert("Room not found. Please check the Room ID.");
});

socket.on("roomFull", () => {
  alert("Room is full. Maximum 2 players allowed.");
});

socket.on("playersConnected", (data) => {
  joinPage.classList.add("none");
  header.classList.add("flex");
  gameArea.classList.add("grid");
  gameFooter.classList.add("flex");

  if (data && data.opponentName) {
    opponentPlayerName = data.opponentName;
    opponentName.innerText = `Playing against: ${opponentPlayerName}`;
    opponentName.classList.remove("none");
  }
});

socket.on("opponentJoined", (data) => {
  opponentPlayerName = data.playerName;
  opponentName.innerText = `Playing against: ${opponentPlayerName}`;
  opponentName.classList.remove("none");
  waitingMessage.classList.add("none");
});

const updatePlayerStatus = () => {
  if (playerHasChosen && !opponentHasChosen) {
    playerStatus.innerText = "Waiting for opponent to choose...";
  } else if (!playerHasChosen && opponentHasChosen) {
    playerStatus.innerText = "Opponent has chosen. Your turn!";
  } else {
    playerStatus.innerText = "";
  }
};

const clickChoice = (rpschoice) => {
  let player;
  if (player1 == true) {
    player = "p1Choice";
  } else if (player1 == false) {
    player = "p2Choice";
  }

  playerHasChosen = true;
  updatePlayerStatus();

  gameArea.classList.add("none");
  resultBoard.classList.add("grid");
  if (rpschoice == "rock") {
    yourChoice.innerHTML = rockChoice;
    yourChoice.classList.toggle("increase-size");
  }
  if (rpschoice == "paper") {
    yourChoice.innerHTML = paperChoice;
    yourChoice.classList.toggle("increase-size");
  }
  if (rpschoice == "scissor") {
    yourChoice.innerHTML = scissorChoice;
    yourChoice.classList.toggle("increase-size");
  }

  const isNoneResultBoard = resultBoard.classList.contains("none");
  if (isNoneResultBoard) {
    resultBoard.classList.remove("none");
    resultBoard.classList.add("grid");
    resultBoard.classList.add("after-choosing");
  }

  socket.emit(player, {
    rpschoice: rpschoice,
    roomID: roomID,
  });
};

const displayResult = (choice) => {
  results.classList.remove("none");
  results.classList.add("grid");
  oppoChoice.classList.remove("waiting_to_chose");
  if (choice == "rock") {
    oppoChoice.innerHTML = rockChoice;
    oppoChoice.classList.toggle("increase-size");
  }
  if (choice == "paper") {
    oppoChoice.innerHTML = paperChoice;
    oppoChoice.classList.toggle("increase-size");
  }
  if (choice == "scissor") {
    oppoChoice.innerHTML = scissorChoice;
    oppoChoice.classList.toggle("increase-size");
  }
};

socket.on("p1Choice", (data) => {
  if (!player1) {
    console.log("p1Choice");
    opponentHasChosen = true;
    updatePlayerStatus();
    displayResult(data.rpsValue);
    oppoTitle.innerText = `${opponentPlayerName} PICKED`;
    oppoChoice.classList.remove("waiting_to_chose");
  }
});

socket.on("p2Choice", (data) => {
  if (player1) {
    console.log("p2Choice");
    opponentHasChosen = true;
    updatePlayerStatus();
    displayResult(data.rpsValue);
    oppoTitle.innerText = `${opponentPlayerName} PICKED`;
    oppoChoice.classList.remove("waiting_to_chose");
  }
});

socket.on("opponentMadeChoice", () => {
  opponentHasChosen = true;
  updatePlayerStatus();
});

const updateScore = (p1Score, p2Score) => {
  if (player1) {
    scoreNum.innerText = p1Score;
  }

  if (!player1) {
    scoreNum.innerText = p2Score;
  }
};

socket.on("winner", (data) => {
  winner = data.winner;

  if (winner == "draw") {
    resultsHeading.innerText = "DRAW";
  } else if (winner == "p1") {
    if (player1) {
      resultsHeading.innerText = "YOU WIN";
      resultButton.style.color = "#0D9276";
      yourChoice.classList.add("winner");
      player1Score = data.p1Score;
      updateScore(player1Score, player2Score);
    } else {
      resultsHeading.innerText = "YOU LOSE";
      resultButton.style.color = "#FF004D";
      oppoChoice.classList.add("winner");
      player2Score = data.p2Score;
      updateScore(player1Score, player2Score);
    }
  } else if (winner == "p2") {
    if (!player1) {
      resultsHeading.innerText = "YOU WIN";
      resultButton.style.color = "#0D9276";
      yourChoice.classList.add("winner");
      player2Score = data.p2Score;
      updateScore(player1Score, player2Score);
    } else {
      resultsHeading.innerText = "YOU LOSE";
      resultButton.style.color = "#FF004D";
      oppoChoice.classList.add("winner");
      player1Score = data.p1Score;
      updateScore(player1Score, player2Score);
    }
  }

  resultBoard.classList.add("after-choosing");
  results.classList.remove("none");
  results.classList.add("grid");
});

const returnToGame = () => {
  resultBoard.classList.remove("grid");
  resultBoard.classList.add("none");
  resultBoard.classList.remove("after-choosing");
  // results
  results.classList.remove("grid");
  results.classList.add("none");
  // choice
  yourChoice.innerHTML = "";
  yourChoice.classList.toggle("increase-size");
  oppoChoice.innerHTML = "";
  oppoChoice.classList.toggle("increase-size");
  // main game area
  gameArea.classList.remove("none");
  gameArea.classList.add("grid");
  // OPPO choice
  oppoTitle.innerText = "Choosing...";
  oppoChoice.classList.add("waiting_to_chose");

  // Reset choice status
  playerHasChosen = false;
  opponentHasChosen = false;
  updatePlayerStatus();
};

const removeWinner = () => {
  if (
    oppoChoice.classList.contains("winner") ||
    yourChoice.classList.contains("winner")
  ) {
    oppoChoice.classList.remove("winner");
    yourChoice.classList.remove("winner");
  }
};

const playAgain = () => {
  socket.emit("playerClicked", {
    roomID: roomID,
    player1: player1,
  });
  removeWinner();
  returnToGame();
};

socket.on("playAgain", () => {
  removeWinner();
  returnToGame();
});

const returnToLogin = () => {
  joinPage.classList.remove("none");
  joinPage.classList.add("flex");
  header.classList.remove("flex");
  header.classList.add("none");
  gameArea.classList.remove("grid");
  gameArea.classList.add("none");
  gameFooter.classList.remove("flex");
  gameFooter.classList.add("none");
  resultBoard.classList.remove("grid");
  resultBoard.classList.add("none");

  // Reset player info
  playerName = "";
  opponentPlayerName = "";
  playerHasChosen = false;
  opponentHasChosen = false;
  playerNameInput.value = "";
  roomId.value = "";
  waitingMessage.classList.add("none");
  opponentName.classList.add("none");
};

const exitGame = () => {
  socket.emit("exitGame", { roomID: roomID, player: player1 });
  returnToLogin();
};

socket.on("player1Left", () => {
  if (!player1) {
    alert(`${opponentPlayerName} left the game`);
    returnToLogin();
  }
});

socket.on("player2Left", () => {
  if (player1) {
    alert(`${opponentPlayerName} left the game`);
    returnToLogin();
  }
});
