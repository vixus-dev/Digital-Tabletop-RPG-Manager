import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Jogador from './pages/Jogador';
import Mestre from './pages/Mestre';

// =============================================
// Roteamento principal do DTRPGM
// =============================================
// /jogador/:id  -> Painel do Jogador (ficha individual)
// /mestre       -> Painel do Mestre (controle de todos os jogadores)
// /             -> Redireciona para /jogador/1 (temporario)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/jogador/:id" element={<Jogador />} />
        <Route path="/mestre" element={<Mestre />} />
        <Route path="*" element={<Navigate to="/jogador/1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
