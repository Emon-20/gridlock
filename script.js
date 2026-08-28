/* ========================================
   GRIDLOCK — Game Logic
   A strategic territory game
   ======================================== */

// ===== CONFIGURATION =====
const CONFIG = {
    GRID_SIZE: 5,       // 5×5 dots → 4×4 boxes
    MOVE_TIME: 15,      // seconds per move
    AI_DELAY: 600,      // ms before AI makes first move
    AI_CHAIN_DELAY: 350, // ms between AI chain moves
};

// ===== GAME STATE =====
const state = {
    mode: 'pvp',        // 'pvp' or 'pvc'
    currentPlayer: 1,
    scores: [0, 0],
    hLines: [],         // [GRID_SIZE][GRID_SIZE-1]
    vLines: [],         // [GRID_SIZE-1][GRID_SIZE]
    boxes: [],          // [GRID_SIZE-1][GRID_SIZE-1]
    history: [],
    gameOver: false,
    timeLeft: 0,
    timerInterval: null,
    aiTimeout: null,
};

// ===== DOM CACHE =====
const DOM = {};

// ===== ELEMENT MAPS =====
const lineEls = {};
const boxEls = {};

// ========================================
// INITIALIZATION
// ========================================
function init() {
    cacheDOMElements();
    setupEventListeners();
    resetGame();
}

function cacheDOMElements() {
    DOM.board = document.getElementById('board');
    DOM.score1 = document.getElementById('score1');
    DOM.score2 = document.getElementById('score2');
    DOM.timerFill = document.getElementById('timerFill');
    DOM.timerText = document.getElementById('timerText');
    DOM.turnIndicator = document.getElementById('turnIndicator');
    DOM.undoBtn = document.getElementById('undoBtn');
    DOM.restartBtn = document.getElementById('restartBtn');
    DOM.modalOverlay = document.getElementById('modalOverlay');
    DOM.modalTitle = document.getElementById('modalTitle');
    DOM.modalSubtitle = document.getElementById('modalSubtitle');
    DOM.modalIcon = document.getElementById('modalIcon');
    DOM.modalScore1 = document.getElementById('modalScore1');
    DOM.modalScore2 = document.getElementById('modalScore2');
    DOM.modalP2Label = document.getElementById('modalP2Label');
    DOM.playAgainBtn = document.getElementById('playAgainBtn');
    DOM.modeBtns = document.querySelectorAll('.mode-btn');
    DOM.playerCards = document.querySelectorAll('.player-card');
    DOM.p2Label = document.getElementById('p2Label');
}

function setupEventListeners() {
    DOM.undoBtn.addEventListener('click', undo);
    DOM.restartBtn.addEventListener('click', resetGame);

    DOM.playAgainBtn.addEventListener('click', () => {
        hideModal();
        resetGame();
    });

    DOM.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            const label = state.mode === 'pvc' ? 'Computer' : 'Player 2';
            DOM.p2Label.textContent = label;
            DOM.modalP2Label.textContent = label;
            resetGame();
        });
    });
}

// ========================================
// GAME RESET
// ========================================
function resetGame() {
    const G = CONFIG.GRID_SIZE;

    // Clear any pending AI timeout
    if (state.aiTimeout) {
        clearTimeout(state.aiTimeout);
        state.aiTimeout = null;
    }

    state.currentPlayer = 1;
    state.scores = [0, 0];
    state.hLines = Array.from({ length: G }, () => Array(G - 1).fill(0));
    state.vLines = Array.from({ length: G - 1 }, () => Array(G).fill(0));
    state.boxes = Array.from({ length: G - 1 }, () => Array(G - 1).fill(0));
    state.history = [];
    state.gameOver = false;

    buildBoard();
    updateScores();
    updateTurnIndicator();
    updateUndoButton();
    startTimer();
}

// ========================================
// BOARD CONSTRUCTION
// ========================================
function buildBoard() {
    DOM.board.innerHTML = '';
    DOM.board.dataset.currentPlayer = '1';

    // Clear element maps
    for (const k in lineEls) delete lineEls[k];
    for (const k in boxEls) delete boxEls[k];

    const G = CONFIG.GRID_SIZE;
    const gridSize = G * 2 - 1; // 9 for a 5×5 dot grid

    // Build grid template
    const template = [];
    for (let i = 0; i < gridSize; i++) {
        template.push(i % 2 === 0 ? 'var(--dot-size)' : 'var(--cell-size)');
    }
    DOM.board.style.gridTemplateColumns = template.join(' ');
    DOM.board.style.gridTemplateRows = template.join(' ');

    // Create cells
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');

            if (i % 2 === 0 && j % 2 === 0) {
                // DOT
                cell.className = 'dot';
            } else if (i % 2 === 0 && j % 2 === 1) {
                // HORIZONTAL LINE
                const row = i / 2;
                const col = (j - 1) / 2;
                cell.className = 'line h-line';
                cell.addEventListener('click', () => handleLineClick('h', row, col));
                lineEls[`h-${row}-${col}`] = cell;
            } else if (i % 2 === 1 && j % 2 === 0) {
                // VERTICAL LINE
                const row = (i - 1) / 2;
                const col = j / 2;
                cell.className = 'line v-line';
                cell.addEventListener('click', () => handleLineClick('v', row, col));
                lineEls[`v-${row}-${col}`] = cell;
            } else {
                // BOX
                const row = (i - 1) / 2;
                const col = (j - 1) / 2;
                cell.className = 'box';
                boxEls[`${row}-${col}`] = cell;
            }

            DOM.board.appendChild(cell);
        }
    }
}

// ========================================
// GAME LOGIC
// ========================================
function handleLineClick(type, row, col) {
    if (state.gameOver) return;
    if (state.mode === 'pvc' && state.currentPlayer === 2) return;

    const lines = type === 'h' ? state.hLines : state.vLines;
    if (lines[row][col] !== 0) return;

    makeMove(type, row, col);
}

function makeMove(type, row, col) {
    const player = state.currentPlayer;
    const lines = type === 'h' ? state.hLines : state.vLines;
    lines[row][col] = player;

    // Update line visuals
    const lineEl = lineEls[`${type}-${row}-${col}`];
    lineEl.classList.add('drawn', `p${player}`);

    // Check for newly completed boxes
    const completed = findCompletedBoxes(type, row, col, player);

    // Record this move in history
    state.history.push({
        type, row, col, player,
        boxesClaimed: completed,
    });

    if (completed.length > 0) {
        // Score points
        state.scores[player - 1] += completed.length;
        updateScores();

        // Animate claimed boxes
        completed.forEach(b => {
            const boxEl = boxEls[`${b.row}-${b.col}`];
            boxEl.classList.add('claimed', `p${player}`);
            boxEl.dataset.label = player === 1 ? 'P1' : (state.mode === 'pvc' ? 'AI' : 'P2');
        });

        // Check if game is over
        if (checkGameOver()) {
            endGame();
            return;
        }

        // Same player goes again — reset timer
        startTimer();
        updateUndoButton();

        // If it's AI's turn and it completed a box, continue
        if (state.mode === 'pvc' && player === 2) {
            scheduleAIMove(CONFIG.AI_CHAIN_DELAY);
        }
    } else {
        // No box completed — switch turns
        state.currentPlayer = player === 1 ? 2 : 1;
        updateTurnIndicator();
        startTimer();
        updateUndoButton();

        if (checkGameOver()) {
            endGame();
            return;
        }

        // Trigger AI if it's now the computer's turn
        if (state.mode === 'pvc' && state.currentPlayer === 2) {
            scheduleAIMove(CONFIG.AI_DELAY);
        }
    }
}

function findCompletedBoxes(type, row, col, player) {
    const G = CONFIG.GRID_SIZE;
    const completed = [];

    if (type === 'h') {
        // This h-line is the TOP edge of box(row, col)
        if (row <= G - 2 && state.boxes[row][col] === 0 && isBoxComplete(row, col)) {
            state.boxes[row][col] = player;
            completed.push({ row, col });
        }
        // This h-line is the BOTTOM edge of box(row-1, col)
        if (row >= 1 && state.boxes[row - 1][col] === 0 && isBoxComplete(row - 1, col)) {
            state.boxes[row - 1][col] = player;
            completed.push({ row: row - 1, col });
        }
    } else {
        // This v-line is the LEFT edge of box(row, col)
        if (col <= G - 2 && state.boxes[row][col] === 0 && isBoxComplete(row, col)) {
            state.boxes[row][col] = player;
            completed.push({ row, col });
        }
        // This v-line is the RIGHT edge of box(row, col-1)
        if (col >= 1 && state.boxes[row][col - 1] === 0 && isBoxComplete(row, col - 1)) {
            state.boxes[row][col - 1] = player;
            completed.push({ row, col: col - 1 });
        }
    }

    return completed;
}

function isBoxComplete(row, col) {
    return (
        state.hLines[row][col] !== 0 &&
        state.hLines[row + 1][col] !== 0 &&
        state.vLines[row][col] !== 0 &&
        state.vLines[row][col + 1] !== 0
    );
}

function checkGameOver() {
    const G = CONFIG.GRID_SIZE;
    const totalLines = G * (G - 1) * 2; // 40 for 5×5
    let drawn = 0;

    for (const row of state.hLines) {
        for (const val of row) {
            if (val !== 0) drawn++;
        }
    }
    for (const row of state.vLines) {
        for (const val of row) {
            if (val !== 0) drawn++;
        }
    }

    return drawn >= totalLines;
}

// ========================================
// TIMER
// ========================================
function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = CONFIG.MOVE_TIME * 10; // count in 100ms ticks

    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
        if (state.gameOver) {
            clearInterval(state.timerInterval);
            return;
        }

        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            handleTimeout();
        }
    }, 100);
}

function stopTimer() {
    clearInterval(state.timerInterval);
}

function updateTimerDisplay() {
    const seconds = Math.ceil(state.timeLeft / 10);
    const percent = (state.timeLeft / (CONFIG.MOVE_TIME * 10)) * 100;

    DOM.timerFill.style.width = percent + '%';
    DOM.timerText.textContent = seconds + 's';

    // Color matches current player
    DOM.timerFill.className = 'timer-fill p' + state.currentPlayer;

    // Urgent pulsing when ≤ 5s
    if (seconds <= 5) {
        DOM.timerFill.classList.add('urgent');
    }
}

function handleTimeout() {
    if (state.gameOver) return;
    stopTimer();

    // Show timeout toast
    const name = state.currentPlayer === 1
        ? 'Player 1'
        : (state.mode === 'pvc' ? 'Computer' : 'Player 2');
    showToast(`⏰ Time's up! ${name}'s turn skipped`);

    // Flash the turn indicator
    DOM.turnIndicator.classList.add('timeout-flash');
    setTimeout(() => DOM.turnIndicator.classList.remove('timeout-flash'), 600);

    // Skip turn
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator();
    updateUndoButton();
    startTimer();

    // Trigger AI if needed
    if (state.mode === 'pvc' && state.currentPlayer === 2) {
        scheduleAIMove(CONFIG.AI_DELAY);
    }
}

// ========================================
// UNDO
// ========================================
function undo() {
    if (state.history.length === 0 || state.gameOver) return;
    if (state.mode === 'pvc' && state.currentPlayer === 2) return;

    // Cancel any pending AI move
    if (state.aiTimeout) {
        clearTimeout(state.aiTimeout);
        state.aiTimeout = null;
    }

    if (state.mode === 'pvc') {
        // In PvC: undo all computer moves + the player's last move
        while (state.history.length > 0) {
            const lastPlayer = state.history[state.history.length - 1].player;
            undoSingleMove();
            if (lastPlayer === 1) break; // stop after undoing the player's move
        }
    } else {
        // In PvP: undo just the last move
        undoSingleMove();
    }

    updateScores();
    updateTurnIndicator();
    updateUndoButton();
    startTimer();
}

function undoSingleMove() {
    const move = state.history.pop();
    if (!move) return;

    // Remove the drawn line
    const lines = move.type === 'h' ? state.hLines : state.vLines;
    lines[move.row][move.col] = 0;

    const lineEl = lineEls[`${move.type}-${move.row}-${move.col}`];
    lineEl.classList.remove('drawn', 'p1', 'p2');

    // Unclaim any boxes this move completed
    for (const box of move.boxesClaimed) {
        state.boxes[box.row][box.col] = 0;
        state.scores[move.player - 1]--;

        const boxEl = boxEls[`${box.row}-${box.col}`];
        boxEl.classList.remove('claimed', 'p1', 'p2');
        delete boxEl.dataset.label;
    }

    // Restore the player who made this move (so they can re-do it)
    state.currentPlayer = move.player;
}

// ========================================
// AI (Computer Opponent)
// ========================================
function scheduleAIMove(delay) {
    if (state.aiTimeout) clearTimeout(state.aiTimeout);

    state.aiTimeout = setTimeout(() => {
        state.aiTimeout = null;
        if (!state.gameOver && state.currentPlayer === 2) {
            computerMove();
        }
    }, delay);
}

function computerMove() {
    const moves = getAvailableMoves();
    if (moves.length === 0) return;

    let chosen;

    // Priority 1: Complete any box that has 3 sides drawn
    const completing = moves.filter(m => wouldCompleteBox(m));
    if (completing.length > 0) {
        chosen = completing[0];
    } else {
        // Priority 2: Safe moves — don't give opponent a box
        const safe = moves.filter(m => !wouldGiveBox(m));
        if (safe.length > 0) {
            chosen = safe[Math.floor(Math.random() * safe.length)];
        } else {
            // Priority 3: All moves give away boxes — pick least damaging
            chosen = findLeastDamagingMove(moves);
        }
    }

    makeMove(chosen.type, chosen.row, chosen.col);
}

function getAvailableMoves() {
    const G = CONFIG.GRID_SIZE;
    const moves = [];

    for (let r = 0; r < G; r++) {
        for (let c = 0; c < G - 1; c++) {
            if (state.hLines[r][c] === 0) {
                moves.push({ type: 'h', row: r, col: c });
            }
        }
    }
    for (let r = 0; r < G - 1; r++) {
        for (let c = 0; c < G; c++) {
            if (state.vLines[r][c] === 0) {
                moves.push({ type: 'v', row: r, col: c });
            }
        }
    }

    return moves;
}

function getAdjacentUnclaimedBoxes(move) {
    const G = CONFIG.GRID_SIZE;
    const { type, row, col } = move;
    const adj = [];

    if (type === 'h') {
        if (row <= G - 2 && state.boxes[row][col] === 0) adj.push({ row, col });
        if (row >= 1 && state.boxes[row - 1][col] === 0) adj.push({ row: row - 1, col });
    } else {
        if (col <= G - 2 && state.boxes[row][col] === 0) adj.push({ row, col });
        if (col >= 1 && state.boxes[row][col - 1] === 0) adj.push({ row, col: col - 1 });
    }

    return adj;
}

function countBoxSides(row, col) {
    let count = 0;
    if (state.hLines[row][col] !== 0) count++;
    if (state.hLines[row + 1][col] !== 0) count++;
    if (state.vLines[row][col] !== 0) count++;
    if (state.vLines[row][col + 1] !== 0) count++;
    return count;
}

function wouldCompleteBox(move) {
    return getAdjacentUnclaimedBoxes(move).some(b => countBoxSides(b.row, b.col) === 3);
}

function wouldGiveBox(move) {
    // Drawing this line would give the opponent a box to complete (creates a 3-sided box)
    return getAdjacentUnclaimedBoxes(move).some(b => countBoxSides(b.row, b.col) === 2);
}

function findLeastDamagingMove(moves) {
    // Pick the move that creates the fewest 3-sided boxes
    let bestMove = moves[0];
    let bestDamage = Infinity;

    for (const move of moves) {
        const adj = getAdjacentUnclaimedBoxes(move);
        const damage = adj.filter(b => countBoxSides(b.row, b.col) === 2).length;

        if (damage < bestDamage) {
            bestDamage = damage;
            bestMove = move;
        }
    }

    return bestMove;
}

// ========================================
// UI UPDATES
// ========================================
function updateScores() {
    DOM.score1.textContent = state.scores[0];
    DOM.score2.textContent = state.scores[1];
}

function updateTurnIndicator() {
    DOM.board.dataset.currentPlayer = state.currentPlayer;

    const name = state.currentPlayer === 1
        ? 'Player 1'
        : (state.mode === 'pvc' ? 'Computer' : 'Player 2');

    DOM.turnIndicator.innerHTML =
        `<span class="turn-dot p${state.currentPlayer}"></span>${name}'s Turn`;
    DOM.turnIndicator.className = `turn-indicator p${state.currentPlayer}`;

    // Highlight active player card
    DOM.playerCards.forEach(card => card.classList.remove('active'));
    DOM.playerCards[state.currentPlayer - 1].classList.add('active');
}

function updateUndoButton() {
    const canUndo = state.history.length > 0 && !state.gameOver;
    const isAITurn = state.mode === 'pvc' && state.currentPlayer === 2;
    DOM.undoBtn.disabled = !canUndo || isAITurn;
}

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message) {
    // Remove any existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 2200);
}

// ========================================
// GAME END
// ========================================
function endGame() {
    state.gameOver = true;
    stopTimer();

    if (state.aiTimeout) {
        clearTimeout(state.aiTimeout);
        state.aiTimeout = null;
    }

    const s1 = state.scores[0];
    const s2 = state.scores[1];
    const p2Name = state.mode === 'pvc' ? 'Computer' : 'Player 2';

    DOM.modalScore1.textContent = s1;
    DOM.modalScore2.textContent = s2;

    if (s1 > s2) {
        DOM.modalIcon.textContent = '🏆';
        DOM.modalTitle.textContent = 'Player 1 Wins!';
        DOM.modalTitle.className = 'modal-title p1';
        DOM.modalSubtitle.textContent = 'Dominated the grid!';
    } else if (s2 > s1) {
        if (state.mode === 'pvc') {
            DOM.modalIcon.textContent = '🤖';
            DOM.modalTitle.textContent = 'Computer Wins!';
            DOM.modalSubtitle.textContent = 'Better luck next time!';
        } else {
            DOM.modalIcon.textContent = '🏆';
            DOM.modalTitle.textContent = 'Player 2 Wins!';
            DOM.modalSubtitle.textContent = 'Dominated the grid!';
        }
        DOM.modalTitle.className = 'modal-title p2';
    } else {
        DOM.modalIcon.textContent = '🤝';
        DOM.modalTitle.textContent = "It's a Draw!";
        DOM.modalTitle.className = 'modal-title draw';
        DOM.modalSubtitle.textContent = 'Equally matched minds!';
    }

    // Short delay before showing modal (let last move animate)
    setTimeout(() => showModal(), 500);
}

// ========================================
// MODAL
// ========================================
function showModal() {
    DOM.modalOverlay.classList.add('active');
    createConfetti();
}

function hideModal() {
    DOM.modalOverlay.classList.remove('active');
    clearConfetti();
}

function createConfetti() {
    const colors = ['#FF4757', '#2ED8A3', '#6C5CE7', '#FFA502', '#FECA57', '#FF6B81', '#7BED9F'];
    const container = DOM.modalOverlay;

    for (let i = 0; i < 70; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 2.5) + 's';
        piece.style.animationDuration = (2.5 + Math.random() * 3) + 's';
        piece.style.width = (5 + Math.random() * 9) + 'px';
        piece.style.height = (5 + Math.random() * 9) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(piece);
    }
}

function clearConfetti() {
    document.querySelectorAll('.confetti-piece').forEach(el => el.remove());
}

// ========================================
// START
// ========================================
document.addEventListener('DOMContentLoaded', init);
