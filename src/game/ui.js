// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - UI Manager                                             ║
// ║   Creates and manages the glassmorphic HTML/CSS user interface overlays.  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { ROOM_LAYOUTS, ROOM_UPGRADES, ROOM_COSTS, SERVICES } from './state.js';

export class UIManager {
    constructor(gameState) {
        this.game = gameState;
        this.activeModal = null; // shop, staff, finance, settings, build_upgrade
        this.modalData = null; // metadata for modals (like roomId)
    }

    init() {
        this.injectStyles();
        this.createHUD();
        this.createModalsContainer();
        this.createNotificationsContainer();
        this.setupEventHandlers();
        
        // Listen for updates from the state
        this.game.onNotificationAdded = (n) => this.showNotification(n);
        this.game.onStateChanged = () => this.update();
        
        this.update();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=Outfit:wght@300;400;600;700;900&display=swap');
            
            :root {
                --glass-bg: rgba(15, 15, 30, 0.6);
                --glass-border: rgba(255, 255, 255, 0.08);
                --glass-glow: 0 8px 32px 0 rgba(233, 30, 99, 0.15);
                --primary: #E91E63;
                --primary-gradient: linear-gradient(135deg, #E91E63, #9C27B0);
                --secondary: #9C27B0;
                --gold: #FFD700;
                --green: #4CAF50;
                --red: #FF3366;
                --blue: #00BCD4;
            }

            * {
                box-sizing: border-box;
                font-family: 'Cairo', 'Outfit', sans-serif;
                user-select: none;
            }

            /* HUD Top Bar */
            #hud-container {
                position: fixed;
                top: 15px;
                left: 15px;
                right: 15px;
                z-index: 100;
                display: flex;
                justify-content: space-between;
                pointer-events: none;
            }

            .hud-panel {
                pointer-events: auto;
                background: var(--glass-bg);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid var(--glass-border);
                box-shadow: var(--glass-glow);
                border-radius: 16px;
                padding: 10px 20px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s ease;
            }

            .hud-panel:hover {
                border-color: rgba(233, 30, 99, 0.3);
                box-shadow: 0 8px 32px 0 rgba(233, 30, 99, 0.25);
            }

            .hud-money {
                font-weight: 800;
                font-size: 1.15rem;
                color: var(--gold);
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
            }

            .hud-rep {
                font-weight: 700;
                color: var(--green);
            }

            .hud-rep.low {
                color: var(--red);
            }

            .hud-time {
                font-weight: 600;
                direction: rtl;
            }

            .hud-level-container {
                display: flex;
                flex-direction: column;
                gap: 4px;
                min-width: 140px;
            }

            .level-badge {
                font-weight: 800;
                color: #fff;
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
            }

            .xp-bar-outer {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .xp-bar-inner {
                height: 100%;
                background: var(--primary-gradient);
                width: 0%;
                transition: width 0.4s ease;
            }

            /* Time Speed Controls */
            .speed-ctrl {
                display: flex;
                gap: 5px;
            }

            .speed-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--glass-border);
                color: #aaa;
                border-radius: 8px;
                padding: 4px 10px;
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .speed-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .speed-btn.active {
                background: var(--primary-gradient);
                color: #fff;
                border-color: transparent;
                box-shadow: 0 0 10px rgba(233, 30, 99, 0.3);
            }

            /* Navigation Bottom Bar */
            #nav-container {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                background: var(--glass-bg);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid var(--glass-border);
                box-shadow: var(--glass-glow);
                border-radius: 20px;
                padding: 8px 16px;
                display: flex;
                gap: 12px;
                pointer-events: auto;
                transition: all 0.3s ease;
            }

            #nav-container:hover {
                border-color: rgba(156, 39, 176, 0.3);
            }

            .nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                color: rgba(255, 255, 255, 0.6);
                padding: 8px 16px;
                border-radius: 12px;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s ease;
                min-width: 75px;
                gap: 2px;
            }

            .nav-item:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.05);
            }

            .nav-item.active {
                color: #fff;
                background: var(--primary-gradient);
                box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
            }

            .nav-item span {
                font-size: 1.1rem;
            }

            .nav-item label {
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
            }

            /* Modals System */
            #modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 90;
                background: rgba(10, 10, 20, 0.4);
                backdrop-filter: blur(8px);
                display: none;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            #modal-overlay.active {
                display: flex;
                opacity: 1;
            }

            .modal-window {
                width: 90%;
                max-width: 650px;
                max-height: 80vh;
                background: rgba(18, 18, 35, 0.85);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), var(--glass-glow);
                border-radius: 24px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                color: #fff;
                direction: rtl;
            }

            #modal-overlay.active .modal-window {
                transform: scale(1);
            }

            .modal-header {
                padding: 20px 25px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.02);
            }

            .modal-title {
                font-size: 1.3rem;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(90deg, #fff, #ff80ab);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .close-btn {
                background: rgba(255, 255, 255, 0.05);
                border: none;
                color: #fff;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                font-weight: bold;
                font-size: 1rem;
                transition: all 0.2s ease;
            }

            .close-btn:hover {
                background: var(--red);
                transform: rotate(90deg);
            }

            .modal-body {
                padding: 25px;
                overflow-y: auto;
                flex-grow: 1;
            }

            /* Grid items for cards */
            .modal-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                gap: 15px;
            }

            .card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                transition: all 0.3s ease;
                gap: 8px;
            }

            .card:hover {
                background: rgba(255, 255, 255, 0.07);
                border-color: rgba(233, 30, 99, 0.25);
                transform: translateY(-3px);
            }

            .card-emoji {
                font-size: 2.2rem;
                margin-bottom: 5px;
                filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
            }

            .card-name {
                font-weight: 700;
                font-size: 1rem;
            }

            .card-desc {
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.5);
                margin-bottom: 5px;
                min-height: 32px;
            }

            .card-stat {
                font-size: 0.85rem;
                font-weight: 600;
            }

            .card-cost {
                color: var(--gold);
                font-weight: 800;
                font-size: 0.95rem;
                margin-top: auto;
            }

            .action-btn {
                background: var(--primary-gradient);
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: 6px 12px;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                box-shadow: 0 4px 10px rgba(233, 30, 99, 0.2);
            }

            .action-btn:hover {
                transform: scale(1.03);
                box-shadow: 0 4px 15px rgba(233, 30, 99, 0.4);
            }

            .action-btn:disabled {
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.2);
                cursor: not-allowed;
                box-shadow: none;
            }

            /* Staff Cards List */
            .staff-list-item {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                transition: all 0.2s ease;
            }

            .staff-list-item:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(156, 39, 176, 0.25);
            }

            .staff-avatar {
                font-size: 2rem;
                margin-left: 15px;
            }

            .staff-info {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                gap: 2px;
            }

            .staff-name {
                font-weight: 700;
                font-size: 1.05rem;
            }

            .staff-role {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.5);
            }

            .staff-bar-container {
                display: flex;
                gap: 15px;
                margin-top: 5px;
            }

            .staff-mini-bar {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.75rem;
            }

            .mini-bar-outer {
                width: 60px;
                height: 5px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }

            .mini-bar-inner {
                height: 100%;
                background: var(--green);
            }

            .mini-bar-inner.orange { background: var(--gold); }
            .mini-bar-inner.red { background: var(--red); }

            .staff-salary {
                color: var(--gold);
                font-weight: 700;
                margin-left: 20px;
            }

            .staff-bonus-btn {
                background: rgba(76, 175, 80, 0.2);
                border: 1px solid var(--green);
                color: #fff;
                border-radius: 8px;
                padding: 6px 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .staff-bonus-btn:hover {
                background: var(--green);
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
            }

            /* Finance Panel */
            .finance-summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            }

            .fin-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 15px;
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .fin-label {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.5);
            }

            .fin-val {
                font-size: 1.25rem;
                font-weight: 800;
                color: #fff;
            }

            .fin-val.green { color: var(--green); }
            .fin-val.red { color: var(--red); }
            .fin-val.gold { color: var(--gold); }

            .services-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }

            .services-table th, .services-table td {
                padding: 10px 12px;
                text-align: right;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .services-table th {
                font-weight: 700;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.85rem;
            }

            .services-table td {
                font-size: 0.9rem;
            }

            /* Settings Window */
            .settings-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .settings-label {
                font-weight: 600;
            }

            .toggle-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--glass-border);
                color: #fff;
                border-radius: 8px;
                padding: 6px 16px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .toggle-btn.active {
                background: var(--green);
                border-color: transparent;
            }

            .toggle-btn.inactive {
                background: var(--red);
                border-color: transparent;
            }

            .settings-input {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #fff;
                padding: 6px 12px;
                border-radius: 8px;
                font-weight: 600;
                width: 160px;
                text-align: center;
            }

            .settings-input:focus {
                border-color: var(--primary);
                outline: none;
            }

            .reset-btn {
                background: rgba(255, 51, 102, 0.15);
                border: 1px solid var(--red);
                color: var(--red);
                padding: 10px 20px;
                border-radius: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                margin-top: 20px;
            }

            .reset-btn:hover {
                background: var(--red);
                color: #fff;
                box-shadow: 0 0 15px rgba(255, 51, 102, 0.4);
            }

            /* Build / Upgrade Modal specifics */
            .room-preview {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .room-preview-emoji {
                font-size: 4rem;
                background: rgba(255, 255, 255, 0.03);
                width: 90px;
                height: 90px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed rgba(255, 255, 255, 0.15);
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .room-preview-name {
                font-size: 1.4rem;
                font-weight: 800;
            }

            .room-details-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 25px;
            }

            .room-detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 0.95rem;
            }

            .room-detail-row:last-child {
                margin-bottom: 0;
            }

            .room-detail-label {
                color: rgba(255, 255, 255, 0.5);
            }

            .room-detail-val {
                font-weight: 700;
            }

            /* Notifications System */
            #notifications-box {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 110;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 90%;
                max-width: 400px;
                pointer-events: none;
            }

            .notification {
                background: rgba(18, 18, 30, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #fff;
                border-radius: 12px;
                padding: 10px 16px;
                font-size: 0.85rem;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                text-align: center;
                justify-content: center;
                direction: rtl;
                transition: opacity 0.3s ease;
            }

            .notification.success {
                border-color: rgba(76, 175, 80, 0.3);
                background: rgba(76, 175, 80, 0.15);
                color: #e8f5e9;
            }

            .notification.danger {
                border-color: rgba(255, 51, 102, 0.3);
                background: rgba(255, 51, 102, 0.15);
                color: #ffebee;
            }

            .notification.warning {
                border-color: rgba(255, 152, 0, 0.3);
                background: rgba(255, 152, 0, 0.15);
                color: #fff3e0;
            }

            @keyframes slideDown {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'hud-container';
        hud.innerHTML = `
            <div class="hud-panel">
                <div class="hud-level-container">
                    <div class="level-badge">
                        <span id="hud-level-val">🏆 مستوى 1</span>
                        <span id="hud-xp-pct">0%</span>
                    </div>
                    <div class="xp-bar-outer">
                        <div class="xp-bar-inner" id="hud-xp-bar"></div>
                    </div>
                </div>
            </div>

            <div class="hud-panel" style="gap: 20px;">
                <div class="hud-rep" id="hud-rep-val">⭐ 60%</div>
                <div class="hud-money" id="hud-money-val">5,000 ج.م</div>
            </div>

            <div class="hud-panel" style="flex-direction: column; gap: 8px;">
                <div class="hud-time" id="hud-time-val">يوم 1 | 08:00 AM</div>
                <div class="speed-ctrl">
                    <button class="speed-btn" data-speed="0" id="speed-btn-pause">⏸️</button>
                    <button class="speed-btn active" data-speed="1" id="speed-btn-1x">1x</button>
                    <button class="speed-btn" data-speed="2" id="speed-btn-2x">2x</button>
                    <button class="speed-btn" data-speed="3" id="speed-btn-3x">3x</button>
                </div>
            </div>
        `;
        document.body.appendChild(hud);
    }

    createModalsContainer() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-window">
                <div class="modal-header">
                    <button class="close-btn" id="modal-close-btn">&times;</button>
                    <div class="modal-title" id="modal-title-val">🏢 العنوان</div>
                </div>
                <div class="modal-body" id="modal-body-val">
                    <!-- Dynamic Body -->
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.overlay = overlay;
        this.modalTitle = document.getElementById('modal-title-val');
        this.modalBody = document.getElementById('modal-body-val');
        
        document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
    }

    createNotificationsContainer() {
        const container = document.createElement('div');
        container.id = 'notifications-box';
        document.body.appendChild(container);
        this.notifBox = container;
    }

    setupEventHandlers() {
        // Time Speed Controls
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(btn.getAttribute('data-speed'));
                speedButtons.forEach(b => b.classList.remove('active'));
                
                if (speed === 0) {
                    this.game.paused = true;
                    btn.classList.add('active');
                } else {
                    this.game.paused = false;
                    this.game.speed = speed;
                    btn.classList.add('active');
                }
                
                // Keep visually consistent
                if (this.game.paused) {
                    document.getElementById('speed-btn-pause').classList.add('active');
                }
            });
        });

        // Navigation Menu
        this.createNavBar();
    }

    createNavBar() {
        const nav = document.createElement('div');
        nav.id = 'nav-container';
        nav.innerHTML = `
            <div class="nav-item active" data-screen="game">
                <span>🏠</span>
                <label>الصالون</label>
            </div>
            <div class="nav-item" data-screen="shop">
                <span>🏪</span>
                <label>المتجر</label>
            </div>
            <div class="nav-item" data-screen="staff">
                <span>👥</span>
                <label>الموظفين</label>
            </div>
            <div class="nav-item" data-screen="finance">
                <span>💰</span>
                <label>المالية</label>
            </div>
            <div class="nav-item" data-screen="settings">
                <span>⚙️</span>
                <label>الإعدادات</label>
            </div>
        `;
        document.body.appendChild(nav);

        const navItems = nav.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                const screen = item.getAttribute('data-screen');
                
                if (screen === 'game') {
                    item.classList.add('active');
                    this.closeModal();
                } else {
                    item.classList.add('active');
                    this.openModal(screen);
                }
            });
        });
        
        this.navItems = navItems;
    }

    openModal(type, data = null) {
        this.activeModal = type;
        this.modalData = data;
        this.overlay.classList.add('active');
        
        // Highlight correct nav item (except for build_upgrade which doesn't have one)
        if (type !== 'build_upgrade') {
            this.navItems.forEach(item => {
                if (item.getAttribute('data-screen') === type) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        this.renderModalContent();
    }

    closeModal() {
        this.activeModal = null;
        this.modalData = null;
        this.overlay.classList.remove('active');
        
        // Highlight active home
        this.navItems.forEach(item => {
            if (item.getAttribute('data-screen') === 'game') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        this.game.screen = 'game';
    }

    renderModalContent() {
        if (!this.activeModal) return;
        
        this.modalBody.innerHTML = '';
        this.game.screen = this.activeModal;

        switch (this.activeModal) {
            case 'shop':
                this.modalTitle.innerHTML = '🏪 متجر مستحضرات التجميل';
                this.renderShopContent();
                break;
            case 'staff':
                this.modalTitle.innerHTML = '👥 إدارة الموظفين والرواتب';
                this.renderStaffContent();
                break;
            case 'finance':
                this.modalTitle.innerHTML = '💰 التقارير المالية والخدمات';
                this.renderFinanceContent();
                break;
            case 'settings':
                this.modalTitle.innerHTML = '⚙️ إعدادات اللعبة';
                this.renderSettingsContent();
                break;
            case 'build_upgrade':
                const room = this.modalData;
                this.modalTitle.innerHTML = room.built ? '🛠️ ترقية الغرفة' : '🏗️ بناء قسم جديد';
                this.renderBuildUpgradeContent(room);
                break;
            case 'mini_game':
                const customer = this.modalData;
                this.modalTitle.innerHTML = `🎮 تنفيذ الخدمة يدوياً: ${customer.name}`;
                this.renderMiniGameContent(customer);
                break;
        }
    }

    renderShopContent() {
        let html = `<div class="modal-grid">`;
        
        this.game.products.forEach(p => {
            const cost5 = p.cost * 5;
            const canAfford = this.game.money >= cost5;
            html += `
                <div class="card">
                    <div class="card-emoji">${p.emoji}</div>
                    <div class="card-name">${p.name}</div>
                    <div class="card-desc">سعر البيع للعميلة: ${p.price} ج.م</div>
                    <div class="card-stat">مخزون: <span style="font-weight: 800; color: ${p.stock > 5 ? '#4CAF50' : '#FF3366'}">${p.stock}</span></div>
                    <div class="card-stat" style="color: rgba(255,255,255,0.4)">إجمالي المبيعات: ${p.sold}</div>
                    <div class="card-cost">${cost5} ج.م <span style="font-size:0.75rem; color:rgba(255,255,255,0.5)">(شراء 5)</span></div>
                    <button class="action-btn" ${canAfford ? '' : 'disabled'} onclick="window.gameInstance.buyProduct('${p.id}', 5)">شراء بضاعة</button>
                </div>
            `;
        });
        
        html += `</div>`;
        this.modalBody.innerHTML = html;
    }

    renderStaffContent() {
        let html = `<div style="font-weight: 800; font-size:1.1rem; margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 5px;">👩‍💼 الموظفين الحاليين (${this.game.staff.length}/8)</div>`;
        
        this.game.staff.forEach(s => {
            const moodColor = s.mood > 60 ? 'green' : (s.mood > 30 ? 'orange' : 'red');
            const skillColor = s.skill > 75 ? 'green' : (s.skill > 50 ? 'orange' : 'red');
            const canAffordBonus = this.game.money >= 200;
            
            html += `
                <div class="staff-list-item">
                    <div class="staff-avatar">${s.emoji}</div>
                    <div class="staff-info">
                        <div class="staff-name">${s.name}</div>
                        <div class="staff-role">قسم: ${ROOM_LAYOUTS[s.role].name}</div>
                        <div class="staff-bar-container">
                            <div class="staff-mini-bar">
                                <span>مهارة</span>
                                <div class="mini-bar-outer">
                                    <div class="mini-bar-inner ${skillColor}" style="width: ${s.skill}%"></div>
                                </div>
                                <span>${s.skill}%</span>
                            </div>
                            <div class="staff-mini-bar">
                                <span>مزاج</span>
                                <div class="mini-bar-outer">
                                    <div class="mini-bar-inner ${moodColor}" style="width: ${s.mood}%"></div>
                                </div>
                                <span>${s.mood}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="staff-salary">${s.salary} ج.م/يوم</div>
                    <button class="staff-bonus-btn" ${canAffordBonus ? '' : 'disabled'} onclick="window.gameInstance.giveStaffBonus(${s.id})">مكافأة 200 ج.م</button>
                </div>
            `;
        });

        html += `<div style="font-weight: 800; font-size:1.1rem; margin-top:30px; margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 5px;">🤝 المتقدمات للوظيفة المتاحة</div>`;
        
        if (this.game.hiringPool.length === 0) {
            html += `<div style="text-align:center; color:rgba(255,255,255,0.4); padding: 20px;">مفيش متقدمات حالياً، شيك بكرة!</div>`;
        } else {
            html += `<div class="modal-grid">`;
            this.game.hiringPool.forEach((c, idx) => {
                const hireCost = c.salary * 2;
                const canAfford = this.game.money >= hireCost;
                html += `
                    <div class="card">
                        <div class="card-emoji">${c.emoji}</div>
                        <div class="card-name">${c.name}</div>
                        <div class="card-desc">أخصائية: ${c.label}</div>
                        <div class="card-stat">مهارة: <span style="font-weight: 700;">${c.skill}%</span></div>
                        <div class="card-stat">راتب متوقع: ${c.salary} ج.م</div>
                        <div class="card-cost">${hireCost} ج.م <span style="font-size:0.75rem; color:rgba(255,255,255,0.5)">(رسوم)</span></div>
                        <button class="action-btn" ${canAfford ? '' : 'disabled'} onclick="window.gameInstance.hireStaff(${idx})">توظيف فوري</button>
                    </div>
                `;
            });
            html += `</div>`;
        }

        this.modalBody.innerHTML = html;
    }

    renderFinanceContent() {
        const netProfit = this.game.dailyStats.revenue + this.game.dailyStats.tips - this.game.dailyStats.expenses;
        
        let html = `
            <div class="finance-summary">
                <div class="fin-card">
                    <span class="fin-label">💰 الرصيد الحالي</span>
                    <span class="fin-val gold">${this.game.money} ج.م</span>
                </div>
                <div class="fin-card">
                    <span class="fin-label">📈 إيرادات اليوم</span>
                    <span class="fin-val green">+${this.game.dailyStats.revenue + this.game.dailyStats.tips} ج.م</span>
                </div>
                <div class="fin-card">
                    <span class="fin-label">📉 مصروفات اليوم</span>
                    <span class="fin-val red">-${this.game.dailyStats.expenses} ج.م</span>
                </div>
            </div>
            
            <div style="font-weight: 800; font-size:1.1rem; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:5px;">📊 قائمة الخدمات المتاحة ومستويات الإقبال</div>
            <table class="services-table">
                <thead>
                    <tr>
                        <th>الخدمة</th>
                        <th>القسم</th>
                        <th>السعر</th>
                        <th>الشعبية</th>
                        <th>شروط المهارة</th>
                    </tr>
                </thead>
                <tbody>
        `;

        SERVICES.forEach(s => {
            const isBuilt = this.game.rooms[s.room].built;
            html += `
                <tr style="opacity: ${isBuilt ? '1' : '0.4'}">
                    <td style="font-weight:700;">${s.emoji} ${s.name}</td>
                    <td>${ROOM_LAYOUTS[s.room].name} ${isBuilt ? '' : '❌(مغلق)'}</td>
                    <td style="color:var(--gold); font-weight:700;">${s.price} ج.م</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="mini-bar-outer" style="width:80px;">
                                <div class="mini-bar-inner" style="width: ${s.popularity}%; background:var(--primary);"></div>
                            </div>
                            <span>${s.popularity}%</span>
                        </div>
                    </td>
                    <td>مهارة &ge; ${s.skillReq}%</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        
        this.modalBody.innerHTML = html;
    }

    renderSettingsContent() {
        let html = `
            <div class="settings-row">
                <span class="settings-label">🔊 المؤثرات الصوتية</span>
                <button class="toggle-btn ${this.game.soundEnabled ? 'active' : 'inactive'}" onclick="window.gameInstance.toggleSound()">
                    ${this.game.soundEnabled ? 'مفعلة' : 'معطلة'}
                </button>
            </div>
            <div class="settings-row">
                <span class="settings-label">🎵 الموسيقى التصويرية</span>
                <button class="toggle-btn ${this.game.musicEnabled ? 'active' : 'inactive'}" onclick="window.gameInstance.toggleMusic()">
                    ${this.game.musicEnabled ? 'مفعلة' : 'معطلة'}
                </button>
            </div>
            <div class="settings-row">
                <span class="settings-label">✏️ تغيير اسم الصالون</span>
                <input type="text" class="settings-input" value="${this.game.centerName}" onchange="window.gameInstance.changeCenterName(this.value)">
            </div>
            
            <button class="reset-btn" onclick="window.gameInstance.confirmReset()">🗑️ مسح البيانات وإعادة تشغيل اللعبة</button>
        `;
        
        this.modalBody.innerHTML = html;
    }

    renderBuildUpgradeContent(room) {
        const name = ROOM_LAYOUTS[room.id].name;
        const emoji = ROOM_LAYOUTS[room.id].emoji;
        
        let html = `
            <div class="room-preview">
                <div class="room-preview-emoji">${emoji}</div>
                <div class="room-preview-name">${name}</div>
            </div>
            
            <div class="room-details-box">
        `;
        
        if (room.built) {
            const nextLvl = room.level + 1;
            const upgradeData = ROOM_UPGRADES[room.id];
            const canAfford = this.game.money >= upgradeData.cost;
            
            html += `
                <div class="room-detail-row">
                    <span class="room-detail-label">المستوى الحالي</span>
                    <span class="room-detail-val">مستوى ${room.level}</span>
                </div>
                <div class="room-detail-row">
                    <span class="room-detail-label">الترقية القادمة</span>
                    <span class="room-detail-val">${upgradeData.desc}</span>
                </div>
                <div class="room-detail-row">
                    <span class="room-detail-label">عائد السمعة المتوقع</span>
                    <span class="room-detail-val" style="color:var(--green)">+3% سمعة</span>
                </div>
                <div class="room-detail-row" style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
                    <span class="room-detail-label" style="font-weight:800; color:var(--gold)">تكلفة الترقية</span>
                    <span class="room-detail-val gold" style="font-size:1.15rem">${upgradeData.cost} ج.م</span>
                </div>
            </div>
            <button class="action-btn" style="padding:12px; font-size:1rem;" ${canAfford ? '' : 'disabled'} onclick="window.gameInstance.upgradeRoom('${room.id}')">
                تأكيد ترقية القسم ⬆️
            </button>
            `;
        } else {
            const cost = ROOM_COSTS[room.id];
            const canAfford = this.game.money >= cost;
            
            // Find services unlocked by this room
            const roomServices = SERVICES.filter(s => s.room === room.id);
            let servicesText = roomServices.map(s => `${s.emoji} ${s.name}`).join(' - ');
            
            html += `
                <div class="room-detail-row">
                    <span class="room-detail-label">الحالة الحالية</span>
                    <span class="room-detail-val" style="color:var(--red)">❌ غير مبني</span>
                </div>
                <div class="room-detail-row">
                    <span class="room-detail-label">الخدمات التي يفتحها القسم</span>
                    <span class="room-detail-val" style="color:var(--blue)">${servicesText || 'خدمات مخصصة'}</span>
                </div>
                <div class="room-detail-row" style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
                    <span class="room-detail-label" style="font-weight:800; color:var(--gold)">تكلفة البناء</span>
                    <span class="room-detail-val gold" style="font-size:1.15rem">${cost} ج.م</span>
                </div>
            </div>
            <button class="action-btn" style="padding:12px; font-size:1rem;" ${canAfford ? '' : 'disabled'} onclick="window.gameInstance.buildRoom('${room.id}')">
                تأكيد بناء القسم 🏗️
            </button>
            `;
        }
        
        this.modalBody.innerHTML = html;
    }

    showNotification(n) {
        const notif = document.createElement('div');
        notif.className = `notification ${n.type}`;
        notif.id = `notif_${n.id}`;
        
        let emoji = 'ℹ️';
        if (n.type === 'success') emoji = '✅';
        if (n.type === 'danger') emoji = '❌';
        if (n.type === 'warning') emoji = '⚠️';
        
        notif.innerHTML = `<span>${emoji}</span><span>${n.text}</span>`;
        this.notifBox.appendChild(notif);
        
        // Remove after animated fadeout
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => {
                notif.remove();
            }, 300);
        }, n.time * 1000);
    }

    update() {
        // Top HUD values
        const repVal = document.getElementById('hud-rep-val');
        if (repVal) {
            repVal.textContent = `⭐ ${this.game.reputation}%`;
            if (this.game.reputation < 35) {
                repVal.className = 'hud-rep low';
            } else {
                repVal.className = 'hud-rep';
            }
        }
        
        const moneyVal = document.getElementById('hud-money-val');
        if (moneyVal) {
            moneyVal.textContent = `${this.game.money.toLocaleString()} ج.م`;
        }
        
        const timeVal = document.getElementById('hud-time-val');
        if (timeVal) {
            const h = this.game.hour;
            const m = this.game.minute < 10 ? '0' + Math.floor(this.game.minute) : Math.floor(this.game.minute);
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            
            timeVal.textContent = `يوم ${this.game.day} | ⏰ ${displayH}:${m} ${period}`;
        }
        
        const lvlVal = document.getElementById('hud-level-val');
        if (lvlVal) {
            lvlVal.textContent = `🏆 مستوى ${this.game.level}`;
        }
        
        const xpPctText = document.getElementById('hud-xp-pct');
        const xpInner = document.getElementById('hud-xp-bar');
        if (xpInner && xpPctText) {
            const needed = this.game.level * 100;
            const pct = Math.min(100, Math.floor((this.game.xp / needed) * 100));
            xpInner.style.width = `${pct}%`;
            xpPctText.textContent = `${pct}%`;
        }

        // Active screens refresh
        if (this.activeModal && this.activeModal !== 'mini_game') {
            this.renderModalContent();
        }
    }

    startMiniGame(customer) {
        this.openModal('mini_game', customer);
    }

    renderMiniGameContent(customer) {
        const roomName = ROOM_LAYOUTS[customer.room].name;
        const emoji = ROOM_LAYOUTS[customer.room].emoji;
        
        let instructions = '';
        if (customer.room === 'hair') instructions = 'اضغط على زر التفاعل ✂️ أو زر المسافة (Space) عندما يكون المؤشر الأحمر في المنطقة الخضراء!';
        else if (customer.room === 'makeup') instructions = 'اضغط على النقاط المضيئة بالترتيب الصحيح (من 1 إلى 5) لوضع المكياج!';
        else if (customer.room === 'nails') instructions = 'اضغط لطلاء الأظافر عندما يتطابق لون الفرشاة مع اللون الدائري المطلوب فوق كل ظفر!';
        else if (customer.room === 'spa') instructions = 'فرقع الفقاعات البخارية الصاعدة بالنقر عليها بسرعة! تحتاج 15 فقاعة!';
        else if (customer.room === 'bridal') instructions = 'اضغط على زر إسقاط التاج 👑 عندما يكون التاج في المنتصف تماماً فوق رأس العروسة!';
        else instructions = 'اضغط على زر التفاعل في الوقت المناسب لإرضاء العميلة!';

        this.modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--primary);">${emoji} قسم ${roomName} (${customer.name})</div>
                <div style="font-size:0.85rem; color:rgba(255,255,255,0.6); margin-top:5px;">${instructions}</div>
            </div>
            
            <canvas id="mini-game-canvas" width="550" height="300" style="display:block; margin:0 auto; background:#0c0b16; border-radius:16px; border:1px solid rgba(255,255,255,0.08); box-shadow: inset 0 0 25px rgba(0,0,0,0.8); cursor: pointer;"></canvas>
            
            <div style="display:flex; justify-content:center; gap:15px; margin-top:20px;">
                <button id="mini-game-btn" class="action-btn" style="width:200px; padding:10px; font-size:1rem;">تفاعل!</button>
                <button id="mini-game-quit" class="reset-btn" style="width:200px; margin:0; padding:10px; font-size:1rem;">انسحاب (تلقائي)</button>
            </div>
        `;

        const canvas = document.getElementById('mini-game-canvas');
        const btn = document.getElementById('mini-game-btn');
        const quitBtn = document.getElementById('mini-game-quit');

        // Cancel previous loop if running
        if (this.miniGameLoopId) {
            cancelAnimationFrame(this.miniGameLoopId);
        }

        // Initialize the selected mini game
        this.initMiniGame(canvas, btn, quitBtn, customer);
    }

    initMiniGame(canvas, btn, quitBtn, customer) {
        const ctx = canvas.getContext('2d');
        const type = customer.room;
        
        let gameState = 'playing'; // playing, won, lost
        let score = 0;
        let lives = 3;
        let timer = type === 'spa' ? 10.0 : 0;
        
        // Game variables based on type
        // 1. Hair styling variables
        let pointerX = 50;
        let pointerDir = 1;
        let pointerSpeed = 4.5 + (this.game.level * 0.4);
        let targetStart = 150 + Math.random() * 150;
        let targetWidth = 90 - (this.game.level * 2);

        // 2. Makeup variables
        const dots = [
            { x: 275, y: 85, label: 'أساس', color: '#ffccbc', active: true, clicked: false },
            { x: 250, y: 70, label: 'أيشادو', color: '#e91e63', active: false, clicked: false },
            { x: 300, y: 70, label: 'أيشادو', color: '#e91e63', active: false, clicked: false },
            { x: 245, y: 95, label: 'بلاش', color: '#ff8a80', active: false, clicked: false },
            { x: 305, y: 95, label: 'بلاش', color: '#ff8a80', active: false, clicked: false },
            { x: 275, y: 125, label: 'روج', color: '#d81b60', active: false, clicked: false }
        ];
        let activeDotIdx = 0;

        // 3. Nails variables
        const targetColors = ['#f44336', '#e91e63', '#9c27b0', '#00bcd4', '#ffd700'];
        const nailX = [150, 210, 275, 340, 400];
        const nailColors = ['#ffccbc', '#ffccbc', '#ffccbc', '#ffccbc', '#ffccbc'];
        let activeNailIdx = 0;
        let colorCycleTimer = 0;
        let currentColorIdx = 0;

        // 4. Spa variables
        let bubbles = [];
        let spawnTimer = 0;

        // 5. Bridal variables
        let tiaraX = 50;
        let tiaraDir = 1;
        let tiaraSpeed = 5 + (this.game.level * 0.5);
        let tiaraY = 50;
        let falling = false;

        // Button action
        if (type === 'hair') btn.textContent = 'قص الشعر ✂️';
        else if (type === 'makeup') btn.textContent = 'دمج المكياج ✨';
        else if (type === 'nails') btn.textContent = 'طلاء الأظافر 💅';
        else if (type === 'spa') btn.textContent = 'فرقعة البخار 🧖‍♀️';
        else if (type === 'bridal') btn.textContent = 'إسقاط التاج 👑';

        const triggerAction = () => {
            if (gameState !== 'playing') return;

            if (type === 'hair') {
                const pointerPct = pointerX / 550;
                const minPct = targetStart / 550;
                const maxPct = (targetStart + targetWidth) / 550;

                if (pointerX >= targetStart && pointerX <= targetStart + targetWidth) {
                    score++;
                    // Play success
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('success');
                    targetStart = 100 + Math.random() * 250;
                    if (score >= 3) gameState = 'won';
                } else {
                    lives--;
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('danger');
                    if (lives <= 0) gameState = 'lost';
                }
            } else if (type === 'nails') {
                const brushColor = targetColors[currentColorIdx];
                const targetColor = targetColors[activeNailIdx];
                if (brushColor === targetColor) {
                    nailColors[activeNailIdx] = targetColor;
                    activeNailIdx++;
                    score = activeNailIdx;
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('success');
                    if (activeNailIdx >= 5) gameState = 'won';
                } else {
                    lives--;
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('danger');
                    if (lives <= 0) gameState = 'lost';
                }
            } else if (type === 'bridal') {
                if (!falling) {
                    falling = true;
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('click');
                }
            }
        };

        btn.addEventListener('click', triggerAction);
        
        // Canvas click handler
        canvas.addEventListener('click', (e) => {
            if (gameState !== 'playing') return;
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            if (type === 'makeup') {
                const activeDot = dots[activeDotIdx];
                const d2 = (clickX - activeDot.x)**2 + (clickY - activeDot.y)**2;
                if (d2 < 250) { // radius 15-20px
                    activeDot.clicked = true;
                    activeDotIdx++;
                    score = activeDotIdx;
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('success');
                    if (activeDotIdx >= dots.length) {
                        gameState = 'won';
                    } else {
                        dots[activeDotIdx].active = true;
                    }
                } else {
                    window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('danger');
                }
            } else if (type === 'spa') {
                // Check if hit bubble
                for (let i = bubbles.length - 1; i >= 0; i--) {
                    const b = bubbles[i];
                    const d2 = (clickX - b.x)**2 + (clickY - b.y)**2;
                    if (d2 < b.r * b.r * 1.5) {
                        bubbles.splice(i, 1);
                        score++;
                        window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('click');
                        if (score >= 15) {
                            gameState = 'won';
                        }
                        break;
                    }
                }
            }
        });

        // Spacebar hook
        const handleKeyDown = (e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                triggerAction();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Quit Button Action
        quitBtn.addEventListener('click', () => {
            cleanup();
            this.closeModal();
        });

        const cleanup = () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (this.miniGameLoopId) cancelAnimationFrame(this.miniGameLoopId);
        };

        // Frame update & render loop
        let lastT = performance.now();
        const loop = (timestamp) => {
            const dt = Math.min((timestamp - lastT) / 1000, 0.1);
            lastT = timestamp;

            // Clear
            ctx.fillStyle = '#0c0b16';
            ctx.fillRect(0, 0, 550, 300);

            // Grid backing
            ctx.strokeStyle = 'rgba(233,30,99,0.03)';
            ctx.lineWidth = 1;
            for (let x = 0; x < 550; x += 25) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke();
            }
            for (let y = 0; y < 300; y += 25) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(550, y); ctx.stroke();
            }

            if (gameState === 'playing') {
                // Update specific game logic
                if (type === 'hair') {
                    // Update pointer
                    pointerX += pointerSpeed * pointerDir * dt * 60;
                    if (pointerX >= 520) { pointerX = 520; pointerDir = -1; }
                    if (pointerX <= 30) { pointerX = 30; pointerDir = 1; }

                    // Draw Target Zone
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
                    ctx.fillRect(targetStart, 180, targetWidth, 40);
                    ctx.strokeStyle = '#4CAF50';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(targetStart, 180, targetWidth, 40);

                    // Draw Slider Bar
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(30, 195, 490, 10);
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.strokeRect(30, 195, 490, 10);

                    // Draw Pointer
                    ctx.fillStyle = '#ff3366';
                    ctx.fillRect(pointerX - 4, 180, 8, 40);

                    // Draw Scissors & hair styling visual
                    ctx.font = '72px Cairo';
                    ctx.textAlign = 'center';
                    ctx.fillText('💇‍♀️✂️', 275, 100);

                    // Draw HUD details
                    ctx.font = 'bold 16px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'right';
                    ctx.fillText(`الدرجة: ${score}/3`, 520, 35);
                    ctx.textAlign = 'left';
                    ctx.fillText(`المحاولات المتبقية: ${lives}`, 30, 35);

                } else if (type === 'makeup') {
                    // Draw Face Silhouette
                    ctx.beginPath();
                    ctx.arc(275, 100, 50, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffccbc';
                    ctx.fill();
                    ctx.strokeStyle = '#ff8a80';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Neck
                    ctx.fillStyle = '#ffccbc';
                    ctx.fillRect(265, 140, 20, 30);

                    // Cheeks & Eyes
                    ctx.fillStyle = '#000';
                    ctx.fillRect(250, 90, 10, 5);
                    ctx.fillRect(290, 90, 10, 5);

                    // Hair Outline overlay
                    ctx.beginPath();
                    ctx.arc(275, 80, 52, Math.PI, 0);
                    ctx.strokeStyle = '#ff7043';
                    ctx.lineWidth = 12;
                    ctx.stroke();

                    // Render clicked cosmetic layers
                    dots.forEach(d => {
                        if (d.clicked) {
                            ctx.beginPath();
                            ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
                            ctx.fillStyle = d.color;
                            ctx.fill();
                        }
                    });

                    // Render dots
                    dots.forEach((d, idx) => {
                        if (!d.clicked) {
                            ctx.beginPath();
                            ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
                            ctx.fillStyle = d.active ? 'rgba(233,30,99,0.3)' : 'rgba(255,255,255,0.05)';
                            ctx.fill();
                            ctx.strokeStyle = d.active ? '#e91e63' : 'rgba(255,255,255,0.2)';
                            ctx.lineWidth = 2;
                            ctx.stroke();

                            ctx.font = 'bold 11px Cairo';
                            ctx.fillStyle = d.active ? '#fff' : 'rgba(255,255,255,0.3)';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(idx + 1, d.x, d.y);
                        }
                    });

                    ctx.font = 'bold 16px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.fillText(`انقر على النقطة المضيئة رقم ${activeDotIdx + 1}`, 275, 230);

                } else if (type === 'nails') {
                    // Draw Hand shape
                    ctx.fillStyle = '#f5c2b3';
                    ctx.beginPath();
                    ctx.arc(275, 250, 90, Math.PI, 0);
                    ctx.fill();

                    // Draw fingers & nails
                    for (let idx = 0; idx < 5; idx++) {
                        const x = nailX[idx];
                        const y = idx === 2 ? 140 : (idx === 1 || idx === 3 ? 150 : 170);

                        // Finger block
                        ctx.fillStyle = '#f5c2b3';
                        ctx.fillRect(x - 16, y, 32, 100);
                        ctx.beginPath();
                        ctx.arc(x, y, 16, Math.PI, 0);
                        ctx.fill();

                        // Target color dot above finger
                        ctx.beginPath();
                        ctx.arc(x, y - 25, 8, 0, Math.PI * 2);
                        ctx.fillStyle = targetColors[idx];
                        ctx.fill();
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = idx === activeNailIdx ? 2 : 0.5;
                        ctx.stroke();

                        // Nail itself
                        ctx.fillStyle = nailColors[idx];
                        ctx.fillRect(x - 8, y - 8, 16, 18);
                        ctx.beginPath();
                        ctx.arc(x, y - 8, 8, Math.PI, 0);
                        ctx.fill();
                    }

                    // Brush cycling at top
                    colorCycleTimer += dt;
                    if (colorCycleTimer >= 0.7) {
                        colorCycleTimer = 0;
                        currentColorIdx = (currentColorIdx + 1) % targetColors.length;
                    }

                    // Draw Brush Selector
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                    ctx.fillRect(150, 30, 250, 40);
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.strokeRect(150, 30, 250, 40);

                    ctx.font = 'bold 14px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'right';
                    ctx.fillText('لون الفرشاة الحالي:', 280, 54);

                    ctx.beginPath();
                    ctx.arc(310, 50, 12, 0, Math.PI * 2);
                    ctx.fillStyle = targetColors[currentColorIdx];
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();

                    // HUD
                    ctx.font = 'bold 15px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.fillText(`قلوب: ${lives}`, 30, 35);
                    ctx.textAlign = 'right';
                    ctx.fillText(`الأظافر: ${activeNailIdx}/5`, 520, 35);

                } else if (type === 'spa') {
                    // Update timer
                    timer -= dt;
                    if (timer <= 0) {
                        timer = 0;
                        gameState = 'lost';
                    }

                    // Spawn bubbles
                    spawnTimer += dt;
                    if (spawnTimer >= 0.35) {
                        spawnTimer = 0;
                        bubbles.push({
                            x: 40 + Math.random() * 470,
                            y: 320,
                            r: 10 + Math.random() * 15,
                            speed: 60 + Math.random() * 80
                        });
                    }

                    // Update bubbles
                    for (let i = bubbles.length - 1; i >= 0; i--) {
                        const b = bubbles[i];
                        b.y -= b.speed * dt;
                        
                        // Draw bubble
                        ctx.beginPath();
                        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0,229,255,0.15)';
                        ctx.fill();
                        ctx.strokeStyle = '#00e5ff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        // Shimmer highlight
                        ctx.beginPath();
                        ctx.arc(b.x - b.r/3, b.y - b.r/3, b.r/4, 0, Math.PI*2);
                        ctx.fillStyle = 'rgba(255,255,255,0.4)';
                        ctx.fill();

                        if (b.y < -30) bubbles.splice(i, 1);
                    }

                    // Draw progress and timer
                    ctx.font = 'bold 16px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.fillText(`⏱️ الوقت: ${timer.toFixed(1)} ثانية`, 30, 35);
                    ctx.textAlign = 'right';
                    ctx.fillText(`فقاعات مفرقعة: ${score}/15`, 520, 35);

                } else if (type === 'bridal') {
                    // Update Tiara slider
                    if (!falling) {
                        tiaraX += tiaraSpeed * tiaraDir * dt * 60;
                        if (tiaraX >= 500) { tiaraX = 500; tiaraDir = -1; }
                        if (tiaraX <= 50) { tiaraX = 50; tiaraDir = 1; }
                    } else {
                        // Falling physics
                        tiaraY += tiaraSpeed * dt * 100;
                        if (tiaraY >= 190) { // Collision level
                            falling = false;
                            const diff = Math.abs(tiaraX - 275);
                            if (diff < 26) {
                                gameState = 'won';
                                window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('success');
                            } else {
                                lives--;
                                window.gameInstance.playSynthSound && window.gameInstance.playSynthSound('danger');
                                tiaraY = 50;
                                if (lives <= 0) gameState = 'lost';
                            }
                        }
                    }

                    // Draw Bride Head
                    ctx.beginPath();
                    ctx.arc(275, 230, 40, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffe0b2';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Bridal veil
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.beginPath();
                    ctx.moveTo(235, 230);
                    ctx.lineTo(210, 290);
                    ctx.lineTo(340, 290);
                    ctx.lineTo(315, 230);
                    ctx.closePath();
                    ctx.fill();

                    // Tiara (Crown)
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.moveTo(tiaraX - 20, tiaraY);
                    ctx.lineTo(tiaraX - 10, tiaraY - 15);
                    ctx.lineTo(tiaraX, tiaraY - 5);
                    ctx.lineTo(tiaraX + 10, tiaraY - 15);
                    ctx.lineTo(tiaraX + 20, tiaraY);
                    ctx.closePath();
                    ctx.fill();

                    // HUD
                    ctx.font = 'bold 15px Cairo';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.fillText(`محاولات: ${lives}`, 30, 35);
                }
            } else if (gameState === 'won') {
                ctx.fillStyle = 'rgba(12,11,22,0.9)';
                ctx.fillRect(0, 0, 550, 300);

                ctx.font = 'bold 36px Cairo';
                ctx.fillStyle = '#4CAF50';
                ctx.textAlign = 'center';
                ctx.fillText('نجاح باهر! 🎉', 275, 120);

                ctx.font = '16px Cairo';
                ctx.fillStyle = '#fff';
                ctx.fillText('قمت بالخدمة باحترافية تامة!', 275, 165);
                ctx.fillText('مكافأة: +50% بقشيش وإرضاء كامل للعميلة!', 275, 195);

                btn.textContent = 'استلام المكافأة 💰';
                btn.onclick = () => {
                    cleanup();
                    // trigger win rewards
                    if (window.gameInstance.completeMiniGame) {
                        window.gameInstance.completeMiniGame(customer.id, true);
                    }
                    this.closeModal();
                };
            } else if (gameState === 'lost') {
                ctx.fillStyle = 'rgba(12,11,22,0.9)';
                ctx.fillRect(0, 0, 550, 300);

                ctx.font = 'bold 36px Cairo';
                ctx.fillStyle = '#ff3366';
                ctx.textAlign = 'center';
                ctx.fillText('لم تضبط تماماً! 😢', 275, 120);

                ctx.font = '16px Cairo';
                ctx.fillStyle = '#fff';
                ctx.fillText('الخدمة ستستمر تلقائياً بواسطة الموظفات.', 275, 170);

                btn.textContent = 'موافق (إكمال تلقائي)';
                btn.onclick = () => {
                    cleanup();
                    if (window.gameInstance.completeMiniGame) {
                        window.gameInstance.completeMiniGame(customer.id, false);
                    }
                    this.closeModal();
                };
            }

            this.miniGameLoopId = requestAnimationFrame(loop);
        };

        this.miniGameLoopId = requestAnimationFrame(loop);
    }

    update() {
        // Top HUD values
        const repVal = document.getElementById('hud-rep-val');
        if (repVal) {
            repVal.textContent = `⭐ ${this.game.reputation}%`;
            if (this.game.reputation < 35) {
                repVal.className = 'hud-rep low';
            } else {
                repVal.className = 'hud-rep';
            }
        }
        
        const moneyVal = document.getElementById('hud-money-val');
        if (moneyVal) {
            moneyVal.textContent = `${this.game.money.toLocaleString()} ج.م`;
        }
        
        const timeVal = document.getElementById('hud-time-val');
        if (timeVal) {
            const h = this.game.hour;
            const m = this.game.minute < 10 ? '0' + Math.floor(this.game.minute) : Math.floor(this.game.minute);
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            
            timeVal.textContent = `يوم ${this.game.day} | ⏰ ${displayH}:${m} ${period}`;
        }
        
        const lvlVal = document.getElementById('hud-level-val');
        if (lvlVal) {
            lvlVal.textContent = `🏆 مستوى ${this.game.level}`;
        }
        
        const xpPctText = document.getElementById('hud-xp-pct');
        const xpInner = document.getElementById('hud-xp-bar');
        if (xpInner && xpPctText) {
            const needed = this.game.level * 100;
            const pct = Math.min(100, Math.floor((this.game.xp / needed) * 100));
            xpInner.style.width = `${pct}%`;
            xpPctText.textContent = `${pct}%`;
        }

        // Active screens refresh
        if (this.activeModal && this.activeModal !== 'mini_game') {
            this.renderModalContent();
        }
    }
}
