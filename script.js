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
  'França':'fr','Senegal':'sn','Repescagem (BOL/IRQ)':null,'Noruega':'no',
  'Argentina':'ar','Argélia':'dz','Áustria':'at','Jordânia':'jo',
  'Portugal':'pt','RD Congo':'cd','Uzbequistão':'uz','Colômbia':'co',
  'Inglaterra':'gb-eng','Croácia':'hr','Gana':'gh','Panamá':'pa',
  'Bolívia':'bo','Iraque':'iq',
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
  'I':['França','Senegal','Repescagem (BOL/IRQ)','Noruega'],
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

// ---- Jogos eliminatórios ----
function generateKnockoutMatches() {
  const oitavas = [
    {id:'o-1',team1:'1ºA',team2:'2ºB',phase:'oitavas'},
    {id:'o-2',team1:'1ºC',team2:'2ºD',phase:'oitavas'},
    {id:'o-3',team1:'1ºE',team2:'2ºF',phase:'oitavas'},
    {id:'o-4',team1:'1ºG',team2:'2ºH',phase:'oitavas'},
    {id:'o-5',team1:'1ºB',team2:'2ºA',phase:'oitavas'},
    {id:'o-6',team1:'1ºD',team2:'2ºC',phase:'oitavas'},
    {id:'o-7',team1:'1ºI',team2:'2ºJ',phase:'oitavas'},
    {id:'o-8',team1:'1ºK',team2:'2ºL',phase:'oitavas'},
    {id:'o-9',team1:'1ºF',team2:'2ºE',phase:'oitavas'},
    {id:'o-10',team1:'1ºH',team2:'2ºG',phase:'oitavas'},
    {id:'o-11',team1:'1ºJ',team2:'2ºI',phase:'oitavas'},
    {id:'o-12',team1:'1ºL',team2:'2ºK',phase:'oitavas'},
  ];
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
  return [...oitavas,...quartas,...semis,...finalMatch];
}

const ALL_MATCHES = [...generateGroupMatches(), ...generateKnockoutMatches()];

// ================================================================
// ESTADO DO APP
// ================================================================
let currentUser = null;   // { id, name, chapter, state }
let currentTab = 'grupos';
let cachedPalpites = {};  // cache local dos palpites do Firebase

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

async function handleLogin() {
  const idRaw = document.getElementById('inputLoginId').value.trim();
  const id = sanitize(idRaw).toLowerCase();

  if (!id) { showToast('⚠️ Digite seu ID!', true); return; }
  if (!validateId(id)) { showToast('⚠️ ID inválido! Use 4-20 caracteres (letras, números, _ ou -)', true); return; }

  const btn = document.getElementById('btnLogin');
  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    const snap = await db.ref(`bolao2026/users/${id}`).once('value');
    if (!snap.exists()) {
      showToast('⚠️ ID não encontrado. Cadastre-se primeiro!', true);
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }
    const userData = snap.val();
    currentUser = { id, name: userData.name, chapter: userData.chapter, state: userData.state };
    localStorage.setItem('bolao_userId', id);
    await loadPalpites();
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
  const chapter = sanitize(document.getElementById('inputRegChapter').value.trim());
  const state = document.getElementById('inputRegState').value;

  if (!id || !name || !chapter || !state) {
    showToast('⚠️ Preencha todos os campos!', true); return;
  }
  if (!validateId(id)) {
    showToast('⚠️ ID inválido! Use 4-20 caracteres (letras, números, _ ou -)', true); return;
  }

  const btn = document.getElementById('btnRegister');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    const snap = await db.ref(`bolao2026/users/${id}`).once('value');
    if (snap.exists()) {
      showToast('⚠️ Este ID já está em uso! Escolha outro.', true);
      btn.disabled = false;
      btn.textContent = 'Cadastrar';
      return;
    }

    await db.ref(`bolao2026/users/${id}`).set({
      name, chapter, state,
      createdAt: new Date().toISOString()
    });

    currentUser = { id, name, chapter, state };
    localStorage.setItem('bolao_userId', id);
    cachedPalpites = {};
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
  localStorage.removeItem('bolao_userId');
  document.getElementById('mainScreen').style.display = 'none';
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
        await loadPalpites();
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
  if (currentTab === 'ranking') {
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
    'oitavas':'🏆 Oitavas de Final','quartas':'🥇 Quartas de Final',
    'semis':'🔥 Semifinais','final':'👑 Grande Final'
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

function renderMatchCard(match) {
  const saved = cachedPalpites[match.id];
  const score1 = saved ? saved.score1 : '';
  const score2 = saved ? saved.score2 : '';
  const savedClass = saved ? 'saved' : '';
  const btnText = saved ? '✅ Palpite Salvo — Clique para Atualizar' : '💾 Salvar Palpite';
  const flag1 = getFlag(match.team1);
  const flag2 = getFlag(match.team2);

  return `
    <div class="match-card ${savedClass}" id="card-${match.id}">
      <div class="match-teams">
        <div class="team">
          <div class="team-flag">${flag1}</div>
          <span class="team-name">${match.team1}</span>
        </div>
        <div class="score-input-group">
          <input type="number" class="score-input" id="s1-${match.id}" min="0" max="20"
                 value="${score1}" placeholder="-" aria-label="Gols ${match.team1}">
          <span class="score-x">✕</span>
          <input type="number" class="score-input" id="s2-${match.id}" min="0" max="20"
                 value="${score2}" placeholder="-" aria-label="Gols ${match.team2}">
        </div>
        <div class="team">
          <div class="team-flag">${flag2}</div>
          <span class="team-name">${match.team2}</span>
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
// INICIALIZAR
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
