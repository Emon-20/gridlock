# 🔒 GridLock — Claim Your Territory

A beautiful, strategic two-player territory game built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies — just pure web.

![GridLock](https://img.shields.io/badge/Game-GridLock-6C5CE7?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🎮 How to Play

1. **Objective** — Score the most points by completing boxes on the grid
2. **Gameplay** — Players take turns clicking between adjacent dots to draw a line
3. **Scoring** — Complete all 4 sides of a box to claim it and score **1 point**
4. **Bonus Turn** — Completing a box earns you an **extra turn**!
5. **Timer** — Each player has **15 seconds** per move. If time runs out, the turn is **skipped**
6. **Winner** — The player with the most boxes when all lines are drawn **wins!**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 👥 **Player vs Player** | Two players on the same device |
| 🤖 **Player vs Computer** | Smart AI opponent with strategic decision-making |
| ⏱️ **Move Timer** | 15-second countdown per turn — keeps the game fast |
| ↩ **Undo** | Take back your last move (undoes AI response too in PvC) |
| 🔄 **Restart** | Reset the game at any time |
| 🏆 **Win/Draw Modal** | Beautiful animated result screen with confetti |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 🎨 **Dark Theme** | Immersive deep color palette with glow effects |

---

## 🚀 Getting Started

### Quick Start

1. **Clone or download** this project
2. **Open `index.html`** in any modern web browser
3. **Select a mode** — vs Player or vs Computer
4. **Start clicking** between dots to draw lines!

```bash
# No build step needed — just open in browser!
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

### Controls

| Action | How |
|--------|-----|
| Draw a line | Click between two adjacent dots |
| Undo | Click the **↩ Undo** button |
| Restart | Click the **↻ Restart** button |
| Switch mode | Click **👥 vs Player** or **🤖 vs Computer** |

---

## 🎨 Color Palette

GridLock uses **4 deep colors** for a focused, immersive experience:

| Color | Hex | Role |
|-------|-----|------|
| 🌑 Deep Space | `#0B0B1A` | Background |
| 🔴 Crimson Flame | `#FF4757` | Player 1 |
| 🟢 Emerald Glow | `#2ED8A3` | Player 2 / Computer |
| 🟣 Royal Purple | `#6C5CE7` | UI accents, dots, buttons |

---

## 🧠 AI Strategy

The computer opponent uses a **3-tier priority system**:

1. **🎯 Complete** — If any box has 3 sides drawn, take the 4th and score
2. **🛡️ Safe Move** — Draw a line that doesn't create a 3-sided box (avoiding giving the opponent a free point)
3. **📉 Least Damage** — If all moves are risky, pick the one that gives away the fewest boxes

---

## 📁 Project Structure

```
gridlock/
├── index.html    → Game structure & layout
├── style.css     → Styling, animations & responsive design
├── script.js     → Game logic, AI & timer
└── README.md     → This file
```

---

## 🔧 Customization

You can easily tweak game settings in `script.js`:

```javascript
const CONFIG = {
    GRID_SIZE: 5,        // 5×5 dots → 4×4 boxes (try 4 for smaller, 6 for bigger)
    MOVE_TIME: 15,       // Seconds per move
    AI_DELAY: 600,       // Ms before AI's first move
    AI_CHAIN_DELAY: 350, // Ms between AI chain moves (after completing a box)
};
```

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 90+
- ✅ Safari 15+
- ✅ Edge 90+

---

## 📄 License

This project is open source and free to use. Feel free to modify and share!

---

**Built with ❤️ using vanilla HTML, CSS, and JavaScript.**
