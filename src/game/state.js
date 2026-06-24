// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - Game State Manager                                     ║
// ║   Handles all tycoon statistics, simulation updates, and business logic. ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const ROOM_LAYOUTS = {
    reception: { x: -6, z: 6, w: 4, d: 3, yRot: 0, color: '#ff4081', emoji: '🛎️', name: 'الاستقبال' },
    lounge:    { x: -6, z: -4, w: 4, d: 4, yRot: 0, color: '#795548', emoji: '🛋️', name: 'صالون انتظار' },
    makeup:    { x: -1, z: 6, w: 3.5, d: 3, yRot: Math.PI, color: '#e91e63', emoji: '💄', name: 'ميك أب' },
    hair:      { x: 3.5, z: 6, w: 3.5, d: 3, yRot: Math.PI, color: '#9c27b0', emoji: '💇‍♀️', name: 'شعر' },
    nails:     { x: 8, z: 6, w: 3.5, d: 3, yRot: Math.PI, color: '#00bcd4', emoji: '💅', name: 'أظافر' },
    spa:       { x: 8, z: 1, w: 3.5, d: 4, yRot: -Math.PI/2, color: '#009688', emoji: '🧖‍♀️', name: 'سبا' },
    skincare:  { x: 8, z: -4, w: 3.5, d: 3, yRot: 0, color: '#4caf50', emoji: '✨', name: 'عناية بالبشرة' },
    massage:   { x: 3.5, z: -4, w: 3.5, d: 3, yRot: 0, color: '#8bc34a', emoji: '💆‍♀️', name: 'مساج' },
    coffee:    { x: -1, z: -4, w: 3.5, d: 3, yRot: 0, color: '#ff9800', emoji: '☕', name: 'كافيه' },
    store:     { x: -6, z: 1, w: 4, d: 3, yRot: Math.PI/2, color: '#3f51b5', emoji: '🛍️', name: 'متجر منتجات' },
    waxing:    { x: -1, z: 1, w: 3.5, d: 3, yRot: 0, color: '#ffc107', emoji: '🪒', name: 'واكس' },
    bridal:    { x: 3.5, z: 1, w: 3.5, d: 4, yRot: 0, color: '#ffeb3b', emoji: '👰', name: 'غرفة عروسة' }
};

export const SERVICES = [
    { id: 'makeup_basic', name: 'ميك أب بسيط', price: 300, duration: 30, room: 'makeup', skillReq: 60, popularity: 80, emoji: '💄' },
    { id: 'makeup_full', name: 'ميك أب كامل', price: 800, duration: 60, room: 'makeup', skillReq: 80, popularity: 60, emoji: '💄' },
    { id: 'makeup_bridal', name: 'ميك أب عروسة', price: 2000, duration: 120, room: 'bridal', skillReq: 90, popularity: 30, emoji: '👰' },
    { id: 'hair_cut', name: 'قص شعر', price: 150, duration: 30, room: 'hair', skillReq: 50, popularity: 90, emoji: '✂️' },
    { id: 'hair_color', name: 'صبغة شعر', price: 400, duration: 60, room: 'hair', skillReq: 70, popularity: 70, emoji: '🎨' },
    { id: 'hair_straighten', name: 'فرد شعر', price: 600, duration: 90, room: 'hair', skillReq: 75, popularity: 50, emoji: '🔥' },
    { id: 'nails_manicure', name: 'منيكير', price: 100, duration: 30, room: 'nails', skillReq: 50, popularity: 85, emoji: '💅' },
    { id: 'nails_pedicure', name: 'بيديكير', price: 120, duration: 40, room: 'nails', skillReq: 55, popularity: 70, emoji: '🦶' },
    { id: 'nails_gel', name: 'جل أظافر', price: 250, duration: 60, room: 'nails', skillReq: 65, popularity: 60, emoji: '💎' },
    { id: 'spa_basic', name: 'سبا أساسي', price: 500, duration: 60, room: 'spa', skillReq: 60, popularity: 40, emoji: '🧖‍♀️' },
    { id: 'spa_luxury', name: 'سبا فخم', price: 1200, duration: 120, room: 'spa', skillReq: 80, popularity: 25, emoji: '👑' },
    { id: 'massage_basic', name: 'مساج استرخاء', price: 300, duration: 45, room: 'massage', skillReq: 55, popularity: 50, emoji: '💆‍♀️' },
    { id: 'massage_hotstone', name: 'مساج أحجار ساخنة', price: 600, duration: 60, room: 'massage', skillReq: 70, popularity: 35, emoji: '🪨' },
    { id: 'skincare_basic', name: 'تنظيف بشرة', price: 250, duration: 45, room: 'skincare', skillReq: 60, popularity: 65, emoji: '✨' },
    { id: 'skincare_advanced', name: 'علاج بشرة متقدم', price: 700, duration: 75, room: 'skincare', skillReq: 80, popularity: 40, emoji: '🔬' },
    { id: 'wax_full', name: 'واكس كامل', price: 200, duration: 30, room: 'waxing', skillReq: 50, popularity: 55, emoji: '🪒' },
    { id: 'wax_face', name: 'واكس وجه', price: 80, duration: 15, room: 'waxing', skillReq: 45, popularity: 45, emoji: '😊' },
];

export const PRODUCTS = [
    { id: 'lipstick', name: 'أحمر شفاه', price: 150, cost: 50, stock: 20, sold: 0, emoji: '💄' },
    { id: 'foundation', name: 'فاونديشن', price: 300, cost: 100, stock: 15, sold: 0, emoji: '🧴' },
    { id: 'mascara', name: 'ماسكارا', price: 120, cost: 40, stock: 25, sold: 0, emoji: '👁️' },
    { id: 'shampoo', name: 'شامبو', price: 80, cost: 25, stock: 30, sold: 0, emoji: '🧴' },
    { id: 'conditioner', name: 'كونديشنر', price: 90, cost: 30, stock: 25, sold: 0, emoji: '🧴' },
    { id: 'face_cream', name: 'كريم وجه', price: 200, cost: 70, stock: 15, sold: 0, emoji: '✨' },
    { id: 'perfume', name: 'عطر', price: 500, cost: 200, stock: 10, sold: 0, emoji: '🌸' },
    { id: 'nail_polish', name: 'طلاء أظافر', price: 50, cost: 15, stock: 40, sold: 0, emoji: '💅' },
    { id: 'hair_oil', name: 'زيت شعر', price: 120, cost: 40, stock: 20, sold: 0, emoji: '🫒' },
    { id: 'body_lotion', name: 'لوشن جسم', price: 100, cost: 35, stock: 25, sold: 0, emoji: '🧴' },
];

export const CUSTOMER_NAMES_AR = [
    'فاطمة', 'عائشة', 'مريم', 'نور', 'سارة', 'هند', 'داليا', 'ياسمين', 'رنا', 'هالة',
    'منة', 'نادية', 'ليلا', 'سلمى', 'رانيا', 'أمل', 'دنيا', 'سلمى', 'هدى', 'وفاء',
    'كريمة', 'سمية', 'خديجة', 'زينب', 'رقية', 'حفصة', 'آمنة', 'سمية', 'مريم', 'جميلة',
    'رغدة', 'سهام', 'ابتسام', 'انتصار', 'إكرام', 'نجوى', 'فريدة', 'سهام', 'وفاء', 'صفاء',
];

export const CUSTOMER_APPEARANCE = ['👱‍♀️', '👩‍🦰', '👩‍🦱', '👩‍🦳', '🧕', '👩‍🎨', '💃', '👸', '🧔‍♀️'];

export const COMMENTS_POSITIVE = [
    'خدمة ممتازة! ♥', 'أحسنتوا! 🌟', 'هجي تاني أكيد! 💪', 'أحلى بيوتي سنتر! 💄',
    'شغل نظيف وراقي ✨', 'الموظفين محترمين جداً 👏', 'الأسعار معقولة 💰',
    'المكان نظيف وراقي 🏆', 'أفضل تجربة! 😍', 'أنصح الكل يجي هنا 👍',
    'برافو عليكم! 🎉', 'الجودة عالية 🔥'
];

export const COMMENTS_NEGATIVE = [
    'السعر غالي 💸', 'الانتظار طويل ⏰', 'مش كويس 😤', 'عايزة استرجاع فلوس 💵',
    'الخدمة مش زي ما وعدتوا 😞', 'في تأخير كتير ⏱️', 'الموظفة مش كويسة 😒',
    'مفيش نظافة 😠', 'المكان زحم 🚶‍♀️'
];

export const COMMENTS_FUNNY = [
    '👩‍🦰 عايزة أكون زي هيفا واهيبا!',
    '👰 عندي فرح بكرة جهزوني!',
    '💅 نفسي في manicure زي اللي في reels',
    '📸 ممكن صورة قبل وبعد؟',
    '💄 هو في خصومات؟',
    '☕ فين الكافيه هنا؟'
];

export const HIRING_POOL = [
    { name: 'منة', role: 'nails', skill: 70, salary: 2000, emoji: '💅', label: 'متخصصة أظافر' },
    { name: 'رنا', role: 'spa', skill: 80, salary: 3500, emoji: '🧖‍♀️', label: 'أخصائية سبا' },
    { name: 'هالة', role: 'skincare', skill: 90, salary: 4000, emoji: '✨', label: 'خبيرة بشرة' },
    { name: 'داليا', role: 'massage', skill: 65, salary: 2200, emoji: '💆‍♀️', label: 'مساجست' },
    { name: 'فاطمة', role: 'waxing', skill: 75, salary: 2000, emoji: '🪒', label: 'خبيرة واكس' },
    { name: 'ريهام', role: 'makeup', skill: 75, salary: 2600, emoji: '💄', label: 'ميك أب أرتست' },
    { name: 'ياسمين', role: 'hair', skill: 72, salary: 2300, emoji: '💇‍♀️', label: 'كوافيرة' },
    { name: 'شيرين', role: 'bridal', skill: 88, salary: 4500, emoji: '👰', label: 'خبيرة عرايس' },
];

export const ROOM_COSTS = {
    reception: 0, lounge: 0, makeup: 0, hair: 0,
    nails: 3000, spa: 8000, skincare: 5000, massage: 6000,
    store: 4000, coffee: 3000, waxing: 2500, bridal: 15000
};

export const ROOM_UPGRADES = {
    reception: { cost: 2000, desc: 'مكتب استقبال فخم' },
    makeup: { cost: 3000, desc: 'مرآة بإضاءة احترافية' },
    hair: { cost: 2500, desc: 'كرسي كوافير فخم' },
    nails: { cost: 2000, desc: 'طاولة أظافر متطورة' },
    spa: { cost: 5000, desc: 'غرفة سبا فاخرة' },
    skincare: { cost: 4000, desc: 'جهاز تحليل بشرة' },
    massage: { cost: 3500, desc: 'سرير مساج متحرك' },
    lounge: { cost: 1500, desc: 'كنب جلد فخم' },
    store: { cost: 2000, desc: 'أرفف عرض مضيئة' },
    coffee: { cost: 2000, desc: 'ماكينة قهوة احترافية' },
    waxing: { cost: 1500, desc: 'جهاز تسخين واكس متطور' },
    bridal: { cost: 8000, desc: 'غرفة عروسة متكاملة' },
};

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.screen = 'menu'; // menu, game, shop, staff, finance, settings
        this.paused = false;
        this.day = 1;
        this.hour = 8;
        this.minute = 0;
        this.speed = 1;
        this.money = 5000;
        this.reputation = 60;
        this.xp = 0;
        this.level = 1;

        this.centerName = 'سنتر الغرام';
        this.centerLevel = 1;
        this.maxCustomers = 8;
        this.satisfiedCustomers = 0;
        this.angryCustomers = 0;

        // Built Rooms
        this.rooms = {
            reception: { built: true, level: 1 },
            lounge:    { built: true, level: 1 },
            makeup:    { built: true, level: 1 },
            hair:      { built: true, level: 1 },
            nails:     { built: false, level: 0 },
            spa:       { built: false, level: 0 },
            skincare:  { built: false, level: 0 },
            massage:   { built: false, level: 0 },
            coffee:    { built: false, level: 0 },
            store:     { built: false, level: 0 },
            waxing:    { built: false, level: 0 },
            bridal:    { built: false, level: 0 }
        };

        // Staff
        this.staff = [
            { id: 1, name: 'نور', role: 'makeup', skill: 85, salary: 3000, mood: 85, emoji: '👩‍🎨', busy: false, targetRoom: 'makeup', hairStyle: 'ponytail', hairColor: '#37474f', skinColor: '#ffccbc', outfitColor: '#8e24aa', isStaff: true },
            { id: 2, name: 'سارة', role: 'hair', skill: 75, salary: 2500, mood: 90, emoji: '💇‍♀️', busy: false, targetRoom: 'hair', hairStyle: 'bob', hairColor: '#ff7043', skinColor: '#ffe0b2', outfitColor: '#8e24aa', isStaff: true },
        ];

        // Dynamic pool
        this.hiringPool = JSON.parse(JSON.stringify(HIRING_POOL));
        
        // Active customers
        this.customers = [];

        // Products stock & sales
        this.products = JSON.parse(JSON.stringify(PRODUCTS));

        // Daily statistics
        this.dailyStats = {
            customersServed: 0,
            revenue: 0,
            expenses: 0,
            tips: 0,
            complaints: 0,
        };

        this.notifications = [];
        this.onNotificationAdded = null;
        this.onStateChanged = null;

        // Timer for spawning & events
        this.spawnTimer = 0;
        this.hourlyTimer = 0;

        // Sound settings
        this.soundEnabled = true;
        this.musicEnabled = true;

        this.addNotification('🌸 أهلاً بك في سنتر الغرام! ابدأ إدارة الصالون الآن.', 'success');
    }

    addNotification(text, type = 'info') {
        const notif = {
            id: Date.now() + Math.random(),
            text,
            type,
            opacity: 1,
            time: 3.5 // seconds
        };
        this.notifications.push(notif);
        if (this.notifications.length > 5) {
            this.notifications.shift();
        }
        if (this.onNotificationAdded) {
            this.onNotificationAdded(notif);
        }
    }

    triggerChange() {
        if (this.onStateChanged) {
            this.onStateChanged();
        }
    }

    update(dt) {
        if (this.paused || this.screen === 'menu') return;

        const actualDt = dt * this.speed;

        // Progress time: 1 real second = 15 game minutes (speed adjusted)
        this.minute += actualDt * 15;
        while (this.minute >= 60) {
            this.minute -= 60;
            this.hour++;
            this.handleHourlyUpdate();
        }

        if (this.hour >= 22) { // End of work day (10 PM)
            this.handleDailyUpdate();
            this.hour = 8;
            this.minute = 0;
            this.day++;
        }

        // Update notifications timers
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            notif.time -= dt;
            if (notif.time <= 0) {
                notif.opacity -= dt * 2.0;
                if (notif.opacity <= 0) {
                    this.notifications.splice(i, 1);
                }
            }
        }

        // Handle Spawning Customers
        this.spawnTimer += actualDt;
        const spawnInterval = Math.max(8, 25 - (this.reputation * 0.15)); // faster spawn with higher reputation
        if (this.spawnTimer >= spawnInterval) {
            this.spawnTimer = 0;
            if (this.customers.length < this.maxCustomers) {
                this.spawnCustomer();
            }
        }

        // Update active customers logic
        this.updateCustomers(actualDt);

        // Slow XP accumulation
        this.xp += actualDt * 0.1;
        const xpNeeded = this.level * 100;
        if (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            this.maxCustomers = Math.min(15, this.maxCustomers + 1);
            this.addNotification(`🏆 مبارك! صعدت للمستوى ${this.level}! زادت سعة السنتر.`, 'success');
            this.triggerChange();
        }
    }

    spawnCustomer() {
        // Find built rooms to determine which services are possible
        const activeRooms = Object.keys(this.rooms).filter(r => this.rooms[r].built && r !== 'reception' && r !== 'lounge');
        if (activeRooms.length === 0) return;

        // Filter services for built rooms
        const availableServices = SERVICES.filter(s => activeRooms.includes(s.room));
        if (availableServices.length === 0) return;

        const chosenService = availableServices[Math.floor(Math.random() * availableServices.length)];
        const name = CUSTOMER_NAMES_AR[Math.floor(Math.random() * CUSTOMER_NAMES_AR.length)];
        const emoji = CUSTOMER_APPEARANCE[Math.floor(Math.random() * CUSTOMER_APPEARANCE.length)];

        const isVip = Math.random() < 0.08;
        const isBride = !isVip && chosenService.room === 'bridal' && Math.random() < 0.4;

        const styles = ['ponytail', 'double_buns', 'curly', 'bob', 'hijab'];
        const colors = ['#ffd54f', '#ff7043', '#37474f', '#8d6e63', '#d7ccc8'];
        const skins = ['#ffccbc', '#ffa726', '#ffe0b2', '#f5c2b3'];
        const outfits = ['#ec407a', '#00acc1', '#26a69a', '#ab47bc', '#7e57c2'];

        const customer = {
            id: 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: isVip ? '⭐ ' + name : (isBride ? '👰 ' + name : name),
            emoji: isBride ? '👰' : emoji,
            isVip,
            isBride,
            serviceId: chosenService.id,
            room: chosenService.room,
            patience: isVip ? 150 : (isBride ? 120 : Math.floor(Math.random() * 50) + 60), // starting patience (sec)
            maxPatience: 120,
            state: 'walk_in', // walk_in, at_reception, walk_to_lounge, waiting_in_lounge, walk_to_station, in_service, walk_to_checkout, checkout, walk_out
            progress: 0,
            satisfaction: 70,
            patienceTimer: 0,
            comment: null,
            commentTimer: 0,
            assignedStaffId: null,
            // Custom styles
            hairStyle: styles[Math.floor(Math.random() * styles.length)],
            hairColor: colors[Math.floor(Math.random() * colors.length)],
            skinColor: skins[Math.floor(Math.random() * skins.length)],
            outfitColor: isVip ? '#ffd700' : (isBride ? '#ffffff' : outfits[Math.floor(Math.random() * outfits.length)]),
            // 3D positional properties
            x: 0, z: 12, // entrance
            y: 0,
            targetX: 0, targetZ: 12,
            animState: 'idle',
            sitting: false
        };
        customer.maxPatience = customer.patience;

        // Set initial walk destination to Reception
        customer.targetX = ROOM_LAYOUTS.reception.x;
        customer.targetZ = ROOM_LAYOUTS.reception.z + 1.2; // in front of desk
        customer.animState = 'walk';

        this.customers.push(customer);
        if (isVip) {
            this.addNotification(`⭐ عميلة VIP دخلت السنتر: ${name}!`, 'success');
        } else if (isBride) {
            this.addNotification(`👰 زفة عروسة! العروسة ${name} دخلت السنتر!`, 'success');
        }
        this.triggerChange();
    }

    updateCustomers(dt) {
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const c = this.customers[i];

            // Decrease patience if waiting
            if (c.state === 'walk_in' || c.state === 'at_reception' || c.state === 'walk_to_lounge' || c.state === 'waiting_in_lounge') {
                c.patience -= dt;
                c.satisfaction = Math.max(0, Math.floor((c.patience / c.maxPatience) * 100));

                if (c.patience <= 0 && c.state !== 'walk_out') {
                    c.state = 'walk_out';
                    c.comment = 'الانتظار طويل جداً! أنا مغادرة 😡';
                    c.commentTimer = 4.0;
                    c.targetX = 0;
                    c.targetZ = 12; // back to entrance
                    c.animState = 'walk';
                    c.sitting = false;
                    this.reputation = Math.max(0, this.reputation - 4);
                    this.dailyStats.complaints++;
                    this.addNotification(`😡 العميلة ${c.name} غادرت غاضبة بسبب الانتظار!`, 'danger');
                    this.triggerChange();

                    // Free staff if any was locked (unlikely here)
                    if (c.assignedStaffId) {
                        const st = this.staff.find(s => s.id === c.assignedStaffId);
                        if (st) st.busy = false;
                        c.assignedStaffId = null;
                    }
                }
            }

            // Update floating comments timer
            if (c.comment) {
                c.commentTimer -= dt;
                if (c.commentTimer <= 0) c.comment = null;
            }

            // State Machine Logic
            switch (c.state) {
                case 'walk_in':
                    // Check if reached reception
                    if (this.hasReachedTarget(c)) {
                        c.state = 'at_reception';
                        c.animState = 'idle';
                        c.patienceTimer = 2.0; // 2 seconds check-in
                    }
                    break;

                case 'at_reception':
                    c.patienceTimer -= dt;
                    if (c.patienceTimer <= 0) {
                        // Registration complete. Try to seat at station directly, or go to lounge
                        this.routeCustomerAfterReception(c);
                    }
                    break;

                case 'walk_to_lounge':
                    if (this.hasReachedTarget(c)) {
                        c.state = 'waiting_in_lounge';
                        c.sitting = true;
                        c.animState = 'idle';
                    }
                    break;

                case 'waiting_in_lounge':
                    // Regularly check if a staff member and room station is free
                    this.routeCustomerFromLounge(c);
                    break;

                case 'walk_to_station':
                    if (this.hasReachedTarget(c)) {
                        c.state = 'in_service';
                        c.sitting = true;
                        c.animState = 'idle';
                        c.progress = 0;
                        
                        // Set staff busy and target them to face the chair
                        const st = this.staff.find(s => s.id === c.assignedStaffId);
                        if (st) st.busy = true;
                    }
                    break;

                case 'in_service':
                    const service = SERVICES.find(s => s.id === c.serviceId);
                    const speedMultiplier = 1.0;
                    c.progress += (dt / (service.duration / 5)) * 100 * speedMultiplier; // Speed up duration for gameplay feel
                    
                    if (c.progress >= 100) {
                        // Complete service
                        c.state = 'walk_to_checkout';
                        c.sitting = false;
                        c.animState = 'walk';
                        c.targetX = ROOM_LAYOUTS.reception.x;
                        c.targetZ = ROOM_LAYOUTS.reception.z + 1.2;

                        // Release staff
                        const st = this.staff.find(s => s.id === c.assignedStaffId);
                        if (st) {
                            st.busy = false;
                        }
                    }
                    break;

                case 'walk_to_checkout':
                    if (this.hasReachedTarget(c)) {
                        c.state = 'checkout';
                        c.animState = 'idle';
                        c.patienceTimer = 1.5; // checkout time
                        this.processPayment(c);
                    }
                    break;

                case 'checkout':
                    c.patienceTimer -= dt;
                    if (c.patienceTimer <= 0) {
                        c.state = 'walk_out';
                        c.animState = 'walk';
                        c.targetX = 0;
                        c.targetZ = 12; // entrance
                    }
                    break;

                case 'walk_out':
                    if (this.hasReachedTarget(c)) {
                        // Done, remove customer
                        this.customers.splice(i, 1);
                        this.triggerChange();
                    }
                    break;
            }
        }
    }

    hasReachedTarget(c) {
        const dx = c.targetX - c.x;
        const dz = c.targetZ - c.z;
        return (dx*dx + dz*dz) < 0.05;
    }

    routeCustomerAfterReception(c) {
        // Try to assign a staff member who has the correct skill/role
        const availableStaff = this.staff.find(s => s.role === c.room && !s.busy && s.mood > 10);
        
        if (availableStaff) {
            c.assignedStaffId = availableStaff.id;
            availableStaff.busy = true;
            c.state = 'walk_to_station';
            c.animState = 'walk';
            c.targetX = ROOM_LAYOUTS[c.room].x;
            c.targetZ = ROOM_LAYOUTS[c.room].z;
            c.sitting = false;
        } else {
            // No staff available, go to lounge
            c.state = 'walk_to_lounge';
            c.animState = 'walk';
            // Random lounge slot
            c.targetX = ROOM_LAYOUTS.lounge.x + (Math.random() * 2 - 1);
            c.targetZ = ROOM_LAYOUTS.lounge.z + (Math.random() * 2 - 1);
        }
        this.triggerChange();
    }

    routeCustomerFromLounge(c) {
        const availableStaff = this.staff.find(s => s.role === c.room && !s.busy && s.mood > 10);
        if (availableStaff) {
            c.assignedStaffId = availableStaff.id;
            availableStaff.busy = true;
            c.state = 'walk_to_station';
            c.animState = 'walk';
            c.targetX = ROOM_LAYOUTS[c.room].x;
            c.targetZ = ROOM_LAYOUTS[c.room].z;
            c.sitting = false;
            this.triggerChange();
        }
    }

    processPayment(c) {
        const service = SERVICES.find(s => s.id === c.serviceId);
        if (!service) return;

        // Calculate pay based on customer budget (1-5 stars scale) and staff skill
        let quality = 50;
        const staff = this.staff.find(s => s.id === c.assignedStaffId);
        if (staff) {
            quality = staff.skill + Math.floor(Math.random() * 15 - 5);
            // Staff skill gain
            staff.skill = Math.min(100, staff.skill + (Math.random() < 0.4 ? 1 : 0));
        }

        let finalSatisfaction = Math.min(100, Math.floor((quality * 0.7) + (c.satisfaction * 0.3)));
        if (c.isMiniGameWon) {
            finalSatisfaction = 100;
        }
        const isHappy = finalSatisfaction > 65;
        const isAngry = finalSatisfaction < 35;

        // Pay
        let earned = service.price;
        if (c.isVip) earned *= 2.0;

        let tip = 0;
        if (isHappy) {
            tip = Math.floor(earned * (Math.random() * 0.15 + 0.05));
            if (c.isMiniGameWon) {
                tip = Math.floor(tip * 2.0); // Double tip!
            }
            c.comment = c.isMiniGameWon ? 'شغلك يجنن بإيدك! ❤️' : COMMENTS_POSITIVE[Math.floor(Math.random() * COMMENTS_POSITIVE.length)];
            this.satisfiedCustomers++;
            this.reputation = Math.min(100, this.reputation + (c.isMiniGameWon ? 2 : 1));
        } else if (isAngry) {
            earned = Math.floor(earned * 0.5); // pays half
            c.comment = COMMENTS_NEGATIVE[Math.floor(Math.random() * COMMENTS_NEGATIVE.length)];
            this.angryCustomers++;
            this.reputation = Math.max(0, this.reputation - 3);
            this.dailyStats.complaints++;
        } else {
            c.comment = COMMENTS_FUNNY[Math.floor(Math.random() * COMMENTS_FUNNY.length)];
        }
        c.commentTimer = 3.5;

        // Store sale (chance of buying product on checkout)
        let productEarnings = 0;
        if (this.rooms.store.built && Math.random() < 0.3) {
            const inStock = this.products.filter(p => p.stock > 0);
            if (inStock.length > 0) {
                const prod = inStock[Math.floor(Math.random() * inStock.length)];
                prod.stock--;
                prod.sold++;
                productEarnings = prod.price;
                this.addNotification(`🛍️ ${c.name} اشترت منتج: ${prod.emoji} ${prod.name} (+${prod.price} ج.م)`, 'success');
            }
        }

        const totalEarned = earned + tip + productEarnings;
        this.money += totalEarned;
        this.dailyStats.revenue += earned + productEarnings;
        this.dailyStats.tips += tip;
        this.dailyStats.customersServed++;

        this.addNotification(
            `💵 ${c.name} دفعت ${totalEarned} ج.م ${tip > 0 ? `(شامل بقشيش ${tip})` : ''}`, 
            isHappy ? 'success' : (isAngry ? 'danger' : 'info')
        );

        this.triggerChange();
    }

    handleHourlyUpdate() {
        // Decrease staff mood
        this.staff.forEach(s => {
            s.mood = Math.max(0, s.mood - Math.floor(Math.random() * 3 + 1));
        });

        // Chance of random event
        if (Math.random() < 0.15) {
            this.triggerRandomEvent();
        }
        this.triggerChange();
    }

    handleDailyUpdate() {
        // Salaries
        const totalSalaries = Math.floor(this.staff.reduce((sum, s) => sum + s.salary, 0) / 30); // daily salary
        this.money -= totalSalaries;
        this.dailyStats.expenses = totalSalaries;

        const netProfit = this.dailyStats.revenue + this.dailyStats.tips - this.dailyStats.expenses;
        
        this.addNotification(
            `📅 نهاية اليوم ${this.day}: الإيرادات: ${this.dailyStats.revenue} | الرواتب: ${totalSalaries} | الربح: ${netProfit} ج.م`, 
            netProfit >= 0 ? 'success' : 'warning'
        );

        // Restock products automatically if money is healthy
        this.products.forEach(p => {
            if (p.stock <= 3 && this.money > p.cost * 10) {
                const toBuy = 10;
                this.money -= p.cost * toBuy;
                p.stock += toBuy;
                this.dailyStats.expenses += p.cost * toBuy;
            }
        });

        // Reset stats for next day
        this.dailyStats = {
            customersServed: 0,
            revenue: 0,
            expenses: 0,
            tips: 0,
            complaints: 0
        };

        this.triggerChange();
    }

    triggerRandomEvent() {
        const events = [
            {
                text: '🌟 فنانة شهيرة حجزت موعداً! ستدفع ضعف السعر للخدمات.',
                type: 'success',
                action: () => {
                    this.spawnCustomer();
                    const last = this.customers[this.customers.length - 1];
                    if (last) {
                        last.isVip = true;
                        last.name = '👑 النجمة ' + last.name.replace('⭐ ', '');
                        last.patience = 200;
                        last.maxPatience = 200;
                    }
                }
            },
            {
                text: '🔥 تعطل سيشوار الشعر! صيانة سريعة كلفت 400 ج.م.',
                type: 'warning',
                action: () => {
                    this.money = Math.max(0, this.money - 400);
                    this.triggerChange();
                }
            },
            {
                text: '💐 عميلة ممتنة أرسلت باقة ورد وهدية نقدية بقيمة 300 ج.م للسنتر!',
                type: 'success',
                action: () => {
                    this.money += 300;
                    this.reputation = Math.min(100, this.reputation + 4);
                    this.triggerChange();
                }
            },
            {
                text: '😱 فأر يظهر في صالون الانتظار! انخفاض مؤقت للسمعة.',
                type: 'danger',
                action: () => {
                    this.reputation = Math.max(0, this.reputation - 6);
                    this.triggerChange();
                }
            }
        ];

        const ev = events[Math.floor(Math.random() * events.length)];
        this.addNotification(ev.text, ev.type);
        ev.action();
    }

    buildRoom(roomId) {
        const cost = ROOM_COSTS[roomId];
        if (this.rooms[roomId].built) return false;
        if (this.money < cost) {
            this.addNotification(`❌ لا تملك مالاً كافياً لبناء ${ROOM_LAYOUTS[roomId].name}! تحتاج ${cost} ج.م`, 'danger');
            return false;
        }

        this.money -= cost;
        this.rooms[roomId].built = true;
        this.rooms[roomId].level = 1;
        this.addNotification(`🛠️ تم بناء ${ROOM_LAYOUTS[roomId].name} بنجاح!`, 'success');
        this.triggerChange();
        return true;
    }

    upgradeRoom(roomId) {
        const upgrade = ROOM_UPGRADES[roomId];
        if (!upgrade) return false;
        if (!this.rooms[roomId].built) return false;
        
        if (this.money < upgrade.cost) {
            this.addNotification(`❌ لا تملك مالاً كافياً لترقية ${ROOM_LAYOUTS[roomId].name}! تحتاج ${upgrade.cost} ج.م`, 'danger');
            return false;
        }

        this.money -= upgrade.cost;
        this.rooms[roomId].level++;
        this.reputation = Math.min(100, this.reputation + 3);
        this.addNotification(`⬆️ تم ترقية ${ROOM_LAYOUTS[roomId].name} إلى مستوى ${this.rooms[roomId].level}: ${upgrade.desc}!`, 'success');
        this.triggerChange();
        return true;
    }

    hireStaff(candidateIndex) {
        const candidate = this.hiringPool[candidateIndex];
        if (!candidate) return false;

        const hireCost = candidate.salary * 2; // agency fee
        if (this.money < hireCost) {
            this.addNotification(`❌ لا تملك تكلفة توظيف الموظفة (تحتاج ${hireCost} ج.م)!`, 'danger');
            return false;
        }

        if (this.staff.length >= 8) {
            this.addNotification(`❌ لا يمكنك توظيف أكثر من 8 موظفين!`, 'danger');
            return false;
        }

        this.money -= hireCost;
        const styles = ['ponytail', 'double_buns', 'curly', 'bob', 'hijab'];
        const colors = ['#ffd54f', '#ff7043', '#37474f', '#8d6e63', '#d7ccc8'];
        const skins = ['#ffccbc', '#ffa726', '#ffe0b2', '#f5c2b3'];

        this.staff.push({
            id: Date.now() + Math.random(),
            name: candidate.name,
            role: candidate.role,
            skill: candidate.skill,
            salary: candidate.salary,
            mood: 90,
            emoji: candidate.emoji,
            busy: false,
            targetRoom: candidate.role,
            hairStyle: styles[Math.floor(Math.random() * styles.length)],
            hairColor: colors[Math.floor(Math.random() * colors.length)],
            skinColor: skins[Math.floor(Math.random() * skins.length)],
            outfitColor: '#8e24aa', // uniform color
            isStaff: true
        });

        this.hiringPool.splice(candidateIndex, 1);
        this.addNotification(`🎉 تم توظيف ${candidate.name} للعمل في قسم ${ROOM_LAYOUTS[candidate.role].name}!`, 'success');
        this.triggerChange();
        return true;
    }

    buyProduct(productId, quantity = 5) {
        const prod = this.products.find(p => p.id === productId);
        if (!prod) return false;

        const cost = prod.cost * quantity;
        if (this.money < cost) {
            this.addNotification(`❌ لا تملك مالاً كافياً لشراء بضاعة! تحتاج ${cost} ج.م`, 'danger');
            return false;
        }

        this.money -= cost;
        prod.stock += quantity;
        this.addNotification(`🛒 تم شراء ${quantity} وحدات من ${prod.emoji} ${prod.name}`, 'success');
        this.triggerChange();
        return true;
    }

    giveStaffBonus(staffId) {
        const st = this.staff.find(s => s.id === staffId);
        if (!st) return false;

        const cost = 200;
        if (this.money < cost) {
            this.addNotification('❌ لا تملك 200 ج.م لإعطاء مكافأة!', 'danger');
            return false;
        }

        this.money -= cost;
        st.mood = Math.min(100, st.mood + 25);
        this.addNotification(`😊 تم إعطاء ${st.name} مكافأة! تحسن مزاجها بمقدار 25%`, 'success');
        this.triggerChange();
        return true;
    }
}
