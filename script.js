/* ========================================
   BOLÃO COPA DO MUNDO 2026 - LÓGICA
   Firebase + Sistema de ID + Ranking Acumulativo
   ======================================== */

// ================================================================
// FIREBASE — PREENCHA COM SUAS CREDENCIAIS DO FIREBASE CONSOLE
// Crie um projeto em https://console.firebase.google.com
// Ative o Realtime Database e cole a config abaixo
// ================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD1dZwcz6hUwDCm0I0Ro5ZjZuTIhiH0cpQ",
  authDomain: "bolao-copa-2026-48722.firebaseapp.com",
  databaseURL: "https://bolao-copa-2026-48722-default-rtdb.firebaseio.com",
  projectId: "bolao-copa-2026-48722",
  storageBucket: "bolao-copa-2026-48722.firebasestorage.app",
  messagingSenderId: "803674486754",
  appId: "1:803674486754:web:99e84991a1771be9556bbb"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================================================================
// ADMIN — ID exclusivo de administrador
// Quem fizer login com este ID terá acesso ao painel admin
// ================================================================
const ADMIN_ID = 'admin';

// ================================================================
// REGRAS DE SEGURANÇA DO FIREBASE (aplique no Console > Database > Rules):
// {
//   "rules": {
//     "bolao2026": {
//       "users": {
//         ".read": true,
//         "$userId": { ".write": "!data.exists()" }
//       },
//       "palpites": {
//         ".read": true,
//         "$userId": { ".write": true }
//       },
//       "results": {
//         ".read": true,
//         ".write": false
//       }
//     }
//   }
// }
// RESULTADOS: Insira manualmente no Console > Database em bolao2026/results/{matchId}
// Exemplo: bolao2026/results/g-1 → { score1: 2, score2: 1 }
// ================================================================

// ---- Mapa de códigos ISO de cada seleção ----
const FLAG_CODES = {
  'México':'mx','África do Sul':'za','Coreia do Sul':'kr','República Tcheca':'cz',
  'Canadá':'ca','Bósnia':'ba','Catar':'qa','Suíça':'ch',
  'Brasil':'br','Marrocos':'ma','Haiti':'ht','Escócia':'gb-sct',
  'Estados Unidos':'us','Paraguai':'py','Austrália':'au','Turquia':'tr',
  'Alemanha':'de','Curaçao':'cw','Costa do Marfim':'ci','Equador':'ec',
  'Holanda':'nl','Japão':'jp','Suécia':'se','Tunísia':'tn',
  'Bélgica':'be','Egito':'eg','Irã':'ir','Nova Zelândia':'nz',
  'Espanha':'es','Cabo Verde':'cv','Arábia Saudita':'sa','Uruguai':'uy',
  'França':'fr','Senegal':'sn','Iraque':'iq','Noruega':'no',
  'Argentina':'ar','Argélia':'dz','Áustria':'at','Jordânia':'jo',
  'Portugal':'pt','RD Congo':'cd','Uzbequistão':'uz','Colômbia':'co',
  'Inglaterra':'gb-eng','Croácia':'hr','Gana':'gh','Panamá':'pa',
};

function getFlag(teamName) {
  const code = FLAG_CODES[teamName];
  if (code) {
    return `<img class="team-flag-img" src="https://flagcdn.com/w80/${code}.png" alt="${teamName}" title="${teamName}" onerror="this.style.display='none'">`;
  }
  return `<span class="team-flag-placeholder">❓</span>`;
}

// ---- Dados dos grupos ----
const GROUPS = {
  'A':['México','África do Sul','Coreia do Sul','República Tcheca'],
  'B':['Canadá','Bósnia','Catar','Suíça'],
  'C':['Brasil','Marrocos','Haiti','Escócia'],
  'D':['Estados Unidos','Paraguai','Austrália','Turquia'],
  'E':['Alemanha','Curaçao','Costa do Marfim','Equador'],
  'F':['Holanda','Japão','Suécia','Tunísia'],
  'G':['Bélgica','Egito','Irã','Nova Zelândia'],
  'H':['Espanha','Cabo Verde','Arábia Saudita','Uruguai'],
  'I':['França','Senegal','Iraque','Noruega'],
  'J':['Argentina','Argélia','Áustria','Jordânia'],
  'K':['Portugal','RD Congo','Uzbequistão','Colômbia'],
  'L':['Inglaterra','Croácia','Gana','Panamá'],
};

// ---- Gerar jogos da fase de grupos ----
function generateGroupMatches() {
  const matches = [];
  let matchId = 1;
  for (const [group, teams] of Object.entries(GROUPS)) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: `g-${matchId}`, group, team1: teams[i], team2: teams[j], phase: 'grupos'
        });
        matchId++;
      }
    }
  }
  return matches;
}

// ---- Jogos eliminatórios (48 times: 16avos → oitavas → quartas → semis → final) ----
function generateKnockoutMatches() {
  // 16 avos de final (Round of 32) — 16 jogos
  const dezesseis_avos = [];
  for (let i = 1; i <= 16; i++) {
    dezesseis_avos.push({
      id: `r32-${i}`, team1: `A definir (${i}A)`, team2: `A definir (${i}B)`, phase: '16avos'
    });
  }

  // Oitavas de final (Round of 16) — 8 jogos
  const oitavas = [];
  for (let i = 1; i <= 8; i++) {
    oitavas.push({
      id: `o-${i}`, team1: `Venc. 16avos ${i*2-1}`, team2: `Venc. 16avos ${i*2}`, phase: 'oitavas'
    });
  }

  const quartas = [
    {id:'q-1',team1:'Venc. Oit.1',team2:'Venc. Oit.2',phase:'quartas'},
    {id:'q-2',team1:'Venc. Oit.3',team2:'Venc. Oit.4',phase:'quartas'},
    {id:'q-3',team1:'Venc. Oit.5',team2:'Venc. Oit.6',phase:'quartas'},
    {id:'q-4',team1:'Venc. Oit.7',team2:'Venc. Oit.8',phase:'quartas'},
  ];
  const semis = [
    {id:'s-1',team1:'Venc. Q1',team2:'Venc. Q2',phase:'semis'},
    {id:'s-2',team1:'Venc. Q3',team2:'Venc. Q4',phase:'semis'},
  ];
  const finalMatch = [
    {id:'f-1',team1:'Venc. SF1',team2:'Venc. SF2',phase:'final'},
  ];
  return [...dezesseis_avos,...oitavas,...quartas,...semis,...finalMatch];
}

const ALL_MATCHES = [...generateGroupMatches(), ...generateKnockoutMatches()];

// ================================================================
// ESTADO DO APP
// ================================================================
let currentUser = null;   // { id, name, chapter, state }
let currentTab = 'grupos';
let cachedPalpites = {};  // cache local dos palpites do Firebase
let participantType = 'demolay'; // 'demolay' ou 'externo'
let isAdmin = false;      // modo admin ativo
let adminSubTab = 'users'; // sub-aba do admin: 'users', 'results' ou 'confrontos'
let adminResultsCache = {}; // cache dos resultados oficiais
let adminSearchQuery = ''; // filtro de busca de usuários
let matchupsCache = {};   // confrontos configurados (para fases eliminatórias)
let adminConfrontosPhase = '16avos'; // fase selecionada na config de confrontos

// ================================================================
// SANITIZAÇÃO E VALIDAÇÃO
// ================================================================
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.trim();
}

function validateId(id) {
  return /^[a-zA-Z0-9_-]{4,20}$/.test(id);
}

// ================================================================
// LOGIN / CADASTRO
// ================================================================
function switchLoginMode(mode) {
  const loginDiv = document.getElementById('loginMode');
  const registerDiv = document.getElementById('registerMode');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (mode === 'login') {
    loginDiv.classList.remove('hidden');
    registerDiv.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginDiv.classList.add('hidden');
    registerDiv.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

// ---- Alternar tipo de participante no cadastro ----
function switchParticipantType(type) {
  participantType = type;
  const toggleDemolay = document.getElementById('toggleDemolay');
  const toggleExterno = document.getElementById('toggleExterno');
  const labelRegId = document.getElementById('labelRegId');
  const inputRegId = document.getElementById('inputRegId');
  const hintRegId = document.getElementById('hintRegId');
  const chapterDemolay = document.getElementById('regChapterDemolay');
  const chapterExterno = document.getElementById('regChapterExterno');

  if (type === 'demolay') {
    toggleDemolay.classList.add('active');
    toggleExterno.classList.remove('active');
    labelRegId.textContent = 'Seu ID DeMolay';
    inputRegId.placeholder = 'Digite seu ID DeMolay';
    hintRegId.textContent = 'Use o ID que voc\u00ea j\u00e1 possui como DeMolay';
    chapterDemolay.classList.remove('hidden');
    chapterExterno.classList.add('hidden');
  } else {
    toggleDemolay.classList.remove('active');
    toggleExterno.classList.add('active');
    labelRegId.textContent = 'Crie seu Usu\u00e1rio';
    inputRegId.placeholder = 'Escolha um nome de usu\u00e1rio';
    hintRegId.textContent = 'Escolha um nome de usu\u00e1rio para acessar o bol\u00e3o (4-20 caracteres)';
    chapterDemolay.classList.add('hidden');
    chapterExterno.classList.remove('hidden');
  }
}

async function handleLogin() {
  const idRaw = document.getElementById('inputLoginId').value.trim();
  const id = sanitize(idRaw).toLowerCase();

  if (!id) { showToast('⚠️ Digite seu ID ou usuário!', true); return; }
  if (!validateId(id)) { showToast('⚠️ ID/Usuário inválido! Use 4-20 caracteres (letras, números, _ ou -)', true); return; }

  const btn = document.getElementById('btnLogin');
  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    const snap = await db.ref(`bolao2026/users/${id}`).once('value');
    if (!snap.exists()) {
      showToast('⚠️ ID/Usuário não encontrado. Cadastre-se primeiro!', true);
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }
    const userData = snap.val();
    currentUser = { id, name: userData.name, chapter: userData.chapter, state: userData.state };
    isAdmin = (id === ADMIN_ID);
    localStorage.setItem('bolao_userId', id);
    await loadPalpites();
    await loadMatchups();
    if (isAdmin) await loadAdminResults();
    showMainScreen();
  } catch (err) {
    console.error('Erro no login:', err);
    showToast('❌ Erro de conexão. Verifique sua internet.', true);
  }
  btn.disabled = false;
  btn.textContent = 'Entrar';
}

async function handleRegister() {
  const idRaw = document.getElementById('inputRegId').value.trim();
  const id = sanitize(idRaw).toLowerCase();
  const name = sanitize(document.getElementById('inputRegName').value.trim());
  const chapterSelect = participantType === 'demolay'
    ? document.getElementById('inputRegChapterDemolay')
    : document.getElementById('inputRegChapterExterno');
  const chapter = sanitize(chapterSelect.value.trim());
  const state = document.getElementById('inputRegState').value;

  if (!id || !name || !chapter || !state) {
    showToast('⚠️ Preencha todos os campos!', true); return;
  }
  if (!validateId(id)) {
    showToast('⚠️ ID/Usuário inválido! Use 4-20 caracteres (letras, números, _ ou -)', true); return;
  }

  const btn = document.getElementById('btnRegister');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    const snap = await db.ref(`bolao2026/users/${id}`).once('value');
    if (snap.exists()) {
      showToast('⚠️ Este ID/usuário já está em uso! Escolha outro.', true);
      btn.disabled = false;
      btn.textContent = 'Cadastrar';
      return;
    }

    await db.ref(`bolao2026/users/${id}`).set({
      name, chapter, state,
      createdAt: new Date().toISOString()
    });

    currentUser = { id, name, chapter, state };
    isAdmin = (id === ADMIN_ID);
    localStorage.setItem('bolao_userId', id);
    cachedPalpites = {};
    await loadMatchups();
    showToast('✅ Cadastro realizado com sucesso!');
    showMainScreen();
  } catch (err) {
    console.error('Erro no cadastro:', err);
    showToast('❌ Erro de conexão. Verifique sua internet.', true);
  }
  btn.disabled = false;
  btn.textContent = 'Cadastrar';
}

function handleLogout() {
  currentUser = null;
  cachedPalpites = {};
  isAdmin = false;
  adminResultsCache = {};
  adminSearchQuery = '';
  matchupsCache = {};
  localStorage.removeItem('bolao_userId');
  document.getElementById('mainScreen').style.display = 'none';
  document.getElementById('adminTab').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginScreen').style.display = 'flex';
}

function showMainScreen() {
  document.getElementById('splashScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'block';
  document.getElementById('headerUserName').textContent = currentUser.name.split(' ')[0];
  const stateBadge = document.getElementById('headerUserState');
  if (currentUser.state) stateBadge.textContent = currentUser.state;
  // Mostrar aba admin se for admin
  if (isAdmin) {
    document.getElementById('adminTab').classList.remove('hidden');
  }
  renderContent();
}

// ---- Verificar sessão salva ----
async function checkSession() {
  const savedId = localStorage.getItem('bolao_userId');
  if (savedId) {
    try {
      const snap = await db.ref(`bolao2026/users/${savedId}`).once('value');
      if (snap.exists()) {
        const d = snap.val();
        currentUser = { id: savedId, name: d.name, chapter: d.chapter, state: d.state };
        isAdmin = (savedId === ADMIN_ID);
        await loadPalpites();
        await loadMatchups();
        if (isAdmin) await loadAdminResults();
        showMainScreen();
        return;
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }
    localStorage.removeItem('bolao_userId');
  }
  // Mostrar tela de login
  document.getElementById('splashScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginScreen').style.display = 'flex';
}

// ================================================================
// NAVEGAÇÃO
// ================================================================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderContent();
}

async function renderContent() {
  const container = document.getElementById('mainContent');
  if (currentTab === 'admin' && isAdmin) {
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Carregando painel admin...</p></div>';
    container.innerHTML = await renderAdminPanel();
  } else if (currentTab === 'ranking') {
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Carregando ranking...</p></div>';
    container.innerHTML = await renderRanking();
  } else if (currentTab === 'campeao') {
    container.innerHTML = renderChampionPick();
  } else if (currentTab === 'grupos') {
    container.innerHTML = renderGroupPhase();
  } else {
    container.innerHTML = renderKnockoutPhase(currentTab);
  }
}

// ================================================================
// RENDERIZAÇÃO DE JOGOS
// ================================================================
function renderGroupPhase() {
  const groupMatches = ALL_MATCHES.filter(m => m.phase === 'grupos');
  let html = `<div class="phase-section active">
    <div class="phase-header">
      <h2>⚽ Fase de Grupos</h2>
      <span class="phase-badge">${groupMatches.length} jogos</span>
    </div>`;

  const byGroup = {};
  groupMatches.forEach(m => {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  });

  for (const [group, matches] of Object.entries(byGroup)) {
    html += `<div class="group-header">🏟️ Grupo ${group}</div><div class="matches-grid">`;
    matches.forEach(m => { html += renderMatchCard(m); });
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function renderKnockoutPhase(phase) {
  const phaseNames = {
    '16avos':'⚔️ 16 Avos de Final','oitavas':'🏆 Oitavas de Final',
    'quartas':'🥇 Quartas de Final','semis':'🔥 Semifinais','final':'👑 Grande Final'
  };
  const matches = ALL_MATCHES.filter(m => m.phase === phase);
  let html = `<div class="phase-section active">
    <div class="phase-header">
      <h2>${phaseNames[phase]}</h2>
      <span class="phase-badge">${matches.length} ${matches.length === 1 ? 'jogo' : 'jogos'}</span>
    </div><div class="matches-grid">`;
  matches.forEach(m => { html += renderMatchCard(m); });
  html += `</div></div>`;
  return html;
}

// Obter nomes reais dos times (usa matchups se configurados pelo admin)
function getMatchTeams(match) {
  const configured = matchupsCache[match.id];
  if (configured && configured.team1 && configured.team2) {
    return { team1: configured.team1, team2: configured.team2 };
  }
  return { team1: match.team1, team2: match.team2 };
}

// Carregar confrontos configurados do Firebase (para todos os usuários)
async function loadMatchups() {
  try {
    const snap = await db.ref('bolao2026/matchups').once('value');
    matchupsCache = snap.val() || {};
  } catch (err) {
    console.error('Erro ao carregar confrontos:', err);
    matchupsCache = {};
  }
}

function renderMatchCard(match) {
  const { team1, team2 } = getMatchTeams(match);
  const saved = cachedPalpites[match.id];
  const score1 = saved ? saved.score1 : '';
  const score2 = saved ? saved.score2 : '';
  const savedClass = saved ? 'saved' : '';
  const btnText = saved ? '✅ Palpite Salvo — Clique para Atualizar' : '💾 Salvar Palpite';
  const flag1 = getFlag(team1);
  const flag2 = getFlag(team2);

  return `
    <div class="match-card ${savedClass}" id="card-${match.id}">
      <div class="match-teams">
        <div class="team">
          <div class="team-flag">${flag1}</div>
          <span class="team-name">${team1}</span>
        </div>
        <div class="score-input-group">
          <input type="number" class="score-input" id="s1-${match.id}" min="0" max="20"
                 value="${score1}" placeholder="-" aria-label="Gols ${team1}">
          <span class="score-x">✕</span>
          <input type="number" class="score-input" id="s2-${match.id}" min="0" max="20"
                 value="${score2}" placeholder="-" aria-label="Gols ${team2}">
        </div>
        <div class="team">
          <div class="team-flag">${flag2}</div>
          <span class="team-name">${team2}</span>
        </div>
      </div>
      <button class="btn-save-match ${savedClass}" onclick="savePalpite('${match.id}')">
        ${btnText}
      </button>
    </div>`;
}

// ================================================================
// PALPITES (Firebase)
// ================================================================
async function loadPalpites() {
  try {
    const snap = await db.ref(`bolao2026/palpites/${currentUser.id}`).once('value');
    cachedPalpites = snap.val() || {};
  } catch (err) {
    console.error('Erro ao carregar palpites:', err);
    cachedPalpites = {};
  }
}

async function savePalpite(matchId) {
  const s1El = document.getElementById(`s1-${matchId}`);
  const s2El = document.getElementById(`s2-${matchId}`);
  const s1 = s1El.value;
  const s2 = s2El.value;

  if (s1 === '' || s2 === '') { showToast('⚠️ Preencha os dois placares!', true); return; }

  const score1 = Math.min(20, Math.max(0, parseInt(s1)));
  const score2 = Math.min(20, Math.max(0, parseInt(s2)));

  try {
    await db.ref(`bolao2026/palpites/${currentUser.id}/${matchId}`).set({
      score1, score2, timestamp: new Date().toISOString()
    });

    cachedPalpites[matchId] = { score1, score2, timestamp: new Date().toISOString() };

    const card = document.getElementById(`card-${matchId}`);
    if (card) {
      card.classList.add('saved');
      const btn = card.querySelector('.btn-save-match');
      btn.textContent = '✅ Palpite Salvo — Clique para Atualizar';
      btn.classList.add('saved');
    }
    showToast('✅ Palpite salvo com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar palpite:', err);
    showToast('❌ Erro ao salvar. Tente novamente.', true);
  }
}

// ================================================================
// PALPITE DO CAMPEÃO
// ================================================================
function getAllTeams() {
  const teams = [];
  for (const group of Object.values(GROUPS)) {
    group.forEach(t => { if (FLAG_CODES[t] !== undefined) teams.push(t); });
  }
  return teams;
}

function renderChampionPick() {
  const teams = getAllTeams();
  const currentPick = cachedPalpites['champion'] || null;

  let html = `<div class="phase-section active">
    <div class="phase-header">
      <h2>🏆 Palpite do Campeão</h2>
      <span class="phase-badge">Escolha a seleção campeã</span>
    </div>
    <p class="champion-subtitle">Selecione a seleção que você acredita que vencerá a Copa do Mundo 2026:</p>`;

  if (currentPick) {
    const pickFlag = getFlag(currentPick);
    html += `<div class="champion-current">
      <span class="champion-current-label">Seu palpite atual:</span>
      <div class="champion-current-team">
        ${pickFlag}
        <span>${currentPick}</span>
      </div>
    </div>`;
  }

  html += `<div class="champion-grid">`;
  teams.forEach(team => {
    const flag = getFlag(team);
    const isSelected = currentPick === team ? 'selected' : '';
    html += `<button class="champion-card ${isSelected}" onclick="selectChampion('${team.replace(/'/g, "\\'")}')"
      title="${team}">
      <div class="champion-card-flag">${flag}</div>
      <span class="champion-card-name">${team}</span>
    </button>`;
  });
  html += `</div></div>`;
  return html;
}

async function selectChampion(team) {
  try {
    await db.ref(`bolao2026/palpites/${currentUser.id}/champion`).set(team);
    cachedPalpites['champion'] = team;
    showToast(`🏆 Campeão escolhido: ${team}`);
    renderContent();
  } catch (err) {
    console.error('Erro ao salvar campeão:', err);
    showToast('❌ Erro ao salvar. Tente novamente.', true);
  }
}

// ================================================================
// RANKING ACUMULATIVO
// ================================================================
async function renderRanking() {
  try {
    const [usersSnap, palpitesSnap, resultsSnap] = await Promise.all([
      db.ref('bolao2026/users').once('value'),
      db.ref('bolao2026/palpites').once('value'),
      db.ref('bolao2026/results').once('value'),
    ]);

    const users = usersSnap.val() || {};
    const allPalpites = palpitesSnap.val() || {};
    const results = resultsSnap.val() || {};
    const totalResults = Object.keys(results).length;

    const rankings = [];
    for (const [userId, userData] of Object.entries(users)) {
      if (userId === ADMIN_ID) continue; // Esconde o admin do ranking

      const userPalpites = allPalpites[userId] || {};
      let points = 0, exact = 0, winner = 0;
      const champPick = userPalpites['champion'] || null;
      const { champion: _, ...matchPalpites } = userPalpites;
      const totalBets = Object.keys(matchPalpites).length;

      for (const [matchId, result] of Object.entries(results)) {
        const p = userPalpites[matchId];
        if (p) {
          if (p.score1 === result.score1 && p.score2 === result.score2) {
            exact++; points += 5;
          } else {
            const pRes = Math.sign(p.score1 - p.score2);
            const rRes = Math.sign(result.score1 - result.score2);
            if (pRes === rRes) { winner++; points += 3; }
          }
        }
      }

      rankings.push({
        id: userId, name: userData.name, chapter: userData.chapter,
        state: userData.state || '—', points, exact, winner, totalBets,
        champion: champPick, isCurrentUser: userId === currentUser.id
      });
    }

    rankings.sort((a, b) => b.points - a.points || b.exact - a.exact);

    // Stats do usuário atual
    const me = rankings.find(u => u.isCurrentUser) || { totalBets:0, points:0, exact:0, winner:0 };

    let html = `<div class="ranking-section active">
      <div class="phase-header">
        <h2>📊 Ranking Geral</h2>
        <span class="phase-badge">${rankings.length} participantes</span>
        ${totalResults > 0 ? `<span class="phase-badge results-badge">${totalResults} resultados</span>` : ''}
      </div>

      <div class="stats-bar">
        <div class="stat-card"><div class="stat-value">${me.totalBets}</div><div class="stat-label">Seus Palpites</div></div>
        <div class="stat-card"><div class="stat-value">${me.points}</div><div class="stat-label">Seus Pontos</div></div>
        <div class="stat-card"><div class="stat-value">${me.exact}</div><div class="stat-label">Placares Exatos</div></div>
        <div class="stat-card"><div class="stat-value">${me.winner}</div><div class="stat-label">Vencedores Certos</div></div>
      </div>

      <table class="ranking-table">
        <thead><tr>
          <th>#</th><th>Participante</th><th>Capítulo</th><th>Estado</th><th>Campeão</th><th>Exatos</th><th>Vencedor</th><th>Pontos</th>
        </tr></thead><tbody>`;

    rankings.forEach((user, index) => {
      const pos = index + 1;
      const rankClass = pos <= 3 ? `rank-${pos}` : '';
      const highlightClass = user.isCurrentUser ? 'rank-highlight' : '';
      const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '';

      html += `<tr class="${highlightClass}">
        <td><span class="rank-pos ${rankClass}">${medal || pos}</span></td>
        <td><span class="rank-name">${user.name}${user.isCurrentUser ? ' (Você)' : ''}</span></td>
        <td><span class="rank-chapter">${user.chapter}</span></td>
        <td><span class="rank-state">${user.state}</span></td>
        <td>${user.champion ? `<span class="rank-champion" title="${user.champion}">${getFlag(user.champion)}</span>` : '<span class="rank-chapter">—</span>'}</td>
        <td><span class="rank-exact">${user.exact}</span></td>
        <td><span class="rank-winner">${user.winner}</span></td>
        <td><span class="rank-points">${user.points} pts</span></td>
      </tr>`;
    });

    html += `</tbody></table>
      <div style="margin-top:28px;padding:20px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);">
        <h3 style="font-family:'Outfit',sans-serif;font-size:1rem;color:var(--accent-gold-light);margin-bottom:12px;">📋 Regras de Pontuação</h3>
        <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.8;">
          🎯 <strong style="color:var(--accent-green);">Placar Exato:</strong> 5 pontos<br>
          ✅ <strong style="color:var(--accent-blue);">Acertar vencedor ou empate:</strong> 3 pontos<br>
          ❌ <strong style="color:var(--accent-red);">Erro:</strong> 0 pontos<br>
          📈 <strong style="color:var(--accent-gold-light);">Ranking Acumulativo:</strong> Pontos acumulam automaticamente
        </p>
      </div>
    </div>`;

    return html;
  } catch (err) {
    console.error('Erro ao carregar ranking:', err);
    return `<div class="error-message">
      <h2>❌ Erro ao carregar ranking</h2>
      <p>Verifique sua conexão ou tente novamente.</p>
      <button class="btn-primary" style="max-width:200px;margin:16px auto;" onclick="renderContent()">Tentar novamente</button>
    </div>`;
  }
}

// ================================================================
// TOAST
// ================================================================
function showToast(message, isWarning = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = message;
  toast.style.borderColor = isWarning ? 'var(--accent-red)' : 'var(--accent-green)';
  toast.style.color = isWarning ? 'var(--accent-red)' : 'var(--accent-green)';
  toast.classList.remove('hidden', 'hide');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

// ================================================================
// ADMIN — PAINEL COMPLETO
// ================================================================

// Carregar resultados oficiais do Firebase
async function loadAdminResults() {
  try {
    const snap = await db.ref('bolao2026/results').once('value');
    adminResultsCache = snap.val() || {};
  } catch (err) {
    console.error('Erro ao carregar resultados:', err);
    adminResultsCache = {};
  }
}

// Alternar sub-aba do admin
function switchAdminSubTab(subTab) {
  adminSubTab = subTab;
  renderContent();
}

// Atualizar busca de usuários
function updateAdminSearch(value) {
  adminSearchQuery = value.toLowerCase().trim();
  // Re-renderizar apenas a tabela de usuários
  const tableBody = document.getElementById('adminUsersTableBody');
  const countEl = document.getElementById('adminUsersCount');
  if (tableBody) {
    renderAdminUsersTable();
  }
}

// Renderizar painel admin principal
async function renderAdminPanel() {
  const usersActive = adminSubTab === 'users' ? 'active' : '';
  const resultsActive = adminSubTab === 'results' ? 'active' : '';
  const confrontosActive = adminSubTab === 'confrontos' ? 'active' : '';

  let html = `<div class="phase-section active">
    <div class="phase-header">
      <h2>🔧 Painel Administrativo</h2>
      <span class="phase-badge admin-badge">ADMIN</span>
    </div>

    <!-- Sub-abas do admin -->
    <div class="admin-sub-tabs">
      <button class="admin-sub-tab ${usersActive}" onclick="switchAdminSubTab('users')">
        👥 Usuários
      </button>
      <button class="admin-sub-tab ${resultsActive}" onclick="switchAdminSubTab('results')">
        📋 Resultados
      </button>
      <button class="admin-sub-tab ${confrontosActive}" onclick="switchAdminSubTab('confrontos')">
        ⚔️ Confrontos
      </button>
    </div>

    <div class="admin-content">`;

  if (adminSubTab === 'users') {
    html += await renderAdminUsers();
  } else if (adminSubTab === 'results') {
    html += await renderAdminResults();
  } else if (adminSubTab === 'confrontos') {
    html += await renderAdminConfrontos();
  }

  html += `</div></div>`;
  return html;
}

// ---- SUB-ABA: Gerenciar Usuários ----
async function renderAdminUsers() {
  try {
    const snap = await db.ref('bolao2026/users').once('value');
    const users = snap.val() || {};
    const userList = Object.entries(users)
      .filter(([id]) => id !== ADMIN_ID)
      .map(([id, data]) => ({ id, ...data }));

    let html = `
      <div class="admin-users-header">
        <div class="admin-users-info">
          <span class="admin-users-count" id="adminUsersCount">${userList.length} usuário(s) cadastrado(s)</span>
        </div>
        <div class="admin-search-box">
          <span class="admin-search-icon">🔍</span>
          <input type="text" id="adminSearchInput" class="admin-search-input" 
                 placeholder="Buscar por nome ou ID..." 
                 value="${adminSearchQuery}"
                 oninput="updateAdminSearch(this.value)">
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="ranking-table admin-table">
          <thead><tr>
            <th>ID</th><th>Nome</th><th>Capítulo/Vínculo</th><th>Estado</th><th>Cadastro</th><th>Ação</th>
          </tr></thead>
          <tbody id="adminUsersTableBody">`;

    const filtered = adminSearchQuery
      ? userList.filter(u =>
          u.id.toLowerCase().includes(adminSearchQuery) ||
          (u.name && u.name.toLowerCase().includes(adminSearchQuery))
        )
      : userList;

    if (filtered.length === 0) {
      html += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">
        ${adminSearchQuery ? 'Nenhum usuário encontrado para essa busca.' : 'Nenhum usuário cadastrado ainda.'}
      </td></tr>`;
    } else {
      filtered.forEach(user => {
        const dateStr = user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('pt-BR')
          : '—';
        html += `<tr id="admin-row-${user.id}">
          <td><span class="admin-user-id">${user.id}</span></td>
          <td><span class="rank-name">${user.name || '—'}</span></td>
          <td><span class="rank-chapter">${user.chapter || '—'}</span></td>
          <td><span class="rank-state">${user.state || '—'}</span></td>
          <td><span class="rank-chapter">${dateStr}</span></td>
          <td>
            <button class="btn-admin-delete" onclick="confirmDeleteUser('${user.id}', '${(user.name || user.id).replace(/'/g, "\\'")}')">🗑️ Excluir</button>
          </td>
        </tr>`;
      });
    }

    html += `</tbody></table></div>`;
    return html;
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
    return `<div class="error-message">
      <h2>❌ Erro ao carregar usuários</h2>
      <p>Verifique sua conexão ou tente novamente.</p>
      <button class="btn-primary" style="max-width:200px;margin:16px auto;" onclick="renderContent()">Tentar novamente</button>
    </div>`;
  }
}

// Re-renderizar tabela de usuários (para busca dinâmica)
async function renderAdminUsersTable() {
  try {
    const snap = await db.ref('bolao2026/users').once('value');
    const users = snap.val() || {};
    const userList = Object.entries(users)
      .filter(([id]) => id !== ADMIN_ID)
      .map(([id, data]) => ({ id, ...data }));

    const filtered = adminSearchQuery
      ? userList.filter(u =>
          u.id.toLowerCase().includes(adminSearchQuery) ||
          (u.name && u.name.toLowerCase().includes(adminSearchQuery))
        )
      : userList;

    const tableBody = document.getElementById('adminUsersTableBody');
    const countEl = document.getElementById('adminUsersCount');
    if (countEl) countEl.textContent = `${filtered.length} de ${userList.length} usuário(s)`;

    let html = '';
    if (filtered.length === 0) {
      html = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">
        Nenhum usuário encontrado para essa busca.
      </td></tr>`;
    } else {
      filtered.forEach(user => {
        const dateStr = user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('pt-BR')
          : '—';
        html += `<tr id="admin-row-${user.id}">
          <td><span class="admin-user-id">${user.id}</span></td>
          <td><span class="rank-name">${user.name || '—'}</span></td>
          <td><span class="rank-chapter">${user.chapter || '—'}</span></td>
          <td><span class="rank-state">${user.state || '—'}</span></td>
          <td><span class="rank-chapter">${dateStr}</span></td>
          <td>
            <button class="btn-admin-delete" onclick="confirmDeleteUser('${user.id}', '${(user.name || user.id).replace(/'/g, "\\'")}')">🗑️ Excluir</button>
          </td>
        </tr>`;
      });
    }
    if (tableBody) tableBody.innerHTML = html;
  } catch (err) {
    console.error('Erro ao re-renderizar tabela:', err);
  }
}

// Confirmar exclusão de usuário
function confirmDeleteUser(userId, userName) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmModalIcon').textContent = '🗑️';
  document.getElementById('confirmModalTitle').textContent = 'Excluir Usuário';
  document.getElementById('confirmModalMsg').innerHTML = `Tem certeza que deseja excluir <strong>${userName}</strong> (${userId})?<br><br><small style="color:var(--accent-red);">Esta ação irá remover o usuário e todos os seus palpites permanentemente.</small>`;
  const btn = document.getElementById('confirmModalBtn');
  btn.textContent = '🗑️ Excluir';
  btn.className = 'btn-modal btn-modal-danger';
  btn.onclick = () => adminDeleteUser(userId);
  modal.classList.remove('hidden');
}

// Fechar modal de confirmação
function closeConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden');
}

// Excluir usuário do Firebase
async function adminDeleteUser(userId) {
  closeConfirmModal();
  try {
    await Promise.all([
      db.ref(`bolao2026/users/${userId}`).remove(),
      db.ref(`bolao2026/palpites/${userId}`).remove()
    ]);
    // Remover linha da tabela
    const row = document.getElementById(`admin-row-${userId}`);
    if (row) {
      row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => row.remove(), 300);
    }
    showToast(`✅ Usuário "${userId}" excluído com sucesso!`);
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    showToast('❌ Erro ao excluir usuário. Verifique as regras do Firebase.', true);
  }
}

// ---- SUB-ABA: Resultados dos Jogos ----
async function renderAdminResults() {
  // Recarregar resultados do Firebase
  await loadAdminResults();

  const totalWithResults = Object.keys(adminResultsCache).length;
  const totalMatches = ALL_MATCHES.length;

  let html = `
    <div class="admin-results-header">
      <div class="admin-results-stats">
        <span class="admin-results-count">📊 ${totalWithResults} de ${totalMatches} jogos com resultado</span>
      </div>
    </div>`;

  // Fase de grupos
  const groupMatches = ALL_MATCHES.filter(m => m.phase === 'grupos');
  const byGroup = {};
  groupMatches.forEach(m => {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  });

  html += `<div class="admin-phase-section">
    <div class="admin-phase-title">⚽ Fase de Grupos</div>`;

  for (const [group, matches] of Object.entries(byGroup)) {
    html += `<div class="group-header">🏟️ Grupo ${group}</div>
             <div class="matches-grid">`;
    matches.forEach(m => { html += renderAdminMatchCard(m); });
    html += `</div>`;
  }
  html += `</div>`;

  // Fases eliminatórias
  const phases = [
    { key: '16avos', label: '⚔️ 16 Avos de Final' },
    { key: 'oitavas', label: '🏆 Oitavas de Final' },
    { key: 'quartas', label: '🥇 Quartas de Final' },
    { key: 'semis', label: '🔥 Semifinais' },
    { key: 'final', label: '👑 Grande Final' }
  ];

  phases.forEach(phase => {
    const matches = ALL_MATCHES.filter(m => m.phase === phase.key);
    if (matches.length > 0) {
      html += `<div class="admin-phase-section">
        <div class="admin-phase-title">${phase.label}</div>
        <div class="matches-grid">`;
      matches.forEach(m => { html += renderAdminMatchCard(m); });
      html += `</div></div>`;
    }
  });

  return html;
}

// Renderizar card de jogo para admin (com inputs de resultado)
function renderAdminMatchCard(match) {
  const { team1, team2 } = getMatchTeams(match);
  const result = adminResultsCache[match.id];
  const score1 = result ? result.score1 : '';
  const score2 = result ? result.score2 : '';
  const hasResult = result !== undefined && result !== null;
  const savedClass = hasResult ? 'saved' : '';
  const flag1 = getFlag(team1);
  const flag2 = getFlag(team2);

  return `
    <div class="match-card admin-match-card ${savedClass}" id="admin-card-${match.id}">
      ${hasResult ? '<div class="admin-result-badge">✅ Resultado Oficial</div>' : '<div class="admin-result-badge pending">⏳ Sem Resultado</div>'}
      <div class="match-teams">
        <div class="team">
          <div class="team-flag">${flag1}</div>
          <span class="team-name">${team1}</span>
        </div>
        <div class="score-input-group">
          <input type="number" class="score-input admin-score-input" id="admin-s1-${match.id}" min="0" max="20"
                 value="${score1}" placeholder="-" aria-label="Gols ${team1}">
          <span class="score-x">✕</span>
          <input type="number" class="score-input admin-score-input" id="admin-s2-${match.id}" min="0" max="20"
                 value="${score2}" placeholder="-" aria-label="Gols ${team2}">
        </div>
        <div class="team">
          <div class="team-flag">${flag2}</div>
          <span class="team-name">${team2}</span>
        </div>
      </div>
      <div class="admin-match-actions">
        <button class="btn-admin-save" onclick="adminSaveResult('${match.id}')">
          💾 Salvar Resultado
        </button>
        ${hasResult ? `<button class="btn-admin-clear" onclick="confirmClearResult('${match.id}', '${team1.replace(/'/g, "\\'")}',' ${team2.replace(/'/g, "\\'")}')">🗑️ Limpar</button>` : ''}
      </div>
    </div>`;
}

// Salvar resultado de um jogo
async function adminSaveResult(matchId) {
  const s1El = document.getElementById(`admin-s1-${matchId}`);
  const s2El = document.getElementById(`admin-s2-${matchId}`);
  const s1 = s1El.value;
  const s2 = s2El.value;

  if (s1 === '' || s2 === '') {
    showToast('⚠️ Preencha os dois placares!', true);
    return;
  }

  const score1 = Math.min(20, Math.max(0, parseInt(s1)));
  const score2 = Math.min(20, Math.max(0, parseInt(s2)));

  try {
    await db.ref(`bolao2026/results/${matchId}`).set({
      score1, score2, updatedAt: new Date().toISOString()
    });
    adminResultsCache[matchId] = { score1, score2 };

    // Atualizar visual do card
    const card = document.getElementById(`admin-card-${matchId}`);
    if (card) {
      card.classList.add('saved');
      const badge = card.querySelector('.admin-result-badge');
      if (badge) {
        badge.textContent = '✅ Resultado Oficial';
        badge.classList.remove('pending');
      }
    }

    // Encontrar o match para mostrar os times no toast
    const match = ALL_MATCHES.find(m => m.id === matchId);
    const matchLabel = match ? `${match.team1} ${score1} x ${score2} ${match.team2}` : matchId;
    showToast(`✅ Resultado salvo: ${matchLabel}`);
  } catch (err) {
    console.error('Erro ao salvar resultado:', err);
    showToast('❌ Erro ao salvar resultado. Verifique as regras do Firebase.', true);
  }
}

// Confirmar limpeza de resultado
function confirmClearResult(matchId, team1, team2) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmModalIcon').textContent = '⚠️';
  document.getElementById('confirmModalTitle').textContent = 'Limpar Resultado';
  document.getElementById('confirmModalMsg').innerHTML = `Tem certeza que deseja limpar o resultado de <strong>${team1} x${team2}</strong>?<br><br><small style="color:var(--text-muted);">O jogo voltará a ficar sem resultado oficial.</small>`;
  const btn = document.getElementById('confirmModalBtn');
  btn.textContent = '🗑️ Limpar';
  btn.className = 'btn-modal btn-modal-danger';
  btn.onclick = () => adminClearResult(matchId);
  modal.classList.remove('hidden');
}

// Limpar resultado de um jogo
async function adminClearResult(matchId) {
  closeConfirmModal();
  try {
    await db.ref(`bolao2026/results/${matchId}`).remove();
    delete adminResultsCache[matchId];
    showToast('✅ Resultado removido com sucesso!');
    // Re-renderizar o painel
    renderContent();
  } catch (err) {
    console.error('Erro ao limpar resultado:', err);
    showToast('❌ Erro ao limpar resultado.', true);
  }
}

// ---- SUB-ABA: Configurar Confrontos ----
function switchConfrontosPhase(phase) {
  adminConfrontosPhase = phase;
  renderContent();
}

async function renderAdminConfrontos() {
  // Recarregar matchups do Firebase
  await loadMatchups();

  const allTeams = getAllTeams();
  const knockoutPhases = [
    { key: '16avos', label: '⚔️ 16 Avos' },
    { key: 'oitavas', label: '🏆 Oitavas' },
    { key: 'quartas', label: '🥇 Quartas' },
    { key: 'semis', label: '🔥 Semis' },
    { key: 'final', label: '👑 Final' },
  ];

  let html = `
    <div class="admin-confrontos-info">
      <p>📝 Configure os confrontos das fases eliminatórias. Selecione os times para cada jogo e salve.</p>
    </div>

    <div class="admin-confrontos-phase-tabs">`;

  knockoutPhases.forEach(p => {
    const active = adminConfrontosPhase === p.key ? 'active' : '';
    html += `<button class="admin-confrontos-phase-btn ${active}" onclick="switchConfrontosPhase('${p.key}')">${p.label}</button>`;
  });

  html += `</div>`;

  // Mostrar os jogos da fase selecionada
  const matches = ALL_MATCHES.filter(m => m.phase === adminConfrontosPhase);

  html += `<div class="admin-confrontos-list">`;

  matches.forEach((match, index) => {
    const configured = matchupsCache[match.id];
    const selectedTeam1 = configured ? configured.team1 : '';
    const selectedTeam2 = configured ? configured.team2 : '';
    const isConfigured = selectedTeam1 && selectedTeam2;
    const statusClass = isConfigured ? 'configured' : '';

    html += `
      <div class="admin-confronto-card ${statusClass}" id="confronto-${match.id}">
        <div class="confronto-header">
          <span class="confronto-label">Jogo ${index + 1}</span>
          <span class="confronto-id">${match.id}</span>
          ${isConfigured ? '<span class="confronto-status">✅ Configurado</span>' : '<span class="confronto-status pending">⏳ Pendente</span>'}
        </div>
        <div class="confronto-selectors">
          <div class="confronto-team-select">
            ${isConfigured ? `<div class="confronto-preview">${getFlag(selectedTeam1)}</div>` : ''}
            <select id="matchup-t1-${match.id}" class="confronto-select" onchange="previewMatchupFlag('${match.id}', 1)">
              <option value="">Selecionar time...</option>
              ${allTeams.map(t => `<option value="${t}" ${t === selectedTeam1 ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <span class="confronto-vs">VS</span>
          <div class="confronto-team-select">
            ${isConfigured ? `<div class="confronto-preview">${getFlag(selectedTeam2)}</div>` : ''}
            <select id="matchup-t2-${match.id}" class="confronto-select" onchange="previewMatchupFlag('${match.id}', 2)">
              <option value="">Selecionar time...</option>
              ${allTeams.map(t => `<option value="${t}" ${t === selectedTeam2 ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="admin-match-actions">
          <button class="btn-admin-save" onclick="saveMatchup('${match.id}')">
            💾 Salvar Confronto
          </button>
          ${isConfigured ? `<button class="btn-admin-clear" onclick="clearMatchup('${match.id}')">🗑️ Limpar</button>` : ''}
        </div>
      </div>`;
  });

  html += `</div>`;
  return html;
}

// Salvar confronto no Firebase
async function saveMatchup(matchId) {
  const t1 = document.getElementById(`matchup-t1-${matchId}`).value;
  const t2 = document.getElementById(`matchup-t2-${matchId}`).value;

  if (!t1 || !t2) {
    showToast('⚠️ Selecione os dois times!', true);
    return;
  }
  if (t1 === t2) {
    showToast('⚠️ Os dois times não podem ser iguais!', true);
    return;
  }

  try {
    await db.ref(`bolao2026/matchups/${matchId}`).set({
      team1: t1, team2: t2, updatedAt: new Date().toISOString()
    });
    matchupsCache[matchId] = { team1: t1, team2: t2 };
    showToast(`✅ Confronto salvo: ${t1} vs ${t2}`);
    renderContent();
  } catch (err) {
    console.error('Erro ao salvar confronto:', err);
    showToast('❌ Erro ao salvar confronto.', true);
  }
}

// Limpar confronto
async function clearMatchup(matchId) {
  try {
    await db.ref(`bolao2026/matchups/${matchId}`).remove();
    delete matchupsCache[matchId];
    showToast('✅ Confronto removido!');
    renderContent();
  } catch (err) {
    console.error('Erro ao limpar confronto:', err);
    showToast('❌ Erro ao limpar confronto.', true);
  }
}

// Preview de bandeira ao selecionar time
function previewMatchupFlag(matchId, teamNum) {
  const select = document.getElementById(`matchup-t${teamNum}-${matchId}`);
  const card = document.getElementById(`confronto-${matchId}`);
  if (!select || !card) return;
  // Simplesmente re-renderizará quando salvar
}

// ================================================================
// INICIALIZAR
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
