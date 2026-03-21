import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// =============================================
// Estilos do Painel do Mestre
// =============================================

const s = {
  root: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: '#0f0f1b',
    color: '#d4d4e0',
  },

  // ---- Sidebar do Mestre ----
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '24px 12px',
    background: '#141425',
    borderRight: '1px solid #2a2a4a',
  },
  sidebarLogo: {
    fontSize: 20,
    fontWeight: 800,
    textAlign: 'center',
    color: '#f87171',
    letterSpacing: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sidebarRole: {
    fontSize: 11,
    textAlign: 'center',
    color: '#f8717188',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 28,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: '#888',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
  },
  navBtnActive: {
    background: 'linear-gradient(135deg, #f8717122, #f8717111)',
    color: '#f87171',
    fontWeight: 700,
    border: '1px solid #f8717144',
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },

  // ---- Main ----
  main: {
    padding: 28,
    overflow: 'auto',
  },
  mainHeader: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 24,
  },

  // ---- Botao Flipside Toggle ----
  flipBtnWrapper: {
    marginBottom: 24,
  },
  flipBtn: (isFlipside) => ({
    width: '100%',
    padding: '16px 0',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: isFlipside
      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
      : 'linear-gradient(135deg, #dc2626, #991b1b)',
    color: '#fff',
    boxShadow: isFlipside
      ? '0 0 30px #7c3aed55, 0 0 60px #7c3aed22'
      : '0 0 30px #dc262655, 0 0 60px #dc262622',
  }),
  flipIndicator: (isFlipside) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    fontSize: 12,
    color: isFlipside ? '#c084fc' : '#888',
    letterSpacing: 1,
  }),
  flipDot: (isFlipside) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: isFlipside ? '#a855f7' : '#555',
    boxShadow: isFlipside ? '0 0 8px #a855f7' : 'none',
  }),

  // ---- Grid de cards dos jogadores ----
  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },

  // ---- Card individual de jogador ----
  card: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #2a2a4a',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e0e0e0',
  },
  cardId: {
    fontSize: 12,
    color: '#555',
    background: '#16213e',
    padding: '2px 8px',
    borderRadius: 4,
  },

  // ---- Info rows ----
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: 14,
  },
  infoLabel: { color: '#999' },
  infoValue: { fontWeight: 700, color: '#f0f0f0' },

  // ---- HP Section ----
  hpSection: {
    marginTop: 16,
    padding: 16,
    background: '#16213e',
    borderRadius: 8,
  },
  hpTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#7c3aed',
    marginBottom: 12,
  },
  hpDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hpNumbers: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f0f0f0',
  },
  hpMax: {
    fontSize: 14,
    color: '#888',
    fontWeight: 400,
  },
  hpBarOuter: {
    height: 12,
    borderRadius: 6,
    background: '#2a2a4a',
    overflow: 'hidden',
    marginBottom: 16,
  },
  hpBarInner: (percent) => ({
    height: '100%',
    width: `${percent}%`,
    background:
      percent > 50
        ? 'linear-gradient(90deg, #7c3aed, #c084fc)'
        : percent > 25
        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
        : 'linear-gradient(90deg, #dc2626, #f87171)',
    borderRadius: 6,
    transition: 'width 0.5s ease',
  }),

  // ---- Botoes de controle ----
  controls: {
    display: 'flex',
    gap: 8,
  },
  btn: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnDamage: {
    background: '#dc262633',
    color: '#f87171',
    border: '1px solid #dc262655',
  },
  btnHeal: {
    background: '#16a34a33',
    color: '#4ade80',
    border: '1px solid #16a34a55',
  },

  // ---- Atributos mini grid ----
  attrsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
    marginTop: 16,
  },
  attrChip: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 10px',
    background: '#16213e',
    borderRadius: 4,
    fontSize: 12,
  },
  attrLetter: {
    color: '#c084fc',
    fontWeight: 700,
  },
  attrVal: {
    fontWeight: 700,
    color: '#ddd',
  },

  // ---- Diretor de Terror ----
  terrorSection: {
    marginBottom: 24,
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #dc262644',
  },
  terrorTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#f87171',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid #dc262633',
  },
  terrorTitleIcon: {
    fontSize: 20,
  },
  terrorDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  terrorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
  },
  terrorBtn: {
    padding: '14px 12px',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  terrorBtnVideo: {
    background: '#dc262633',
    color: '#f87171',
    border: '1px solid #dc262655',
  },
  terrorBtnBateria: {
    background: '#f59e0b33',
    color: '#fbbf24',
    border: '1px solid #f59e0b55',
  },
  terrorBtnRestaurar: {
    background: '#16a34a33',
    color: '#4ade80',
    border: '1px solid #16a34a55',
  },
  terrorBtnIcon: {
    display: 'block',
    fontSize: 22,
    marginBottom: 6,
  },

  // ---- Secao de Recompensas (2 colunas) ----
  rewardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 24,
  },
  rewardCard: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #2a2a4a',
  },
  rewardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#fbbf24',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid #fbbf2422',
  },
  rewardTitleIcon: {
    fontSize: 18,
  },

  // ---- XP Controls ----
  xpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  xpBtn: (positive) => ({
    padding: '10px 0',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: positive ? '#16a34a33' : '#dc262633',
    color: positive ? '#4ade80' : '#f87171',
    border: positive ? '1px solid #16a34a55' : '1px solid #dc262655',
  }),

  // ---- Loot Form ----
  lootForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  lootFormRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 120px',
    gap: 8,
  },
  lootInput: {
    padding: '10px 12px',
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  },
  lootSelect: {
    padding: '10px 8px',
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  lootSubmitBtn: {
    padding: '10px 0',
    background: '#7c3aed33',
    color: '#c084fc',
    border: '1px solid #7c3aed55',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // ---- Lista de itens do inventario ----
  lootList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 16,
    maxHeight: 280,
    overflowY: 'auto',
  },
  lootListTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  lootItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: '#16213e',
    borderRadius: 6,
    fontSize: 13,
  },
  lootItemName: {
    flex: 1,
    fontWeight: 600,
    color: '#ddd',
  },
  lootItemMeta: {
    fontSize: 11,
    color: '#888',
  },
  lootItemDim: (dim) => ({
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 3,
    background:
      dim === 'Humano' ? '#3b82f622' :
      dim === 'Flipside' ? '#dc262622' :
      '#facc1522',
    color:
      dim === 'Humano' ? '#60a5fa' :
      dim === 'Flipside' ? '#f87171' :
      '#fbbf24',
  }),
  lootRemoveBtn: {
    padding: '4px 10px',
    background: '#dc262622',
    color: '#f87171',
    border: '1px solid #dc262644',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  lootEmpty: {
    padding: 20,
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
  },

  // ---- Seletor de jogador alvo ----
  targetSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    fontSize: 13,
    color: '#999',
  },
  targetSelect: {
    padding: '6px 10px',
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },

  // ---- Tabuleiro Tatico ----
  mapaSection: {
    marginBottom: 24,
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #2a2a4a',
  },
  mapaTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#60a5fa',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid #3b82f633',
  },
  mapaTitleIcon: {
    fontSize: 20,
  },
  mapaTokenSelector: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  mapaTokenBtn: (cor, selected) => ({
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    background: selected ? `${cor}33` : '#16213e',
    color: selected ? cor : '#888',
    border: selected ? `2px solid ${cor}` : '1px solid #2a2a4a',
    transition: 'all 0.15s ease',
  }),
  mapaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 40px)',
    gridTemplateRows: 'repeat(10, 40px)',
    gap: 2,
    justifyContent: 'center',
  },
  mapaCell: (hasToken) => ({
    width: 40,
    height: 40,
    background: hasToken ? '#16213e' : '#0f0f1b',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  }),
  mapaToken: (cor) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: cor,
    boxShadow: `0 0 8px ${cor}88`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  }),
  mapaSelectedInfo: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },

  // ---- Loading ----
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f0f1b',
    color: '#555',
    fontSize: 18,
    fontFamily: "'Segoe UI', sans-serif",
    flexDirection: 'column',
    gap: 16,
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    border: '3px solid #2a2a4a',
    borderTop: '3px solid #f87171',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

const SPRING_LABELS = [
  { key: 'forca', letter: 'S' },
  { key: 'percepcao', letter: 'P' },
  { key: 'reflexos', letter: 'R' },
  { key: 'inteligencia', letter: 'I' },
  { key: 'nervo', letter: 'N' },
  { key: 'fantasma', letter: 'G' },
];

const SIDEBAR_TABS = [
  { id: 'jogadores', label: 'Jogadores', icon: '👥' },
  { id: 'combate', label: 'Combate', icon: '⚔' },
  { id: 'mundo', label: 'Mundo', icon: '◈' },
  { id: 'notas', label: 'Notas', icon: '📋' },
];

// =============================================
// Componente Mestre — Painel de controle geral
// =============================================

function Mestre() {
  const [personagens, setPersonagens] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('jogadores');
  const [isFlipside, setIsFlipside] = useState(false);
  const [inventarioMestre, setInventarioMestre] = useState([]);
  const [jogadorAlvo, setJogadorAlvo] = useState(1);
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemPeso, setNovoItemPeso] = useState('');
  const [novoItemDim, setNovoItemDim] = useState('Ambos');
  const [mapaTokens, setMapaTokens] = useState([]);
  const [tokenSelecionado, setTokenSelecionado] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    // Solicita a lista completa de personagens
    socket.emit('get_todos_personagens');

    // Solicita o inventario do jogador alvo inicial
    socket.emit('get_inventario', { id_personagem: jogadorAlvo });

    // Recebe a lista inicial de todos os personagens
    socket.on('todos_personagens_data', (data) => {
      if (!data.erro) {
        setPersonagens(data);
      } else {
        console.error('[DTRPGM Mestre] Erro:', data.erro);
      }
    });

    // Escuta broadcasts de atualizacao individual (io.emit do servidor)
    socket.on('personagem_data', (data) => {
      if (data.erro) return;
      setPersonagens((prev) => {
        if (!prev) return prev;
        return prev.map((p) => (p.id === data.id ? data : p));
      });
    });

    // Escuta o estado da dimensao (Flipside on/off)
    socket.on('flipside_state', (state) => {
      setIsFlipside(state);
    });

    // Escuta o estado do mapa tatico
    socket.on('mapa_data', (data) => {
      setMapaTokens(data);
    });

    // Escuta atualizacoes de inventario (broadcast do servidor)
    socket.on('inventario_data', (data) => {
      if (data.erro) return;
      // Atualiza somente se for do jogador alvo atualmente selecionado
      setJogadorAlvo((alvoAtual) => {
        if (data.personagem_id === alvoAtual) {
          setInventarioMestre(data.itens);
        }
        return alvoAtual;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Injeta animacao de spin
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  // Funcao para alterar HP e emitir para o servidor
  const alterarHP = (personagem, delta) => {
    const novoHp = Math.max(
      0,
      Math.min(personagem.hp_flipside_maximo, personagem.hp_flipside_atual + delta)
    );
    socketRef.current.emit('atualizar_vida', {
      id_personagem: personagem.id,
      novo_hp: novoHp,
    });
  };

  // Funcao para alternar a dimensao global
  const toggleFlipside = () => {
    socketRef.current.emit('toggle_flipside');
  };

  // Funcoes de sabotagem do tablet (Diretor de Terror)
  const sabotarVideo = () => {
    socketRef.current.emit('sabotar_tablet', { tipo: 'video' });
  };
  const drenarBateria = () => {
    socketRef.current.emit('sabotar_tablet', { tipo: 'bateria', valor: 20 });
  };
  const restaurarVideo = () => {
    socketRef.current.emit('sabotar_tablet', { tipo: 'restaurar_video' });
  };

  // Funcoes de XP
  const alterarXP = (personagemId, valor) => {
    socketRef.current.emit('adicionar_xp', {
      id_personagem: personagemId,
      valor_xp: valor,
    });
  };

  // Funcao para trocar jogador alvo e recarregar inventario
  const trocarJogadorAlvo = (novoId) => {
    const id = Number(novoId);
    setJogadorAlvo(id);
    socketRef.current.emit('get_inventario', { id_personagem: id });
  };

  // Funcao para adicionar item
  const adicionarItem = () => {
    if (!novoItemNome.trim() || !novoItemPeso) return;
    socketRef.current.emit('adicionar_item', {
      personagem_id: jogadorAlvo,
      nome: novoItemNome.trim(),
      peso: Number(novoItemPeso),
      dimensao_permitida: novoItemDim,
    });
    setNovoItemNome('');
    setNovoItemPeso('');
    setNovoItemDim('Ambos');
  };

  // Funcao para mover token no mapa tatico
  const moverToken = (novo_x, novo_y) => {
    if (!tokenSelecionado) return;
    socketRef.current.emit('mover_token', {
      id_token: tokenSelecionado,
      novo_x,
      novo_y,
    });
  };

  // Funcao para remover item
  const removerItem = (idItem) => {
    socketRef.current.emit('remover_item', {
      id_item: idItem,
      personagem_id: jogadorAlvo,
    });
  };

  // Loading
  if (!personagens) {
    return (
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <span>Conectando ao servidor DTRPGM...</span>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* ======== SIDEBAR DO MESTRE ======== */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>DTRPGM</div>
        <div style={s.sidebarRole}>Painel do Mestre</div>

        {SIDEBAR_TABS.map((tab) => {
          const isActive = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              style={{
                ...s.navBtn,
                ...(isActive ? s.navBtnActive : {}),
              }}
            >
              <span style={s.navIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </aside>

      {/* ======== MAIN CONTENT ======== */}
      <main style={s.main}>
        <div style={s.mainHeader}>
          Controle de Jogadores &mdash; {personagens.length} conectados
        </div>

        {/* ======== BOTAO FLIPSIDE TOGGLE ======== */}
        <div style={s.flipBtnWrapper}>
          <button style={s.flipBtn(isFlipside)} onClick={toggleFlipside}>
            {isFlipside ? '↩ Voltar ao Mundo Humano' : '⚡ Ativar Flipside'}
          </button>
          <div style={s.flipIndicator(isFlipside)}>
            <div style={s.flipDot(isFlipside)} />
            {isFlipside ? 'Dimensao ativa: FLIPSIDE' : 'Dimensao ativa: MUNDO HUMANO'}
          </div>
        </div>

        {/* ======== DIRETOR DE TERROR ======== */}
        <div style={s.terrorSection}>
          <div style={s.terrorTitle}>
            <span style={s.terrorTitleIcon}>👹</span>
            Diretor de Terror
          </div>
          <div style={s.terrorDesc}>
            Controle os tablets dos jogadores em tempo real. As sabotagens afetam
            todos os jogadores conectados simultaneamente.
          </div>
          <div style={s.terrorGrid}>
            <button
              style={{ ...s.terrorBtn, ...s.terrorBtnVideo }}
              onClick={sabotarVideo}
            >
              <span style={s.terrorBtnIcon}>📡</span>
              Forcar Erro de Video
            </button>
            <button
              style={{ ...s.terrorBtn, ...s.terrorBtnBateria }}
              onClick={drenarBateria}
            >
              <span style={s.terrorBtnIcon}>🔋</span>
              Drenar Bateria (-20%)
            </button>
            <button
              style={{ ...s.terrorBtn, ...s.terrorBtnRestaurar }}
              onClick={restaurarVideo}
            >
              <span style={s.terrorBtnIcon}>✅</span>
              Restaurar Video
            </button>
          </div>
        </div>

        {/* ======== SEÇÃO DE RECOMPENSAS ======== */}
        <div style={s.rewardsGrid}>
          {/* Coluna esquerda: Progressão XP */}
          <div style={s.rewardCard}>
            <div style={s.rewardTitle}>
              <span style={s.rewardTitleIcon}>⭐</span>
              Progressao (XP)
            </div>

            {/* Seletor de jogador */}
            <div style={s.targetSelector}>
              <span>Jogador alvo:</span>
              <select
                style={s.targetSelect}
                value={jogadorAlvo}
                onChange={(e) => trocarJogadorAlvo(e.target.value)}
              >
                {personagens.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (ID #{p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Info XP atual do jogador alvo */}
            {(() => {
              const alvo = personagens.find((p) => p.id === jogadorAlvo);
              if (!alvo) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>XP Atual</span>
                    <span style={s.infoValue}>{alvo.xp}</span>
                  </div>
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Nivel</span>
                    <span style={s.infoValue}>{alvo.nivel}</span>
                  </div>
                </div>
              );
            })()}

            {/* Botoes de XP */}
            <div style={s.xpGrid}>
              <button style={s.xpBtn(false)} onClick={() => alterarXP(jogadorAlvo, -10)}>
                -10 XP
              </button>
              <button style={s.xpBtn(true)} onClick={() => alterarXP(jogadorAlvo, 10)}>
                +10 XP
              </button>
              <button style={s.xpBtn(true)} onClick={() => alterarXP(jogadorAlvo, 25)}>
                +25 XP
              </button>
              <button style={s.xpBtn(true)} onClick={() => alterarXP(jogadorAlvo, 50)}>
                +50 XP
              </button>
            </div>
          </div>

          {/* Coluna direita: Loot / Inventario */}
          <div style={s.rewardCard}>
            <div style={s.rewardTitle}>
              <span style={s.rewardTitleIcon}>🎒</span>
              Loot / Inventario ({personagens.find((p) => p.id === jogadorAlvo)?.nome || '...'})
            </div>

            {/* Formulario de novo item */}
            <div style={s.lootForm}>
              <div style={s.lootFormRow}>
                <input
                  style={s.lootInput}
                  type="text"
                  placeholder="Nome do item..."
                  value={novoItemNome}
                  onChange={(e) => setNovoItemNome(e.target.value)}
                />
                <input
                  style={s.lootInput}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Peso (kg)"
                  value={novoItemPeso}
                  onChange={(e) => setNovoItemPeso(e.target.value)}
                />
                <select
                  style={s.lootSelect}
                  value={novoItemDim}
                  onChange={(e) => setNovoItemDim(e.target.value)}
                >
                  <option value="Humano">Humano</option>
                  <option value="Flipside">Flipside</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </div>
              <button style={s.lootSubmitBtn} onClick={adicionarItem}>
                + Dar Item ao Jogador
              </button>
            </div>

            {/* Lista de itens atuais */}
            <div style={s.lootListTitle}>
              Itens no inventario ({inventarioMestre.length})
            </div>

            {inventarioMestre.length === 0 ? (
              <div style={s.lootEmpty}>Inventario vazio</div>
            ) : (
              <div style={s.lootList}>
                {inventarioMestre.map((item) => (
                  <div key={item.id} style={s.lootItem}>
                    <span style={s.lootItemName}>{item.nome}</span>
                    <span style={s.lootItemMeta}>
                      {Number(item.peso).toFixed(1)} kg
                    </span>
                    <span style={s.lootItemDim(item.dimensao_permitida)}>
                      {item.dimensao_permitida}
                    </span>
                    <button
                      style={s.lootRemoveBtn}
                      onClick={() => removerItem(item.id)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======== TABULEIRO TATICO ======== */}
        <div style={s.mapaSection}>
          <div style={s.mapaTitle}>
            <span style={s.mapaTitleIcon}>🗺</span>
            Tabuleiro Tatico
          </div>

          {/* Seletor de token */}
          <div style={s.mapaTokenSelector}>
            {mapaTokens.map((token) => (
              <button
                key={token.id}
                style={s.mapaTokenBtn(token.cor, tokenSelecionado === token.id)}
                onClick={() =>
                  setTokenSelecionado(
                    tokenSelecionado === token.id ? null : token.id
                  )
                }
              >
                {token.nome}
              </button>
            ))}
          </div>

          {/* Grid 10x10 */}
          <div style={s.mapaGrid}>
            {Array.from({ length: 100 }, (_, i) => {
              const cellX = i % 10;
              const cellY = Math.floor(i / 10);
              const tokenAqui = mapaTokens.find(
                (t) => t.x === cellX && t.y === cellY
              );
              return (
                <div
                  key={`${cellX}-${cellY}`}
                  style={s.mapaCell(!!tokenAqui)}
                  onClick={() => moverToken(cellX, cellY)}
                  title={
                    tokenAqui
                      ? `${tokenAqui.nome} (${cellX}, ${cellY})`
                      : `(${cellX}, ${cellY})`
                  }
                >
                  {tokenAqui && (
                    <div style={s.mapaToken(tokenAqui.cor)}>
                      {tokenAqui.nome.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={s.mapaSelectedInfo}>
            {tokenSelecionado
              ? `Token selecionado: ${mapaTokens.find((t) => t.id === tokenSelecionado)?.nome || '—'} — Clique em uma celula para mover`
              : 'Selecione um token acima para poder move-lo no grid'}
          </div>
        </div>

        <div style={s.playersGrid}>
          {personagens.map((p) => {
            const hpPercent = Math.round(
              (p.hp_flipside_atual / p.hp_flipside_maximo) * 100
            );
            return (
              <div key={p.id} style={s.card}>
                {/* Cabecalho do card */}
                <div style={s.cardHeader}>
                  <span style={s.cardName}>{p.nome}</span>
                  <span style={s.cardId}>ID #{p.id}</span>
                </div>

                {/* Info basica */}
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Nivel</span>
                  <span style={s.infoValue}>{p.nivel}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>XP</span>
                  <span style={s.infoValue}>{p.xp}</span>
                </div>

                {/* HP Flipside com controles */}
                <div style={s.hpSection}>
                  <div style={s.hpTitle}>HP Flipside</div>
                  <div style={s.hpDisplay}>
                    <span style={s.hpNumbers}>
                      {p.hp_flipside_atual}
                      <span style={s.hpMax}> / {p.hp_flipside_maximo}</span>
                    </span>
                    <span style={{ fontSize: 13, color: '#888' }}>
                      {hpPercent}%
                    </span>
                  </div>
                  <div style={s.hpBarOuter}>
                    <div style={s.hpBarInner(hpPercent)} />
                  </div>

                  {/* Botoes de controle de HP */}
                  <div style={s.controls}>
                    <button
                      style={{ ...s.btn, ...s.btnDamage }}
                      onClick={() => alterarHP(p, -5)}
                    >
                      -5 HP
                    </button>
                    <button
                      style={{ ...s.btn, ...s.btnHeal }}
                      onClick={() => alterarHP(p, +5)}
                    >
                      +5 HP
                    </button>
                  </div>
                </div>

                {/* Mini grid de atributos S.P.R.I.N.G. */}
                <div style={s.attrsGrid}>
                  {SPRING_LABELS.map(({ key, letter }) => (
                    <div key={key} style={s.attrChip}>
                      <span style={s.attrLetter}>{letter}</span>
                      <span style={s.attrVal}>{p[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Mestre;
