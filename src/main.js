// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - Game Orchestrator & Main Loop                          ║
// ║   Connects GameState, Renderer3D, UIManager, and handles audio feedback.   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { GameState } from './game/state.js';
import { UIManager } from './game/ui.js';
import { Renderer3D } from './game/renderer3d.js';

// Initialize core components
const state = new GameState();
const ui = new UIManager(state);
const renderer = new Renderer3D(state, ui, 'game-canvas');

// Web Audio API Synthesizer for procedural retro sound effects
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'success') {
            // Happy upward arpeggio
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
            osc.frequency.setValueAtTime(659.25, now + 0.16); // E5
            osc.frequency.setValueAtTime(880, now + 0.24); // A5
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'danger') {
            // Sad downward buzz
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'upgrade') {
            // Rising sci-fi sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(261.63, now); // C4
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.5); // C6
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'chime') {
            // Cash register ding
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(1500, now + 0.05);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        console.warn('Audio feedback failed to initialize:', e);
    }
}

// Attach orchestrator interface to window so HTML UI actions can invoke state changes
window.gameInstance = {
    buildRoom: (roomId) => {
        const success = state.buildRoom(roomId);
        if (success) {
            playSound('success');
            renderer.updateRooms();
            renderer.updateStaff();
            ui.closeModal();
        } else {
            playSound('danger');
        }
    },
    
    upgradeRoom: (roomId) => {
        const success = state.upgradeRoom(roomId);
        if (success) {
            playSound('upgrade');
            renderer.updateRooms();
            ui.closeModal();
        } else {
            playSound('danger');
        }
    },
    
    hireStaff: (candidateIdx) => {
        const success = state.hireStaff(candidateIdx);
        if (success) {
            playSound('success');
            renderer.updateStaff();
            ui.renderModalContent();
        } else {
            playSound('danger');
        }
    },
    
    buyProduct: (prodId, qty) => {
        const success = state.buyProduct(prodId, qty);
        if (success) {
            playSound('chime');
            ui.renderModalContent();
        } else {
            playSound('danger');
        }
    },
    
    giveStaffBonus: (staffId) => {
        const success = state.giveStaffBonus(staffId);
        if (success) {
            playSound('success');
            ui.renderModalContent();
        } else {
            playSound('danger');
        }
    },
    
    toggleSound: () => {
        state.soundEnabled = !state.soundEnabled;
        playSound('click');
        ui.renderModalContent();
    },
    
    toggleMusic: () => {
        state.musicEnabled = !state.musicEnabled;
        playSound('click');
        // If music was playing, pause or resume here
        ui.renderModalContent();
    },
    
    changeCenterName: (newName) => {
        if (newName && newName.trim().length > 0) {
            state.centerName = newName.trim();
            playSound('click');
            ui.update();
        }
    },
    
    confirmReset: () => {
        playSound('danger');
        if (confirm('⚠️ هل أنت متأكد من مسح جميع البيانات والبدء من جديد؟')) {
            state.reset();
            renderer.updateRooms();
            renderer.updateStaff();
            ui.closeModal();
            ui.update();
        }
    }
};

// Play audio click when opening/closing UI modals
const originalOpenModal = ui.openModal;
ui.openModal = function(type, data) {
    playSound('click');
    originalOpenModal.call(ui, type, data);
};

const originalCloseModal = ui.closeModal;
ui.closeModal = function() {
    playSound('click');
    originalCloseModal.call(ui);
};

// Start UI and 3D
ui.init();
renderer.init();

// Setup Keyboard triggers
document.addEventListener('keydown', e => {
    // Space to pause
    if (e.key === ' ') {
        e.preventDefault();
        state.paused = !state.paused;
        const pauseBtn = document.getElementById('speed-btn-pause');
        const playBtn = document.getElementById('speed-btn-1x');
        
        document.querySelectorAll('.speed-ctrl .speed-btn').forEach(b => b.classList.remove('active'));
        if (state.paused) {
            if (pauseBtn) pauseBtn.classList.add('active');
        } else {
            if (playBtn) playBtn.classList.add('active');
            state.speed = 1;
        }
        playSound('click');
    }
});

// Sound cues on new checkouts
const originalProcessPayment = state.processPayment;
state.processPayment = function(c) {
    originalProcessPayment.call(state, c);
    playSound('chime');
};

// Sound cues on level up
const originalUpdate = state.update;
state.update = function(dt) {
    const oldLevel = state.level;
    originalUpdate.call(state, dt);
    if (state.level > oldLevel) {
        playSound('success');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME RENDER & TICK LOOP
// ═══════════════════════════════════════════════════════════════════════════
let lastTime = 0;

function gameLoop(timestamp) {
    // cap delta time to avoid large jumps during tab-out
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    // Update simulation
    state.update(dt);
    
    // Draw 3D scene
    renderer.animate(dt);
    
    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);
console.log('💄 سنتر الغرام initialized in 3D!');
