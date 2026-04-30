/* ==========================================================================
   Xinruisha — Photographic Works · v0.3
   - Hash router (#/, #/index, #/about, #/p/:id)
   - Cover carousel (drag/wheel/keys + center-card detection)
   - Web Audio synthesized click on snap
   - Detail view with magazine collage layout (12-col grid, ratio-driven)
   ========================================================================== */

/* ----- helpers ----------------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ----- 1. i18n ---------------------------------------------------------- */
const i18n = {
  en: {
    nav_home: 'Home', nav_index: 'Index', nav_about: 'About',
    cover_issue: 'VOL. 01 / 2025—2026',
    cover_kind: 'PHOTOGRAPHIC WORKS',
    cover_count: 'SELECTED PROJECTS · 14',
    cover_accent_no: 'N° 01',
    cover_accent_kind: 'MONOGRAPH',
    cover_title_1: 'Photographs,',
    cover_title_2: 'in between',
    cover_title_3: 'silence & noise.',
    cover_byline: 'A monograph of staged, performative and documentary photography by Xinruisha — works circling family, body, language and the spaces in between.',
    cover_cta: 'Enter Index',
    cover_photo_label: 'COVER · IMAGE',
    cover_photo_caption: 'Cover plate · placeholder',
    index_heading: 'Index',
    index_sub: '14 projects · 2024 — 2025',
    index_hint: 'drag · scroll · ← → keys · click to enter',
    about_heading: 'About the artist',
    about_subheading: '关于',
    back_to_index: 'Back to Index',
    detail_progress: 'Project',
    detail_view_video: '▶  PLAY VIDEO',
    detail_plates: 'plates',
    footer_copy: '© 2026 Xinruisha. All works reserved.',
    footer_set: 'Designed in monochrome. Set in Fraunces & Space Grotesk.',
    lang_btn: '中',
  },
  zh: {
    nav_home: '主页', nav_index: '索引', nav_about: '关于',
    cover_issue: '第 01 辑 / 2025—2026',
    cover_kind: '影像作品集',
    cover_count: '精选项目 · 14',
    cover_accent_no: 'N° 01',
    cover_accent_kind: '专辑',
    cover_title_1: '在静默',
    cover_title_2: '与喧嚣',
    cover_title_3: '之间。',
    cover_byline: '心瑞莎的影像合集——围绕家庭、身体、语言以及它们之间空隙展开的摆拍、表演与日常影像。',
    cover_cta: '进入索引',
    cover_photo_label: '封面 · 主图',
    cover_photo_caption: '封面图 · 占位',
    index_heading: '索引',
    index_sub: '14 件作品 · 2024 — 2025',
    index_hint: '拖动 · 滚动 · ← → 键切换 · 点击进入',
    about_heading: '关于作者',
    about_subheading: 'About the artist',
    back_to_index: '返回索引',
    detail_progress: '项目',
    detail_view_video: '▶ 播放影像',
    detail_plates: '张',
    footer_copy: '© 2026 心瑞莎，保留所有权利。',
    footer_set: '黑白单色。Fraunces 与 Space Grotesk 字体。',
    lang_btn: 'EN',
  },
};

/* ----- 2. Data ---------------------------------------------------------- */
const ratios = (str) => str.trim().split(/\s+/);

function seedData() {
  return {
    site: { brandCn: '心瑞莎', brandEn: 'XINRUISHA' },
    projects: [
      {
        id: 'for-your-own-good', no: '01', year: '2024',
        nameEn: 'For Your Own Good', nameCn: '为你好',
        medium: { en: 'Photography · Series', cn: '摄影 · 系列' },
        en: 'This series explores the relationship between mother and daughter, focusing on the blurred line between care and control. The phrase "for your own good" is often used as an expression of protection, but it can also carry pressure and expectation. Through staged images and quiet gestures, the work reflects on how love can feel both supportive and restrictive at the same time. Rather than showing direct conflict, it focuses on subtle moments where emotions are present but not fully expressed.',
        cn: '本系列围绕母女关系展开，关注关爱与控制之间模糊的界限。"为你好"常被视为一种保护性的表达，但其中也可能包含压力与期待。通过摆拍影像与克制的肢体语言，作品呈现出爱如何在支持与束缚之间同时存在。它并不直接展现冲突，而是聚焦于那些情绪真实存在却未被完全表达的细微时刻。',
        images: ratios('3:4 3:4 3:2 3:4 4:5 3:4 3:4 3:2 3:4 4:5 3:4 3:4 1:1 3:4 3:2 3:4 3:4 3:4'),
      },
      {
        id: 'rooted-together', no: '02', year: '2024',
        nameEn: 'Rooted Together', nameCn: '同根共生',
        medium: { en: 'Photography · Composite', cn: '摄影 · 合成' },
        en: 'Human limbs and plant roots visually intertwine, suggesting the common origin and continuity of all life. Through photography and post-processing, a space both real and surreal emerges. This work is not just a visual statement — it\'s an emotional invitation to reflect on the inseparable bond between humans and nature, and to step beyond an anthropocentric view.',
        cn: '将人的肢体与植物的根系视觉交织，暗示生命共同的起源与延续。通过摄影与后期，创造出既真实又超现实的影像。这不是简单的视觉呈现，而是一次情感层面的深层探索——邀请观众反思：人与自然，本就不可分割。',
        images: ratios('1:1 3:4 3:4 1:1'),
      },
      {
        id: 'in-between', no: '03', year: '2024',
        nameEn: 'In-Between', nameCn: '夹缝里的我',
        medium: { en: 'Photography · Self-portrait', cn: '摄影 · 自拍像' },
        en: 'My first year abroad — I felt like being locked inside a cardboard box. Cut off from the home I knew, not yet connected to the world around me. Color speaks of my desire to break stereotypes and embrace the unknown; black and white carries loneliness, confinement, and the fragile shape of hope. The two alternate, like my identity swaying in a foreign land. But this very process — from color to black and white, from inside the box to outside, from limits to release.',
        cn: '第一年留学，像被装进一个纸箱——隔绝了熟悉的现实，却还没走进全新的世界。彩色，是我想打破刻板印象、拥抱丰富未知的渴望；黑白，是孤独与束缚，也是希望在暗处凝结的形状。两种色调交替出现，就像我在异国他乡的身份认同里来回摇摆。但正是这个过程——从彩色到黑白、从箱里到箱外、从限制到自由。',
        images: ratios('3:4 3:2 3:4 3:4 4:5 3:4 3:4 3:2 3:4'),
      },
      {
        id: 'the-coded-human', no: '04', year: '2024',
        nameEn: 'The Coded Human', nameCn: '条码之身',
        medium: { en: 'Performance · Photography', cn: '表演 · 摄影' },
        en: 'Barcodes are no longer just for products. When placed on the body, the person becomes scannable — priced, consumed, commodified. Through performance photography, this work presents the state of the "commodified human" with absurd, humorous, and sharp imagery: alienation, loss of identity, invisible manipulation. Have we already, without noticing, become carriers of symbols in the wave of consumerism?',
        cn: '条形码，不再是商品的专属。当它贴在身体上，人也就成了可被扫描、定价、消费的符号。通过表演摄影，以荒诞而锐利的方式呈现"商品人"的存在状态——异化、身份丧失、被无形之手操纵。我们是否早已在消费浪潮中，不知不觉成为符号的载体？',
        images: ratios('3:4 3:4 3:2 3:4 3:4 3:4 3:2 3:4 3:4 3:4 3:2'),
      },
      {
        id: 'fervors-crucible', no: '05', year: '2025',
        nameEn: "Fervor's Crucible", nameCn: '炽炼',
        medium: { en: 'Photography · Studio', cn: '摄影 · 工作室' },
        en: 'Fire destroys, but it also creates and transforms. It forges metal, sparks chemical change, and on a deeper level, it cleanses the spirit and fuels the heat between lovers. This piece explores fire\'s double nature — creation and change — where matter meets emotion, and an undying flame is born.',
        cn: '火，既是物质的熔炉，也是精神的洗礼。它锻造金属、催化变化，亦象征心灵的净化与恋人间炽热的激情。这件作品探寻火的双重力量——创造与转变，在物质与情感的融合处，燃起不灭的光焰。',
        images: ratios('3:4 3:2 3:4'),
      },
      {
        id: 'scorching-words', no: '06', year: '2025',
        nameEn: 'Scorching Words', nameCn: '灼语',
        medium: { en: 'Photography · Conceptual', cn: '摄影 · 观念' },
        en: 'Fire burns and destroys — danger, ruin. Words cut without drawing blood. A soft tongue can break bones and muscles. Sometimes words hurt more than violence. Not the shape, but every word from the heart can shatter a person in an instant. Love must be spoken well.',
        cn: '火能焚毁一切，象征危险与毁灭。而语言，如无血之刃，柔软却足以割骨剜心。有时言语的伤害比暴力更深——爱若不善表达，一字一句便能瞬间将人击碎。',
        images: ratios('3:2 3:2'),
      },
      {
        id: 'the-one-who-shines', no: '07', year: '2025',
        nameEn: 'The One Who Shines', nameCn: '追光的人',
        medium: { en: 'Photography · Portrait', cn: '摄影 · 人像' },
        en: 'Teenagers should have dreams — not just in their hearts, but in their actions. Dreams don\'t shine. You do. You are the one chasing your dreams. That\'s where the light comes from.',
        cn: '少年该有梦想——不只在心里，更在脚下一步步的行动里。梦想本身不会发光，发光的是追逐梦想的你。',
        images: ratios('3:4 3:2'),
      },
      {
        id: 'milky-way-dream', no: '08', year: '2025',
        nameEn: 'Milky Way Dream', nameCn: '星河入梦',
        medium: { en: 'Photography · Night', cn: '摄影 · 夜色' },
        en: 'The moon hangs like a disk in the dark sky, casting its light on everything. A beautiful and quiet night — tender moonlight, bright stars. Walking along the Milky Way into your dreams. Stars fill the pockets. Romance stays alive. May this moment last forever.',
        cn: '月如银盘，悬于暗夜，光洒万物。那是一个美丽而安静的夜晚——月光温柔，星辰明亮。沿着银河，走入你的梦境。星星装满口袋，浪漫永远鲜活。这一刻，愿它成为永恒。',
        images: ratios('16:9 3:2 3:2 16:9 3:2'),
      },
      {
        id: 'cheers-to-your-eyes', no: '09', year: '2025',
        nameEn: 'Cheers to Your Eyes', nameCn: '杯中异见',
        medium: { en: 'Photography · Still life', cn: '摄影 · 静物' },
        en: 'Through a cup, the world enters a mysterious parallel space — strange colors, blurred reflections, twisted light. Ordinary things become upside down, broken, stretched, and wonderfully strange. When I see her this way — what do I look like from her side?',
        cn: '透过一只杯子，世界进入神秘的平行空间。光影折射，空间模糊而失真。平凡的物品变得颠倒、扭曲、破碎、拉伸——却因此有了异常有趣的变化。当我这样看她时，从她的眼里看过来，我又是什么样子呢？',
        images: ratios('1:1 3:4'),
      },
      {
        id: 'true-self', no: '10', year: '2025',
        nameEn: 'True Self, My Own Light', nameCn: '真我自耀',
        medium: { en: 'Photography · Portrait', cn: '摄影 · 人像' },
        en: 'Look at heaven and earth, see all beings — and always stay true. I do my truth, no twist, no pretense. That confidence? It sparks from within. It\'s your own shine.',
        cn: '仰望天地，俯观众生，不变的是一条底线——守真。我以我的真实行事，不修饰，不背离。那份自信，是自己从心底点亮的光。',
        images: ratios('3:4 3:2 3:4 4:5 3:4'),
      },
      {
        id: 'once-we-had', no: '11', year: '2025',
        nameEn: 'Once, We Had', nameCn: '曾有一刻',
        medium: { en: 'Photography · Series', cn: '摄影 · 系列' },
        en: 'Time slips away — a wisp of spring, a trace of fragrance. Only a pale face and helpless waiting remain. Memory runs like sand, everything bursts in the passing. Flowers fade, people age, love grows dim. I know the road is long and people scatter. But at least we had it once — didn\'t we?',
        cn: '时光流走，只剩苍白与等待。记忆如沙，一切都在流逝中爆发。花终会谢，人终会老，爱终会淡。明知路远人散，但至少——我们曾经拥有过，不是吗？',
        images: ratios('3:4 3:4'),
      },
      {
        id: 'light-in-the-dark', no: '12', year: '2025',
        nameEn: 'Light in the Dark', nameCn: '暗处生光',
        medium: { en: 'Photography · Series', cn: '摄影 · 系列' },
        en: 'Don\'t wither my sunflowers — even in the dark. Hiding in hell, still looking up to the divine. Let light break through the shadows, wash away the dust with a rain of petals, and walk step by step toward hope. I have seen darkness and pain, yet I still believe in simplicity and beauty. Searching for light in the darkness — that is the meaning of life. So please, go all the way through thorns and thorns toward your own glory.',
        cn: '即便在黑暗里，也别让我的向日葵枯萎。躲在地狱，仍抬头望向神明。愿光穿透暗处，照亮散落的角落。用灵魂换一场花雨，洗净满身泥泞，一步步走向希望。见过世间的黑暗与痛楚，却依然相信纯真与美好。在暗处寻光，正是生命的意义。请务必穿过荆棘，走向属于自己的荣光。',
        images: ratios('3:4 3:4 3:2'),
      },
      {
        id: 'free-as-i-am', no: '13', year: '2025',
        nameEn: 'Free as I Am', nameCn: '自在飞',
        medium: { en: 'Photography · Portrait', cn: '摄影 · 人像' },
        en: 'I\'m a free bird. No cage, no set path — just the moment I decide to fly. That\'s what I want.',
        cn: '我是一只自由的鸟。没有笼子，没有方向——只有想飞的那一刻。这就是我想要的。',
        images: ratios('3:2 3:4'),
      },
      {
        id: 'untranslatable', no: '14', year: '2025',
        nameEn: 'Untranslatable', nameCn: '不可译',
        medium: { en: 'Single-channel video', cn: '单频影像' },
        en: 'Untranslatable starts from the experience of Chinese international students, capturing the struggle of expressing and translating meaning. From this personal point of view, it opens into a wider shared experience of language breakdown and emotional disconnection across cultures.',
        cn: '《不可译》从中国留学生的经历出发，捕捉表达与翻译之间持续的拉扯与错位。从这一私人的视角延展开去，作品触及更普遍的共有经验——跨文化情境中语言的崩塌与情感的失联。',
        images: [],
        isVideo: true,
      },
    ],
    about: {
      portraitCaptionEn: 'Xinruisha, Studio, 2025',
      portraitCaptionCn: '心瑞莎，工作室，2025',
      ledeEn: 'Xinruisha (b. 2003, China) is a photographer working between staged image-making, performance and quiet documentary. Her practice maps the porous boundaries between care and control, body and barcode, language and silence.',
      ledeCn: '心瑞莎，2003 年生于中国，是一位游走于摆拍、表演与安静纪实之间的摄影师。她的实践绘制着那些松动的边界——关爱与控制、身体与条码、语言与沉默。',
      bioEn: [
        'She currently works between Singapore and Shanghai. Her ongoing practice circles around family relationships, embodied experience, and the ways meaning erodes in cross-cultural settings.',
        'This monograph "Photographs, in between silence & noise" gathers fourteen interconnected projects, developed as her graduation thesis.',
      ],
      bioCn: [
        '目前在新加坡与上海两地往返工作。长期围绕家庭关系、身体经验，以及跨文化语境下语言失落的方式展开创作。',
        '本作品集《在静默与喧嚣之间》收录十四个互相牵连的项目，作为毕业论文的视觉主体。',
      ],
      contact: [
        { en: 'Email',          cn: '邮箱',     value: 'hello@xinruisha.com' },
        { en: 'Studio',         cn: '工作室',   valueEn: 'Singapore · Shanghai', valueCn: '新加坡 · 上海' },
        { en: 'Instagram',      cn: 'Instagram', value: '@xinruisha' },
        { en: 'Representation', cn: '合作',     valueEn: 'Open to collaboration', valueCn: '欢迎洽谈合作' },
      ],
    },
  };
}

/* ----- 2.4  Image acceleration (Cloudflare /cdn-cgi/image) -------------- */
/* Wrap an R2 / img.ggjj.app URL with Cloudflare Image Resizing options,
   so each <img> can request a right-sized + AVIF/WebP variant.
   Same trick used by tanyang/vidverian — works because img.ggjj.app sits on a
   Cloudflare zone with Image Resizing enabled. */
function rimg(url, w) {
  if (!url) return url;
  try {
    const u = new URL(url, location.origin);
    const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    /* DEV: bypass cdn-cgi (which only exists on Cloudflare); also rewrite the
       img.ggjj.app URL produced by upload.js to the same-origin /api/image proxy
       — that's where wrangler's local R2 simulator actually serves the bytes from. */
    if (isLocalHost) {
      if (u.hostname && u.hostname !== location.hostname) {
        return '/api/image' + u.pathname;
      }
      return url;
    }
    /* PROD: real Cloudflare zone — request a resized AVIF/WebP variant */
    return `${u.origin}/cdn-cgi/image/width=${w},format=auto,quality=85,fit=scale-down${u.pathname}`;
  } catch {
    return url;
  }
}
function srcsetFor(url, widths) {
  return widths.map((w) => `${rimg(url, w)} ${w}w`).join(', ');
}
/* For video / non-image assets — same dev-rewrite as rimg() but never wrap in cdn-cgi. */
function rawSrc(url) {
  if (!url) return url;
  try {
    const u = new URL(url, location.origin);
    const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocalHost && u.hostname && u.hostname !== location.hostname) {
      return '/api/image' + u.pathname;
    }
    return url;
  } catch { return url; }
}
/* small helper to build a full <img> tag with src + srcset + sizes */
function imgTag(url, { widths, sizes, lazy = true, alt = '' } = {}) {
  if (!url) return '';
  const fallbackW = widths[Math.floor(widths.length / 2)];
  return `<img src="${escapeHtml(rimg(url, fallbackW))}"
               srcset="${escapeHtml(srcsetFor(url, widths))}"
               sizes="${escapeHtml(sizes)}"
               ${lazy ? 'loading="lazy" decoding="async"' : ''}
               alt="${escapeHtml(alt)}" />`;
}

/* ----- 2.5  Normalisers + cover/about i18n bridge ----------------------- */

/* upgrade legacy "3:4" string images → {key, w, h, url} so render code stays one path */
function normalizeImages(imgs) {
  if (!Array.isArray(imgs)) return [];
  return imgs.map((it) => {
    if (typeof it === 'string') {
      const [w, h] = it.split(':').map(Number);
      return { w: w || 1, h: h || 1, key: null, url: null };
    }
    return { w: it.w || 1, h: it.h || 1, key: it.key || null, url: it.url || null };
  });
}

function normalizeData(d) {
  if (!d || typeof d !== 'object') return seedData();
  d.site     ??= seedData().site;
  d.cover    ??= {};
  d.about    ??= seedData().about;
  d.projects ??= [];
  for (const p of d.projects) p.images = normalizeImages(p.images);
  return d;
}

/* push DATA.cover.* into the i18n dictionary so existing data-i18n binding works */
const COVER_MAP = {
  cover_issue:         'issue',
  cover_kind:          'kind',
  cover_count:         'count',
  cover_accent_no:     'accentNo',
  cover_accent_kind:   'accentKind',
  cover_title_1:       'title1',
  cover_title_2:       'title2',
  cover_title_3:       'title3',
  cover_byline:        'byline',
  cover_cta:           'cta',
  cover_photo_caption: 'photoCaption',
};
function mergeCoverIntoI18n() {
  const c = DATA?.cover;
  if (!c) return;
  for (const [key, field] of Object.entries(COVER_MAP)) {
    if (c[field]?.en) i18n.en[key] = c[field].en;
    if (c[field]?.cn) i18n.zh[key] = c[field].cn;
  }
}

/* if data.cover.photo / data.about.portrait have a URL, inject <img> into placeholders */
function injectImageIntoPlaceholder(el, imgObj) {
  if (!el) return;
  if (!imgObj?.url) {
    el.classList.remove('placeholder--has-image', 'ph--has-image');
    return;
  }
  el.classList.add('placeholder--has-image');
  /* big cover photo on first viewport — needs eager load + large widths */
  el.innerHTML = imgTag(imgObj.url, {
    widths: [800, 1200, 1800, 2400],
    sizes: '(max-width: 720px) 100vw, 60vw',
    lazy: false,
    alt: 'Cover',
  });
}

/* ----- 3. State --------------------------------------------------------- */
const SOUND_KEY = 'jgf-sound';
const lang   = 'en';                           /* fixed — site is English-only */
let soundOn  = localStorage.getItem(SOUND_KEY) !== 'off';
let DATA     = null;
let activeIdx = 0; // current active index in carousel

const t = (k) => (i18n[lang] && i18n[lang][k]) ?? k;

/* ----- 4. i18n apply ---------------------------------------------------- */
function applyStaticI18n() {
  document.documentElement.lang = 'en';
  $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
}

/* ----- 5. Audio click synthesis (no external file) ---------------------- */
let audioCtx = null;
let lastClickAt = 0;
function getCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { audioCtx = null; }
  }
  return audioCtx;
}

function playClick(opts = {}) {
  if (!soundOn) return;
  /* throttle: at most one tick every 70ms — keeps scroll-snap from machine-gunning */
  const tNow = performance.now();
  if (tNow - lastClickAt < 70) return;
  lastClickAt = tNow;

  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const { freq = 4200, dur = 0.038, vol = 0.13 } = opts;
  const now = ctx.currentTime;

  // short noise burst → bandpass → exp envelope. Mechanical "tick".
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / len * 7);
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const flt = ctx.createBiquadFilter();
  flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = 5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

  src.connect(flt); flt.connect(g); g.connect(ctx.destination);
  src.start(now); src.stop(now + dur);
}

function bindSoundToggle() {
  const btn = $('[data-sound-toggle]');
  if (!btn) return;
  btn.classList.toggle('is-muted', !soundOn);
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
    btn.classList.toggle('is-muted', !soundOn);
    if (soundOn) playClick({ freq: 5000, vol: 0.15 });
  });
}

/* ----- 6. Carousel ------------------------------------------------------ */
function carouselCardHtml(p, langSnap) {
  const name = langSnap === 'zh' ? p.nameCn : p.nameEn;
  const copy = langSnap === 'zh' ? p.cn     : p.en;
  const med  = langSnap === 'zh' ? p.medium.cn : p.medium.en;
  const isVid = !!p.isVideo;
  const labelText = isVid ? '▶' : `PLATE ${p.no}`;
  /* explicit cover (admin-picked) → first uploaded image → placeholder */
  const cover = p.cover?.url ? p.cover : (p.images || []).find((i) => i.url);
  const phClass = cover ? 'ph ph--has-image' : 'ph';
  const phInner = cover ? imgTag(cover.url, {
    widths: [400, 600, 800, 1200],
    sizes: '(max-width: 720px) 40vw, 220px',
  }) : '';

  return `
    <a class="carousel__card ${isVid ? 'carousel__card--video' : ''}"
       href="#/p/${escapeHtml(p.id)}"
       data-route="/p/${escapeHtml(p.id)}"
       data-card-id="${escapeHtml(p.id)}"
       data-lang="${langSnap}">
      <span class="carousel__no">${escapeHtml(p.no)}</span>
      <div class="${phClass}" data-label="${escapeHtml(labelText)}" data-ratio="4:5">${phInner}</div>
      <div class="carousel__hover">
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(copy)}</p>
      </div>
    </a>
  `;
}

function renderCarousel() {
  const wrap = $('[data-carousel]');
  if (!wrap) return;
  wrap.innerHTML = DATA.projects.map((p) => carouselCardHtml(p, lang)).join('');
  // initial active = 0
  setTimeout(() => {
    activeIdx = 0;
    snapToCard(0, false);
    updateActiveCard();
  }, 30);
}

function getCards() {
  return $$('[data-card-id]', $('[data-carousel]'));
}

function snapToCard(idx, smooth = true) {
  const cards = getCards();
  if (!cards[idx]) return;
  const car = $('[data-carousel]');
  const target = cards[idx];
  // scroll so card center aligns with viewport center
  const carRect = car.getBoundingClientRect();
  const cardRect = target.getBoundingClientRect();
  const delta = (cardRect.left + cardRect.width / 2) - (carRect.left + carRect.width / 2);
  car.scrollTo({ left: car.scrollLeft + delta, behavior: smooth ? 'smooth' : 'auto' });
}

function updateActiveCard() {
  const cards = getCards();
  if (!cards.length) return;
  cards.forEach((c, i) => {
    const d = i - activeIdx;
    c.classList.remove('is-active', 'is-prev', 'is-next', 'is-prev-2', 'is-next-2');
    if (d ===  0) c.classList.add('is-active');
    else if (d === -1) c.classList.add('is-prev');
    else if (d ===  1) c.classList.add('is-next');
    else if (d === -2) c.classList.add('is-prev-2');
    else if (d ===  2) c.classList.add('is-next-2');
  });
}

function detectActiveOnScroll() {
  const car = $('[data-carousel]');
  if (!car) return;
  const cards = getCards();
  const carRect = car.getBoundingClientRect();
  const cx = carRect.left + carRect.width / 2;
  let best = 0, bestD = Infinity;
  cards.forEach((c, i) => {
    const r = c.getBoundingClientRect();
    const ccx = r.left + r.width / 2;
    const d = Math.abs(ccx - cx);
    if (d < bestD) { bestD = d; best = i; }
  });
  if (best !== activeIdx) {
    activeIdx = best;
    updateActiveCard();
    playClick();
  }
}

function setupCarousel() {
  const car = $('[data-carousel]');
  if (!car) return;

  /* ---- drag-to-scroll (pointer events) ----
     Only mouse drag enters this code path. On touch we let the browser's
     native horizontal scroll do its thing (better inertia, snap behaviour). */
  let dragging = false, startX = 0, startLeft = 0, didDrag = false;
  const DRAG_THRESHOLD = 6; /* px before we consider it a drag rather than a click */

  car.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; didDrag = false;
    startX = e.clientX; startLeft = car.scrollLeft;
    car.classList.add('is-dragging');
  });
  car.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) didDrag = true;
    if (didDrag) car.scrollLeft = startLeft - dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    car.classList.remove('is-dragging');
    if (didDrag) {
      // snap to nearest after a real drag
      setTimeout(() => snapToCard(activeIdx, true), 50);
    }
  };
  car.addEventListener('pointerup', endDrag);
  car.addEventListener('pointercancel', endDrag);

  /* swallow click ONLY if a real drag just happened — otherwise let the
     <a href="#/p/:id"> default navigation fire */
  car.addEventListener('click', (e) => {
    if (didDrag) {
      e.preventDefault();
      e.stopPropagation();
      didDrag = false;
    }
  }, true);

  /* ---- scroll → detect active (throttled) ---- */
  let raf = 0;
  car.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; detectActiveOnScroll(); });
  });

  /* ---- arrows ---- */
  $('[data-carousel-prev]')?.addEventListener('click', () => goCarousel(-1));
  $('[data-carousel-next]')?.addEventListener('click', () => goCarousel(+1));

  /* ---- keyboard ---- */
  document.addEventListener('keydown', (e) => {
    if (currentRoute().name !== 'home') return;
    if (e.target?.matches?.('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goCarousel(+1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goCarousel(-1); }
  });
}

function goCarousel(delta) {
  const cards = getCards();
  const next = Math.max(0, Math.min(cards.length - 1, activeIdx + delta));
  if (next === activeIdx) return;
  activeIdx = next;
  snapToCard(activeIdx, true);
  updateActiveCard();
  playClick();
}

/* ----- 7. About --------------------------------------------------------- */
function aboutHtml(a) {
  /* legacy fallback: tolerate old in-code seedData() shape (ledeEn/ledeCn/bioEn/bioCn/portraitCaption*) */
  const lede = lang === 'zh'
    ? (a.lede?.cn ?? a.ledeCn ?? '')
    : (a.lede?.en ?? a.ledeEn ?? '');
  const bioArr = lang === 'zh'
    ? (a.bio?.cn ?? a.bioCn ?? [])
    : (a.bio?.en ?? a.bioEn ?? []);
  const cap = lang === 'zh'
    ? (a.portraitCaption?.cn ?? a.portraitCaptionCn ?? '')
    : (a.portraitCaption?.en ?? a.portraitCaptionEn ?? '');
  const bio = bioArr.map((p) => `<p>${escapeHtml(p)}</p>`).join('');

  /* contact is now a fixed object: {email, studio:{en,cn}, instagram, wechat}
     (legacy array shape still tolerated to render old data after a refresh) */
  const c = a.contact || {};
  const contactRows = [];
  const push = (labelEn, labelCn, value) => {
    if (!value) return;
    const lbl = lang === 'zh' ? labelCn : labelEn;
    contactRows.push(`<dt>${escapeHtml(lbl)}</dt><dd>${escapeHtml(value)}</dd>`);
  };
  if (Array.isArray(c)) {
    for (const it of c) {
      const dt = it.label ? (lang === 'zh' ? it.label.cn : it.label.en) : (lang === 'zh' ? it.cn : it.en);
      const dd = it.value && typeof it.value === 'object'
        ? (lang === 'zh' ? it.value.cn : it.value.en)
        : (it.value ?? (lang === 'zh' ? it.valueCn : it.valueEn));
      if (dt && dd) contactRows.push(`<dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd>`);
    }
  } else {
    push('Email',     '邮箱',     c.email);
    push('Studio',    '工作室',   lang === 'zh' ? c.studio?.cn : c.studio?.en);
    push('Instagram', 'Instagram', c.instagram);
    push('Wechat',    '微信',     c.wechat);
  }
  const contact = contactRows.join('');

  const ledeCls = lang === 'zh' ? 'about__lede about__lede--cn' : 'about__lede';
  const bodyCls = lang === 'zh' ? 'about__body about__body--cn' : 'about__body';

  const portrait = a.portrait;
  const portraitCls = portrait?.url
    ? 'placeholder placeholder--portrait placeholder--has-image'
    : 'placeholder placeholder--portrait';
  const portraitInner = portrait?.url
    ? imgTag(portrait.url, {
        widths: [400, 600, 800, 1200],
        sizes: '(max-width: 720px) 100vw, 280px',
        alt: 'Portrait',
      })
    : '<span>PORTRAIT</span>';

  return `
    <figure class="about__portrait">
      <div class="${portraitCls}" aria-label="Portrait">${portraitInner}</div>
      <figcaption>${escapeHtml(cap)}</figcaption>
    </figure>
    <div class="${bodyCls}">
      <p class="${ledeCls}">${escapeHtml(lede)}</p>
      ${bio}
      <dl class="about__contact">${contact}</dl>
    </div>
  `;
}

/* ----- 8. Detail (magazine collage) ------------------------------------- */

/* Decide grid spans for a 12-col layout based on aspect ratio + index.
   First image is hero (larger). Subsequent images get 3-6 col widths
   depending on whether they're landscape, square, or portrait. */
function spansFor(r, i) {
  if (i === 0) {
    if (r > 1.25)  return { cols: 8, rows: 6 };
    if (r > 0.95)  return { cols: 6, rows: 6 };
    return                { cols: 5, rows: 8 };
  }
  if (r > 1.35)    return { cols: 6, rows: 4 };
  if (r > 0.95)    return { cols: 4, rows: 4 };
  if (r > 0.7)     return { cols: 3, rows: 5 };
  return                  { cols: 3, rows: 6 };
}

function magazineGridHtml(images) {
  if (!images?.length) return '';
  const items = [];
  images.forEach((img, i) => {
    const w = img.w || 3, h = img.h || 4;
    const r = w / h;
    const { cols, rows } = spansFor(r, i);
    const phClass = img.url ? 'ph ph--has-image' : 'ph';
    const phInner = img.url ? imgTag(img.url, {
      widths: [600, 900, 1200, 1800],
      sizes: '(max-width: 720px) 50vw, 25vw',
    }) : '';
    items.push(`<div class="${phClass}"
      data-label="${String(i + 1).padStart(2, '0')}"
      data-ratio="${w}:${h}"
      style="grid-column: span ${cols}; grid-row: span ${rows}; aspect-ratio: ${w}/${h};">${phInner}</div>`);
    /* sprinkle a small black square every 4th image, breaks the rhythm */
    if (i > 0 && i % 4 === 0 && i < images.length - 1) {
      items.push(`<div class="detail__deco" aria-hidden="true"
        style="grid-column: span 1; grid-row: span 1;"></div>`);
    }
  });
  return items.join('');
}

function detailNavHtml(activeId) {
  return DATA.projects.map((p) => `
    <li data-detail-id="${escapeHtml(p.id)}"
        class="${p.id === activeId ? 'is-active' : ''}"
        title="${escapeHtml(lang === 'zh' ? p.nameCn : p.nameEn)}">
      ${escapeHtml(p.no)}
    </li>
  `).join('');
}

function detailBodyHtml(p) {
  const name = lang === 'zh' ? p.nameCn : p.nameEn;
  const copy = lang === 'zh' ? p.cn     : p.en;
  const idx  = DATA.projects.findIndex((x) => x.id === p.id) + 1;
  const total = DATA.projects.length;

  const nameCls = lang === 'zh' ? 'detail__name detail__name--cn' : 'detail__name';
  const copyCls = lang === 'zh' ? 'detail__copy detail__copy--cn' : 'detail__copy';

  return `
    <aside class="detail__meta">
      <div class="detail__num">${escapeHtml(p.no)}</div>
      <h1 class="${nameCls}">${escapeHtml(name)}</h1>
      <p class="${copyCls}">${escapeHtml(copy)}</p>
      <div class="detail__progress">${escapeHtml(t('detail_progress'))} ${idx} / ${total}</div>
    </aside>
    <div class="detail__grid">${magazineGridHtml(p.images)}</div>
  `;
}

function renderDetail(id) {
  const p = DATA.projects.find((x) => x.id === id);
  if (!p) { location.hash = '#/index'; return; }
  $('[data-detail-content]').innerHTML = detailBodyHtml(p);
  $('[data-detail-nav]').innerHTML = detailNavHtml(id);

  // arrow disabled state
  const idx = DATA.projects.findIndex((x) => x.id === id);
  $('[data-detail-prev]').disabled = idx === 0;
  $('[data-detail-next]').disabled = idx === DATA.projects.length - 1;

  // scroll active nav item into view
  const activeLi = $('[data-detail-nav] li.is-active');
  activeLi?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function setupDetailNav() {
  $('[data-detail-nav]')?.addEventListener('click', (e) => {
    const li = e.target.closest('[data-detail-id]');
    if (!li) return;
    location.hash = `#/p/${li.dataset.detailId}`;
    playClick();
  });
  $('[data-detail-prev]')?.addEventListener('click', () => stepDetail(-1));
  $('[data-detail-next]')?.addEventListener('click', () => stepDetail(+1));

  document.addEventListener('keydown', (e) => {
    if (currentRoute().name !== 'detail') return;
    if (e.target?.matches?.('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepDetail(+1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stepDetail(-1); }
    if (e.key === 'Escape')     { location.hash = '#/index'; }
  });
}

function stepDetail(delta) {
  const route = currentRoute();
  if (route.name !== 'detail') return;
  const idx = DATA.projects.findIndex((p) => p.id === route.id);
  const next = idx + delta;
  if (next < 0 || next >= DATA.projects.length) return;
  location.hash = `#/p/${DATA.projects[next].id}`;
  playClick();
}

/* ----- 9. Router -------------------------------------------------------- */
function currentRoute() {
  const h = location.hash || '#/';
  if (h.startsWith('#/p/')) return { name: 'detail', id: h.slice(4) };
  if (h === '#/index')      return { name: 'index' };
  if (h === '#/about')      return { name: 'about' };
  return { name: 'home' };
}

function showView(name) {
  $$('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== name; });
  // mark active nav link
  $$('.site-nav a').forEach((a) => a.classList.remove('is-active'));
}

function handleRoute() {
  const route = currentRoute();
  if (route.name === 'detail') {
    showView('detail');
    renderDetail(route.id);
    window.scrollTo({ top: 0 });
    return;
  }
  showView('home');
  // anchor-scroll within home
  if (route.name === 'index') {
    $('#index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (route.name === 'about') {
    $('#about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ----- 10. Mount -------------------------------------------------------- */
function renderAll() {
  /* merge editable cover copy into i18n dict so data-i18n bindings reflect KV */
  mergeCoverIntoI18n();
  applyStaticI18n();
  /* cover image + portrait — inject <img> if URL exists */
  injectImageIntoPlaceholder($('.placeholder--cover'),    DATA.cover?.photo);
  const brandEn = $('.brand__en');
  if (brandEn) brandEn.innerHTML = (DATA.site?.brandEn || '').replace(/ /g, '&nbsp;');
  renderCarousel();
  renderFeaturedVideos();
  $('.about__grid').innerHTML = aboutHtml(DATA.about || {});
  /* re-render detail if currently viewing it */
  if (currentRoute().name === 'detail') renderDetail(currentRoute().id);
}

function renderFeaturedVideos() {
  const wrap = $('[data-videos]');
  if (!wrap) return;
  /* compat: legacy single `video` object → wrap into one-element array */
  let list = Array.isArray(DATA.videos) ? DATA.videos : [];
  if (!list.length && DATA.video?.url) list = [DATA.video];
  if (!list.length) {
    wrap.innerHTML = `<div class="video-placeholder">no videos uploaded</div>`;
    return;
  }
  wrap.innerHTML = list
    .filter((v) => v?.url)
    .map((v) => {
      const src = rawSrc(v.url);
      /* inline aspect-ratio = width preserved at uniform card height */
      const ratio = (v.w && v.h) ? `${v.w}/${v.h}` : '16/9';
      return `
        <article class="video-card">
          <video src="${escapeHtml(src)}"
                 controls preload="metadata" playsinline
                 style="aspect-ratio:${ratio}"></video>
          ${v.title ? `<h3 class="video-card__title">${escapeHtml(v.title)}</h3>` : ''}
          ${v.description ? `<p class="video-card__desc">${escapeHtml(v.description)}</p>` : ''}
        </article>
      `;
    }).join('');
}

function bindGlobalEvents() {
  // header clock
  const clock = $('[data-clock]');
  if (clock) {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      clock.textContent = `${hh}:${mm} SGT`;
    };
    tick(); setInterval(tick, 30 * 1000);
  }

  window.addEventListener('hashchange', handleRoute);
  // intercept all data-route links so it works as SPA without page jump
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-route]');
    if (!a) return;
    // let browser handle hash change; we play a click for nav feedback
    playClick({ freq: 3000, vol: 0.08 });
  });
}

async function fetchData() {
  try {
    const r = await fetch('/api/data', { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (j && typeof j === 'object' && Object.keys(j).length) return j;
  } catch (_) { /* fall through to seed */ }
  return seedData();
}

async function mount() {
  bindSoundToggle();
  bindGlobalEvents();
  /* show seedData immediately so first paint isn't blank, then swap with API data */
  DATA = normalizeData(seedData());
  renderAll();
  setupCarousel();
  setupDetailNav();
  handleRoute();
  /* live API */
  const live = await fetchData();
  DATA = normalizeData(live);
  renderAll();
}

mount();
