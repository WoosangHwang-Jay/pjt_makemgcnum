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

## 4. How to Run
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open `http://localhost:3000` in multiple tabs to play.
