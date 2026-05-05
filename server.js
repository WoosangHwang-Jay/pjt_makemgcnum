const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { evaluate } = require('./utils/parser'); // 파서 연결

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

// --- Room Name Generator ---
const ADJECTIVES = ['즐거운', '포근한', '신나는', '정겨운', '햇살가득', '행복한', '꿈꾸는', '작은', '커다란', '지혜로운'];
const NOUNS = ['농장', '서재', '방', '숲속', '다락방', '놀이터', '오두막', '정원', '언덕', '마을'];

function getRandomRoomName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj} ${noun}`;
}

function getRandomNickname() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const characters = ['다람쥐', '올빼미', '탐험가', '여우', '수학자', '고양이', '토끼', '너구리'];
    const char = characters[Math.floor(Math.random() * characters.length)];
    return `${adj} ${char}`;
}

function getActiveRooms() {
    const list = Object.keys(rooms)
        .filter(code => rooms[code] && rooms[code].players && rooms[code].players.length > 0)
        .map(code => ({
            code,
            playerCount: rooms[code].players.length,
            status: rooms[code].status,
            targetNumber: rooms[code].targetNumber || 10
        }));
    return list;
}

// --- Game Logic ---
function createDecks() {
    const numDeck = [];
    for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 4; j++) numDeck.push(i);
    }
    const ops = ['+', '-', '*', '/', '√', '²', '!'];
    const opDeck = [];
    ops.forEach(op => {
        for (let j = 0; j < 5; j++) opDeck.push(op);
    });
    return { numDeck: shuffle(numDeck), opDeck: shuffle(opDeck) };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Socket Helpers ---
function auditRooms() {
    let changed = false;
    const sids = io.sockets.adapter.sids;
    console.log(`[Audit Start] Physical Sockets: ${sids.size}, Recorded Rooms: ${Object.keys(rooms).length}`);
    
    for (const code of Object.keys(rooms)) {
        const room = rooms[code];
        if (!room || !room.players) {
            console.log(`[Audit] Deleting corrupted room data: ${code}`);
            delete rooms[code];
            changed = true;
            continue;
        }

        const initialCount = room.players.length;
        
        // 유령 플레이어 상세 로그
        room.players = room.players.filter(p => {
            const isAlive = sids.has(p.id);
            if (!isAlive) console.log(`[Audit] Found Ghost! Room: ${code}, Nickname: ${p.nickname}, ID: ${p.id}`);
            return isAlive;
        });
        
        if (room.players.length !== initialCount) {
            console.log(`[Audit] Cleaned ${initialCount - room.players.length} ghosts from room: ${code}`);
            changed = true;
        }

        if (room.players.length === 0) {
            console.log(`[Audit] Deleting now-empty room: ${code}`);
            delete rooms[code];
            changed = true;
        } else if (changed) {
            room.players.forEach((p, i) => p.isHost = (i === 0));
            io.to(code).emit('roomUpdate', room);
        }
    }
    console.log(`[Audit End] Changed: ${changed}, Final Room Count: ${Object.keys(rooms).length}`);
    return changed;
}

function leaveAllRooms(socket) {
    let changed = false;
    for (const code in rooms) {
        const room = rooms[code];
        const initialCount = room.players.length;
        
        // 해당 소켓 ID를 가진 모든 항목을 한꺼번에 제거 (누적 방지)
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length !== initialCount) {
            console.log(`[Cleanup] Removed ${socket.id} (Instances: ${initialCount - room.players.length}) from ${code}`);
            if (room.players.length === 0) {
                delete rooms[code];
            } else {
                room.players.forEach((p, i) => p.isHost = (i === 0));
                io.to(code).emit('roomUpdate', room);
            }
            changed = true;
        }
    }
    // 인원 변화가 있다면 무조건 모든 로비 사용자에게 알림
    io.emit('roomList', getActiveRooms());
}

io.on('connection', (socket) => {
    console.log(`[Socket] New Connection: ${socket.id}`);
    socket.emit('roomList', getActiveRooms());

    socket.on('requestRoomList', () => {
        auditRooms(); 
        // 무조건 모든 클라이언트에게 최신 목록 배포 (잔상 제거)
        io.emit('roomList', getActiveRooms());
    });

    socket.on('requestRandomName', () => {
        socket.emit('suggestedRoomName', getRandomRoomName());
    });

    socket.on('requestRandomNickname', () => {
        socket.emit('suggestedNickname', getRandomNickname());
    });

    socket.on('joinRoom', ({ roomCode, nickname, avatarIdx, type, targetNumber }) => {
        if (!roomCode || !nickname) return socket.emit('error', '정보가 부족합니다.');
        
        // 무조건 이전 기록을 모두 지우고 시작
        leaveAllRooms(socket);

        if (type === 'create') {
            if (rooms[roomCode]) return socket.emit('error', '이미 존재하는 방 이름입니다.');
            const target = [10, 50, 100].includes(parseInt(targetNumber)) ? parseInt(targetNumber) : 10;
            rooms[roomCode] = {
                code: roomCode,
                status: 'waiting',
                players: [],
                numDeck: [], opDeck: [],
                sharedNumbers: [], sharedOperators: [],
                turnIndex: 0,
                currentAP: 2,
                targetNumber: target
            };
        } else {
            if (!rooms[roomCode]) return socket.emit('error', '방이 존재하지 않습니다.');
            if (rooms[roomCode].players.length >= 4) return socket.emit('error', '방이 가득 찼습니다.');
        }

        const room = rooms[roomCode];
        if (!room.code) room.code = roomCode;
        
        // [추가] 동일 소켓 ID 중복 체크 (안전장치)
        if (room.players.some(p => p.id === socket.id)) return;

        const player = { 
            id: socket.id, nickname,
            // ✅ avatarIdx 서버 측 유효성 검증 (0-5 범위 보정)
            avatarIdx: Math.min(Math.max(parseInt(avatarIdx) || 0, 0), 5),
            handNumbers: [], handOperators: [], handItems: [],
            lastDiscarded: null, isHost: room.players.length === 0 
        };
        room.players.push(player);
        socket.join(roomCode);
        
        console.log(`[Room] ${nickname} joined ${roomCode} as ${player.isHost ? 'Host' : 'Guest'}`);
        socket.emit('joinRoomSuccess');
        io.to(roomCode).emit('roomUpdate', room);
        io.emit('roomList', getActiveRooms());
    });

    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length >= 2) {
            // ✅ 권한 검증: 방장(Host)만 게임을 시작할 수 있음
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) {
                return socket.emit('error', '방장만 게임을 시작할 수 있습니다.');
            }
            
            const { numDeck, opDeck } = createDecks();
            room.numDeck = numDeck;
            room.opDeck = opDeck;
            room.sharedNumbers = [room.numDeck.pop(), room.numDeck.pop(), room.numDeck.pop()];
            room.sharedOperators = [room.opDeck.pop(), room.opDeck.pop()];
            room.players.forEach(p => {
                p.handNumbers = [room.numDeck.pop(), room.numDeck.pop()];
                p.handOperators = [room.opDeck.pop()];
                p.handItems = []; // 아이템 가방 초기화
            });
            room.status = 'playing';
            room.currentAP = 2; // 게임 시작 시 첫 플레이어 AP 설정
            io.to(roomCode).emit('gameStarted', room);
            io.emit('roomList', getActiveRooms());
            console.log(`[Game] Started in room: ${roomCode}`);
        } else {
            socket.emit('error', '최소 2명의 플레이어가 필요합니다.');
        }
    });

    socket.on('drawCard', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing' || room.currentAP <= 0) return;
        const player = room.players[room.turnIndex];
        if (player.id !== socket.id) return socket.emit('error', '자신의 차례가 아닙니다.');

        const canDrawNum = player.handNumbers.length < 7;
        const canDrawOp = player.handOperators.length < 4;
        const canDrawItem = player.handItems.length < 3;

        if (!canDrawNum && !canDrawOp && !canDrawItem) {
            return socket.emit('error', '모든 카드가 가득 찼습니다! 수식을 만들거나 교체를 해보세요.');
        }

        let drawn = false;

        // 아이템 뽑기 확률 (약 20%) - 아이템 슬롯이 있을 때만
        if (Math.random() < 0.20 && canDrawItem) {
            const items = ['🍀', '⏳', '🎁', '🌀', '🧤'];
            player.handItems.push(items[Math.floor(Math.random() * items.length)]);
            drawn = true;
        } else {
            // 뽑을 수 있는 타입만 후보로 등록 (용량 + 덱 잔량 모두 확인)
            const drawableTypes = [];
            if (canDrawNum && room.numDeck.length > 0) drawableTypes.push('number');
            if (canDrawOp && room.opDeck.length > 0) drawableTypes.push('operator');

            if (drawableTypes.length > 0) {
                const typeToDraw = drawableTypes[Math.floor(Math.random() * drawableTypes.length)];
                if (typeToDraw === 'number') {
                    player.handNumbers.push(room.numDeck.pop());
                } else {
                    player.handOperators.push(room.opDeck.pop());
                }
                drawn = true;
            } else if (canDrawItem) {
                // 일반 카드를 뽑을 수 없으면 아이템 강제 뽑기
                const items = ['🍀', '⏳', '🎁', '🌀', '🧤'];
                player.handItems.push(items[Math.floor(Math.random() * items.length)]);
                drawn = true;
            }
        }

        if (drawn) {
            room.currentAP--;
            if (room.currentAP <= 0) {
                room.turnIndex = (room.turnIndex + 1) % room.players.length;
                room.currentAP = 2; // 다음 사람 2 AP 충전
            }
            io.to(roomCode).emit('roomUpdate', room);
        } else {
            socket.emit('error', '덱에 남은 카드가 없습니다.');
        }
    });

    socket.on('swapCard', ({ roomCode, type, handIdx, sharedIdx }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing' || room.currentAP <= 0) return;
        const player = room.players[room.turnIndex];
        if (player.id !== socket.id) return socket.emit('error', '자신의 차례가 아닙니다.');

        try {
            if (type === 'number') {
                const temp = player.handNumbers[handIdx];
                player.handNumbers[handIdx] = room.sharedNumbers[sharedIdx];
                room.sharedNumbers[sharedIdx] = temp;
            } else {
                const temp = player.handOperators[handIdx];
                player.handOperators[handIdx] = room.sharedOperators[sharedIdx];
                room.sharedOperators[sharedIdx] = temp;
            }
            
            room.currentAP--;
            if (room.currentAP <= 0) {
                room.turnIndex = (room.turnIndex + 1) % room.players.length;
                room.currentAP = 2;
            }
            io.to(roomCode).emit('roomUpdate', room);
        } catch (e) {
            socket.emit('error', '카드 교체 중 오류가 발생했습니다.');
        }
    });

    socket.on('useItem', ({ roomCode, itemIdx, targetId, extraData }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing' || room.currentAP <= 0) return;
        const player = room.players[room.turnIndex];
        if (player.id !== socket.id) return socket.emit('error', '자신의 차례가 아닙니다.');

        const item = player.handItems[itemIdx];
        if (!item) return;

        let used = false;
        if (item === '🍀') { // 네잎클로버: 즉시 풀 보충
            // 숫자와 연산 모두 가득 찼으면 사용 불가
            if (player.handNumbers.length >= 7 && player.handOperators.length >= 4) {
                return socket.emit('error', '숫자(7장)와 연산(4장)이 모두 가득 찼습니다! 먼저 수식을 만들거나 교체해보세요.');
            }
            while (player.handNumbers.length < 7 && room.numDeck.length > 0) player.handNumbers.push(room.numDeck.pop());
            while (player.handOperators.length < 4 && room.opDeck.length > 0) player.handOperators.push(room.opDeck.pop());
            used = true;
        } else if (item === '⏳') { // 모래시계: 행동 포인트 보너스 (항상 사용 가능)
            room.currentAP += 2; 
            used = true;
        } else if (item === '🌀') { // 소용돌이: 시장 새로고침
            room.sharedNumbers = room.sharedNumbers.map(() => {
                const card = room.numDeck.pop();
                return card !== undefined ? card : room.sharedNumbers[0] || 5;
            });
            room.sharedOperators = room.sharedOperators.map(() => {
                const card = room.opDeck.pop();
                return card !== undefined ? card : room.sharedOperators[0] || '+';
            });
            used = true;
        } else if (item === '🎁') { // 보물상자: 시장 카드 1장 무료 획득
            if (extraData) {
                const { type, idx } = extraData;
                // 선택한 타입의 손패가 가득 찼으면 사용 불가
                if (type === 'number' && player.handNumbers.length >= 7) {
                    return socket.emit('error', '숫자 카드가 이미 7장 가득 찼습니다!');
                }
                if (type === 'operator' && player.handOperators.length >= 4) {
                    return socket.emit('error', '연산 카드가 이미 4장 가득 찼습니다!');
                }
                const card = type === 'number' ? room.sharedNumbers[idx] : room.sharedOperators[idx];
                if (type === 'number') {
                    player.handNumbers.push(card);
                    const replacement = room.numDeck.pop();
                    room.sharedNumbers[idx] = replacement !== undefined ? replacement : card;
                } else {
                    player.handOperators.push(card);
                    const replacement = room.opDeck.pop();
                    room.sharedOperators[idx] = replacement !== undefined ? replacement : card;
                }
                used = true;
            }
        } else if (item === '🧤') { // 도둑장갑: 무작위 상대방 카드 교체 (항상 사용 가능)
            const opponents = room.players.filter(p => p.id !== socket.id);
            const target = targetId ? room.players.find(p => p.id === targetId) : opponents[Math.floor(Math.random() * opponents.length)];
            if (target) {
                if (target.handNumbers.length > 0) target.handNumbers[Math.floor(Math.random() * target.handNumbers.length)] = room.numDeck.pop() || 3;
                if (target.handOperators.length > 0) target.handOperators[Math.floor(Math.random() * target.handOperators.length)] = room.opDeck.pop() || '+';
                io.to(target.id).emit('error', '앗! 누군가 내 카드를 바꿔치기했습니다! 🧤');
                used = true;
            }
        }

        if (used) {
            player.handItems.splice(itemIdx, 1);
            room.currentAP--;
            if (room.currentAP <= 0) {
                room.turnIndex = (room.turnIndex + 1) % room.players.length;
                room.currentAP = 2;
            }
            io.to(roomCode).emit('roomUpdate', room);
            io.to(roomCode).emit('itemEffect', { item, user: player.nickname });
        }
    });

    socket.on('submitFormula', ({ roomCode, formula }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        // ✅ 턴 검증: 자신의 턴일 때만 수식을 제출할 수 있음
        if (room.players[room.turnIndex].id !== socket.id) {
            return socket.emit('error', '자신의 차례가 아닙니다. 친구가 고민 중이에요!');
        }
        
        try {
            // 1. 수식 검증 (손패 확인)
            const numsInFormula = (formula.match(/\d+/g) || []).map(Number);
            const opsInFormula = formula.match(/[\+\-\*\/\√\²\!]/g) || [];
            
            const tempHandNums = [...player.handNumbers];
            const tempHandOps = [...player.handOperators];
            
            for (let n of numsInFormula) {
                const idx = tempHandNums.indexOf(n);
                if (idx === -1) throw new Error(`본인의 숫자 카드에 ${n}이 없습니다.`);
                tempHandNums.splice(idx, 1);
            }
            for (let o of opsInFormula) {
                const idx = tempHandOps.indexOf(o);
                if (idx === -1) throw new Error(`본인의 연산 카드에 ${o}가 없습니다.`);
                tempHandOps.splice(idx, 1);
            }
            
            // 2. 수식 계산
            const result = evaluate(formula);
            console.log(`[Submit] ${player.nickname} formula: ${formula} = ${result} (target: ${room.targetNumber || 10})`);

            if (result === (room.targetNumber || 10)) {
                io.to(roomCode).emit('gameOver', { winner: player.nickname, formula, target: room.targetNumber || 10 });
                delete rooms[roomCode];
                io.emit('roomList', getActiveRooms());
            } else {
                socket.emit('error', `계산 결과가 ${result}입니다. ${room.targetNumber || 10}을 만들어야 해요!`);
            }
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('leaveRoom', (roomCode) => {
        leaveAllRooms(socket);
    });

    socket.on('disconnect', () => {
        leaveAllRooms(socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
