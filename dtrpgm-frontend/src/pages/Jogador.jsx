import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

// =============================================
// Constantes de dados
// =============================================

const BODY_LABELS = {
  cabeca: 'Cabeca',
  tronco: 'Tronco',
  braco_esq: 'Braco Esq.',
  braco_dir: 'Braco Dir.',
  perna_esq: 'Perna Esq.',
  perna_dir: 'Perna Dir.',
};

const SPRING_ATTRS = [
  { key: 'forca', label: 'Forca', letter: 'S' },
  { key: 'percepcao', label: 'Percepcao', letter: 'P' },
  { key: 'reflexos', label: 'Reflexos', letter: 'R' },
  { key: 'inteligencia', label: 'Inteligencia', letter: 'I' },
  { key: 'nervo', label: 'Nervo', letter: 'N' },
  { key: 'fantasma', label: 'Fantasma', letter: 'G' },
];

const SIDEBAR_TABS = [
  { id: 'principal', label: 'Principal', icon: '⬡' },
  { id: 'mapa', label: 'Mapa', icon: '◈' },
  { id: 'cameras', label: 'Cameras/Util', icon: '◉' },
  { id: 'inventario', label: 'Inventario', icon: '◆' },
  { id: 'sair', label: 'Sair', icon: '⏻' },
];

// Habilidades placeholder da mascara no Flipside
const MASK_ABILITIES = [
  { nome: 'Bite', desc: 'Mordida sobrenatural que drena essencia', custo: '5 HP', icon: '🦷' },
  { nome: 'Mic Toss', desc: 'Arremessa energia sonora concentrada', custo: '8 HP', icon: '🎤' },
  { nome: 'Jumpscare', desc: 'Paralisa o alvo com terror puro', custo: '12 HP', icon: '👁' },
];

// Cameras de seguranca placeholder
const CAMERAS = [
  { id: 'CAM 01', nome: 'Palco Principal', online: true },
  { id: 'CAM 02', nome: 'Corredor Leste', online: true },
  { id: 'CAM 03', nome: 'Deposito', online: false },
  { id: 'CAM 04', nome: 'Entrada VIP', online: true },
];

// Labels das dimensoes permitidas para itens
const DIMENSAO_LABELS = {
  Humano: { label: 'Humano', icon: '🌍' },
  Flipside: { label: 'Flipside', icon: '🌀' },
  Ambos: { label: 'Ambos', icon: '⚡' },
};

// =============================================
// Estilos (CSS-in-JS)
// =============================================

// Paletas condicionais por dimensao
const THEME = {
  human: {
    bg: '#0f0f1b',
    sidebarBg: '#141425',
    sidebarBorder: '#2a2a4a',
    logoColor: '#c084fc',
    cardBg: '#1a1a2e',
    cardBorder: '#2a2a4a',
    accent: '#7c3aed',
    accentLight: '#c084fc',
    innerBg: '#16213e',
  },
  flipside: {
    bg: '#1a0a0a',
    sidebarBg: '#1c0f14',
    sidebarBorder: '#3d1a2a',
    logoColor: '#f87171',
    cardBg: '#1f0d18',
    cardBorder: '#3d1a2a',
    accent: '#dc2626',
    accentLight: '#f87171',
    innerBg: '#2a1018',
  },
};

const makeStyles = (t) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: t.bg,
    color: '#d4d4e0',
    transition: 'background 0.6s ease',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '24px 12px',
    background: t.sidebarBg,
    borderRight: `1px solid ${t.sidebarBorder}`,
    transition: 'background 0.6s ease, border 0.6s ease',
  },
  sidebarLogo: {
    fontSize: 20,
    fontWeight: 800,
    textAlign: 'center',
    color: t.logoColor,
    letterSpacing: 3,
    marginBottom: 28,
    textTransform: 'uppercase',
    transition: 'color 0.6s ease',
  },
  tabBtn: {
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
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  tabBtnActive: {
    background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}11)`,
    color: t.accentLight,
    fontWeight: 700,
    border: `1px solid ${t.accent}44`,
  },
  tabBtnExit: {
    marginTop: 'auto',
    color: '#f8717180',
  },
  tabIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  main: {
    padding: 28,
    overflow: 'auto',
  },
  mainHeader: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 20,
  },

  // ---- Indicador de dimensao no topo ----
  dimensionBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '8px 0',
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    background: t === THEME.flipside ? '#dc262622' : 'transparent',
    color: t === THEME.flipside ? '#f87171' : '#555',
    border: t === THEME.flipside ? '1px solid #dc262644' : '1px solid transparent',
    transition: 'all 0.6s ease',
  },
  dimensionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: t === THEME.flipside ? '#f87171' : '#555',
    boxShadow: t === THEME.flipside ? '0 0 10px #f87171' : 'none',
  },

  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: 20,
  },
  card: {
    background: t.cardBg,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${t.cardBorder}`,
    transition: 'background 0.6s ease, border 0.6s ease',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: t.accent,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: `1px solid ${t.cardBorder}`,
    transition: 'color 0.6s ease',
  },
  cardCorpo: { gridColumn: '1', gridRow: '1' },
  cardGrafico: { gridColumn: '1', gridRow: '2' },
  cardMascara: { gridColumn: '2', gridRow: '1' },
  cardInfo: { gridColumn: '2', gridRow: '2' },
  cardTraits: { gridColumn: '3', gridRow: '1 / 3' },

  // ---- Status do corpo (Mundo Humano) ----
  bodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  bodyPart: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: t.innerBg,
    borderRadius: 6,
    fontSize: 13,
  },

  // ---- Habilidades da Mascara (Flipside) ----
  abilityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  abilityCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    background: t.innerBg,
    borderRadius: 8,
    borderLeft: `3px solid ${t.accent}`,
  },
  abilityIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: 700,
    color: t.accentLight,
    marginBottom: 3,
  },
  abilityDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  abilityCost: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: 700,
  },

  // ---- Info basica ----
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 14,
  },
  infoLabel: { color: '#999' },
  infoValue: { fontWeight: 700, color: '#f0f0f0' },
  badge: {
    display: 'inline-block',
    background: t.accent,
    color: '#fff',
    borderRadius: 4,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700,
  },
  hpBarOuter: {
    height: 18,
    borderRadius: 10,
    background: '#2a2a4a',
    overflow: 'hidden',
    marginTop: 8,
  },
  hpBarInner: (percent) => ({
    height: '100%',
    width: `${percent}%`,
    background: `linear-gradient(90deg, ${t.accent}, ${t.accentLight})`,
    borderRadius: 10,
    transition: 'width 0.5s ease',
  }),
  hpText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#aaa',
    marginTop: 6,
  },

  // ---- Mascara ----
  mascaraPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: 100,
    color: '#555',
    fontSize: 14,
    gap: 12,
  },
  mascaraIcon: { fontSize: 40, opacity: 0.3 },

  // ---- Traits ----
  traitsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
  },
  traitSection: { flex: 1 },
  traitSubtitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#666',
    marginBottom: 10,
  },
  traitItem: {
    padding: '8px 12px',
    background: t.innerBg,
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 6,
    borderLeft: '3px solid',
  },

  // =============================================
  // Estilos do Inventario
  // =============================================

  invContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 24,
  },

  // ---- Resumo lateral do inventario ----
  invSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  invSummaryCard: {
    background: t.cardBg,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${t.cardBorder}`,
  },

  // ---- Barra de peso ----
  weightRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
  weightBarOuter: {
    height: 14,
    borderRadius: 7,
    background: '#2a2a4a',
    overflow: 'hidden',
  },
  weightBarInner: (percent) => ({
    height: '100%',
    width: `${Math.min(percent, 100)}%`,
    background:
      percent > 90
        ? 'linear-gradient(90deg, #dc2626, #f87171)'
        : percent > 70
        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
        : `linear-gradient(90deg, ${t.accent}, ${t.accentLight})`,
    borderRadius: 7,
    transition: 'width 0.4s ease',
  }),
  weightPercent: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  // ---- Legenda de dimensoes ----
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 4,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#999',
  },
  legendDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: 3,
    background: color,
  }),

  // ---- Lista de itens ----
  invList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  invItemCard: (locked) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: t.cardBg,
    borderRadius: 10,
    border: `1px solid ${locked ? '#ffffff10' : t.cardBorder}`,
    opacity: locked ? 0.4 : 1,
    transition: 'opacity 0.3s ease',
  }),
  invItemIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: t.innerBg,
    borderRadius: 8,
  },
  invItemInfo: {
    flex: 1,
  },
  invItemName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  invItemMeta: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    color: '#888',
  },
  invItemDimTag: (dim) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background:
      dim === 'Humano' ? '#3b82f622' :
      dim === 'Flipside' ? '#dc262622' :
      '#facc1522',
    color:
      dim === 'Humano' ? '#60a5fa' :
      dim === 'Flipside' ? '#f87171' :
      '#fbbf24',
  }),
  invItemBtn: (locked) => ({
    padding: '8px 18px',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: locked ? 'not-allowed' : 'pointer',
    background: locked ? '#ffffff08' : `${t.accent}33`,
    color: locked ? '#555' : t.accentLight,
    border: locked ? '1px solid #ffffff10' : `1px solid ${t.accent}55`,
    transition: 'all 0.15s ease',
  }),
  invLockIcon: {
    fontSize: 16,
    marginRight: 4,
  },

  // ---- Inventario vazio ----
  invEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#555',
    fontSize: 15,
    gap: 12,
  },
  invEmptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },

  // =============================================
  // Estilos da aba Cameras/Util (Tablet)
  // =============================================

  camContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: 24,
  },

  // ---- Moldura do tablet ----
  tabletFrame: {
    background: '#0a0a0a',
    borderRadius: 16,
    border: '3px solid #333',
    overflow: 'hidden',
    position: 'relative',
  },
  tabletTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#111',
    borderBottom: '1px solid #222',
  },
  tabletTopLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    color: '#4ade80',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabletRecDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#dc2626',
    animation: 'blink 1s ease-in-out infinite',
  },
  tabletBattery: (percent) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color:
      percent > 50 ? '#4ade80' :
      percent > 20 ? '#fbbf24' :
      '#f87171',
  }),
  tabletBatteryBar: (percent) => ({
    width: 28,
    height: 12,
    borderRadius: 3,
    border: `1px solid ${percent > 50 ? '#4ade80' : percent > 20 ? '#fbbf24' : '#f87171'}`,
    position: 'relative',
    overflow: 'hidden',
  }),
  tabletBatteryFill: (percent) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${percent}%`,
    background:
      percent > 50 ? '#4ade80' :
      percent > 20 ? '#fbbf24' :
      '#f87171',
    transition: 'width 0.5s ease, background 0.5s ease',
  }),

  // ---- Tela do tablet (video feed) ----
  tabletScreen: {
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
  },

  // ---- Estado normal: cameras ----
  camGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    flex: 1,
    gap: 2,
    background: '#111',
    padding: 2,
  },
  camFeed: {
    background: '#0d0d0d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 190,
    border: '1px solid #1a1a1a',
  },
  camLabel: {
    position: 'absolute',
    top: 8,
    left: 10,
    fontSize: 10,
    fontWeight: 700,
    color: '#4ade8088',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  camTimestamp: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    fontSize: 9,
    color: '#ffffff33',
    fontFamily: 'monospace',
  },
  camPlaceholder: {
    fontSize: 36,
    opacity: 0.15,
  },
  camOfflineText: {
    fontSize: 11,
    color: '#ffffff22',
    marginTop: 8,
  },

  // ---- Estado de erro: sinal perdido ----
  tabletError: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    background: 'repeating-linear-gradient(0deg, #1a0505 0px, #1a0505 2px, #0d0202 2px, #0d0202 4px)',
    position: 'relative',
    overflow: 'hidden',
  },
  tabletErrorOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 0%, #dc262610 50%, transparent 100%)',
    animation: 'scanline 3s linear infinite',
  },
  tabletErrorIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.6,
  },
  tabletErrorText: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f87171',
    textTransform: 'uppercase',
    letterSpacing: 4,
    animation: 'blink 1s ease-in-out infinite',
  },
  tabletErrorSub: {
    fontSize: 12,
    color: '#dc262688',
    marginTop: 8,
    letterSpacing: 2,
  },

  // ---- Painel lateral de cameras ----
  camSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  camSidebarCard: {
    background: t.cardBg,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${t.cardBorder}`,
  },
  camListItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: t.innerBg,
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 6,
  },
  camListDot: (online) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: online ? '#4ade80' : '#555',
    boxShadow: online ? '0 0 6px #4ade80' : 'none',
  }),
  camListName: {
    flex: 1,
    marginLeft: 10,
    color: '#ccc',
    fontWeight: 600,
  },
  camListStatus: (online) => ({
    fontSize: 10,
    color: online ? '#4ade80' : '#888',
    fontWeight: 700,
    textTransform: 'uppercase',
  }),

  // =============================================
  // Estilos do Mapa Tatico (Jogador — somente leitura)
  // =============================================

  mapaContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  mapaCard: {
    background: t.cardBg,
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${t.cardBorder}`,
    width: 'fit-content',
  },
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
    background: hasToken ? t.innerBg : '#0f0f1b',
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  mapaLegend: {
    background: t.cardBg,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${t.cardBorder}`,
    width: 'fit-content',
  },
  mapaLegendTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: t.accent,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1px solid ${t.cardBorder}`,
  },
  mapaLegendList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  mapaLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#ccc',
  },
  mapaLegendDot: (cor) => ({
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: cor,
    boxShadow: `0 0 6px ${cor}66`,
  }),

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
    borderTop: `3px solid ${t.accent}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
});

// =============================================
// Helpers
// =============================================

// Verifica se um item esta bloqueado na dimensao atual
const isItemLocked = (dimensao_permitida, isFlipside) => {
  if (dimensao_permitida === 'Ambos') return false;
  if (dimensao_permitida === 'Humano' && !isFlipside) return false;
  if (dimensao_permitida === 'Flipside' && isFlipside) return false;
  return true;
};

// =============================================
// Componente Jogador — Painel individual da ficha
// =============================================

function Jogador() {
  const { id } = useParams();
  const [personagem, setPersonagem] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('principal');
  const [isFlipside, setIsFlipside] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [bateriaTablet, setBateriaTablet] = useState(100);
  const [erroDeVideo, setErroDeVideo] = useState(false);
  const [mapaTokens, setMapaTokens] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    // Solicita a ficha do personagem e o inventario pelo ID da URL
    socket.emit('get_personagem', { id: Number(id) });
    socket.emit('get_inventario', { id_personagem: Number(id) });

    // Escuta atualizacoes em tempo real (broadcast do Mestre via io.emit)
    socket.on('personagem_data', (data) => {
      if (data.erro) {
        console.error('[DTRPGM] Erro recebido:', data.erro);
        return;
      }
      if (data.id === Number(id)) {
        setPersonagem(data);
      }
    });

    // Escuta o estado da dimensao (Flipside on/off)
    socket.on('flipside_state', (state) => {
      setIsFlipside(state);
    });

    // Escuta os dados do inventario (formato: { personagem_id, itens })
    // Filtra para atualizar somente se o inventario for deste jogador
    socket.on('inventario_data', (data) => {
      if (data.erro) {
        console.error('[DTRPGM] Erro no inventario:', data.erro);
        return;
      }
      if (data.personagem_id === Number(id)) {
        setInventario(data.itens);
      }
    });

    // Escuta o estado do mapa tatico
    socket.on('mapa_data', (data) => {
      setMapaTokens(data);
    });

    // Escuta sabotagens do tablet (Diretor de Terror do Mestre)
    socket.on('tablet_sabotado', (payload) => {
      switch (payload.tipo) {
        case 'video':
          setErroDeVideo(true);
          break;
        case 'restaurar_video':
          setErroDeVideo(false);
          break;
        case 'bateria':
          setBateriaTablet((prev) => Math.max(0, prev - (payload.valor || 0)));
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Quando a aba muda para 'inventario', busca os itens
  useEffect(() => {
    if (abaAtiva === 'inventario' && socketRef.current) {
      socketRef.current.emit('get_inventario', { id_personagem: Number(id) });
    }
  }, [abaAtiva, id]);

  // Injeta animacoes CSS (spin, blink, scanline)
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  // Seleciona o tema baseado na dimensao ativa
  const theme = isFlipside ? THEME.flipside : THEME.human;
  const s = makeStyles(theme);

  // Loading
  if (!personagem) {
    return (
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <span>Conectando ao servidor DTRPGM...</span>
      </div>
    );
  }

  // Dados derivados
  const radarData = SPRING_ATTRS.map(({ key, letter }) => ({
    attr: letter,
    value: personagem[key],
  }));
  const hpPercent = Math.round(
    (personagem.hp_flipside_atual / personagem.hp_flipside_maximo) * 100
  );

  // Dados do inventario
  const pesoMaximo = personagem.forca * 5;
  const pesoAtual = inventario.reduce((sum, item) => sum + Number(item.peso), 0);
  const pesoPercent = pesoMaximo > 0 ? Math.round((pesoAtual / pesoMaximo) * 100) : 0;

  // Handler de troca de aba
  const handleTabClick = (tabId) => {
    setAbaAtiva(tabId);
  };

  return (
    <div style={s.root}>
      {/* ======== SIDEBAR ======== */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>DTRPGM</div>
        {SIDEBAR_TABS.map((tab) => {
          const isActive = abaAtiva === tab.id;
          const isExit = tab.id === 'sair';
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                ...s.tabBtn,
                ...(isActive ? s.tabBtnActive : {}),
                ...(isExit ? s.tabBtnExit : {}),
              }}
            >
              <span style={s.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </aside>

      {/* ======== MAIN CONTENT ======== */}
      <main style={s.main}>
        <div style={s.mainHeader}>
          Painel do Jogador &mdash; {personagem.nome}
        </div>

        {/* Indicador de dimensao */}
        <div style={s.dimensionBanner}>
          <div style={s.dimensionDot} />
          {isFlipside ? 'Voce esta no Flipside' : 'Mundo Humano'}
        </div>

        {/* ======== ABA PRINCIPAL ======== */}
        {abaAtiva === 'principal' && (
          <div style={s.contentGrid}>
            {/* BLOCO 1 (esq. superior): CONDICIONAL */}
            <div style={{ ...s.card, ...s.cardCorpo }}>
              {!isFlipside ? (
                <>
                  <div style={s.cardTitle}>Status do Corpo</div>
                  <div style={s.bodyGrid}>
                    {Object.entries(personagem.status_corpo_humano).map(
                      ([parte, status]) => (
                        <div key={parte} style={s.bodyPart}>
                          <span>{BODY_LABELS[parte] || parte}</span>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: status === 'saudavel' ? '#4ade80' : '#f87171',
                              textTransform: 'capitalize',
                            }}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={s.cardTitle}>Habilidades da Mascara</div>
                  <div style={s.abilityList}>
                    {MASK_ABILITIES.map((ab) => (
                      <div key={ab.nome} style={s.abilityCard}>
                        <span style={s.abilityIcon}>{ab.icon}</span>
                        <div style={s.abilityInfo}>
                          <div style={s.abilityName}>{ab.nome}</div>
                          <div style={s.abilityDesc}>{ab.desc}</div>
                          <div style={s.abilityCost}>Custo: {ab.custo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* BLOCO 2: Grafico S.P.R.I.N.G. */}
            <div style={{ ...s.card, ...s.cardGrafico }}>
              <div style={s.cardTitle}>Grafico S.P.R.I.N.G.</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke={isFlipside ? '#3d1a2a' : '#2a2a4a'} />
                  <PolarAngleAxis
                    dataKey="attr"
                    tick={{
                      fill: isFlipside ? '#f87171' : '#c084fc',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: '#555', fontSize: 10 }}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke={isFlipside ? '#dc2626' : '#7c3aed'}
                    fill={isFlipside ? '#dc2626' : '#7c3aed'}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* BLOCO 3: Mascara Equipada */}
            <div style={{ ...s.card, ...s.cardMascara }}>
              <div style={s.cardTitle}>Mascara Equipada</div>
              <div style={s.mascaraPlaceholder}>
                <span style={s.mascaraIcon}>🎭</span>
                <span>Nenhuma mascara equipada</span>
              </div>
            </div>

            {/* BLOCO 4: Informacoes Basicas */}
            <div style={{ ...s.card, ...s.cardInfo }}>
              <div style={s.cardTitle}>Informacoes Basicas</div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Nome</span>
                <span style={s.infoValue}>{personagem.nome}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Nivel</span>
                <span style={s.badge}>{personagem.nivel}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>XP</span>
                <span style={s.infoValue}>{personagem.xp}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>HP Flipside</span>
                  <span style={s.infoValue}>
                    {personagem.hp_flipside_atual} / {personagem.hp_flipside_maximo}
                  </span>
                </div>
                <div style={s.hpBarOuter}>
                  <div style={s.hpBarInner(hpPercent)} />
                </div>
                <div style={s.hpText}>{hpPercent}%</div>
              </div>
            </div>

            {/* BLOCO 5: Traits / Anotacoes */}
            <div style={{ ...s.card, ...s.cardTraits }}>
              <div style={s.cardTitle}>Traits / Anotacoes</div>
              <div style={s.traitsPanel}>
                <div style={s.traitSection}>
                  <div style={s.traitSubtitle}>Qualidades</div>
                  <div style={{ ...s.traitItem, borderColor: '#4ade80' }}>
                    Nenhuma qualidade registrada ainda.
                  </div>
                </div>
                <div style={s.traitSection}>
                  <div style={s.traitSubtitle}>Defeitos</div>
                  <div style={{ ...s.traitItem, borderColor: '#f87171' }}>
                    Nenhum defeito registrado ainda.
                  </div>
                </div>
                <div style={s.traitSection}>
                  <div style={s.traitSubtitle}>Anotacoes do Mestre</div>
                  <div style={{ ...s.traitItem, borderColor: '#facc15' }}>
                    Sem anotacoes no momento.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== ABA MAPA ======== */}
        {abaAtiva === 'mapa' && (
          <div style={s.mapaContainer}>
            <div style={s.mapaCard}>
              <div style={s.cardTitle}>Tabuleiro Tatico</div>
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
            </div>

            {/* Legenda dos tokens */}
            <div style={s.mapaLegend}>
              <div style={s.mapaLegendTitle}>Legenda</div>
              <div style={s.mapaLegendList}>
                {mapaTokens.map((token) => (
                  <div key={token.id} style={s.mapaLegendItem}>
                    <div style={s.mapaLegendDot(token.cor)} />
                    <span>{token.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======== ABA INVENTARIO ======== */}
        {abaAtiva === 'inventario' && (
          <div style={s.invContainer}>
            {/* Coluna esquerda: Lista de itens */}
            <div>
              <div style={s.cardTitle}>
                Itens ({inventario.length})
              </div>

              {inventario.length === 0 ? (
                <div style={s.invEmpty}>
                  <span style={s.invEmptyIcon}>📦</span>
                  <span>Inventario vazio</span>
                  <span style={{ fontSize: 12, color: '#444' }}>
                    Nenhum item encontrado para este personagem.
                  </span>
                </div>
              ) : (
                <div style={s.invList}>
                  {inventario.map((item) => {
                    const locked = isItemLocked(item.dimensao_permitida, isFlipside);
                    const dimInfo = DIMENSAO_LABELS[item.dimensao_permitida] || {};
                    return (
                      <div key={item.id} style={s.invItemCard(locked)}>
                        {/* Icone do item */}
                        <div style={s.invItemIcon}>
                          {locked ? '🔒' : '🎒'}
                        </div>

                        {/* Info do item */}
                        <div style={s.invItemInfo}>
                          <div style={s.invItemName}>
                            {locked && <span style={s.invLockIcon}>🔒 </span>}
                            {item.nome}
                          </div>
                          <div style={s.invItemMeta}>
                            <span>⚖ {Number(item.peso).toFixed(1)} kg</span>
                            <span style={s.invItemDimTag(item.dimensao_permitida)}>
                              {dimInfo.icon} {dimInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Botao Usar */}
                        <button
                          style={s.invItemBtn(locked)}
                          disabled={locked}
                          title={locked ? 'Item bloqueado nesta dimensao' : 'Usar item'}
                        >
                          {locked ? 'Bloqueado' : 'Usar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna direita: Resumo */}
            <div style={s.invSummary}>
              {/* Card de peso */}
              <div style={s.invSummaryCard}>
                <div style={s.cardTitle}>Capacidade de Carga</div>
                <div style={s.weightRow}>
                  <span style={s.infoLabel}>Peso</span>
                  <span style={s.infoValue}>
                    {pesoAtual.toFixed(1)} / {pesoMaximo} kg
                  </span>
                </div>
                <div style={s.weightBarOuter}>
                  <div style={s.weightBarInner(pesoPercent)} />
                </div>
                <div style={s.weightPercent}>{pesoPercent}%</div>

                <div style={{ ...s.infoRow, marginTop: 16 }}>
                  <span style={s.infoLabel}>Forca (S)</span>
                  <span style={s.infoValue}>{personagem.forca}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Limite</span>
                  <span style={{ ...s.infoValue, fontSize: 12, color: '#999' }}>
                    Forca x 5 = {pesoMaximo} kg
                  </span>
                </div>
              </div>

              {/* Card de legenda dimensional */}
              <div style={s.invSummaryCard}>
                <div style={s.cardTitle}>Legenda Dimensional</div>
                <div style={s.legendList}>
                  <div style={s.legendItem}>
                    <div style={s.legendDot('#60a5fa')} />
                    <span>🌍 Humano — Apenas no Mundo Humano</span>
                  </div>
                  <div style={s.legendItem}>
                    <div style={s.legendDot('#f87171')} />
                    <span>🌀 Flipside — Apenas no Flipside</span>
                  </div>
                  <div style={s.legendItem}>
                    <div style={s.legendDot('#fbbf24')} />
                    <span>⚡ Ambos — Funciona em qualquer dimensao</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                  Itens incompativeis com a dimensao atual ficam
                  bloqueados (🔒) e nao podem ser usados.
                </div>
              </div>

              {/* Card de dimensao atual */}
              <div style={s.invSummaryCard}>
                <div style={s.cardTitle}>Dimensao Atual</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '16px 0',
                  fontSize: 16,
                  fontWeight: 700,
                  color: isFlipside ? '#f87171' : '#60a5fa',
                }}>
                  <span style={{ fontSize: 24 }}>{isFlipside ? '🌀' : '🌍'}</span>
                  {isFlipside ? 'Flipside' : 'Mundo Humano'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== ABA CAMERAS/UTIL ======== */}
        {abaAtiva === 'cameras' && (
          <div style={s.camContainer}>
            {/* Coluna esquerda: Tablet de seguranca */}
            <div style={s.tabletFrame}>
              {/* Barra superior do tablet */}
              <div style={s.tabletTopBar}>
                <div style={s.tabletTopLeft}>
                  <div style={s.tabletRecDot} />
                  {erroDeVideo ? 'Offline' : 'REC'}
                </div>
                <div style={s.tabletBattery(bateriaTablet)}>
                  <div style={s.tabletBatteryBar(bateriaTablet)}>
                    <div style={s.tabletBatteryFill(bateriaTablet)} />
                  </div>
                  {bateriaTablet}%
                </div>
              </div>

              {/* Tela do tablet */}
              <div style={s.tabletScreen}>
                {erroDeVideo ? (
                  /* Estado de erro: tela com ruido */
                  <div style={s.tabletError}>
                    <div style={s.tabletErrorOverlay} />
                    <div style={s.tabletErrorIcon}>📡</div>
                    <div style={s.tabletErrorText}>Sinal Perdido</div>
                    <div style={s.tabletErrorSub}>Erro de Video — Aguardando reconexao...</div>
                  </div>
                ) : (
                  /* Estado normal: grid de cameras */
                  <div style={s.camGrid}>
                    {CAMERAS.map((cam) => (
                      <div key={cam.id} style={s.camFeed}>
                        <span style={s.camLabel}>{cam.id}</span>
                        <span style={s.camPlaceholder}>📹</span>
                        <span style={s.camOfflineText}>
                          {cam.online ? cam.nome : 'Sem sinal'}
                        </span>
                        <span style={s.camTimestamp}>
                          {cam.online ? '●  LIVE' : '○  OFFLINE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita: Info do sistema */}
            <div style={s.camSidebar}>
              {/* Status da bateria */}
              <div style={s.camSidebarCard}>
                <div style={s.cardTitle}>Status do Tablet</div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Bateria</span>
                  <span style={{
                    fontWeight: 700,
                    color:
                      bateriaTablet > 50 ? '#4ade80' :
                      bateriaTablet > 20 ? '#fbbf24' :
                      '#f87171',
                  }}>
                    {bateriaTablet}%
                  </span>
                </div>
                <div style={s.hpBarOuter}>
                  <div style={{
                    height: '100%',
                    width: `${bateriaTablet}%`,
                    background:
                      bateriaTablet > 50
                        ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                        : bateriaTablet > 20
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #dc2626, #f87171)',
                    borderRadius: 10,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Sinal de Video</span>
                  <span style={{
                    fontWeight: 700,
                    color: erroDeVideo ? '#f87171' : '#4ade80',
                  }}>
                    {erroDeVideo ? 'ERRO' : 'OK'}
                  </span>
                </div>
              </div>

              {/* Lista de cameras */}
              <div style={s.camSidebarCard}>
                <div style={s.cardTitle}>Cameras</div>
                {CAMERAS.map((cam) => (
                  <div key={cam.id} style={s.camListItem}>
                    <div style={s.camListDot(cam.online)} />
                    <span style={s.camListName}>{cam.id} — {cam.nome}</span>
                    <span style={s.camListStatus(cam.online)}>
                      {cam.online ? 'Online' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Aviso */}
              <div style={s.camSidebarCard}>
                <div style={s.cardTitle}>Notas do Sistema</div>
                <div style={{
                  fontSize: 12,
                  color: '#555',
                  lineHeight: 1.6,
                }}>
                  O tablet consome bateria ao longo da missao.
                  Se a bateria chegar a 0%, todas as cameras
                  serao desligadas automaticamente.
                  Interferencias podem ocorrer sem aviso.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Jogador;
