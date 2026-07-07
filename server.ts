import "dotenv/config";
import express from "express";
import path from "path";
import sqlite3 from "sqlite3";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

import crypto from "crypto";

// Load MySQL Database configurations with default values
const MYSQL_HOST = process.env.DB_HOST || "localhost";
const MYSQL_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const MYSQL_USER = process.env.DB_USER || "root";
const MYSQL_PASSWORD = process.env.DB_PASSWORD || "";
const MYSQL_DATABASE = process.env.DB_NAME || "rhinocargo_db";

let dbType: "sqlite" | "mysql" = "sqlite";
let mysqlPool: mysql.Pool | null = null;
let db: sqlite3.Database | null = null;

async function connectDatabase() {
  try {
    console.log(`[Database] Attempting to connect to MySQL at ${MYSQL_HOST}:${MYSQL_PORT}...`);
    
    // Connect to MySQL server first (without database selected) to create the DB if not exists
    const tempConnection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });

    console.log(`[Database] Connected to MySQL host. Verifying/Creating database "${MYSQL_DATABASE}"...`);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();

    // Reconnect selecting the target database
    mysqlPool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    dbType = "mysql";
    console.log(`[Database] Successfully connected and configured with MySQL database: "${MYSQL_DATABASE}".`);
  } catch (err: any) {
    console.warn(`[Database] MySQL connection could not be established: ${err.message}`);
    console.warn("[Database] FALLING BACK TO LOCAL SQLite. Live preview is 100% operational with SQLite!");
    console.warn("[Database] On export, make sure to set MySQL environment credentials in '.env'.");

    dbType = "sqlite";
    db = new sqlite3.Database("database.db", (dbErr) => {
      if (dbErr) {
        console.error("[Database] Error opening fallback SQLite database:", dbErr);
      } else {
        console.log("[Database] Connected to SQLite fallback database successfully.");
      }
    });
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
      VALUES (?, ?, ?, ?, ?, ?)
    `, [usuario_id, usuario_nome, acao, detalhes, new Date().toISOString(), ip]);
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}

// Promisified Query Helpers supporting BOTH MySQL and SQLite
function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (dbType === "mysql" && mysqlPool) {
    return mysqlPool.execute(sql, params).then(([rows]) => rows as T[]);
  } else {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("Database not connected"));
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }
}

function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  if (dbType === "mysql" && mysqlPool) {
    return mysqlPool.execute(sql, params).then(([result]) => {
      return {
        lastID: (result as any).insertId || 0,
        changes: (result as any).affectedRows || 0
      };
    });
  } else {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("Database not connected"));
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (dbType === "mysql" && mysqlPool) {
    return mysqlPool.execute(sql, params).then(([rows]) => {
      const results = rows as any[];
      return results.length > 0 ? results[0] as T : undefined;
    });
  } else {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("Database not connected"));
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | undefined);
      });
    });
  }
}

// Database Initialization and Seeding
async function initializeDatabase() {
  try {
    if (dbType === "mysql") {
      console.log("[Database] Constructing MySQL Schema...");

      // 1. precos_provincias
      await run(`
        CREATE TABLE IF NOT EXISTS precos_provincias (
          provincia VARCHAR(100) PRIMARY KEY,
          diesel DOUBLE NOT NULL,
          gasolina DOUBLE NOT NULL,
          gas DOUBLE NOT NULL
        )
      `);

      // 2. usuarios
      await run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL
        )
      `);

      // 3. funcionarios
      await run(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
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
          salario_base DOUBLE NOT NULL DEFAULT 15000,
          data_admissao VARCHAR(50),
          usuario_id INT,
          empresa_nome VARCHAR(255) DEFAULT 'RHINO CARGO, LIMITADA',
          empresa_nuit VARCHAR(50) DEFAULT '400582914',
          empresa_localizacao VARCHAR(500) DEFAULT 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique'
        )
      `);

      // 3.1. view motoristas
      await run("DROP VIEW IF EXISTS motoristas");
      await run(`
        CREATE VIEW motoristas AS 
        SELECT id, nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score 
        FROM funcionarios 
        WHERE cargo = 'Motorista' OR cargo = 'motorista'
      `);

      // 4. bombas
      await run(`
        CREATE TABLE IF NOT EXISTS bombas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          endereco VARCHAR(500) NOT NULL,
          contacto VARCHAR(100) NOT NULL,
          provincia VARCHAR(100) NOT NULL,
          ativo INT NOT NULL DEFAULT 1,
          preco_diesel DOUBLE,
          preco_gasolina DOUBLE,
          preco_gas DOUBLE
        )
      `);

      // 5. viaturas
      await run(`
        CREATE TABLE IF NOT EXISTS viaturas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          matricula VARCHAR(50) UNIQUE NOT NULL,
          marca VARCHAR(100) NOT NULL,
          modelo VARCHAR(100) NOT NULL,
          tipo VARCHAR(100) NOT NULL,
          ano INT NOT NULL,
          kilometragem DOUBLE NOT NULL,
          km_atual DOUBLE NOT NULL,
          capacidade DOUBLE NOT NULL,
          combustivel VARCHAR(50) NOT NULL,
          estado VARCHAR(50) NOT NULL,
          observacoes TEXT
        )
      `);

      // 6. viagens
      await run(`
        CREATE TABLE IF NOT EXISTS viagens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          numero_viagem VARCHAR(100) UNIQUE NOT NULL,
          data_partida VARCHAR(50) NOT NULL,
          data_chegada VARCHAR(50),
          viatura_id INT NOT NULL,
          motorista_id INT NOT NULL,
          bomba_id INT,
          litros_bomba DOUBLE NOT NULL,
          litros_sistema DOUBLE NOT NULL,
          diferenca_litros DOUBLE NOT NULL,
          total_combustivel_mzn DOUBLE NOT NULL,
          cliente VARCHAR(255) NOT NULL,
          produto VARCHAR(255) NOT NULL,
          origem VARCHAR(255) NOT NULL,
          destino VARCHAR(255) NOT NULL,
          p_o VARCHAR(255),
          origem_combustivel VARCHAR(255),
          combustivel_gasto_mzn DOUBLE NOT NULL,
          expediente VARCHAR(255),
          reforcos TEXT,
          intermediacao_mzn DOUBLE NOT NULL,
          escolta_mzn DOUBLE NOT NULL,
          quebras_faltas_mzn DOUBLE NOT NULL,
          faturacao_mzn DOUBLE NOT NULL,
          total_remanescente_mzn DOUBLE NOT NULL,
          estado VARCHAR(50) NOT NULL,
          observacoes TEXT
        )
      `);

      // 7. abastecimentos
      await run(`
        CREATE TABLE IF NOT EXISTS abastecimentos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          viatura_id INT NOT NULL,
          viagem VARCHAR(100),
          cliente VARCHAR(255),
          data_abastecimento VARCHAR(50) NOT NULL,
          bomba_name VARCHAR(255) NOT NULL,
          provincia VARCHAR(100) NOT NULL,
          bomba_litros DOUBLE NOT NULL,
          sistema_litros DOUBLE NOT NULL,
          diferenca DOUBLE NOT NULL,
          valor_combustivel DOUBLE NOT NULL,
          valor_unitario DOUBLE NOT NULL,
          observacoes TEXT
        )
      `);

      // 8. alertas
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

      // 9. despesas_gerais
      await run(`
        CREATE TABLE IF NOT EXISTS despesas_gerais (
          id INT AUTO_INCREMENT PRIMARY KEY,
          descricao VARCHAR(255) NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          valor DOUBLE NOT NULL,
          data_despesa VARCHAR(50) NOT NULL,
          funcionario_id INT,
          viatura_id INT,
          estado VARCHAR(50) NOT NULL DEFAULT 'Pago',
          observacoes TEXT
        )
      `);

      // 10. pedidos_rh
      await run(`
        CREATE TABLE IF NOT EXISTS pedidos_rh (
          id INT AUTO_INCREMENT PRIMARY KEY,
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

      // 11. recibos_salarios
      await run(`
        CREATE TABLE IF NOT EXISTS recibos_salarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          funcionario_id INT NOT NULL,
          mes_ano VARCHAR(50) NOT NULL,
          salario_base DOUBLE NOT NULL,
          bonus DOUBLE NOT NULL DEFAULT 0,
          descontos DOUBLE NOT NULL DEFAULT 0,
          salario_liquido DOUBLE NOT NULL,
          data_emissao VARCHAR(50) NOT NULL,
          estado VARCHAR(50) NOT NULL DEFAULT 'Pago',
          observacoes TEXT,
          faltas DOUBLE NOT NULL DEFAULT 0,
          subsidios DOUBLE NOT NULL DEFAULT 0,
          horas_extras DOUBLE NOT NULL DEFAULT 0,
          inss DOUBLE NOT NULL DEFAULT 0,
          irps DOUBLE NOT NULL DEFAULT 0
        )
      `);

      // 12. auditoria_logs
      await run(`
        CREATE TABLE IF NOT EXISTS auditoria_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT,
          usuario_nome VARCHAR(255) NOT NULL,
          acao VARCHAR(255) NOT NULL,
          detalhes TEXT NOT NULL,
          data_hora VARCHAR(50) NOT NULL,
          ip_address VARCHAR(100)
        )
      `);

    } else {
      console.log("[Database] Constructing SQLite Schema...");

      // 1. precos_provincias
      await run(`
        CREATE TABLE IF NOT EXISTS precos_provincias (
          provincia TEXT PRIMARY KEY,
          diesel REAL NOT NULL,
          gasolina REAL NOT NULL,
          gas REAL NOT NULL
        )
      `);

      // 2. usuarios
      await run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          nome TEXT NOT NULL,
          role TEXT NOT NULL
        )
      `);

      // 3. funcionarios
      await run(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          telefone TEXT NOT NULL,
          carta_conducao TEXT,
          validade_carta TEXT,
          ativo INTEGER NOT NULL DEFAULT 1,
          categoria_carta TEXT,
          bi TEXT NOT NULL,
          nuit TEXT NOT NULL,
          observacoes TEXT,
          score INTEGER NOT NULL DEFAULT 100,
          cargo TEXT NOT NULL DEFAULT 'Motorista',
          salario_base REAL NOT NULL DEFAULT 15000,
          data_admissao TEXT,
          usuario_id INTEGER,
          empresa_nome TEXT DEFAULT 'RHINO CARGO, LIMITADA',
          empresa_nuit TEXT DEFAULT '400582914',
          empresa_localizacao TEXT DEFAULT 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique'
        )
      `);

      try { await run("ALTER TABLE funcionarios ADD COLUMN empresa_nome TEXT DEFAULT 'RHINO CARGO, LIMITADA'"); } catch (e) {}
      try { await run("ALTER TABLE funcionarios ADD COLUMN empresa_nuit TEXT DEFAULT '400582914'"); } catch (e) {}
      try { await run("ALTER TABLE funcionarios ADD COLUMN empresa_localizacao TEXT DEFAULT 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique'"); } catch (e) {}

      // VIEW named motoristas
      await run("DROP VIEW IF EXISTS motoristas");
      await run(`
        CREATE VIEW IF NOT EXISTS motoristas AS 
        SELECT id, nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score 
        FROM funcionarios 
        WHERE cargo = 'Motorista' OR cargo = 'motorista'
      `);

      // 4. bombas
      await run(`
        CREATE TABLE IF NOT EXISTS bombas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          endereco TEXT NOT NULL,
          contacto TEXT NOT NULL,
          provincia TEXT NOT NULL,
          ativo INTEGER NOT NULL DEFAULT 1,
          preco_diesel REAL,
          preco_gasolina REAL,
          preco_gas REAL
        )
      `);

      // 5. viaturas
      await run(`
        CREATE TABLE IF NOT EXISTS viaturas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          matricula TEXT UNIQUE NOT NULL,
          marca TEXT NOT NULL,
          modelo TEXT NOT NULL,
          tipo TEXT NOT NULL,
          ano INTEGER NOT NULL,
          kilometragem REAL NOT NULL,
          km_atual REAL NOT NULL,
          capacidade REAL NOT NULL,
          combustivel TEXT NOT NULL,
          estado TEXT NOT NULL,
          observacoes TEXT
        )
      `);

      // 6. viagens
      await run(`
        CREATE TABLE IF NOT EXISTS viagens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero_viagem TEXT UNIQUE NOT NULL,
          data_partida TEXT NOT NULL,
          data_chegada TEXT,
          viatura_id INTEGER NOT NULL,
          motorista_id INTEGER NOT NULL,
          bomba_id INTEGER,
          litros_bomba REAL NOT NULL,
          litros_sistema REAL NOT NULL,
          diferenca_litros REAL NOT NULL,
          total_combustivel_mzn REAL NOT NULL,
          cliente TEXT NOT NULL,
          produto TEXT NOT NULL,
          origem TEXT NOT NULL,
          destino TEXT NOT NULL,
          p_o TEXT,
          origem_combustivel TEXT,
          combustivel_gasto_mzn REAL NOT NULL,
          expediente TEXT,
          reforcos TEXT,
          intermediacao_mzn REAL NOT NULL,
          escolta_mzn REAL NOT NULL,
          quebras_faltas_mzn REAL NOT NULL,
          faturacao_mzn REAL NOT NULL,
          total_remanescente_mzn REAL NOT NULL,
          estado TEXT NOT NULL,
          observacoes TEXT
        )
      `);

      // 7. abastecimentos
      await run(`
        CREATE TABLE IF NOT EXISTS abastecimentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          viatura_id INTEGER NOT NULL,
          viagem TEXT,
          cliente TEXT,
          data_abastecimento TEXT NOT NULL,
          bomba_name TEXT NOT NULL,
          provincia TEXT NOT NULL,
          bomba_litros REAL NOT NULL,
          sistema_litros REAL NOT NULL,
          diferenca REAL NOT NULL,
          valor_combustivel REAL NOT NULL,
          valor_unitario REAL NOT NULL,
          observacoes TEXT
        )
      `);

      // 8. alertas
      await run(`
        CREATE TABLE IF NOT EXISTS alertas (
          id TEXT PRIMARY KEY,
          data_hora TEXT NOT NULL,
          tipo TEXT NOT NULL,
          titulo TEXT NOT NULL,
          mensagem TEXT NOT NULL,
          resolvido INTEGER NOT NULL DEFAULT 0,
          gravidade TEXT NOT NULL,
          meta TEXT
        )
      `);

      // 9. despesas_gerais
      await run(`
        CREATE TABLE IF NOT EXISTS despesas_gerais (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          descricao TEXT NOT NULL,
          categoria TEXT NOT NULL,
          valor REAL NOT NULL,
          data_despesa TEXT NOT NULL,
          funcionario_id INTEGER,
          viatura_id INTEGER,
          estado TEXT NOT NULL DEFAULT 'Pago',
          observacoes TEXT
        )
      `);

      // 10. pedidos_rh
      await run(`
        CREATE TABLE IF NOT EXISTS pedidos_rh (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          tipo TEXT NOT NULL,
          data_inicio TEXT NOT NULL,
          data_fim TEXT NOT NULL,
          dias INTEGER NOT NULL,
          motivo TEXT,
          estado TEXT NOT NULL DEFAULT 'Pendente',
          data_pedido TEXT NOT NULL,
          observacoes TEXT
        )
      `);

      // 11. recibos_salarios
      await run(`
        CREATE TABLE IF NOT EXISTS recibos_salarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          mes_ano TEXT NOT NULL,
          salario_base REAL NOT NULL,
          bonus REAL NOT NULL DEFAULT 0,
          descontos REAL NOT NULL DEFAULT 0,
          salario_liquido REAL NOT NULL,
          data_emissao TEXT NOT NULL,
          estado TEXT NOT NULL DEFAULT 'Pago',
          observacoes TEXT,
          faltas REAL NOT NULL DEFAULT 0,
          subsidios REAL NOT NULL DEFAULT 0,
          horas_extras REAL NOT NULL DEFAULT 0,
          inss REAL NOT NULL DEFAULT 0,
          irps REAL NOT NULL DEFAULT 0
        )
      `);

      try { await run("ALTER TABLE recibos_salarios ADD COLUMN faltas REAL NOT NULL DEFAULT 0"); } catch (e) {}
      try { await run("ALTER TABLE recibos_salarios ADD COLUMN subsidios REAL NOT NULL DEFAULT 0"); } catch (e) {}
      try { await run("ALTER TABLE recibos_salarios ADD COLUMN horas_extras REAL NOT NULL DEFAULT 0"); } catch (e) {}
      try { await run("ALTER TABLE recibos_salarios ADD COLUMN inss REAL NOT NULL DEFAULT 0"); } catch (e) {}
      try { await run("ALTER TABLE recibos_salarios ADD COLUMN irps REAL NOT NULL DEFAULT 0"); } catch (e) {}

      // 12. auditoria_logs
      await run(`
        CREATE TABLE IF NOT EXISTS auditoria_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER,
          usuario_nome TEXT NOT NULL,
          acao TEXT NOT NULL,
          detalhes TEXT NOT NULL,
          data_hora TEXT NOT NULL,
          ip_address TEXT
        )
      `);
    }

    console.log("[Database] Database schema validated/created successfully.");

    // Dynamic Safe Seeding (only inserts missing records to prevent wiping production database data!)
    
    // 1. Seed precos_provincias
    const provinceCountResult = await get<any>("SELECT COUNT(*) as count FROM precos_provincias");
    const provinceCount = provinceCountResult?.count !== undefined ? provinceCountResult.count : (provinceCountResult ? Object.values(provinceCountResult)[0] : 0);
    if (Number(provinceCount) === 0) {
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
        await run("INSERT INTO precos_provincias (provincia, diesel, gasolina, gas) VALUES (?, ?, ?, ?)", p);
      }
    }

    // 2. Seed usuarios
    const userCountResult = await get<any>("SELECT COUNT(*) as count FROM usuarios");
    const userCount = userCountResult?.count !== undefined ? userCountResult.count : (userCountResult ? Object.values(userCountResult)[0] : 0);
    if (Number(userCount) === 0) {
      console.log("[Database] Seeding administrative users...");
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (1, 'walter', ?, 'Walter Juvencio Chauchau', 'admin')", [hashPassword("walter.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (2, 'salvador', ?, 'Salvador Matlombe', 'admin')", [hashPassword("salvador.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (3, 'clara', ?, 'Clara Tolvela', 'administracao')", [hashPassword("clara.123")]);
      await run("INSERT INTO usuarios (id, email, senha, nome, role) VALUES (4, 'nilda', ?, 'Nilda Magumane', 'rh')", [hashPassword("nilda.123")]);
    }

    // Hash all legacy/plain text passwords if any
    const allUsers = await query<any>("SELECT id, senha, nome FROM usuarios");
    for (const u of allUsers) {
      if (u.senha && !u.senha.includes(":")) {
        const hashed = hashPassword(u.senha);
        await run("UPDATE usuarios SET senha = ? WHERE id = ?", [hashed, u.id]);
        console.log(`[Security] Hashed plain-text password for user "${u.nome}".`);
      }
    }

    // 3. Seed initial auditoria_logs
    const logCountResult = await get<any>("SELECT COUNT(*) as count FROM auditoria_logs");
    const logCount = logCountResult?.count !== undefined ? logCountResult.count : (logCountResult ? Object.values(logCountResult)[0] : 0);
    if (Number(logCount) === 0) {
      await logActivity(null, "Sistema", "Inicialização", "Banco de dados inicializado com sucesso.");
    }

    // 4. Seed funcionarios & motoristas
    const funcCountResult = await get<any>("SELECT COUNT(*) as count FROM funcionarios");
    const funcCount = funcCountResult?.count !== undefined ? funcCountResult.count : (funcCountResult ? Object.values(funcCountResult)[0] : 0);
    if (Number(funcCount) === 0) {
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

      // Seeding drivers extracted from identification documents
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

    // 5. Seed bombas
    const bombaCountResult = await get<any>("SELECT COUNT(*) as count FROM bombas");
    const bombaCount = bombaCountResult?.count !== undefined ? bombaCountResult.count : (bombaCountResult ? Object.values(bombaCountResult)[0] : 0);
    if (Number(bombaCount) === 0) {
      console.log("[Database] Seeding official gas stations...");
      const pumps = [
        [1, "Bomba Petromoc - Av. 24 de Julho", "Av. 24 de Julho, Maputo Cidade", "+258 84 123 4567", "Maputo Cidade", 1, 116.25, 93.69, 90.0],
        [2, "Bomba TotalEnergies - Matchiki-Tchiki", "Estrada Nacional N4, Matchiki-Tchiki", "+258 82 987 6543", "Maputo Província", 1, 116.25, 93.69, 90.0],
        [3, "Bomba Engen - Beira Port", "Zona Portuária, Beira", "+258 84 321 0987", "Sofala", 1, 116.25, 93.69, 90.8],
        [4, "Bomba Galp - Nampula Centro", "Av. Eduardo Mondlane, Nampula", "+258 85 555 4321", "Nampula", 1, 116.25, 93.69, 91.8],
        [5, "Bomba Petromoc - Tete Centro", "Av. da Independência, Tete", "+258 86 444 8888", "Tete", 1, 121.64, 99.08, 92.0],
        [6, "Bomba TotalEnergies - Chokwé", "Av. Principal, Chokwé", "+258 87 333 1111", "Gaza", 1, 116.25, 93.69, 91.2],
        [7, "Bomba Engen - Maxixe Centro", "EN1, Maxixe", "+258 84 222 9999", "Inhambane", 1, 116.25, 93.69, 91.5],

        // Som Petroleum & Capital Oil in Base Regions
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

        // Niassa
        [18, "Som Petroleum - Lichinga", "Av. do Trabalho, Lichinga", "+258 84 100 1111", "Niassa", 1, 123.27, 100.71, 93.0],
        [19, "Capital Oil - Lichinga", "Av. de Moçambique, Lichinga", "+258 84 100 1112", "Niassa", 1, 123.27, 100.71, 93.0],

        // Tete
        [20, "Som Petroleum - Tete", "Av. 25 de Junho, Tete", "+258 84 100 1113", "Tete", 1, 121.64, 99.08, 92.0],
        [21, "Capital Oil - Tete", "Estrada Nacional EN103, Tete", "+258 84 100 1114", "Tete", 1, 121.64, 99.08, 92.0],

        // Zambézia
        [22, "Som Petroleum - Quelimane", "Av. Julius Nyerere, Quelimane", "+258 84 100 1115", "Zambézia", 1, 120.70, 98.14, 91.7],
        [23, "Capital Oil - Quelimane", "Av. Marginal de Quelimane, Quelimane", "+258 84 100 1116", "Zambézia", 1, 120.70, 98.14, 91.7],

        // Cabo Delgado
        [24, "Som Petroleum - Mueda", "Estrada de Mueda, Mueda", "+258 84 100 1117", "Cabo Delgado", 1, 131.85, 0.0, 92.5],
        [25, "Capital Oil - Palma", "Zona de Desenvolvimento, Palma", "+258 84 100 1118", "Cabo Delgado", 1, 131.85, 0.0, 92.5],

        // Mecula
        [26, "Som Petroleum - Mecula", "Estrada Principal EN14, Mecula", "+258 84 100 1119", "Niassa", 1, 126.27, 0.0, 93.0],
        [27, "Capital Oil - Mecula", "Centro Comercial Mecula, Mecula", "+258 84 100 1120", "Niassa", 1, 126.27, 0.0, 93.0],

        // Zumbo
        [28, "Som Petroleum - Zumbo", "Bairro Fluvial, Zumbo", "+258 84 100 1121", "Tete", 1, 0.0, 101.67, 92.0],
        [29, "Capital Oil - Zumbo", "Estrada de Acesso Zumbo, Zumbo", "+258 84 100 1122", "Tete", 1, 0.0, 101.67, 92.0],

        // Key refueling points for Rhino Cargo (Machava, Marracuene, Inhope, Nampula)
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
        await run("INSERT INTO bombas (id, nome, endereco, contacto, provincia, ativo, preco_diesel, preco_gasolina, preco_gas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", p);
      }
    }

    console.log("[Database] Database successfully initialized and seeded.");
  } catch (error) {
    console.error("[Database] Database initialization failed:", error);
  }
}

// Kick off Database setup synchronously
(async () => {
  await connectDatabase();
  await initializeDatabase();
})();

// ---------------- REST API ROUTES ----------------

// 1. Authentication
app.post("/api/auth/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ success: false, message: "Email ou Usuário e senha são obrigatórios." });
  }
  try {
    const user = await get<any>("SELECT id, email, nome, role, senha FROM usuarios WHERE email = ? OR nome = ?", [email, email]);
    if (user && verifyPassword(senha, user.senha)) {
      // Find linked employee profile
      const emp = await get<any>("SELECT id, cargo, score FROM funcionarios WHERE usuario_id = ? OR email = ? OR nome = ?", [user.id, user.email, user.nome]);
      
      // Remove sensitive password from response object
      delete user.senha;

      const enrichedUser = {
        ...user,
        funcionario_id: emp ? emp.id : null,
        cargo: emp ? emp.cargo : null,
        score: emp ? emp.score : 100
      };

      // Audit Log for successful login
      await logActivity(user.id, user.nome, "Autenticação", "Sessão iniciada no sistema com sucesso.");

      res.json({ success: true, user: enrichedUser });
    } else {
      // Audit failure attempt
      await logActivity(null, "Convidado", "Falha de Autenticação", `Tentativa fracassada de login para o usuário: ${email}`);
      res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }
  } catch (error: any) {
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
      "UPDATE precos_provincias SET diesel = ?, gasolina = ?, gas = ? WHERE provincia = ?",
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `UPDATE viaturas SET matricula = ?, marca = ?, modelo = ?, tipo = ?, ano = ?, kilometragem = ?, km_atual = ?, capacidade = ?, combustivel = ?, estado = ?, observacoes = ?
       WHERE id = ?`,
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
    await run("DELETE FROM viaturas WHERE id = ?", [id]);
    res.json({ success: true, message: "Viatura removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Motoristas (Drivers - Now mapped to funcionarios table)
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
    // Generate credentials
    const username = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    const password = `${username}.123`;
    const hashedPassword = hashPassword(password);

    // Insert into usuarios table
    const userResult = await run(`
      INSERT INTO usuarios (email, senha, nome, role)
      VALUES (?, ?, ?, 'funcionario')
    `, [username, hashedPassword, nome]);

    // Insert into master funcionarios table with cargo = 'Motorista'
    await run(
      `INSERT INTO funcionarios (nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Motorista', 18500, ?, ?)`,
      [
        nome, email, telefone, carta_conducao, validade_carta, 
        ativo !== undefined ? ativo : 1, categoria_carta, bi, nuit, observacoes, 
        score !== undefined ? score : 100, 
        new Date().toISOString().split("T")[0],
        userResult.lastID
      ]
    );

    // Log the creation
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
    // Sync name in usuarios if matched
    const existing = await get<any>("SELECT usuario_id FROM funcionarios WHERE id = ?", [id]);
    if (existing && existing.usuario_id) {
      await run("UPDATE usuarios SET nome = ? WHERE id = ?", [nome, existing.usuario_id]);
    }

    await run(
      `UPDATE funcionarios SET nome = ?, email = ?, telefone = ?, carta_conducao = ?, validade_carta = ?, ativo = ?, categoria_carta = ?, bi = ?, nuit = ?, observacoes = ?, score = ?
       WHERE id = ?`,
      [nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, id]
    );

    // Log the update
    await logActivity(null, "Recursos Humanos", "Edição de Motorista", `Motorista ID ${id} (${nome}) atualizado.`);

    res.json({ success: true, message: "Motorista atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/motoristas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await get<any>("SELECT nome, usuario_id FROM funcionarios WHERE id = ?", [id]);
    if (existing && existing.usuario_id) {
      await run("DELETE FROM usuarios WHERE id = ?", [existing.usuario_id]);
    }
    await run("DELETE FROM funcionarios WHERE id = ?", [id]);

    // Log deletion
    const mName = existing ? existing.nome : `ID ${id}`;
    await logActivity(null, "Administrador/RH", "Exclusão de Motorista", `Motorista "${mName}" removido permanentemente.`);

    res.json({ success: true, message: "Motorista removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Bombas (Fuel Stations)
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `UPDATE bombas SET nome = ?, endereco = ?, contacto = ?, provincia = ?, ativo = ?, preco_diesel = ?, preco_gasolina = ?, preco_gas = ?
       WHERE id = ?`,
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
    await run("DELETE FROM bombas WHERE id = ?", [id]);
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
    await run("UPDATE alertas SET resolvido = 1 WHERE id = ?", [id]);
    res.json({ success: true, message: "Alerta resolvido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Viagens (Trips) - Rich endpoints
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

// POST /api/viagens - Create a trip & auto-refuel
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
    // 1. Resolve vehicle and pump prices to do calculations
    const viatura = await get<any>("SELECT * FROM viaturas WHERE id = ?", [viatura_id]);
    if (!viatura) {
      return res.status(404).json({ success: false, message: "Viatura não encontrada." });
    }

    const bomba = await get<any>("SELECT * FROM bombas WHERE id = ?", [bomba_id]);
    if (!bomba) {
      return res.status(404).json({ success: false, message: "Bomba não encontrada." });
    }

    // Determine fuel price per liter
    let valor_unitario = 91.5; // default fallback
    const fuelType = viatura.combustivel.toLowerCase();

    if (fuelType.includes("diesel")) {
      valor_unitario = bomba.preco_diesel || 0;
    } else if (fuelType.includes("gasolina")) {
      valor_unitario = bomba.preco_gasolina || 0;
    } else if (fuelType.includes("gas")) {
      valor_unitario = bomba.preco_gas || 0;
    }

    // If pump doesn't have custom price, load province price
    if (valor_unitario === 0) {
      const provPrice = await get<any>("SELECT * FROM precos_provincias WHERE provincia = ?", [bomba.provincia]);
      if (provPrice) {
        if (fuelType.includes("diesel")) valor_unitario = provPrice.diesel;
        else if (fuelType.includes("gasolina")) valor_unitario = provPrice.gasolina;
        else if (fuelType.includes("gas")) valor_unitario = provPrice.gas;
      }
    }

    // Calculate totals
    const total_combustivel_mzn = litros_bomba * valor_unitario;
    const diferenca_litros = litros_bomba - litros_sistema;

    // 2. Insert Voyage
    const result = await run(
      `INSERT INTO viagens (
        numero_viagem, data_partida, data_chegada, viatura_id, motorista_id, bomba_id,
        litros_bomba, litros_sistema, diferenca_litros, total_combustivel_mzn,
        cliente, produto, origem, destino, p_o, origem_combustivel,
        combustivel_gasto_mzn, expediente, reforcos,
        intermediacao_mzn, escolta_mzn, quebras_faltas_mzn, faturacao_mzn, total_remanescente_mzn,
        estado, observacoes
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, 0, 0, 0, 0, 0, ?, ? )`,
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
        total_combustivel_mzn, // Initial fuel cost is the spent fuel
        "em_curso",
        observacoes
      ]
    );

    // 3. Register fuel record in abastecimentos
    await run(
      `INSERT INTO abastecimentos (
        viatura_id, viagem, cliente, data_abastecimento, bomba_name, provincia,
        bomba_litros, sistema_litros, diferenca, valor_combustivel, valor_unitario, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    // 4. Update vehicle state
    await run("UPDATE viaturas SET estado = 'Em Viagem' WHERE id = ?", [viatura_id]);

    // 5. Check for consumption deviation and trigger automatic alert
    const percentDev = litros_sistema > 0 ? (Math.abs(diferenca_litros) / litros_sistema) * 100 : 0;
    if (Math.abs(diferenca_litros) >= 5 || percentDev >= 3) {
      const alertId = `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const severity = Math.abs(diferenca_litros) >= 20 ? "alta" : "media";
      await run(
        `INSERT INTO alertas (id, data_hora, tipo, titulo, mensagem, resolvido, gravidade, meta)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
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

      // Decrement driver score slightly due to fuel deviation
      await run("UPDATE motoristas SET score = MAX(0, score - 5) WHERE id = ?", [motorista_id]);
    }

    res.json({ success: true, message: "Viagem iniciada com sucesso.", tripId: result.lastID });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/viagens/:id - Edit / Close Voyage
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
    const trip = await get<any>("SELECT * FROM viagens WHERE id = ?", [id]);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Viagem não encontrada." });
    }

    // Get fuel cost (constant from initial refuel)
    const combustivel_gasto_mzn = trip.total_combustivel_mzn;

    // Intermediate, Escort, Breakages/Shortages and Billing details
    const intermediacao = Number(intermediacao_mzn || 0);
    const escolta = Number(escolta_mzn || 0);
    const quebras = Number(quebras_faltas_mzn || 0);
    const faturacao = Number(faturacao_mzn || 0);

    // Calculate total remaining
    // total_remanescente = faturacao - (combustivel_gasto + intermediacao + escolta + quebras)
    const total_remanescente_mzn = faturacao - (combustivel_gasto_mzn + intermediacao + escolta + quebras);

    // Update query
    await run(
      `UPDATE viagens SET
        estado = ?,
        data_chegada = ?,
        intermediacao_mzn = ?,
        escolta_mzn = ?,
        quebras_faltas_mzn = ?,
        faturacao_mzn = ?,
        total_remanescente_mzn = ?,
        observacoes = ?,
        expediente = ?,
        reforcos = ?,
        p_o = ?,
        origem_combustivel = ?
       WHERE id = ?`,
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

    // If the trip is finished (concluida), update vehicle status and current mileage
    if (estado === "concluida") {
      await run("UPDATE viaturas SET estado = 'Disponível' WHERE id = ?", [trip.viatura_id]);
      if (km_chegada) {
        await run("UPDATE viaturas SET km_atual = ? WHERE id = ?", [km_chegada, trip.viatura_id]);
      }
    }

    res.json({ success: true, message: "Viagem atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------- ADDITIONAL ADVANCED HR & FLEET MANAGEMENT ROUTES ----------------

// 1. General Employees (Funcionários) CRUD
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
    // Generate credentials
    const username = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    const password = `${username}.123`;
    const hashedPassword = hashPassword(password);

    // Map cargo to user role
    let userRole = "funcionario";
    const cargoLower = (cargo || "").toLowerCase();
    if (cargoLower.includes("it") || cargoLower.includes("admin")) {
      userRole = "admin";
    } else if (cargoLower.includes("recursos") || cargoLower.includes("rh")) {
      userRole = "rh";
    } else if (cargoLower.includes("administra")) {
      userRole = "administracao";
    }

    // Insert into usuarios
    const userResult = await run(`
      INSERT INTO usuarios (email, senha, nome, role)
      VALUES (?, ?, ?, ?)
    `, [username, hashedPassword, nome, userRole]);

    // Insert into funcionarios
    await run(`
      INSERT INTO funcionarios (
        nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, 
        bi, nuit, observacoes, score, cargo, salario_base, data_admissao, usuario_id,
        empresa_nome, empresa_nuit, empresa_localizacao
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    // Log the creation
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
    const existing = await get<any>("SELECT * FROM funcionarios WHERE id = ?", [id]);
    if (existing && existing.usuario_id) {
      // Sync role in usuarios if cargo changes
      let userRole = "funcionario";
      const cargoLower = (cargo || "").toLowerCase();
      if (cargoLower.includes("it") || cargoLower.includes("admin")) {
        userRole = "admin";
      } else if (cargoLower.includes("recursos") || cargoLower.includes("rh")) {
        userRole = "rh";
      } else if (cargoLower.includes("administra")) {
        userRole = "administracao";
      }

      await run("UPDATE usuarios SET nome = ?, role = ? WHERE id = ?", [nome, userRole, existing.usuario_id]);
    }

    await run(`
      UPDATE funcionarios
      SET nome = ?, email = ?, telefone = ?, carta_conducao = ?, validade_carta = ?, ativo = ?, categoria_carta = ?, bi = ?, nuit = ?, observacoes = ?, score = ?, cargo = ?, salario_base = ?, data_admissao = ?,
          empresa_nome = ?, empresa_nuit = ?, empresa_localizacao = ?
      WHERE id = ?
    `, [
      nome, email, telefone, carta_conducao, validade_carta, ativo, categoria_carta, bi, nuit, observacoes, score, cargo, Number(salario_base), data_admissao,
      empresa_nome || 'RHINO CARGO, LIMITADA',
      empresa_nuit || '400582914',
      empresa_localizacao || 'Porto de Maputo, Recinto Portuário, Maputo, Moçambique',
      id
    ]);

    // Log update
    await logActivity(null, "Recursos Humanos", "Edição de Funcionário", `Funcionário ID ${id} (${nome}) atualizado.`);

    res.json({ success: true, message: "Funcionário atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/funcionarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await get<any>("SELECT * FROM funcionarios WHERE id = ?", [id]);
    if (existing && existing.usuario_id) {
      await run("DELETE FROM usuarios WHERE id = ?", [existing.usuario_id]);
    }
    await run("DELETE FROM funcionarios WHERE id = ?", [id]);

    // Log deletion
    const fName = existing ? existing.nome : `ID ${id}`;
    await logActivity(null, "Administrador/RH", "Exclusão de Funcionário", `Funcionário "${fName}" removido permanentemente do sistema.`);

    res.json({ success: true, message: "Funcionário removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. General Company Expenses (Despesas Gerais) CRUD
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      SET descricao = ?, categoria = ?, valor = ?, data_despesa = ?, funcionario_id = ?, viatura_id = ?, estado = ?, observacoes = ?
      WHERE id = ?
    `, [descricao, categoria, Number(valor), data_despesa, funcionario_id || null, viatura_id || null, estado, observacoes, id]);
    res.json({ success: true, message: "Despesa atualizada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/despesas_gerais/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM despesas_gerais WHERE id = ?", [id]);
    res.json({ success: true, message: "Despesa removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. HR Request Orders (Pedidos de Férias e Dispensas) CRUD
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    await run("UPDATE pedidos_rh SET estado = ?, observacoes = ? WHERE id = ?", [estado, observacoes, id]);
    res.json({ success: true, message: "Pedido de RH atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/pedidos_rh/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM pedidos_rh WHERE id = ?", [id]);
    res.json({ success: true, message: "Pedido removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Payslips (Recibos de Salários) CRUD
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      SET funcionario_id = ?, 
          mes_ano = ?, 
          salario_base = ?, 
          bonus = ?, 
          descontos = ?, 
          salario_liquido = ?, 
          estado = ?, 
          observacoes = ?,
          faltas = ?, 
          subsidios = ?, 
          horas_extras = ?, 
          inss = ?, 
          irps = ?
      WHERE id = ?
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
    await run("DELETE FROM recibos_salarios WHERE id = ?", [id]);
    res.json({ success: true, message: "Recibo de salário removido com sucesso." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Performance Statistics Dashboard Data
app.get("/api/performance", async (req, res) => {
  try {
    // Basic fleet metrics
    const totalV = await get<{ count: number }>("SELECT COUNT(*) as count FROM viaturas");
    const activeV = await get<{ count: number }>("SELECT COUNT(*) as count FROM viaturas WHERE estado = 'Em Viagem'");
    const totalM = await get<{ count: number }>("SELECT COUNT(*) as count FROM motoristas");
    const resolvedA = await get<{ count: number }>("SELECT COUNT(*) as count FROM alertas WHERE resolvido = 0");

    // Financial summaries
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

    // Fuel deviation total
    const deviationStats = await get<any>(`
      SELECT 
        SUM(ABS(diferenca_litros)) as total_desvio_litros,
        AVG(ABS(diferenca_litros)) as avg_desvio_litros
      FROM viagens
    `);

    // Driver score averages
    const driversPerformance = await query(`
      SELECT nome, score, email, telefone, categoria_carta, bi
      FROM motoristas
      ORDER BY score DESC, nome ASC
    `);

    // Fuel consumption and trips by province
    const fuelByProvince = await query(`
      SELECT b.provincia, SUM(a.bomba_litros) as total_litros, SUM(a.valor_combustivel) as total_gasto
      FROM abastecimentos a
      LEFT JOIN bombas b ON a.bomba_name = b.nome
      GROUP BY b.provincia
      ORDER BY total_gasto DESC
    `);

    // Trips over time
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

// 13. System Audit Log / Registo de Atividades
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


// ---------------- VITE MIDDLEWARE CONFIG ----------------

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
