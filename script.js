// IBONARIUM AGRO CHIKULAY - Core Script
// Initialize locale
if (window.moment) {
    moment.locale('uk');
}

const CATEGORY_NAMES_UA = {
    agro_ua: 'Агро Україна',
    world_agro: 'Світ Агро',
    tech_agro: 'Техніка',
    innov_agro: 'Новинки'
};

const DATA_SOURCES = {
    agro_ua: [
        'https://agroportal.ua/rss/news/',
        'https://kurkul.com/rss',
        'https://latifundist.com/rss',
        'https://agrotimes.ua/rss/'
    ],
    world_agro: [
        'https://www.world-grain.com/rss/articles',
        'https://www.agprofessional.com/rss',
        'https://www.agriculture.com/rss/news'
    ],
    tech_agro: [
        'https://traktorist.ua/rss',
        'https://itc.ua/tag/agro/feed/',
        'https://latifundist.com/tag/tehnika/rss'
    ],
    innov_agro: [
        'https://agroportal.ua/rss/technologies/',
        'https://kurkul.com/category/technics/rss',
        'https://agropravda.com/rss'
    ]
};

const UPDATE_INTERVAL = 60000; // 1 minute
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
const TRANSLATE_API = 'https://api.mymemory.translated.net/get?q=';

async function translateText(text) {
    if (!text || /[а-яіїєґ]/i.test(text)) return text; // Skip if already looks like Cyrillic
    try {
        const res = await fetch(`${TRANSLATE_API}${encodeURIComponent(text)}&langpair=en|uk`);
        const data = await res.json();
        return data.responseData.translatedText || text;
    } catch (e) {
        return text;
    }
}

// State
let appState = {
    news: {
        agro_ua: [],
        world_agro: [],
        tech_agro: [],
        innov_agro: []
    },
    images: {
        agro_ua: null,
        world_agro: null,
        tech_agro: null,
        innov_agro: null
    }
};

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initStarfield();
    fetchAllData();
    setInterval(fetchAllData, UPDATE_INTERVAL);
    initTimerVisual();
});

function initClock() {
    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('date-display');

    function update() {
        const now = moment();
        if (clockEl) clockEl.innerText = now.format('HH:mm:ss');
        if (dateEl) dateEl.innerText = now.format('dddd, D MMMM YYYY');
    }
    update();
    setInterval(update, 1000);
}

function initTimerVisual() {
    let seconds = 60;
    const el = document.getElementById('timer-world');
    if (el) {
        setInterval(() => {
            seconds--;
            if (seconds < 0) seconds = 60;
            el.innerText = seconds;
        }, 1000);
    }
}

function logSystem(msg) {
    const logEl = document.getElementById('system-log');
    if (!logEl) return;
    const time = moment().format('HH:mm:ss');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
    logEl.prepend(entry);

    if (logEl.children.length > 50) {
        logEl.removeChild(logEl.lastChild);
    }
}

// --- DATA FETCHING ---

async function fetchAllData() {
    logSystem('Оновлення агро-панелі...');
    const categories = ['agro_ua', 'world_agro', 'tech_agro', 'innov_agro'];

    categories.forEach((cat, index) => {
        setTimeout(() => fetchCategory(cat, `${cat.replace('_', '-')}-stream`), index * 1500);
    });
}

const SIMULATED_NEWS = {
    agro_ua: [
        { title: "Рекордний врожай пшениці очікується на півдні України", link: "#", pubDate: new Date(), image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80", description: "Погодні умови сприяють рекордному збору зернових. Аграрії застосовують нові методи зрошення." },
        { title: "Державна підтримка фермерів: нові гранти 2026", link: "#", pubDate: new Date(), description: "Уряд оголосив про запуск програми пільгового кредитування для малих господарств." }
    ],
    world_agro: [
        { title: "Ціни на кукурудзу на Чиказькій біржі стабілізувалися", link: "#", pubDate: new Date(), image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80", description: "Глобальний ринок реагує на звіти про запаси в США та Латинській Америці." }
    ],
    tech_agro: [
        { title: "John Deere представив повністю автономний трактор", link: "#", pubDate: new Date(), image: "https://images.unsplash.com/photo-1594132174009-5c023de3a073?auto=format&fit=crop&w=600&q=80", description: "Нова модель працює без водія, використовуючи ШІ та 360-градусні камери для безпеки." }
    ],
    innov_agro: [
        { title: "Вертикальні ферми майбутнього: прорив у врожайності", link: "#", pubDate: new Date(), image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80", description: "Сінгапурські вчені розробили нову систему LED-освітлення, що прискорює ріст овочів." }
    ]
};

async function fetchCategory(category, elementId) {
    const urls = DATA_SOURCES[category];
    const url = urls[Math.floor(Math.random() * urls.length)];
    const fetchUrl = `${RSS2JSON_API}${encodeURIComponent(url)}`;

    try {
        const catName = CATEGORY_NAMES_UA[category] || category;
        logSystem(`Моніторинг: ${catName}...`);

        const response = await fetch(fetchUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            // Translate items if needed
            const translatedItems = await Promise.all(data.items.slice(0, 10).map(async item => {
                const translatedTitle = await translateText(item.title);
                const translatedDesc = await translateText(item.description || '');
                return { ...item, title: translatedTitle, description: translatedDesc };
            }));

            appState.news[category] = translatedItems;
            logSystem(`OK: ${catName} (${translatedItems.length} новин)`);

            const item = translatedItems[0];
            let imgUrl = null;
            if (item.enclosure && item.enclosure.link) imgUrl = item.enclosure.link;
            else if (item.thumbnail) imgUrl = item.thumbnail;
            if (imgUrl) appState.images[category] = imgUrl;

        } else {
            throw new Error('No items');
        }
    } catch (e) {
        const catName = CATEGORY_NAMES_UA[category] || category;
        logSystem(`Резерв для ${catName}.`);
        if (!appState.news[category] || appState.news[category].length === 0) {
            appState.news[category] = SIMULATED_NEWS[category] || [];
        }
    }

    renderNews(category, elementId);
    analyzeSentiment();
}

function renderNews(category, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = '';
    const items = appState.news[category] ? appState.news[category].slice(0, 30) : [];

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'news-item';

        const date = moment(item.pubDate).fromNow();
        let snippet = item.description || '';
        snippet = snippet.replace(/<[^>]*>?/gm, '').substring(0, 180) + '...';

        el.innerHTML = `
            <div class="news-meta">
                <span class="highlight">${CATEGORY_NAMES_UA[category]}</span> // ${date}
            </div>
            <div class="news-title"><a href="${item.link}" target="_blank" style="color:inherit;text-decoration:none;">${item.title}</a></div>
            <div class="news-summary">${snippet}</div>
        `;
        container.appendChild(el);
    });

    const visualContainer = document.getElementById(`${elementId.replace('-stream', '')}-visual`);
    if (visualContainer) {
        let imgUrl = appState.images[category] || (SIMULATED_NEWS[category] && SIMULATED_NEWS[category][0].image);
        if (imgUrl) visualContainer.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">`;
    }

    updateHotStream();
}

function updateHotStream() {
    const container = document.getElementById('main-hot-stream');
    if (!container) return;

    let allNews = [];
    Object.keys(appState.news).forEach(cat => {
        appState.news[cat].forEach(item => allNews.push({ ...item, category: cat }));
    });

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    container.innerHTML = '';
    allNews.slice(0, 40).forEach(item => {
        const el = document.createElement('div');
        el.className = 'hot-item';
        const time = moment(item.pubDate).format('HH:mm');

        el.innerHTML = `
            <div class="hot-item-time">${time} // ${CATEGORY_NAMES_UA[item.category]}</div>
            <div class="hot-item-title"><a href="${item.link}" target="_blank" style="color:inherit;text-decoration:none;">${item.title}</a></div>
        `;
        container.appendChild(el);
    });

    updateTicker();
}

function updateTicker() {
    const ticker = document.getElementById('news-ticker');
    if (!ticker) return;
    let allTitles = [];
    Object.keys(appState.news).forEach(cat => appState.news[cat].forEach(item => allTitles.push(item.title)));

    if (allTitles.length === 0) return;
    const items = allTitles.sort(() => 0.5 - Math.random()).slice(0, 15);
    ticker.innerHTML = items.map(t => `<span class="ticker-item">+++ ${t} +++</span>`).join('');
}

// --- ANALYTICS ---

let sentimentChart = null;

function analyzeSentiment() {
    let text = "";
    Object.keys(appState.news).forEach(cat => {
        appState.news[cat].forEach(item => text += " " + item.title + " " + (item.description || ""));
    });

    if (!text) return;

    const positiveWords = ['врожай', 'успіх', 'зростання', 'інновації', 'прибуток', 'підтримка', 'експорт', 'стабільність', 'прорив', 'розвиток'];
    const negativeWords = ['посуха', 'криза', 'збитки', 'шкідники', 'падіння', 'дефіцит', 'проблема', 'ризик', 'війна', 'неврожай'];

    let pos = 0, neg = 0;
    const words = text.toLowerCase().match(/[а-яіїєґa-z]+/gu) || [];
    words.forEach(w => {
        if (positiveWords.includes(w)) pos++;
        if (negativeWords.includes(w)) neg++;
    });

    const total = pos + neg || 1;
    const posP = Math.round((pos / total) * 100);
    const negP = Math.round((neg / total) * 100);

    const posEl = document.getElementById('stat-pos');
    const negEl = document.getElementById('stat-neg');
    if (posEl) posEl.innerText = posP + '%';
    if (negEl) negEl.innerText = negP + '%';

    updateChart(pos || 1, neg || 1);
}

function updateChart(pos, neg) {
    const canvas = document.getElementById('sentimentChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (sentimentChart) {
        sentimentChart.data.datasets[0].data = [pos, neg];
        sentimentChart.update();
    } else {
        sentimentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ріст', 'Ризики'],
                datasets: [{
                    data: [pos, neg],
                    backgroundColor: ['#2ed573', '#ff4757'],
                    borderColor: '#1e1e1e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
    }
}

// --- STARFIELD ---
function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, stars = [];

    function res() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w; canvas.height = h;
        stars = [];
        for (let i = 0; i < 150; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, s: Math.random() * 2, v: Math.random() * 0.3 + 0.1, o: Math.random() });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "white";
        stars.forEach(s => {
            ctx.globalAlpha = s.o;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
            s.y += s.v; if (s.y > h) s.y = 0;
        });
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', res); res(); draw();
}
