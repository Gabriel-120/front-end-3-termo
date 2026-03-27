import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  return (
    <div>
      <h1>Olá, React!</h1>
      <p>Estou alterando meu primeiro componente.</p>
      <Saudacao />
      <Perfil nome="Gabriel" cargo="Aluno" email="Gomes@gmail.com" senha="********" />
      <Painel />
      <Painel2 />
      <Mercado_Joao produto="Coca-Cola 2L" preco={12} quantidade={3} estoque={20} /> 
      <PlacarFutebol nomeTimeA="São Paulo" nomeTimeB="Palmeiras"/> 

      {/* comentarios */}
    </div>
  )
}

export default App

function Saudacao() {
  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
      <h2 style={{ color: '#007bff' }}>Olá, Alunos!</h2>
      <p>Este componente foi criado separadamente</p>
    </div>
  );
}

// Crie 2 componentes, Chamados Perfil e Painel respectivamente e adicione alguma frase e estilizacao à sua escolha. 
// OBS: Não se esqueça de chama-los no componente principal (APP)

function Perfil({ nome, cargo, email, senha }) {
  return (
    <div className="perfil-card">
      <div className="perfil-avatar">
        <img
          src="https://placehold.co/120x120?text=Avatar"
          alt="perfil"
          className="perfil-img"
        />
      </div>

      <div className="perfil-info">
        <label>Nome de Usuario</label>
        <h2>{nome}</h2>

        <label>Cargo:</label>
        <h2>{cargo}</h2>

        <label>Email:</label>
        <h2>{email}</h2>

        <label>Senha:</label>
        <h2>{senha}</h2>


      </div>
    </div>
  )
}


function Painel() {
  return (
    <div className="painel-container">
      <div className="foto-container">
        <label htmlFor="foto-perfil" className="foto-label">Foto de Perfil</label>
        <input type="file" name="foto" id="foto-perfil" className="input-file" />
      </div>

      <div className="form-group">
        <label>Nome de Usuario:</label>
        <input type="text" className="input-text" />
      </div>

      <div className="form-group">
        <label>Cargo:</label>
        <input type="text" className="input-text" />
      </div>

      <div className="form-group">
        <label>Email do Usuario:</label>
        <input type="email" name="Email" id="email" className="input-text" />
      </div>

      <div className="form-group">
        <label>Senha do Usuario:</label>
        <input type="password" name="Senha" id="senha" className="input-text" />
      </div>
    </div>
  );
}


function Mercado_Joao({ produto, preco, quantidade, estoque }) {
  return (
    <div className="mercado-container">
      <div className="mercado-card">

        <div className="info-grupo produto-destaque">
          <label>Produto</label>
          <h2 className="nome-produto">{produto}</h2>
        </div>

        <div className="info-grupo">
          <label>Preço Unitário:</label>
          <p className="valor">R$ {preco} Reais</p>
        </div>

        <div className="info-grupo">
          <label>Quantidade:</label>
          <p className="valor">{quantidade} unid.</p>
        </div>

        <div className="info-grupo total-destaque">
          <label>Total compra:</label>
          <p className="valor-total">R$ {(quantidade * preco).toFixed(2)}</p>
        </div>

        <div className="info-grupo estoque-info">
          <label>Quantidade no estoque:</label>
          <p>Antes da venda: <strong>{estoque}</strong></p>
          <p>Pós venda: <strong>{estoque - quantidade}</strong></p>
        </div>

      </div>
    </div>
  );
}

function Painel2() {
  const [texto, setTexto] = useState('');

  return (
    <div style={{ background: '#f9f9f9', padding: '15px', border: '1px dashed #666', marginTop: '20px' }}>
      <h4>Escreva uma Mensagem:</h4>
      <input
        type="text"
        placeholder="Digite Algo..."
        onChange={(e) => setTexto(e.target.value)}
        style={{ padding: '8px', width: '80%' }}
      />
      <p>O que Você Digitou: <span style={{ color: 'red' }}>{texto}</span></p>
    </div>
  );
}

function PlacarFutebol({ nomeTimeA, nomeTimeB }) {
  // Criamos duas "caixinhas de memória" (States)
  const [golsA, setGolsA] = useState(0);
  const [golsB, setGolsB] = useState(0);

  return (
    <div style={{
      border: '3px solid #2e7d32',
      borderRadius: '15px',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f1f8e9',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <h2 style={{ color: '#1b5e20' }}>⚽ Placar do Jogo</h2>

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>

        {/* Lado do Time A */}
        <div>
          <h3>{nomeTimeA}</h3>
          <h1 style={{ fontSize: '48px', margin: '10px 0' }}>{golsA}</h1>
          <button onClick={() => setGolsA(golsA + 1)} style={botaoEstilo}>
            GOL!
          </button>
        </div>

        <h1 style={{ margin: '0 20px' }}>X</h1>

        {/* Lado do Time B */}
        <div>
          <h3>{nomeTimeB}</h3>
          <h1 style={{ fontSize: '48px', margin: '10px 0' }}>{golsB}</h1>
          <button onClick={() => setGolsB(golsB + 1)} style={botaoEstilo}>
            GOL!
          </button>
        </div>

      </div>

      <hr style={{ margin: '20px 0' }} />

      <button
        onClick={() => { setGolsA(0); setGolsB(0); }}
        style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}
      >
        Reiniciar Partida 🔄
      </button>
    </div>
  );
}

// Estilo simples para os botões de GOL
const botaoEstilo = {
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  fontSize: '16px',
  cursor: 'pointer',
  fontWeight: 'bold'
};