const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');

// =============================================
// Configuracao do Express + HTTP Server
// =============================================

const app = express();
const server = http.createServer(app);

// CORS liberado para todas as origens (temporario para desenvolvimento)
app.use(cors({ origin: '*' }));

// Parse de JSON no body das requisicoes REST
app.use(express.json());

// =============================================
// Configuracao do Socket.io
// =============================================

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// =============================================
// Estado global da dimensao
// =============================================
// false = Mundo Humano | true = Flipside
let isFlipsideGlobal = false;

// =============================================
// Estado global do mapa tatico (tokens em memoria)
// =============================================
let mapaTokens = [
  { id: 't1', nome: 'Jogador1', x: 1, y: 1, cor: '#3498db' },
  { id: 't2', nome: 'Jogador2', x: 2, y: 1, cor: '#2ecc71' },
  { id: 't3', nome: 'Jogador3', x: 3, y: 1, cor: '#f1c40f' },
  { id: 't4', nome: 'Jogador4', x: 4, y: 1, cor: '#9b59b6' },
  { id: 't5', nome: 'Animatronico1', x: 9, y: 9, cor: '#e74c3c' },
];

// =============================================
// Eventos de WebSocket
// =============================================

io.on('connection', (socket) => {
  console.log(`[DTRPGM] Novo cliente conectado | Socket ID: ${socket.id}`);

  // Envia o estado atual da dimensao para o cliente que acabou de conectar
  socket.emit('flipside_state', isFlipsideGlobal);

  // Envia o estado atual do mapa tatico para o cliente que acabou de conectar
  socket.emit('mapa_data', mapaTokens);

  // Evento: get_personagem
  // Recebe { id } e retorna os dados completos do personagem via 'personagem_data'
  socket.on('get_personagem', async ({ id }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM personagens WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        socket.emit('personagem_data', { erro: 'Personagem nao encontrado' });
        return;
      }

      socket.emit('personagem_data', result.rows[0]);
    } catch (err) {
      console.error('[DTRPGM] Erro ao buscar personagem:', err.message);
      socket.emit('personagem_data', { erro: 'Erro interno ao buscar personagem' });
    }
  });

  // Evento: get_todos_personagens
  // Retorna todos os personagens para o Painel do Mestre
  socket.on('get_todos_personagens', async () => {
    try {
      const result = await pool.query(
        'SELECT * FROM personagens ORDER BY id'
      );
      socket.emit('todos_personagens_data', result.rows);
    } catch (err) {
      console.error('[DTRPGM] Erro ao buscar todos os personagens:', err.message);
      socket.emit('todos_personagens_data', { erro: 'Erro interno ao buscar personagens' });
    }
  });

  // Evento: atualizar_vida
  // Recebe { id_personagem, novo_hp }, atualiza no banco e
  // emite 'personagem_data' para TODOS os sockets (tempo real)
  socket.on('atualizar_vida', async ({ id_personagem, novo_hp }) => {
    try {
      const result = await pool.query(
        'UPDATE personagens SET hp_flipside_atual = $1 WHERE id = $2 RETURNING *',
        [novo_hp, id_personagem]
      );

      if (result.rows.length === 0) {
        socket.emit('personagem_data', { erro: 'Personagem nao encontrado para update' });
        return;
      }

      console.log(`[DTRPGM] HP atualizado | ${result.rows[0].nome}: ${novo_hp} HP`);

      // Broadcast para TODOS os clientes conectados (Mestre + Jogadores)
      io.emit('personagem_data', result.rows[0]);
    } catch (err) {
      console.error('[DTRPGM] Erro ao atualizar vida:', err.message);
      socket.emit('personagem_data', { erro: 'Erro interno ao atualizar vida' });
    }
  });

  // Evento: get_inventario
  // Recebe { id_personagem } e retorna os itens desse personagem
  socket.on('get_inventario', async ({ id_personagem }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM itens WHERE personagem_id = $1 ORDER BY id',
        [id_personagem]
      );
      socket.emit('inventario_data', { personagem_id: id_personagem, itens: result.rows });
    } catch (err) {
      console.error('[DTRPGM] Erro ao buscar inventario:', err.message);
      socket.emit('inventario_data', { erro: 'Erro interno ao buscar inventario' });
    }
  });

  // Evento: adicionar_xp
  // Recebe { id_personagem, valor_xp }, incrementa XP no banco
  // e emite 'personagem_data' para TODOS
  socket.on('adicionar_xp', async ({ id_personagem, valor_xp }) => {
    try {
      const result = await pool.query(
        'UPDATE personagens SET xp = GREATEST(0, xp + $1) WHERE id = $2 RETURNING *',
        [valor_xp, id_personagem]
      );

      if (result.rows.length === 0) {
        socket.emit('personagem_data', { erro: 'Personagem nao encontrado' });
        return;
      }

      console.log(`[DTRPGM] XP atualizado | ${result.rows[0].nome}: ${result.rows[0].xp} XP (${valor_xp > 0 ? '+' : ''}${valor_xp})`);
      io.emit('personagem_data', result.rows[0]);
    } catch (err) {
      console.error('[DTRPGM] Erro ao adicionar XP:', err.message);
      socket.emit('personagem_data', { erro: 'Erro interno ao adicionar XP' });
    }
  });

  // Evento: adicionar_item
  // Recebe { personagem_id, nome, peso, dimensao_permitida }
  // Insere o item e emite o inventario atualizado para TODOS
  socket.on('adicionar_item', async ({ personagem_id, nome, peso, dimensao_permitida }) => {
    try {
      await pool.query(
        'INSERT INTO itens (nome, peso, dimensao_permitida, personagem_id) VALUES ($1, $2, $3, $4)',
        [nome, peso, dimensao_permitida, personagem_id]
      );

      const result = await pool.query(
        'SELECT * FROM itens WHERE personagem_id = $1 ORDER BY id',
        [personagem_id]
      );

      console.log(`[DTRPGM] Item adicionado | "${nome}" -> Personagem #${personagem_id}`);
      io.emit('inventario_data', { personagem_id, itens: result.rows });
    } catch (err) {
      console.error('[DTRPGM] Erro ao adicionar item:', err.message);
      socket.emit('inventario_data', { erro: 'Erro interno ao adicionar item' });
    }
  });

  // Evento: remover_item
  // Recebe { id_item, personagem_id }
  // Remove o item e emite o inventario atualizado para TODOS
  socket.on('remover_item', async ({ id_item, personagem_id }) => {
    try {
      await pool.query('DELETE FROM itens WHERE id = $1', [id_item]);

      const result = await pool.query(
        'SELECT * FROM itens WHERE personagem_id = $1 ORDER BY id',
        [personagem_id]
      );

      console.log(`[DTRPGM] Item removido | Item #${id_item} do Personagem #${personagem_id}`);
      io.emit('inventario_data', { personagem_id, itens: result.rows });
    } catch (err) {
      console.error('[DTRPGM] Erro ao remover item:', err.message);
      socket.emit('inventario_data', { erro: 'Erro interno ao remover item' });
    }
  });

  // Evento: sabotar_tablet
  // Recebe { tipo: 'video' | 'bateria' | 'restaurar_video', valor?: number }
  // Repassa para TODOS os clientes (mecanica de terror do Mestre)
  socket.on('sabotar_tablet', (payload) => {
    console.log(`[DTRPGM] Sabotagem de tablet | Tipo: ${payload.tipo}${payload.valor ? ` | Valor: ${payload.valor}` : ''}`);
    io.emit('tablet_sabotado', payload);
  });

  // Evento: mover_token
  // Recebe { id_token, novo_x, novo_y }, atualiza a posicao do token
  // no array em memoria e emite 'mapa_data' para TODOS os clientes
  socket.on('mover_token', ({ id_token, novo_x, novo_y }) => {
    const token = mapaTokens.find((t) => t.id === id_token);
    if (token) {
      token.x = novo_x;
      token.y = novo_y;
      console.log(`[DTRPGM] Token movido | ${token.nome} -> (${novo_x}, ${novo_y})`);
      io.emit('mapa_data', mapaTokens);
    }
  });

  // Evento: toggle_flipside
  // Inverte o estado global da dimensao e avisa TODOS os clientes
  socket.on('toggle_flipside', () => {
    isFlipsideGlobal = !isFlipsideGlobal;
    const dimensao = isFlipsideGlobal ? 'FLIPSIDE' : 'MUNDO HUMANO';
    console.log(`[DTRPGM] Dimensao alterada para: ${dimensao}`);

    // Broadcast para TODOS (Mestre + Jogadores)
    io.emit('flipside_state', isFlipsideGlobal);
  });

  // Evento: disconnect
  socket.on('disconnect', () => {
    console.log(`[DTRPGM] Cliente desconectado | Socket ID: ${socket.id}`);
  });
});

// =============================================
// Inicializacao do servidor
// =============================================

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`[DTRPGM] Servidor DTRPGM esta online na porta ${PORT}`);
});
