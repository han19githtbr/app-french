// ══════════════════════════════
//  CONSTANTS
// ══════════════════════════════
const ICONS = {
  'Gramática':'📚','Cultura':'🇫🇷','Lugares':'🏛️','Esportes':'⚽',
  'Tecnologia':'💻','Relacionamentos':'❤️','Diversidade':'🌍','Natureza':'🌿','Lazeres':'🎭'
};

const GRADS = [
  {l:'Noite',v:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)'},
  {l:'Roxo',v:'linear-gradient(135deg,#0d0d0d 0%,#1a0a2e 50%,#2d1b69 100%)'},
  {l:'Floresta',v:'linear-gradient(135deg,#0a2e0a 0%,#1a3a1a 50%,#2d5a2d 100%)'},
  {l:'Âmbar',v:'linear-gradient(135deg,#2e1a0a 0%,#3a2a1a 50%,#5a3d1a 100%)'},
  {l:'Rosa',v:'linear-gradient(135deg,#1a0a2e 0%,#2e1a4a 50%,#4a2a6e 100%)'},
  {l:'Oceano',v:'linear-gradient(135deg,#0a1a2e 0%,#1a2e4a 50%,#2a4a6e 100%)'},
  {l:'Brasa',v:'linear-gradient(135deg,#1e0a00 0%,#3d1f00 50%,#5a3000 100%)'},
  {l:'Uva',v:'linear-gradient(135deg,#0a0a1e 0%,#1a1a3d 50%,#2a2a5a 100%)'},
  {l:'Rubi',v:'linear-gradient(135deg,#1e0000 0%,#3a0000 50%,#5a1010 100%)'},
  {l:'Verde-água',v:'linear-gradient(135deg,#001a1a 0%,#003a3a 50%,#005a5a 100%)'},
];

// ══════════════════════════════
//  STORE
// ══════════════════════════════
const store = (() => {
  let s = {
    theme: null, post: null, createPost: null,
    db: null,
    saved: (() => { try{ return JSON.parse(localStorage.getItem('fn3_saved')||'[]'); }catch{return [];} })(),
    quiz: { theme:'Todos', qs:[], idx:0, score:0, ans:[], answered:false, done:false }
  };
  const subs = new Set();
  return {
    get: () => s,
    set: (patch) => { s = typeof patch === 'function' ? patch(s) : {...s,...patch}; subs.forEach(f=>f(s)); },
    sub: f => { subs.add(f); return ()=>subs.delete(f); }
  };
})();

function saveSaved(arr) { try{localStorage.setItem('fn3_saved',JSON.stringify(arr));}catch{} }
function loadCustom() { try{return JSON.parse(localStorage.getItem('fn3_custom')||'[]');}catch{return[];} }
function saveCustom(p) { const a=loadCustom(); a.push(p); localStorage.setItem('fn3_custom',JSON.stringify(a)); }

// ══════════════════════════════
//  INIT
// ══════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  await loadDB();
  loadLogo();
  buildThemeGrid();
  buildCreateForm();
  buildGradGrid();
  initItemsBuilder();
  buildQuizThemes();
  renderSaved();
  initQuiz();
  refreshStats();
  store.sub(s => { renderSaved(); refreshStats(); });
});

// ══════════════════════════════
//  DB
// ══════════════════════════════
async function loadDB() {
  try {
    const r = await fetch('database/data.json?v='+Date.now());
    const data = await r.json();
    const custom = loadCustom();
    const ids = new Set(data.posts.map(p=>p.id));
    custom.forEach(p => { if(!ids.has(p.id)) data.posts.push(p); });
    store.set({ db: data });
  } catch(e) {
    console.error('DB load error',e);
    store.set({ db: { themes:['Gramática','Cultura','Lugares','Esportes','Tecnologia','Relacionamentos','Diversidade','Natureza','Lazeres'], posts:[], quiz:[] } });
  }
}

const db = () => store.get().db;

// ══════════════════════════════
//  LOGO
// ══════════════════════════════
async function loadLogo() {
  try {
    const r = await fetch('logo_b64.txt');
    const b64 = (await r.text()).replace(/\n/g,'');
    window.__LOGO__ = b64;
    document.getElementById('headerLogo').src = 'data:image/png;base64,'+b64;
  } catch(e) { console.log('Logo:',e); }
}

function logoHTML(sz=42) {
  if (window.__LOGO__) return `<img class="post-logo" src="data:image/png;base64,${window.__LOGO__}" style="height:${sz}px;width:${sz}px">`;
  return `<div class="post-logo" style="height:${sz}px;width:${sz}px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:.8rem;border-radius:8px;border:2px solid rgba(255,255,255,.3)">FN</div>`;
}

// ══════════════════════════════
//  NAVIGATION
// ══════════════════════════════
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('section-'+id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id==='data') { refreshStats(); renderDBTable(); }
}

// ══════════════════════════════
//  THEME GRID (generator)
// ══════════════════════════════
function buildThemeGrid() {
  const d = db(); if(!d) return;
  document.getElementById('themeGrid').innerHTML = d.themes.map(t=>
    `<button class="theme-chip" id="chip-${t}" onclick="pickTheme('${t}')">${ICONS[t]||'•'} ${t}</button>`
  ).join('');
}

function pickTheme(t) {
  store.set({ theme: t });
  document.querySelectorAll('.theme-chip').forEach(c=>c.classList.remove('selected'));
  document.getElementById('chip-'+t)?.classList.add('selected');
}

// ══════════════════════════════
//  GENERATE
// ══════════════════════════════
function generatePost() {
  const { theme } = store.get();
  if (!theme) { toast('⚠️ Selecione um tema primeiro!','error'); return; }
  spin('genSp',true); setText('genTxt','Gerando…');
  document.getElementById('btnGen').disabled = true;

  setTimeout(() => {
    const posts = db().posts.filter(p=>p.theme===theme);
    if (!posts.length) { toast('Nenhum post para este tema','error'); spin('genSp',false); setText('genTxt','✨ Gerar Publicação'); document.getElementById('btnGen').disabled=false; return; }
    const p = posts[Math.floor(Math.random()*posts.length)];
    store.set({ post: p });
    renderCard(p, document.getElementById('postPreview'), true);
    document.getElementById('postActions').style.display = 'flex';
    spin('genSp',false); setText('genTxt','✨ Gerar Publicação');
    document.getElementById('btnGen').disabled = false;
  }, 480);
}

// ══════════════════════════════
//  RENDER CARD
// ══════════════════════════════
function renderCard(p, el, dismissable = false) {
  el.innerHTML = `
    <div class="post-card" style="cursor:default;">
      <div class="bg-layer" style="background:${p.gradient}"></div>
      <div class="bg-pattern"></div>
      <div class="content-layer">
        <div class="post-theme-tag">${ICONS[p.theme]||'•'} ${p.theme}</div>
        <div class="post-body">
          <div class="post-title">${p.title}</div>
          <div class="post-subtitle">${p.subtitle}</div>
          <div class="post-content">${p.content.map(l=>`<div class="post-item">${l}</div>`).join('')}</div>
        </div>
        <div class="post-footer">
          <div class="post-branding"><strong>francescom3nativos</strong>#ApprendreFrançais</div>
          ${logoHTML(42)}
        </div>
      </div>
    </div>`;
}

function dismissPost() {
  const preview = document.getElementById('postPreview');
  preview.innerHTML = `<div class="empty-state"><div class="empty-icon">🖼️</div><p>Escolha um tema e clique em<br><strong>Gerar Publicação</strong></p></div>`;
  document.getElementById('postActions').style.display = 'none';
  store.set({ post: null });
}

// ══════════════════════════════
//  SAVE
// ══════════════════════════════
function saveCurrentPost() {
  const { post, saved } = store.get();
  if (!post) return;
  if (saved.some(p=>p.id===post.id && p.title===post.title)) { toast('⚠️ Já está salva!','error'); return; }
  const ns = [...saved, post];
  saveSaved(ns);
  store.set({ saved: ns });
  toast('✅ Publicação salva!','success');
}

// ══════════════════════════════
//  DOWNLOAD (html2canvas → PNG 1080x1080)
// ══════════════════════════════
async function buildDownloadHTML(p) {
  const stage = document.getElementById('dlStage');
  stage.innerHTML = `
    <div style="width:1080px;height:1080px;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:58px;">
      <div style="position:absolute;inset:0;background:${p.gradient};z-index:0"></div>
      <div style="position:absolute;inset:0;z-index:1;opacity:.06;background-image:repeating-linear-gradient(45deg,transparent,transparent 28px,rgba(255,255,255,.5) 28px,rgba(255,255,255,.5) 29px)"></div>
      <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;justify-content:space-between;">
        <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);padding:10px 24px;border-radius:100px;font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#fff;width:fit-content;font-family:'DM Sans',Arial,sans-serif">${ICONS[p.theme]||'•'} ${p.theme}</div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:22px 0;">
          <div style="font-family:Georgia,'Playfair Display',serif;font-size:${p.title.length>20?68:80}px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:12px;text-shadow:0 4px 20px rgba(0,0,0,.5)">${p.title}</div>
          <div style="font-size:28px;color:rgba(255,255,255,.72);margin-bottom:28px;font-family:'DM Sans',Arial,sans-serif">${p.subtitle}</div>
          <div style="display:flex;flex-direction:column;gap:12px;">${p.content.map(l=>`<div style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px 22px;font-size:26px;color:rgba(255,255,255,.9);font-family:'DM Sans',Arial,sans-serif;line-height:1.4">${l}</div>`).join('')}</div>
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;">
          <div style="font-family:Georgia,serif;font-size:22px;color:rgba(255,255,255,.7)"><strong style="display:block;color:rgba(255,255,255,.95);font-size:26px">francescom3nativos</strong>#ApprendreFrançais</div>
          ${window.__LOGO__ ? `<img src="data:image/png;base64,${window.__LOGO__}" style="height:88px;width:88px;border-radius:14px;border:3px solid rgba(255,255,255,.35);object-fit:cover">` : ''}
        </div>
      </div>
    </div>`;
  return stage.firstElementChild;
}

async function downloadPost(p) {
  const el = await buildDownloadHTML(p);
  try {
    const canvas = await html2canvas(el, { scale:1, useCORS:true, allowTaint:true, width:1080, height:1080, backgroundColor:null });
    const a = document.createElement('a');
    a.download = (p.title||'post').replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g,'-').slice(0,40) + '.png';
    a.href = canvas.toDataURL('image/png',1.0);
    a.click();
    document.getElementById('dlStage').innerHTML = '';
    toast('✅ Imagem baixada!','success');
  } catch(e) {
    console.error(e);
    document.getElementById('dlStage').innerHTML = '';
    toast('❌ Erro ao gerar imagem','error');
  }
}

async function downloadCurrentPost() {
  const { post } = store.get();
  if (!post) { toast('Gere uma publicação primeiro','error'); return; }
  spin('dlSp',true);
  await downloadPost(post);
  spin('dlSp',false);
}

async function downloadSaved(idx) {
  await downloadPost(store.get().saved[idx]);
}

async function downloadCreatePreview() {
  const { createPost } = store.get();
  if (!createPost) return;
  await downloadPost(createPost);
}

// ══════════════════════════════
//  SAVED GRID
// ══════════════════════════════
function renderSaved() {
  const { saved } = store.get();
  document.getElementById('savedCount').textContent = saved.length + ' salvas';
  const g = document.getElementById('savedGrid');
  if (!saved.length) {
    g.innerHTML = `<div class="saved-empty"><span style="font-size:1.7rem;opacity:.32">📂</span><span>Nenhuma publicação salva</span></div>`;
    return;
  }
  g.innerHTML = saved.map((p,i)=>`
    <div class="saved-thumb" onclick="openSaved(${i})">
      <div class="thumb-bg" style="background:${p.gradient}"></div>
      <div class="thumb-title">${p.title}</div>
      <div class="thumb-actions">
        <button class="thumb-btn dl" title="Baixar" onclick="event.stopPropagation();downloadSaved(${i})">⬇</button>
        <button class="thumb-btn" title="Excluir" onclick="event.stopPropagation();deleteSaved(${i})">✕</button>
      </div>
    </div>`).join('');
}

function deleteSaved(idx) {
  const ns = store.get().saved.filter((_,i)=>i!==idx);
  saveSaved(ns); store.set({ saved: ns });
  toast('🗑️ Removida','');
}

function clearSaved() {
  if (!confirm('Limpar todas as publicações salvas?')) return;
  saveSaved([]); store.set({ saved: [] });
  toast('🗑️ Salvas limpas','');
}

function openSaved(idx) {
  const p = store.get().saved[idx];
  const wrap = document.createElement('div');
  renderCard(p, wrap);
  document.getElementById('modalBody').innerHTML = '';
  document.getElementById('modalBody').appendChild(wrap);
  document.getElementById('modalActs').innerHTML = `
    <button class="btn-sm btn-green" onclick="downloadSaved(${idx})">⬇️ Baixar</button>
    <button class="btn-sm btn-default" onclick="closeModal()">Fechar</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

// ══════════════════════════════
//  CREATE FORM
// ══════════════════════════════
let selGrad = 0;

function buildCreateForm() {
  const d = db(); if(!d) return;
  const sel = document.getElementById('cf-theme');
  sel.innerHTML = d.themes.map(t=>`<option value="${t}">${ICONS[t]||''} ${t}</option>`).join('');
}

function buildGradGrid() {
  document.getElementById('gradGrid').innerHTML = GRADS.map((g,i)=>
    `<div class="grad-swatch ${i===0?'selected':''}" style="background:${g.v}" title="${g.l}" onclick="pickGrad(${i})"></div>`
  ).join('');
}

function pickGrad(i) {
  selGrad = i;
  document.querySelectorAll('.grad-swatch').forEach((s,j)=>s.classList.toggle('selected',j===i));
  livePreview();
}

function initItemsBuilder() {
  const b = document.getElementById('itemsBuilder');
  b.innerHTML = '';
  ['⚽ Jouer au football','🎾 Jouer au tennis','🏊 Faire de la natation'].forEach(v=>addItem(v));
}

function addItem(val='') {
  const b = document.getElementById('itemsBuilder');
  const r = document.createElement('div');
  r.className = 'item-row';
  r.innerHTML = `
    <input class="form-input" type="text" value="${val}" placeholder="Ex: 🔪 Couper = to cut" oninput="livePreview()">
    <button class="btn-icon" onclick="this.parentElement.remove();livePreview()">✕</button>`;
  b.appendChild(r);
  livePreview();
}

function getFormPost() {
  return {
    id: Date.now(),
    theme: document.getElementById('cf-theme').value || 'Gramática',
    title: document.getElementById('cf-title').value.trim() || 'Titre',
    subtitle: document.getElementById('cf-subtitle').value.trim() || 'Sous-titre',
    content: [...document.querySelectorAll('#itemsBuilder .form-input')].map(i=>i.value.trim()).filter(Boolean),
    gradient: GRADS[selGrad].v,
    icon: ICONS[document.getElementById('cf-theme').value] || '📚'
  };
}

function livePreview() {
  const p = getFormPost();
  store.set({ createPost: p });
  renderCard(p, document.getElementById('createPreview'));
  document.getElementById('btnDlCreate').style.display = 'inline-flex';
}

function createPost() {
  const p = getFormPost();
  if (!p.title || p.title === 'Titre') { toast('⚠️ Preencha o título','error'); return; }
  if (!p.content.length) { toast('⚠️ Adicione pelo menos 1 item de conteúdo','error'); return; }

  spin('createSp',true);
  setTimeout(() => {
    // Save to DB (in memory)
    const d = db();
    d.posts.push(p);
    store.set({ db: d });

    // Persist custom
    saveCustom(p);

    // Also save to saved list
    const ns = [...store.get().saved, p];
    saveSaved(ns); store.set({ saved: ns });

    spin('createSp',false);
    toast('✅ Publicação criada e salva!','success');

    // Reset
    document.getElementById('cf-title').value = '';
    document.getElementById('cf-subtitle').value = '';
    initItemsBuilder();
    livePreview();
  }, 380);
}

// ══════════════════════════════
//  DATA MANAGER
// ══════════════════════════════
function refreshStats() {
  const d = db();
  const { saved } = store.get();
  if (!d) return;
  document.getElementById('stPosts').textContent = d.posts?.length ?? 0;
  document.getElementById('stSaved').textContent = saved.length;
  document.getElementById('stQuiz').textContent = d.quiz?.length ?? 0;
}

function renderDBTable() {
  const d = db(); if(!d) return;
  const c = document.getElementById('dbTable');
  if (!d.posts?.length) { c.innerHTML = '<p style="color:var(--muted);font-size:.85rem">Nenhuma publicação no banco.</p>'; return; }
  c.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
      <thead>
        <tr style="border-bottom:1px solid var(--border)">
          ${['Tema','Título','Itens',''].map(h=>`<th style="text-align:left;padding:7px 9px;color:var(--muted);font-weight:600;text-transform:uppercase;font-size:.68rem;letter-spacing:.05em">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${d.posts.map((p,i)=>`
          <tr style="border-bottom:1px solid var(--border)" onmouseenter="this.style.background='rgba(255,255,255,.03)'" onmouseleave="this.style.background=''">
            <td style="padding:8px 9px">${ICONS[p.theme]||''} ${p.theme}</td>
            <td style="padding:8px 9px;font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</td>
            <td style="padding:8px 9px;color:var(--muted)">${p.content?.length||0}</td>
            <td style="padding:8px 9px;text-align:right">
              <button class="btn-sm btn-default" style="padding:4px 9px;font-size:.72rem" onclick="previewDB(${i})">👁️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function previewDB(idx) {
  const p = db().posts[idx];
  const wrap = document.createElement('div');
  renderCard(p, wrap);
  document.getElementById('modalBody').innerHTML = '';
  document.getElementById('modalBody').appendChild(wrap);
  
  document.getElementById('modalActs').innerHTML = `
    <button class="btn-sm btn-green" onclick="downloadPostFromDB(${p.id})">⬇️ Baixar</button>
    <button class="btn-sm btn-purple" onclick="saveSingleFromDB(${p.id})">💾 Salvar</button>
    <button class="btn-sm btn-default" onclick="closeModal()">Fechar</button>`;
  
  document.getElementById('modalOverlay').classList.add('open');
}

function saveSingle(idx) {
  const p = db().posts[idx];
  const { saved } = store.get();
  if (saved.some(s=>s.id===p.id)) { toast('⚠️ Já salva!','error'); return; }
  const ns = [...saved, p];
  saveSaved(ns); store.set({ saved: ns });
  closeModal();
  toast('✅ Salva!','success');
}

function exportData() {
  const d = db();
  const { saved } = store.get();
  const exp = { ...d, savedPosts: saved, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(exp,null,2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.json';
  a.click();
  toast('✅ data.json exportado!','success');
}

function importData(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.posts||!data.themes) throw new Error('Formato inválido');
      store.set({ db: data });
      if (data.savedPosts?.length) { saveSaved(data.savedPosts); store.set({ saved: data.savedPosts }); }
      buildThemeGrid(); buildCreateForm(); buildQuizThemes(); renderDBTable();
      toast('✅ data.json importado!','success');
    } catch(err) { toast('❌ Arquivo inválido: '+err.message,'error'); }
  };
  reader.readAsText(file);
  input.value = '';
}

// ══════════════════════════════
//  QUIZ
// ══════════════════════════════
function buildQuizThemes() {
  const d = db(); if(!d) return;
  const c = document.getElementById('quizThemes');
  c.innerHTML = ['Todos',...d.themes].map(t=>
    `<button class="quiz-theme-btn ${t==='Todos'?'active':''}" onclick="setQTheme('${t}',this)">${t==='Todos'?'🌐 Todos':(ICONS[t]||'')+' '+t}</button>`
  ).join('');
}

function setQTheme(t, btn) {
  document.querySelectorAll('.quiz-theme-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  initQuiz(t);
}

function initQuiz(theme) {
  const d = db(); if(!d) return;
  const t = theme || store.get().quiz.theme || 'Todos';
  let qs = t==='Todos' ? [...d.quiz] : d.quiz.filter(q=>q.theme===t);
  qs = qs.sort(()=>Math.random()-.5).slice(0,Math.min(10,qs.length));
  store.set(s=>({...s, quiz:{theme:t,qs,idx:0,score:0,ans:[],answered:false,done:false}}));
  renderQ();
}

function renderQ() {
  const { quiz } = store.get();
  const body = document.getElementById('quizBody');
  if (!quiz.qs.length) {
    body.innerHTML = `<div style="text-align:center;padding:36px;color:var(--muted)">Nenhuma pergunta para este tema.</div>`;
    return;
  }
  if (quiz.done||quiz.idx>=quiz.qs.length) { renderResult(); return; }
  const q = quiz.qs[quiz.idx];
  const total = quiz.qs.length;
  document.getElementById('qProgress').style.width = ((quiz.idx/total)*100)+'%';
  const L = ['A','B','C','D'];
  body.innerHTML = `
    <div class="quiz-meta">
      <span class="quiz-tag">${ICONS[q.theme]||''} ${q.theme}</span>
      <span class="quiz-counter">${quiz.idx+1} / ${total}</span>
    </div>
    <div class="quiz-question">${q.question}</div>
    <div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option" onclick="answerQ(${i})" id="qo${i}"><span class="opt-letter">${L[i]}</span>${o}</button>`).join('')}</div>
    <div class="quiz-explanation" id="qExpl"><strong>💡 Explicação:</strong> ${q.explanation}</div>
    <div class="quiz-footer">
      <div class="score-dots">
        ${quiz.ans.map(a=>`<div class="score-dot ${a?'correct':'wrong'}"></div>`).join('')}
        ${Array(total-quiz.ans.length).fill('<div class="score-dot"></div>').join('')}
      </div>
      <button class="btn-next" id="btnNext" onclick="nextQ()">${quiz.idx+1===total?'Ver Resultado':'Próxima'} →</button>
    </div>`;
}

function answerQ(sel) {
  const { quiz } = store.get();
  if (quiz.answered) return;
  const q = quiz.qs[quiz.idx];
  const ok = sel===q.correct;
  document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);
  document.getElementById('qo'+q.correct).classList.add('correct');
  if(!ok) document.getElementById('qo'+sel).classList.add('wrong');
  document.getElementById('qExpl').classList.add('visible');
  document.getElementById('btnNext').classList.add('visible');
  const na = [...quiz.ans, ok];
  store.set(s=>({...s,quiz:{...s.quiz,answered:true,score:quiz.score+(ok?1:0),ans:na}}));
  const dots = document.querySelector('.score-dots');
  if(dots) dots.innerHTML = na.map(a=>`<div class="score-dot ${a?'correct':'wrong'}"></div>`).join('')+
    Array(quiz.qs.length-na.length).fill('<div class="score-dot"></div>').join('');
}

function nextQ() {
  const { quiz } = store.get();
  const next = quiz.idx+1;
  if(next>=quiz.qs.length) { store.set(s=>({...s,quiz:{...s.quiz,done:true}})); renderResult(); }
  else { store.set(s=>({...s,quiz:{...s.quiz,idx:next,answered:false}})); renderQ(); }
}

function renderResult() {
  const { quiz } = store.get();
  const pct = Math.round((quiz.score/quiz.qs.length)*100);
  document.getElementById('qProgress').style.width = '100%';
  const [e,m] = pct>=90?['🏆','Incrível! Vous êtes expert!']:pct>=70?['🎉','Très bien! Ótimo!']:pct>=50?['😊','Pas mal! Continue!']:['📚','Continue estudando!'];
  document.getElementById('quizBody').innerHTML = `
    <div class="quiz-result visible">
      <div class="result-emoji">${e}</div>
      <div class="result-score"><span>${quiz.score}</span>/${quiz.qs.length}</div>
      <div class="result-msg">${m}<br><small style="color:var(--muted)">${pct}% de acertos</small></div>
      <button class="btn-restart" onclick="initQuiz()">🔄 Jogar Novamente</button>
    </div>`;
}

// Dismiss post when clicking outside the preview card area
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    if (!store.get().post) return;
    const postPreview = document.getElementById('postPreview');
    const postActions = document.getElementById('postActions');
    const btnGen      = document.getElementById('btnGen');
    if (postPreview && postPreview.contains(e.target)) return;
    if (postActions && postActions.contains(e.target)) return;
    if (btnGen      && btnGen.contains(e.target))      return;
    dismissPost();
  });
});
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function maybeClose(e) { if(e.target===document.getElementById('modalOverlay')) closeModal(); }

// ══════════════════════════════
//  HELPERS
// ══════════════════════════════
function spin(id, on) { document.getElementById(id)?.classList[on?'add':'remove']('on'); }
function setText(id, t) { const el=document.getElementById(id); if(el) el.textContent=t; }
let _tt;
function toast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast '+type+' show';
  clearTimeout(_tt); _tt = setTimeout(()=>t.classList.remove('show'), 3000);
}


// Para download do banco de dados pelo ID
async function downloadPostFromDB(postId) {
  const d = db();
  const post = d.posts.find(p => p.id === postId);
  if (post) {
    await downloadPost(post);
    closeModal(); // Fecha o modal após o download
  } else {
    toast('❌ Post não encontrado', 'error');
  }
}

// Para salvar do banco de dados pelo ID
function saveSingleFromDB(postId) {
  const d = db();
  const post = d.posts.find(p => p.id === postId);
  if (!post) {
    toast('❌ Post não encontrado', 'error');
    return;
  }
  
  const { saved } = store.get();
  if (saved.some(s => s.id === post.id)) { 
    toast('⚠️ Já está salva!', 'error'); 
    return; 
  }
  
  const ns = [...saved, post];
  saveSaved(ns); 
  store.set({ saved: ns });
  closeModal();
  toast('✅ Publicação salva!', 'success');
}

// Para download de posts salvos pelo ID (já existe, mas vamos garantir)
async function downloadSavedById(postId) {
  const { saved } = store.get();
  const post = saved.find(p => p.id === postId);
  if (post) {
    await downloadPost(post);
  } else {
    toast('❌ Post não encontrado', 'error');
  }
}