import "dotenv/config";
import express from "express";
import path from "path";
import { Pool } from "pg";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Database configuration using DATABASE_URL from Render
const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

async function connectDatabase() {
  if (!DATABASE_URL) {
    console.error("[Database] DATABASE_URL environment variable is not set!");
    console.error("[Database] Please set DATABASE_URL in your Render environment variables.");
    process.exit(1);
  }

  try {
    console.log("[Database] Attempting to connect to PostgreSQL...");
    
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await pool.query('SELECT NOW()');
    console.log("[Database] Successfully connected to PostgreSQL on Render!");
  } catch (err: any) {
    console.error(`[Database] PostgreSQL connection failed: ${err.message}`);
    process.exit(1);
  }
}

// Password Hashing helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (!stored.includes(":")) {
    return password === stored;
  }
  const [salt, hash] = stored.split(":");
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === checkHash;
}

// Activity Logging helper
async function logActivity(usuario_id: number | null, usuario_nome: string, acao: string, detalhes: string, ip: string = "localhost") {
  try {
    await run(`
      INSERT INTO auditoria_logs (usuario_id, usuario_nome, acao, detalhes, data_hora, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [usuario_id, usuario_nome, acao, detalhes, new Date().toISOString(), ip]);
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}

// Promisified Query Helpers for PostgreSQL
async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (!pool) throw new Error("Database not connected");
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

async function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  if (!pool) throw new Error("Database not connected");
  const result = await pool.query(sql, params);
  return {
    lastID: (result as any).rows?.[0]?.id || 0,
    changes: (result as any).rowCount || 0
  };
}

async function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (!pool) throw new Error("Database not connected");
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] as T : undefined;
}

// Database Initialization and Seeding
async function initializeDatabase() {
  try {
    console.log("[Database] Constructing PostgreSQL Schema...");

    await run(`
      CREATE TABLE IF NOT EXISTS precos_provincias (
        provincia VARCHAR(100) PRIMARY KEY,
        diesel DOUBLE PRECISION NOT NULL,
        gasolina DOUBLE PRECISION NOT NULL,
        gas DOUBLE PRECISION NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(50) NOT NULL,
        carta_conducao VARCHAR(100),
        validade_carta VARCHAR(50),
        ativo INT NOT NULL DEFAULT 1,
        categoria_carta VARCHAR(50),
        bi VARCHAR(50) NOT NULL,
        nuit VARCHAR(50) NOT NULL,
        observacoes TEXT,
        score INT NOT NULL DEFAULT 100,
        cargo VARCHAR(100) NOT NULL DEFAULT 'Motorista',
        salario_base DOUBLE PRECISION NOT NULL DEFAULT 15000,
        data_admissao VARCHAR(50),
        usuario_id INT,
        empresa_nome VARCHAR(255) DEFAULT 'RHINO CARGO, LIMITADA',
        empresa_nuit VARCHAR(50) DEFAULT '400582914',
        empresa_localizacao VARCHAR(500) DEFAULT 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique'
      )
    `);

    await run("DROP VIEW IF EXISTS motoristas");
    await run(`
      CREATE VIEW motoristas AS 
      SELECT id, nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score 
      FROM funcionarios 
      WHERE cargo = 'Motorista' OR cargo = 'motorista'
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS bombas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        endereco VARCHAR(500) NOT NULL,
        contacto VARCHAR(100) NOT NULL,
        provincia VARCHAR(100) NOT NULL,
        ativo INT NOT NULL DEFAULT 1,
        preco_diesel DOUBLE PRECISION,
        preco_gasolina DOUBLE PRECISION,
        preco_gas DOUBLE PRECISION
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS viaturas (
        id SERIAL PRIMARY KEY,
        matricula VARCHAR(50) UNIQUE NOT NULL,
        marca VARCHAR(100) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        ano INT NOT NULL,
        kilometragem DOUBLE PRECISION NOT NULL,
        km_atual DOUBLE PRECISION NOT NULL,
        capacidade DOUBLE PRECISION NOT NULL,
        combustivel VARCHAR(50) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        observacoes TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS viagens (
        id SERIAL PRIMARY KEY,
        numero_viagem VARCHAR(100) UNIQUE NOT NULL,
        data_partida VARCHAR(50) NOT NULL,
        data_chegada VARCHAR(50),
        viatura_id INT NOT NULL,
        motorista_id INT NOT NULL,
        bomba_id INT,
        litros_bomba DOUBLE PRECISION NOT NULL,
        litros_sistema DOUBLE PRECISION NOT NULL,
        diferenca_litros DOUBLE PRECISION NOT NULL,
        total_combustivel_mzn DOUBLE PRECISION NOT NULL,
        cliente VARCHAR(255) NOT NULL,
        produto VARCHAR(255) NOT NULL,
        origem VARCHAR(255) NOT NULL,
        destino VARCHAR(255) NOT NULL,
        p_o VARCHAR(255),
        origem_combustivel VARCHAR(255),
        combustivel_gasto_mzn DOUBLE PRECISION NOT NULL,
        expediente VARCHAR(255),
        reforcos TEXT,
        intermediacao_mzn DOUBLE PRECISION NOT NULL,
        escolta_mzn DOUBLE PRECISION NOT NULL,
        quebras_faltas_mzn DOUBLE PRECISION NOT NULL,
        faturacao_mzn DOUBLE PRECISION NOT NULL,
        total_remanescente_mzn DOUBLE PRECISION NOT NULL,
        estado VARCHAR(50) NOT NULL,
        observacoes TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS abastecimentos (
        id SERIAL PRIMARY KEY,
        viatura_id INT NOT NULL,
        viagem VARCHAR(100),
        cliente VARCHAR(255),
        data_abastecimento VARCHAR(50) NOT NULL,
        bomba_name VARCHAR(255) NOT NULL,
        provincia VARCHAR(100) NOT NULL,
        bomba_litros DOUBLE PRECISION NOT NULL,
        sistema_litros DOUBLE PRECISION NOT NULL,
        diferenca DOUBLE PRECISION NOT NULL,
        valor_combustivel DOUBLE PRECISION NOT NULL,
        valor_unitario DOUBLE PRECISION NOT NULL,
        observacoes TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS alertas (
        id VARCHAR(100) PRIMARY KEY,
        data_hora VARCHAR(50) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        resolvido INT NOT NULL DEFAULT 0,
        gravidade VARCHAR(50) NOT NULL,
        meta TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS despesas_gerais (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        valor DOUBLE PRECISION NOT NULL,
        data_despesa VARCHAR(50) NOT NULL,
        funcionario_id INT,
        viatura_id INT,
        estado VARCHAR(50) NOT NULL DEFAULT 'Pago',
        observacoes TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS pedidos_rh (
        id SERIAL PRIMARY KEY,
        funcionario_id INT NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        data_inicio VARCHAR(50) NOT NULL,
        data_fim VARCHAR(50) NOT NULL,
        dias INT NOT NULL,
        motivo TEXT,
        estado VARCHAR(50) NOT NULL DEFAULT 'Pendente',
        data_pedido VARCHAR(50) NOT NULL,
        observacoes TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS recibos_salarios (
        id SERIAL PRIMARY KEY,
        funcionario_id INT NOT NULL,
        mes_ano VARCHAR(50) NOT NULL,
        salario_base DOUBLE PRECISION NOT NULL,
        bonus DOUBLE PRECISION NOT NULL DEFAULT 0,
        descontos DOUBLE PRECISION NOT NULL DEFAULT 0,
        salario_liquido DOUBLE PRECISION NOT NULL,
        data_emissao VARCHAR(50) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'Pago',
        observacoes TEXT,
        faltas DOUBLE PRECISION NOT NULL DEFAULT 0,
        subsidios DOUBLE PRECISION NOT NULL DEFAULT 0,
        horas_extras DOUBLE PRECISION NOT NULL DEFAULT 0,
        inss DOUBLE PRECISION NOT NULL DEFAULT 0,
        irps DOUBLE PRECISION NOT NULL DEFAULT 0
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS auditoria_logs (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        usuario_nome VARCHAR(255) NOT NULL,
        acao VARCHAR(255) NOT NULL,
        detalhes TEXT NOT NULL,
        data_hora VARCHAR(50) NOT NULL,
        ip_address VARCHAR(100)
      )
    `);

    console.log("[Database] Database schema validated/created successfully.");

    // Seed data
    const provinceCountResult = await get<any>("SELECT COUNT(*) as count FROM precos_provincias");
    if (Number(provinceCountResult?.count || 0) === 0) {
      console.log("[Database] Seeding initial province prices...");
      const provinces = [
        ["Cabo Delgado", 93.1, 87.8, 92.5],
        ["Gaza", 92.1, 86.8, 91.2],
        ["Inhambane", 92.4, 87.1, 91.5],
        ["Manica", 92.3, 87.0, 91.3],
        ["Maputo", 91.5, 86.25, 90.0],
        ["Maputo Cidade", 91.5, 86.25, 90.0],
        ["Maputo Província", 91.5, 86.25, 90.0],
        ["Nampula", 92.6, 87.3, 91.8],
        ["Niassa", 93.5, 88.2, 93.0],
        ["Sofala", 91.9, 86.6, 90.8],
        ["Tete", 92.8, 87.5, 92.0],
        ["Zambézia", 92.5, 87.2, 91.7]
      ];
      for (const p of provinces) {
        await run("INSERT INTO precos_provincias (provincia, diesel, gasolina, gas) VALUES ($1, $2, $3, $4)", p);
      }
    }

    const userCountResult = await get<any>("SELECT COUNT(*) as count FROM usuarios");
    if (Number(userCountResult?.count || 0) === 0) {
      console.log("[Database] Seeding administrative users...");
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (1, 'walter', $1, 'Walter Juvencio Chauchau', 'admin')", [hashPassword("walter.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (2, 'salvador', $1, 'Salvador Matlombe', 'admin')", [hashPassword("salvador.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (3, 'clara', $1, 'Clara Tolvela', 'administracao')", [hashPassword("clara.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (4, 'nilda', $1, 'Nilda Magumane', 'rh')", [hashPassword("nilda.123")]);
    }

    const funcCountResult = await get<any>("SELECT COUNT(*) as count FROM funcionarios");
    if (Number(funcCountResult?.count || 0) === 0) {
      console.log("[Database] Seeding initial staff & official drivers...");
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
        VALUES (10, 'Walter Juvencio Chauchau', 'walterjuvencio8@gmail.com', '+258 86 184 3153', 1, '543234567', '98767890', 'IT Admin & Administrador do Sistema', 100, 'IT Admin', 35000, '2024-01-15', 1)
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
        VALUES (11, 'Salvador Matlombe', 'salvador@gmail.com', '+258 84 000 0001', 1, '111122223', '900100200', 'Diretor Geral Executivo', 100, 'Diretor Geral', 65000, '2023-05-10', 2)
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
        VALUES (12, 'Clara Tolvela', 'clara@gmail.com', '+258 84 321 4567', 1, '432156789', '987654321', 'Coordenadora Geral de Frotas e Administração', 100, 'Administração', 28000, '2024-03-01', 3)
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
        VALUES (13, 'Nilda Magumane', 'nilda@gmail.com', '+258 82 555 1234', 1, '1234567890', '555444333', 'Diretora de Recursos Humanos', 100, 'Recursos Humanos', 25000, '2024-02-10', 4)
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, carta_conducao, validade_carta, categoria_carta)
        VALUES (14, 'Hélio Salomão Machava', 'helio.machava@rhinocargo.co.mz', '+258 84 100 2001', 1, '110143498V', '110143498', 'Motorista de Rota Nacional (Carta Temporária)', 100, 'Motorista', 18500, '2024-04-10', '110143498V', '2028-12-31', 'CE')
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, carta_conducao, validade_carta, categoria_carta)
        VALUES (15, 'Hermínio Américo Langa', 'herminio.langa@rhinocargo.co.mz', '+258 84 100 2002', 1, '100042534D', '100042534', 'Motorista de Rota Nacional (Carta Temporária)', 100, 'Motorista', 18500, '2024-04-15', '10008656', '2028-12-31', 'CE')
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, carta_conducao, validade_carta, categoria_carta)
        VALUES (16, 'Hassamo Issufo Remane', 'hassamo.remane@rhinocargo.co.mz', '+258 84 100 2003', 1, '110025774F', '110025774', 'Motorista de Longo Curso (SADC)', 100, 'Motorista', 19000, '2024-02-20', '10055564/8', '2030-05-22', 'CE')
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, carta_conducao, validade_carta, categoria_carta)
        VALUES (17, 'Lucas Elias Guambe', 'lucas.guambe@rhinocargo.co.mz', '+258 84 100 2004', 1, '110502384463I', '110502384', 'Motorista de Longo Curso (SADC)', 100, 'Motorista', 18500, '2024-03-05', '1949/6', '2029-05-19', 'CE')
      `);
      await run(`
        INSERT INTO funcionarios (id, nome, email, telefone, ativo, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, carta_conducao, validade_carta, categoria_carta)
        VALUES (18, 'Abdul Carimo N Giva', 'abdul.giva@rhinocargo.co.mz', '+258 84 100 2005', 1, '100016983B', '100016983', 'Motorista de Longo Curso (SADC)', 100, 'Motorista', 19500, '2024-01-10', '10109521/9', '2030-01-24', 'CE')
      `);
    }

    const bombaCountResult = await get<any>("SELECT COUNT(*) as count FROM bombas");
    if (Number(bombaCountResult?.count || 0) === 0) {
      console.log("[Database] Seeding official gas stations...");
      const pumps = [
        [1, "Bomba Petromoc - Av. 24 de Julho", "Av. 24 de Julho, Maputo Cidade", "+258 84 123 4567", "Maputo Cidade", 1, 116.25, 93.69, 90.0],
        [2, "Bomba TotalEnergies - Matchiki-Tchiki", "Estrada Nacional N4, Matchiki-Tchiki", "+258 82 987 6543", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [3, "Bomba Engen - Beira Port", "Zona Portuária, Beira", "+258 84 321 0987", "Sofala", 1, 116.25, 93.69, 90.8],
        [4, "Bomba Galp - Nampula Centro", "Av. Eduardo Mondlane, Nampula", "+258 85 555 4321", "Nampula", 1, 116.25, 93.69, 91.8],
        [5, "Bomba Petromoc - Tete Centro", "Av. da Independência, Tete", "+258 86 444 8888", "Tete", 1, 121.64, 99.08, 92.0],
        [6, "Bomba TotalEnergies - Chokwé", "Av. Principal, Chokwé", "+258 87 333 1111", "Gaza", 1, 116.25, 93.69, 91.2],
        [7, "Bomba Engen - Maxixe Centro", "EN1, Maxixe", "+258 84 222 9999", "Inhambane", 1, 116.25, 93.69, 91.5],
        [8, "Som Petroleum - Maputo Cidade", "Av. de Angola, Maputo", "+258 84 100 1101", "Maputo Cidade", 1, 116.25, 93.69, 90.0],
        [9, "Capital Oil - Maputo Cidade", "Av. das Indústrias, Maputo", "+258 84 100 1102", "Maputo Cidade", 1, 116.25, 93.69, 90.0],
        [10, "Som Petroleum - Matola", "Av. União Moçambicana, Matola", "+258 84 100 1103", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [11, "Capital Oil - Matola", "Estrada Nacional N4, Matola", "+258 84 100 1104", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [12, "Som Petroleum - Beira", "Porto da Beira, Beira", "+258 84 100 1105", "Sofala", 1, 116.25, 93.69, 90.8],
        [13, "Capital Oil - Beira", "Av. das Forças Armadas, Beira", "+258 84 100 1106", "Sofala", 1, 116.25, 93.69, 90.8],
        [14, "Som Petroleum - Nacala", "Zona Comercial Portuária, Nacala", "+258 84 100 1107", "Nampula", 1, 116.25, 93.69, 91.8],
        [15, "Capital Oil - Nacala", "Av. Principal do Porto, Nacala", "+258 84 100 1108", "Nampula", 1, 116.25, 93.69, 91.8],
        [16, "Som Petroleum - Pemba", "Av. Marginal, Pemba", "+258 84 100 1109", "Cabo Delgado", 1, 116.25, 93.69, 92.5],
        [17, "Capital Oil - Pemba", "Bairro Natite, Pemba", "+258 84 100 1110", "Cabo Delgado", 1, 116.25, 93.69, 92.5],
        [18, "Som Petroleum - Lichinga", "Av. do Trabalho, Lichinga", "+258 84 100 1111", "Niassa", 1, 123.27, 100.71, 93.0],
        [19, "Capital Oil - Lichinga", "Av. de Moçambique, Lichinga", "+258 84 100 1112", "Niassa", 1, 123.27, 100.71, 93.0],
        [20, "Som Petroleum - Tete", "Av. 25 de Junho, Tete", "+258 84 100 1113", "Tete", 1, 121.64, 99.08, 92.0],
        [21, "Capital Oil - Tete", "Estrada Nacional EN103, Tete", "+258 84 100 1114", "Tete", 1, 121.64, 99.08, 92.0],
        [22, "Som Petroleum - Quelimane", "Av. Julius Nyerere, Quelimane", "+258 84 100 1115", "Zambézia", 1, 120.70, 98.14, 91.7],
        [23, "Capital Oil - Quelimane", "Av. Marginal de Quelimane, Quelimane", "+258 84 100 1116", "Zambézia", 1, 120.70, 98.14, 91.7],
        [24, "Som Petroleum - Mueda", "Estrada de Mueda, Mueda", "+258 84 100 1117", "Cabo Delgado", 1, 131.85, 0.0, 92.5],
        [25, "Capital Oil - Palma", "Zona de Desenvolvimento, Palma", "+258 84 100 1118", "Cabo Delgado", 1, 131.85, 0.0, 92.5],
        [26, "Som Petroleum - Mecula", "Estrada Principal EN14, Mecula", "+258 84 100 1119", "Niassa", 1, 126.27, 0.0, 93.0],
        [27, "Capital Oil - Mecula", "Centro Comercial Mecula, Mecula", "+258 84 100 1120", "Niassa", 1, 126.27, 0.0, 93.0],
        [28, "Som Petroleum - Zumbo", "Bairro Fluvial, Zumbo", "+258 84 100 1121", "Tete", 1, 0.0, 101.67, 92.0],
        [29, "Capital Oil - Zumbo", "Estrada de Acesso Zumbo, Zumbo", "+258 84 100 1122", "Tete", 1, 0.0, 101.67, 92.0],
        [30, "Som Petroleum - Machava", "Cruzamento da Machava, Matola", "+258 84 100 1123", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [31, "Capital Oil - Machava", "Av. das Indústrias, Machava, Matola", "+258 84 100 1124", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [32, "Som Petroleum - Marracuene", "Estrada Nacional EN1, Marracuene", "+258 84 100 1125", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [33, "Capital Oil - Marracuene", "EN1 Km 30, Marracuene", "+258 84 100 1126", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [34, "Som Petroleum - Inhope", "Bairro de Inhope, Estrada EN1, Inhambane", "+258 84 100 1127", "Inhambane", 1, 116.25, 93.69, 91.5],
        [35, "Capital Oil - Inhope", "Cruzamento de Inhope, Estrada EN1, Inhambane", "+258 84 100 1128", "Inhambane", 1, 116.25, 93.69, 91.5],
        [36, "Som Petroleum - Nampula Centro", "Av. das FPLM, Nampula", "+258 84 100 1129", "Nampula", 1, 116.25, 93.69, 91.8],
        [37, "Capital Oil - Nampula", "Rota Principal Nacala-Nampula, Nampula", "+258 84 100 1130", "Nampula", 1, 116.25, 93.69, 91.8]
      ];
      for (const p of pumps) {
        await run("INSERT INTO bombas (id, nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", p);
      }
    }

    // Hash passwords
    const allUsers = await query<any>("SELECT id, senha, nome FROM usuarios");
    for (const u of allUsers) {
      if (u.senha && !u.senha.includes(":")) {
        const hashed = hashPassword(u.senha);
        await run("UPDATE usuarios SET senha = $1 WHERE id = $2", [hashed, u.id]);
        console.log(`[Security] Hashed plain-text password for user "${u.nome}".`);
      }
    }

    console.log("[Database] Database successfully initialized and seeded.");
  } catch (error) {
    console.error("[Database] Database initialization failed:", error);
  }
}

// Kick off Database setup
(async () => {
  await connectDatabase();
  await initializeDatabase();
})();

// ---------------- REST API ROUTES (COMPLETE WITH ::text FIX) ----------------

app.post("/api/auth/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ success: false, message: "Email ou Usuário e senha são obrigatórios." });
  }
  try {
    const user = await get<any>(
      "SELECT id, email, nome, role, senha FROM usuarios WHERE email = $1::text OR nome = $1::text", 
      [String(email)]
    );
    if (user && verifyPassword(senha, user.senha)) {
      const emp = await get<any>(
        "SELECT id, cargo, score FROM funcionarios WHERE usuario_id = $1", 
        [user.id]
      );
      delete user.senha;
      const enrichedUser = {
        ...user,
        funcionario_id: emp ? emp.id : null,
        cargo: emp ? emp.cargo : null,
        score: emp ? emp.score : 100
      };
      await logActivity(user.id, user.nome, "Autenticação", "Sessão iniciada no sistema com sucesso.");
      res.json({ success: true, user: enrichedUser });
    } else {
      await logActivity(null, "Convidado", "Falha de Autenticação", `Tentativa fracassada de login para o usuário: ${email}`);
      res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }
  } catch (error: any) {
    console.error("[Login Error]", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Province Prices
app.get("/api/precos_provincias", async (req, res) => {
  try {
    const prices = await query("SELECT * FROM precos_provincias ORDER BY provincia ASC");
    res.json(prices);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/precos_provincias/:provincia", async (req, res) => {
  const { provincia } = req.params;
  const { diesel, gasolina, gas } = req.body;
  try {
    await run(
      "UPDATE precos_provincias SET diesel = $1, gasolina = $2, gas = $3 WHERE provincia = $4::text",
      [diesel, gasolina, gas, provincia]
    );
    res.json({ success: true, message: "Preços atualizados com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Viaturas (Fleet)
app.get("/api/viaturas", async (req, res) => {
  try {
    const list = await query("SELECT * FROM viaturas ORDER BY matricula ASC");
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/viaturas", async (req, res) => {
  const { matricula, marca, modelo, tipo, ano, kilometragem, km_atual, capacidade, combustivel, estado, observacoes } = req.body;
  try {
    await run(
      `INSERT INTO viaturas (matricula, marca, modelo, tipo, ano, kilometragem, km_atual, capacidade, combustivel, estado, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [matricula, marca, modelo, tipo, ano, kilometragem || 0, km_atual || 0, capacidade, combustivel, estado || "Disponível", observacoes]
    );
    res.json({ success: true, message: "Viatura registada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/viaturas/:id", async (req, res) => {
  const { id } = req.params;
  const { matricula, marca, modelo, tipo, ano, kilometragem, km_atual, capacidade, combustivel, estado, observacoes } = req.body;
  try {
    await run(
      `UPDATE viaturas SET matricula = $1, marca = $2, modelo = $3, tipo = $4, ano = $5, kilometragem = $6, km_atual = $7, capacidade = $8, combustivel = $9, estado = $10, observacoes = $11 WHERE id = $12`,
      [matricula, marca, modelo, tipo, ano, kilometragem, km_atual, capacidade, combustivel, estado, observacoes, id]
    );
    res.json({ success: true, message: "Viatura atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/viaturas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM viaturas WHERE id = $1", [id]);
    res.json({ success: true, message: "Viatura removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Motoristas
app.get("/api/motoristas", async (req, res) => {
  try {
    const list = await query("SELECT * FROM funcionarios WHERE cargo = 'Motorista' OR cargo = 'motorista' ORDER BY nome ASC");
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/motoristas", async (req, res) => {
  const { nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score } = req.body;
  try {
    const username = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const password = `${username}.123`;
    const hashedPassword = hashPassword(password);

    const userResult = await run(`
      INSERT INTO usuarios (email, senha, nome, role)
      VALUES ($1, $2, $3, 'funcionario')
    `, [username, hashedPassword, nome]);

    await run(
      `INSERT INTO funcionarios (nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Motorista', 18500, $12, $13)`,
      [
        nome, email, telefone, carta_conducao, validade_carta, 
        ativo !== undefined ? ativo : 1, categoria_carta, bi, nuit, observacoes, 
        score !== undefined ? score : 100, 
        new Date().toISOString().split("T")[0],
        userResult.lastID
      ]
    );

    await logActivity(null, "Recursos Humanos", "Registo de Motorista", `Motorista "${nome}" registado com usuário de login "${username}".`);

    res.json({ 
      success: true, 
      message: `Motorista registado com sucesso! Credenciais geradas - Usuário: ${username} | Senha: ${password}` 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/motoristas/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score } = req.body;
  try {
    const existing = await get<any>("SELECT usuario_id FROM funcionarios WHERE id = $1", [id]);
    if (existing && existing.usuario_id) {
      await run("UPDATE usuarios SET nome = $1 WHERE id = $2", [nome, existing.usuario_id]);
    }

    await run(
      `UPDATE funcionarios SET nome = $1, email = $2, telefone = $3, carta_conducao = $4, validade_carta = $5, ativo = $6, categoria_carta = $7, bi = $8, nuit = $9, observacoes = $10, score = $11 WHERE id = $12`,
      [nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, id]
    );

    await logActivity(null, "Recursos Humanos", "Edição de Motorista", `Motorista ID ${id} (${nome}) atualizado.`);

    res.json({ success: true, message: "Motorista atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/motoristas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await get<any>("SELECT nome, usuario_id FROM funcionarios WHERE id = $1", [id]);
    if (existing && existing.usuario_id) {
      await run("DELETE FROM usuarios WHERE id = $1", [existing.usuario_id]);
    }
    await run("DELETE FROM funcionarios WHERE id = $1", [id]);

    const mName = existing ? existing.nome : `ID ${id}`;
    await logActivity(null, "Administrador/RH", "Exclusão de Motorista", `Motorista "${mName}" removido permanentemente.`);

    res.json({ success: true, message: "Motorista removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Bombas
app.get("/api/bombas", async (req, res) => {
  try {
    const list = await query("SELECT * FROM bombas ORDER BY nome ASC");
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/bombas", async (req, res) => {
  const { nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas } = req.body;
  try {
    await run(
      `INSERT INTO bombas (nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nome, endereco, contacto, provincia, ativo !== undefined ? ativo : 1, preco_diesel, preco_gasolina, preco_gas]
    );
    res.json({ success: true, message: "Bomba de abastecimento registada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/bombas/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas } = req.body;
  try {
    await run(
      `UPDATE bombas SET nome = $1, endereco = $2, contacto = $3, provincia = $4, ativo = $5, preco_diesel = $6, preco_gasolina = $7, preco_gas = $8 WHERE id = $9`,
      [nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas, id]
    );
    res.json({ success: true, message: "Bomba de abastecimento atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/bombas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM bombas WHERE id = $1", [id]);
    res.json({ success: true, message: "Bomba removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Abastecimentos
app.get("/api/abastecimentos", async (req, res) => {
  try {
    const list = await query(`
      SELECT a.*, v.matricula AS viatura_matricula
      FROM abastecimentos a
      LEFT JOIN viaturas v ON a.viatura_id = v.id
      ORDER BY a.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Alertas
app.get("/api/alertas", async (req, res) => {
  try {
    const list = await query("SELECT * FROM alertas ORDER BY data_hora DESC");
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/alertas/:id/resolver", async (req, res) => {
  const { id } = req.params;
  try {
    await run("UPDATE alertas SET resolvido = 1 WHERE id = $1::text", [id]);
    res.json({ success: true, message: "Alerta resolvido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Viagens
app.get("/api/viagens", async (req, res) => {
  try {
    const list = await query(`
      SELECT v.*, 
             vt.matricula AS viatura_matricula, vt.marca AS viatura_marca, vt.modelo AS viatura_modelo, vt.combustivel AS viatura_combustivel,
             m.nome AS motorista_nome, m.telefone AS motorista_telefone, m.email AS motorista_email,
             b.nome AS bomba_nome, b.provincia AS bomba_provincia
      FROM viagens v
      LEFT JOIN viaturas vt ON v.viatura_id = vt.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN bombas b ON v.bomba_id = b.id
      ORDER BY v.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/viagens", async (req, res) => {
  const {
    numero_viagem,
    data_partida,
    viatura_id,
    motorista_id,
    bomba_id,
    litros_bomba,
    litros_sistema,
    cliente,
    produto,
    origem,
    destino,
    observacoes
  } = req.body;

  try {
    const viatura = await get<any>("SELECT * FROM viaturas WHERE id = $1", [viatura_id]);
    if (!viatura) {
      return res.status(404).json({ success: false, message: "Viatura não encontrada." });
    }

    const bomba = await get<any>("SELECT * FROM bombas WHERE id = $1", [bomba_id]);
    if (!bomba) {
      return res.status(404).json({ success: false, message: "Bomba não encontrada." });
    }

    let valor_unitario = 91.5;
    const fuelType = viatura.combustivel.toLowerCase();

    if (fuelType.includes("diesel")) {
      valor_unitario = bomba.preco_diesel || 0;
    } else if (fuelType.includes("gasolina")) {
      valor_unitario = bomba.preco_gasolina || 0;
    } else if (fuelType.includes("gas")) {
      valor_unitario = bomba.preco_gas || 0;
    }

    if (valor_unitario === 0) {
      const provPrice = await get<any>("SELECT * FROM precos_provincias WHERE provincia = $1::text", [bomba.provincia]);
      if (provPrice) {
        if (fuelType.includes("diesel")) valor_unitario = provPrice.diesel;
        else if (fuelType.includes("gasolina")) valor_unitario = provPrice.gasolina;
        else if (fuelType.includes("gas")) valor_unitario = provPrice.gas;
      }
    }

    const total_combustivel_mzn = litros_bomba * valor_unitario;
    const diferenca_litros = litros_bomba - litros_sistema;

    const result = await run(
      `INSERT INTO viagens (
        numero_viagem, data_partida, data_chegada, viatura_id, motorista_id, bomba_id,
        litros_bomba, litros_sistema, diferenca_litros, total_combustivel_mzn,
        cliente, produto, origem, destino, p_o, origem_combustivel,
        combustivel_gasto_mzn, expediente, reforcos,
        intermediacao_mzn, escolta_mzn, quebras_faltas_mzn, faturacao_mzn, total_remanescente_mzn,
        estado, observacoes
      ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL, NULL, $14, NULL, NULL, 0, 0, 0, 0, 0, $15, $16)`,
      [
        numero_viagem,
        data_partida,
        viatura_id,
        motorista_id,
        bomba_id,
        litros_bomba,
        litros_sistema,
        diferenca_litros,
        total_combustivel_mzn,
        cliente,
        produto,
        origem,
        destino,
        total_combustivel_mzn,
        "em_curso",
        observacoes
      ]
    );

    await run(
      `INSERT INTO abastecimentos (
        viatura_id, viagem, cliente, data_abastecimento, bomba_name, provincia,
        bomba_litros, sistema_litros, diferenca, valor_combustivel, valor_unitario, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        viatura_id,
        numero_viagem,
        cliente,
        data_partida,
        bomba.nome,
        bomba.provincia,
        litros_bomba,
        litros_sistema,
        diferenca_litros,
        total_combustivel_mzn,
        valor_unitario,
        observacoes || `Abastecimento inicial automático efetuado na bomba "${bomba.nome}" para início de viagem.`
      ]
    );

    await run("UPDATE viaturas SET estado = 'Em Viagem' WHERE id = $1", [viatura_id]);

    const percentDev = litros_sistema > 0 ? (Math.abs(diferenca_litros) / litros_sistema) * 100 : 0;
    if (Math.abs(diferenca_litros) >= 5 || percentDev >= 3) {
      const alertId = `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const severity = Math.abs(diferenca_litros) >= 20 ? "alta" : "media";
      await run(
        `INSERT INTO alertas (id, data_hora, tipo, titulo, mensagem, resolvido, gravidade, meta)
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
         [
           alertId,
           new Date().toISOString(),
           "desvio_combustivel",
           "Desvio de Combustível Detetado",
           `A viatura ${viatura.matricula} registou desvio significativo de ${diferenca_litros.toFixed(1)}L na viagem ${numero_viagem} (Bomba: ${litros_bomba}L vs Sistema: ${litros_sistema}L). Desvio de ${percentDev.toFixed(1)}%.`,
           severity,
           JSON.stringify({ numero_viagem, viatura_id, diferenca_litros, litros_bomba, litros_sistema })
         ]
      );

      await run("UPDATE motoristas SET score = MAX(0, score - 5) WHERE id = $1", [motorista_id]);
    }

    res.json({ success: true, message: "Viagem iniciada com sucesso.", tripId: result.lastID });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/viagens/:id", async (req, res) => {
  const { id } = req.params;
  const {
    estado,
    data_chegada,
    km_chegada,
    intermediacao_mzn,
    escolta_mzn,
    quebras_faltas_mzn,
    faturacao_mzn,
    observacoes,
    expediente,
    reforcos,
    p_o,
    origem_combustivel
  } = req.body;

  try {
    const trip = await get<any>("SELECT * FROM viagens WHERE id = $1", [id]);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Viagem não encontrada." });
    }

    const combustivel_gasto_mzn = trip.total_combustivel_mzn;
    const intermediacao = Number(intermediacao_mzn || 0);
    const escolta = Number(escolta_mzn || 0);
    const quebras = Number(quebras_faltas_mzn || 0);
    const faturacao = Number(faturacao_mzn || 0);
    const total_remanescente_mzn = faturacao - (combustivel_gasto_mzn + intermediacao + escolta + quebras);

    await run(
      `UPDATE viagens SET
        estado = $1,
        data_chegada = $2,
        intermediacao_mzn = $3,
        escolta_mzn = $4,
        quebras_faltas_mzn = $5,
        faturacao_mzn = $6,
        total_remanescente_mzn = $7,
        observacoes = $8,
        expediente = $9,
        reforcos = $10,
        p_o = $11,
        origem_combustivel = $12
       WHERE id = $13`,
      [
        estado,
        data_chegada,
        intermediacao,
        escolta,
        quebras,
        faturacao,
        total_remanescente_mzn,
        observacoes,
        expediente,
        reforcos,
        p_o,
        origem_combustivel,
        id
      ]
    );

    if (estado === "concluida") {
      await run("UPDATE viaturas SET estado = 'Disponível' WHERE id = $1", [trip.viatura_id]);
      if (km_chegada) {
        await run("UPDATE viaturas SET km_atual = $1 WHERE id = $2", [km_chegada, trip.viatura_id]);
      }
    }

    res.json({ success: true, message: "Viagem atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Funcionários (Employees) - COMPLETE CRUD
app.get("/api/funcionarios", async (req, res) => {
  try {
    const list = await query("SELECT * FROM funcionarios ORDER BY nome ASC");
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/funcionarios", async (req, res) => {
  const { 
    nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, 
    bi, nuit, observacoes, score, cargo, salario_base, data_admissao,
    empresa_nome, empresa_nuit, empresa_localizacao 
  } = req.body;
  try {
    const username = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const password = `${username}.123`;
    const hashedPassword = hashPassword(password);

    let userRole = "funcionario";
    const cargoLower = (cargo || "").toLowerCase();
    if (cargoLower.includes("it") || cargoLower.includes("admin")) {
      userRole = "admin";
    } else if (cargoLower.includes("recursos") || cargoLower.includes("rh")) {
      userRole = "rh";
    } else if (cargoLower.includes("administra")) {
      userRole = "administracao";
    }

    const userResult = await run(`
      INSERT INTO usuarios (email, senha, nome, role)
      VALUES ($1, $2, $3, $4)
    `, [username, hashedPassword, nome, userRole]);

    await run(`
      INSERT INTO funcionarios (
        nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, 
        bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id,
        empresa_nome, empresa_nuit, empresa_localizacao
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      nome, email, telefone,
      carta_conducao || null, validade_carta || null,
      ativo !== undefined ? ativo : 1,
      categoria_carta || null, bi, nuit, observacoes,
      score !== undefined ? score : 100,
      cargo || 'Outro', Number(salario_base || 15000),
      data_admissao || new Date().toISOString().split("T")[0],
      userResult.lastID,
      empresa_nome || 'RHINO CARGO, LIMITADA',
      empresa_nuit || '400582914',
      empresa_localizacao || 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique'
    ]);

    await logActivity(null, "Recursos Humanos", "Registo de Funcionário", `Funcionário "${nome}" (${cargo}) registado com usuário "${username}".`);

    res.json({
      success: true,
      message: `Funcionário registado com sucesso! Credenciais geradas - Usuário: ${username} | Senha: ${password}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/funcionarios/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, 
    bi, nuit, observacoes, score, cargo, salario_base, data_admissao,
    empresa_nome, empresa_nuit, empresa_localizacao 
  } = req.body;
  try {
    const existing = await get<any>("SELECT * FROM funcionarios WHERE id = $1", [id]);
    if (existing && existing.usuario_id) {
      let userRole = "funcionario";
      const cargoLower = (cargo || "").toLowerCase();
      if (cargoLower.includes("it") || cargoLower.includes("admin")) {
        userRole = "admin";
      } else if (cargoLower.includes("recursos") || cargoLower.includes("rh")) {
        userRole = "rh";
      } else if (cargoLower.includes("administra")) {
        userRole = "administracao";
      }

      await run("UPDATE usuarios SET nome = $1, role = $2 WHERE id = $3", [nome, userRole, existing.usuario_id]);
    }

    await run(`
      UPDATE funcionarios
      SET nome = $1, email = $2, telefone = $3, carta_conducao = $4, validade_carta = $5, ativo = $6, categoria_carta = $7, bi = $8, nuit = $9, observacoes = $10, score = $11, cargo = $12, salario_base = $13, data_admissao = $14,
          empresa_nome = $15, empresa_nuit = $16, empresa_localizacao = $17
      WHERE id = $18
    `, [
      nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, cargo, Number(salario_base), data_admissao,
      empresa_nome || 'RHINO CARGO, LIMITADA',
      empresa_nuit || '400582914',
      empresa_localizacao || 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique',
      id
    ]);

    await logActivity(null, "Recursos Humanos", "Edição de Funcionário", `Funcionário ID ${id} (${nome}) atualizado.`);

    res.json({ success: true, message: "Funcionário atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/funcionarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await get<any>("SELECT * FROM funcionarios WHERE id = $1", [id]);
    if (existing && existing.usuario_id) {
      await run("DELETE FROM usuarios WHERE id = $1", [existing.usuario_id]);
    }
    await run("DELETE FROM funcionarios WHERE id = $1", [id]);

    const fName = existing ? existing.nome : `ID ${id}`;
    await logActivity(null, "Administrador/RH", "Exclusão de Funcionário", `Funcionário "${fName}" removido permanentemente do sistema.`);

    res.json({ success: true, message: "Funcionário removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Despesas Gerais
app.get("/api/despesas_gerais", async (req, res) => {
  try {
    const list = await query(`
      SELECT dg.*, f.nome AS funcionario_nome, v.matricula AS viatura_matricula
      FROM despesas_gerais dg
      LEFT JOIN funcionarios f ON dg.funcionario_id = f.id
      LEFT JOIN viaturas v ON dg.viatura_id = v.id
      ORDER BY dg.data_despesa DESC, dg.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/despesas_gerais", async (req, res) => {
  const { descricao, categoria, valor, data_despesa, funcionario_id, viatura_id, estado, observacoes } = req.body;
  try {
    await run(`
      INSERT INTO despesas_gerais (descricao, categoria, valor, data_despesa, funcionario_id, viatura_id, estado, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [descricao, categoria, Number(valor), data_despesa, funcionario_id || null, viatura_id || null, estado || 'Pago', observacoes]);
    res.json({ success: true, message: "Despesa registada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/despesas_gerais/:id", async (req, res) => {
  const { id } = req.params;
  const { descricao, categoria, valor, data_despesa, funcionario_id, viatura_id, estado, observacoes } = req.body;
  try {
    await run(`
      UPDATE despesas_gerais
      SET descricao = $1, categoria = $2, valor = $3, data_despesa = $4, funcionario_id = $5, viatura_id = $6, estado = $7, observacoes = $8
      WHERE id = $9
    `, [descricao, categoria, Number(valor), data_despesa, funcionario_id || null, viatura_id || null, estado, observacoes, id]);
    res.json({ success: true, message: "Despesa atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/despesas_gerais/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM despesas_gerais WHERE id = $1", [id]);
    res.json({ success: true, message: "Despesa removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. HR Requests
app.get("/api/pedidos_rh", async (req, res) => {
  try {
    const list = await query(`
      SELECT p.*, f.nome AS funcionario_nome, f.cargo AS funcionario_cargo
      FROM pedidos_rh p
      LEFT JOIN funcionarios f ON p.funcionario_id = f.id
      ORDER BY p.data_pedido DESC, p.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/pedidos_rh", async (req, res) => {
  const { funcionario_id, tipo, data_inicio, data_fim, dias, motivo, estado, observacoes } = req.body;
  try {
    await run(`
      INSERT INTO pedidos_rh (funcionario_id, tipo, data_inicio, data_fim, dias, motivo, estado, data_pedido, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      funcionario_id, tipo, data_inicio, data_fim, Number(dias), motivo,
      estado || 'Pendente', new Date().toISOString().split("T")[0], observacoes
    ]);
    res.json({ success: true, message: "Pedido registado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/pedidos_rh/:id", async (req, res) => {
  const { id } = req.params;
  const { estado, observacoes } = req.body;
  try {
    await run("UPDATE pedidos_rh SET estado = $1, observacoes = $2 WHERE id = $3", [estado, observacoes, id]);
    res.json({ success: true, message: "Pedido de RH atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/pedidos_rh/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM pedidos_rh WHERE id = $1", [id]);
    res.json({ success: true, message: "Pedido removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. Payslips
app.get("/api/recibos_salarios", async (req, res) => {
  try {
    const list = await query(`
      SELECT r.*, f.nome AS funcionario_nome, f.cargo AS funcionario_cargo, f.nuit AS funcionario_nuit,
             f.empresa_nome AS empresa_nome, f.empresa_nuit AS empresa_nuit, f.empresa_localizacao AS empresa_localizacao
      FROM recibos_salarios r
      LEFT JOIN funcionarios f ON r.funcionario_id = f.id
      ORDER BY r.mes_ano DESC, r.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/recibos_salarios", async (req, res) => {
  const { 
    funcionario_id, 
    mes_ano, 
    salario_base, 
    bonus, 
    descontos, 
    estado, 
    observacoes,
    faltas,
    subsidios,
    horas_extras,
    inss,
    irps
  } = req.body;
  try {
    const s_base = Number(salario_base || 0);
    const s_bonus = Number(bonus || 0);
    const s_desc = Number(descontos || 0);
    const s_faltas = Number(faltas || 0);
    const s_subsidios = Number(subsidios || 0);
    const s_h_extras = Number(horas_extras || 0);
    const s_inss = Number(inss || 0);
    const s_irps = Number(irps || 0);

    const s_liq = s_base + s_subsidios + s_h_extras + s_bonus - (s_faltas + s_inss + s_irps + s_desc);

    await run(`
      INSERT INTO recibos_salarios (
        funcionario_id, mes_ano, salario_base, bonus, descontos, 
        salario_liquido, data_emissao, estado, observacoes,
        faltas, subsidios, horas_extras, inss, irps
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      funcionario_id, mes_ano, s_base, s_bonus, s_desc, 
      s_liq, new Date().toISOString().split("T")[0], estado || 'Pago', observacoes,
      s_faltas, s_subsidios, s_h_extras, s_inss, s_irps
    ]);
    res.json({ success: true, message: "Recibo de salário gerado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/recibos_salarios/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    funcionario_id, 
    mes_ano, 
    salario_base, 
    bonus, 
    descontos, 
    estado, 
    observacoes,
    faltas,
    subsidios,
    horas_extras,
    inss,
    irps
  } = req.body;
  try {
    const s_base = Number(salario_base || 0);
    const s_bonus = Number(bonus || 0);
    const s_desc = Number(descontos || 0);
    const s_faltas = Number(faltas || 0);
    const s_subsidios = Number(subsidios || 0);
    const s_h_extras = Number(horas_extras || 0);
    const s_inss = Number(inss || 0);
    const s_irps = Number(irps || 0);

    const s_liq = s_base + s_subsidios + s_h_extras + s_bonus - (s_faltas + s_inss + s_irps + s_desc);

    await run(`
      UPDATE recibos_salarios 
      SET funcionario_id = $1, 
          mes_ano = $2, 
          salario_base = $3, 
          bonus = $4, 
          descontos = $5, 
          salario_liquido = $6, 
          estado = $7, 
          observacoes = $8,
          faltas = $9, 
          subsidios = $10, 
          horas_extras = $11, 
          inss = $12, 
          irps = $13
      WHERE id = $14
    `, [
      funcionario_id, mes_ano, s_base, s_bonus, s_desc, 
      s_liq, estado, observacoes,
      s_faltas, s_subsidios, s_h_extras, s_inss, s_irps, id
    ]);
    res.json({ success: true, message: "Recibo de salário atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/recibos_salarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM recibos_salarios WHERE id = $1", [id]);
    res.json({ success: true, message: "Recibo de salário removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. Performance
app.get("/api/performance", async (req, res) => {
  try {
    const totalV = await get<{ count: number }>("SELECT COUNT(*) as count FROM viaturas");
    const activeV = await get<{ count: number }>("SELECT COUNT(*) as count FROM viaturas WHERE estado = 'Em Viagem'");
    const totalM = await get<{ count: number }>("SELECT COUNT(*) as count FROM motoristas");
    const resolvedA = await get<{ count: number }>("SELECT COUNT(*) as count FROM alertas WHERE resolvido = 0");

    const financials = await get<any>(`
      SELECT 
        SUM(faturacao_mzn) as total_faturacao,
        SUM(total_combustivel_mzn) as total_combustivel,
        SUM(intermediacao_mzn) as total_intermediacao,
        SUM(escolta_mzn) as total_escolta,
        SUM(quebras_faltas_mzn) as total_quebras,
        SUM(total_remanescente_mzn) as total_remanescente
      FROM viagens
    `);

    const deviationStats = await get<any>(`
      SELECT 
        SUM(ABS(diferenca_litros)) as total_desvio_litros,
        AVG(ABS(diferenca_litros)) as avg_desvio_litros
      FROM viagens
    `);

    const driversPerformance = await query(`
      SELECT nome, score, email, telefone, categoria_carta, bi
      FROM motoristas
      ORDER BY score DESC, nome ASC
    `);

    const fuelByProvince = await query(`
      SELECT b.provincia, SUM(a.bomba_litros) as total_litros, SUM(a.valor_combustivel) as total_gasto
      FROM abastecimentos a
      LEFT JOIN bombas b ON a.bomba_name = b.nome
      GROUP BY b.provincia
      ORDER BY total_gasto DESC
    `);

    const tripsHistory = await query(`
      SELECT id, numero_viagem, data_partida, total_combustivel_mzn, faturacao_mzn, total_remanescente_mzn, estado, cliente
      FROM viagens
      ORDER BY data_partida ASC
    `);

    res.json({
      summary: {
        totalViaturas: totalV?.count || 0,
        viaturasEmViagem: activeV?.count || 0,
        totalMotoristas: totalM?.count || 0,
        alertasAtivos: resolvedA?.count || 0,
        totalFaturacao: financials?.total_faturacao || 0,
        totalCombustivel: financials?.total_combustivel || 0,
        totalIntermediacao: financials?.total_intermediacao || 0,
        totalEscolta: financials?.total_escolta || 0,
        totalQuebras: financials?.total_quebras || 0,
        totalRemanescente: financials?.total_remanescente || 0,
        totalDesvioLitros: deviationStats?.total_desvio_litros || 0,
        avgDesvioLitros: deviationStats?.avg_desvio_litros || 0
      },
      driversPerformance,
      fuelByProvince,
      tripsHistory
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. Audit Logs
app.get("/api/auditoria_logs", async (req, res) => {
  try {
    const logs = await query("SELECT * FROM auditoria_logs ORDER BY id DESC LIMIT 500");
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/auditoria_logs/clear", async (req, res) => {
  try {
    await run("DELETE FROM auditoria_logs WHERE id NOT IN (SELECT id FROM auditoria_logs ORDER BY id DESC LIMIT 50)");
    await logActivity(null, "Sistema", "Limpeza de Logs", "Limpeza de registos de auditoria efetuada, mantendo os últimos 50 registos por razões de conformidade.");
    res.json({ success: true, message: "Registo de auditoria limpo com sucesso, mantendo histórico recente para integridade." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------- VITE MIDDLEWARE ----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rhino Cargo Server running on http://localhost:${PORT}`);
  });
}

startServer();