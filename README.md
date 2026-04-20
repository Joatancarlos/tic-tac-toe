# Capstone API

API para gerenciamento de jogadores, partidas (jogo da velha) e ranking, com autenticação JWT, comunicação em tempo real via WebSocket e documentação interativa com Swagger.



# Tecnologias

* Node.js + Express
* Prisma ORM + MySQL
* Socket.IO (WebSocket)
* JWT (autenticação)
* Swagger (documentação)
* HTTPS (TLS)

# Estrutura do Projeto

```
src/
 ├── config/
 │   ├── middlewares/
 │   └── swagger.js
 ├── controller/
 ├── lib/
 ├── queues/
 ├── routes/
 ├── service/
 ├── workers/
 └── app.js
 UI/
 ├── index.html
 ├── script.js
 └── style.css
```


#  Como rodar o projeto

## 1. Instalar dependências

```
npm install
```

## 2. Configurar .env

```
DATABASE_URL=jogo_da_velha_bd
JWT_SECRET=vick-vaporub
CLIENT_URL=http://localhost:8080 
```
OBS.: Atentar-se ao número da porta

## 3. Rodar migrations

```
npm run db
```

## 4. Iniciar aplicação

```
npm run dev
```


# Autenticação

A API utiliza **JWT (Bearer Token)**.

No Swagger, clique em **Authorize** e informe:

```
Bearer SEU_TOKEN
```


# Base URL

```
https://localhost:3000/api
```

Swagger:

```
https://localhost:3000/api-docs
```


# Módulos da API

## Auth

### POST /auth/login

Realiza login.

**Request**

```json
{
  "username": "joatan",
  "password": "12345678"
}
```

**Response**

```json
{
  "token": "jwt_token"
}
```


### POST /auth/logout

Realiza logout (invalida token).


## Players

### POST /players (Cria um jogador)

```json
{
  "username": "joatan",
  "password": "12345678"
}
```

### GET /players/me

Retorna o usuário autenticado.

### GET /players/online

Lista jogadores online.

### GET /players/{id}

Busca jogador por ID.

### PUT /players/{id}

Atualiza jogador.

### DELETE /players/{id}

Remove jogador.


## Game

### POST /game

Cria uma nova partida.

### POST /game/join

Entra em uma partida.

```json
{
  "matchId": 1
}
```

### POST /game/leave

Sai da partida.

### POST /game/play

Realiza jogada.

```json
{
  "matchId": 1,
  "position": 4
}
```

### POST /game/invite

Convida jogador.

### POST /game/accept-invite

Aceita convite.

### POST /game/decline-invite

Recusa convite.


##  Scoreboard

### GET /scoreboard

Ranking de jogadores.

### POST /scoreboard/win

Registra vitória.

```json
{
  "winnerId": 1
}
```

### POST /scoreboard/draw

Registra empate.

```json
{
  "player1Id": 1,
  "player2Id": 2
}
```


# WebSocket (Tempo real)

### URL

```
wss://localhost:3000
```

### Autenticação

Enviar token no handshake:

```js
auth: { token }
```


## Eventos

### Cliente → Servidor

* `joinRoom` → entrar em uma partida


### Servidor → Cliente

* `playerJoined`
* `gameStateUpdated`
* `gameOver`
* `playerInvited`
* `playersOnlineUpdated`


# HTTPS (TLS)

* Certificados são gerados automaticamente
* A API roda em **https://localhost:3000**
* O navegador exibirá aviso de segurança (normal em ambiente local)


# Observações

* Aceite o certificado no navegador para evitar bloqueios
* CORS está configurado para o frontend definido em `CLIENT_URL`
* WebSocket exige autenticação válida




# Swagger

Acesse:

```
https://localhost:3000/api-docs
```


#  Status do Projeto

* ✅ Autenticação JWT
* ✅ WebSocket em tempo real
* ✅ CRUD de jogadores
* ✅ Sistema de partidas
* ✅ Ranking
* ✅ HTTPS + segurança
* ✅ Swagger completo


#  Autores

- Joatan Feitosa 
- Matheus Victor
