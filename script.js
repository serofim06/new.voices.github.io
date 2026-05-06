// ==================== КОНФИГ FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyA-RMAIoRbk1ay_cQhX_2yEtL3FLMMo_HQ",
  authDomain: "dark-lyrics-66dea.firebaseapp.com",
  projectId: "dark-lyrics-66dea",
  storageBucket: "dark-lyrics-66dea.firebasestorage.app",
  messagingSenderId: "731590261281",
  appId: "1:731590261281:web:42286fa19bdd3d37f6c160"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// UID администратора
const ADMIN_UID = 'xtCPgPcNvqfygci1cSUQzfoZ2W43';

// ========== DEBOUNCE ==========
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ========== КЭШИРОВАНИЕ ПЕСЕН ==========
let songsCache = null;
let cacheTimestamp = null;
let cachedSort = null;
const CACHE_DURATION = 30000; // 30 секунд

function invalidateCache() {
    songsCache = null;
    cacheTimestamp = null;
}

// ========== МАТ (РАЗРЕШЁН, НО С БЛЮРОМ) ==========
const ADULT_CONTENT_WORDS = [
    // Русский мат (все формы)
    'хуй', 'хуя', 'хую', 'хуем', 'хуе', 'хуёв', 'хуям', 'хуями', 'хуях', 'хуярит',
    'пизда', 'пизды', 'пизде', 'пизду', 'пиздой', 'пиздц', 'пиздят',
    'ебать', 'ебу', 'ебёт', 'ебут', 'ёб', 'ебал', 'ебало', 'ебала', 'ебланит', 'ебланить',
    'блядь', 'бляди', 'блядей', 'блядям', 'блядями', 'блядях', 'блять',
    'сука', 'суки', 'суке', 'суку', 'сукой', 'сукою', 'сук', 'сучка',
    'нахер', 'нахуй', 'нахуя', 'похуй', 'похер', 'нихуя',
    'заебал', 'заебала', 'заебало', 'заебали', 'заебись', 'заебца',
    'хуево', 'хуёво', 'хуевый', 'хуёвый', 'хуевая', 'хуёвая',
    'пиздец', 'пиздеца', 'пиздецу', 'пиздецом', 'пиздеце',
    'еблан', 'еблана', 'еблану', 'ебланом', 'еблане', 'ебланы',
    'уебан', 'уебана', 'уебану', 'уебаном', 'уебане', 'уебаны',
    'долбоеб', 'долбоёб', 'долбоеба', 'долбоёба', 'долбоебы', 'долбоёбы',
    'гандон', 'гондон', 'гандона', 'гондона', 'гандону', 'гондону',
    'пидор', 'пидора', 'пидору', 'пидором', 'пидоре', 'пидоры',
    'пидорас', 'пидораса', 'пидорасу', 'пидорасом', 'пидорасе',
    'чмо', 'чма', 'чму', 'чмом', 'чме', 'чмы',
    'шлюха', 'шлюхи', 'шлюхе', 'шлюху', 'шлюхой', 'шлюхою', 'шлюх',
    'проститутка', 'проститутки', 'проститутке', 'проститутку',
    'сучка', 'сучки', 'сучке', 'сучку', 'сучкой', 'сучкою', 'сучки',
    'мразь', 'мрази', 'мразью', 'мразей', 'мразям', 'мразями',
    'шалава', 'шалавы', 'шалаве', 'шалаву', 'шалавой', 'шалав',
    'ублюдок', 'ублюдка', 'ублюдку', 'ублюдком', 'ублюдке', 'ублюдки',
    'дерьмо', 'дерьма', 'дерьму', 'дерьмом', 'дерьме',
    'член',

    // Английский мат
    'fuck', 'fucked', 'fucking', 'fucker', 'fuckers', 'motherfucker', 'motherfuckers',
    'shit', 'shits', 'shitting', 'shitty', 'bullshit',
    'ass', 'asses', 'asshole', 'assholes',
    'bitch', 'bitches', 'bitching', 'bitchy',
    'dick', 'dicks', 'dickhead', 'dickheads',
    'pussy', 'pussies',
    'cunt', 'cunts',
    'bastard', 'bastards',
    'whore', 'whores',
    'slut', 'sluts', 'slutty',
    'retard', 'retards', 'retarded',
    'moron', 'morons',
    'douchebag', 'douchebags', 'douche',
    'jackass', 'jackasses',

    // Leet speak для мата
    'f4ck', 'f4cked', 'f4cking', 'f4cker',
    'sh1t', 'sh1ts', 'sh1tting', 'sh1tty',
    '4ss', '4sses', '4sshole', '4ssholes',
    'b1tch', 'b1tches',
    'd1ck', 'd1cks', 'd1ckhead',
    'puzzy', 'puzz1es',
    'b4stard', 'b4stards',
    'f4ggot', 'f4ggots',

    // Слова с пробелами для обхода
    'х у й', 'х у я', 'х у ю', 'х у е м',
    'п и з д а', 'п и з д ы', 'п и з д е',
    'е б а т ь', 'е б у', 'е б ё т',
    'б л я д ь', 'б л я', 'б л я т ь',
    'с у к а', 'с у к и', 'с у ч к а',
    'н а х е р', 'н а х у й',
    'з а е б а л',
    'f u c k', 's h i t', 'a s s',
    'b i t c h', 'd i c k',
    'п и д о р', 'п и д о р а с',
    'г а н д о н', 'г о н д о н',
    'м у д а к', 'у е б а н',
    'д о л б о е б', 'е б л а н',
    'ш л ю х а', 'п р о с т и т у т к а',
];

// ========== ЗАПРЕЩЁННЫЕ ТЕМЫ (НАРКОТИКИ, НАСИЛИЕ) ==========
const FORBIDDEN_TOPICS = [
    // Наркотики (русские)
    'наркотик', 'наркотики', 'наркота', 'наркомания', 'наркоман',
    'героин', 'герыч', 'герик', 'гердос',
    'кокаин', 'кокс', 'крек',
    'амфетамин', 'амф', 'фенамин',
    'метамфетамин', 'мет', 'метамфа', 'первитин',
    'экстази', 'мдма',
    'марихуана', 'марихуанна', 'каннабис', 'конопля',
    'гашиш', 'гаш', 'гашик',
    'мефедрон', 'меф',
    'лсд',
    'опиум', 'опий', 'опиаты',
    'морфин', 'морфий', 'морфа',
    'метадон', 'метад', 'метода',
    'бутират', 'оксибутират',
    'спайс', 'спайсы', 'курительная смесь',
    'насвай', 'снюс', 'жевательный табак',
    'психотроп', 'психотропы', 'психоделик', 'психоделики',
    'галлюциноген', 'галлюциногены',
    'стимулятор', 'стимуляторы',
    'депрессант', 'депрессанты',
    'дозняк',
    'ширка', 'ширево', 'ширяться',
    'передоз', 'передозировка',
    'торчок', 'торчки', 'нарик', 'нарики',
    'дурь', 'травка', 'план', 'косяк',

    // Наркотики (английские)
    'heroin', 'cocaine', 'crack', 'coke',
    'amphetamine', 'methamphetamine', 'meth',
    'ecstasy', 'mdma', 'molly',
    'marijuana', 'cannabis', 'weed', 'pot', 'joint',
    'hashish', 'hash',
    'mephedrone', 'meow',
    'lsd', 'acid', 'blotter',
    'opium', 'morphine',
    'methadone',
    'oxycodone', 'oxycontin', 'oxy',
    'fentanyl', 'fentanil',
    'ketamine', 'ket',
    'psilocybin', 'mushrooms', 'shrooms',
    'dmt', 'ayahuasca',
    'xanax', 'valium', 'diazepam',
    'ghb', 'rohypnol', 'roofies',
    'steroids',

    // Насилие и угрозы (русские)
    'убить', 'убью', 'убьёт', 'убийство', 'убийца',
    'зарезать', 'зарежу', 'зарежет',
    'взорвать', 'взорву',
    'изнасиловать', 'изнасилую',
    'повесить', 'повешу',
    'прикончить', 'прикончу',
    'замочить', 'замочу',
    'грохнуть', 'грохну',
    'пришить', 'пришью',
    'завалить', 'завалю',
    'террорист', 'терроризм', 'теракт',
    'расчленить', 'расчленёнка',
    'пытать', 'пытка',
    'казнить', 'казнь',
    'смерть', 'смертельный',
    'кровь', 'кровавый', 'кровопролитие',
    'резня', 'бойня',
    'массовое убийство', 'стрельба в школе',
    'суицид', 'самоубийство', 'самоубийца',
    'повеситься', 'застрелиться', 'отравиться',

    // Насилие (английские)
    'kill', 'murder', 'murderer',
    'massacre', 'slaughter',
    'terrorist', 'terrorism',
    'rape', 'rapist',
    'torture',
    'execute', 'execution',
    'suicide', 'suicidal',
    'bomb', 'bombing',
    'shoot', 'shooting',
    'stab', 'stabbing',
    'strangle', 'strangulation',

    // Leet speak для запрещённых слов
    'h3ro1n', 'c0ca1ne', 'cr4ck',
    'm3th', '3cst4sy', 'mdm4',
    'w33d', 'p0t',
    '4mphetamine', 'm3thamphetamine',
    'm3phedrone', 'm30w',
    'k3tamine', 'k3t',
    'f3ntanyl', 'f3ntanil',
    'x4n4x', 'v4lium',
    '0xyc0d0ne', '0xyc0nt1n',
    'k1ll', 'murder3r', 't3rrorist', 'su1cide',

    // Слова с пробелами
    'н а р к о т и к', 'н а р к о т а',
    'г е р о и н', 'к о к а и н',
    'м а р и х у а н а', 'г а ш и ш',
    'м е ф е д р о н', 'а м ф е т а м и н',
    'у б и т ь', 'у б ь ю',
    'с м е р т ь', 'к р о в ь',
    'в з о р в а т ь', 'з а р е з а т ь',
    'с а м о у б и й с т в о',
    'k i l l', 'm u r d e r', 's u i c i d e',
];

// Нормализованные версии
const NORMALIZED_ADULT = ADULT_CONTENT_WORDS.map(word =>
    word.toLowerCase().replace(/[013457!@$8]/g, m =>
        ({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i'}[m] || m)
    )
);

const NORMALIZED_FORBIDDEN_TOPICS = FORBIDDEN_TOPICS.map(word =>
    word.toLowerCase().replace(/[013457!@$8]/g, m =>
        ({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i'}[m] || m)
    )
);

function normalizeStr(str) {
    return str.toLowerCase()
        .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e')
        .replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t')
        .replace(/8/g,'b').replace(/@/g,'a').replace(/\$/g,'s').replace(/!/g,'i');
}

function containsAdultContent(text) {
    const norm = normalizeStr(text);
    const noSpaces = norm.replace(/\s+/g, '');
    for (let i = 0; i < NORMALIZED_ADULT.length; i++) {
        const bad = NORMALIZED_ADULT[i];
        if (noSpaces.includes(bad) || norm.includes(bad)) return true;
    }
    return false;
}

function containsForbiddenTopic(text) {
    const norm = normalizeStr(text);
    const noSpaces = norm.replace(/\s+/g, '');
    for (let i = 0; i < NORMALIZED_FORBIDDEN_TOPICS.length; i++) {
        const bad = NORMALIZED_FORBIDDEN_TOPICS[i];
        if (noSpaces.includes(bad) || norm.includes(bad)) return true;
    }
    return false;
}

// Проверка текста стиха (запрещены только наркотики/насилие)
function isTextAllowed(text) {
    if (!text || text.trim().length === 0) {
        return { allowed: false, reason: 'Текст не может быть пустым' };
    }
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) {
        return { allowed: false, reason: 'Минимум 2 непустые строки' };
    }
    if (containsForbiddenTopic(text)) {
        return { allowed: false, reason: 'Текст содержит запрещённые темы (наркотики, насилие, угрозы)' };
    }
    return { allowed: true };
}

// Проверка заголовка (запрещены и мат, и запрещённые темы)
function isTitleAllowed(title) {
    if (!title || title.trim().length === 0) {
        return { allowed: false, reason: 'Введи название' };
    }
    if (containsAdultContent(title) || containsForbiddenTopic(title)) {
        return { allowed: false, reason: 'Название содержит недопустимые выражения' };
    }
    return { allowed: true };
}

// ========== ЧЁРНЫЙ СПИСОК НИКНЕЙМОВ ==========
const FORBIDDEN_USERNAMES = [
    // (список остаётся без изменений, опущен для краткости, но он должен быть здесь)
    // Полный список никнеймов из предыдущего файла
];

function isUsernameAllowed(username) {
    // (функция остаётся без изменений)
}

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUser = null;
let currentSort = 'newest';
let currentDetailSongId = null;

// ========== УТИЛИТЫ ==========
function showToast(msg) { /* без изменений */ }
function formatDate(timestamp) { /* без изменений */ }
function escapeHTML(str) { /* без изменений */ }
function isAdmin() { return currentUser && currentUser.uid === ADMIN_UID; }
function getVisitorKey() { /* без изменений */ }

// ========== АВТОРИЗАЦИЯ ==========
auth.onAuthStateChanged(user => {
    currentUser = user;
    updateHeaderUI();
    renderSongs();
});

function updateHeaderUI() { /* без изменений */ }
function isEmailVerified() { return currentUser && currentUser.emailVerified; }
async function sendVerificationEmail() { /* без изменений */ }

// ========== МОДАЛЬНЫЕ ОКНА ==========
function openModal(modal) { /* без изменений */ }
function closeModal(modal) { /* без изменений */ }

// ========== РЕГИСТРАЦИЯ, ВХОД, ВЫХОД ==========
// (все три функции остаются без изменений)

// ========== ДОБАВЛЕНИЕ СТИХА ==========
// ... (без изменений, кроме уже исправленного isTextAllowed)

// ========== ПОЛУЧЕНИЕ ПЕСЕН ==========
function getSongsQuery() { /* без изменений */ }
async function fetchSongs() { /* без изменений */ }

// ========== ИНДИКАТОР ЗАГРУЗКИ ==========
function showLoading() { /* без изменений */ }

// ========== ОТОБРАЖЕНИЕ ПЕСЕН ==========
async function renderSongs() {
    showLoading();

    let songs;
    try {
        songs = await fetchSongs();
    } catch (error) {
        document.getElementById('songsGrid').innerHTML = '';
        showToast('❌ Ошибка загрузки: ' + error.message);
        return;
    }

    if (currentSort === 'popular') {
        songs.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'topRated') {
        songs.sort((a, b) => {
            const avgA = Object.values(a.ratings || {}).reduce((s, r) => s + r, 0) / (Object.keys(a.ratings || {}).length || 1);
            const avgB = Object.values(b.ratings || {}).reduce((s, r) => s + r, 0) / (Object.keys(b.ratings || {}).length || 1);
            return avgB - avgA;
        });
    }

    const grid = document.getElementById('songsGrid');
    const empty = document.getElementById('emptyState');

    if (songs.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = songs.map(song => {
        const avg = Object.values(song.ratings || {}).length > 0
            ? (Object.values(song.ratings).reduce((a, b) => a + b, 0) / Object.values(song.ratings).length).toFixed(1)
            : '—';
        const lines = song.text.split('\n');
        const preview = lines.length > 3 ? lines.slice(0, 3).join('\n') + '\n...' : song.text;
        const createdAt = song.createdAt ? formatDate(song.createdAt) : '';

        // Блюр только при наличии мата
        const isAdult = containsAdultContent(song.text);

        return `
        <div class="song-card ${isAdult ? 'adult' : ''}" data-id="${song.id}">
            <div class="song-card-header">
                <span class="song-card-title">${escapeHTML(song.title)}</span>
                <span class="song-card-date">${createdAt}</span>
            </div>
            <span class="song-card-author">👤 ${escapeHTML(song.author)}</span>
            <div class="song-card-preview">
                ${escapeHTML(preview)}
                ${isAdult ? '<div class="adult-overlay">🔞 18+</div>' : ''}
            </div>
            <div class="song-card-footer">
                <div class="stats">
                    <span>❤️ ${song.likes || 0}</span>
                    <span>⭐ ${avg}</span>
                    <span>👁️ ${song.views || 0}</span>
                </div>
                ${isAdmin() ? `<button class="btn btn-danger btn-sm btn-delete-card" data-id="${song.id}">🗑️</button>` : ''}
            </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-card')) return;
            openDetailModal(card.dataset.id);
        });
    });
    grid.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSong(btn.dataset.id);
        });
    });
}

// ========== УДАЛЕНИЕ, РЕДАКТИРОВАНИЕ, ЖАЛОБЫ ==========
// ... (без изменений)

// ========== ДЕТАЛЬНЫЙ ПРОСМОТР ==========
async function openDetailModal(songId) {
    const doc = await db.collection('songs').doc(songId).get();
    if (!doc.exists) return;
    const song = doc.data();
    song.id = doc.id;
    currentDetailSongId = songId;

    const visitor = getVisitorKey();
    const viewedSongs = JSON.parse(localStorage.getItem('dark_lyrics_viewed') || '[]');
    const isAuthor = currentUser && (
        song.authorId === currentUser.uid
        || song.author === currentUser.displayName
        || song.author === currentUser.email
    );

    if (!isAuthor && !viewedSongs.includes(songId)) {
        db.collection('songs').doc(songId).update({ views: firebase.firestore.FieldValue.increment(1) });
        viewedSongs.push(songId);
        localStorage.setItem('dark_lyrics_viewed', JSON.stringify(viewedSongs.slice(-100)));
    }
    const currentViews = (song.views || 0) + (viewedSongs.includes(songId) ? 0 : 1);

    document.getElementById('detailTitle').textContent = song.title;
    document.getElementById('detailAuthor').textContent = song.author;

    // Значок 18+, если есть мат
    const adultBadge = document.getElementById('detailAdultBadge');
    if (adultBadge) {
        adultBadge.style.display = containsAdultContent(song.text) ? 'inline' : 'none';
    }

    document.getElementById('detailDate').textContent = formatDate(song.createdAt);
    document.getElementById('detailViews').textContent = currentViews;
    document.getElementById('detailText').textContent = song.text;
    document.getElementById('btnLikeCount').textContent = song.likes || 0;

    const avg = Object.values(song.ratings || {}).length > 0
        ? (Object.values(song.ratings).reduce((a, b) => a + b, 0) / Object.values(song.ratings).length).toFixed(1)
        : null;
    document.getElementById('avgRatingDisplay').textContent = avg ? `(Средняя: ${avg} / 5)` : '(ещё нет оценок)';

    const btnLike = document.getElementById('btnLikeDetail');
    btnLike.classList.toggle('liked', !!(song.likedBy && song.likedBy[visitor]));
    btnLike.onclick = (e) => { e.stopPropagation(); toggleLike(song); };

    const isOwner = currentUser && (
        song.authorId === currentUser.uid
        || song.author === currentUser.displayName
        || song.author === currentUser.email
    );

    const btnDelete = document.getElementById('btnDeleteDetail');
    btnDelete.style.display = (isAdmin() || isOwner) ? 'inline-flex' : 'none';
    btnDelete.onclick = (e) => { e.stopPropagation(); deleteSong(songId); closeModal(document.getElementById('modalDetail')); };

    const btnEdit = document.getElementById('btnEditDetail');
    btnEdit.style.display = (isAdmin() || isOwner) ? 'inline-flex' : 'none';
    btnEdit.onclick = () => {
        if (!isEmailVerified()) { showToast('⚠️ Подтверди почту для редактирования'); return; }
        openEditModal(currentDetailSongId);
    };

    const btnReport = document.getElementById('btnReportSong');
    btnReport.style.display = (currentUser && !isOwner) ? 'inline-flex' : 'none';
    btnReport.onclick = () => reportSong(songId);

    renderRatingStars(song);
    openModal(document.getElementById('modalDetail'));
}

// ... (остальной код остаётся без изменений: звёзды, лайки, профиль, сортировка, закрытие модалок)
document.getElementById('btnCloseDetail').addEventListener('click', () => closeModal(document.getElementById('modalDetail')));
document.getElementById('btnCloseDetailBottom').addEventListener('click', () => closeModal(document.getElementById('modalDetail')));


// ========== ЗВЁЗДЫ ==========
function renderRatingStars(song) {
    const container = document.getElementById('ratingStars');
    const userRating = (song.ratings && song.ratings[getVisitorKey()]) || 0;
    container.querySelectorAll('.star-char').forEach(star => {
        const val = parseInt(star.dataset.val);
        star.classList.toggle('active', val <= userRating);
        star.onclick = (e) => {
            e.stopPropagation();
            if (!currentUser) return showToast('⚠️ Войди, чтобы оценить');
            rateSong(song, val);
        };
    });
}

async function rateSong(song, value) {
    const visitor = getVisitorKey();
    const ratings = { ...(song.ratings || {}), [visitor]: value };
    await db.collection('songs').doc(song.id).update({ ratings });
    song.ratings = ratings;
    renderRatingStars(song);
    const avg = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;
    document.getElementById('avgRatingDisplay').textContent = `(Средняя: ${avg.toFixed(1)} / 5)`;
}

// ========== ЛАЙКИ ==========
async function toggleLike(song) {
    const visitor = getVisitorKey();
    const likedBy = { ...(song.likedBy || {}) };
    if (likedBy[visitor]) {
        delete likedBy[visitor];
        await db.collection('songs').doc(song.id).update({ likes: firebase.firestore.FieldValue.increment(-1), likedBy });
        song.likes = (song.likes || 1) - 1;
    } else {
        likedBy[visitor] = true;
        await db.collection('songs').doc(song.id).update({ likes: firebase.firestore.FieldValue.increment(1), likedBy });
        song.likes = (song.likes || 0) + 1;
    }
    song.likedBy = likedBy;
    document.getElementById('btnLikeCount').textContent = song.likes;
    document.getElementById('btnLikeDetail').classList.toggle('liked', !!likedBy[visitor]);
}

// ========== ПРОФИЛЬ ==========
document.getElementById('btnProfile').addEventListener('click', async () => {
    if (!currentUser) return;
    await currentUser.reload(); // обновляем статус верификации

    document.getElementById('profileUsername').textContent = currentUser.displayName || currentUser.email;

    const verifiedStatusHTML = currentUser.emailVerified
        ? '<span style="color:#4caf50;">✅ Почта подтверждена</span>'
        : `<span style="color:#ff9800;">⚠️ Почта не подтверждена</span>
           <button class="btn btn-sm btn-outline" id="btnResendVerification" style="margin-left:10px;">Отправить повторно</button>`;

    const snapshot = await db.collection('songs')
        .where('author', '==', currentUser.displayName || currentUser.email)
        .get();
    const mySongs = [];
    snapshot.forEach(doc => mySongs.push({ id: doc.id, ...doc.data() }));

    const totalLikes = mySongs.reduce((s, sng) => s + (sng.likes || 0), 0);
    const totalViews = mySongs.reduce((s, sng) => s + (sng.views || 0), 0);
    const totalRatings = mySongs.flatMap(s => Object.values(s.ratings || {}));
    const avgRating = totalRatings.length > 0
        ? (totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length).toFixed(1)
        : '—';

    document.getElementById('profileStats').innerHTML = `
        <div style="margin-bottom:15px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            ${verifiedStatusHTML}
        </div>
        <div class="stat-card"><span class="stat-value">${mySongs.length}</span><span class="stat-label">Стихов</span></div>
        <div class="stat-card"><span class="stat-value">${totalLikes}</span><span class="stat-label">Лайков</span></div>
        <div class="stat-card"><span class="stat-value">${totalViews}</span><span class="stat-label">Просмотров</span></div>
        <div class="stat-card"><span class="stat-value">${avgRating}</span><span class="stat-label">Средний балл</span></div>
    `;

    const resendBtn = document.getElementById('btnResendVerification');
    if (resendBtn) resendBtn.addEventListener('click', sendVerificationEmail);

    const listDiv = document.getElementById('profileSongsList');
    if (mySongs.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center;">У тебя пока нет стихов.</p>';
    } else {
        listDiv.innerHTML = mySongs.map(s => `
            <div class="profile-song-item" data-id="${s.id}">
                <span>${escapeHTML(s.title)}</span>
                <span style="color:var(--text-muted); font-size:0.8rem;">${formatDate(s.createdAt)}</span>
            </div>
        `).join('');
        listDiv.querySelectorAll('.profile-song-item').forEach(item => {
            item.addEventListener('click', () => {
                openDetailModal(item.dataset.id);
                closeModal(document.getElementById('modalProfile'));
            });
        });
    }
    openModal(document.getElementById('modalProfile'));
});

document.getElementById('btnCloseProfile').addEventListener('click', () => closeModal(document.getElementById('modalProfile')));

// ========== СОРТИРОВКА ==========
document.getElementById('sortButtons').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    invalidateCache();
    renderSongs();
});

// ========== ЗАКРЫТИЕ МОДАЛОК ==========
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this);
    });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m));
    }
});
