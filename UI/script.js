const isProduction = window.location.hostname !== 'localhost';
const API_URL = !isProduction
    ? 'https://idosa.opaleiros.xyz/api'
    : 'https://localhost:3000/api';

const SOCKET_URL = isProduction
    ? 'https://idosa.opaleiros.xyz'
    : 'https://localhost:3000';

let token = null;
let myUserId = null;
let currentMatchId = null;
let socket = null;
let mySymbol = 'X';
let isMyTurn = false;

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

function showMsg(title, icon, showConfirmButton = false, invite = {}) {
    Swal.fire({
        position: "top-end",
        icon: icon,
        title: title,
        showConfirmButton: showConfirmButton,
        showCancelButton: showConfirmButton,
        confirmButtonText: "Aceitar",
        cancelButtonText: "Cancel!",
        timer: showConfirmButton ? 10000 : 1500,
        toast: true,
        timerProgressBar: true
    }).then((result) => {
        if (result.isConfirmed) {
            joinMatch(invite.matchId)
            acceptInvite(invite.matchId, invite.invitedId)
        }
        else if (result.dismiss === Swal.DismissReason.cancel) { declineInvite(invite.matchId, invite.invitedId); }
    });
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
        localStorage.setItem('game_token', token)

        // Buscar dados do usuário logado para saber o próprio ID
        const me = await apiFetch('/players/me');
        myUserId = me.id;

        initSocket();
        document.getElementById('welcomeMsg').innerText = `Olá, ${me.username}!`;
        switchSection('lobby-section');
        await loadRanking();
        await loadOnlinePlayers();
        showMsg("Login realizado com sucesso", "success")
    } catch (e) { showMsg(e.message, 'error'); }
}

async function register() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    try {
        await apiFetch('/players', 'POST', { username: u, password: p });
        showMsg("Registrado com sucesso! Faça login.", "success");
    } catch (e) { showMsg(e.message, 'error'); }
}


function initSocket() {
    if (socket) socket.disconnect();
    socket = io(SOCKET_URL, { auth: { token } });

    socket.on('playerJoined', (data) => {
        showMsg('Um jogador entrou na partida!', "info");
        document.getElementById('turnIndicator').innerText = "O jogo começou! É a sua vez.";
        isMyTurn = true;
    });

    socket.on('gameStateUpdated', (data) => {
        updateBoardState(data.board);
        isMyTurn = data.nextPlayerId === myUserId;
        document.getElementById('turnIndicator').innerText = isMyTurn ? "Sua vez!" : "Vez do oponente...";
    });

    socket.on("playersOnlineUpdated", (players) => {
        renderOnlinePlayers(players);
    })

    socket.on('gameOver', async (data) => {
        updateBoardState(data.finalBoard);
        isMyTurn = false;

        if (data.isDraw) {
            document.getElementById('turnIndicator').innerText = "Deu Velha! Empate.";

            // Para não duplicar pontos no banco, apenas o criador da sala ('X') envia a requisição de empate
            if (mySymbol === 'X') {
                // Extrai os dois IDs únicos jogados no tabuleiro, ignorando os 'null'
                const playersOnBoard = [...new Set(data.finalBoard.filter(id => id !== null))];

                if (playersOnBoard.length === 2) {
                    try {
                        await apiFetch('/scoreboard/draw', 'POST', {
                            player1Id: playersOnBoard[0],
                            player2Id: playersOnBoard[1]
                        });
                    } catch (e) {
                        console.error("Erro ao registrar empate:", e);
                    }
                }
            }
        } else {
            const won = data.winnerId === myUserId;
            document.getElementById('turnIndicator').innerText = won ? "Você Venceu! 🎉" : "Você Perdeu! 😢";

            if (data.abandoned) {
                document.getElementById('turnIndicator').innerText = won
                    ? "Adversário abandonou. Você Venceu! 🎉"
                    : "Você abandonou a partida.";
                showMsg(!won && "Abandonou pai", "error", false)
            } else {
                document.getElementById('turnIndicator').innerText = won
                    ? "Você Venceu! 🎉"
                    : "Você Perdeu! 😢";
            }

            // Apenas o cliente do vencedor avisa o banco de dados da vitória
            if (won) {
                try {
                    await apiFetch('/scoreboard/win', 'POST', { winnerId: myUserId });
                } catch (e) {
                    console.error("Erro ao registrar vitória:", e);
                }
            }
        }

        // Atualiza o ranking para refletir o novo placar (espera 1 segundinho para dar tempo do backend salvar)
        setTimeout(() => {
            loadRanking();
        }, 1000);
    });
    socket.on("playerInvited", (invite) => {

        if (invite.invitedId === myUserId) {
            showMsg("Quer dar uma jogadinha?", "success", true, invite)
        }
    })
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

    } catch (e) { showMsg(e.message, "error"); }
}

async function joinMatch(matchId) {
    const mId = matchId ? matchId : document.getElementById('matchIdInput').value;
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
    } catch (e) { showMsg(e.message, "error"); }
}

function logout() {
    localStorage.removeItem('game_token');
    token = null;
    myUserId = null;
    currentMatchId = null;
    mySymbol = 'X';
    isMyTurn = false;

    if (socket) {
        socket.emit("disconnect")
        socket.disconnect();
        socket = null;
    }
    location.reload();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('welcomeMsg').innerText = '';

    switchSection('auth-section');
    showMsg("Você saiu da sua conta com sucesso.", "success");
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
        showMsg("Não é a sua vez!", "info");
        return;
    }
    // Validação visual rápida
    if (document.getElementById(`cell-${position}`).innerText !== "") return;

    try {
        await apiFetch('/game/play', 'POST', { matchId: currentMatchId, position: position });
        // Não atualizamos o board localmente ainda; esperamos o socket 'gameStateUpdated'
    } catch (e) { showMsg(e.message, "error"); }
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

async function leaveMatch() {
    if (!currentMatchId) {
        switchSection('lobby-section');
        return;
    }

    try {
        // Faz a requisição para o back-end informando que o usuário quer sair
        await apiFetch('/game/leave', 'POST', { matchId: currentMatchId });

        // Opcional: Se o seu servidor Socket.io tiver um evento configurado para sair da sala
        if (socket) {
            // socket.emit('leaveRoom', currentMatchId);
        }

        showMsg("Você saiu da partida.", "success");
    } catch (e) {
        showMsg("Erro ao sair da partida: " + e.message, "error");
    } finally {
        // Reseta o estado local do jogo independentemente de sucesso ou erro
        currentMatchId = null;
        isMyTurn = false;

        // Reseta os textos da interface
        document.getElementById('turnIndicator').innerText = "Aguardando oponente...";

        // Volta para o Lobby e recarrega o ranking
        switchSection('lobby-section');
        await loadRanking();
    }
}

function copyMatchId() {
    if (!currentMatchId) {
        showMsg("Nenhuma partida ativa!", "info");
        return;
    }

    navigator.clipboard.writeText(currentMatchId)
        .then(() => {
            showMsg("ID da partida copiado!", "success");
        })
        .catch(() => {
            showMsg("Erro ao copiar o ID.", "success");
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
        showMsg("Erro ao carregar ranking", "error");
    }
}


async function checkSession() {
    const savedToken = localStorage.getItem('game_token');

    if (!savedToken) {
        console.log("Nenhuma sessão encontrada.");
        return;
    }

    try {
        token = savedToken;

        const me = await apiFetch('/players/me');

        if (me && me.id) {
            myUserId = me.id;

            initSocket();
            document.getElementById('welcomeMsg').innerText = `Olá, ${me.username}!`;
            switchSection('lobby-section');
            loadRanking();

            console.log("Sessão restaurada para o usuário:", me.username);
        }
    } catch (e) {
        console.warn("Falha ao restaurar sessão automática:", e.message);
        localStorage.removeItem('game_token');
        token = null;
        switchSection('auth-section');
    }
}
window.onload = () => {
    checkSession();
};

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
        showMsg("Erro ao carregar jogadores online", "error");
    }
}

function renderOnlinePlayers(players) {
    const container = document.getElementById('activity-players');

    container.innerHTML = `
        <h3>Jogadores online</h3>
    `;

    players
        .filter(player => player.id !== myUserId)
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
        showMsg("Você precisa estar em uma partida para convidar!", "info");
        return;
    }

    try {
        const {invite} = await apiFetch('/game/invite', 'POST', {
            matchId: currentMatchId,
            userGuestId,
        });

        if (socket) {
            socket.emit('invitePlayer', invite);
        }

        showMsg("Convite enviado!", "success");
    } catch (e) {
        showMsg(e.message, "error");
    }
}

async function declineInvite(matchId, userId) {
    try {
        await apiFetch('/game/decline-invite', 'POST', { matchId, userId });
        showMsg("Convite recusado!", "info");
    } catch (e) {
        showMsg(e.message, "error");
    }
}

async function acceptInvite(matchId, userId) {
    try {
        await apiFetch('/game/accept-invite', 'POST', { matchId, userId });
    } catch (e) {
        showMsg(e.message, "error");
    }
}