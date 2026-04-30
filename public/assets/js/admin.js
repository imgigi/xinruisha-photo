/* ==========================================================================
   Admin · xinruisha-photo
   - login (cookie) → load /api/data → edit → PUT /api/data
   - image upload posts width/height (browser-detected) alongside files
   ========================================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

let state       = null;          // current edited data
let saved       = null;          // last persisted snapshot
let section     = 'settings';    // active sidebar section
let activeProjId = null;         // active project being edited
let activeVidId  = null;         // active video being edited

/* ---------- deep get/set --------------------------------------------------*/
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = isNaN(+keys[keys.indexOf(k) + 1]) ? {} : [];
    return o[k];
  }, obj);
  target[last] = value;
}

/* ---------- dirty / status ------------------------------------------------*/
function isDirty() { return JSON.stringify(state) !== JSON.stringify(saved); }
function setStatus(text, cls = '') {
  const s = $('[data-status]');
  s.textContent = text;
  s.className = 'savebar__status' + (cls ? ' ' + cls : '');
}
function refreshStatus() {
  if (isDirty()) setStatus('● 有未保存改动', 'is-dirty');
  else setStatus('—');
}

/* ---------- auth ----------------------------------------------------------*/
async function checkAuth() {
  try {
    const r = await fetch('/api/me');
    return (await r.json()).authed === true;
  } catch { return false; }
}

async function loginSubmit(e) {
  e.preventDefault();
  const password = new FormData(e.target).get('password');
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (r.ok) location.reload();
  else {
    const j = await r.json().catch(() => ({}));
    const el = $('[data-login-error]');
    el.textContent = j.error || '登录失败';
    el.hidden = false;
  }
}

async function logout() {
  if (isDirty() && !confirm('有未保存改动，确认退出？')) return;
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

/* ---------- data ----------------------------------------------------------*/
async function loadData() {
  const r = await fetch('/api/data');
  state = await r.json();
  // ensure required structure
  state.site     ??= {};
  state.cover    ??= {};
  state.videos   ??= [];
  /* migrate legacy single `video` object → first entry of new `videos` array */
  if (state.video?.key && !state.videos.some(v => v.key === state.video.key)) {
    state.videos.unshift({
      id: 'v-' + Date.now().toString(36),
      title: '', description: '',
      key: state.video.key, url: state.video.url, size: state.video.size || 0,
    });
  }
  delete state.video;
  /* ensure every video has an id (so list/drag/edit can key on it) */
  for (const v of state.videos) v.id ??= 'v-' + Math.random().toString(36).slice(2, 9);
  state.projects ??= [];
  state.about    ??= {};
  state.about.bio     ??= { en: [], cn: [] };
  state.about.contact ??= [];
  for (const p of state.projects) {
    p.images ??= [];
    p.medium ??= { en: '', cn: '' };
  }
  saved = JSON.parse(JSON.stringify(state));
}

async function saveData() {
  setStatus('保存中…');
  const btn = $('[data-save]');
  btn.disabled = true;
  try {
    const r = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!r.ok) throw new Error(await r.text());
    saved = JSON.parse(JSON.stringify(state));
    setStatus('✓ 已保存 · ' + new Date().toLocaleTimeString(), 'is-ok');
  } catch (e) {
    setStatus('保存失败：' + (e.message || e), 'is-dirty');
  } finally {
    btn.disabled = false;
  }
}

/* ==========================================================================
   Render: building blocks
   ========================================================================== */

/* English-only single-field input (writes to ${path}.en).
   Keeps the underlying data shape {en, cn} so existing KV records still load,
   but the .cn slot is simply never written from now on. */
function pairObj(path, label, val = {}, area = false) {
  const v = (val && val.en !== undefined) ? val.en : (typeof val === 'string' ? val : '');
  const open  = area ? '<textarea' : '<input type="text"';
  const close = area ? '</textarea>' : ' />';
  const attr  = area ? '' : `value="${esc(v || '')}"`;
  const inner = area ? esc(v || '') : '';
  return `
    <div class="field"><label>${esc(label)}</label>${open} data-path="${path}.en" ${attr}>${inner}${close}</div>
  `;
}

/* English-only flat field (writes to a flat path, ignores Chinese sibling). */
function pairFlat(label, pathEn, _pathCn, valEn, _valCn, area = false) {
  const open  = area ? '<textarea' : '<input type="text"';
  const close = area ? '</textarea>' : ' />';
  const attr  = area ? '' : `value="${esc(valEn || '')}"`;
  const inner = area ? esc(valEn || '') : '';
  return `
    <div class="field"><label>${esc(label)}</label>${open} data-path="${pathEn}" ${attr}>${inner}${close}</div>
  `;
}

function imagePicker(path, img) {
  const has = !!img?.key;
  const url = has ? esc(previewUrl(img.url || '')) : '';
  const meta = has ? `${img.w || '?'} × ${img.h || '?'}` : '';
  return `
    <div class="image-picker" data-image-block="${path}">
      <div class="image-picker__preview">
        ${has ? `<img src="${url}" alt="" />` : `<span>无图</span>`}
      </div>
      <div class="image-picker__actions">
        <input type="file" accept="image/*" data-single-image="${path}" hidden />
        <button type="button" data-pick="${path}">${has ? '更换' : '上传'}</button>
        ${has ? `<button type="button" data-clear-image="${path}">移除</button>` : ''}
        ${meta ? `<div class="image-picker__meta">${esc(meta)}</div>` : ''}
      </div>
    </div>
  `;
}

/* ==========================================================================
   Render: sections
   ========================================================================== */

function renderSettings() {
  const s = state.site;
  return `
    <section>
      <h2 class="section-title">站点设置</h2>
      <p class="section-hint">网页头部品牌名（中英文同时显示）</p>
      <div class="field-pair">
        <div class="field"><label>品牌中文</label>
          <input type="text" data-path="site.brandCn" value="${esc(s.brandCn || '')}" /></div>
        <div class="field"><label>品牌英文</label>
          <input type="text" data-path="site.brandEn" value="${esc(s.brandEn || '')}" /></div>
      </div>
    </section>
  `;
}

function renderFeaturedVideos() {
  const list = state.videos || [];
  return `
    <section>
      <h2 class="section-title">视频（${list.length}）</h2>
      <p class="section-hint">展示在前台索引下方，左右滑动 · 拖拽 ⋮⋮ 排序 · 视频按原始比例展示，高度统一 · 视频不压缩，建议每个 &lt; 30MB</p>

      <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
        <button type="button" class="btn-text" data-vid-add>+ 新增视频</button>
      </div>

      <div class="vid-cards" data-vid-list>
        ${list.length
          ? list.map((v) => vidCardHtml(v)).join('')
          : '<p class="section-hint">暂无视频，点击右上方"+ 新增视频"开始添加。</p>'}
      </div>
    </section>
  `;
}

function vidCardHtml(v) {
  const idx = state.videos.findIndex((x) => x.id === v.id);
  const base = `videos.${idx}`;
  const has = !!v.key;
  const src = has ? esc(previewUrl(v.url || '')) : '';
  const sizeMb = has ? (v.size / 1024 / 1024).toFixed(1) + ' MB' : '';
  const dim = (v.w && v.h) ? `${v.w}×${v.h}` : '';
  return `
    <div class="vid-card" draggable="true" data-vid-id="${esc(v.id)}">
      <div class="vid-card__handle" title="拖拽排序">⋮⋮</div>

      <div class="vid-card__preview">
        ${has
          ? `<video src="${src}" preload="metadata" muted></video>`
          : `<div class="vid-card__noimg">无视频</div>`}
      </div>

      <div class="vid-card__fields">
        <div class="field" style="margin-bottom:8px;">
          <label>标题</label>
          <input type="text" data-path="${base}.title" value="${esc(v.title || '')}" placeholder="给视频起个标题" />
        </div>
        <div class="field" style="margin-bottom:8px;">
          <label>简介</label>
          <textarea data-path="${base}.description" rows="2" placeholder="一句话或一段话介绍这个视频">${esc(v.description || '')}</textarea>
        </div>
        <div class="vid-card__file">
          <input type="file" accept="video/*" data-vid-file="${idx}" hidden />
          <button type="button" class="btn-text" data-vid-pick="${idx}">${has ? '更换视频' : '上传视频'}</button>
          ${has ? `<button type="button" class="btn-text btn-text--danger" data-vid-clear="${idx}">移除文件</button>` : ''}
          ${has ? `<span class="vid-card__meta">${esc(sizeMb)}${dim ? ' · ' + esc(dim) : ''}</span>` : ''}
        </div>
      </div>

      <button type="button" class="vid-card__del" data-vid-del="${esc(v.id)}" title="删除整个视频">×</button>
    </div>
  `;
}

function renderCover() {
  const c = state.cover;
  return `
    <section>
      <h2 class="section-title">封面</h2>
      <p class="section-hint">网页第一屏：左侧大图 + 右侧黑色色块（大标题 + 小标题）</p>

      <div class="field"><label>封面图（左侧大图）</label>${imagePicker('cover.photo', c.photo)}</div>

      <hr class="divider" />
      <p class="section-hint" style="margin-top: 0;">大标题（分 3 行显示，斜体在中间）</p>
      ${pairObj('cover.title1', '大标题 · 第 1 行', c.title1 || {})}
      ${pairObj('cover.title2', '大标题 · 第 2 行（斜体）', c.title2 || {})}
      ${pairObj('cover.title3', '大标题 · 第 3 行', c.title3 || {})}

      <hr class="divider" />
      ${pairObj('cover.byline', '小标题（一句话副标语）', c.byline || {}, true)}
    </section>
  `;
}

function renderProjects() {
  const projects = state.projects;

  let editorHtml = `<p class="section-hint">从上方点一个项目开始编辑，或点击"+ 新增项目"。</p>`;
  const active = projects.find(p => p.id === activeProjId);
  if (active) editorHtml = projEditorHtml(active);

  return `
    <section>
      <h2 class="section-title">项目（${projects.length}）</h2>
      <p class="section-hint">拖拽 ⋮⋮ 调整顺序 · 点击行编辑 · × 移除项目（不会删图）</p>

      <div class="proj-toolbar">
        <div></div>
        <div class="proj-toolbar__actions">
          <button type="button" class="btn-text" data-proj-add>+ 新增项目</button>
        </div>
      </div>

      <div class="proj-list" data-proj-list>
        ${projects.map((p) => projRowHtml(p)).join('')}
      </div>

      <div class="proj-editor">${editorHtml}</div>
    </section>
  `;
}

function projRowHtml(p) {
  return `
    <div class="proj-list__row ${p.id === activeProjId ? 'is-active' : ''}"
         draggable="true"
         data-proj-id="${esc(p.id)}">
      <div class="proj-list__handle">⋮⋮</div>
      <div class="proj-list__no">${esc(p.no || '')}</div>
      <div class="proj-list__name">${esc(p.nameCn || '(未命名)')}<span style="color:#999"> · ${esc(p.nameEn || '')}</span></div>
      <div class="proj-list__count">${p.isVideo ? '视频' : (p.images?.length || 0) + ' 张'}</div>
      <button type="button" class="proj-list__del" data-proj-del="${esc(p.id)}" title="删除">×</button>
    </div>
  `;
}

function projEditorHtml(p) {
  const idx = state.projects.findIndex(x => x.id === p.id);
  const base = `projects.${idx}`;
  return `
    <div class="proj-editor__head">
      <h3>编辑项目</h3>
      <span class="id-tag">${esc(p.no || '—')}</span>
    </div>

    ${pairFlat('项目名', `${base}.nameEn`, `${base}.nameCn`, p.nameEn, p.nameCn)}
    ${pairFlat('项目介绍', `${base}.en`, `${base}.cn`, p.en, p.cn, true)}

    <hr class="divider" />
    <div class="field"><label>封面图（在索引页 carousel 上展示的那张）</label>
      ${imagePicker(`${base}.cover`, p.cover)}
    </div>

    <hr class="divider" />
    ${projImagesHtml(p, idx)}
  `;
}

function projImagesHtml(p, idx) {
  const items = p.images.map((img, i) => galleryItemHtml(img, i)).join('');
  return `
    <h3 style="margin: 0 0 0.6rem; font-size: 14px;">详细图（${p.images.length} 张 · 拖拽调整顺序）</h3>
    <div class="gallery-grid" data-gallery="${idx}">${items}</div>
    <div class="uploader" data-uploader-idx="${idx}">
      <span>把图片拖到这里 · 或</span>
      <input type="file" id="up-${idx}" multiple accept="image/*" data-uploader-input="${idx}" />
      <label for="up-${idx}">选择文件</label>
      <div class="uploader-progress" data-progress hidden></div>
    </div>
  `;
}

function galleryItemHtml(img, i) {
  const has = !!img.key;
  const ratio = `${img.w || '?'}:${img.h || '?'}`;
  return `
    <div class="gallery-item" draggable="true" data-img-i="${i}">
      ${has ? `<img src="${esc(previewUrl(img.url || ''))}" alt="" />`
            : `<div class="gallery-item__placeholder">PLACE ${String(i+1).padStart(2,'0')}</div>`}
      <span class="gallery-item__no">${String(i+1).padStart(2,'0')}</span>
      <span class="gallery-item__ratio">${esc(ratio)}</span>
      <button type="button" class="gallery-item__del" data-img-del="${i}" title="删除">×</button>
    </div>
  `;
}

function renderAbout() {
  const a = state.about;
  /* contact has been simplified to a fixed object: {email, studio:{en,cn}, instagram, wechat} */
  a.contact ??= {};
  return `
    <section>
      <h2 class="section-title">关于</h2>
      <p class="section-hint">作者头像、自我介绍、联系方式</p>

      <div class="field"><label>头像</label>${imagePicker('about.portrait', a.portrait)}</div>
      ${pairObj('about.lede', '一句话介绍（大字）', a.lede || {}, true)}

      <hr class="divider" />
      <h3 style="margin: 0 0 0.6rem; font-size: 14px;">详细介绍</h3>
      <p class="section-hint" style="margin-bottom: 0.8rem;">每段一行 · 中英分开</p>
      ${aboutBioHtml(a.bio)}

      <hr class="divider" />
      <h3 style="margin: 0 0 0.6rem; font-size: 14px;">联系方式</h3>
      <p class="section-hint" style="margin-bottom: 0.8rem;">留空则不在前台显示该项</p>
      <div class="field"><label>邮箱</label>
        <input type="text" data-path="about.contact.email" value="${esc(a.contact.email || '')}" placeholder="hello@xinruisha.com" /></div>
      ${pairObj('about.contact.studio', '工作室', a.contact.studio || {})}
      <div class="field"><label>Instagram</label>
        <input type="text" data-path="about.contact.instagram" value="${esc(a.contact.instagram || '')}" placeholder="@xinruisha" /></div>
      <div class="field"><label>微信</label>
        <input type="text" data-path="about.contact.wechat" value="${esc(a.contact.wechat || '')}" placeholder="xinruisha-photo" /></div>
    </section>
  `;
}

function aboutBioHtml(bio) {
  const rows = (bio.en || []).map((p, i) => `
    <div class="field"><label>段落 ${i + 1}</label>
      <textarea data-bio="en" data-bio-i="${i}">${esc(p)}</textarea></div>
  `).join('');
  return `
    <div class="bio-list">
      <div>${rows}</div>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button type="button" class="btn-text" data-bio-add>+ 增加一段</button>
        <button type="button" class="btn-text btn-text--danger" data-bio-pop>− 删除最后一段</button>
      </div>
    </div>
  `;
}

function aboutContactHtml(contact) {
  return `
    <div class="contact-list">
      ${contact.map((c, i) => `
        <div class="contact-row">
          <input type="text" placeholder="标签 · 英" data-contact-i="${i}" data-contact-f="label.en" value="${esc(c.label?.en || '')}" />
          <input type="text" placeholder="标签 · 中" data-contact-i="${i}" data-contact-f="label.cn" value="${esc(c.label?.cn || '')}" />
          <input type="text" placeholder="内容 · 英" data-contact-i="${i}" data-contact-f="value.en" value="${esc(c.value?.en || '')}" />
          <input type="text" placeholder="内容 · 中" data-contact-i="${i}" data-contact-f="value.cn" value="${esc(c.value?.cn || '')}" />
          <button type="button" class="contact-row__del" data-contact-del="${i}">×</button>
        </div>
      `).join('')}
    </div>
    <button type="button" class="btn-text" data-contact-add>+ 新增联系方式</button>
  `;
}

/* ==========================================================================
   Top-level render
   ========================================================================== */
function render() {
  const c = $('[data-content]');
  if (!c) return;
  const map = {
    settings: renderSettings,
    cover:    renderCover,
    video:    renderFeaturedVideos,
    projects: renderProjects,
    about:    renderAbout,
  };
  c.innerHTML = (map[section] || renderSettings)();
  refreshStatus();
}

function setSection(name) {
  section = name;
  $$('[data-section]').forEach(a => a.classList.toggle('is-active', a.dataset.section === name));
  render();
}

/* ==========================================================================
   Image upload (browser detects width/height before POST)
   ========================================================================== */

/* ---- compress in browser before upload ----
   - Re-sample with Canvas so the long side <= MAX_LONG (default 2400px)
   - Re-encode as JPEG q=0.85 (strips EXIF + slashes file size)
   - Skip GIF / SVG (would lose animation / vector)
   - Skip already-small JPEGs (no benefit, just CPU)
   Returns { file, w, h, originalSize, finalSize } so the uploader can
   show the savings and post the *post-compression* dimensions. */
const MAX_LONG = 2400;
const QUALITY  = 0.85;

async function compressImage(file) {
  const skip = !file.type.startsWith('image/')
            || file.type === 'image/svg+xml'
            || file.type === 'image/gif';
  if (skip) {
    const sz = await readSize(file);
    return { file, w: sz.w, h: sz.h, originalSize: file.size, finalSize: file.size };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload  = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const ow = img.naturalWidth, oh = img.naturalHeight;
    const long = Math.max(ow, oh);
    const scale = long > MAX_LONG ? MAX_LONG / long : 1;
    /* fast path: already tiny + already JPEG → no recompress */
    if (scale === 1 && file.type === 'image/jpeg' && file.size < 600 * 1024) {
      return { file, w: ow, h: oh, originalSize: file.size, finalSize: file.size };
    }
    const tw = Math.round(ow * scale);
    const th = Math.round(oh * scale);
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(img, 0, 0, tw, th);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) {
      /* compression made it larger (rare for already-optimised JPEGs) → keep original */
      return { file, w: ow, h: oh, originalSize: file.size, finalSize: file.size };
    }
    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    const newFile = new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
    return { file: newFile, w: tw, h: th, originalSize: file.size, finalSize: newFile.size };
  } catch (_) {
    /* fall back to original on any decoding error */
    const sz = await readSize(file);
    return { file, w: sz.w, h: sz.h, originalSize: file.size, finalSize: file.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readVideoSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      resolve({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
    v.src = url;
  });
}

async function readSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ w: 0, h: 0 });                                 URL.revokeObjectURL(url); };
    img.src = url;
  });
}

const fmtKB = (b) => (b / 1024).toFixed(0) + ' KB';

/* In wrangler dev, upload.js stamps URLs as https://img.ggjj.app/... but the
   bytes actually live in the local R2 simulator. Rewrite to same-origin
   /api/image/... for previews. In prod (any non-localhost host), pass through. */
function previewUrl(url) {
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

async function uploadFiles(rawFiles, onProgress) {
  /* compress sequentially to avoid OOM on huge multi-uploads */
  const processed = [];
  for (let i = 0; i < rawFiles.length; i++) {
    onProgress?.(`压缩中 ${i + 1} / ${rawFiles.length} …`);
    processed.push(await compressImage(rawFiles[i]));
  }
  const totalBefore = processed.reduce((s, x) => s + x.originalSize, 0);
  const totalAfter  = processed.reduce((s, x) => s + x.finalSize,    0);
  const saved = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
  onProgress?.(`上传中 · 压缩 ${fmtKB(totalBefore)} → ${fmtKB(totalAfter)} (-${saved}%) …`);

  const fd = new FormData();
  processed.forEach(({ file, w, h }) => {
    fd.append('files',   file);
    fd.append('widths',  String(w));
    fd.append('heights', String(h));
  });

  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || ('upload ' + r.status));
  }
  return (await r.json()).files;
}

async function deleteImageFromR2(key) {
  if (!key) return;
  await fetch('/api/image/' + encodeURI(key), { method: 'DELETE' }).catch(() => {});
}

/* ==========================================================================
   Event delegation: inputs
   ========================================================================== */
function bindGlobalInput() {
  const c = $('[data-content]');
  c.addEventListener('input', (e) => {
    const el = e.target;

    // generic data-path inputs
    if (el.dataset.path) {
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else v = el.value;
      setPath(state, el.dataset.path, v);

      // if the project being edited had its no/name changed, also refresh the row label
      // (cheap: only repaint the proj-list, keep editor focus)
      if (section === 'projects' && el.dataset.path.startsWith('projects.')) {
        const m = el.dataset.path.match(/^projects\.(\d+)\.(no|nameEn|nameCn|isVideo)$/);
        if (m) repaintProjList();
      }

      refreshStatus();
      return;
    }

    // bio paragraph
    if (el.dataset.bio) {
      const i = +el.dataset.bioI;
      state.about.bio[el.dataset.bio][i] = el.value;
      refreshStatus();
      return;
    }

    // contact entry
    if (el.dataset.contactI) {
      const i = +el.dataset.contactI;
      const path = el.dataset.contactF;  // e.g. "label.en"
      const [outer, inner] = path.split('.');
      state.about.contact[i] ??= {};
      state.about.contact[i][outer] ??= {};
      state.about.contact[i][outer][inner] = el.value;
      refreshStatus();
      return;
    }
  });
}

function repaintProjList() {
  const list = $('[data-proj-list]');
  if (!list) return;
  list.innerHTML = state.projects.map((p) => projRowHtml(p)).join('');
}

/* ==========================================================================
   Event delegation: clicks
   ========================================================================== */
function bindGlobalClick() {
  const c = $('[data-content]');

  c.addEventListener('click', async (e) => {
    const el = e.target;

    /* ----- single image picker (cover photo, portrait) ----- */
    if (el.matches('[data-pick]')) {
      const path = el.dataset.pick;
      const input = c.querySelector(`[data-single-image="${CSS.escape(path)}"]`);
      input?.click();
      return;
    }
    /* ----- video cards (each is its own inline editor; no "select then edit") ----- */
    if (el.matches('[data-vid-add]')) {
      const id = 'v-' + Date.now().toString(36);
      state.videos.push({ id, title: '', description: '', key: null, url: null, size: 0, w: 0, h: 0 });
      render(); refreshStatus();
      /* scroll new card into view + focus its title field */
      setTimeout(() => {
        const card = $(`[data-vid-id="${id}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card?.querySelector('input[type="text"]')?.focus();
      }, 60);
      return;
    }
    if (el.matches('[data-vid-del]')) {
      e.stopPropagation();
      const id = el.dataset.vidDel;
      if (!confirm('确认删除这个视频？文件也会从存储里删掉。')) return;
      const v = state.videos.find((x) => x.id === id);
      if (v?.key) deleteImageFromR2(v.key);
      state.videos = state.videos.filter((x) => x.id !== id);
      render(); refreshStatus();
      return;
    }
    if (el.matches('[data-vid-pick]')) {
      const idx = +el.dataset.vidPick;
      const input = c.querySelector(`[data-vid-file="${idx}"]`);
      input?.click();
      return;
    }
    if (el.matches('[data-vid-clear]')) {
      const idx = +el.dataset.vidClear;
      const v = state.videos[idx];
      if (v?.key) deleteImageFromR2(v.key);
      v.key = null; v.url = null; v.size = 0; v.w = 0; v.h = 0;
      render(); refreshStatus();
      return;
    }
    if (el.matches('[data-clear-image]')) {
      const path = el.dataset.clearImage;
      const cur = getPath(state, path);
      if (cur?.key) deleteImageFromR2(cur.key);
      setPath(state, path, null);
      render();
      refreshStatus();
      return;
    }

    /* ----- project list ----- */
    if (el.matches('[data-proj-add]')) {
      const id = 'p-' + Date.now().toString(36);
      state.projects.push({
        id, no: String(state.projects.length + 1).padStart(2, '0'), year: '2025',
        nameEn: 'Untitled', nameCn: '未命名',
        medium: { en: 'Photography', cn: '摄影' },
        en: '', cn: '',
        isVideo: false, images: [],
      });
      activeProjId = id;
      render();
      refreshStatus();
      return;
    }
    if (el.matches('[data-proj-del]')) {
      e.stopPropagation();
      const id = el.dataset.projDel;
      if (!confirm('确认删除这个项目？图片不会自动删除。')) return;
      state.projects = state.projects.filter(p => p.id !== id);
      if (activeProjId === id) activeProjId = null;
      render();
      refreshStatus();
      return;
    }
    const row = el.closest('[data-proj-id]');
    if (row && !el.matches('[data-proj-del]')) {
      activeProjId = row.dataset.projId;
      render();
      return;
    }

    /* ----- gallery item delete ----- */
    if (el.matches('[data-img-del]')) {
      const i = +el.dataset.imgDel;
      const proj = state.projects.find(p => p.id === activeProjId);
      const img = proj?.images?.[i];
      if (img?.key) deleteImageFromR2(img.key);
      proj.images.splice(i, 1);
      render();
      refreshStatus();
      return;
    }

    /* ----- bio paragraphs add/remove ----- */
    if (el.matches('[data-bio-add]')) {
      state.about.bio.en ??= [];
      state.about.bio.en.push('');
      render(); refreshStatus(); return;
    }
    if (el.matches('[data-bio-pop]')) {
      state.about.bio.en?.pop();
      render(); refreshStatus(); return;
    }

    /* ----- contact add/remove ----- */
    if (el.matches('[data-contact-add]')) {
      state.about.contact.push({ label: { en: '', cn: '' }, value: { en: '', cn: '' } });
      render(); refreshStatus(); return;
    }
    if (el.matches('[data-contact-del]')) {
      const i = +el.dataset.contactDel;
      state.about.contact.splice(i, 1);
      render(); refreshStatus(); return;
    }
  });

  /* ----- single-image input change ----- */
  c.addEventListener('change', async (e) => {
    const el = e.target;

    if (el.matches('[data-single-image]')) {
      const path = el.dataset.singleImage;
      const file = el.files?.[0];
      if (!file) return;
      try {
        const cur = getPath(state, path);
        if (cur?.key) deleteImageFromR2(cur.key);
        const [up] = await uploadFiles([file], (m) => setStatus(m));
        setPath(state, path, up);
        setStatus('上传完成 ✓ 还没保存到 KV，请按右下角"保存"', 'is-dirty');
        render();
      } catch (err) {
        setStatus('上传失败：' + err.message, 'is-dirty');
      }
      el.value = '';
      return;
    }

    if (el.matches('[data-uploader-input]')) {
      const idx = +el.dataset.uploaderInput;
      const files = Array.from(el.files || []);
      if (!files.length) return;
      await uploadIntoProject(idx, files);
      el.value = '';
      return;
    }

    /* ----- video file upload to a specific videos[idx] (no compression, but
       browser detects videoWidth × videoHeight first so the front-end can
       render uniform-height cards while preserving each video's ratio) ----- */
    if (el.matches('[data-vid-file]')) {
      const idx = +el.dataset.vidFile;
      const file = el.files?.[0];
      if (!file) return;
      const v = state.videos[idx];
      if (!v) return;
      try {
        if (v.key) deleteImageFromR2(v.key);
        const sizeMb = (file.size / 1024 / 1024).toFixed(1);
        setStatus(`读取视频尺寸…`);
        const dim = await readVideoSize(file);
        setStatus(`上传中 ${sizeMb} MB${dim.w ? ' · ' + dim.w + '×' + dim.h : ''} · 视频不压缩，可能需要一会儿…`);
        const fd = new FormData();
        fd.append('files', file);
        fd.append('widths',  String(dim.w || 0));
        fd.append('heights', String(dim.h || 0));
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || ('upload ' + r.status));
        }
        const up = (await r.json()).files[0];
        v.key = up.key; v.url = up.url; v.size = up.size;
        v.w   = up.w   || dim.w;
        v.h   = up.h   || dim.h;
        setStatus(`视频上传完成 ✓ ${sizeMb} MB · 还没保存到 KV，请按右下角"保存"`, 'is-dirty');
        render();
      } catch (err) {
        setStatus('上传失败：' + err.message, 'is-dirty');
      }
      el.value = '';
      return;
    }
  });
}

async function uploadIntoProject(idx, files) {
  const proj = state.projects[idx];
  if (!proj) return;
  const progress = $('[data-progress]');
  if (progress) progress.hidden = false;
  const onProgress = (msg) => {
    if (progress) progress.textContent = msg;
    setStatus(msg);
  };
  try {
    const ups = await uploadFiles(files, onProgress);
    proj.images.push(...ups);
    setStatus(`上传 ${ups.length} 张 ✓ 还没保存到 KV，请按右下角"保存"`, 'is-dirty');
    render();
  } catch (err) {
    setStatus('上传失败：' + err.message, 'is-dirty');
  } finally {
    if (progress) progress.hidden = true;
  }
}

/* ==========================================================================
   Drag & drop: project rows + gallery items + uploader file-drop
   ========================================================================== */
function bindDragSort() {
  const content = $('[data-content]');

  let dragSrc = null;
  let dragKind = null;  // 'proj' | 'image'

  content.addEventListener('dragstart', (e) => {
    const projRow = e.target.closest('[data-proj-id]');
    const vidRow  = e.target.closest('[data-vid-id]');
    const imgItem = e.target.closest('[data-img-i]');
    if (projRow) {
      dragSrc = projRow; dragKind = 'proj';
    } else if (vidRow) {
      dragSrc = vidRow; dragKind = 'video';
    } else if (imgItem) {
      dragSrc = imgItem; dragKind = 'image';
    } else { return; }
    dragSrc.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });

  content.addEventListener('dragover', (e) => {
    if (!dragSrc) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target =
      dragKind === 'proj'  ? e.target.closest('[data-proj-id]') :
      dragKind === 'video' ? e.target.closest('[data-vid-id]')  :
                              e.target.closest('[data-img-i]');
    $$('.is-drop-over', content).forEach(el => el.classList.remove('is-drop-over'));
    if (target && target !== dragSrc) target.classList.add('is-drop-over');
  });

  content.addEventListener('drop', (e) => {
    if (!dragSrc) return;
    e.preventDefault();
    if (dragKind === 'proj') {
      const target = e.target.closest('[data-proj-id]');
      if (target && target !== dragSrc) {
        const from = state.projects.findIndex(p => p.id === dragSrc.dataset.projId);
        const to   = state.projects.findIndex(p => p.id === target.dataset.projId);
        const [item] = state.projects.splice(from, 1);
        state.projects.splice(to, 0, item);
        render(); refreshStatus();
      }
    } else if (dragKind === 'video') {
      const target = e.target.closest('[data-vid-id]');
      if (target && target !== dragSrc) {
        const from = state.videos.findIndex(v => v.id === dragSrc.dataset.vidId);
        const to   = state.videos.findIndex(v => v.id === target.dataset.vidId);
        const [item] = state.videos.splice(from, 1);
        state.videos.splice(to, 0, item);
        render(); refreshStatus();
      }
    } else if (dragKind === 'image') {
      const target = e.target.closest('[data-img-i]');
      if (target && target !== dragSrc) {
        const proj = state.projects.find(p => p.id === activeProjId);
        const from = +dragSrc.dataset.imgI;
        const to   = +target.dataset.imgI;
        const [item] = proj.images.splice(from, 1);
        proj.images.splice(to, 0, item);
        render(); refreshStatus();
      }
    }
    cleanupDrag();
  });

  content.addEventListener('dragend', cleanupDrag);

  function cleanupDrag() {
    if (dragSrc) dragSrc.classList.remove('is-dragging');
    $$('.is-drop-over', content).forEach(el => el.classList.remove('is-drop-over'));
    dragSrc = null; dragKind = null;
  }

  /* ---- file drop on uploader box ---- */
  content.addEventListener('dragenter', (e) => {
    const u = e.target.closest('[data-uploader-idx]');
    if (u && e.dataTransfer?.types?.includes('Files')) u.classList.add('is-over');
  });
  content.addEventListener('dragleave', (e) => {
    const u = e.target.closest('[data-uploader-idx]');
    if (u && !u.contains(e.relatedTarget)) u.classList.remove('is-over');
  });
  content.addEventListener('drop', async (e) => {
    const u = e.target.closest('[data-uploader-idx]');
    if (!u) return;
    e.preventDefault();
    u.classList.remove('is-over');
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    await uploadIntoProject(+u.dataset.uploaderIdx, files);
  });
  // prevent navigating away when dropping on body by accident
  document.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
  document.addEventListener('drop',     (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
}

/* ==========================================================================
   Boot
   ========================================================================== */
async function boot() {
  // hash → section
  const hash = location.hash.replace('#', '');
  if (['settings', 'cover', 'video', 'projects', 'about'].includes(hash)) section = hash;

  // login wiring
  const loginForm = $('[data-login-form]');
  loginForm?.addEventListener('submit', loginSubmit);

  const authed = await checkAuth();
  if (!authed) {
    $('#login').style.display = 'grid';
    $('#app').hidden = true;
    return;
  }
  $('#login').style.display = 'none';
  $('#app').hidden = false;

  // sidebar nav
  $('[data-nav]').addEventListener('click', (e) => {
    const a = e.target.closest('[data-section]');
    if (!a) return;
    e.preventDefault();
    location.hash = a.dataset.section;
    setSection(a.dataset.section);
  });

  // logout + save
  $('[data-logout]').addEventListener('click', logout);
  $('[data-save]').addEventListener('click', saveData);

  // warn on leave with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  // ⌘/Ctrl + S to save
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveData(); }
  });

  await loadData();

  bindGlobalInput();
  bindGlobalClick();
  bindDragSort();

  setSection(section);
}

boot();
