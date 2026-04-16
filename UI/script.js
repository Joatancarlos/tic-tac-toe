const API_URL = 'http://localhost:3000/api'; // Ajuste para a URL do seu backend
const SOCKET_URL = 'http://localhost:3000';  // Ajuste para a URL do seu backend

let token = null;
let myUserId = null;
let currentMatchId = null;
let socket = null;
let mySymbol = 'X'; // O criador será X, o convidado será O
let isMyTurn = false;

// Utilitário para fazer requisições
async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || data.message || 'Erro na requisição');
    return data;
}

function showMsg(msg) {
    document.getElementById('statusMsg').innerText = msg;
    setTimeout(() => document.getElementById('statusMsg').innerText = '', 3000);
}

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// --- AUTH ---

async function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    try {
        const data = await apiFetch('/auth/login', 'POST', { username: u, password: p });
        token = data.token;

        // Buscar dados do usuário logado para saber o próprio ID
        const me = await apiFetch('/players/me');
        myUserId = me.id;

        initSocket();
        document.getElementById('welcomeMsg').innerText = `Olá, ${me.username}!`;
        switchSection('lobby-section');
        await loadRanking();
        await loadOnlinePlayers();
    } catch (e) { showMsg(e.message); }
}

async function register() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    try {
        await apiFetch('/players', 'POST', { username: u, password: p });
        showMsg("Registrado com sucesso! Faça login.");
    } catch (e) { showMsg(e.message); }
}

// --- SOCKET.IO ---

function initSocket() {
    if (socket) socket.disconnect();
    // Conecta ao socket enviando o token para autenticação, se o backend exigir
    socket = io(SOCKET_URL, { auth: { token } });

    socket.on('playerJoined', (data) => {
        showMsg('Um jogador entrou na partida!');
        document.getElementById('turnIndicator').innerText = "O jogo começou! É a sua vez.";
        isMyTurn = true; // Assumindo que o criador joga primeiro (baseado no seu backend currentPlayerId)
    });

    socket.on('gameStateUpdated', (data) => {
        updateBoardState(data.board);
        isMyTurn = data.nextPlayerId === myUserId;
        document.getElementById('turnIndicator').innerText = isMyTurn ? "Sua vez!" : "Vez do oponente...";
    });

    socket.on('gameOver', (data) => {
        updateBoardState(data.finalBoard);
        isMyTurn = false;
        if (data.isDraw) {
            document.getElementById('turnIndicator').innerText = "Deu Velha! Empate.";
        } else {
            const won = data.winnerId === myUserId;
            document.getElementById('turnIndicator').innerText = won ? "Você Venceu! 🎉" : "Você Perdeu! 😢";
        }
    });
}

// --- GAME LOBBY ---

async function createMatch() {
    try {
        const data = await apiFetch('/game', 'POST');
        currentMatchId = data.matchId;
        mySymbol = 'X';
        if (socket) {
            socket.emit('joinRoom', currentMatchId);
        }
        setupGameUI();

        // Opcional: Se o seu backend não coloca o socket na sala automaticamente via REST,
        // você pode precisar emitir um evento aqui: socket.emit('joinRoom', currentMatchId);

    } catch (e) { showMsg(e.message); }
}

async function joinMatch() {
    const mId = document.getElementById('matchIdInput').value;
    try {
        await apiFetch('/game/join', 'POST', { matchId: mId });
        currentMatchId = mId;
        mySymbol = 'O';
        if (socket) {
            socket.emit('joinRoom', currentMatchId);
        }
        setupGameUI();
        document.getElementById('turnIndicator').innerText = "Vez do oponente...";
        isMyTurn = false;
    } catch (e) { showMsg(e.message); }
}

function setupGameUI() {
    document.getElementById('displayMatchId').innerText = currentMatchId;
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    // Cria os 9 quadrados
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.onclick = () => playTurn(i);
        boardEl.appendChild(cell);
    }
    switchSection('game-section');
}

// --- GAMEPLAY ---

async function playTurn(position) {
    if (!isMyTurn) {
        showMsg("Não é a sua vez!");
        return;
    }
    // Validação visual rápida
    if (document.getElementById(`cell-${position}`).innerText !== "") return;

    try {
        await apiFetch('/game/play', 'POST', { matchId: currentMatchId, position: position });
        // Não atualizamos o board localmente ainda; esperamos o socket 'gameStateUpdated'
    } catch (e) { showMsg(e.message); }
}

function updateBoardState(boardArray) {
    // boardArray vem do backend: array de 9 posições contendo null ou o userId
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById(`cell-${i}`);
        if (boardArray[i] === myUserId) {
            cell.innerText = mySymbol;
            cell.style.color = "blue";
        } else if (boardArray[i] !== null) {
            cell.innerText = mySymbol === 'X' ? 'O' : 'X';
            cell.style.color = "red";
        } else {
            cell.innerText = "";
        }
    }
}

function leaveMatch() {
    currentMatchId = null;
    switchSection('lobby-section');
}

function copyMatchId() {
    if (!currentMatchId) {
        showMsg("Nenhuma partida ativa!");
        return;
    }

    navigator.clipboard.writeText(currentMatchId)
        .then(() => {
            showMsg("ID da partida copiado!");
        })
        .catch(() => {
            showMsg("Erro ao copiar o ID.");
        });
}

async function loadRanking() {
    try {
        // pega ranking
        const ranking = await apiFetch('/scoreboard');

        // pega usuário atual
        const me = await apiFetch('/players/me');

        renderRanking(ranking, me);
    } catch (e) {
        console.error(e);
        showMsg("Erro ao carregar ranking");
    }
}

function renderRanking(ranking, me) {
    const container = document.getElementById('rankingList');
    container.innerHTML = '';

    ranking.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';

        // destaca o próprio usuário
        if (player.userId === me.id) {
            div.classList.add('me');
        }

        div.innerHTML = `
            <span>
                <span class="ranking-position">#${index + 1}</span>
                ${player.user.username}
            </span>
            <span>
                 ${player.victories} |  ${player.draw}
            </span>
        `;

        container.appendChild(div);
    });
}

async function loadOnlinePlayers() {
    try {
        const players = await apiFetch('/players/online');
        renderOnlinePlayers(players);
    } catch (e) {
        console.error(e);
        showMsg("Erro ao carregar jogadores online");
    }
}

function renderOnlinePlayers(players) {
    const container = document.getElementById('activity-players');

    container.innerHTML = `
        <h3>Jogadores online</h3>
    `;

    players
        .filter(player => player.id !== myUserId) // 🔥 remove você mesmo
        .forEach(player => {
            const div = document.createElement('div');
            div.className = 'ranking-item';

            div.innerHTML = `
                <span>${player.username}</span>
                <button onclick="invitePlayer('${player.id}')">
                    Convidar
                </button>
            `;

            container.appendChild(div);
        });
}

async function invitePlayer(userGuestId) {
    if (!currentMatchId) {
        showMsg("Você precisa estar em uma partida para convidar!");
        return;
    }

    try {
        await apiFetch('/match/invite', 'POST', {
            matchId: currentMatchId,
            userGuestId
        });

        showMsg("Convite enviado!");
    } catch (e) {
        showMsg(e.message);
    }
}

async function declineInvite(matchId) {
    try {
        await apiFetch('/match/decline', 'POST', { matchId });
        showMsg("Convite recusado!");
    } catch (e) {
        showMsg(e.message);
    }
}