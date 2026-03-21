const pool = require('./db');

const setup = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // =============================================
    // DDL - Criacao das tabelas
    // =============================================

    // Remove tabelas existentes para recriar com a estrutura correta
    // (itens primeiro por causa da FK)
    await client.query('DROP TABLE IF EXISTS itens');
    await client.query('DROP TABLE IF EXISTS personagens');

    // Tabela de personagens com sistema S.P.R.I.N.G.
    // S = Strength (forca)
    // P = Perception (percepcao)
    // R = Reflexes (reflexos)
    // I = Intelligence (inteligencia)
    // N = Nerve (nervo)
    // G = Ghost (fantasma)
    //
    // Mundo Humano: dano por partes do corpo via JSONB (status_corpo_humano)
    // Flipside: HP numerico (hp_flipside_atual / hp_flipside_maximo)
    await client.query(`
      CREATE TABLE personagens (
        id                  SERIAL PRIMARY KEY,
        nome                VARCHAR(100) NOT NULL,
        forca               INT NOT NULL CHECK (forca BETWEEN 1 AND 10),
        percepcao           INT NOT NULL CHECK (percepcao BETWEEN 1 AND 10),
        reflexos            INT NOT NULL CHECK (reflexos BETWEEN 1 AND 10),
        inteligencia        INT NOT NULL CHECK (inteligencia BETWEEN 1 AND 10),
        nervo               INT NOT NULL CHECK (nervo BETWEEN 1 AND 10),
        fantasma            INT NOT NULL CHECK (fantasma BETWEEN 1 AND 10),
        hp_flipside_atual   INT NOT NULL,
        hp_flipside_maximo  INT NOT NULL,
        status_corpo_humano JSONB NOT NULL DEFAULT '{"cabeca": "saudavel", "tronco": "saudavel", "braco_esq": "saudavel", "braco_dir": "saudavel", "perna_esq": "saudavel", "perna_dir": "saudavel"}',
        nivel               INT NOT NULL DEFAULT 1,
        xp                  INT NOT NULL DEFAULT 0
      );
    `);

    // Tabela de itens com FK para personagens
    // dimensao_permitida controla em qual dimensao o item pode ser usado
    // personagem_id nulo = item esta "no chao" (sem dono)
    await client.query(`
      CREATE TABLE itens (
        id                  SERIAL PRIMARY KEY,
        nome                VARCHAR(150) NOT NULL,
        peso                NUMERIC(6,2) NOT NULL,
        dimensao_permitida  VARCHAR(10) NOT NULL CHECK (dimensao_permitida IN ('Humano', 'Flipside', 'Ambos')),
        personagem_id       INT REFERENCES personagens(id) ON DELETE SET NULL
      );
    `);

    // =============================================
    // DML - Seed dos personagens iniciais
    // =============================================
    // Regra: cada personagem tem exatamente 25 pontos distribuidos
    // entre os 6 atributos S.P.R.I.N.G. (min 1, max 10 cada)
    //
    // Jogador 1: equilibrado          (5+4+4+4+4+4 = 25)
    // Jogador 2: forte e resistente   (7+3+4+2+6+3 = 25)
    // Jogador 3: agil e perceptivo    (3+6+6+4+3+3 = 25)
    // Jogador 4: mistico/fantasma     (2+4+3+5+3+8 = 25)

    await client.query(`
      INSERT INTO personagens (nome, forca, percepcao, reflexos, inteligencia, nervo, fantasma, hp_flipside_atual, hp_flipside_maximo)
      VALUES
        ('Jogador 1', 5, 4, 4, 4, 4, 4, 50, 50),
        ('Jogador 2', 7, 3, 4, 2, 6, 3, 50, 50),
        ('Jogador 3', 3, 6, 6, 4, 3, 3, 50, 50),
        ('Jogador 4', 2, 4, 3, 5, 3, 8, 50, 50);
    `);

    await client.query('COMMIT');
    console.log('Banco de dados configurado com sucesso!');
    console.log('Tabelas criadas: personagens, itens');
    console.log('Seed: 4 jogadores inseridos (Jogador 1 a 4)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao configurar o banco:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

setup();
