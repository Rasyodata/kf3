/* ============================================================
   SahaPro — Uygulama Mantığı (router + görünümler)
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (id) => document.getElementById(id);

/* ---- Yardımcılar ---- */
const fmtTL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0','') + ' Mr';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0','') + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' B';
  return '' + n;
};
// Uzun/okunur para biçimi — "415 Milyon TL" (dile duyarlı)
const SCALE = {
  tr: { b: 'Milyar', m: 'Milyon', k: 'Bin', cur: 'TL' },
  en: { b: 'Billion', m: 'Million', k: 'Thousand', cur: 'TL' },
  ar: { b: 'مليار', m: 'مليون', k: 'ألف', cur: 'ل.ت' },
  ru: { b: 'млрд', m: 'млн', k: 'тыс.', cur: 'TL' },
};
const numLoc = () => (typeof CURRENT_LANG !== 'undefined' && CURRENT_LANG === 'tr') ? 'tr-TR' : (CURRENT_LANG === 'ru' ? 'ru-RU' : 'en-US');
const fmtNum = (n) => Math.round(n).toLocaleString(numLoc());
const fmtDec = (n) => (Math.round(n * 100) / 100).toLocaleString(numLoc(), { maximumFractionDigits: 2 });
const fmtTLlong = (n) => {
  const u = SCALE[typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr'] || SCALE.tr;
  if (n >= 1e9) return `${fmtDec(n / 1e9)} ${u.b} ${u.cur}`;
  if (n >= 1e6) return `${fmtDec(n / 1e6)} ${u.m} ${u.cur}`;
  if (n >= 1e3) return `${fmtDec(n / 1e3)} ${u.k} ${u.cur}`;
  return `${fmtNum(n)} ${u.cur}`;
};
const fmtM2 = (n) => `${fmtNum(n)} m²`;
const sumArea = (list) => list.reduce((s, p) => s + (p.area || 0), 0);
const initials = (name) => name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const escapeHtml = (s = '') => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
// Çeviri yardımcıları (etiketler i18n'den gelir, cls sabit kalır)
const tRole = (r) => L('r_' + r);
const tStatus = (s) => L('st_' + s);
const tTask = (s) => L('ts_' + s);
const tPrio = (p) => L('pr_' + p);
const tMat = (m) => L('ms_' + m);
const STATUS = { devam: { cls: 'badge--yellow' }, tamamlandi: { cls: 'badge--green' }, planlanan: { cls: 'badge--accent' } };
const STATUS_KEYS = ['devam', 'tamamlandi', 'planlanan'];
const TASK_STATUS = { bekliyor: { cls: 'badge' }, devam: { cls: 'badge--yellow' }, tamamlandi: { cls: 'badge--green' } };
const TASK_STATUS_KEYS = ['bekliyor', 'devam', 'tamamlandi'];
const PRIO_KEYS = ['high', 'mid', 'low'];
const PRIO_CLS = { high: 'p-high', mid: 'p-mid', low: 'p-low' };
const fmtDate = (iso) => { const d = new Date(iso + 'T00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDateShort = (iso) => { const d = new Date(iso + 'T00:00'); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`; };

const avatar = (u, cls = '') => u
  ? `<div class="avatar ${cls}" style="background:${u.color}" title="${escapeHtml(u.name)}">${initials(u.name)}</div>`
  : `<div class="avatar ${cls}">?</div>`;

function toast(msg, type = 'ok') {
  let wrap = $('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const icon = { ok: '✓', info: 'ℹ', warn: '⚠' }[type] || '✓';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---- Uygulama durumu ---- */
const App = {
  user: null,
  route: 'dashboard',
  param: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  taskFilter: 'all',
  projFilter: 'all',
};

/* ============================================================
   BAŞLANGIÇ
   ============================================================ */
const COMPANY = {
  name: 'EMG İmar Müh. İnş. San. ve Tic. Ltd. Şti.',
  short: 'EMG İmar',
  slogan: '"Bizimle Çalışmanın Ayrıcalığını Yaşayın."',
  office: 'Serçeönü Mah. Ahmetpaşa Cad. Özal Plaza 9. Kat No: 71, Kocasinan / KAYSERİ',
  contacts: [
    { name: 'Murat Gençtürk', title: 'İnşaat Mühendisi', phone: '0 555 859 13 64' },
    { name: 'Fatih Gençtürk', title: 'İnşaat Mühendisi', phone: '0 538 768 12 08' },
  ],
  email: 'info@emgimar.com',
  cities: ['Kayseri', 'Sivas', 'Niğde', 'Nevşehir'],
};

function boot() {
  Store.load();
  initLang();
  applyTheme(localStorage.getItem('sahapro_theme') || 'dark');
  const sess = Store.getSession();
  if (sess) { App.user = sess; renderApp(); }
  else renderPublic('home');
}

/* ============================================================
   HALKA AÇIK KURUMSAL SİTE (üye girişi olmadan görünür)
   ============================================================ */
function renderPublic(page = 'home') {
  App.publicPage = page;
  if (page !== 'quote') App.quoteSent = false;
  if (page !== 'career') App.careerSent = false;
  const menu = [
    ['home', L('pub_home')], ['ongoing', L('pub_ongoing')], ['completed', L('pub_completed')],
    ['tracking', L('track_nav')], ['quote', L('q_nav')], ['career', L('c_nav')], ['contact', L('pub_contact')],
  ];
  const nav = `
    <nav class="pub-nav">
      <button class="pub-nav__burger" onclick="document.getElementById('pub').classList.toggle('menu-open')">☰</button>
      <div class="pub-nav__brand"><span class="logo-mark">E</span> ${COMPANY.short}</div>
      <div class="pub-nav__links">
        ${menu.map(([id,label]) => `<a class="${page===id?'active':''}" onclick="goPublic('${id}')">${label}</a>`).join('')}
      </div>
      <div class="pub-nav__spacer"></div>
      <button class="btn btn--ghost" onclick="openBrochureGate()" title="${L('pub_brochure')}" style="margin-right:6px">📄 PDF</button>
      ${langSwitcher()}
      <button class="icon-btn" onclick="toggleTheme();renderPublic(App.publicPage)" title="Tema" style="margin:0 6px">🌓</button>
      <button class="btn btn--primary" onclick="pubLogin()">🔒 ${L('pub_login')}</button>
    </nav>`;

  let body = '';
  if (page === 'home') body = pubHome();
  else if (page === 'ongoing') body = pubProjectsPage('devam', L('pub_ongoing_title'), L('pub_ongoing_sub'));
  else if (page === 'completed') body = pubProjectsPage('tamamlandi', L('pub_completed_title'), L('pub_completed_sub'));
  else if (page === 'tracking') body = pubTracking();
  else if (page === 'quote') body = pubQuote();
  else if (page === 'career') body = pubCareer();
  else if (page === 'contact') body = pubContact();

  el('root').innerHTML = `<div class="pub" id="pub">${nav}${body}${pubFooter()}</div>`;
  window.scrollTo(0, 0);
}
function goPublic(page) { document.getElementById('pub')?.classList.remove('menu-open'); renderPublic(page); }
function pubLogin() { App.authMode = 'login'; renderAuth(); }

const BROCHURE_FILES = { tr: 'EMG_Imar_Tanitim_TR.pdf', en: 'EMG_Imar_Catalog_EN.pdf', ar: 'EMG_Imar_Catalog_AR.pdf', ru: 'EMG_Imar_Catalog_RU.pdf' };
function openBrochureGate(lang) {
  App._broLang = (lang && BROCHURE_FILES[lang]) ? lang : (BROCHURE_FILES[CURRENT_LANG] ? CURRENT_LANG : 'tr');
  const lg = LANGS[App._broLang];
  modal(`<div class="modal">
    <div class="modal__head"><span style="font-size:20px">📄</span><h3>${L('bro_title')}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <p class="muted" style="margin-bottom:14px">${L('bro_sub')}</p>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px">
        <span style="font-size:20px">${lg.flag}</span><b style="font-size:13px">${lg.name}</b>
        <span class="muted" style="margin-left:auto;font-size:12px">PDF</span>
      </div>
      <form id="broForm" onsubmit="submitBrochure(event)">
        <div class="form-row">
          <div class="field"><label>${L('c_f_name')} *</label><input id="broName" required placeholder="Ad Soyad"></div>
          <div class="field"><label>${L('q_f_company')}</label><input id="broCompany" placeholder="${L('q_f_company')}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${L('c_f_phone')} *</label><input id="broPhone" required placeholder="05xx xxx xx xx"></div>
          <div class="field"><label>${L('q_f_email')}</label><input id="broEmail" type="email" placeholder="ornek@mail.com"></div>
        </div>
        <button type="submit" class="btn btn--primary btn--block btn--lg" style="margin-top:6px">${L('bro_download')}</button>
      </form>
    </div>
  </div>`);
}
function submitBrochure(e) {
  e.preventDefault();
  const name = $('#broName').value.trim();
  const phone = $('#broPhone').value.trim();
  if (!name || !phone) { toast(L('q_f_req'), 'warn'); return; }
  const lang = App._broLang || 'tr';
  Store.addLead({ name, phone, company: $('#broCompany').value, email: $('#broEmail').value, lang: (LANGS[lang]||{}).name });
  closeModal();
  toast(L('bro_thanks'));
  window.open(BROCHURE_FILES[lang] || BROCHURE_FILES.tr, '_blank');
}

function pubStatBar() {
  const all = Store.projects();
  const ongoing = all.filter(p => p.status === 'devam').length;
  return `<div class="pub-stats">
    <div class="pub-stat"><b>${all.length}+</b><span>${L('pub_stat_total')}</span></div>
    <div class="pub-stat"><b>${ongoing}</b><span>${L('pub_stat_ongoing')}</span></div>
    <div class="pub-stat"><b>${COMPANY.cities.length}</b><span>${L('pub_stat_cities')}</span></div>
    <div class="pub-stat"><b>15+</b><span>${L('pub_stat_years')}</span></div>
  </div>`;
}

function pubCard(p) {
  return `<div class="proj-card" onclick="openPublicProject('${p.id}')">
    <div class="proj-card__top" style="background-image:url('${p.cover}')">
      <span class="proj-card__code">${p.code}</span>
      <span class="proj-card__badge badge ${STATUS[p.status].cls}"><span class="d"></span>${tStatus(p.status)}</span>
    </div>
    <div class="proj-card__body">
      <h4>${escapeHtml(p.name)}</h4>
      <div class="loc">📍 ${escapeHtml(p.location)} · ${escapeHtml(p.type)}</div>
      <div style="font-size:12.5px;color:var(--text-2);min-height:34px">${escapeHtml(p.subtitle || p.scope)}</div>
      ${p.status==='devam' ? `<div class="proj-meta" style="margin-top:10px"><span>${L('an_avg_progress')}</span><span>%${p.progress}</span></div>
        <div class="progress"><i style="width:${p.progress}%"></i></div>` : `<div style="margin-top:10px"><span class="badge badge--brand">${L('pub_scope')}: ${escapeHtml((p.scope||'').split(';')[0])}</span></div>`}
    </div>
  </div>`;
}

function pubTypeDist(list) {
  const by = {};
  list.forEach(p => { by[p.type] = (by[p.type] || 0) + 1; });
  const entries = Object.entries(by).sort((a,b) => b[1]-a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
    ${entries.map(([type,n]) => `
      <div style="display:flex;align-items:center;gap:10px;font-size:13px">
        <span style="width:150px;color:var(--text-2);flex:none">${escapeHtml(type)}</span>
        <div class="progress" style="flex:1"><i style="width:${n/max*100}%"></i></div>
        <b style="width:28px;text-align:right">${n}</b>
      </div>`).join('')}
  </div>`;
}

function pubAnalysisCard(list, kind, showViewAll = true) {
  const count = list.length;
  const budget = list.reduce((s,p)=>s+p.budget,0);
  const spent = list.reduce((s,p)=>s+p.spent,0);
  const area = sumArea(list);
  const avg = count ? Math.round(list.reduce((s,p)=>s+p.progress,0)/count) : 0;
  const ongoing = kind === 'devam';
  const accent = ongoing ? 'var(--yellow)' : 'var(--green)';
  const soft = ongoing ? 'var(--yellow-soft)' : 'var(--green-soft)';
  return `<div class="card" style="border-left:4px solid ${accent};margin-bottom:16px">
    <div class="card__body">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <span class="badge ${ongoing?'badge--yellow':'badge--green'}"><span class="d"></span>${ongoing?L('an_ongoing'):L('an_completed')}</span>
        <div class="spacer" style="flex:1"></div>
        ${showViewAll ? `<button class="btn btn--ghost btn--sm" onclick="goPublic('${ongoing?'ongoing':'completed'}')">${L('pub_view_all')}</button>` : ''}
      </div>
      <div class="grid grid--stats" style="margin-bottom:18px">
        <div style="background:${soft};border-radius:var(--radius-sm);padding:14px">${bigStat(count, L('an_count'))}</div>
        <div style="background:${soft};border-radius:var(--radius-sm);padding:14px">${bigStat(fmtTLlong(budget), ongoing?L('pub_total_contract'):L('pub_delivered_value'), true)}</div>
        <div style="background:${soft};border-radius:var(--radius-sm);padding:14px">${bigStat(fmtTLlong(spent), L('pub_spent'), true)}</div>
        <div style="background:${soft};border-radius:var(--radius-sm);padding:14px">${bigStat(ongoing?('%'+avg):'%100', ongoing?L('an_avg_progress'):L('an_ontime'))}</div>
      </div>
      <div style="background:${soft};border-radius:var(--radius-sm);padding:14px;margin-bottom:18px;display:flex;align-items:center;gap:12px">
        <span style="font-size:22px">📐</span>${bigStat(fmtM2(area), L('an_area'))}
      </div>
      <div style="font-size:12px;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${L('pub_by_type')}</div>
      ${pubTypeDist(list)}
    </div>
  </div>`;
}
function bigStat(val, label, small) {
  return `<div><div style="font-size:${small?'18px':'26px'};font-weight:800;letter-spacing:-.5px;line-height:1.15">${val}</div><div class="muted" style="font-size:12px;margin-top:3px">${label}</div></div>`;
}

function pubAnalysis(ongoing, completed) {
  const alls = [...ongoing, ...completed];
  const totalPortfolio = alls.reduce((s,p)=>s+p.budget,0);
  const totalArea = sumArea(alls);
  return `<section class="pub-section--alt"><div class="pub-section" style="padding-top:52px;padding-bottom:52px">
    <div class="pub-section__head"><div><h2>${L('pub_an_title')}</h2><p>${L('pub_an_sub')}</p></div></div>
    ${pubAnalysisCard(ongoing, 'devam')}
    ${pubAnalysisCard(completed, 'tamamlandi')}
    <div class="card" style="background:linear-gradient(135deg,var(--brand-soft),transparent);border:1px solid var(--brand)">
      <div class="card__body" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <span style="font-size:26px">💰</span>
        <div style="flex:1;min-width:180px"><div class="muted" style="font-size:13px">${L('pub_portfolio')}</div>
          <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:var(--brand-2)">${fmtTLlong(totalPortfolio)}</div></div>
        <div style="min-width:140px;border-left:1px solid var(--border);padding-left:20px"><div class="muted" style="font-size:13px">${L('an_area')}</div>
          <div style="font-size:22px;font-weight:800">${fmtM2(totalArea)}</div></div>
        <div style="text-align:right"><div style="font-size:22px;font-weight:800">${alls.length}</div><div class="muted" style="font-size:12px">${L('an_count')}</div></div>
      </div>
    </div>
  </div></section>`;
}

function pubHome() {
  const all = Store.projects();
  const ongoing = all.filter(p => p.status === 'devam');
  const completed = all.filter(p => p.status === 'tamamlandi');
  return `
    <header class="pub-hero"><div class="pub-hero__in">
      <div class="pub-badge">◆ ${L('pub_expert')}</div>
      <h1>${L('pub_hero_title')}</h1>
      <p class="lead">${L('pub_hero_sub')}</p>
      <div class="pub-hero__cta">
        <button class="btn btn--primary btn--lg" onclick="goPublic('ongoing')">${L('pub_cta_projects')}</button>
        <button class="btn btn--ghost btn--lg" onclick="goPublic('quote')">${L('pub_cta_contact')}</button>
        <button class="btn btn--ghost btn--lg" onclick="openBrochureGate()">${L('pub_brochure')}</button>
      </div>
    </div></header>
    ${pubStatBar()}

    ${pubAnalysis(ongoing, completed)}

    <section class="pub-section">
      <div class="pub-section__head"><div><h2>${L('pub_why_title')}</h2></div></div>
      <div class="pub-why">
        <div class="pub-why__card"><div class="pub-why__ico">👷</div><h4>${L('pub_why1_t')}</h4><p>${L('pub_why1_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">⏱️</div><h4>${L('pub_why2_t')}</h4><p>${L('pub_why2_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">🧱</div><h4>${L('pub_why3_t')}</h4><p>${L('pub_why3_d')}</p></div>
      </div>
    </section>

    <section class="pub-section--alt"><div class="pub-section" style="padding-top:48px;padding-bottom:48px">
      <div class="pub-section__head"><div><h2>${L('pub_brands_t')}</h2><p>${L('pub_brands_sub')}</p></div></div>
      <div class="brandwall">${BRANDS.map(([b,c]) => `<div class="brandtile" style="border-top:3px solid ${c}"><span style="color:${c}">${b}</span></div>`).join('')}</div>
    </div></section>`;
}
const BRANDS = [['LAFARGE','#E2001A'],['AKÇANSA','#0033A0'],['ÇİMSA','#00A0A0'],['ECA','#E30613'],['VitrA','#111111'],['KALE','#D2001E'],['KALEKİM','#E2001A'],['WEBER','#1268B3'],['BASF','#21A0AE'],['SIKA','#D51317'],['FİLLİ BOYA','#0090D4'],['DYO','#004B93'],['MARSHALL','#E2001A'],['İZOCAM','#0069B4'],['YTONG','#E2001A'],['KNAUF','#004B93'],['PERI','#F39200'],['BOSCH','#EA0016']];

function pubProjectsPage(status, title, sub) {
  const list = Store.projects().filter(p => p.status === status);
  return `
    <section class="pub-section" style="padding-top:40px">
      <div class="pub-section__head">
        <div><h2>${title}</h2><p>${sub} · ${list.length} ${L('projects').toLowerCase()}</p></div>
      </div>
      <div style="font-size:12px;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">📊 ${L('pub_an_title')}</div>
      ${pubAnalysisCard(list, status, false)}
      <div style="height:12px"></div>
      <div class="proj-grid">${list.map(pubCard).join('')}</div>
    </section>`;
}

function pubTracking() {
  const ongoing = Store.projects().filter(p => p.status === 'devam');
  const loggedIn = !!Store.getSession();
  return `
    <header class="pub-hero" style="padding-bottom:40px"><div class="pub-hero__in">
      <div class="pub-badge">◆ ${L('track_nav')}</div>
      <h1 style="font-size:clamp(26px,4vw,40px)">${L('track_title')}</h1>
      <p class="lead">${L('track_sub')}</p>
    </div></header>
    <section class="pub-section" style="padding-top:32px">
      <div class="card" style="margin-bottom:18px;border-left:4px solid var(--accent)">
        <div class="card__body" style="display:flex;align-items:center;gap:12px;padding:14px 18px">
          <span style="font-size:20px">🔐</span><b style="flex:1;font-size:14px">${L('track_note')}</b>
          <button class="btn btn--primary btn--sm" onclick="pubLogin()">🔒 ${L('pub_login')}</button>
        </div>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>${L('projects')}</th><th>${L('pub_location')}</th><th>${L('pub_type')}</th><th>${L('an_avg_progress')}</th><th>${L('m_status')}</th><th></th></tr></thead>
        <tbody>
          ${ongoing.map(p => `<tr>
            <td><div class="cell-main"><div><b>${escapeHtml(p.name)}</b><div class="cell-sub">${p.code}</div></div></div></td>
            <td>📍 ${escapeHtml(p.location)}</td>
            <td><span class="badge">${escapeHtml(p.type)}</span></td>
            <td style="min-width:130px"><div class="progress"><i style="width:${p.progress}%"></i></div><div class="cell-sub" style="margin-top:4px">%${p.progress}</div></td>
            <td><span class="badge ${STATUS[p.status].cls}"><span class="d"></span>${tStatus(p.status)}</span></td>
            <td style="text-align:right"><button class="btn btn--ghost btn--sm" onclick="trackOpen('${p.id}')">${loggedIn ? L('track_view') : L('track_login_view')}</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </section>`;
}
// Takip sayfasından detaya erişim denemesi
function trackOpen(pid) {
  const sess = Store.getSession();
  if (!sess) { pubLogin(); return; }
  App.user = sess;
  renderApp();
  go('projectDetail', pid);
}

function pubQuote() {
  const types = ['Konut', 'Villa', 'Ticari', 'Kamu', 'Endüstriyel', 'Kentsel Dönüşüm', 'Altyapı'];
  const scopes = ['Kaba İnşaat (Kalıp-Demir-Beton)', 'Duvar İşleri', 'Sıva & Şap', 'Mantolama & Dış Cephe', 'İnce İşler (Boya, Kaplama)', 'Metraj & Kesin Hesap', 'Anahtar Teslim'];
  const steps = [
    ['q_s1_t', 'q_s1_d'], ['q_s2_t', 'q_s2_d'], ['q_s3_t', 'q_s3_d'], ['q_s4_t', 'q_s4_d'],
  ];
  const form = App.quoteSent ? `
    <div class="card" style="border-left:4px solid var(--green)"><div class="card__body" style="text-align:center;padding:40px 24px">
      <div style="font-size:48px;margin-bottom:12px">✅</div>
      <h3 style="font-size:22px;margin-bottom:8px">${L('q_success_t')}</h3>
      <p class="muted" style="max-width:420px;margin:0 auto 20px">${L('q_success_d')}</p>
      <button class="btn btn--primary" onclick="App.quoteSent=false;renderPublic('quote')">${L('q_new')}</button>
    </div></div>`
  : `
    <div class="card"><div class="card__body">
      <h3 style="font-size:18px;margin-bottom:4px">📝 ${L('q_form_title')}</h3>
      <p class="muted" style="font-size:13px;margin-bottom:18px">${L('q_f_req')}: *</p>
      <form id="quoteForm" onsubmit="submitQuote(event)">
        <div class="form-row">
          <div class="field"><label>${L('q_f_name')} *</label><input id="qName" required placeholder="Ad Soyad"></div>
          <div class="field"><label>${L('q_f_company')}</label><input id="qCompany" placeholder="${L('q_f_company')}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${L('q_f_phone')} *</label><input id="qPhone" required placeholder="05xx xxx xx xx"></div>
          <div class="field"><label>${L('q_f_email')}</label><input id="qEmail" type="email" placeholder="ornek@mail.com"></div>
        </div>
        <div class="field"><label>${L('q_f_service')}</label><select id="qService">${[L('q_sv1_t'),L('q_sv2_t'),L('q_sv3_t'),L('q_sv4_t'),L('q_sv5_t'),L('q_sv6_t')].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div class="form-row">
          <div class="field"><label>${L('q_f_type')}</label><select id="qType">${types.map(t=>`<option>${t}</option>`).join('')}</select></div>
          <div class="field"><label>${L('q_f_scope')}</label><select id="qScope">${scopes.map(t=>`<option>${t}</option>`).join('')}</select></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${L('q_f_area')}</label><input id="qArea" type="number" placeholder="0"></div>
          <div class="field"><label>${L('q_f_city')}</label><input id="qCity" placeholder="Kayseri"></div>
        </div>
        <div class="field"><label>${L('q_f_msg')}</label><textarea id="qMsg" placeholder="..."></textarea></div>
        <button type="submit" class="btn btn--primary btn--block btn--lg">${L('q_f_submit')} →</button>
      </form>
    </div></div>`;

  return `
    <header class="pub-hero" style="padding-bottom:40px"><div class="pub-hero__in">
      <div class="pub-badge">◆ ${L('q_nav')}</div>
      <h1 style="font-size:clamp(26px,4vw,40px)">${L('q_title')}</h1>
      <p class="lead">${L('q_sub')}</p>
    </div></header>

    <section class="pub-section" style="padding-top:36px">
      <div class="pub-quote-grid">
        ${form}
        <div class="pub-info-card">
          <h3>${L('q_info_title')}</h3>
          <p>${L('q_info_text')}</p>
          <div style="margin-top:18px;display:flex;flex-direction:column;gap:10px">
            ${[['📐','q_w1_t','q_w1_d'],['⏱️','q_w2_t','q_w2_d'],['🗂️','q_w3_t','q_w3_d']].map(([ic,t,d])=>`
              <div style="display:flex;gap:12px;align-items:flex-start">
                <span style="font-size:20px">${ic}</span>
                <div><b>${L(t)}</b><div class="muted" style="font-size:13px">${L(d)}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="pub-section" style="padding-top:0">
      <div class="pub-section__head"><div><h2>${L('q_services_title')}</h2></div></div>
      <div class="pub-why">
        ${[['📐','q_sv1_t','q_sv1_d'],['💹','q_sv2_t','q_sv2_d'],['🧾','q_sv3_t','q_sv3_d'],['🗂️','q_sv4_t','q_sv4_d'],['⚖️','q_sv5_t','q_sv5_d'],['📊','q_sv6_t','q_sv6_d']].map(([ic,t,d])=>`
          <div class="pub-why__card"><div class="pub-why__ico">${ic}</div><h4>${L(t)}</h4><p>${L(d)}</p></div>`).join('')}
      </div>
    </section>

    <section class="pub-section--alt"><div class="pub-section" style="padding-top:52px;padding-bottom:52px">
      <div class="pub-section__head"><div><h2>${L('q_process')}</h2></div></div>
      <div class="pub-steps">
        ${steps.map(([t,d],i)=>`<div class="pub-step"><div class="pub-step__no">${i+1}</div><h4>${L(t)}</h4><p>${L(d)}</p></div>`).join('')}
      </div>
    </div></section>

    <section class="pub-section">
      <div class="pub-section__head"><div><h2>${L('q_why')}</h2></div></div>
      <div class="pub-why">
        <div class="pub-why__card"><div class="pub-why__ico">📊</div><h4>${L('q_w1_t')}</h4><p>${L('q_w1_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">💵</div><h4>${L('q_w2_t')}</h4><p>${L('q_w2_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">🗂️</div><h4>${L('q_w3_t')}</h4><p>${L('q_w3_d')}</p></div>
      </div>
      <div class="card" style="margin-top:20px;background:linear-gradient(135deg,var(--brand-soft),transparent);border:1px solid var(--brand)">
        <div class="card__body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span style="font-size:26px">🤝</span>
          <b style="flex:1;font-size:17px">${L('q_cta_strip')}</b>
          <a href="tel:${COMPANY.contacts[0].phone.replace(/\s/g,'')}" class="btn btn--primary">📞 ${COMPANY.contacts[0].phone}</a>
        </div>
      </div>
    </section>`;
}

function submitQuote(e) {
  e.preventDefault();
  const name = $('#qName').value.trim();
  const phone = $('#qPhone').value.trim();
  if (!name || !phone) { toast(L('q_f_req'), 'warn'); return; }
  Store.addQuote({
    name, phone,
    company: $('#qCompany').value, email: $('#qEmail').value,
    service: $('#qService')?.value, type: $('#qType').value, scope: $('#qScope').value,
    area: +$('#qArea').value || 0, city: $('#qCity').value, msg: $('#qMsg').value,
  });
  App.quoteSent = true;
  renderPublic('quote');
  toast(L('q_success_t'));
}

const TRADES = ['Kalıp', 'Demir', 'Beton', 'Duvar (Örme)', 'Sıva & Şap', 'Mantolama', 'Boya', 'Seramik / Kaplama', 'Elektrik', 'Sıhhi Tesisat', 'İş Makinesi Operatörü', 'Diğer'];

function pubCareer() {
  const form = App.careerSent ? `
    <div class="card" style="border-left:4px solid var(--green)"><div class="card__body" style="text-align:center;padding:40px 24px">
      <div style="font-size:48px;margin-bottom:12px">🤝</div>
      <h3 style="font-size:22px;margin-bottom:8px">${L('c_success_t')}</h3>
      <p class="muted" style="max-width:440px;margin:0 auto 20px">${L('c_success_d')}</p>
      <button class="btn btn--primary" onclick="App.careerSent=false;renderPublic('career')">${L('c_new')}</button>
    </div></div>`
  : `
    <div class="card"><div class="card__body">
      <h3 style="font-size:18px;margin-bottom:4px">📋 ${L('c_form_title')}</h3>
      <p class="muted" style="font-size:13px;margin-bottom:18px">${L('c_f_req')}: *</p>
      <form id="careerForm" onsubmit="submitApplication(event)">
        <div class="form-row">
          <div class="field"><label>${L('c_f_name')} *</label><input id="cName" required placeholder="Ad Soyad"></div>
          <div class="field"><label>${L('c_f_phone')} *</label><input id="cPhone" required placeholder="05xx xxx xx xx"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${L('c_f_apptype')}</label><select id="cType"><option>${L('c_t_usta')}</option><option>${L('c_t_ekip')}</option><option>${L('c_t_alt')}</option></select></div>
          <div class="field"><label>${L('c_f_trade')}</label><select id="cTrade">${TRADES.map(t=>`<option>${t}</option>`).join('')}</select></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${L('c_f_exp')}</label><input id="cExp" type="number" placeholder="0"></div>
          <div class="field"><label>${L('c_f_crew')}</label><input id="cCrew" type="number" placeholder="1"></div>
        </div>
        <div class="field"><label>${L('c_f_city')}</label><input id="cCity" placeholder="Kayseri"></div>
        <div class="field"><label>${L('c_f_msg')}</label><textarea id="cMsg" placeholder="..."></textarea></div>
        <button type="submit" class="btn btn--primary btn--block btn--lg">${L('c_f_submit')} →</button>
      </form>
    </div></div>`;

  return `
    <header class="pub-hero" style="padding-bottom:40px"><div class="pub-hero__in">
      <div class="pub-badge">◆ ${L('c_nav')}</div>
      <h1 style="font-size:clamp(26px,4vw,40px)">${L('c_title')}</h1>
      <p class="lead">${L('c_sub')}</p>
    </div></header>

    <section class="pub-section" style="padding-top:36px">
      <div class="pub-quote-grid">
        ${form}
        <div class="pub-info-card">
          <h3>${L('c_needed_title')}</h3>
          <div class="chips" style="margin-top:14px">
            ${TRADES.map(t=>`<span class="chip-btn" style="cursor:default">${t}</span>`).join('')}
          </div>
          <div style="margin-top:22px;display:flex;flex-direction:column;gap:12px">
            ${[['🔁','c_w1_t','c_w1_d'],['💵','c_w2_t','c_w2_d'],['🦺','c_w3_t','c_w3_d']].map(([ic,t,d])=>`
              <div style="display:flex;gap:12px;align-items:flex-start">
                <span style="font-size:20px">${ic}</span>
                <div><b>${L(t)}</b><div class="muted" style="font-size:13px">${L(d)}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="pub-section--alt"><div class="pub-section" style="padding-top:52px;padding-bottom:52px">
      <div class="pub-section__head"><div><h2>${L('c_why_title')}</h2></div></div>
      <div class="pub-why">
        <div class="pub-why__card"><div class="pub-why__ico">🔁</div><h4>${L('c_w1_t')}</h4><p>${L('c_w1_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">💵</div><h4>${L('c_w2_t')}</h4><p>${L('c_w2_d')}</p></div>
        <div class="pub-why__card"><div class="pub-why__ico">🦺</div><h4>${L('c_w3_t')}</h4><p>${L('c_w3_d')}</p></div>
      </div>
      <div class="card" style="margin-top:20px;background:linear-gradient(135deg,var(--brand-soft),transparent);border:1px solid var(--brand)">
        <div class="card__body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span style="font-size:26px">🤝</span>
          <b style="flex:1;font-size:17px">${L('c_strip')}</b>
          <a href="tel:${COMPANY.contacts[0].phone.replace(/\s/g,'')}" class="btn btn--primary">📞 ${COMPANY.contacts[0].phone}</a>
        </div>
      </div>
    </div></section>`;
}

function submitApplication(e) {
  e.preventDefault();
  const name = $('#cName').value.trim();
  const phone = $('#cPhone').value.trim();
  if (!name || !phone) { toast(L('c_f_req'), 'warn'); return; }
  Store.addApplication({
    name, phone,
    appType: $('#cType').value, trade: $('#cTrade').value,
    exp: +$('#cExp').value || 0, crew: +$('#cCrew').value || 0,
    city: $('#cCity').value, msg: $('#cMsg').value,
  });
  App.careerSent = true;
  renderPublic('career');
  toast(L('c_success_t'));
}

function pubContact() {
  return `
    <section class="pub-section" style="padding-top:44px">
      <div class="pub-section__head"><div><h2>${L('pub_contact')}</h2></div></div>
      <div class="pub-contact">
        <div class="pub-contact__card">
          <div class="pub-contact__row"><span class="ico">🏢</span><div><b>${L('pub_office')}</b><span>${COMPANY.office}</span></div></div>
          ${COMPANY.contacts.map(c => `<div class="pub-contact__row"><span class="ico">👤</span><div><b>${c.name} · ${c.title}</b><span>📞 ${c.phone}</span></div></div>`).join('')}
          <div class="pub-contact__row"><span class="ico">✉️</span><div><b>${L('pub_email')}</b><span>${COMPANY.email}</span></div></div>
        </div>
        <div class="pub-contact__cta">
          <h3>${L('pub_contact_title')}</h3>
          <p>${COMPANY.slogan}</p>
          <a href="tel:${COMPANY.contacts[0].phone.replace(/\s/g,'')}" class="btn btn--lg" style="background:#1a1206;color:#fff">📞 ${COMPANY.contacts[0].phone}</a>
        </div>
      </div>

      <div class="bro-panel">
        <div class="bro-panel__doc">📄</div>
        <div class="bro-panel__body">
          <span class="badge" style="background:rgba(255,255,255,.18);color:#fff">${L('pub_brochure')}</span>
          <h3>${L('bro_title')}</h3>
          <p>${L('bro_sub')}</p>
          <div class="bro-flags">
            ${Object.entries(LANGS).map(([code,l]) => `<button class="bro-flag" onclick="openBrochureGate('${code}')"><span class="fl">${l.flag}</span> ${l.name}</button>`).join('')}
          </div>
        </div>
        <div class="bro-panel__pages"><span>8</span><small>sayfa · PDF</small></div>
      </div>
    </section>`;
}

function pubFooter() {
  return `<footer class="pub-foot"><div class="pub-foot__in">
    <div>
      <div class="pub-foot__brand"><span class="logo-mark">E</span> ${COMPANY.short}</div>
      <small>${L('pub_footer_tag')}</small>
      <div style="margin-top:8px"><button class="btn btn--ghost btn--sm" onclick="openBrochureGate()">${L('pub_brochure')}</button></div>
    </div>
    <small>${COMPANY.office}</small>
    <small>© 2026 ${COMPANY.name} · ${L('pub_rights')}</small>
  </div></footer>`;
}

function openPublicProject(id) {
  const p = Store.projectById(id); if (!p) return;
  modal(`<div class="modal modal--wide">
    <div class="proj-card__top" style="height:180px;border-radius:var(--radius-lg) var(--radius-lg) 0 0;background-image:url('${p.cover}')">
      <span class="proj-card__code">${p.code}</span>
      <span class="proj-card__badge badge ${STATUS[p.status].cls}"><span class="d"></span>${tStatus(p.status)}</span>
      <button class="x" onclick="closeModal()" style="position:absolute;top:12px;left:12px;z-index:2;background:rgba(0,0,0,.4);color:#fff;width:34px;height:34px;border-radius:8px;border:none">×</button>
    </div>
    <div class="modal__body">
      <h3 style="font-size:22px;margin-bottom:4px">${escapeHtml(p.name)}</h3>
      <div class="muted" style="margin-bottom:16px">${escapeHtml(p.subtitle || '')}</div>
      <dl class="kv" style="margin-bottom:18px">
        <dt>${L('pub_client')}</dt><dd>${escapeHtml(p.client)}</dd>
        <dt>${L('pub_location')}</dt><dd>${escapeHtml(p.location)}</dd>
        <dt>${L('pub_type')}</dt><dd>${escapeHtml(p.type)}</dd>
        ${p.status==='devam'?`<dt>${L('an_avg_progress')}</dt><dd>%${p.progress}</dd>`:''}
      </dl>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px">
        <b style="font-size:13px;color:var(--brand-2)">${L('pub_scope')}</b>
        <p style="margin-top:6px;color:var(--text-2)">${escapeHtml(p.scope || '')}</p>
      </div>
    </div>
    <div class="modal__foot"><button class="btn btn--primary" onclick="closeModal()">${L('close')}</button></div>
  </div>`);
}

function langSwitcher() {
  return `<select class="select-sm" onchange="changeLang(this.value)" title="Dil / Language" aria-label="Dil">
    ${Object.entries(LANGS).map(([code, l]) => `<option value="${code}" ${CURRENT_LANG===code?'selected':''}>${l.flag} ${l.name}</option>`).join('')}
  </select>`;
}
function changeLang(code) {
  setLang(code);
  if (App.user) renderApp(); else renderAuth();
  toast(LANGS[code].flag + ' ' + LANGS[code].name);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('sahapro_theme', t);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   GİRİŞ EKRANI
   ============================================================ */
function renderAuth() {
  const p = Store.projects();
  const active = p.filter(x => x.status === 'devam').length;
  const workers = Store.users().filter(u => u.role !== 'yetkili').length;
  el('root').innerHTML = `
  <div class="auth">
    <div class="auth__brandside">
      <div class="auth__logo"><span class="logo-mark">E</span> EMG İmar</div>
      <div class="auth__hero">
        <h1>${L('hero')}</h1>
        <p>${L('hero_sub')}</p>
        <div class="auth__stats">
          <div class="auth__stat"><b>${p.length}</b><span>${L('total_projects')}</span></div>
          <div class="auth__stat"><b>${active}</b><span>${L('active_sites')}</span></div>
          <div class="auth__stat"><b>${workers}</b><span>${L('field_team')}</span></div>
        </div>
      </div>
      <div class="auth__foot">© 2026 EMG İmar Müh. İnş. San. ve Tic. Ltd. Şti. · ${L('slogan')}</div>
    </div>
    <div class="auth__formside">
      <div class="auth__card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <button class="btn btn--ghost btn--sm" onclick="renderPublic('home')">${L('pub_back')}</button>
          ${langSwitcher()}
        </div>
        ${App.authMode === 'register' ? `
        <h2>${L('register')}</h2>
        <p>${L('register_sub')}</p>
        <form id="registerForm">
          <div class="field"><label>${L('c_f_name')}</label><input id="rName" placeholder="Ad Soyad" required></div>
          <div class="field"><label>${L('email')}</label><input type="email" id="rEmail" placeholder="ornek@mail.com" required></div>
          <div class="field"><label>${L('c_f_phone')}</label><input id="rPhone" placeholder="05xx xxx xx xx"></div>
          <div class="form-row">
            <div class="field"><label>${L('password')}</label><input type="password" id="rPass" placeholder="••••••" required></div>
            <div class="field"><label>${L('confirm_pass')}</label><input type="password" id="rPass2" placeholder="••••••" required></div>
          </div>
          <div class="auth__error" id="loginErr"></div>
          <button type="submit" class="btn btn--primary btn--block">${L('register')} →</button>
        </form>
        <div class="auth__demo"><p><a style="color:var(--brand-2);cursor:pointer" onclick="App.authMode='login';renderAuth()">${L('have_account')}</a></p></div>
        ` : `
        <h2>${L('login')}</h2>
        <p>${L('login_sub')}</p>
        <form id="loginForm">
          <div class="field">
            <label>${L('email')}</label>
            <input type="email" id="email" placeholder="ornek@emgimar.com" value="murat@emgimar.com" autocomplete="username">
          </div>
          <p class="muted" style="font-size:12.5px;margin:-4px 0 4px">${L('login_nopass')}</p>
          <div class="auth__error" id="loginErr"></div>
          <button type="submit" class="btn btn--primary btn--block">${L('login_btn')}</button>
        </form>
        <div class="auth__demo">
          <p>${L('demo_hint')}</p>
          <div class="auth__roles">
            <button data-em="murat@emgimar.com"><span class="ico">🛡️</span> ${L('r_yetkili')}</button>
            <button data-em="fatih@emgimar.com"><span class="ico">👷</span> ${L('r_muhendis')}</button>
            <button data-em="muhasebe@emgimar.com"><span class="ico">🧮</span> ${L('r_muhasebe')}</button>
            <button data-em="usta@emgimar.com"><span class="ico">🔧</span> ${L('r_calisan')}</button>
            <button data-em="uye@emgimar.com"><span class="ico">👤</span> ${L('r_uye')}</button>
          </div>
          <p style="margin-top:12px"><a style="color:var(--brand-2);cursor:pointer" onclick="App.authMode='register';renderAuth()">${L('no_account')}</a></p>
        </div>
        `}
      </div>
    </div>
  </div>`;

  if (App.authMode === 'register') {
    $('#registerForm').addEventListener('submit', (e) => { e.preventDefault(); doRegister(); });
  } else {
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      doLogin($('#email').value);
    });
    $$('.auth__roles button').forEach(b => b.addEventListener('click', () => {
      doLogin(b.dataset.em);
    }));
  }
}

function doRegister() {
  const name = $('#rName').value.trim();
  const email = $('#rEmail').value.trim();
  const pass = $('#rPass').value;
  const err = $('#loginErr');
  if (!name || !email || !pass) { if (err) err.textContent = L('q_f_req'); return; }
  if (pass !== $('#rPass2').value) { if (err) err.textContent = L('confirm_pass') + ' ≠'; return; }
  const res = Store.register({ name, email, pass, phone: $('#rPhone').value });
  if (res.error === 'exists') { if (err) err.textContent = L('reg_exists'); return; }
  toast(L('reg_success'));
  Store.setSession(res.user.id);
  App.user = res.user;
  App.authMode = 'login';
  renderApp();
}

function doLogin(email) {
  const u = Store.authenticate(email);
  if (!u) { const e = $('#loginErr'); if (e) e.textContent = L('login_notfound'); return; }
  Store.setSession(u.id);
  App.user = u;
  App.route = null; // her girişte rolün varsayılan sayfasından başla
  renderApp();
  toast(`Hoş geldiniz, ${u.name.split(' ')[0]}!`);
}

function logout() { Store.clearSession(); App.user = null; App.route = null; renderPublic('home'); }

/* ============================================================
   UYGULAMA İSKELETİ
   ============================================================ */
function navItems() {
  const role = App.user.role;
  // Üye: sadece kendi erişebildiği projelerin takibi + ayarlar
  if (role === 'uye') {
    return [
      { grp: L('g_general') },
      { id: 'mytracking', icon: '📌', label: L('member_area') },
      { id: 'settings', icon: '⚙️', label: L('settings') },
    ];
  }
  // Muhasebe: finans/sözleşme/rapor odaklı görünüm (salt görüntüleme)
  if (role === 'muhasebe') {
    return [
      { grp: L('g_general') },
      { id: 'dashboard', icon: '🏠', label: L('home') },
      { id: 'ongoing',   icon: '🚧', label: L('nav_ongoing') },
      { id: 'completed', icon: '✅', label: L('nav_completed') },
      { id: 'projects',  icon: '🏗️', label: L('all_projects_nav') },
      { grp: L('g_finance') },
      { id: 'finance',   icon: '💳', label: L('nav_finance') },
      { id: 'contracts', icon: '📄', label: L('contracts') },
      { id: 'reports',   icon: '📈', label: L('reports') },
      { id: 'materials', icon: '📦', label: L('materials') },
      { id: 'attendance',icon: '🕐', label: L('attendance') },
      { grp: L('g_mgmt') },
      { id: 'settings',  icon: '⚙️', label: L('settings') },
    ];
  }
  const base = [
    { grp: L('g_general') },
    { id: 'dashboard', icon: '🏠', label: L('home') },
    { id: 'ongoing',   icon: '🚧', label: L('nav_ongoing') },
    { id: 'completed', icon: '✅', label: L('nav_completed') },
    { id: 'projects',  icon: '🏗️', label: L('all_projects_nav') },
    { id: 'tasks',     icon: '📋', label: L('tasks') },
    { id: 'calendar',  icon: '📅', label: L('calendar') },
  ];
  const saha = [
    { grp: L('g_site') },
    { id: 'materials', icon: '📦', label: L('materials') },
  ];
  const team = [
    { grp: L('g_team') },
    { id: 'employees', icon: '👥', label: L('employees') },
    { id: 'attendance',icon: '🕐', label: L('attendance') },
  ];
  const staff = role === 'yetkili' || role === 'muhendis';
  const pendingReq = Store.quotes().filter(q => !q.handled).length + Store.applications().filter(a => !a.handled).length + Store.leads().filter(l => !l.handled).length;
  const mgmt = [{ grp: L('g_mgmt') }];
  if (staff) {
    mgmt.push({ id: 'requests', icon: '📥', label: L('requests'), badge: pendingReq });
    mgmt.push({ id: 'contracts', icon: '📄', label: L('contracts') });
    mgmt.push({ id: 'reports', icon: '📈', label: L('reports') });
  }
  mgmt.push({ id: 'settings', icon: '⚙️', label: L('settings') });
  let items = [...base, ...saha];
  if (staff) items = items.concat(team);
  items = items.concat(mgmt);
  return items;
}

function renderApp() {
  const u = App.user;
  const myOpenTasks = Store.tasksByUser(u.id).filter(t => t.status !== 'tamamlandi').length;

  el('root').innerHTML = `
  <div class="app" id="app">
    <div class="overlay" onclick="closeNav()"></div>
    <aside class="sidebar">
      <div class="sidebar__brand"><span class="logo-mark">E</span> EMG İmar</div>
      <nav class="sidebar__nav" id="nav">
        ${navItems().map(it => it.grp
          ? `<div class="nav-group-label">${it.grp}</div>`
          : `<a class="nav-item" data-route="${it.id}" onclick="go('${it.id}')">
               <span class="ico">${it.icon}</span> ${it.label}
               ${it.id === 'tasks' && myOpenTasks ? `<span class="badge badge--brand">${myOpenTasks}</span>` : ''}
               ${it.badge ? `<span class="badge badge--red">${it.badge}</span>` : ''}
             </a>`).join('')}
      </nav>
      <div class="sidebar__foot">
        <div class="userchip">
          ${avatar(u)}
          <div class="meta"><b>${escapeHtml(u.name)}</b><span>${tRole(u.role)} · ${escapeHtml(u.title)}</span></div>
        </div>
        <button class="btn btn--ghost btn--block btn--sm" style="margin-top:8px" onclick="logout()">${L('logout')}</button>
      </div>
    </aside>
    <main class="main">
      <header class="header">
        <button class="header__menu" onclick="openNav()">☰</button>
        <div>
          <h1 id="pageTitle">${L('dashboard')}</h1>
          <div class="sub" id="pageSub"></div>
        </div>
        <div class="header__spacer"></div>
        <div class="search">
          <span>🔍</span><input id="globalSearch" placeholder="${L('search_ph')}">
        </div>
        ${langSwitcher()}
        <button class="icon-btn" onclick="toggleTheme()" title="Tema">🌓</button>
        <button class="icon-btn" title="Bildirimler" onclick="openNotifications()">🔔<span class="dot"></span></button>
      </header>
      <div class="content" id="content"></div>
    </main>
  </div>`;

  $('#globalSearch').addEventListener('input', (e) => {
    if (e.target.value.length > 1) { go('projects'); App._search = e.target.value; renderProjects(); }
  });
  go(App.route || (App.user.role === 'uye' ? 'mytracking' : 'dashboard'));
}

function openNav() { $('#app')?.classList.add('nav-open'); }
function closeNav() { $('#app')?.classList.remove('nav-open'); }

function go(route, param = null) {
  App.route = route; App.param = param;
  closeNav();
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
  const titles = {
    dashboard: [L('home'), L('s_home')],
    ongoing: [L('nav_ongoing'), L('s_ongoing')],
    completed: [L('nav_completed'), L('s_completed')],
    projects: [L('all_projects_nav'), L('s_projects')],
    tasks: [L('tasks'), L('s_tasks')],
    calendar: [L('calendar'), L('s_calendar')],
    materials: [L('materials'), L('s_materials')],
    employees: [L('employees'), L('s_employees')],
    attendance: [L('attendance'), L('s_attendance')],
    reports: [L('reports'), L('s_reports')],
    settings: [L('settings'), L('s_settings')],
    requests: [L('requests'), L('s_requests')],
    contracts: [L('contracts'), L('s_contracts')],
    finance: [L('nav_finance'), L('s_finance')],
    mytracking: [L('member_area'), L('track_sub')],
    projectDetail: ['', ''],
  };
  const [t, s] = titles[route] || ['EMG İmar', ''];
  $('#pageTitle').textContent = t; $('#pageSub').textContent = s;
  window.scrollTo(0, 0);
  // Ayrı sayfalar: devam eden / biten projeler — kilitli filtre
  if (route === 'ongoing') { App.projLock = 'devam'; App._search = ''; }
  else if (route === 'completed') { App.projLock = 'tamamlandi'; App._search = ''; }
  else if (route === 'projects') { App.projLock = null; }

  const render = {
    dashboard: renderDashboard,
    ongoing: renderProjects, completed: renderProjects, projects: renderProjects,
    tasks: renderTasks, calendar: renderCalendar, materials: renderMaterials, employees: renderEmployees,
    attendance: renderAttendance, reports: renderReports, settings: renderSettings,
    contracts: renderContracts, requests: renderRequests, mytracking: renderMemberTracking,
    finance: renderFinance,
    projectDetail: renderProjectDetail,
  }[route];
  (render || renderDashboard)();
}

// Detay erişim kontrolü (uygulama içi)
const isStaff = () => !!App.user && (App.user.role === 'yetkili' || App.user.role === 'muhendis');

function canViewProjectApp(p) {
  const u = App.user;
  if (!u || !p) return false;
  if (u.role === 'yetkili' || u.role === 'muhasebe') return true; // muhasebe tüm projelerin finansını görür
  return (p.access || []).includes(u.id);
}

/* ============================================================
   ÜYE — PROJE TAKİBİM
   ============================================================ */
function renderMemberTracking() {
  const u = App.user;
  const granted = Store.projectsForUser(u.id);
  $('#content').innerHTML = `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,var(--brand-soft),transparent)">
      <div class="card__body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        ${avatar(u,'avatar--lg')}
        <div style="flex:1;min-width:200px"><h2 style="font-size:19px">${escapeHtml(u.name)}</h2>
          <p class="muted">${L('r_uye')} · ${granted.length} ${L('projects').toLowerCase()}</p></div>
        <span class="badge badge--brand">${L('member_projects')}: ${granted.length}</span>
      </div>
    </div>
    ${granted.length
      ? `<div class="proj-grid">${granted.map(projectCard).join('')}</div>`
      : `<div class="card"><div class="card__body">${emptyBox(L('member_empty'),'🔒')}</div></div>`}`;
}

/* ============================================================
   GÖSTERGE PANELİ
   ============================================================ */
function renderDashboard() {
  const u = App.user;
  const projects = Store.projects();
  const tasks = Store.tasks();
  const active = projects.filter(p => p.status === 'devam');
  const done = projects.filter(p => p.status === 'tamamlandi');
  const planned = projects.filter(p => p.status === 'planlanan');
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const openTasks = tasks.filter(t => t.status !== 'tamamlandi');
  const workers = Store.users().filter(x => x.role === 'calisan');
  const today = todayISO();
  const todayTasks = tasks.filter(t => t.date === today);

  const first = u.name.split(' ')[0];
  const c = $('#content');

  // Çalışan için sadeleştirilmiş panel
  if (u.role === 'calisan') { renderWorkerDashboard(); return; }

  const missing = Store.missingMaterials();
  const kritik = missing.filter(m => Store.materialStatus(m) === 'kritik');

  // İş analizi metrikleri
  const avgProg = active.length ? Math.round(active.reduce((s,p)=>s+p.progress,0)/active.length) : 0;
  const ongoingBudget = active.reduce((s,p)=>s+p.budget,0);
  const ongoingSpent = active.reduce((s,p)=>s+p.spent,0);
  const onBudget = active.filter(p => p.spent/p.budget <= p.progress/100 + 0.05).length;
  const onBudgetPct = active.length ? Math.round(onBudget/active.length*100) : 0;
  const doneValue = done.reduce((s,p)=>s+p.budget,0);
  const doneRealized = done.reduce((s,p)=>s+p.spent,0);
  const onTimePct = done.length ? Math.round(done.filter(p=>p.spent<=p.budget).length/done.length*100) : 0;

  c.innerHTML = `
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('🏗️','tint-brand', active.length, L('d_active'), `${planned.length} ${L('st_planlanan').toLowerCase()} · ${done.length} ${L('st_tamamlandi').toLowerCase()}`)}
      ${stat('✅','tint-green', openTasks.length, L('d_open_tasks'), `${todayTasks.length} ${L('today').toLowerCase()}`)}
      ${stat('👥','tint-accent', workers.length, L('d_workers'), `${Store.users().filter(x=>x.role==='muhendis').length} ${L('r_muhendis').toLowerCase()}`)}
      ${stat('📦','tint-yellow', missing.length, L('d_missing'), `${kritik.length} ${L('ms_kritik').toLowerCase()}`)}
    </div>

    <div class="card" style="margin-bottom:16px"><div class="card__head"><h3>📈 ${L('an_title')}</h3></div>
      <div class="card__body">
        <div class="grid grid--2">
          <div onclick="go('ongoing')" style="cursor:pointer;border:1px solid var(--border);border-radius:var(--radius);padding:16px;background:linear-gradient(135deg,var(--yellow-soft),transparent)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span class="badge badge--yellow"><span class="d"></span>${L('an_ongoing')}</span><span class="muted" style="margin-left:auto;font-size:12px">${L('d_all_arrow')}</span></div>
            <div class="grid grid--2" style="gap:12px">
              ${miniMetric(active.length, L('an_count'))}
              ${miniMetric('%'+avgProg, L('an_avg_progress'))}
              ${miniMetric(fmtTLlong(ongoingBudget), L('an_total_budget'))}
              ${miniMetric(fmtM2(sumArea(active)), L('an_area'))}
            </div>
            <div style="margin-top:12px;font-size:12.5px;color:var(--text-2)">${L('an_ontrack')}: <b>%${onBudgetPct}</b></div>
            <div class="progress" style="margin-top:8px"><i style="width:${avgProg}%"></i></div>
          </div>
          <div onclick="go('completed')" style="cursor:pointer;border:1px solid var(--border);border-radius:var(--radius);padding:16px;background:linear-gradient(135deg,var(--green-soft),transparent)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span class="badge badge--green"><span class="d"></span>${L('an_completed')}</span><span class="muted" style="margin-left:auto;font-size:12px">${L('d_all_arrow')}</span></div>
            <div class="grid grid--2" style="gap:12px">
              ${miniMetric(done.length, L('an_delivered'))}
              ${miniMetric(fmtTLlong(doneValue), L('an_total_value'))}
              ${miniMetric(fmtTLlong(doneRealized), L('an_realized'))}
              ${miniMetric(fmtM2(sumArea(done)), L('an_area'))}
            </div>
            <div style="margin-top:12px;font-size:12.5px;color:var(--text-2)">${L('an_ontime')}: <b>%${onTimePct}</b></div>
            <div class="progress green" style="margin-top:8px"><i style="width:100%"></i></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:16px;height:26px;border-radius:8px;overflow:hidden">
          <div title="${L('an_ongoing')}" style="height:100%;background:var(--yellow);width:${active.length/projects.length*100}%"></div>
          <div title="${L('an_completed')}" style="height:100%;background:var(--green);width:${done.length/projects.length*100}%"></div>
          <div title="${L('st_planlanan')}" style="height:100%;background:var(--accent);width:${planned.length/projects.length*100}%"></div>
        </div>
        <div class="muted" style="font-size:12px;margin-top:8px;display:flex;gap:16px;flex-wrap:wrap">
          <span>🟡 ${L('an_ongoing')}: ${active.length}</span><span>🟢 ${L('an_completed')}: ${done.length}</span><span>🔵 ${L('st_planlanan')}: ${planned.length}</span>
        </div>
      </div>
    </div>

    ${missing.length ? `<div class="card" style="margin-bottom:16px;border-left:4px solid var(--yellow);cursor:pointer" onclick="go('materials')">
      <div class="card__body" style="display:flex;align-items:center;gap:14px;padding:14px 18px">
        <span style="font-size:22px">⚠️</span>
        <div style="flex:1"><b>${missing.length} ${L('d_missing').toLowerCase()}${kritik.length?` · ${kritik.length} ${L('ms_kritik').toLowerCase()}`:''}.</b>
          <div class="muted" style="font-size:13px">${missing.slice(0,3).map(m=>escapeHtml(m.name)).join(', ')}${missing.length>3?' ...':''}</div></div>
        <span class="btn btn--ghost btn--sm">${L('materials')} →</span>
      </div>
    </div>` : ''}

    <div class="grid grid--main">
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="card">
          <div class="card__head"><h3>${L('d_active_projects')}</h3><div class="spacer"></div>
            <button class="btn btn--ghost btn--sm" onclick="go('ongoing')">${L('d_all_arrow')}</button></div>
          <div class="card__body" style="padding:8px 8px;">
            <div class="table-wrap"><table class="tbl">
              <thead><tr><th>${L('projects')}</th><th>${L('r_muhendis')}</th><th>${L('an_avg_progress')}</th><th>${L('st_tamamlandi')}</th><th>${L('m_status')}</th></tr></thead>
              <tbody>
                ${active.map(p => {
                  const m = Store.userById(p.manager);
                  return `<tr style="cursor:pointer" onclick="go('projectDetail','${p.id}')">
                    <td><div class="cell-main"><div><b>${escapeHtml(p.name)}</b><div class="cell-sub">${p.code} · ${escapeHtml(p.location)}</div></div></div></td>
                    <td>${avatar(m,'avatar--sm')}</td>
                    <td style="min-width:130px"><div class="progress"><i style="width:${p.progress}%"></i></div><div class="cell-sub" style="margin-top:4px">%${p.progress}</div></td>
                    <td class="muted">${fmtDateShort(p.end)}.${new Date(p.end).getFullYear()}</td>
                    <td><span class="badge ${STATUS[p.status].cls}"><span class="d"></span>${tStatus(p.status)}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table></div>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h3>${L('d_budget')}</h3></div>
          <div class="card__body">
            ${active.concat(done.slice(0,1)).map(p => `
              <div style="margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
                  <span>${escapeHtml(p.name)}</span>
                  <span class="muted">${fmtTL(p.spent)} / ${fmtTL(p.budget)}</span>
                </div>
                <div class="progress ${p.spent/p.budget>0.9?'':'green'}"><i style="width:${Math.round(p.spent/p.budget*100)}%"></i></div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="card">
          <div class="card__head"><h3>${L('d_todays')}</h3><span class="badge badge--brand">${todayTasks.length}</span></div>
          <div class="card__body" style="padding:8px 14px;">
            ${todayTasks.length ? todayTasks.slice(0,6).map(taskRow).join('') : emptyBox(L('m_none_missing'))}
          </div>
        </div>
        <div class="card">
          <div class="card__head"><h3>${L('d_recent')}</h3></div>
          <div class="card__body">
            <div class="timeline">
              ${Store.activity().slice(0,6).map(a => `
                <div class="tl-item">
                  <div class="tl-text">${a.text}</div>
                  <div class="tl-time">${a.proj !== '—' ? a.proj + ' · ' : ''}${a.time}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderWorkerDashboard() {
  const u = App.user;
  const mine = Store.tasksByUser(u.id);
  const open = mine.filter(t => t.status !== 'tamamlandi');
  const today = todayISO();
  const todayMine = mine.filter(t => t.date === today);
  const done = mine.filter(t => t.status === 'tamamlandi').length;
  const att = Store.getAttendance(u.id, today);

  $('#content').innerHTML = `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg, var(--brand-soft), transparent)">
      <div class="card__body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        ${avatar(u,'avatar--lg')}
        <div style="flex:1;min-width:200px">
          <h2 style="font-size:20px">Merhaba, ${escapeHtml(u.name.split(' ')[0])} 👋</h2>
          <p class="muted">${escapeHtml(u.title)} · Bugün ${todayMine.length} göreviniz var.</p>
        </div>
        <div>
          <div class="muted" style="font-size:12px;margin-bottom:6px">Bugünkü durumunuz</div>
          ${att
            ? `<span class="badge ${att==='tam'?'badge--green':att==='yarim'?'badge--yellow':att==='izin'?'badge--accent':'badge--red'}">${{tam:'Tam Gün',yarim:'Yarım Gün',yok:'Gelmedi',izin:'İzinli'}[att]}</span>`
            : `<button class="btn btn--primary btn--sm" onclick="workerCheckIn()">Giriş Bildir</button>`}
        </div>
      </div>
    </div>
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('📋','tint-brand', open.length, 'Açık Görevim','')}
      ${stat('📅','tint-accent', todayMine.length, 'Bugünkü Görev','')}
      ${stat('✅','tint-green', done, 'Tamamladığım','')}
      ${stat('🏗️','tint-purple', [...new Set(mine.map(t=>t.projectId))].length, 'Projem','')}
    </div>
    <div class="grid grid--2">
      <div class="card">
        <div class="card__head"><h3>Bugünkü Görevlerim</h3></div>
        <div class="card__body" style="padding:8px 14px">
          ${todayMine.length ? todayMine.map(taskRow).join('') : emptyBox('Bugün planlı göreviniz yok 🎉')}
        </div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Yaklaşan Görevlerim</h3></div>
        <div class="card__body" style="padding:8px 14px">
          ${open.filter(t=>t.date>today).slice(0,6).map(taskRow).join('') || emptyBox('Yaklaşan görev yok')}
        </div>
      </div>
    </div>`;
}

function workerCheckIn() {
  Store.setAttendance(App.user.id, todayISO(), 'tam');
  Store.logActivity(`<b>${App.user.name}</b> günlük giriş bildirimini yaptı`, '—', App.user.id);
  toast('Giriş bildiriminiz kaydedildi ✓');
  renderWorkerDashboard();
}

function stat(icon, tint, val, label, trend) {
  return `<div class="stat">
    <div class="stat__ico ${tint}">${icon}</div>
    <div class="stat__val">${val}</div>
    <div class="stat__label">${label}</div>
    ${trend ? `<div class="stat__trend muted">${trend}</div>` : ''}
  </div>`;
}

function emptyBox(msg, icon = '🗓️') {
  return `<div class="empty"><div class="ico">${icon}</div>${msg}</div>`;
}

function miniMetric(val, label) {
  return `<div><div style="font-size:20px;font-weight:800">${val}</div><div class="muted" style="font-size:12px">${label}</div></div>`;
}

/* ---- Görev satırı ---- */
function taskRow(t) {
  const u = Store.userById(t.assignee);
  const p = Store.projectById(t.projectId);
  const done = t.status === 'tamamlandi';
  return `<div class="task-row ${done?'done':''}">
    <div class="check ${done?'on':''}" onclick="toggleTask('${t.id}')">✓</div>
    <div class="t-body">
      <div class="t-title">${escapeHtml(t.title)}</div>
      <div class="t-meta">
        <span>🏗️ ${p ? escapeHtml(p.name) : '—'}</span>
        <span>👤 ${u ? escapeHtml(u.name.split(' ')[0]) : '—'}</span>
        <span>🕐 ${t.start}–${t.end}</span>
        <span class="badge ${PRIO_CLS[t.priority]==='p-high'?'badge--red':PRIO_CLS[t.priority]==='p-mid'?'badge--yellow':'badge--accent'}">${tPrio(t.priority)}</span>
      </div>
    </div>
  </div>`;
}

function toggleTask(id) {
  const t = Store.tasks().find(x => x.id === id);
  if (!t) return;
  const next = t.status === 'tamamlandi' ? 'devam' : 'tamamlandi';
  Store.updateTask(id, { status: next });
  if (next === 'tamamlandi') {
    Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(t.title)}" görevini tamamladı`, Store.projectById(t.projectId)?.name, App.user.id);
    toast('Görev tamamlandı ✓');
  }
  go(App.route, App.param);
}

/* ============================================================
   PROJELER
   ============================================================ */
function renderProjects() {
  const c = $('#content');
  const lock = App.projLock; // 'devam' | 'tamamlandi' | null
  let list = Store.projects();
  const q = (App._search || '').toLowerCase();
  if (q) list = list.filter(p => (p.name + p.code + p.location + p.client).toLowerCase().includes(q));
  if (lock) list = list.filter(p => p.status === lock);
  else if (App.projFilter !== 'all') list = list.filter(p => p.status === App.projFilter);

  const canManage = isStaff();
  const counts = {
    all: Store.projects().length,
    devam: Store.projects().filter(p=>p.status==='devam').length,
    planlanan: Store.projects().filter(p=>p.status==='planlanan').length,
    tamamlandi: Store.projects().filter(p=>p.status==='tamamlandi').length,
  };

  // Kilitli sayfalar (Devam Eden / Biten) için özet istatistik şeridi
  let header;
  if (lock) {
    const budget = list.reduce((s,p)=>s+p.budget,0);
    const spent = list.reduce((s,p)=>s+p.spent,0);
    const avg = list.length ? Math.round(list.reduce((s,p)=>s+p.progress,0)/list.length) : 0;
    header = `
      <div class="grid grid--stats" style="margin-bottom:16px">
        ${stat(lock==='devam'?'🚧':'✅', lock==='devam'?'tint-yellow':'tint-green', list.length, lock==='devam'?L('nav_ongoing'):L('nav_completed'),'')}
        ${stat('💰','tint-purple', fmtTLlong(budget), L('an_total_budget'),'')}
        ${stat('📐','tint-brand', fmtM2(sumArea(list)), L('an_area'),'')}
        ${lock==='devam'
          ? stat('📊','tint-yellow', '%'+avg, L('an_avg_progress'),'')
          : stat('💵','tint-accent', fmtTLlong(spent), L('an_realized'),'')}
      </div>
      <div class="page-actions">
        <b style="font-size:15px">${lock==='devam'?L('nav_ongoing'):L('nav_completed')} · ${list.length}</b>
        <div class="spacer"></div>
        ${canManage ? `<button class="btn btn--primary" onclick="openProjectModal()">${L('p_new')}</button>` : ''}
      </div>`;
  } else {
    header = `
      <div class="page-actions">
        <div class="chips">
          ${chip('all',L('all'),counts.all)}
          ${chip('devam',L('f_ongoing'),counts.devam)}
          ${chip('planlanan',L('f_planned'),counts.planlanan)}
          ${chip('tamamlandi',L('f_done'),counts.tamamlandi)}
        </div>
        <div class="spacer"></div>
        ${canManage ? `<button class="btn btn--primary" onclick="openProjectModal()">${L('p_new')}</button>` : ''}
      </div>`;
  }

  c.innerHTML = header + (list.length
    ? `<div class="proj-grid">${list.map(projectCard).join('')}</div>`
    : emptyBox(L('p_none'),'🏗️'));

  if (!lock) $$('.chip-btn').forEach(b => b.addEventListener('click', () => { App.projFilter = b.dataset.f; App._search=''; renderProjects(); }));
}

function chip(f, label, count) {
  return `<button class="chip-btn ${App.projFilter===f?'active':''}" data-f="${f}">${label} <span style="opacity:.7">${count}</span></button>`;
}

function projectCard(p) {
  const m = Store.userById(p.manager);
  const team = p.team.map(id => Store.userById(id)).filter(Boolean);
  const tasksOpen = Store.tasksByProject(p.id).filter(t => t.status !== 'tamamlandi').length;
  return `<div class="proj-card" onclick="go('projectDetail','${p.id}')">
    <div class="proj-card__top" style="background-image:url('${p.cover}')">
      <span class="proj-card__code">${p.code}</span>
      <span class="proj-card__badge badge ${STATUS[p.status].cls}"><span class="d"></span>${tStatus(p.status)}</span>
    </div>
    <div class="proj-card__body">
      <h4>${escapeHtml(p.name)}</h4>
      <div class="loc">📍 ${escapeHtml(p.location)} · ${escapeHtml(p.type)}</div>
      <div class="proj-meta"><span>İlerleme</span><span>%${p.progress}</span></div>
      <div class="progress ${p.status==='tamamlandi'?'green':''}"><i style="width:${p.progress}%"></i></div>
      <div class="proj-foot">
        <div class="avatars">
          ${team.slice(0,4).map(u => avatar(u,'avatar--sm')).join('')}
          ${team.length>4?`<div class="avatar avatar--sm more">+${team.length-4}</div>`:''}
        </div>
        <span class="badge">${tasksOpen} ${L('p_open_tasks')}</span>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   PROJE DETAYI
   ============================================================ */
App._detailTab = 'genel';
function renderProjectDetail() {
  const p = Store.projectById(App.param);
  if (!p) { go('projects'); return; }
  $('#pageTitle').textContent = p.name;
  $('#pageSub').textContent = `${p.code} · ${p.client}`;

  // Erişim yetkisi kontrolü — yetkisiz üye/çalışan giremez
  if (!canViewProjectApp(p)) {
    $('#content').innerHTML = `
      <div class="page-actions"><button class="btn btn--ghost btn--sm" onclick="go('${App.user.role==='uye'?'mytracking':'ongoing'}')">← ${L('back')}</button></div>
      <div class="card"><div class="card__body" style="text-align:center;padding:50px 24px">
        <div style="font-size:52px;margin-bottom:14px">🔒</div>
        <h2 style="font-size:22px;margin-bottom:8px">${L('no_access_title')}</h2>
        <p class="muted" style="max-width:440px;margin:0 auto 16px">${L('no_access_text')}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <span class="badge">${escapeHtml(p.name)}</span><span class="badge ${STATUS[p.status].cls}">${tStatus(p.status)}</span>
        </div>
        <button class="btn btn--primary" style="margin-top:20px" onclick="requestAccess('${p.id}')">🙋 ${L('request_access')}</button>
      </div></div>`;
    return;
  }

  const m = Store.userById(p.manager);
  const team = p.team.map(id => Store.userById(id)).filter(Boolean);
  const ptasks = Store.tasksByProject(p.id);
  const doneT = ptasks.filter(t => t.status === 'tamamlandi').length;
  const canManage = isStaff();
  const tab = App._detailTab;

  const daysLeft = Math.ceil((new Date(p.end) - new Date()) / 86400000);

  let tabContent = '';
  if (tab === 'genel') {
    tabContent = `
    <div class="grid grid--main">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card"><div class="card__head"><h3>Proje Açıklaması</h3></div>
          <div class="card__body"><p style="color:var(--text-2)">${escapeHtml(p.desc)}</p></div></div>
        <div class="card"><div class="card__head"><h3>İlerleme & Bütçe</h3></div>
          <div class="card__body">
            <div style="margin-bottom:18px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Fiziksel İlerleme</span><b>%${p.progress}</b></div>
              <div class="progress ${p.status==='tamamlandi'?'green':''}"><i style="width:${p.progress}%"></i></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Bütçe Kullanımı</span><b>${fmtTL(p.spent)} / ${fmtTL(p.budget)}</b></div>
              <div class="progress"><i style="width:${Math.round(p.spent/p.budget*100)}%"></i></div>
              <div class="muted" style="font-size:12px;margin-top:6px">Kalan: ${fmtTL(p.budget - p.spent)}</div>
            </div>
          </div></div>
      </div>
      <div class="card"><div class="card__head"><h3>Proje Bilgileri</h3></div>
        <div class="card__body">
          <dl class="kv">
            <dt>Durum</dt><dd><span class="badge ${STATUS[p.status].cls}">${tStatus(p.status)}</span></dd>
            <dt>İşveren</dt><dd>${escapeHtml(p.client)}</dd>
            <dt>Konum</dt><dd>${escapeHtml(p.location)}</dd>
            <dt>Tür</dt><dd>${escapeHtml(p.type)}</dd>
            <dt>Şantiye Şefi</dt><dd>${m?escapeHtml(m.name):'—'}</dd>
            <dt>Başlangıç</dt><dd>${fmtDate(p.start)}</dd>
            <dt>Bitiş</dt><dd>${fmtDate(p.end)}</dd>
            <dt>Kalan Süre</dt><dd>${p.status==='tamamlandi'?'Tamamlandı':daysLeft>0?daysLeft+' gün':'Süre doldu'}</dd>
            <dt>Görevler</dt><dd>${doneT}/${ptasks.length} tamamlandı</dd>
          </dl>
        </div></div>
    </div>`;
  } else if (tab === 'gorevler') {
    tabContent = `
    <div class="page-actions">
      <b>${ptasks.length} görev</b><div class="spacer"></div>
      ${canManage?`<button class="btn btn--primary btn--sm" onclick="openTaskModal(null,'${p.id}')">+ Görev Ekle</button>`:''}
    </div>
    <div class="card"><div class="card__body" style="padding:8px 16px">
      ${ptasks.length?ptasks.map(taskRow).join(''):emptyBox('Bu projede görev yok','✅')}
    </div></div>`;
  } else if (tab === 'asamalar') {
    const wbs = Store.projectWbs(p.id);
    const totalSub = PHASE_SUBS.length;
    const doneSub = Object.values(wbs).filter(s => s === 'done').length;
    tabContent = `
    <div class="page-actions"><b>İş Kırılım Yapısı — ${doneSub}/${totalSub} kalem tamamlandı</b>
      <div class="spacer"></div><span class="muted">7 ana aşama</span></div>
    <div class="grid" style="gap:14px">
      ${PHASES.map(ph => {
        const subs = ph.subs;
        const dcount = subs.filter(s => wbs[s.id] === 'done').length;
        const acount = subs.filter(s => wbs[s.id] === 'active').length;
        const pct = Math.round(dcount / subs.length * 100);
        const phStatus = dcount === subs.length ? 'green' : acount ? 'yellow' : '';
        return `<div class="card"><div class="card__body">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div class="stat__ico" style="width:40px;height:40px;margin:0;background:${ph.color}22;color:${ph.color}">${ph.icon}</div>
            <div style="flex:1;min-width:0">
              <b>${ph.no}. ${escapeHtml(ph.name)}</b>
              <div class="progress ${phStatus==='green'?'green':''}" style="margin-top:7px"><i style="width:${pct}%;${phStatus==='yellow'?'background:linear-gradient(90deg,var(--yellow),#ffd77a)':''}"></i></div>
            </div>
            <span class="badge ${dcount===subs.length?'badge--green':acount?'badge--yellow':''}">%${pct}</span>
          </div>
          <div>${subs.map(s => {
            const st = wbs[s.id] || 'pending';
            return `<div class="task-row ${st==='done'?'done':''}" style="padding:8px 2px">
              <div class="check ${st==='done'?'on':''}" ${canManage?`onclick="toggleWbs('${p.id}','${s.id}')"`:''} title="${st==='active'?'Devam ediyor':st==='done'?'Tamamlandı':'Bekliyor'}">${st==='done'?'✓':st==='active'?'…':''}</div>
              <div class="t-body"><div class="t-title" style="font-weight:${st==='pending'?'500':'600'}">${escapeHtml(s.name)}</div></div>
              ${st==='active'?'<span class="badge badge--yellow">Devam</span>':''}
            </div>`;
          }).join('')}</div>
        </div></div>`;
      }).join('')}
    </div>`;
  } else if (tab === 'malzeme') {
    const mats = Store.materialsByProject(p.id);
    const missing = mats.filter(m => m.inStock < m.required);
    tabContent = `
    <div class="page-actions">
      <b>${mats.length} malzeme kalemi</b>
      ${missing.length?`<span class="badge badge--yellow">${missing.length} eksik</span>`:'<span class="badge badge--green">Stok tam</span>'}
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--primary btn--sm" onclick="openMaterialModal(null,'${p.id}')">${L('m_add')}</button>`:''}
    </div>
    <div class="card"><div class="card__body" style="padding:8px">
      ${mats.length?`<div class="table-wrap"><table class="tbl">
        <thead><tr><th>Malzeme</th><th>Aşama</th><th>Gereken</th><th>Mevcut</th><th>Eksik</th><th>Durum</th>${canManage?'<th></th>':''}</tr></thead>
        <tbody>${mats.map(m => materialRow(m, canManage)).join('')}</tbody>
      </table></div>`:emptyBox('Bu projede malzeme kaydı yok','📦')}
    </div></div>`;
  } else if (tab === 'ekip') {
    tabContent = `
    <div class="card"><div class="card__head"><h3>Proje Ekibi (${team.length})</h3></div>
      <div class="card__body" style="padding:8px">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Kişi</th><th>Rol</th><th>Görev Sayısı</th><th>İletişim</th></tr></thead>
          <tbody>${team.map(u => {
            const cnt = ptasks.filter(t => t.assignee === u.id).length;
            return `<tr><td><div class="cell-main">${avatar(u,'avatar--sm')}<div><b>${escapeHtml(u.name)}</b><div class="cell-sub">${escapeHtml(u.title)}</div></div></div></td>
              <td><span class="badge">${tRole(u.role)}</span></td>
              <td>${cnt} görev</td><td class="muted">${escapeHtml(u.phone)}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div></div>`;
  } else if (tab === 'erisim') {
    const allowed = new Set(p.access || []);
    const users = Store.users();
    tabContent = `
    <div class="card"><div class="card__head"><h3>🔐 ${L('access_manage')}</h3></div>
      <div class="card__body">
        <p class="muted" style="margin-bottom:14px">${L('access_hint')}</p>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>${L('c_f_name')}</th><th>${tRole('yetkili')}</th><th>${L('m_status')}</th><th></th></tr></thead>
          <tbody>${users.filter(u=>u.role!=='yetkili').map(u => {
            const has = allowed.has(u.id);
            return `<tr><td><div class="cell-main">${avatar(u,'avatar--sm')}<div><b>${escapeHtml(u.name)}</b><div class="cell-sub">${escapeHtml(u.title)}</div></div></div></td>
              <td><span class="badge ${u.role==='muhendis'?'badge--accent':u.role==='uye'?'badge--purple':''}">${tRole(u.role)}</span></td>
              <td>${has?`<span class="badge badge--green"><span class="d"></span>${L('granted')}</span>`:`<span class="badge">—</span>`}</td>
              <td style="text-align:right">${has
                ? `<button class="btn btn--danger btn--sm" onclick="toggleAccess('${p.id}','${u.id}',false)">${L('revoke')}</button>`
                : `<button class="btn btn--primary btn--sm" onclick="toggleAccess('${p.id}','${u.id}',true)">${L('grant')}</button>`}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div></div>`;
  }

  const isAdmin = App.user.role === 'yetkili';
  $('#content').innerHTML = `
    <div class="page-actions"><button class="btn btn--ghost btn--sm" onclick="go('${App.user.role==='uye'?'mytracking':'ongoing'}')">← ${L('back')}</button>
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--ghost btn--sm" onclick="openProjectModal('${p.id}')">${L('edit')}</button>`:''}
    </div>
    <div class="detail-head">
      <div class="banner" style="background-image:url('${p.cover}')">
        <div class="t"><span class="badge ${STATUS[p.status].cls}" style="margin-bottom:8px">${tStatus(p.status)}</span>
          <h2>${escapeHtml(p.name)}</h2><div style="opacity:.9">${p.code} · 📍 ${escapeHtml(p.location)}</div></div>
      </div>
    </div>
    <div class="grid grid--stats" style="margin-bottom:20px">
      ${stat('📊','tint-brand','%'+p.progress,'İlerleme','')}
      ${stat('💰','tint-purple',fmtTLlong(p.budget),L('d_contract'),'')}
      ${stat('✅','tint-green',doneT+'/'+ptasks.length,'Görev','')}
      ${stat('👥','tint-accent',team.length,'Ekip','')}
    </div>
    <div class="tabs">
      <div class="tab ${tab==='genel'?'active':''}" onclick="setDetailTab('genel')">${L('t_overview')}</div>
      <div class="tab ${tab==='asamalar'?'active':''}" onclick="setDetailTab('asamalar')">${L('t_phases')}</div>
      <div class="tab ${tab==='gorevler'?'active':''}" onclick="setDetailTab('gorevler')">${L('t_tasks')}</div>
      <div class="tab ${tab==='malzeme'?'active':''}" onclick="setDetailTab('malzeme')">${L('t_materials')}</div>
      <div class="tab ${tab==='ekip'?'active':''}" onclick="setDetailTab('ekip')">${L('t_team')}</div>
      ${isAdmin?`<div class="tab ${tab==='erisim'?'active':''}" onclick="setDetailTab('erisim')">${L('access_tab')}</div>`:''}
    </div>
    ${tabContent}`;
}

function toggleAccess(pid, uid, grant) {
  if (grant) { Store.grantAccess(pid, uid); toast(L('grant') + ' ✓'); }
  else { Store.revokeAccess(pid, uid); toast(L('revoke') + ' ✓', 'info'); }
  renderProjectDetail();
}

function requestAccess(pid) {
  const p = Store.projectById(pid);
  Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(p?.name||'')}" projesine erişim talep etti`, p?.name, App.user.id);
  toast(L('access_requested'));
}
function setDetailTab(t) { App._detailTab = t; renderProjectDetail(); }

function toggleWbs(pid, subId) {
  const wbs = Store.projectWbs(pid);
  const cur = wbs[subId] || 'pending';
  const next = cur === 'done' ? 'pending' : cur === 'active' ? 'done' : 'active';
  Store.setWbs(pid, subId, next);
  // proje ilerlemesini WBS'e göre otomatik güncelle
  const nw = Store.projectWbs(pid);
  const done = Object.values(nw).filter(s => s === 'done').length;
  Store.updateProject(pid, { progress: Math.round(done / PHASE_SUBS.length * 100) });
  if (next === 'done') { const s = subById(subId); Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(s.name)}" iş kalemini tamamladı`, Store.projectById(pid)?.name, App.user.id); }
  renderProjectDetail();
}

/* ============================================================
   GÖREVLER
   ============================================================ */
function renderTasks() {
  const c = $('#content');
  const canManage = isStaff();
  let list = App.user.role === 'calisan' ? Store.tasksByUser(App.user.id) : Store.tasks();
  const f = App.taskFilter;
  if (f === 'today') list = list.filter(t => t.date === todayISO());
  else if (f === 'open') list = list.filter(t => t.status !== 'tamamlandi');
  else if (f === 'done') list = list.filter(t => t.status === 'tamamlandi');
  else if (f === 'mine') list = list.filter(t => t.assignee === App.user.id);
  list = [...list].sort((a,b) => a.date.localeCompare(b.date));

  // Tarihe göre grupla
  const groups = {};
  list.forEach(t => { (groups[t.date] ||= []).push(t); });

  c.innerHTML = `
    <div class="page-actions">
      <select class="select-sm" id="taskFilter">
        <option value="all">Tüm Görevler</option>
        <option value="today">Bugün</option>
        <option value="open">Açık Görevler</option>
        <option value="done">Tamamlananlar</option>
        <option value="mine">Bana Atananlar</option>
      </select>
      <span class="muted">${list.length} görev</span>
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--primary" onclick="openTaskModal()">+ Görev Ekle</button>`:''}
    </div>
    ${Object.keys(groups).length ? Object.entries(groups).map(([date, ts]) => `
      <div class="card" style="margin-bottom:16px">
        <div class="card__head">
          <h3>${dateHeading(date)}</h3>
          <span class="badge ${date===todayISO()?'badge--brand':''}">${ts.length} görev</span>
        </div>
        <div class="card__body" style="padding:8px 16px">${ts.map(taskRow).join('')}</div>
      </div>`).join('') : emptyBox('Görev bulunamadı','✅')}`;

  $('#taskFilter').value = f;
  $('#taskFilter').addEventListener('change', e => { App.taskFilter = e.target.value; renderTasks(); });
}

function dateHeading(iso) {
  if (iso === todayISO()) return 'Bugün · ' + fmtDate(iso);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  if (iso === todayISO(tomorrow)) return 'Yarın · ' + fmtDate(iso);
  return fmtDate(iso);
}

/* ============================================================
   TAKVİM
   ============================================================ */
function renderCalendar() {
  const y = App.calYear, m = App.calMonth;
  const first = new Date(y, m, 1);
  let startDay = first.getDay(); startDay = startDay === 0 ? 6 : startDay - 1; // Pzt=0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const canManage = isStaff();

  let tasks = App.user.role === 'calisan' ? Store.tasksByUser(App.user.id) : Store.tasks();
  const byDate = {};
  tasks.forEach(t => { (byDate[t.date] ||= []).push(t); });

  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, out: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, iso, tasks: byDate[iso] || [], today: iso === todayISO() });
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length, out: true });

  const monthTasks = tasks.filter(t => { const d = new Date(t.date); return d.getMonth()===m && d.getFullYear()===y; });

  $('#content').innerHTML = `
    <div class="page-actions">
      <button class="btn btn--ghost btn--sm" onclick="calNav(-1)">←</button>
      <b style="min-width:160px;text-align:center;font-size:16px">${MONTHS[m]} ${y}</b>
      <button class="btn btn--ghost btn--sm" onclick="calNav(1)">→</button>
      <button class="btn btn--ghost btn--sm" onclick="calToday()">Bugün</button>
      <span class="muted">${monthTasks.length} görev bu ay</span>
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--primary" onclick="openTaskModal()">+ Görev Ekle</button>`:''}
    </div>
    <div class="card"><div class="card__body">
      <div class="cal">
        <div class="cal__head">${DAYS.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="cal__grid">
          ${cells.map(c => {
            if (c.out) return `<div class="cal__cell out"><div class="cal__date">${c.day}</div></div>`;
            const evs = c.tasks.slice(0,3).map(t => `<div class="cal-ev ${PRIO_CLS[t.priority]} ${t.status==='tamamlandi'?'done':''}" onclick="event.stopPropagation();openTaskDetail('${t.id}')">${escapeHtml(t.title)}</div>`).join('');
            const more = c.tasks.length>3?`<div class="cal-more">+${c.tasks.length-3} daha</div>`:'';
            const count = c.tasks.length?`<span class="badge badge--brand cal-count">${c.tasks.length}</span>`:'';
            return `<div class="cal__cell ${c.today?'today':''}" ondblclick="${canManage?`openTaskModal(null,null,'${c.iso}')`:''}">
              <div class="cal__date">${c.day}</div>${count}${evs}${more}</div>`;
          }).join('')}
        </div>
      </div>
    </div></div>
    <p class="muted" style="margin-top:12px;font-size:12.5px">💡 İpucu: Bir güne çift tıklayarak yeni görev ekleyebilirsiniz. Görev üzerine tıklayarak detayını görün.</p>`;
}
function calNav(d) { App.calMonth += d; if (App.calMonth<0){App.calMonth=11;App.calYear--;} if(App.calMonth>11){App.calMonth=0;App.calYear++;} renderCalendar(); }
function calToday() { App.calMonth = new Date().getMonth(); App.calYear = new Date().getFullYear(); renderCalendar(); }

/* ============================================================
   MALZEME & STOK (Eksik Malzeme Listesi)
   ============================================================ */
const MAT_STATUS = {
  yeterli: { label: 'Yeterli', cls: 'badge--green', dot: 'var(--green)' },
  eksik:   { label: 'Eksik',   cls: 'badge--yellow', dot: 'var(--yellow)' },
  kritik:  { label: 'Kritik',  cls: 'badge--red', dot: 'var(--red)' },
};
App.matFilter = 'all';
App.matView = 'eksik'; // 'eksik' | 'tum'

function renderMaterials() {
  const canManage = isStaff();
  const all = Store.materials();
  const missing = Store.missingMaterials();
  const kritik = all.filter(m => Store.materialStatus(m) === 'kritik');
  const projects = Store.projects();

  let list = App.matView === 'eksik' ? missing : all;
  if (App.matFilter !== 'all') list = list.filter(m => m.projectId === App.matFilter);
  // eksik miktar çoktan aza
  list = [...list].sort((a,b) => (Store.materialStatus(a)==='kritik'?-1:0) - (Store.materialStatus(b)==='kritik'?-1:0) || (b.required-b.inStock)-(a.required-a.inStock));

  $('#content').innerHTML = `
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('📦','tint-brand', all.length, L('m_total'),'')}
      ${stat('⚠️','tint-yellow', missing.length, L('m_missing'),'')}
      ${stat('🚨','tint-red', kritik.length, L('m_critical'),'')}
      ${stat('✅','tint-green', all.length - missing.length, L('m_enough'),'')}
    </div>
    <div class="page-actions">
      <div class="chips">
        <button class="chip-btn ${App.matView==='eksik'?'active':''}" onclick="setMatView('eksik')">${L('m_missing_tab')} <span style="opacity:.7">${missing.length}</span></button>
        <button class="chip-btn ${App.matView==='tum'?'active':''}" onclick="setMatView('tum')">${L('m_all_stock')} <span style="opacity:.7">${all.length}</span></button>
      </div>
      <select class="select-sm" id="matProj">
        <option value="all">${L('m_all_projects')}</option>
        ${projects.map(p => `<option value="${p.id}" ${App.matFilter===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--ghost btn--sm" onclick="exportMissing()">${L('m_copy')}</button>`:''}
      ${canManage?`<button class="btn btn--primary" onclick="openMaterialModal()">${L('m_add')}</button>`:''}
    </div>
    <div class="card"><div class="card__body" style="padding:8px">
      ${list.length ? `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>${L('m_material')}</th><th>${L('m_proj_phase')}</th><th>${L('m_required')}</th><th>${L('m_instock')}</th><th>${L('m_short')}</th><th>${L('m_status')}</th>${canManage?'<th></th>':''}</tr></thead>
        <tbody>${list.map(m => materialRow(m, canManage)).join('')}</tbody>
      </table></div>` : emptyBox(App.matView==='eksik'?L('m_none_missing'):L('m_none_missing'),'📦')}
    </div></div>`;

  $('#matProj')?.addEventListener('change', e => { App.matFilter = e.target.value; renderMaterials(); });
}
function setMatView(v) { App.matView = v; renderMaterials(); }

function materialRow(m, canManage) {
  const st = Store.materialStatus(m);
  const p = Store.projectById(m.projectId);
  const ph = phaseById(m.phaseId);
  const eksik = Math.max(0, m.required - m.inStock);
  return `<tr>
    <td><div class="cell-main"><div><b>${escapeHtml(m.name)}</b>${m.note?`<div class="cell-sub">${escapeHtml(m.note)}</div>`:''}</div></div></td>
    <td><div>${p?escapeHtml(p.name):'—'}</div><div class="cell-sub">${ph?ph.icon+' '+escapeHtml(ph.name):''}</div></td>
    <td>${m.required} <span class="muted">${escapeHtml(m.unit)}</span></td>
    <td>${m.inStock} <span class="muted">${escapeHtml(m.unit)}</span></td>
    <td>${eksik>0?`<b style="color:${st==='kritik'?'var(--red)':'#c99a2e'}">${eksik} ${escapeHtml(m.unit)}</b>`:'<span class="muted">—</span>'}</td>
    <td><span class="badge ${MAT_STATUS[st].cls}"><span class="d"></span>${tMat(st)}</span></td>
    ${canManage?`<td style="text-align:right;white-space:nowrap">
      <button class="btn btn--ghost btn--sm" onclick="quickStock('${m.id}')" title="Stok gir">＋Stok</button>
      <button class="btn btn--ghost btn--sm" onclick="openMaterialModal('${m.id}')">Düzenle</button>
    </td>`:''}
  </tr>`;
}

function quickStock(id) {
  const m = Store.materials().find(x => x.id === id); if (!m) return;
  const add = prompt(`"${m.name}" için gelen stok miktarı (${m.unit}):`, String(Math.max(0, m.required - m.inStock)));
  if (add === null) return;
  const n = parseFloat(add.replace(',','.')); if (isNaN(n)) return;
  Store.updateMaterial(id, { inStock: m.inStock + n });
  Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(m.name)}" stoğuna ${n} ${escapeHtml(m.unit)} girdi`, Store.projectById(m.projectId)?.name, App.user.id);
  toast('Stok güncellendi ✓');
  renderMaterials();
}

function exportMissing() {
  const missing = Store.missingMaterials();
  const lines = ['EKSİK MALZEME LİSTESİ — ' + fmtDate(todayISO()), ''];
  const byProj = {};
  missing.forEach(m => { (byProj[m.projectId] ||= []).push(m); });
  Object.entries(byProj).forEach(([pid, ms]) => {
    lines.push('■ ' + (Store.projectById(pid)?.name || '—'));
    ms.forEach(m => lines.push(`   - ${m.name}: ${Math.max(0,m.required-m.inStock)} ${m.unit} eksik (${Store.materialStatus(m)==='kritik'?'KRİTİK':'eksik'})`));
    lines.push('');
  });
  const text = lines.join('\n');
  navigator.clipboard?.writeText(text).then(
    () => toast('Eksik malzeme listesi panoya kopyalandı ✓'),
    () => { modal(`<div class="modal"><div class="modal__head"><h3>Eksik Malzeme Listesi</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div><div class="modal__body"><textarea style="width:100%;min-height:280px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px;font-family:monospace">${escapeHtml(text)}</textarea></div><div class="modal__foot"><button class="btn btn--ghost" onclick="closeModal()">Kapat</button></div></div>`); }
  );
}

function openMaterialModal(id = null, projectId = null) {
  const m = id ? Store.materials().find(x => x.id === id) : null;
  const projects = Store.projects();
  const pid = m ? m.projectId : (projectId || projects[0]?.id);
  modal(`<div class="modal">
    <div class="modal__head"><h3>${m?'Malzemeyi Düzenle':'Yeni Malzeme'}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <div class="field"><label>Malzeme Adı</label><input id="matName" value="${m?escapeHtml(m.name):''}" placeholder="Ör. C30 Hazır Beton"></div>
      <div class="form-row">
        <div class="field"><label>Proje</label><select id="matProjSel">${projects.map(p=>`<option value="${p.id}" ${pid===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div>
        <div class="field"><label>İş Aşaması</label><select id="matPhase">${PHASES.map(ph=>`<option value="${ph.id}" ${m&&m.phaseId===ph.id?'selected':''}>${ph.no}. ${escapeHtml(ph.name)}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Birim</label><input id="matUnit" value="${m?escapeHtml(m.unit):''}" placeholder="adet / m² / ton / m³"></div>
        <div class="field"><label>Gereken Miktar</label><input type="number" id="matReq" value="${m?m.required:''}" placeholder="0"></div>
      </div>
      <div class="field"><label>Mevcut Stok</label><input type="number" id="matStock" value="${m?m.inStock:0}" placeholder="0"></div>
      <div class="field"><label>Not</label><input id="matNote" value="${m?escapeHtml(m.note):''}" placeholder="Ör. Acil sipariş gerekli"></div>
    </div>
    <div class="modal__foot">
      ${m?`<button class="btn btn--danger" style="margin-right:auto" onclick="deleteMaterialC('${m.id}')">Sil</button>`:''}
      <button class="btn btn--ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn--primary" onclick="saveMaterial('${id||''}')">Kaydet</button>
    </div>
  </div>`);
}
function saveMaterial(id) {
  const name = $('#matName').value.trim();
  if (!name) { toast('Malzeme adı gerekli','warn'); return; }
  const data = {
    name, projectId: $('#matProjSel').value, phaseId: $('#matPhase').value,
    unit: $('#matUnit').value || 'adet', required: +$('#matReq').value || 0,
    inStock: +$('#matStock').value || 0, note: $('#matNote').value,
  };
  if (id) { Store.updateMaterial(id, data); toast('Malzeme güncellendi ✓'); }
  else { Store.addMaterial(data); Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(name)}" malzemesini stoğa ekledi`, Store.projectById(data.projectId)?.name, App.user.id); toast('Malzeme eklendi ✓'); }
  closeModal();
  if (App.route === 'projectDetail') renderProjectDetail(); else renderMaterials();
}
function deleteMaterialC(id) {
  if (!confirm('Malzeme kaydı silinecek. Emin misiniz?')) return;
  Store.deleteMaterial(id); closeModal(); toast('Malzeme silindi','info');
  if (App.route === 'projectDetail') renderProjectDetail(); else renderMaterials();
}

/* ============================================================
   ÇALIŞANLAR
   ============================================================ */
function renderEmployees() {
  const users = Store.users();
  const canManage = App.user.role === 'yetkili';
  $('#content').innerHTML = `
    <div class="page-actions">
      <span class="muted">${users.length} kişi · ${users.filter(u=>u.role==='muhendis').length} mühendis · ${users.filter(u=>u.role==='calisan').length} çalışan</span>
      <div class="spacer"></div>
      ${canManage?`<button class="btn btn--primary" onclick="openEmployeeModal()">+ Personel Ekle</button>`:''}
    </div>
    <div class="grid grid--3">
      ${users.map(u => {
        const tasks = Store.tasksByUser(u.id);
        const open = tasks.filter(t => t.status!=='tamamlandi').length;
        const projs = Store.projects().filter(p => p.team.includes(u.id)).length;
        return `<div class="card"><div class="card__body">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
            ${avatar(u,'avatar--lg')}
            <div style="flex:1;min-width:0">
              <b style="font-size:15px">${escapeHtml(u.name)}</b>
              <div class="cell-sub">${escapeHtml(u.title)}</div>
              <span class="badge ${u.role==='yetkili'?'badge--brand':u.role==='muhendis'?'badge--accent':''}" style="margin-top:5px">${tRole(u.role)}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-2);border-top:1px solid var(--border-soft);padding-top:12px">
            <span>📋 ${open} açık görev</span><span>🏗️ ${projs} proje</span>
          </div>
          <div class="muted" style="font-size:12px;margin-top:8px">📞 ${escapeHtml(u.phone)}</div>
        </div></div>`;
      }).join('')}
    </div>`;
}

/* ============================================================
   PUANTAJ
   ============================================================ */
function renderAttendance() {
  const workers = Store.users().filter(u => u.role === 'calisan' || u.role === 'muhendis');
  const canEdit = isStaff();
  // Son 14 gün
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(addDays(-i));
  const legend = { tam:['Tam','tam','●'], yarim:['Yarım','yar','◐'], yok:['Gelmedi','yok','○'], izin:['İzin','izn','✈'] };

  $('#content').innerHTML = `
    <div class="page-actions">
      <b>Son 14 Gün Puantaj Cetveli</b>
      <div class="spacer"></div>
      <div class="chips">
        ${Object.entries(legend).map(([k,v]) => `<span class="badge"><span class="p-cell ${v[1]}">${v[2]}</span> ${v[0]}</span>`).join('')}
      </div>
    </div>
    <div class="card"><div class="card__body" style="overflow-x:auto">
      <table class="punch">
        <thead><tr><th>Personel</th>${days.map(d => { const dt=new Date(d); return `<th>${dt.getDate()}<br><span style="opacity:.6">${DAYS[(dt.getDay()+6)%7]}</span></th>`; }).join('')}<th>Devam</th></tr></thead>
        <tbody>
          ${workers.map(w => {
            let present = 0;
            const cells = days.map(d => {
              const st = Store.getAttendance(w.id, d) || (d <= todayISO() ? '' : '');
              if (st === 'tam') present += 1; else if (st === 'yarim') present += 0.5;
              const sym = { tam:'●', yarim:'◐', yok:'○', izin:'✈', '':'·' }[st] || '·';
              const cls = { tam:'tam', yarim:'yar', yok:'yok', izin:'izn' }[st] || '';
              return `<td><span class="p-cell ${cls}" ${canEdit?`onclick="cyclePunch('${w.id}','${d}')"`:''}>${sym}</span></td>`;
            }).join('');
            return `<tr><td><div class="cell-main">${avatar(w,'avatar--sm')}<div><b>${escapeHtml(w.name)}</b><div class="cell-sub">${escapeHtml(w.title)}</div></div></div></td>${cells}<td><b>${present}</b> gün</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div></div>
    ${canEdit?`<p class="muted" style="margin-top:12px;font-size:12.5px">💡 Hücrelere tıklayarak durumu değiştirin: Tam → Yarım → İzinli → Gelmedi → Boş</p>`:''}`;
}
function cyclePunch(uid, date) {
  const order = ['tam','yarim','izin','yok',null];
  const cur = Store.getAttendance(uid, date);
  const idx = order.indexOf(cur);
  const next = order[(idx + 1) % order.length];
  if (next) Store.setAttendance(uid, date, next);
  else { delete Store.db.attendance[`${uid}_${date}`]; Store.save(); }
  renderAttendance();
}

/* ============================================================
   RAPORLAR
   ============================================================ */
function renderReports() {
  const projects = Store.projects();
  const byStatus = {
    devam: projects.filter(p=>p.status==='devam').length,
    tamamlandi: projects.filter(p=>p.status==='tamamlandi').length,
    planlanan: projects.filter(p=>p.status==='planlanan').length,
  };
  const total = projects.length;
  const totalBudget = projects.reduce((s,p)=>s+p.budget,0);
  const totalSpent = projects.reduce((s,p)=>s+p.spent,0);
  const tasks = Store.tasks();
  const taskDone = tasks.filter(t=>t.status==='tamamlandi').length;

  // Aylık tamamlanan görev (sahte trend)
  const monthlyBars = [12,18,15,22,19,26,24,31];
  const maxBar = Math.max(...monthlyBars);

  // Donut segmentleri
  const seg = [
    ['var(--yellow)', byStatus.devam, 'Devam Eden'],
    ['var(--green)', byStatus.tamamlandi, 'Tamamlanan'],
    ['var(--accent)', byStatus.planlanan, 'Planlanan'],
  ];
  let acc = 0;
  const grad = seg.map(([c,v]) => { const a = acc; acc += v/total*100; return `${c} ${a}% ${acc}%`; }).join(', ');

  $('#content').innerHTML = `
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('🏗️','tint-brand',total,'Toplam Proje','')}
      ${stat('💰','tint-purple',fmtTLlong(totalBudget),L('d_contract'),'')}
      ${stat('📉','tint-yellow','%'+Math.round(totalSpent/totalBudget*100),'Bütçe Kullanımı','')}
      ${stat('✅','tint-green',taskDone+'/'+tasks.length,'Görev Tamamlama','')}
    </div>
    <div class="grid grid--2">
      <div class="card"><div class="card__head"><h3>Aylık Tamamlanan Görevler</h3></div>
        <div class="card__body">
          <div class="bars">
            ${monthlyBars.map((v,i)=>`<div class="bar"><i class="${i===monthlyBars.length-1?'':'alt'}" style="height:${v/maxBar*100}%"></i><span>${MONTHS[i].slice(0,3)}</span></div>`).join('')}
          </div>
        </div></div>
      <div class="card"><div class="card__head"><h3>Proje Durum Dağılımı</h3></div>
        <div class="card__body">
          <div class="donut-wrap">
            <div class="donut" style="background:conic-gradient(${grad})"><div class="c"><b>${total}</b><span>Proje</span></div></div>
            <div class="legend">
              ${seg.map(([c,v,l])=>`<div class="li"><span class="dot" style="background:${c}"></span>${l}<span class="v">${v}</span></div>`).join('')}
            </div>
          </div>
        </div></div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card__head"><h3>Proje Karnesi</h3></div>
      <div class="card__body" style="padding:8px">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Proje</th><th>Durum</th><th>İlerleme</th><th>Sözleşme</th><th>Harcanan</th><th>Sapma</th></tr></thead>
          <tbody>${projects.map(p => {
            const dev = Math.round((p.spent/p.budget - p.progress/100)*100);
            return `<tr><td><b>${escapeHtml(p.name)}</b><div class="cell-sub">${p.code}</div></td>
              <td><span class="badge ${STATUS[p.status].cls}">${tStatus(p.status)}</span></td>
              <td>%${p.progress}</td><td>${fmtTL(p.budget)}</td><td>${fmtTL(p.spent)}</td>
              <td><span class="${dev>5?'down':'up'}">${dev>0?'+':''}${dev}%</span></td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div></div>`;
}

/* ============================================================
   FİNANS & ÖDEMELER (Muhasebe)
   ============================================================ */
App._finDir = 'all';     // all | in | out
App._finStatus = 'all';  // all | odendi | bekliyor
function setFinDir(d) { App._finDir = d; renderFinance(); }
function setFinStatus(s) { App._finStatus = s; renderFinance(); }

function renderFinance() {
  const role = App.user.role;
  if (role !== 'muhasebe' && role !== 'yetkili') { go('dashboard'); return; } // muhasebeye özel (yetkili de görebilir)
  const pays = Store.payments();
  const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0);
  const collected = sum(pays.filter(p => p.dir === 'in' && p.status === 'odendi'));
  const paidOut   = sum(pays.filter(p => p.dir === 'out' && p.status === 'odendi'));
  const pendingIn = sum(pays.filter(p => p.dir === 'in' && p.status === 'bekliyor'));
  const pendingOut= sum(pays.filter(p => p.dir === 'out' && p.status === 'bekliyor'));
  const net = collected - paidOut;

  let list = pays.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // tarih azalan
  if (App._finDir !== 'all') list = list.filter(p => p.dir === App._finDir);
  if (App._finStatus !== 'all') list = list.filter(p => p.status === App._finStatus);

  const dirBadge = (d) => d === 'in'
    ? `<span class="badge badge--green"><span class="d"></span>Tahsilat</span>`
    : `<span class="badge badge--yellow"><span class="d"></span>Ödeme</span>`;
  const stBadge = (s) => s === 'odendi'
    ? `<span class="badge badge--green">Ödendi</span>`
    : `<span class="badge badge--accent">Bekliyor</span>`;

  $('#content').innerHTML = `
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('💰','tint-green', fmtTLlong(collected), 'Tahsil Edilen', '')}
      ${stat('💸','tint-yellow', fmtTLlong(paidOut), 'Yapılan Ödeme', '')}
      ${stat('📈','tint-brand', fmtTLlong(net), 'Net Nakit Akışı', '')}
      ${stat('⏳','tint-accent', fmtTLlong(pendingIn), 'Bekleyen Tahsilat', pendingOut ? ('Bekleyen ödeme: ' + fmtTL(pendingOut)) : '')}
    </div>
    <div class="page-actions">
      <div class="chips">
        <button class="chip-btn ${App._finDir==='all'?'active':''}" onclick="setFinDir('all')">Tümü <span style="opacity:.7">${pays.length}</span></button>
        <button class="chip-btn ${App._finDir==='in'?'active':''}" onclick="setFinDir('in')">↓ Tahsilat</button>
        <button class="chip-btn ${App._finDir==='out'?'active':''}" onclick="setFinDir('out')">↑ Ödeme</button>
      </div>
      <div class="spacer"></div>
      <div class="chips">
        <button class="chip-btn ${App._finStatus==='all'?'active':''}" onclick="setFinStatus('all')">Hepsi</button>
        <button class="chip-btn ${App._finStatus==='odendi'?'active':''}" onclick="setFinStatus('odendi')">Ödendi</button>
        <button class="chip-btn ${App._finStatus==='bekliyor'?'active':''}" onclick="setFinStatus('bekliyor')">Bekliyor</button>
      </div>
    </div>
    <div class="card"><div class="card__body" style="padding:8px">
      ${list.length ? `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>Tarih</th><th>Yön</th><th>Kategori</th><th>Proje</th><th>Taraf</th><th>Yöntem</th><th>Durum</th><th style="text-align:right">Tutar</th></tr></thead>
        <tbody>${list.map(p => {
          const proj = Store.projectById(p.projectId);
          return `<tr>
            <td class="muted" style="white-space:nowrap">${fmtDate(p.date)}</td>
            <td>${dirBadge(p.dir)}</td>
            <td><b>${escapeHtml(p.category)}</b>${p.note ? `<div class="cell-sub">${escapeHtml(p.note)}</div>` : ''}</td>
            <td>${proj ? escapeHtml(proj.name) : '—'}${proj ? `<div class="cell-sub">${proj.code}</div>` : ''}</td>
            <td>${escapeHtml(p.party)}</td>
            <td class="muted">${escapeHtml(p.method)}</td>
            <td>${stBadge(p.status)}</td>
            <td style="text-align:right;white-space:nowrap;font-weight:800;color:${p.dir==='in'?'var(--green)':'var(--yellow)'}">${p.dir==='in'?'+':'−'}${fmtTL(p.amount)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : emptyBox('Kayıt bulunamadı','💳')}
    </div></div>`;
}

/* ============================================================
   AYARLAR
   ============================================================ */
/* ============================================================
   GELEN TALEPLER (Yönetici)
   ============================================================ */
App._reqTab = 'quotes';
function renderRequests() {
  const tab = App._reqTab;
  const quotes = Store.quotes();
  const apps = Store.applications();
  const leads = Store.leads();
  const qNew = quotes.filter(q => !q.handled).length;
  const aNew = apps.filter(a => !a.handled).length;
  const lNew = leads.filter(l => !l.handled).length;

  const rows = tab === 'quotes' ? (quotes.length ? quotes.map(quoteRow).join('') : null)
    : tab === 'apps' ? (apps.length ? apps.map(appRow).join('') : null)
    : (leads.length ? leads.map(leadRow).join('') : null);

  const head = tab === 'quotes'
    ? `<tr><th>${L('req_date')}</th><th>${L('c_f_name')}</th><th>${L('req_service')}</th><th>${L('req_contact')}</th><th>${L('m_status')}</th><th></th></tr>`
    : tab === 'apps'
    ? `<tr><th>${L('req_date')}</th><th>${L('c_f_name')}</th><th>${L('c_f_apptype')} / ${L('c_f_trade')}</th><th>${L('req_contact')}</th><th>${L('m_status')}</th><th></th></tr>`
    : `<tr><th>${L('req_date')}</th><th>${L('c_f_name')}</th><th>${L('q_f_company')}</th><th>${L('req_contact')}</th><th>${L('m_status')}</th><th></th></tr>`;

  $('#content').innerHTML = `
    <div class="grid grid--stats" style="margin-bottom:16px">
      ${stat('🧾','tint-brand', quotes.length, L('req_quotes'), `${qNew} ${L('req_new').toLowerCase()}`)}
      ${stat('📋','tint-accent', apps.length, L('req_apps'), `${aNew} ${L('req_new').toLowerCase()}`)}
      ${stat('⏳','tint-yellow', qNew+aNew, L('req_pending'), '')}
      ${stat('✅','tint-green', (quotes.length-qNew)+(apps.length-aNew), L('req_handled'), '')}
    </div>
    <div class="page-actions">
      <div class="chips">
        <button class="chip-btn ${tab==='quotes'?'active':''}" onclick="setReqTab('quotes')">🧾 ${L('req_quotes')} <span style="opacity:.7">${quotes.length}</span></button>
        <button class="chip-btn ${tab==='apps'?'active':''}" onclick="setReqTab('apps')">📋 ${L('req_apps')} <span style="opacity:.7">${apps.length}</span></button>
        <button class="chip-btn ${tab==='leads'?'active':''}" onclick="setReqTab('leads')">📄 ${L('req_leads')} <span style="opacity:.7">${leads.length}</span></button>
      </div>
    </div>
    <div class="card"><div class="card__body" style="padding:8px">
      ${rows ? `<div class="table-wrap"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`
             : emptyBox(L('req_empty'),'📭')}
    </div></div>`;
}
function setReqTab(t) { App._reqTab = t; renderRequests(); }

function quoteRow(q) {
  const tel = (q.phone||'').replace(/\s/g,'');
  return `<tr style="${q.handled?'opacity:.55':''}">
    <td class="muted" style="white-space:nowrap">${fmtDateShort(q.date)}</td>
    <td><b>${escapeHtml(q.name)}</b>${q.company?`<div class="cell-sub">${escapeHtml(q.company)}</div>`:''}</td>
    <td>${escapeHtml(q.service||'—')}<div class="cell-sub">${escapeHtml(q.type||'')}${q.area?` · ${fmtNum(q.area)} m²`:''}</div></td>
    <td><a href="tel:${tel}" style="color:var(--brand-2)">${escapeHtml(q.phone)}</a>${q.email?`<div class="cell-sub">${escapeHtml(q.email)}</div>`:''}${q.city?`<div class="cell-sub">📍 ${escapeHtml(q.city)}</div>`:''}</td>
    <td>${q.handled?`<span class="badge badge--green"><span class="d"></span>${L('req_handled')}</span>`:`<span class="badge badge--yellow"><span class="d"></span>${L('req_pending')}</span>`}</td>
    <td style="text-align:right;white-space:nowrap">
      ${q.msg?`<button class="btn btn--ghost btn--sm" onclick="showReqMsg('${escapeAttr(q.msg)}')">${L('req_detail')}</button>`:''}
      <button class="btn btn--ghost btn--sm" onclick="toggleQuote('${q.id}')">${q.handled?L('req_unmark'):L('req_mark')}</button>
      <button class="btn btn--danger btn--sm" onclick="delQuote('${q.id}')">✕</button>
    </td></tr>`;
}
function appRow(a) {
  const tel = (a.phone||'').replace(/\s/g,'');
  return `<tr style="${a.handled?'opacity:.55':''}">
    <td class="muted" style="white-space:nowrap">${fmtDateShort(a.date)}</td>
    <td><b>${escapeHtml(a.name)}</b></td>
    <td>${escapeHtml(a.appType||'—')}<div class="cell-sub">${escapeHtml(a.trade||'')}${a.exp?` · ${a.exp} yıl`:''}${a.crew?` · ${a.crew} kişi`:''}</div></td>
    <td><a href="tel:${tel}" style="color:var(--brand-2)">${escapeHtml(a.phone)}</a>${a.city?`<div class="cell-sub">📍 ${escapeHtml(a.city)}</div>`:''}</td>
    <td>${a.handled?`<span class="badge badge--green"><span class="d"></span>${L('req_handled')}</span>`:`<span class="badge badge--yellow"><span class="d"></span>${L('req_pending')}</span>`}</td>
    <td style="text-align:right;white-space:nowrap">
      ${a.msg?`<button class="btn btn--ghost btn--sm" onclick="showReqMsg('${escapeAttr(a.msg)}')">${L('req_detail')}</button>`:''}
      <button class="btn btn--ghost btn--sm" onclick="toggleApp('${a.id}')">${a.handled?L('req_unmark'):L('req_mark')}</button>
      <button class="btn btn--danger btn--sm" onclick="delApp('${a.id}')">✕</button>
    </td></tr>`;
}
function leadRow(l) {
  const tel = (l.phone||'').replace(/\s/g,'');
  return `<tr style="${l.handled?'opacity:.55':''}">
    <td class="muted" style="white-space:nowrap">${fmtDateShort(l.date)}</td>
    <td><b>${escapeHtml(l.name)}</b></td>
    <td>${escapeHtml(l.company||'—')}</td>
    <td><a href="tel:${tel}" style="color:var(--brand-2)">${escapeHtml(l.phone)}</a>${l.email?`<div class="cell-sub">${escapeHtml(l.email)}</div>`:''}</td>
    <td>${l.handled?`<span class="badge badge--green"><span class="d"></span>${L('req_handled')}</span>`:`<span class="badge badge--yellow"><span class="d"></span>${L('req_pending')}</span>`}</td>
    <td style="text-align:right;white-space:nowrap">
      <button class="btn btn--ghost btn--sm" onclick="toggleLead('${l.id}')">${l.handled?L('req_unmark'):L('req_mark')}</button>
      <button class="btn btn--danger btn--sm" onclick="delLead('${l.id}')">✕</button>
    </td></tr>`;
}
function toggleLead(id) { const l = Store.leads().find(x=>x.id===id); Store.updateLead(id, { handled: !l.handled }); renderRequests(); }
function delLead(id) { if (!confirm('Silinsin mi?')) return; Store.deleteLead(id); toast(L('delete'),'info'); renderRequests(); }
const escapeAttr = (s='') => escapeHtml(s).replace(/\n/g,' ');
function showReqMsg(msg) { modal(`<div class="modal"><div class="modal__head"><h3>${L('req_detail')}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div><div class="modal__body"><p style="color:var(--text-2);white-space:pre-wrap">${msg}</p></div><div class="modal__foot"><button class="btn btn--ghost" onclick="closeModal()">${L('close')}</button></div></div>`); }
function toggleQuote(id) { const q = Store.quotes().find(x=>x.id===id); Store.updateQuote(id, { handled: !q.handled }); renderRequests(); }
function toggleApp(id) { const a = Store.applications().find(x=>x.id===id); Store.updateApplication(id, { handled: !a.handled }); renderRequests(); }
function delQuote(id) { if (!confirm('Silinsin mi?')) return; Store.deleteQuote(id); toast(L('delete'),'info'); renderRequests(); }
function delApp(id) { if (!confirm('Silinsin mi?')) return; Store.deleteApplication(id); toast(L('delete'),'info'); renderRequests(); }

/* ============================================================
   SÖZLEŞMELER
   ============================================================ */
function renderContracts() {
  $('#content').innerHTML = `
    <div class="page-actions">
      <span class="muted">${CONTRACTS.length} ${L('ct_count')}</span>
      <div class="spacer"></div>
    </div>
    <div class="card" style="margin-bottom:16px;border-left:4px solid var(--yellow)">
      <div class="card__body" style="display:flex;align-items:center;gap:12px;padding:14px 18px">
        <span style="font-size:20px">⚖️</span><span class="muted" style="font-size:13px">${L('ct_disclaimer')}</span>
      </div>
    </div>
    <div class="grid grid--3">
      ${CONTRACTS.map(c => `
        <div class="card" style="cursor:pointer" onclick="openContract('${c.id}')">
          <div class="card__body">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div class="stat__ico tint-brand" style="width:46px;height:46px;margin:0">${c.icon}</div>
              <div style="flex:1"><b style="font-size:15px;line-height:1.25;display:block">${escapeHtml(c.name)}</b>
                <span class="badge badge--brand" style="margin-top:4px">${escapeHtml(c.tag)}</span></div>
            </div>
            <p class="muted" style="font-size:13px;min-height:56px">${escapeHtml(c.desc)}</p>
            <button class="btn btn--ghost btn--block btn--sm" style="margin-top:8px">${L('ct_view')} →</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function contractClauses(c, f) {
  const map = {
    '{ISVEREN}': f.employer || '.............................',
    '{YUKLENICI}': f.contractor || 'EMG İmar Müh. İnş. San. ve Tic. Ltd. Şti.',
    '{ISYERI}': f.site || '.............................',
    '{BEDEL}': f.amount || '.............................',
    '{SURE}': f.duration || '........ (........) takvim günü',
    '{TARIH}': f.date || fmtDate(todayISO()),
    '{KONU}': c.konu, '{MALZEME}': c.malzeme, '{EKIPMAN}': c.ekipman,
  };
  const fill = (str) => Object.entries(map).reduce((a, [k, v]) => a.split(k).join(v), str);
  return CONTRACT_STD.map(cl => ({ t: cl.t, d: fill(cl.d) }));
}

function openContract(id) {
  const c = contractById(id); if (!c) return;
  App._contract = { employer: '', contractor: '', site: '', amount: '', duration: '' };
  const clauses = contractClauses(c, App._contract);
  modal(`<div class="modal modal--wide">
    <div class="modal__head"><span class="stat__ico tint-brand" style="width:36px;height:36px;margin:0">${c.icon}</span>
      <h3>${escapeHtml(c.name)}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body" id="contractBody">
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:18px">
        <b style="font-size:13px;color:var(--brand-2)">${L('ct_fill')}</b>
        <div class="form-row" style="margin-top:10px">
          <div class="field" style="margin:0"><label>${L('ct_employer')}</label><input id="ctEmployer" placeholder="İşveren firma / kişi"></div>
          <div class="field" style="margin:0"><label>${L('ct_contractor')}</label><input id="ctContractor" value="EMG İmar Müh. İnş. San. ve Tic. Ltd. Şti."></div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div class="field" style="margin:0"><label>${L('ct_site')}</label><input id="ctSite" placeholder="İlçe / İl"></div>
          <div class="field" style="margin:0"><label>${L('ct_amount')}</label><input id="ctAmount" placeholder="Ör. 5.000.000 TL + KDV"></div>
        </div>
        <div class="field" style="margin:10px 0 0"><label>${L('ct_duration')}</label><input id="ctDuration" placeholder="Ör. 180 (yüzseksen) takvim günü"></div>
      </div>

      <b style="font-size:13px;color:var(--brand-2)">${L('ct_scope')}</b>
      <ul style="margin:8px 0 18px;padding-left:20px;color:var(--text-2);font-size:14px">
        ${c.scope.map(sc => `<li style="margin-bottom:4px">${escapeHtml(sc)}</li>`).join('')}
      </ul>

      <b style="font-size:13px;color:var(--brand-2)">${L('ct_clauses')}</b>
      <div id="clauseList" style="margin-top:10px">${renderClauseList(clauses)}</div>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" onclick="copyContract('${c.id}')">${L('ct_copy')}</button>
      <button class="btn btn--primary" onclick="printContract('${c.id}')">${L('ct_print')}</button>
    </div>
  </div>`);
}
function renderClauseList(clauses) {
  return clauses.map(cl => `<div style="margin-bottom:14px">
    <b style="font-size:13.5px">${escapeHtml(cl.t)}</b>
    <p style="font-size:13px;color:var(--text-2);margin-top:3px;line-height:1.55">${escapeHtml(cl.d)}</p>
  </div>`).join('');
}
function readContractFields() {
  return {
    employer: $('#ctEmployer')?.value, contractor: $('#ctContractor')?.value,
    site: $('#ctSite')?.value, amount: $('#ctAmount')?.value, duration: $('#ctDuration')?.value,
    date: fmtDate(todayISO()),
  };
}
function contractPlainText(id) {
  const c = contractById(id);
  const f = readContractFields();
  const clauses = contractClauses(c, f);
  const lines = [c.name.toUpperCase(), '', 'İŞ KAPSAMI:', ...c.scope.map(s => ' - ' + s), ''];
  clauses.forEach(cl => { lines.push(cl.t); lines.push(cl.d); lines.push(''); });
  lines.push('İŞVEREN', (f.employer || '..............'), '', 'YÜKLENİCİ', (f.contractor || '..............'));
  return lines.join('\n');
}
function copyContract(id) {
  const txt = contractPlainText(id);
  navigator.clipboard?.writeText(txt).then(() => toast(L('ct_copied')), () => toast(L('ct_copied')));
}
function printContract(id) {
  const c = contractById(id);
  const f = readContractFields();
  const clauses = contractClauses(c, f);
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${escapeHtml(c.name)}</title>
    <style>body{font-family:'Times New Roman',serif;max-width:800px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
    h1{text-align:center;font-size:18px;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:10px}
    h2{font-size:14px;margin:18px 0 4px} p{font-size:13px;text-align:justify;margin:0 0 8px}
    ul{font-size:13px} .sign{display:flex;justify-content:space-between;margin-top:60px} .sign div{width:45%;text-align:center;border-top:1px solid #111;padding-top:8px}
    .meta{font-size:12px;color:#555;text-align:center;margin-bottom:20px}</style></head>
    <body onload="window.print()">
      <h1>${escapeHtml(c.name)}</h1>
      <div class="meta">${escapeHtml(c.tag)} · ${fmtDate(todayISO())}</div>
      <h2>İŞ KAPSAMI</h2><ul>${c.scope.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      ${clauses.map(cl => `<h2>${escapeHtml(cl.t)}</h2><p>${escapeHtml(cl.d)}</p>`).join('')}
      <div class="sign"><div>İŞVEREN<br>${escapeHtml(f.employer || '')}</div><div>YÜKLENİCİ<br>${escapeHtml(f.contractor || '')}</div></div>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
  else toast(L('ct_print'), 'info');
}

function renderSettings() {
  const u = App.user;
  const theme = document.documentElement.getAttribute('data-theme');
  $('#content').innerHTML = `
    <div class="grid grid--2">
      <div class="card"><div class="card__head"><h3>${L('set_profile')}</h3></div>
        <div class="card__body">
          <div style="display:flex;gap:14px;align-items:center;margin-bottom:20px">
            ${avatar(u,'avatar--lg')}
            <div><b style="font-size:16px">${escapeHtml(u.name)}</b><div class="cell-sub">${escapeHtml(u.title)} · ${tRole(u.role)}</div></div>
          </div>
          <div class="field"><label>${L('set_name')}</label><input id="setName" value="${escapeHtml(u.name)}"></div>
          <div class="field"><label>E-posta</label><input value="${escapeHtml(u.email)}" disabled></div>
          <div class="field"><label>${L('set_phone')}</label><input id="setPhone" value="${escapeHtml(u.phone)}"></div>
          <div class="field"><label>${L('set_title')}</label><input id="setTitle" value="${escapeHtml(u.title)}"></div>
          <button class="btn btn--primary" onclick="saveProfile()">${L('set_save')}</button>
        </div></div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card"><div class="card__head"><h3>${L('set_appearance')}</h3></div>
          <div class="card__body">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <div><b>${L('set_theme')}</b></div>
              <button class="btn btn--ghost" onclick="toggleTheme();renderSettings()">${theme==='dark'?'☀️':'🌙'}</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><b>${L('set_lang')}</b></div>
              ${langSwitcher()}
            </div>
          </div></div>
        <div class="card"><div class="card__head"><h3>${L('set_app')}</h3></div>
          <div class="card__body">
            <p class="muted" style="margin-bottom:12px">EMG İmar bir PWA'dır. Telefonunuzda tarayıcı menüsünden <b>"Ana ekrana ekle"</b> diyerek uygulama gibi kurabilirsiniz.</p>
            <button class="btn btn--ghost btn--block" onclick="installPWA()">${L('installed')}</button>
          </div></div>
        <div class="card"><div class="card__head"><h3>${L('set_data')}</h3></div>
          <div class="card__body">
            <p class="muted" style="margin-bottom:12px">Demo verilerini sıfırlayıp başlangıç durumuna dönebilirsiniz.</p>
            <button class="btn btn--danger btn--block" onclick="resetData()">${L('set_reset')}</button>
          </div></div>
      </div>
    </div>`;
}
function saveProfile() {
  const u = App.user;
  u.name = $('#setName').value; u.phone = $('#setPhone').value; u.title = $('#setTitle').value;
  Store.updateProject; Store.save();
  toast('Profil güncellendi ✓');
  renderApp();
}
function resetData() {
  if (!confirm('Tüm demo verileri sıfırlanacak. Emin misiniz?')) return;
  Store.reset(); toast('Veriler sıfırlandı','info'); go('dashboard');
}

/* ============================================================
   MODALLAR
   ============================================================ */
function modal(html) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-back'; back.id = 'modalBack';
  back.innerHTML = html;
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}
function closeModal() { $('#modalBack')?.remove(); }

function openProjectModal(id = null) {
  const p = id ? Store.projectById(id) : null;
  const engineers = Store.users().filter(u => u.role === 'yetkili' || u.role === 'muhendis');
  modal(`<div class="modal">
    <div class="modal__head"><h3>${p?'Projeyi Düzenle':'Yeni Proje'}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <div class="field"><label>Proje Adı</label><input id="mName" value="${p?escapeHtml(p.name):''}" placeholder="Ör. Marmara Rezidans B Blok"></div>
      <div class="form-row">
        <div class="field"><label>Proje Kodu</label><input id="mCode" value="${p?p.code:'PRJ-2026-'+String(Store.projects().length+1).padStart(3,'0')}"></div>
        <div class="field"><label>Tür</label><select id="mType">${['Konut','Ticari','Endüstriyel','Kamu','Turizm','Altyapı'].map(t=>`<option ${p&&p.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>İşveren</label><input id="mClient" value="${p?escapeHtml(p.client):''}" placeholder="İşveren firma"></div>
      <div class="field"><label>Konum</label><input id="mLoc" value="${p?escapeHtml(p.location):''}" placeholder="İlçe, İl"></div>
      <div class="form-row">
        <div class="field"><label>Durum</label><select id="mStatus">${STATUS_KEYS.map(k=>`<option value="${k}" ${p&&p.status===k?'selected':''}>${tStatus(k)}</option>`).join('')}</select></div>
        <div class="field"><label>Şantiye Şefi</label><select id="mMgr">${engineers.map(u=>`<option value="${u.id}" ${p&&p.manager===u.id?'selected':''}>${escapeHtml(u.name)}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Başlangıç</label><input type="date" id="mStart" value="${p?p.start:todayISO()}"></div>
        <div class="field"><label>Bitiş</label><input type="date" id="mEnd" value="${p?p.end:addDays(365)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Sözleşme Bedeli (₺)</label><input type="number" id="mBudget" value="${p?p.budget:''}" placeholder="0"></div>
        <div class="field"><label>İlerleme (%)</label><input type="number" id="mProgress" min="0" max="100" value="${p?p.progress:0}"></div>
      </div>
      <div class="field"><label>Açıklama</label><textarea id="mDesc" placeholder="Proje kapsamı...">${p?escapeHtml(p.desc):''}</textarea></div>
    </div>
    <div class="modal__foot">
      ${p?`<button class="btn btn--danger" style="margin-right:auto" onclick="deleteProjectC('${p.id}')">Sil</button>`:''}
      <button class="btn btn--ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn--primary" onclick="saveProject('${id||''}')">Kaydet</button>
    </div>
  </div>`);
}
function saveProject(id) {
  const name = $('#mName').value.trim();
  if (!name) { toast('Proje adı gerekli','warn'); return; }
  const data = {
    name, code: $('#mCode').value, type: $('#mType').value, client: $('#mClient').value,
    location: $('#mLoc').value, status: $('#mStatus').value, manager: $('#mMgr').value,
    start: $('#mStart').value, end: $('#mEnd').value,
    budget: +$('#mBudget').value || 0, progress: +$('#mProgress').value || 0,
    desc: $('#mDesc').value,
  };
  if (id) { Store.updateProject(id, data); toast('Proje güncellendi ✓'); }
  else {
    data.spent = 0; data.team = [data.manager];
    data.cover = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=60';
    const np = Store.addProject(data);
    Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(name)}" projesini oluşturdu`, name, App.user.id);
    toast('Yeni proje oluşturuldu ✓'); id = np.id;
  }
  closeModal(); go(App.route === 'projectDetail' ? 'projectDetail' : 'projects', App.param);
}
function deleteProjectC(id) {
  if (!confirm('Bu proje ve görevleri silinecek. Emin misiniz?')) return;
  Store.deleteProject(id); closeModal(); toast('Proje silindi','info'); go('projects');
}

function openTaskModal(id = null, projectId = null, date = null) {
  const t = id ? Store.tasks().find(x => x.id === id) : null;
  const projects = Store.projects().filter(p => p.status !== 'tamamlandi');
  const users = Store.users();
  const pid = t ? t.projectId : projectId;
  modal(`<div class="modal">
    <div class="modal__head"><h3>${t?'Görevi Düzenle':'Yeni Görev'}</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <div class="field"><label>Görev Başlığı</label><input id="tTitle" value="${t?escapeHtml(t.title):''}" placeholder="Ör. 5. kat kolon demir montajı"></div>
      <div class="form-row">
        <div class="field"><label>Proje</label><select id="tProj">${projects.map(p=>`<option value="${p.id}" ${pid===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Atanan Kişi</label><select id="tAssignee">${users.map(u=>`<option value="${u.id}" ${t&&t.assignee===u.id?'selected':''}>${escapeHtml(u.name)} (${tRole(u.role)})</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Tarih</label><input type="date" id="tDate" value="${t?t.date:(date||todayISO())}"></div>
        <div class="field"><label>Öncelik</label><select id="tPrio">${PRIO_KEYS.map(k=>`<option value="${k}" ${t&&t.priority===k?'selected':''}>${tPrio(k)}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Başlangıç Saati</label><input type="time" id="tStart" value="${t?t.start:'08:00'}"></div>
        <div class="field"><label>Bitiş Saati</label><input type="time" id="tEnd" value="${t?t.end:'17:00'}"></div>
      </div>
      <div class="field"><label>Durum</label><select id="tStatus">${TASK_STATUS_KEYS.map(k=>`<option value="${k}" ${t&&t.status===k?'selected':''}>${tTask(k)}</option>`).join('')}</select></div>
      <div class="field"><label>Açıklama</label><textarea id="tDesc" placeholder="Detay / notlar">${t?escapeHtml(t.desc):''}</textarea></div>
    </div>
    <div class="modal__foot">
      ${t?`<button class="btn btn--danger" style="margin-right:auto" onclick="deleteTaskC('${t.id}')">Sil</button>`:''}
      <button class="btn btn--ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn--primary" onclick="saveTask('${id||''}')">Kaydet</button>
    </div>
  </div>`);
}
function saveTask(id) {
  const title = $('#tTitle').value.trim();
  if (!title) { toast('Görev başlığı gerekli','warn'); return; }
  const data = {
    title, projectId: $('#tProj').value, assignee: $('#tAssignee').value,
    date: $('#tDate').value, priority: $('#tPrio').value,
    start: $('#tStart').value, end: $('#tEnd').value,
    status: $('#tStatus').value, desc: $('#tDesc').value,
  };
  if (id) { Store.updateTask(id, data); toast('Görev güncellendi ✓'); }
  else {
    Store.addTask(data);
    Store.logActivity(`<b>${App.user.name}</b> "${escapeHtml(title)}" görevini oluşturdu`, Store.projectById(data.projectId)?.name, App.user.id);
    toast('Görev eklendi ✓');
  }
  closeModal(); go(App.route, App.param);
}
function deleteTaskC(id) {
  if (!confirm('Görev silinecek. Emin misiniz?')) return;
  Store.deleteTask(id); closeModal(); toast('Görev silindi','info'); go(App.route, App.param);
}

function openTaskDetail(id) {
  const t = Store.tasks().find(x => x.id === id);
  if (!t) return;
  const u = Store.userById(t.assignee); const p = Store.projectById(t.projectId);
  const canManage = isStaff() || t.assignee === App.user.id;
  modal(`<div class="modal">
    <div class="modal__head"><span class="badge ${TASK_STATUS[t.status].cls}">${tTask(t.status)}</span><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <h3 style="font-size:20px;margin-bottom:14px">${escapeHtml(t.title)}</h3>
      <dl class="kv" style="margin-bottom:16px">
        <dt>Proje</dt><dd>${p?escapeHtml(p.name):'—'}</dd>
        <dt>Atanan</dt><dd>${u?escapeHtml(u.name):'—'}</dd>
        <dt>Tarih</dt><dd>${fmtDate(t.date)}</dd>
        <dt>Saat</dt><dd>${t.start} – ${t.end}</dd>
        <dt>Öncelik</dt><dd>${tPrio(t.priority)}</dd>
      </dl>
      ${t.desc?`<p style="color:var(--text-2)">${escapeHtml(t.desc)}</p>`:''}
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" onclick="closeModal()">Kapat</button>
      ${canManage?`<button class="btn btn--ghost" onclick="closeModal();openTaskModal('${t.id}')">Düzenle</button>`:''}
      <button class="btn btn--primary" onclick="toggleTask('${t.id}');closeModal()">${t.status==='tamamlandi'?'Geri Al':'Tamamlandı ✓'}</button>
    </div>
  </div>`);
}

function openEmployeeModal() {
  modal(`<div class="modal">
    <div class="modal__head"><h3>Yeni Personel</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <div class="field"><label>Ad Soyad</label><input id="eName" placeholder="Ör. Ahmet Yılmaz"></div>
      <div class="form-row">
        <div class="field"><label>E-posta</label><input id="eEmail" placeholder="ad@sahapro.com"></div>
        <div class="field"><label>Telefon</label><input id="ePhone" placeholder="05xx xxx xx xx"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Rol</label><select id="eRole"><option value="calisan">Çalışan</option><option value="muhendis">Mühendis</option><option value="muhasebe">Muhasebe</option><option value="yetkili">Yetkili</option></select></div>
        <div class="field"><label>Ünvan</label><input id="eTitle" placeholder="Ör. Kalıp Ustası"></div>
      </div>
      <p class="muted" style="font-size:12.5px">Yeni personelin varsayılan parolası <b>1234</b> olur.</p>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn--primary" onclick="saveEmployee()">Ekle</button>
    </div>
  </div>`);
}
function saveEmployee() {
  const name = $('#eName').value.trim();
  if (!name) { toast('İsim gerekli','warn'); return; }
  const colors = ['#ff7a18','#29b6f6','#2ecc71','#a78bfa','#f4c150','#ef5b5b','#26c6da','#ba68c8'];
  const u = {
    id: 'u' + Date.now(), name, email: $('#eEmail').value || name.toLowerCase().replace(/\s/g,'')+'@sahapro.com',
    pass: '1234', role: $('#eRole').value, title: $('#eTitle').value || 'Personel',
    phone: $('#ePhone').value || '—', color: colors[Store.users().length % colors.length],
  };
  Store.db.users.push(u); Store.save();
  Store.logActivity(`<b>${App.user.name}</b> ekibe <b>${escapeHtml(name)}</b> personelini ekledi`, '—', App.user.id);
  closeModal(); toast('Personel eklendi ✓'); renderEmployees();
}

function openNotifications() {
  const acts = Store.activity().slice(0, 8);
  modal(`<div class="modal">
    <div class="modal__head"><h3>🔔 Bildirimler</h3><div class="spacer"></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal__body">
      <div class="timeline">
        ${acts.map(a => `<div class="tl-item"><div class="tl-text">${a.text}</div><div class="tl-time">${a.proj!=='—'?a.proj+' · ':''}${a.time}</div></div>`).join('')}
      </div>
    </div>
    <div class="modal__foot"><button class="btn btn--ghost" onclick="closeModal()">Kapat</button></div>
  </div>`);
}

/* ---- PWA yükleme ---- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
function installPWA() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
  else toast('Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın','info');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* Başlat */
boot();

/* Service worker (PWA) */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
