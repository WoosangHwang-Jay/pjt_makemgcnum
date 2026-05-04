const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { evaluate } = require('./utils/parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

function createDeck() {
    const deck = [];
    // Numbers: 1~3 (8 each), 4~6 (10 each), 7~9 (4 each), 0 (4 each)
    const counts = { 0: 4, 1: 8, 2: 8, 3: 8, 4: 10, 5: 10, 6: 10, 7: 4, 8: 4, 9: 4 };
    for (const [num, count] of Object.entries(counts)) {
        for (let i = 0; i < count; i++) deck.push(parseInt(num));
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomCode, nickname }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                status: 'waiting',
                players: [],
                deck: [],
                sharedCards: [],
                turnIndex: 0
            };
        }
        const room = rooms[roomCode];
        const player = { id: socket.id, nickname, hand: [], lastDiscarded: null, isHost: room.players.length === 0 };
        room.players.push(player);
        socket.join(roomCode);
        io.to(roomCode).emit('roomUpdate', room);
    });

    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.status === 'waiting') {
            room.status = 'playing';
            room.deck = createDeck();
            room.sharedCards = room.deck.splice(0, 3);
            room.players.forEach(p => {
                p.hand = room.deck.splice(0, 5);
            });
            io.to(roomCode).emit('gameStarted', room);
        }
    });

    socket.on('drawCard', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.status === 'playing') {
            const player = room.players[room.turnIndex];
            if (player.id === socket.id && room.deck.length > 0) {
                player.hand.push(room.deck.pop());
                room.turnIndex = (room.turnIndex + 1) % room.players.length;
                io.to(roomCode).emit('roomUpdate', room);
            }
        }
    });

    socket.on('swapCard', ({ roomCode, handCardIndex, sharedCardIndex }) => {
        const room = rooms[roomCode];
        if (room && room.status === 'playing') {
            const player = room.players[room.turnIndex];
            if (player.id === socket.id) {
                const temp = player.hand[handCardIndex];
                player.hand[handCardIndex] = room.sharedCards[sharedCardIndex];
                room.sharedCards[sharedCardIndex] = temp;
                player.lastDiscarded = temp; // Track the card put down
                room.turnIndex = (room.turnIndex + 1) % room.players.length;
                io.to(roomCode).emit('roomUpdate', room);
            }
        }
    });

    socket.on('submitFormula', ({ roomCode, formula }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        try {
            // Basic check: Result is 10?
            const result = evaluate(formula);
            if (result !== 10) {
                socket.emit('error', 'Result is not 10');
                return;
            }

            // Advanced check: Do they have the numbers?
            const player = room.players.find(p => p.id === socket.id);
            const availableNumbers = [...player.hand, ...room.sharedCards];
            const usedNumbers = formula.match(/\d+/g).map(Number);
            
            const tempAvailable = [...availableNumbers];
            for (const num of usedNumbers) {
                const idx = tempAvailable.indexOf(num);
                if (idx === -1) {
                    socket.emit('error', `You don't have number ${num}`);
                    return;
                }
                tempAvailable.splice(idx, 1);
            }

            // Success!
            io.to(roomCode).emit('gameOver', { winner: player.nickname, formula });
            room.status = 'waiting';
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('disconnect', () => {
        // Simple cleanup: remove empty rooms or player from room
        for (const code in rooms) {
            const room = rooms[code];
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                if (room.players.length === 0) delete rooms[code];
                else io.to(code).emit('roomUpdate', room);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
