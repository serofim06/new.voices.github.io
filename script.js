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
    'сучка', 'сучки', 'сучке', 'сучку', 'сучкой', 'сучкою', 'сучки',
    'мразь', 'мрази', 'мразью', 'мразей', 'мразям', 'мразями',
    'шалава', 'шалавы', 'шалаве', 'шалаву', 'шалавой', 'шалав',
    'ублюдок', 'ублюдка', 'ублюдку', 'ублюдком', 'ублюдке', 'ублюдки',
    'дерьмо', 'дерьма', 'дерьму', 'дерьмом', 'дерьме',
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
    'nigger', 'niggers', 'nigga', 'niggas',
    'faggot', 'faggots', 'fag', 'fags',
    'retard', 'retards', 'retarded',
    'moron', 'morons',
    'douchebag', 'douchebags', 'douche',
    'jackass', 'jackasses',
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
    'f4ck', 'f4cked', 'f4cking', 'f4cker',
    'sh1t', 'sh1ts', 'sh1tting', 'sh1tty',
    '4ss', '4sses', '4sshole', '4ssholes',
    'b1tch', 'b1tches',
    'd1ck', 'd1cks', 'd1ckhead',
    'puzzy', 'puzz1es',
    'b4stard', 'b4stards',
    'n1gger', 'n1ggers', 'n1gga',
    'f4ggot', 'f4ggots',
    'h3ro1n', 'c0ca1ne', 'cr4ck',
    'm3th', '3cst4sy', 'mdm4',
    'w33d', 'p0t',
    '4mphetamine', 'm3thamphetamine',
    'm3phedrone', 'm30w',
    'k3tamine', 'k3t',
    'f3ntanyl', 'f3ntanil',
    'x4n4x', 'v4lium',
    '0xyc0d0ne', '0xyc0nt1n',
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
    'н а р к о т и к', 'н а р к о т а',
    'г е р о и н', 'к о к а и н',
    'м а р и х у а н а', 'г а ш и ш',
    'м е ф е д р о н', 'а м ф е т а м и н',
    'с о л ь', 'с к о р о с т ь',
    'л с д', 'к и с л о т а',
    'admin','administrator','moderator','root','system',
    'support','help','staff','owner','creator',
    '4dm1n','4dmin','adm1n','r00t','m0der',
];

function isUsernameAllowed(username) {
    if (!username || username.length < 2 || username.length > 35)
        return { allowed: false, reason: 'Никнейм должен быть от 2 до 35 символов' };
    if (!/^[a-zA-Zа-яА-ЯёЁ0-9 _-]+$/.test(username))
        return { allowed: false, reason: 'Никнейм содержит недопустимые символы' };
    if (username !== username.trim())
        return { allowed: false, reason: 'Никнейм не может начинаться или заканчиваться пробелом' };
    if (/^\d+$/.test(username))
        return { allowed: false, reason: 'Никнейм не может состоять только из цифр' };

    const normalized = normalizeStr(username).replace(/\s+/g,'').replace(/[^a-zа-яё]/g,'');
    for (const badWord of FORBIDDEN_USERNAMES) {
        const normalizedBad = normalizeStr(badWord).replace(/\s+/g,'').replace(/[^a-zа-яё]/g,'');
        if (normalizedBad.length >= 3 && normalized.includes(normalizedBad))
            return { allowed: false, reason: 'Этот никнейм содержит запрещённые слова' };
    }
    return { allowed: true };
}

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUser = null;
let currentSort = 'newest';
let currentDetailSongId = null;

// ========== УТИЛИТЫ ==========
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), 2500);
}

function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return '';
    return timestamp.toDate().toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function isAdmin() {
    return currentUser && currentUser.uid === ADMIN_UID;
}

function getVisitorKey() {
    let key = localStorage.getItem('dark_lyrics_visitor_key');
    if (!key) {
        key = 'visitor_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('dark_lyrics_visitor_key', key);
    }
    return key;
}

// ========== АВТОРИЗАЦИЯ ==========
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

function isEmailVerified() {
    return currentUser && currentUser.emailVerified;
}

async function sendVerificationEmail() {
    if (!currentUser) return;
    try {
        await currentUser.sendEmailVerification();
        showToast('📧 Письмо отправлено! Проверь почту и перейди по ссылке');
    } catch (error) {
        showToast('❌ Ошибка отправки: ' + error.message);
    }
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========== РЕГИСТРАЦИЯ ==========
document.getElementById('btnOpenRegister').addEventListener('click', () => {
    openModal(document.getElementById('modalRegister'));
    document.getElementById('regEmail').focus();
});
document.getElementById('btnCloseRegister').addEventListener('click', () => closeModal(document.getElementById('modalRegister')));
document.getElementById('btnCancelRegister').addEventListener('click', () => closeModal(document.getElementById('modalRegister')));
document.getElementById('btnSubmitRegister').addEventListener('click', async () => {
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (!email || !username || !password) return showToast('⚠️ Заполни все поля');
    if (password.length < 6) return showToast('⚠️ Пароль минимум 6 символов');
    if (password !== passwordConfirm) return showToast('⚠️ Пароли не совпадают');

    const checkResult = isUsernameAllowed(username);
    if (!checkResult.allowed) return showToast('⚠️ ' + checkResult.reason);

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: username });
        await cred.user.sendEmailVerification();
        closeModal(document.getElementById('modalRegister'));
        document.getElementById('regEmail').value = '';
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
        showToast('✅ Регистрация успешна! Проверь почту для подтверждения 📧');
    } catch (error) {
        showToast('❌ ' + error.message);
    }
});

// ========== ВХОД ==========
document.getElementById('btnOpenLogin').addEventListener('click', () => {
    openModal(document.getElementById('modalLogin'));
    document.getElementById('loginEmail').focus();
});
document.getElementById('btnCloseLogin').addEventListener('click', () => closeModal(document.getElementById('modalLogin')));
document.getElementById('btnCancelLogin').addEventListener('click', () => closeModal(document.getElementById('modalLogin')));
document.getElementById('btnSubmitLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showToast('⚠️ Заполни все поля');
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        closeModal(document.getElementById('modalLogin'));
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        if (!userCredential.user.emailVerified) {
            showToast('⚠️ Почта не подтверждена. Проверь почту 📧');
        } else {
            showToast('👋 Добро пожаловать!');
        }
    } catch (error) {
        showToast('❌ Неверный email или пароль');
    }
});

// ========== ВЫХОД ==========
document.getElementById('btnLogout').addEventListener('click', () => {
    auth.signOut();
    showToast('🚪 Ты вышел из аккаунта');
});

// ========== ДОБАВЛЕНИЕ СТИХА ==========
document.getElementById('btnOpenAddModal').addEventListener('click', () => {
    if (!currentUser) return showToast('⚠️ Войди в аккаунт');
    if (!isEmailVerified()) {
        showToast('⚠️ Подтверди почту перед публикацией! Проверь свой email 📧');
        return;
    }
    openModal(document.getElementById('modalAdd'));
    document.getElementById('inputTitle').focus();
});
document.getElementById('btnCloseAdd').addEventListener('click', () => closeModal(document.getElementById('modalAdd')));
document.getElementById('btnCancelAdd').addEventListener('click', () => closeModal(document.getElementById('modalAdd')));

document.getElementById('btnSubmitSong').addEventListener('click', debounce(async () => {
    const title = document.getElementById('inputTitle').value.trim();
    const text = document.getElementById('inputText').value.trim();

    if (!title) return showToast('⚠️ Введи название');
    if (!text) return showToast('⚠️ Напиши текст');

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
        reports: []
    };

    try {
        await db.collection('songs').add(song);
        closeModal(document.getElementById('modalAdd'));
        document.getElementById('inputTitle').value = '';
        document.getElementById('inputText').value = '';
        showToast('✅ Стих опубликован!');
        invalidateCache();
        renderSongs();
    } catch (error) {
        showToast('❌ Ошибка: ' + error.message);
    }
}, 1000));

// ========== ПОЛУЧЕНИЕ ПЕСЕН ==========
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

// ========== ИНДИКАТОР ЗАГРУЗКИ ==========
function showLoading() {
    const grid = document.getElementById('songsGrid');
    document.getElementById('emptyState').style.display = 'none';
    grid.innerHTML = '<div class="spinner"></div>';
}

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
        <div class="song-card" data-id="${song.id}" style="position:relative;">
            <div class="song-card-header">
                <span class="song-card-title">${escapeHTML(song.title)}</span>
                <span class="song-card-date">${createdAt}</span>
            </div>
            <span class="song-card-author">👤 ${escapeHTML(song.author)}</span>
            <div class="song-card-preview">${escapeHTML(preview)}</div>
            <div class="song-card-footer">
                <div class="stats">
                    <span>❤️ ${song.likes || 0}</span>
                    <span>⭐ ${avg}</span>
                    <span>👁️ ${song.views || 0}</span>
                </div>
                ${isAdmin() ? `<button class="btn btn-danger btn-sm btn-delete-card" data-id="${song.id}">🗑️</button>` : ''}
            </div>
            ${isAdult ? '<span class="adult-badge-card">🔞 18+</span>' : ''}
        </div>`;
    }).join('');

    // Обработчики кликов
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

// ========== УДАЛЕНИЕ ПЕСНИ ==========
async function deleteSong(songId) {
    if (!currentUser) return;

    const confirmed = confirm('⚠️ Точно удалить этот стих? Действие необратимо!');
    if (!confirmed) return;

    try {
        const docRef = db.collection('songs').doc(songId);
        const doc = await docRef.get();
        if (!doc.exists) return;

        const data = doc.data();
        const canDelete = currentUser.uid === ADMIN_UID
            || data.authorId === currentUser.uid
            || data.author === currentUser.displayName
            || data.author === currentUser.email;

        if (canDelete) {
            await docRef.delete();
            showToast('🗑️ Стих удалён');
            invalidateCache();
            if (currentDetailSongId === songId) {
                closeModal(document.getElementById('modalDetail'));
            }
            renderSongs();
        } else {
            showToast('⛔ Недостаточно прав');
        }
    } catch (error) {
        showToast('❌ Ошибка: ' + error.message);
    }
}

// ========== РЕДАКТИРОВАНИЕ ==========
async function openEditModal(songId) {
    const doc = await db.collection('songs').doc(songId).get();
    if (!doc.exists) return;
    const song = doc.data();
    document.getElementById('editTitle').value = song.title;
    document.getElementById('editText').value = song.text;
    window.currentEditingSongId = songId;
    openModal(document.getElementById('modalEdit'));
}

async function saveEdit() {
    const newTitle = document.getElementById('editTitle').value.trim();
    const newText = document.getElementById('editText').value.trim();

    if (!newTitle || !newText) return showToast('⚠️ Заполните все поля');

    const titleCheck = isTitleAllowed(newTitle);
    if (!titleCheck.allowed) return showToast('⚠️ ' + titleCheck.reason);

    const textCheck = isTextAllowed(newText);
    if (!textCheck.allowed) return showToast('⚠️ ' + textCheck.reason);

    try {
        const docRef = db.collection('songs').doc(window.currentEditingSongId);
        const doc = await docRef.get();
        if (!doc.exists) return;

        const song = doc.data();
        const canEdit = currentUser.uid === ADMIN_UID
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

        if (currentDetailSongId === window.currentEditingSongId) {
            await openDetailModal(window.currentEditingSongId);
        }
        renderSongs();
    } catch (error) {
        showToast('❌ Ошибка: ' + error.message);
    }
}

document.getElementById('btnCloseEdit')?.addEventListener('click', () => closeModal(document.getElementById('modalEdit')));
document.getElementById('btnCancelEdit')?.addEventListener('click', () => closeModal(document.getElementById('modalEdit')));
document.getElementById('btnSaveEdit')?.addEventListener('click', saveEdit);

// ========== ЖАЛОБЫ ==========
async function reportSong(songId) {
    if (!currentUser) {
        showToast('⚠️ Войди в аккаунт, чтобы пожаловаться');
        return;
    }

    const lastReport = localStorage.getItem('last_report_time');
    if (lastReport && Date.now() - parseInt(lastReport) < 60000) {
        showToast('⚠️ Можно жаловаться не чаще 1 раза в минуту');
        return;
    }

    if (!confirm('🚩 Отправить жалобу на этот стих? Администратор проверит его.')) return;

    try {
        await db.collection('reports').doc().set({
            songId,
            reportedBy: currentUser.email,
            reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        localStorage.setItem('last_report_time', Date.now().toString());
        showToast('🚩 Жалоба отправлена. Администратор проверит стих');
    } catch (error) {
        showToast('❌ Ошибка: ' + error.message);
    }
}

// ========== ДЕТАЛЬНЫЙ ПРОСМОТР ==========
async function openDetailModal(songId) {
    try {
        const doc = await db.collection('songs').doc(songId).get();
    if (!doc.exists) return;
    const song = doc.data();
    song.id = doc.id;
    currentDetailSongId = songId;

    // ---------- ПРОСМОТРЫ (защита от накрутки) ----------
    const visitor = getVisitorKey();
    const viewedSongs = JSON.parse(localStorage.getItem('dark_lyrics_viewed') || '[]');
    const isAuthor = currentUser && (
        song.authorId === currentUser.uid
        || song.author === currentUser.displayName
        || song.author === currentUser.email
    );
    const alreadyViewed = viewedSongs.includes(songId);

    if (!isAuthor && !alreadyViewed) {
        db.collection('songs').doc(songId).update({ views: firebase.firestore.FieldValue.increment(1) });
        viewedSongs.push(songId);
        localStorage.setItem('dark_lyrics_viewed', JSON.stringify(viewedSongs.slice(-100)));
    }
    const currentViews = (song.views || 0) + (!isAuthor && !alreadyViewed ? 1 : 0);

    document.getElementById('detailTitle').textContent = song.title;
    document.getElementById('detailAuthor').textContent = song.author;

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

    // Лайк — проверяем через отдельную коллекцию (с защитой от ошибки прав)
    let isLiked = false;
    try {
        isLiked = await checkIsLiked(songId);
    } catch (e) {
        // Если правила Firebase не разрешают читать — просто показываем без лайка
        isLiked = !!(song.likedBy && song.likedBy[visitor]);
    }
    const btnLike = document.getElementById('btnLikeDetail');
    btnLike.classList.toggle('liked', isLiked);
    btnLike.onclick = (e) => { e.stopPropagation(); toggleLike(song); };

    // Права доступа
    const isOwner = currentUser && (
        song.authorId === currentUser.uid
        || song.author === currentUser.displayName
        || song.author === currentUser.email
    );

    // Удаление
    const btnDelete = document.getElementById('btnDeleteDetail');
    btnDelete.style.display = (isAdmin() || isOwner) ? 'inline-flex' : 'none';
    btnDelete.onclick = (e) => {
        e.stopPropagation();
        deleteSong(songId);
        closeModal(document.getElementById('modalDetail'));
    };

    // Редактирование — только автор или админ
    const btnEdit = document.getElementById('btnEditDetail');
    btnEdit.style.display = (isAdmin() || isOwner) ? 'inline-flex' : 'none';
    btnEdit.onclick = () => {
        if (!isEmailVerified()) {
            showToast('⚠️ Подтверди почту для редактирования');
            return;
        }
        openEditModal(currentDetailSongId);
    };

    // Жалоба
    const btnReport = document.getElementById('btnReportSong');
    btnReport.style.display = (currentUser && !isOwner) ? 'inline-flex' : 'none';
    btnReport.onclick = () => reportSong(songId);

    renderRatingStars(song);
    openModal(document.getElementById('modalDetail'));
    } catch (error) {
        showToast('❌ Не удалось открыть стих: ' + error.message);
        console.error('openDetailModal error:', error);
    }
}

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
// Лайки хранятся в отдельной коллекции 'likes' (songId_visitorKey),
// чтобы правила Firebase не блокировали запись не-авторам в документ стиха.
async function toggleLike(song) {
    const visitor = getVisitorKey();
    const likeDocId = song.id + '_' + visitor;
    const likeRef = db.collection('likes').doc(likeDocId);
    const songRef = db.collection('songs').doc(song.id);

    const likeDoc = await likeRef.get();
    const alreadyLiked = likeDoc.exists;

    if (alreadyLiked) {
        await likeRef.delete();
        await songRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
        song.likes = Math.max(0, (song.likes || 1) - 1);
        song.likedBy = { ...(song.likedBy || {}) };
        delete song.likedBy[visitor];
    } else {
        await likeRef.set({ songId: song.id, visitor, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        await songRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
        song.likes = (song.likes || 0) + 1;
        song.likedBy = { ...(song.likedBy || {}), [visitor]: true };
    }

    document.getElementById('btnLikeCount').textContent = song.likes;
    document.getElementById('btnLikeDetail').classList.toggle('liked', !alreadyLiked);
}

async function checkIsLiked(songId) {
    const visitor = getVisitorKey();
    const likeDoc = await db.collection('likes').doc(songId + '_' + visitor).get();
    return likeDoc.exists;
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
