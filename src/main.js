// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - Game Orchestrator & Main Loop                          ║
// ║   Connects GameState, Renderer3D, UIManager, and handles audio/music.    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { GameState } from './game/state.js';
import { UIManager } from './game/ui.js';
import { Renderer3D } from './game/renderer3d.js';

// Initialize core components
const state = new GameState();
const ui = new UIManager(state);
const renderer = new Renderer3D(state, ui, 'game-canvas');

// Web Audio API Synthesizer for retro sounds & ambient music
let audioCtx = null;
let masterMusicGain = null;
let musicIntervalId = null;
let nextChordTime = 0;
let currentChordIdx = 0;

const chords = [
    // Fmaj7: F2 (87 Hz), A3 (220 Hz), C4 (261 Hz), E4 (329 Hz)
    { root: 87.31, notes: [220.00, 261.63, 329.63] },
    // G6: G2 (98 Hz), B3 (246 Hz), D4 (293 Hz), E4 (329 Hz)
    { root: 98.00, notes: [246.94, 293.66, 329.63] },
    // Em7: E2 (82 Hz), G3 (196 Hz), B3 (246 Hz), D4 (293 Hz)
    { root: 82.41, notes: [196.00, 246.94, 293.66] },
    // Am7: A2 (110 Hz), C4 (261 Hz), E4 (329 Hz), G4 (392 Hz)
    { root: 110.00, notes: [261.63, 329.63, 392.00] }
];

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function getMasterMusicGain() {
    if (!masterMusicGain) {
        const ctx = getAudioContext();
        masterMusicGain = ctx.createGain();
        masterMusicGain.connect(ctx.destination);
        masterMusicGain.gain.setValueAtTime(state.musicEnabled ? 0.35 : 0, ctx.currentTime);
    }
    return masterMusicGain;
}

function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.08);
            osc.frequency.setValueAtTime(659.25, now + 0.16);
            osc.frequency.setValueAtTime(880, now + 0.24);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'danger') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(90, now + 0.25);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'upgrade') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(261.63, now);
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.45);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'chime') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1300, now);
            osc.frequency.setValueAtTime(1600, now + 0.05);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {
        console.warn('Sound feedback failed:', e);
    }
}

function playChord(chord, time) {
    try {
        const ctx = getAudioContext();
        const master = getMasterMusicGain();
        
        const gain = ctx.createGain();
        gain.connect(master);
        
        // Soft volume envelope for a smooth Rhodes/EP feel
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.015, time + 0.15); // slow attack
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9); // decay
        
        // Root Bass Note
        const oscRoot = ctx.createOscillator();
        oscRoot.type = 'triangle';
        oscRoot.frequency.setValueAtTime(chord.root, time);
        oscRoot.connect(gain);
        oscRoot.start(time);
        oscRoot.stop(time + 2.0);
        
        // Mid/High Chord Notes
        chord.notes.forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + 2.0);
        });
    } catch (e) {
        console.warn(e);
    }
}

function playShaker(time) {
    try {
        const ctx = getAudioContext();
        const master = getMasterMusicGain();
        
        const gain = ctx.createGain();
        gain.connect(master);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.0015, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
        
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(9000, time); // high hiss frequency
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.08);
    } catch (e) {
        console.warn(e);
    }
}

function startLoungeMusic() {
    if (musicIntervalId) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        
        nextChordTime = ctx.currentTime;
        
        musicIntervalId = setInterval(() => {
            // Check state
            if (!state.musicEnabled || state.paused || state.screen === 'menu') return;
            
            const context = getAudioContext();
            const now = context.currentTime;
            
            // Schedule chords 0.5s into the future
            while (nextChordTime < now + 0.5) {
                playChord(chords[currentChordIdx], nextChordTime);
                
                // Add quiet rhythmic shaker ticks (hi-hats) every 0.5 seconds
                for (let tick = 0; tick < 4; tick++) {
                    playShaker(nextChordTime + tick * 0.5);
                }
                
                nextChordTime += 2.0;
                currentChordIdx = (currentChordIdx + 1) % chords.length;
            }
        }, 150);
        console.log('Background Lounge Music Player running!');
    } catch (e) {
        console.warn(e);
    }
}

// Attach orchestrator interface to window
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
        
        // Mute or unmute master gain instantly
        try {
            const ctx = getAudioContext();
            const master = getMasterMusicGain();
            master.gain.setValueAtTime(state.musicEnabled ? 0.35 : 0, ctx.currentTime);
            if (state.musicEnabled) startLoungeMusic();
        } catch(e){}
        
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
    },

    playSynthSound: (type) => {
        playSound(type);
    },

    completeMiniGame: (customerId, success) => {
        const c = state.customers.find(cust => cust.id === customerId);
        if (c && c.state === 'in_service') {
            if (success) {
                c.progress = 100;
                c.satisfaction = 100;
                c.isMiniGameWon = true;
                state.addNotification(`🎉 خدمة رائعة! لقد أنجزتِ العمل بنجاح وتحصلتِ على بقشيش مضاعف!`, 'success');
            } else {
                state.addNotification(`ℹ️ تم إلغاء الخدمة اليدوية، ستواصل الموظفات العمل تلقائياً.`, 'info');
            }
            state.triggerChange();
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

// Keyboard triggers
document.addEventListener('keydown', e => {
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

// Start ambient music on first user click anywhere (browser audio policy)
document.addEventListener('click', () => {
    startLoungeMusic();
}, { once: true });

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME RENDER & TICK LOOP
// ═══════════════════════════════════════════════════════════════════════════
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    state.update(dt);
    renderer.animate(dt);
    
    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);
console.log('Orchestrator ready with interactive 3D and Synth Ambient loops!');
