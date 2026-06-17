// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - Beauty Center Tycoon                               ║
// ║   A full beauty center management simulation game                      ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN & SCALING
// ═══════════════════════════════════════════════════════════════════════════
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const W = () => canvas.width;
const H = () => canvas.height;

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
    bg: '#1a1a2e',
    bgLight: '#16213e',
    primary: '#E91E63',
    secondary: '#9C27B0',
    gold: '#FFD700',
    green: '#4CAF50',
    red: '#f44336',
    blue: '#2196F3',
    orange: '#FF9800',
    white: '#ffffff',
    dark: '#0f0f23',
    panel: 'rgba(255,255,255,0.05)',
    panelBorder: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    textDim: 'rgba(255,255,255,0.6)',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#f44336'
};

const TILE = 48;
const GRID_W = 20;
const GRID_H = 14;

// Game speed (ms per tick)
const TICK_RATE = 1000;
let lastTick = 0;

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════
const game = {
    screen: 'menu', // menu, game, shop, staff, finance, settings, pause
    paused: false,
    day: 1,
    hour: 8, // 8 AM start
    minute: 0,
    speed: 1, // 1x, 2x, 3x
    money: 5000,
    reputation: 50, // 0-100
    xp: 0,
    level: 1,
    
    // Center stats
    centerName: 'سنتر الغرام',
    centerLevel: 1,
    maxCustomers: 10,
    satisfiedCustomers: 0,
    angryCustomers: 0,
    
    // Rooms built
    rooms: [
        { id: 'reception', name: 'الاستقبال', built: true, x: 2, y: 2, w: 3, h: 2, emoji: '🛎️' },
        { id: 'makeup', name: 'ميك أب', built: true, x: 6, y: 2, w: 3, h: 2, emoji: '💄' },
        { id: 'hair', name: 'شعر', built: true, x: 10, y: 2, w: 3, h: 2, emoji: '💇‍♀️' },
        { id: 'nails', name: 'أظافر', built: false, x: 14, y: 2, w: 3, h: 2, emoji: '💅' },
        { id: 'spa', name: 'سبا', built: false, x: 2, y: 6, w: 3, h: 2, emoji: '🧖‍♀️' },
        { id: 'skincare', name: 'عناية بالبشرة', built: false, x: 6, y: 6, w: 3, h: 2, emoji: '✨' },
        { id: 'massage', name: 'مساج', built: false, x: 10, y: 6, w: 3, h: 2, emoji: '💆‍♀️' },
        { id: 'lounge', name: 'صالون انتظار', built: false, x: 14, y: 6, w: 3, h: 2, emoji: '🛋️' },
        { id: 'store', name: 'متجر منتجات', built: false, x: 2, y: 10, w: 3, h: 2, emoji: '🛍️' },
        { id: 'coffee', name: 'كافيه', built: false, x: 6, y: 10, w: 3, h: 2, emoji: '☕' },
        { id: 'waxing', name: 'واكس', built: false, x: 10, y: 10, w: 3, h: 2, emoji: '🪒' },
        { id: 'bridal', name: 'غرفة عروسة', built: false, x: 14, y: 10, w: 3, h: 2, emoji: '👰' },
    ],
    
    // Staff
    staff: [
        { id: 1, name: 'نور', role: 'ميك أب أرتست', skill: 85, salary: 3000, mood: 80, emoji: '👩‍🎨', busy: false },
        { id: 2, name: 'سارة', role: 'كوافيرة', skill: 75, salary: 2500, mood: 90, emoji: '💇‍♀️', busy: false },
    ],
    
    // Available staff to hire
    hiringPool: [
        { name: 'منة', role: 'متخصصة أظافر', skill: 70, salary: 2000, emoji: '💅' },
        { name: 'رنا', role: 'أخصائية سبا', skill: 80, salary: 3500, emoji: '🧖‍♀️' },
        { name: 'هالة', role: 'خبيرة عناية بالبشرة', skill: 90, salary: 4000, emoji: '✨' },
        { name: 'داليا', role: 'مساجست', skill: 65, salary: 2200, emoji: '💆‍♀️' },
        { name: 'فاطمة', role: 'خبيرة واكس', skill: 75, salary: 2000, emoji: '🪒' },
        { name: 'يوسف', role: 'كوافير رجالي', skill: 70, salary: 2500, emoji: '💈' },
        { name: 'أحمد', role: 'موظف كاشير', skill: 60, salary: 1500, emoji: '🧑‍💼' },
        { name: 'ياسمين', role: 'خدمة عملاء', skill: 65, salary: 1800, emoji: '🤝' },
    ],
    
    // Customers in center
    customers: [],
    
    // Services offered
    services: [
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
    ],
    
    // Products for sale
    products: [
        { id: 'lipstick', name: 'أحمر شفاه', price: 150, cost: 50, stock: 20, sold: 0, emoji: '💄' },
        { id: 'foundation', name: 'فاونديشن', price: 300, cost: 100, stock: 15, sold: 0, emoji: '🧴' },
        { id: 'mascara', name: 'ماسكارا', price: 120, cost: 40, stock: 25, sold: 0, emoji: '👁️' },
        { id: 'shampoo', name: 'شامبو', price: 80, cost: 25, stock: 30, sold: 0, emoji: '🧴' },
        { id: 'conditioner', name: 'كونديشنر', price: 90, cost: 30, stock: 25, sold: 0, emoji: '🧴' },
        { id: 'face_cream', name: 'كريم وجه', price: 200, cost: 70, stock: 15, sold: 0, emoji: '✨' },
        { id: 'perfume', name: 'عطر', price: 500, cost: 200, stock: 10, sold: 0, emoji: '🌸' },
        { id: 'nail_polish', name: 'طلاء أظافر', price: 50, cost: 15, stock: 40, sold: 0, emoji: '💅' },
        { id: 'hair_oil', name: زيت شعر', price: 120, cost: 40, stock: 20, sold: 0, emoji: '🫒' },
        { id: 'body_lotion', name: لوشن جسم', price: 100, cost: 35, stock: 25, sold: 0, emoji: '🧴' },
    ],
    
    // Events & random occurrences
    events: [],
    
    // Achievements
    achievements: [],
    
    // Daily stats
    dailyStats: {
        customersServed: 0,
        revenue: 0,
        expenses: 0,
        tips: 0,
        complaints: 0,
    },
    
    // Notifications
    notifications: [],
    
    // Upgrades owned
    upgrades: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// NAMES & RANDOM DATA
// ═══════════════════════════════════════════════════════════════════════════
const CUSTOMER_NAMES_AR = [
    'فاطمة', 'عائشة', 'مريم', 'نور', 'سارة', 'هند', 'داليا', 'ياسمين', 'رنا', 'هالة',
    'منة', 'نادية', 'ليلا', 'سلمى', 'رانيا', 'أمل', 'دنيا', 'سلمى', 'هدى', 'وفاء',
    'كريمة', 'سمية', 'خديجة', 'زينب', 'رقية', 'حفصة', 'آمنة', 'سمية', 'مريم', 'جميلة',
    'رغدة', 'سهام', 'ابتسام', 'انتصار', 'إكرام', 'نجوى', 'فريدة', 'سهام', 'وفاء', 'صفاء',
];

const CUSTOMER_NAMES_EN = [
    'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Luna',
    'Victoria', 'Eleanor', 'Lily', 'Grace', 'Lillian', 'Zoe', 'Hazel', 'Avery', 'Aurora', 'Savannah',
];
    
const CUSTOMER_APPEARANCE = ['👩', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👱‍♀️', '🧕', '👩‍🦯', '👩‍🦼', '💃', '👸', '🤱', '🧔‍♀️'];

const COMMENTS_POSITIVE = [
    'خدمة ممتازة! ♥', 'أحسنتوا! 🌟', 'هجي تاني أكيد! 💪', 'أحلى بيوتي سنتر! 💄',
    'شغل نظيف وراقي ✨', 'الموظفين محترمين جداً 👏', 'الأسعار معقولة 💰',
    'المكان نظيف وراقي 🏆', 'أفضل تجربة! 😍', 'أنصح الكل يجي هنا 👍',
    'برافو عليكم! 🎉', 'الجودة عالية 🔥', 'هوصي صحابي يجوا 👯‍♀️',
    'التركيب مظبوط 💅', 'الريحة حلوة 🌸', 'ممكن حجز كمان؟ 😊',
];

const COMMENTS_NEGATIVE = [
    'السعر غالي 💸', 'الانتظار طويل ⏰', 'مش كويس 😤', 'عايزة استرجاع فلوس 💵',
    'الخدمة مش زي ما وعدتوا 😞', 'في تأخير كتير ⏱️', 'الموظفة مش كويسة 😒',
    'المحتاج تظبيط 😤', 'مفيش نظافة 😠', 'المكان زحم 🚶‍♀️',
];

const COMMENTS_FUNNY = [
    '👩‍🦰 عايزة أكون زي هيفا واهيبا!',
    '👰 عندي فرح بكرة جهزوني!',
    '💅 نفسي في manicure زي اللي في reels',
    '👩‍🎨 ماما بتقول روحي بسرعة',
    '😂 أول مرة أجى بيوتي سنتر',
    '📸 ممكن صورة قبل وبعد؟',
    '🛍️ بتجيبو منتجات من برا؟',
    '☕ فين الكافيه هنا؟',
    '💄 هو في خصومات؟',
    '🤔 إيه الفرق بين السنتين؟',
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }

function formatMoney(amount) {
    if (amount >= 1000) return (amount/1000).toFixed(1) + 'K ج.م';
    return amount.toFixed(0) + ' ج.م';
}

function getTimeString() {
    const h = game.hour;
    const m = game.minute < 10 ? '0' + game.minute : game.minute;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${m} ${period}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
function notify(text, type = 'info', duration = 3000) {
    game.notifications.push({
        text,
        type,
        duration,
        created: Date.now(),
        opacity: 1
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER GENERATION
// ═══════════════════════════════════════════════════════════════════════════
function generateCustomer() {
    const name = pick(CUSTOMER_NAMES_AR);
    const emoji = pick(CUSTOMER_APPEARANCE);
    const patience = rand(40, 100);
    const budget = rand(1, 5); // 1-5 stars
    const preferredService = pick(game.services.filter(s => {
        const room = game.rooms.find(r => r.id === s.room);
        return room && room.built;
    }));
    
    if (!preferredService) return null;
    
    return {
        id: Date.now() + Math.random(),
        name,
        emoji,
        patience,
        maxPatience: patience,
        budget,
        preferredService: preferredService.id,
        state: 'waiting', // waiting, in_service, done, angry, leaving
        waitTime: 0,
        x: rand(50, W() - 50),
        y: rand(H() * 0.2, H() * 0.6),
        targetX: 0,
        targetY: 0,
        speed: randFloat(0.5, 1.5),
        satisfaction: 50,
        tip: 0,
        comment: null,
        serviceProgress: 0,
        mouseX: 0,
        mouseY: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM BUILDING
// ═══════════════════════════════════════════════════════════════════════════
const ROOM_COSTS = {
    reception: 0,
    makeup: 0,
    hair: 0,
    nails: 3000,
    spa: 8000,
    skincare: 5000,
    massage: 6000,
    lounge: 2000,
    store: 4000,
    coffee: 3000,
    waxing: 2500,
    bridal: 15000,
};

const ROOM_UPGRADES = {
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

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOGIC UPDATE
// ═══════════════════════════════════════════════════════════════════════════
function updateGame(dt) {
    if (game.paused || game.screen !== 'game') return;
    
    // Time progression
    game.minute += game.speed * dt * 0.5; // 1 real second = 30 game minutes
    while (game.minute >= 60) {
        game.minute -= 60;
        game.hour++;
        hourlyUpdate();
    }
    while (game.hour >= 22) { // Close at 10 PM
        game.hour = 8;
        game.minute = 0;
        game.day++;
        dailyUpdate();
    }
    
    // Chance to spawn customer
    const spawnChance = clamp(game.reputation / 200, 0.02, 0.15);
    const roomBonus = game.rooms.filter(r => r.built).length * 0.005;
    const hourBonus = (game.hour >= 10 && game.hour <= 18) ? 0.05 : 0;
    
    if (Math.random() < spawnChance + roomBonus + hourBonus && game.customers.length < game.maxCustomers) {
        const customer = generateCustomer();
        if (customer) {
            game.customers.push(customer);
            if (Math.random() < 0.3) {
                notify(`👤 ${customer.name} دخلت السنتر`, 'info', 2000);
            }
        }
    }
    
    // Update customers
    for (let i = game.customers.length - 1; i >= 0; i--) {
        const c = game.customers[i];
        
        switch (c.state) {
            case 'waiting':
                c.waitTime += dt;
                c.patience -= dt * 0.3 * (1 + (100 - c.budget * 15) / 100);
                if (c.patience <= 0) {
                    c.state = 'angry';
                    c.comment = pick(COMMENTS_NEGATIVE);
                    game.dailyStats.complaints++;
                    game.reputation = clamp(game.reputation - 3, 0, 100);
                    notify(`😡 ${c.name} زعلت ومش راضية!`, 'danger', 3000);
                }
                // Move randomly while waiting
                c.x += randFloat(-0.5, 0.5);
                c.y += randFloat(-0.3, 0.3);
                c.x = clamp(c.x, 30, W() - 30);
                c.y = clamp(c.y, H() * 0.15, H() * 0.5);
                break;
                
            case 'in_service':
                c.serviceProgress += dt * 5;
                c.satisfaction = clamp(c.satisfaction + dt * 0.5, 0, 100);
                if (c.serviceProgress >= 100) {
                    c.state = 'done';
                    completeService(c, i);
                }
                break;
                
            case 'done':
                c.patience = clamp(c.patience + dt * 20, 0, 100);
                // Walking to exit
                c.y += c.speed * 2;
                if (c.y > H() + 50) {
                    // Customer left satisfied
                    game.customers.splice(i, 1);
                }
                break;
                
            case 'angry':
                c.x -= c.speed * 2;
                c.y += c.speed;
                if (c.x < -50 || c.y > H() + 50) {
                    game.customers.splice(i, 1);
                }
                break;
        }
    }
    
    // Update notifications
    for (let i = game.notifications.length - 1; i >= 0; i--) {
        const n = game.notifications[i];
        const age = Date.now() - n.created;
        if (age > n.duration) {
            n.opacity -= dt * 2;
            if (n.opacity <= 0) game.notifications.splice(i, 1);
        }
    }
    
    // XP & Level up
    game.xp += dt * 0.5;
    const xpNeeded = game.level * 100;
    if (game.xp >= xpNeeded) {
        game.xp -= xpNeeded;
        game.level++;
        game.maxCustomers++;
        notify(`🎉 لفت للمستوى ${game.level}!`, 'success', 4000);
    }
}

function completeService(customer, index) {
    const service = game.services.find(s => s.id === customer.preferredService);
    if (!service) return;
    
    const staffMember = game.staff.find(s => !s.busy);
    let quality = 50;
    if (staffMember) {
        quality = staffMember.skill + rand(-10, 10);
        staffMember.busy = true;
        setTimeout(() => { staffMember.busy = false; }, 2000);
    }
    
    const satisfaction = clamp(quality + rand(-20, 20), 0, 100);
    const price = service.price * (customer.budget / 3);
    const tip = satisfaction > 70 ? rand(20, 100) : 0;
    
    game.money += price + tip;
    game.dailyStats.revenue += price;
    game.dailyStats.tips += tip;
    game.dailyStats.customersServed++;
    game.reputation = clamp(game.reputation + (satisfaction > 60 ? 1 : -2), 0, 100);
    
    if (satisfaction > 70) {
        customer.comment = pick(COMMENTS_POSITIVE);
        game.satisfiedCustomers++;
    } else if (satisfaction < 40) {
        customer.comment = pick(COMMENTS_NEGATIVE);
        game.angryCustomers++;
    } else if (Math.random() < 0.3) {
        customer.comment = pick(COMMENTS_FUNNY);
    }
    
    notify(
        `${customer.emoji} ${customer.name} - ${service.name}: ${formatMoney(price)}${tip > 0 ? ' + بقشيش ' + formatMoney(tip) : ''}`,
        satisfaction > 60 ? 'success' : 'warning',
        3000
    );
}

function hourlyUpdate() {
    // Staff mood decreases over time
    game.staff.forEach(s => {
        s.mood = clamp(s.mood - rand(0, 2), 0, 100);
    });
    
    // Random events
    if (Math.random() < 0.1) {
        triggerRandomEvent();
    }
}

function dailyUpdate() {
    // Pay staff salaries
    const totalSalaries = game.staff.reduce((sum, s) => sum + s.salary / 30, 0);
    game.money -= totalSalaries;
    game.dailyStats.expenses = totalSalaries;
    
    // Restock products
    game.products.forEach(p => {
        if (p.cost > 0 && game.money > p.cost * 5) {
            const restock = Math.min(5, Math.floor(game.money / p.cost / 3));
            if (restock > 0) {
                p.stock += restock;
                game.money -= p.cost * restock;
            }
        }
    });
    
    // Daily summary
    const profit = game.dailyStats.revenue - game.dailyStats.expenses;
    notify(`📅 Day ${game.day} - الربح: ${formatMoney(profit)} | عملاء: ${game.dailyStats.customersServed}`, profit > 0 ? 'success' : 'warning', 5000);
    
    // Reset daily stats
    game.dailyStats = { customersServed: 0, revenue: 0, expenses: 0, tips: 0, complaints: 0 };
}

function triggerRandomEvent() {
    const events = [
        {
            text: '🌟 بنت مشهورة عايزة تحجز! هتدفع 3x السعر!',
            type: 'vip',
            effect: () => {
                const vip = generateCustomer();
                if (vip) {
                    vip.budget = 5;
                    vip.name = '⭐ ' + vip.name;
                    game.customers.push(vip);
                    notify('⭐ VIP دخلت السنتر!', 'success', 4000);
                }
            }
        },
        {
            text: '📰 صحفي عايز يعمل review للسنتر!',
            type: 'press',
            effect: () => {
                const score = clamp(game.reputation + rand(-10, 10), 0, 100);
                if (score > 60) {
                    game.reputation = clamp(game.reputation + 10, 0, 100);
                    notify('📰 Review إيجابي! السمعة زادت!', 'success', 4000);
                } else {
                    game.reputation = clamp(game.reputation - 5, 0, 100);
                    notify('📰 Review سلبي... السمعة نزلت', 'danger', 4000);
                }
            }
        },
        {
            text: '🔥 جهاز في السنتر اتكسر! صيانة بـ 500 ج.م',
            type: 'breakdown',
            effect: () => {
                if (game.money >= 500) {
                    game.money -= 500;
                    notify('🔧 تم الإصلاح!', 'warning', 3000);
                } else {
                    game.reputation = clamp(game.reputation - 5, 0, 100);
                    notify('😢 مفيش فلوس للإصلاح... السمعة نزلت', 'danger', 4000);
                }
            }
        },
        {
            text: '🎁 عرض خاص! النهاردة كل الخدمات بنص السعر!',
            type: 'sale',
            effect: () => {
                game.services.forEach(s => s.price = Math.floor(s.price * 0.5));
                notify('🎁 بدأ العرض الخاص!', 'success', 4000);
                setTimeout(() => {
                    game.services.forEach(s => s.price = Math.floor(s.price * 2));
                    notify('⏰ العرض خلص', 'info', 3000);
                }, 30000);
            }
        },
        {
            text: '💐 هدية من عميلة سعيدة! +200 ج.م',
            type: 'gift',
            effect: () => {
                game.money += 200;
                game.reputation = clamp(game.reputation + 3, 0, 100);
                notify('💐 شكراً يا أحلى عميلة!', 'success', 3000);
            }
        },
        {
            text: '🐭 فأر في السنتر! لازم نتصرف بسرعة!',
            type: 'mouse',
            effect: () => {
                if (Math.random() < 0.5) {
                    game.reputation = clamp(game.reputation - 8, 0, 100);
                    notify('😱 العملاء شافوا الفأر!', 'danger', 4000);
                } else {
                    notify('✅ مسكناه قبل ما حد يشوفه', 'success', 3000);
                }
            }
        },
    ];
    
    const event = pick(events);
    notify(event.text, event.type === 'vip' || event.type === 'gift' || event.type === 'sale' ? 'success' : 'warning', 5000);
    event.effect();
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════
function render() {
    ctx.clearRect(0, 0, W(), H());
    
    switch (game.screen) {
        case 'menu': renderMenu(); break;
        case 'game': renderGame(); break;
        case 'shop': renderShop(); break;
        case 'staff': renderStaff(); break;
        case 'finance': renderFinance(); break;
        case 'settings': renderSettings(); break;
    }
}

// ─── MENU SCREEN ───
function renderMenu() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());
    
    // Floating particles
    for (let i = 0; i < 30; i++) {
        const x = (Date.now() * 0.01 + i * 137) % W();
        const y = (Date.now() * 0.005 + i * 97) % H();
        const size = 2 + Math.sin(Date.now() * 0.001 + i) * 1;
        ctx.fillStyle = `rgba(233, 30, 99, ${0.1 + Math.sin(Date.now() * 0.002 + i) * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Title
    const titleY = H() * 0.25;
    ctx.save();
    ctx.textAlign = 'center';
    
    // Title shadow
    ctx.font = `bold ${Math.min(W() * 0.08, 72)}px Cairo`;
    ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
    ctx.fillText('💄 سنتر الغرام', W()/2 + 3, titleY + 3);
    
    // Title
    const titleGrad = ctx.createLinearGradient(W() * 0.2, titleY - 50, W() * 0.8, titleY + 20);
    titleGrad.addColorStop(0, '#E91E63');
    titleGrad.addColorStop(0.5, '#FF6090');
    titleGrad.addColorStop(1, '#9C27B0');
    ctx.fillStyle = titleGrad;
    ctx.fillText('💄 سنتر الغرام', W()/2, titleY);
    
    // Subtitle
    ctx.font = `${Math.min(W() * 0.025, 24)}px Cairo`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('لعبة محاكاة إدارة البيوتي سنتر', W()/2, titleY + 50);
    
    ctx.restore();
    
    // Menu buttons
    const btnW = Math.min(300, W() * 0.4);
    const btnH = 56;
    const btnGap = 16;
    const startY = H() * 0.45;
    const buttons = [
        { label: '🎮 ابدأ اللعب', action: () => { game.screen = 'game'; game.hour = 8; game.minute = 0; } },
        { label: '🏪 المتجر', action: () => { game.screen = 'shop'; } },
        { label: '👥 الموظفين', action: () => { game.screen = 'staff'; } },
        { label: '💰 المالية', action: () => { game.screen = 'finance'; } },
        { label: '⚙️ الإعدادات', action: () => { game.screen = 'settings'; } },
    ];
    
    buttons.forEach((btn, i) => {
        const x = W()/2 - btnW/2;
        const y = startY + i * (btnH + btnGap);
        
        // Button bg
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeStyle = 'rgba(233, 30, 99, 0.5)';
        ctx.lineWidth = 2;
        roundRect(x, y, btnW, btnH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Button text
        ctx.font = `bold ${Math.min(20, W() * 0.025)}px Cairo`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, W()/2, y + btnH/2);
    });
    
    // Version
    ctx.font = '14px Cairo';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('v1.0 - Made with ❤️ by Owl & Hassan', W()/2, H() - 30);
}

// ─── GAME SCREEN ───
function renderGame() {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());
    
    // Floor pattern
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < W(); x += 40) {
        for (let y = H() * 0.15; y < H(); y += 40) {
            if ((x/40 + y/40) % 2 === 0) {
                ctx.fillRect(x, y, 40, 40);
            }
        }
    }
    
    // Render rooms
    renderRooms();
    
    // Render customers
    renderCustomers();
    
    // HUD
    renderHUD();
    
    // Notifications
    renderNotifications();
}

function renderRooms() {
    const roomStartX = W() * 0.05;
    const roomStartY = H() * 0.18;
    const roomW = W() * 0.18;
    const roomH = H() * 0.12;
    const gapX = W() * 0.02;
    const gapY = H() * 0.02;
    
    game.rooms.forEach((room, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = roomStartX + col * (roomW + gapX);
        const y = roomStartY + row * (roomH + gapY);
        
        if (room.built) {
            // Built room
            const roomGrad = ctx.createLinearGradient(x, y, x, y + roomH);
            roomGrad.addColorStop(0, 'rgba(233, 30, 99, 0.15)');
            roomGrad.addColorStop(1, 'rgba(156, 39, 176, 0.1)');
            ctx.fillStyle = roomGrad;
            roundRect(x, y, roomW, roomH, 8);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(233, 30, 99, 0.4)';
            ctx.lineWidth = 1;
            roundRect(x, y, roomW, roomH, 8);
            ctx.stroke();
            
            // Room emoji
            ctx.font = `${roomH * 0.35}px Cairo`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(room.emoji, x + roomW/2, y + roomH * 0.35);
            
            // Room name
            ctx.font = `bold ${Math.min(12, roomW * 0.07)}px Cairo`;
            ctx.fillStyle = '#fff';
            ctx.fillText(room.name, x + roomW/2, y + roomH * 0.7);
        } else {
            // Unbuilt room (locked)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            roundRect(x, y, roomW, roomH, 8);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            roundRect(x, y, roomW, roomH, 8);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Lock icon
            ctx.font = `${roomH * 0.3}px Cairo`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillText('🔒', x + roomW/2, y + roomH * 0.35);
            
            // Cost
            const cost = ROOM_COSTS[room.id] || 3000;
            ctx.font = `bold ${Math.min(11, roomW * 0.06)}px Cairo`;
            ctx.fillStyle = 'rgba(255,215,0,0.5)';
            ctx.fillText(formatMoney(cost), x + roomW/2, y + roomH * 0.7);
        }
    });
}

function renderCustomers() {
    game.customers.forEach(c => {
        // Customer body
        ctx.font = '32px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.emoji, c.x, c.y);
        
        // Name tag
        ctx.font = '11px Cairo';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(c.name, c.x, c.y - 25);
        
        // Patience bar
        if (c.state === 'waiting') {
            const barW = 30;
            const barH = 4;
            const barX = c.x - barW/2;
            const barY = c.y - 18;
            const pct = c.patience / c.maxPatience;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            
            ctx.fillStyle = pct > 0.5 ? COLORS.green : pct > 0.25 ? COLORS.orange : COLORS.red;
            ctx.fillRect(barX, barY, barW * pct, barH);
        }
        
        // Service progress
        if (c.state === 'in_service') {
            const barW = 30;
            const barH = 4;
            const barX = c.x - barW/2;
            const barY = c.y - 18;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            
            ctx.fillStyle = COLORS.blue;
            ctx.fillRect(barX, barY, barW * (c.serviceProgress / 100), barH);
        }
        
        // Speech bubble for comments
        if (c.comment) {
            ctx.font = '12px Cairo';
            const textW = ctx.measureText(c.comment).width + 16;
            const bubbleX = c.x - textW/2;
            const bubbleY = c.y - 50;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            roundRect(bubbleX, bubbleY, textW, 22, 6);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillText(c.comment, c.x, bubbleY + 11);
        }
    });
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W(), 50);
    
    ctx.font = 'bold 16px Cairo';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Money
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`💰 ${formatMoney(game.money)}`, W() - 15, 25);
    
    // Reputation
    ctx.textAlign = 'center';
    ctx.fillStyle = game.reputation > 60 ? COLORS.green : game.reputation > 30 ? COLORS.orange : COLORS.red;
    ctx.fillText(`⭐ ${game.reputation}%`, W()/2, 25);
    
    // Time & Day
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(`📅 يوم ${game.day} | ⏰ ${getTimeString()}`, 15, 25);
    
    // Level
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.secondary;
    ctx.fillText(`🏆 مستوى ${game.level}`, W()/2, 45);
    
    // XP bar
    const xpBarW = 100;
    const xpBarH = 4;
    const xpBarX = W()/2 - xpBarW/2;
    const xpBarY = 42;
    const xpPct = game.xp / (game.level * 100);
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(xpBarX, xpBarY, xpBarW, xpBarH);
    ctx.fillStyle = COLORS.secondary;
    ctx.fillRect(xpBarX, xpBarY, xpBarW * xpPct, xpBarH);
    
    // Bottom navigation
    const navH = 50;
    const navY = H() - navH;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, navY, W(), navH);
    
    const navItems = [
        { label: '🏠 الرئيسية', screen: 'game' },
        { label: '🏪 المتجر', screen: 'shop' },
        { label: '👥 الموظفين', screen: 'staff' },
        { label: '💰 المالية', screen: 'finance' },
        { label: '📋 القائمة', screen: 'menu' },
    ];
    
    const navBtnW = W() / navItems.length;
    navItems.forEach((item, i) => {
        const x = i * navBtnW;
        const isActive = game.screen === item.screen;
        
        if (isActive) {
            ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
            ctx.fillRect(x, navY, navBtnW, navH);
        }
        
        ctx.font = `${Math.min(20, navBtnW * 0.15)}px Cairo`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.fillText(item.label, x + navBtnW/2, navY + navH/2);
    });
    
    // Customer count
    ctx.font = '12px Cairo';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`👥 عملاء: ${game.customers.length}/${game.maxCustomers}`, W() - 15, navY - 10);
}

function renderNotifications() {
    const notifW = Math.min(350, W() * 0.6);
    const notifH = 40;
    const startY = 60;
    
    game.notifications.forEach((n, i) => {
        const x = W()/2 - notifW/2;
        const y = startY + i * (notifH + 8);
        
        ctx.globalAlpha = n.opacity;
        
        // Background
        let bgColor = 'rgba(0,0,0,0.8)';
        if (n.type === 'success') bgColor = 'rgba(76, 175, 80, 0.3)';
        if (n.type === 'danger') bgColor = 'rgba(244, 67, 54, 0.3)';
        if (n.type === 'warning') bgColor = 'rgba(255, 152, 0, 0.3)';
        
        ctx.fillStyle = bgColor;
        roundRect(x, y, notifW, notifH, 8);
        ctx.fill();
        
        ctx.strokeStyle = n.type === 'success' ? COLORS.green : n.type === 'danger' ? COLORS.red : n.type === 'warning' ? COLORS.orange : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        roundRect(x, y, notifW, notifH, 8);
        ctx.stroke();
        
        // Text
        ctx.font = '13px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(n.text, W()/2, y + notifH/2);
        
        ctx.globalAlpha = 1;
    });
}

// ─── SHOP SCREEN ───
function renderShop() {
    renderPanelBackground('🏪 المتجر - شراء المنتجات وإدارة المخزون');
    
    const cols = Math.min(5, Math.floor((W() - 60) / 140));
    const cardW = Math.min(130, (W() - 60) / cols - 10);
    const cardH = 140;
    const startX = 30;
    const startY = 100;
    
    game.products.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardW + 10);
        const y = startY + row * (cardH + 10);
        
        // Card
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        roundRect(x, y, cardW, cardH, 10);
        ctx.stroke();
        
        // Emoji
        ctx.font = '28px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, x + cardW/2, y + 30);
        
        // Name
        ctx.font = 'bold 12px Cairo';
        ctx.fillStyle = '#fff';
        ctx.fillText(p.name, x + cardW/2, y + 55);
        
        // Price
        ctx.font = '11px Cairo';
        ctx.fillStyle = COLORS.gold;
        ctx.fillText(`بيع: ${formatMoney(p.price)}`, x + cardW/2, y + 72);
        
        // Stock
        ctx.fillStyle = p.stock > 5 ? COLORS.green : p.stock > 0 ? COLORS.orange : COLORS.red;
        ctx.fillText(`المخزون: ${p.stock}`, x + cardW/2, y + 88);
        
        // Sold
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(`بيع: ${p.sold}`, x + cardW/2, y + 103);
        
        // Buy button
        const canBuy = game.money >= p.cost;
        ctx.fillStyle = canBuy ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.05)';
        roundRect(x + 10, y + 110, cardW - 20, 22, 6);
        ctx.fill();
        
        ctx.font = 'bold 10px Cairo';
        ctx.fillStyle = canBuy ? COLORS.green : 'rgba(255,255,255,0.3)';
        ctx.fillText(`شراء +5 (${formatMoney(p.cost * 5)})`, x + cardW/2, y + 121);
    });
    
    // Back button
    renderBackButton();
}

// ─── STAFF SCREEN ───
function renderStaff() {
    renderPanelBackground('👥 إدارة الموظفين');
    
    // Current staff
    ctx.font = 'bold 18px Cairo';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText('الموظفين الحاليين:', W() - 30, 100);
    
    game.staff.forEach((s, i) => {
        const x = 30;
        const y = 120 + i * 70;
        const cardW = W() - 60;
        
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x, y, cardW, 60, 10);
        ctx.fill();
        
        // Avatar
        ctx.font = '28px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(s.emoji, x + 35, y + 30);
        
        // Info
        ctx.textAlign = 'right';
        ctx.font = 'bold 14px Cairo';
        ctx.fillStyle = '#fff';
        ctx.fillText(s.name, x + 70, y + 22);
        
        ctx.font = '12px Cairo';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(s.role, x + 70, y + 40);
        
        // Skill bar
        const skillBarW = 100;
        const skillBarX = x + cardW - skillBarW - 20;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(skillBarX, y + 15, skillBarW, 8);
        ctx.fillStyle = s.skill > 70 ? COLORS.green : s.skill > 50 ? COLORS.orange : COLORS.red;
        ctx.fillRect(skillBarX, y + 15, skillBarW * (s.skill / 100), 8);
        
        ctx.font = '10px Cairo';
        ctx.fillStyle = COLORS.textDim;
        ctx.textAlign = 'left';
        ctx.fillText(`مهارة: ${s.skill}%`, skillBarX, y + 35);
        
        // Mood
        ctx.textAlign = 'right';
        ctx.fillStyle = s.mood > 60 ? COLORS.green : s.mood > 30 ? COLORS.orange : COLORS.red;
        ctx.fillText(`مزاج: ${s.mood}% | راتب: ${formatMoney(s.salary)}/شهر`, x + cardW - 20, y + 45);
    });
    
    // Hiring pool
    const hireY = 120 + game.staff.length * 70 + 30;
    ctx.font = 'bold 18px Cairo';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText('متاحين للتوظيف:', W() - 30, hireY);
    
    game.hiringPool.forEach((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardW = (W() - 70) / 2;
        const x = 30 + col * (cardW + 10);
        const y = hireY + 20 + row * 65;
        
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x, y, cardW, 55, 8);
        ctx.fill();
        
        ctx.font = '22px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(s.emoji, x + 25, y + 28);
        
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px Cairo';
        ctx.fillStyle = '#fff';
        ctx.fillText(s.name, x + 50, y + 20);
        
        ctx.font = '10px Cairo';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(`${s.role} | مهارة: ${s.skill}% | راتب: ${formatMoney(s.salary)}`, x + 50, y + 38);
        
        // Hire button
        const hireCost = s.salary * 2;
        const canHire = game.money >= hireCost;
        ctx.fillStyle = canHire ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.05)';
        roundRect(x + cardW - 80, y + 15, 70, 25, 6);
        ctx.fill();
        
        ctx.font = 'bold 10px Cairo';
        ctx.fillStyle = canHire ? COLORS.green : 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText(`توظيف`, x + cardW - 45, y + 28);
        ctx.font = '8px Cairo';
        ctx.fillText(formatMoney(hireCost), x + cardW - 45, y + 38);
    });
    
    renderBackButton();
}

// ─── FINANCE SCREEN ───
function renderFinance() {
    renderPanelBackground('💰 المالية والتقارير');
    
    const centerX = W()/2;
    const startY = 100;
    
    // Stats cards
    const stats = [
        { label: 'الرصيد الحالي', value: formatMoney(game.money), icon: '💰', color: COLORS.gold },
        { label: 'السمعة', value: `${game.reputation}%`, icon: '⭐', color: game.reputation > 60 ? COLORS.green : COLORS.orange },
        { label: 'المستوى', value: `${game.level}`, icon: '🏆', color: COLORS.secondary },
        { label: 'اليوم', value: `${game.day}`, icon: '📅', color: COLORS.blue },
        { label: 'عملاء اليوم', value: `${game.dailyStats.customersServed}`, icon: '👥', color: COLORS.green },
        { label: 'إيرادات اليوم', value: formatMoney(game.dailyStats.revenue), icon: '📈', color: COLORS.green },
        { label: 'شكاوى', value: `${game.dailyStats.complaints}`, icon: '😡', color: COLORS.red },
        { label: 'بقشيش', value: formatMoney(game.dailyStats.tips), icon: '💵', color: COLORS.gold },
    ];
    
    const cardW = (W() - 80) / 4;
    const cardH = 80;
    
    stats.forEach((stat, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 30 + col * (cardW + 5);
        const y = startY + row * (cardH + 10);
        
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        
        ctx.font = '24px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(stat.icon, x + cardW/2, y + 30);
        
        ctx.font = 'bold 14px Cairo';
        ctx.fillStyle = stat.color;
        ctx.fillText(stat.value, x + cardW/2, y + 52);
        
        ctx.font = '10px Cairo';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(stat.label, x + cardW/2, y + 68);
    });
    
    // Services revenue breakdown
    const svcY = startY + 190;
    ctx.font = 'bold 16px Cairo';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText('الخدمات المتاحة:', W() - 30, svcY);
    
    const builtServices = game.services.filter(s => {
        const room = game.rooms.find(r => r.id === s.room);
        return room && room.built;
    });
    
    builtServices.forEach((s, i) => {
        const x = 30;
        const y = svcY + 20 + i * 28;
        
        ctx.font = '12px Cairo';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${s.emoji} ${s.name}`, x + 200, y + 12);
        
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = 'left';
        ctx.fillText(formatMoney(s.price), x + 210, y + 12);
        
        // Popularity bar
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 300, y + 5, 80, 8);
        ctx.fillStyle = COLORS.primary;
        ctx.fillRect(x + 300, y + 5, 80 * (s.popularity / 100), 8);
        
        ctx.font = '9px Cairo';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(`شعبية: ${s.popularity}%`, x + 390, y + 12);
    });
    
    renderBackButton();
}

// ─── SETTINGS SCREEN ───
function renderSettings() {
    renderPanelBackground('⚙️ الإعدادات');
    
    const centerX = W()/2;
    const startY = 120;
    
    // Settings options
    const settings = [
        { label: '🔊 الصوت', value: 'مفعل', toggle: true },
        { label: '🎵 الموسيقى', value: 'مفعل', toggle: true },
        { label: '🌐 اللغة', value: 'العربية', toggle: false },
        { label: '⏱️ سرعة اللعب', value: `${game.speed}x`, toggle: false },
        { label: '📊 إحصائيات مفصلة', value: 'معطل', toggle: true },
    ];
    
    settings.forEach((s, i) => {
        const x = centerX - 150;
        const y = startY + i * 55;
        
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x, y, 300, 45, 10);
        ctx.fill();
        
        ctx.font = '14px Cairo';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(s.label, x + 280, y + 22);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(s.value, x + 20, y + 22);
    });
    
    // Center name edit
    const nameY = startY + settings.length * 55 + 30;
    ctx.font = 'bold 16px Cairo';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`اسم السنتر: ${game.centerName}`, centerX, nameY);
    
    // Reset button
    const resetY = nameY + 50;
    ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
    roundRect(centerX - 100, resetY, 200, 40, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 1;
    roundRect(centerX - 100, resetY, 200, 40, 10);
    ctx.stroke();
    
    ctx.font = 'bold 14px Cairo';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.red;
    ctx.fillText('🗑️ إعادة تعيين اللعبة', centerX, resetY + 20);
    
    renderBackButton();
}

// ─── SHARED RENDER HELPERS ───
function renderPanelBackground(title) {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());
    
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W(), 50);
    
    ctx.font = 'bold 20px Cairo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(title, W()/2, 25);
}

function renderBackButton() {
    const btnW = 100;
    const btnH = 36;
    const x = 15;
    const y = H() - 50;
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(x, y, btnW, btnH, 8);
    ctx.fill();
    
    ctx.font = 'bold 14px Cairo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('← رجوع', x + btnW/2, y + btnH/2);
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════
let mouseX = 0, mouseY = 0;
let mouseDown = false;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => { mouseDown = true; });
canvas.addEventListener('mouseup', () => { mouseDown = false; handleClick(mouseX, mouseY); });
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
    handleClick(mouseX, mouseY);
}, { passive: false });

function handleClick(x, y) {
    // Bottom navigation (always active in game screens)
    if (game.screen !== 'menu' && game.screen !== 'settings') {
        const navH = 50;
        const navY = H() - navH;
        if (y > navY) {
            const navBtnW = W() / 5;
            const idx = Math.floor(x / navBtnW);
            const screens = ['game', 'shop', 'staff', 'finance', 'menu'];
            if (screens[idx]) game.screen = screens[idx];
            return;
        }
    }
    
    // Back button (in sub-screens)
    if (game.screen === 'shop' || game.screen === 'staff' || game.screen === 'finance') {
        if (x > 15 && x < 115 && y > H() - 50 && y < H() - 14) {
            game.screen = 'game';
            return;
        }
    }
    
    // Settings back
    if (game.screen === 'settings') {
        if (x > 15 && x < 115 && y > H() - 50 && y < H() - 14) {
            game.screen = 'menu';
            return;
        }
    }
    
    // Menu buttons
    if (game.screen === 'menu') {
        const btnW = Math.min(300, W() * 0.4);
        const btnH = 56;
        const btnGap = 16;
        const startY = H() * 0.45;
        const buttons = [
            () => { game.screen = 'game'; game.hour = 8; game.minute = 0; },
            () => { game.screen = 'shop'; },
            () => { game.screen = 'staff'; },
            () => { game.screen = 'finance'; },
            () => { game.screen = 'settings'; },
        ];
        
        buttons.forEach((action, i) => {
            const bx = W()/2 - btnW/2;
            const by = startY + i * (btnH + btnGap);
            if (x > bx && x < bx + btnW && y > by && y < by + btnH) {
                action();
            }
        });
    }
    
    // Game screen - room clicking
    if (game.screen === 'game') {
        const roomStartX = W() * 0.05;
        const roomStartY = H() * 0.18;
        const roomW = W() * 0.18;
        const roomH = H() * 0.12;
        const gapX = W() * 0.02;
        const gapY = H() * 0.02;
        
        game.rooms.forEach((room, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const rx = roomStartX + col * (roomW + gapX);
            const ry = roomStartY + row * (roomH + gapY);
            
            if (x > rx && x < rx + roomW && y > ry && y < ry + roomH) {
                if (!room.built) {
                    const cost = ROOM_COSTS[room.id] || 3000;
                    if (game.money >= cost) {
                        game.money -= cost;
                        room.built = true;
                        notify(`✅ تم بناء ${room.name}!`, 'success', 3000);
                    } else {
                        notify(`❌ محتاج ${formatMoney(cost - game.money)} زيادة!`, 'danger', 3000);
                    }
                } else {
                    // Room interaction
                    const upgrade = ROOM_UPGRADES[room.id];
                    if (upgrade && game.money >= upgrade.cost) {
                        game.money -= upgrade.cost;
                        game.reputation = clamp(game.reputation + 5, 0, 100);
                        notify(`⬆️ تم ترقية ${room.name}!`, 'success', 3000);
                    }
                }
            }
        });
        
        // Customer clicking - assign to service
        game.customers.forEach((c, i) => {
            if (dist(x, y, c.x, c.y) < 25 && c.state === 'waiting') {
                c.state = 'in_service';
                c.serviceProgress = 0;
                c.x = W()/2 + rand(-50, 50);
                c.y = H() * 0.55;
                notify(`🎯 ${c.name} بدأت الخدمة!`, 'info', 2000);
            }
        });
    }
    
    // Shop - buy products
    if (game.screen === 'shop') {
        const cols = Math.min(5, Math.floor((W() - 60) / 140));
        const cardW = Math.min(130, (W() - 60) / cols - 10);
        const cardH = 140;
        const startX = 30;
        const startY = 100;
        
        game.products.forEach((p, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + 10);
            const cy = startY + row * (cardH + 10);
            
            // Buy button area
            if (x > cx + 10 && x < cx + cardW - 10 && y > cy + 110 && y < cy + 132) {
                const cost = p.cost * 5;
                if (game.money >= cost) {
                    game.money -= cost;
                    p.stock += 5;
                    notify(`🛒 تم شراء 5 ${p.name}!`, 'success', 2000);
                } else {
                    notify('❌ فلوس مش كفاية!', 'danger', 2000);
                }
            }
        });
    }
    
    // Staff - hire
    if (game.screen === 'staff') {
        const hireY = 120 + game.staff.length * 70 + 50;
        
        game.hiringPool.forEach((s, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cardW = (W() - 70) / 2;
            const x = 30 + col * (cardW + 10);
            const y = hireY + row * 65;
            
            // Hire button
            if (x + cardW - 80 < mouseX && mouseX < x + cardW - 10 && y + 15 < mouseY && mouseY < y + 40) {
                const hireCost = s.salary * 2;
                if (game.money >= hireCost && game.staff.length < 8) {
                    game.money -= hireCost;
                    game.staff.push({
                        id: Date.now(),
                        name: s.name,
                        role: s.role,
                        skill: s.skill,
                        salary: s.salary,
                        mood: 80,
                        emoji: s.emoji,
                        busy: false,
                    });
                    game.hiringPool.splice(i, 1);
                    notify(`🎉 تم توظيف ${s.name}!`, 'success', 3000);
                } else if (game.staff.length >= 8) {
                    notify('❌ الحد الأقصى للموظفين!', 'danger', 2000);
                } else {
                    notify('❌ فلوس مش كفاية!', 'danger', 2000);
                }
            }
        });
    }
    
    // Settings - reset
    if (game.screen === 'settings') {
        const centerX = W()/2;
        const resetY = 120 + 5 * 55 + 80;
        if (x > centerX - 100 && x < centerX + 100 && y > resetY && y < resetY + 40) {
            if (confirm('⚠️ متأكد؟ هترجع اللعبة من الأول!')) {
                location.reload();
            }
        }
    }
}

// Keyboard
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (game.screen === 'game') game.screen = 'menu';
        else if (game.screen !== 'menu') game.screen = 'game';
    }
    if (e.key === ' ') {
        e.preventDefault();
        game.paused = !game.paused;
    }
    if (e.key === '1') game.speed = 1;
    if (e.key === '2') game.speed = 2;
    if (e.key === '3') game.speed = 3;
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    updateGame(dt);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Rounded Rectangle
// ═══════════════════════════════════════════════════════════════════════════
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
