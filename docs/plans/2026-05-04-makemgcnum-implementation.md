# Make 10 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a real-time multiplayer board game 'Make 10' with a custom formula parser and a "Modern & Tech" dark mode UI.

**Architecture:** Server-authoritative state management using Node.js and Socket.io. Custom Shunting-yard algorithm for formula evaluation to ensure safety and rule compliance.

**Tech Stack:** Node.js, Express, Socket.io, Vanilla JS, CSS3, Jest (for testing).

---

### Task 1: Project Initialization
**Files:**
- Create: `package.json`
- Create: `server.js` (skeleton)

**Step 1: Create package.json with dependencies**
```json
{
  "name": "pjt-makemgcnum",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

**Step 2: Install dependencies**
Run: `npm install`

**Step 3: Commit**
```bash
git add package.json
git commit -m "chore: initialize project and dependencies"
```

---

### Task 2: Custom Formula Parser (The Core Engine)
**Files:**
- Create: `utils/parser.js`
- Create: `tests/parser.test.js`

**Step 1: Write failing tests for basic operations and constraints**
```javascript
const { evaluate } = require('../utils/parser');
test('evaluates basic 1+2*3 to 7', () => { expect(evaluate('1+2*3')).toBe(7); });
test('checks special operator constraint: √9 is 3', () => { expect(evaluate('√9')).toBe(3); });
test('fails special operator constraint: √8', () => { expect(() => evaluate('√8')).toThrow(); });
```

**Step 2: Implement Shunting-yard algorithm in `utils/parser.js`**
Include support for `+`, `-`, `*`, `/`, `√`, `²`, `!`.

**Step 3: Run tests and verify**
Run: `npm test`
Expected: PASS

**Step 4: Commit**
```bash
git add utils/parser.js tests/parser.test.js
git commit -m "feat: implement custom formula parser with special operators"
```

---

### Task 3: Server Side Room & Game Logic
**Files:**
- Modify: `server.js`

**Step 1: Implement Socket.io room management**
- Handle `joinRoom`, `startGame` events.
- Implement Deck shuffling and dealing logic.

**Step 2: Implement Turn-based actions**
- Handle `drawCard`, `swapCard`.
- Validate formula submission using the custom parser.

**Step 3: Commit**
```bash
git add server.js
git commit -m "feat: implement server-side game logic and room management"
```

---

### Task 4: Frontend "Modern & Tech" UI
[COMPLETED]

### Task 5: Opponent Info & Last Discarded Visibility
**Files:**
- Modify: `server.js`
- Modify: `public/index.html`

**Step 1: Update server to track last discarded card**
- In `swapCard` event, save the discarded card value to `player.lastDiscarded`.

**Step 2: Update UI to show Other Players**
- Create a container for other players' status.
- Show their nickname, hand count, and the `lastDiscarded` card with a special tech-style border.

**Step 3: Commit**
```bash
git add server.js public/index.html
git commit -m "feat: add opponent info area and last discarded card visibility"
```
