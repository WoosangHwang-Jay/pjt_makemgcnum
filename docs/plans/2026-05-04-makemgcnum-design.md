# 2026-05-04-makemgcnum-design

## 1. Project Overview
- **Name**: Make 10 (Online Board Game)
- **Goal**: Create a real-time multiplayer card-based math strategy game where players aim to form the number 10 using their hand and shared cards.
- **Key Philosophy**: "Modern & Tech" - A premium, high-tech aesthetic that appeals to strategy enthusiasts.

## 2. Core Game Logic
### Card Deck Composition
- **Numbers**: 1~3 (8 each), 4~6 (10 each), 7~9 (4 each), 0 (4 each)
- **Basic Operators**: +, -, *, /
- **Special Operators (Constrained)**:
    - `√` (Prefix): Input ∈ [0, 1, 4, 9]
    - `²` (Postfix): Input ∈ [0, 1, 2, 3]
    - `!` (Postfix): Input ∈ [0, 1, 2, 3]

### Game Flow
1. **Host Starts**: Shuffles deck, deals 5 cards to each player, opens 3 shared cards.
2. **Turns**: Draw from deck OR swap 1 hand card with 1 shared card.
3. **Winning**: Any player can submit a valid equation (=10) at any time (or on their turn, depending on preference).

## 3. Technical Design
### Architecture
- **Backend**: Node.js + Socket.io. Server-authoritative state management.
- **Frontend**: Vanilla JS + HTML/CSS. Responsive Single Page Application (SPA).
- **Formula Parser**: Custom Shunting-yard algorithm for safe, rule-compliant evaluation without `eval()`.

### Data Schema
```javascript
Room: {
  code: String(6),
  players: [Player],
  deck: Array,
  sharedCards: Array,
  turnIndex: Number,
  status: "waiting" | "playing"
}
```

## 4. Visual Design (Modern & Tech)
### Color Palette
- **Background**: Deep Navy (#0a0f1e) / Charcoal (#121212)
- **Numbers**: Cyan Blue (#00f2ff) with outer glow.
- **Basic Ops**: High-contrast White (#ffffff).
- **Special Ops**: Neon Yellow (#e2ff00) or Magenta (#ff00e6) for "Power Item" feel.

### UI Components
- **Cards**: Glassmorphic finish, large central numbers, corner indices for fanned viewing.
- **Input Field**: Fixed at bottom, real-time formula preview with "Success/Fail" indicator.
- **Animations**: Socket-driven state updates with CSS transitions for card movements.

## 5. Verification Plan
- **Logic**: Unit tests for the Shunting-yard parser with all constraint edge cases.
- **Sync**: Multi-tab browser testing to ensure real-time consistency.
- **UI**: Visual check for "Modern & Tech" aesthetic and responsiveness.
