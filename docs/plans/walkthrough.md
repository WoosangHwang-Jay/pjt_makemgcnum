# Make Magic Number Project Walkthrough

## 1. Overview
The 'Make Magic Number' online board game has been completely overhauled to feature an authentic, rustic "Agricola-style" (Klemens Franz) board game aesthetic. It features real-time multiplayer capabilities, a safe custom formula parser, item mechanics, and robust server-side state validation.

## 2. Key Features
- **Authentic Board Game Aesthetic**: Deep visual rebranding using generated folk-art assets, parchment textures, and a custom 6-character selection screen.
- **Real-time Gameplay**: Powered by Socket.io, allowing players to join rooms, draw cards, use items (Clover, Hourglass, Treasure, etc.), and submit math formulas.
- **Custom Shunting-yard Parser**: Safely evaluates math expressions with special operators (√, ², !) while enforcing strict input rules.
- **Robust Security**: Server-side validations ensure that only the Host can start the game, and players can only submit winning formulas on their active turn, preventing out-of-sync cheats.
- **Dynamic UX**: Uses seamless CSS animations and an elegant toast notification system instead of harsh browser alerts.

## 3. Verification Results
- **Visuals**: Confirmed 6-avatar selection grid fits perfectly within the side-plaque layout.
- **Logic Security**: Verified that `startGame` and `submitFormula` socket events are properly gated by host and turn checks.
- **State Integrity**: Ensured that leaving a room mid-action completely resets local item and card selection states.

## 5. Recent Bug Fixes (2026-05-10)
- **Initial Card Distribution Fixed**: Resolved a critical "No Initial Cards" bug where players received an empty hand at game start. Replaced unreliable array mapping with a robust loop-based allocation in `server.js`.
- **Start Button Visibility**: Fixed a Javascript error in `updateUI` (caused by referencing a deleted button ID) that prevented the "Start Game" button from appearing for the host.
- **Formula Workshop Sync**: Fixed a UI bug where cards remained disabled in the hand even after being cleared from the workshop. The hand cards now correctly synchronize their "in-formula" status whenever the workshop is updated.
- **New Turn Auto-Reset**: Added logic to automatically clear the formula workshop when a new turn begins, preventing state leakage from previous turns.
- **Item Usage Fixed**: Resolved a critical issue where the item confirmation modal was missing from the HTML, causing items (like Whirlwind) to be unresponsive.
- **Turn-based Validation**: Added client-side checks to ensure items can only be used during the player's active turn, providing clear feedback via Toast notifications.
- **Consistency Audit**: 
    - Synced "Hourglass" (⏳) description with server logic (+1 AP).
    - Added safety checks for "Glove" (🧤) to prevent usage when no opponents are present.
- **Stability**: Verified all 10/10 math parser test cases pass after the UI updates.

## 6. Strategic Rule Changes & Fast-paced Gameplay (2026-05-10)
- **Early Game Buff**: 
    - When the Magic Number is 50 or 100, players start with **4 Number cards and 2 Operator cards** (instead of 2/1).
    - The central market now offers **5 Numbers and 3 Operators** for more variety from the start.
- **Choice-based Drawing (Separated Decks)**:
    - Replaced the generic draw button with **two interactive card decks** on the board. Players can now strategically choose to draw either a Number or an Operator.
- **Auto-Win (Magic Match)**:
    - Implemented a seamless victory system. As soon as the assembled formula matches the target number, the game automatically validates and ends, eliminating the need for a manual submit button. (Manual submit button remains as a backup/visual guide).

## 7. How to Run
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open `http://localhost:3000` in multiple tabs to play.
