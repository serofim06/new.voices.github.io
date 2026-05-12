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

// ==================== УТИЛИТЫ ====================

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function escapeHTML(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return '';
    return timestamp.toDate().toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
}

function isAdmin() {
    return !!(currentUser && currentUser.uid === ADMIN_UID);
}

function isEmailVerified() {
    return !!(currentUser && currentUser.emailVerified);
}

function getVisitorKey() {
    let key = localStorage.getItem('nv_visitor_key');
    if (!key) {
        key = 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('nv_visitor_key', key);
    }
    return key;
}

// ==================== НОВАЯ ФИЛЬТРАЦИЯ КОНТЕНТА ====================

// ---------- Категория 1: ПОЛНАЯ БЛОКИРОВКА (наркотики, насилие, угрозы) ----------
const HARD_BLOCKED = [
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
    // Насилие, угрозы, суицид (русские)
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
];

// ---------- Категория 2: СИГАРЕТЫ И АЛКОГОЛЬ (помечаются 18+) ----------
const ALCOHOL_SMOKING = [
    // Русские
    'сигарета', 'сигареты', 'сигарету', 'сигаретой',
    'табак', 'табака', 'табаку', 'табаком',
    'курение', 'курить', 'курят', 'курил',
    'алкоголь', 'алкоголя', 'алкоголю', 'алкоголем',
    'водка', 'водки', 'водке', 'водку', 'водкой',
    'пиво', 'пива', 'пиву', 'пивом',
    'вино', 'вина', 'вину', 'вином',
    'коньяк', 'коньяка', 'коньяку', 'коньяком',
    'шампанское', 'шампанского', 'шампанскому', 'шампанским',
    'пьяный', 'пьяная', 'пьяное', 'пьяные',
    'напиток', 'напитки', 'пьющий', 'выпить', 'выпил',
    'дым', 'дыма', 'затяжка', 'затяжки',
    // Английские
    'cigarette', 'cigarettes', 'tobacco',
    'smoking', 'smoke', 'smoker',
    'alcohol', 'beer', 'wine', 'vodka', 'whiskey', 'champagne',
    'drunk', 'drink', 'drinking',
];

// ---------- Категория 3: СЕКС И МАТ (помечаются 16+) ----------
const SEX_PROFANITY = [
    // Мат (русский)
    'хуй', 'хуя', 'хую', 'хуем', 'хуе', 'хуёв', 'хуям', 'хуями', 'хуях', 'хуярит',
    'пизда', 'пизды', 'пизде', 'пизду', 'пиздой', 'пиздц', 'пиздят',
    'ебать', 'ебу', 'ебёт', 'ебут', 'ёб', 'ебал', 'ебало', 'ебала',
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
    'мразь', 'мрази', 'мразью', 'мразей', 'мразям', 'мразями',
    'шалава', 'шалавы', 'шалаве', 'шалаву', 'шалавой', 'шалав',
    'ублюдок', 'ублюдка', 'ублюдку', 'ублюдком', 'ублюдке', 'ублюдки',
    'дерьмо', 'дерьма', 'дерьму', 'дерьмом', 'дерьме',
    'член',
    // Мат (английский)
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
    // Секс
    'секс', 'секса', 'сексу', 'сексом',
    'трах', 'трахать', 'трахнуть', 'трахаться',
    'орас', 'оральный', 'вагина', 'вагины',
    'сексуальный', 'сексуальные',
    'sex', 'fuck', 'intercourse',
];

// ======================= ФУНКЦИИ ПРОВЕРКИ =======================
function normalizeStr(str) {
    return str.toLowerCase()
        .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e')
        .replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t')
        .replace(/8/g,'b').replace(/@/g,'a').replace(/\$/g,'s').replace(/!/g,'i');
}

function containsAny(text, wordList) {
    if (!text || !text.trim()) return false;
    const norm = normalizeStr(text);
    const noSpaces = norm.replace(/\s+/g, '');
    for (let i = 0; i < wordList.length; i++) {
        const bad = normalizeStr(wordList[i]).replace(/\s+/g, '');
        if (noSpaces.includes(bad) || norm.includes(bad)) return true;
    }
    return false;
}

// Проверка текста стиха (блокируем только наркотики/насилие)
function isTextAllowed(text) {
    if (!text || text.trim().length === 0) {
        return { allowed: false, reason: 'Текст не может быть пустым' };
    }
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) {
        return { allowed: false, reason: 'Минимум 2 непустые строки' };
    }
    if (containsAny(text, HARD_BLOCKED)) {
        return { allowed: false, reason: 'Текст содержит запрещённые темы (наркотики, насилие, угрозы)' };
    }
    return { allowed: true };
}

// Проверка заголовка (запрещаем всё нежелательное)
function isTitleAllowed(title) {
    if (!title || title.trim().length === 0) {
        return { allowed: false, reason: 'Введи название' };
    }
    if (containsAny(title, HARD_BLOCKED) || containsAny(title, ALCOHOL_SMOKING) || containsAny(title, SEX_PROFANITY)) {
        return { allowed: false, reason: 'Название содержит недопустимые выражения' };
    }
    return { allowed: true };
}

// Проверки для взрослых меток
function containsAdultAlcohol(text) { return containsAny(text, ALCOHOL_SMOKING); }
function containsAdultSex(text) { return containsAny(text, SEX_PROFANITY); }

// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================

let currentUser = null;
let currentSort = 'newest';
let currentDetailSongId = null;

// ==================== КЭШ ПЕСЕН ====================

let songsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30_000; // 30 секунд

function invalidateCache() {
    songsCache = null;
    cacheTimestamp = null;
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
        const first = modal.querySelector('input, textarea, button:not(.modal-close)');
        if (first) first.focus();
    });
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Закрытие по клику на оверлей
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
        if (e.target === this) closeModal(this);
    });
});

// Закрытие по Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m));
    }
});

// ==================== АВТОРИЗАЦИЯ ====================

auth.onAuthStateChanged(user => {
    currentUser = user;
    updateHeaderUI();
    renderSongs();
});

function updateHeaderUI() {
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');
    const usernameDisplay = document.getElementById('currentUsernameDisplay');
    if (currentUser) {
        guestActions.style.display = 'none';
        userActions.style.display = 'flex';
        usernameDisplay.textContent = currentUser.displayName || currentUser.email;
    } else {
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
    }
}

async function sendVerificationEmail() {
    if (!currentUser) return;
    try {
        await currentUser.sendEmailVerification();
        showToast('📧 Письмо отправлено! Проверь почту');
    } catch (e) {
        showToast('❌ Ошибка отправки: ' + e.message);
    }
}

// --- Регистрация ---
document.getElementById('btnOpenRegister').addEventListener('click', () => {
    openModal(document.getElementById('modalRegister'));
});
document.getElementById('btnCloseRegister').addEventListener('click', () =>
    closeModal(document.getElementById('modalRegister')));
document.getElementById('btnCancelRegister').addEventListener('click', () =>
    closeModal(document.getElementById('modalRegister')));

document.getElementById('btnSubmitRegister').addEventListener('click', async () => {
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (!email || !username || !password) return showToast('⚠️ Заполни все поля');
    if (password.length < 6) return showToast('⚠️ Пароль минимум 6 символов');
    if (password !== passwordConfirm) return showToast('⚠️ Пароли не совпадают');

    const check = isUsernameAllowed(username);
    if (!check.allowed) return showToast('⚠️ ' + check.reason);

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: username });
        await cred.user.sendEmailVerification();
        closeModal(document.getElementById('modalRegister'));
        ['regEmail','regUsername','regPassword','regPasswordConfirm']
            .forEach(id => document.getElementById(id).value = '');
        showToast('✅ Регистрация успешна! Проверь почту 📧');
    } catch (e) {
        showToast('❌ ' + e.message);
    }
});

// --- Вход ---
document.getElementById('btnOpenLogin').addEventListener('click', () => {
    openModal(document.getElementById('modalLogin'));
});
document.getElementById('btnCloseLogin').addEventListener('click', () =>
    closeModal(document.getElementById('modalLogin')));
document.getElementById('btnCancelLogin').addEventListener('click', () =>
    closeModal(document.getElementById('modalLogin')));

document.getElementById('btnSubmitLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showToast('⚠️ Заполни все поля');
    try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        closeModal(document.getElementById('modalLogin'));
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        showToast(cred.user.emailVerified
            ? '👋 Добро пожаловать!'
            : '⚠️ Почта не подтверждена 📧');
    } catch {
        showToast('❌ Неверный email или пароль');
    }
});

// --- Выход ---
document.getElementById('btnLogout').addEventListener('click', () => {
    auth.signOut();
    showToast('🚪 Ты вышел из аккаунта');
});

// ==================== ДОБАВЛЕНИЕ СТИХА ====================

document.getElementById('btnOpenAddModal').addEventListener('click', () => {
    if (!currentUser) return showToast('⚠️ Войди в аккаунт');
    if (!isEmailVerified()) {
        showToast('⚠️ Подтверди почту перед публикацией 📧');
        return;
    }
    openModal(document.getElementById('modalAdd'));
});
document.getElementById('btnCloseAdd').addEventListener('click', () =>
    closeModal(document.getElementById('modalAdd')));
document.getElementById('btnCancelAdd').addEventListener('click', () =>
    closeModal(document.getElementById('modalAdd')));

document.getElementById('btnSubmitSong').addEventListener('click', debounce(async () => {
    const title = document.getElementById('inputTitle').value.trim();
    const text = document.getElementById('inputText').value.trim();

    const titleCheck = isTitleAllowed(title);
    if (!titleCheck.allowed) return showToast('⚠️ ' + titleCheck.reason);

    const textCheck = isTextAllowed(text);
    if (!textCheck.allowed) return showToast('⚠️ ' + textCheck.reason);

    const song = {
        title,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        views: 0,
        ratings: {},
        likedBy: {},
    };

    try {
        await db.collection('songs').add(song);
        closeModal(document.getElementById('modalAdd'));
        document.getElementById('inputTitle').value = '';
        document.getElementById('inputText').value = '';
        showToast('✅ Стих опубликован!');
        invalidateCache();
        renderSongs();
    } catch (e) {
        showToast('❌ Ошибка: ' + e.message);
    }
}, 1000));

// ==================== ЗАГРУЗКА И ОТОБРАЖЕНИЕ СТИХОВ ====================

function getSongsQuery() {
    let query = db.collection('songs');
    if (currentSort === 'newest') {
        query = query.orderBy('createdAt', 'desc');
    }
    return query.limit(50);
}

async function fetchSongs() {
    if (songsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return songsCache;
    }
    const snapshot = await getSongsQuery().get();
    songsCache = [];
    snapshot.forEach(doc => songsCache.push({ id: doc.id, ...doc.data() }));
    cacheTimestamp = Date.now();
    return songsCache;
}

function showLoading() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('songsGrid').innerHTML = '<div class="spinner" aria-label="Загрузка..."></div>';
}

async function renderSongs() {
    showLoading();
    let songs;
    try {
        songs = await fetchSongs();
    } catch (e) {
        document.getElementById('songsGrid').innerHTML = '';
        showToast('❌ Ошибка загрузки: ' + e.message);
        return;
    }

    if (currentSort === 'popular') {
        songs = [...songs].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'topRated') {
        songs = [...songs].sort((a, b) => {
            const avg = s => {
                const vals = Object.values(s.ratings || {});
                return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
            };
            return avg(b) - avg(a);
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

    const fragment = document.createDocumentFragment();
    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';  // <-- ИСПРАВЛЕНО: убран containsForbiddenWord
        card.dataset.id = song.id;
        card.setAttribute('role', 'listitem');
        card.tabIndex = 0;

        const avg = (() => {
            const vals = Object.values(song.ratings || {});
            return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
        })();

        const preview = (() => {
            const lines = song.text.split('\n');
            return lines.length > 3 ? lines.slice(0, 3).join('\n') + '\n...' : song.text;
        })();

        const adminDeleteBtn = isAdmin()
            ? `<button class="btn btn-danger btn-sm btn-delete-card" data-id="${song.id}" aria-label="Удалить">🗑️</button>`
            : '';

        card.innerHTML = `
        <div class="song-card-header">
            <span class="song-card-title">${escapeHTML(song.title)}</span>
            <span class="song-card-date">${formatDate(song.createdAt)}</span>
        </div>
        <span class="song-card-author">👤 ${escapeHTML(song.author)}</span>
        <div class="song-card-preview">
            ${escapeHTML(preview)}
        </div>
        <div class="song-card-footer">
            <div class="stats">
                <span title="Лайки">❤️ ${song.likes || 0}</span>
                ${containsAdultAlcohol(song.text) ? '<span class="age-badge age-badge-18">18+</span>' : ''}
                ${containsAdultSex(song.text) ? '<span class="age-badge age-badge-16">16+</span>' : ''}
                <span title="Рейтинг">⭐ ${avg}</span>
                <span title="Просмотры">👁 ${song.views || 0}</span>
            </div>
            ${adminDeleteBtn}
        </div>`;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-card')) return;
            openDetailModal(song.id);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetailModal(song.id);
            }
        });

        const delBtn = card.querySelector('.btn-delete-card');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSong(song.id);
            });
        }

        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}

// ==================== СОРТИРОВКА ====================

document.getElementById('sortButtons').addEventListener('click', (e) => {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    invalidateCache();
    renderSongs();
});

// ==================== УДАЛЕНИЕ СТИХА ====================

async function deleteSong(songId) {
    if (!currentUser) return;
    if (!confirm('⚠️ Удалить этот стих? Действие необратимо!')) return;

    try {
        const docRef = db.collection('songs').doc(songId);
        const snap = await docRef.get();
        if (!snap.exists) return;

        const data = snap.data();
        const canDelete = isAdmin()
            || data.authorId === currentUser.uid
            || data.author === currentUser.displayName
            || data.author === currentUser.email;

        if (!canDelete) return showToast('⛔ Недостаточно прав');

        await docRef.delete();
        showToast('🗑️ Стих удалён');
        invalidateCache();
        if (currentDetailSongId === songId) closeModal(document.getElementById('modalDetail'));
        renderSongs();
    } catch (e) {
        showToast('❌ Ошибка: ' + e.message);
    }
}

// ==================== РЕДАКТИРОВАНИЕ ====================

async function openEditModal(songId) {
    const snap = await db.collection('songs').doc(songId).get();
    if (!snap.exists) return;
    const song = snap.data();
    document.getElementById('editTitleInput').value = song.title;
    document.getElementById('editText').value = song.text;
    window._editingSongId = songId;
    openModal(document.getElementById('modalEdit'));
}

async function saveEdit() {
    const newTitle = document.getElementById('editTitleInput').value.trim();
    const newText = document.getElementById('editText').value.trim();

    const titleCheck = isTitleAllowed(newTitle);
    if (!titleCheck.allowed) return showToast('⚠️ ' + titleCheck.reason);
    const textCheck = isTextAllowed(newText);
    if (!textCheck.allowed) return showToast('⚠️ ' + textCheck.reason);

    try {
        const docRef = db.collection('songs').doc(window._editingSongId);
        const snap = await docRef.get();
        if (!snap.exists) return;
        const song = snap.data();

        const canEdit = isAdmin()
            || song.authorId === currentUser.uid
            || song.author === currentUser.displayName
            || song.author === currentUser.email;
        if (!canEdit) return showToast('⛔ Редактировать может только автор');

        await docRef.update({
            title: newTitle,
            text: newText,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('✅ Стих обновлён!');
        closeModal(document.getElementById('modalEdit'));
        invalidateCache();
        if (currentDetailSongId === window._editingSongId) {
            openDetailModal(window._editingSongId);
        }
        renderSongs();
    } catch (e) {
        showToast('❌ Ошибка: ' + e.message);
    }
}

document.getElementById('btnCloseEdit').addEventListener('click', () =>
    closeModal(document.getElementById('modalEdit')));
document.getElementById('btnCancelEdit').addEventListener('click', () =>
    closeModal(document.getElementById('modalEdit')));
document.getElementById('btnSaveEdit').addEventListener('click', saveEdit);

// ==================== ДЕТАЛЬНЫЙ ПРОСМОТР ====================

async function openDetailModal(songId) {
    const snap = await db.collection('songs').doc(songId).get();
    if (!snap.exists) return;
    const song = { id: snap.id, ...snap.data() };
    currentDetailSongId = songId;

    const visitor = getVisitorKey();
    const viewedKey = 'nv_viewed';
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    const isAuthor = currentUser && (
        song.authorId === currentUser.uid
        || song.author === currentUser.displayName
        || song.author === currentUser.email
    );

    if (!isAuthor && !viewed.includes(songId)) {
        db.collection('songs').doc(songId).update({
            views: firebase.firestore.FieldValue.increment(1)
        }).catch(() => {});
        viewed.push(songId);
        localStorage.setItem(viewedKey, JSON.stringify(viewed.slice(-100)));
    }

    const currentViews = (song.views || 0) + (!isAuthor && !viewed.slice(0, -1).includes(songId) ? 1 : 0);

    document.getElementById('detailTitle').textContent = song.title;
    document.getElementById('detailAuthor').textContent = song.author;
    document.getElementById('detailDate').textContent = formatDate(song.createdAt);
    document.getElementById('detailViews').textContent = song.views || 0;
    document.getElementById('detailText').textContent = song.text;
    document.getElementById('btnLikeCount').textContent = song.likes || 0;

    // Новые бейджи 18+ / 16+
    const alcoholBadge = document.getElementById('detailAdultBadge');
    const sexBadge = document.getElementById('detailSixteenBadge');
    if (alcoholBadge) {
        alcoholBadge.style.display = containsAdultAlcohol(song.text) ? 'inline' : 'none';
    }
    if (sexBadge) {
        sexBadge.style.display = containsAdultSex(song.text) ? 'inline' : 'none';
    }

    const ratingsVals = Object.values(song.ratings || {});
    const avg = ratingsVals.length
        ? (ratingsVals.reduce((a, b) => a + b, 0) / ratingsVals.length).toFixed(1)
        : null;
    document.getElementById('avgRatingDisplay').textContent = avg
        ? `Средняя: ${avg} / 5`
        : 'ещё нет оценок';

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
    btnDelete.onclick = (e) => {
        e.stopPropagation();
        deleteSong(songId);
        closeModal(document.getElementById('modalDetail'));
    };

    const btnEdit = document.getElementById('btnEditDetail');
    btnEdit.style.display = (isAdmin() || isOwner) ? 'inline-flex' : 'none';
    btnEdit.onclick = () => {
        if (!isEmailVerified()) return showToast('⚠️ Подтверди почту для редактирования');
        openEditModal(currentDetailSongId);
    };

    const btnReport = document.getElementById('btnReportSong');
    btnReport.style.display = (currentUser && !isOwner) ? 'inline-flex' : 'none';
    btnReport.onclick = () => reportSong(songId);

    renderRatingStars(song);
    openModal(document.getElementById('modalDetail'));
}

document.getElementById('btnCloseDetail').addEventListener('click', () =>
    closeModal(document.getElementById('modalDetail')));
document.getElementById('btnCloseDetailBottom').addEventListener('click', () =>
    closeModal(document.getElementById('modalDetail')));

// ==================== ЗВЁЗДЫ РЕЙТИНГА ====================

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
        star.onkeydown = (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && currentUser) {
                e.preventDefault();
                rateSong(song, val);
            }
        };
    });
}

async function rateSong(song, value) {
    const visitor = getVisitorKey();
    const ratings = { ...(song.ratings || {}), [visitor]: value };
    try {
        await db.collection('songs').doc(song.id).update({ ratings });
        song.ratings = ratings;
        renderRatingStars(song);
        const avg = (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1);
        document.getElementById('avgRatingDisplay').textContent = `Средняя: ${avg} / 5`;
    } catch (e) {
        showToast('❌ Ошибка оценки: ' + e.message);
    }
}

// ==================== ЛАЙКИ ====================

async function toggleLike(song) {
    const visitor = getVisitorKey();
    const likedBy = { ...(song.likedBy || {}) };

    try {
        if (likedBy[visitor]) {
            delete likedBy[visitor];
            await db.collection('songs').doc(song.id).update({
                likes: firebase.firestore.FieldValue.increment(-1),
                likedBy
            });
            song.likes = Math.max(0, (song.likes || 1) - 1);
        } else {
            likedBy[visitor] = true;
            await db.collection('songs').doc(song.id).update({
                likes: firebase.firestore.FieldValue.increment(1),
                likedBy
            });
            song.likes = (song.likes || 0) + 1;
        }
        song.likedBy = likedBy;
        document.getElementById('btnLikeCount').textContent = song.likes;
        document.getElementById('btnLikeDetail').classList.toggle('liked', !!likedBy[visitor]);
    } catch (e) {
        showToast('❌ Ошибка: ' + e.message);
    }
}

// ==================== ЖАЛОБЫ ====================

async function reportSong(songId) {
    if (!currentUser) return showToast('⚠️ Войди, чтобы пожаловаться');

    const lastReport = localStorage.getItem('nv_last_report');
    if (lastReport && Date.now() - parseInt(lastReport) < 60_000) {
        showToast('⚠️ Можно жаловаться не чаще раза в минуту');
        return;
    }

    if (!confirm('🚩 Отправить жалобу на этот стих?')) return;

    try {
        await db.collection('reports').add({
            songId,
            reportedBy: currentUser.email,
            reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        localStorage.setItem('nv_last_report', Date.now().toString());
        showToast('🚩 Жалоба отправлена. Администратор проверит стих');
    } catch (e) {
        showToast('❌ Ошибка: ' + e.message);
    }
}

// ==================== ПРОФИЛЬ ====================

document.getElementById('btnProfile').addEventListener('click', openProfileModal);
document.getElementById('btnCloseProfile').addEventListener('click', () =>
    closeModal(document.getElementById('modalProfile')));

async function openProfileModal() {
    if (!currentUser) return;
    await currentUser.reload().catch(() => {});

    document.getElementById('profileUsername').textContent =
        currentUser.displayName || currentUser.email;

    const statusEl = document.getElementById('profileVerifiedStatus');
    if (currentUser.emailVerified) {
        statusEl.innerHTML = '<span style="color:#6a9e6a;">✅ Почта подтверждена</span>';
    } else {
        statusEl.innerHTML = `<span style="color:#b08060;">⚠️ Почта не подтверждена</span>
            <button class="btn btn-ghost btn-sm" id="btnResendVerification" style="margin-left:10px;">
                Отправить повторно
            </button>`;
        const resendBtn = document.getElementById('btnResendVerification');
        if (resendBtn) resendBtn.addEventListener('click', sendVerificationEmail);
    }

    const snapshot = await db.collection('songs')
        .where('authorId', '==', currentUser.uid)
        .get();
    const mySongs = [];
    snapshot.forEach(doc => mySongs.push({ id: doc.id, ...doc.data() }));

    const totalLikes = mySongs.reduce((s, sng) => s + (sng.likes || 0), 0);
    const totalViews = mySongs.reduce((s, sng) => s + (sng.views || 0), 0);
    const allRatings = mySongs.flatMap(s => Object.values(s.ratings || {}));
    const avgRating = allRatings.length
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : '—';

    document.getElementById('profileStats').innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${totalLikes}</span>
            <span class="stat-label">Лайков</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${totalViews}</span>
            <span class="stat-label">Просмотров</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${mySongs.length}</span>
            <span class="stat-label">Стихов</span>
        </div>
        <div class="avg-stat-card stat-card">
            <span class="stat-value">${avgRating}</span>
            <span class="stat-label">Средний балл</span>
        </div>
    `;

    const listDiv = document.getElementById('profileSongsList');
    if (mySongs.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">У тебя пока нет стихов.</p>';
    } else {
        listDiv.innerHTML = mySongs
            .sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.seconds - a.createdAt.seconds;
            })
            .map(s => `
                <div class="profile-song-item" data-id="${s.id}" role="button" tabindex="0">
                    <span>${escapeHTML(s.title)}</span>
                    <span style="color:var(--text-muted); font-size:0.78rem;">${formatDate(s.createdAt)}</span>
                </div>
            `).join('');

        listDiv.querySelectorAll('.profile-song-item').forEach(item => {
            const openSong = () => {
                openDetailModal(item.dataset.id);
                closeModal(document.getElementById('modalProfile'));
            };
            item.addEventListener('click', openSong);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSong();
                }
            });
        });
    }

    openModal(document.getElementById('modalProfile'));
}

// Смена никнейма
document.getElementById('btnChangeNickname')?.addEventListener('click', async () => {
    const newName = prompt('Введи новый псевдоним:');
    if (!newName) return;
    const check = isUsernameAllowed(newName.trim());
    if (!check.allowed) return showToast('⚠️ ' + check.reason);
    try {
        await currentUser.updateProfile({ displayName: newName.trim() });
        showToast('✅ Псевдоним обновлён!');
        document.getElementById('profileUsername').textContent = newName.trim();
        document.getElementById('currentUsernameDisplay').textContent = newName.trim();
    } catch (e) {
        showToast('❌ ' + e.message);
    }
});

// Смена пароля
document.getElementById('btnChangePassword')?.addEventListener('click', async () => {
    if (!currentUser || !currentUser.email) return;
    if (!confirm(`Отправить ссылку для смены пароля на ${currentUser.email}?`)) return;
    try {
        await auth.sendPasswordResetEmail(currentUser.email);
        showToast('📧 Письмо для смены пароля отправлено!');
    } catch (e) {
        showToast('❌ ' + e.message);
    }
});
