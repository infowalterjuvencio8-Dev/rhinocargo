export interface Usuario {
  id: number;
  email: string;
  nome: string;
  role: "admin" | "administracao" | "rh" | "funcionario";
  funcionario_id?: number | null;
  cargo?: string | null;
}

export interface Funcionario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  carta_conducao?: string;
  validade_carta?: string;
  ativo: number; // 0 or 1
  categoria_carta?: string;
  bi: string;
  nuit: string;
  observacoes?: string;
  score: number;
  cargo: string; // e.g., 'Motorista', 'RH', 'Administração', 'Mecânico', etc.
  salario_base: number;
  data_admissao?: string;
  usuario_id?: number | null;
  empresa_nome?: string;
  empresa_nuit?: string;
  empresa_localizacao?: string;
}

export interface Motorista {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  carta_conducao: string;
  validade_carta: string;
  ativo: number; // 0 or 1
  categoria_carta: string;
  bi: string;
  nuit: string;
  observacoes?: string;
  score: number;
  cargo?: string;
  salario_base?: number;
  data_admissao?: string;
  usuario_id?: number | null;
}

export interface Viatura {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  tipo: string;
  ano: number;
  kilometragem: number;
  km_atual: number;
  capacidade: number;
  combustivel: string;
  estado: string; // 'Disponível', 'Em Viagem', 'Manutenção'
  observacoes?: string;
}

export interface Bomba {
  id: number;
  nome: string;
  endereco: string;
  contacto: string;
  provincia: string;
  ativo: number; // 0 or 1
  preco_diesel?: number;
  preco_gasolina?: number;
  preco_gas?: number;
}

export interface PrecoProvincia {
  provincia: string;
  diesel: number;
  gasolina: number;
  gas: number;
}

export interface Viagem {
  id: number;
  numero_viagem: string;
  data_partida: string;
  data_chegada?: string;
  viatura_id: number;
  motorista_id: number;
  bomba_id?: number;
  litros_bomba: number;
  litros_sistema: number;
  diferenca_litros: number;
  total_combustivel_mzn: number;
  cliente: string;
  produto: string;
  origem: string;
  destino: string;
  p_o?: string;
  origem_combustivel?: string;
  combustivel_gasto_mzn: number;
  expediente?: string;
  reforcos?: string;
  intermediacao_mzn: number;
  escolta_mzn: number;
  quebras_faltas_mzn: number;
  faturacao_mzn: number;
  total_remanescente_mzn: number;
  estado: "em_curso" | "concluida";
  observacoes?: string;

  // Joined fields from API:
  viatura_matricula?: string;
  viatura_marca?: string;
  viatura_modelo?: string;
  viatura_combustivel?: string;
  motorista_nome?: string;
  motorista_telefone?: string;
  motorista_email?: string;
  bomba_nome?: string;
  bomba_provincia?: string;
}

export interface Abastecimento {
  id: number;
  viatura_id: number;
  viagem?: string;
  cliente?: string;
  data_abastecimento: string;
  bomba_name: string;
  provincia: string;
  bomba_litros: number;
  sistema_litros: number;
  diferenca: number;
  valor_combustivel: number;
  valor_unitario: number;
  observacoes?: string;
  viatura_matricula?: string; // from join
}

export interface Alerta {
  id: string;
  data_hora: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  resolvido: number; // 0 or 1
  gravidade: "baixa" | "media" | "alta";
  meta?: string;
}

export interface PerformanceSummary {
  totalViaturas: number;
  viaturasEmViagem: number;
  totalMotoristas: number;
  alertasAtivos: number;
  totalFaturacao: number;
  totalCombustivel: number;
  totalIntermediacao: number;
  totalEscolta: number;
  totalQuebras: number;
  totalRemanescente: number;
  totalDesvioLitros: number;
  avgDesvioLitros: number;
}

export interface PerformanceData {
  summary: PerformanceSummary;
  driversPerformance: Motorista[];
  fuelByProvince: { provincia: string; total_litros: number; total_gasto: number }[];
  tripsHistory: {
    id: number;
    numero_viagem: string;
    data_partida: string;
    total_combustivel_mzn: number;
    faturacao_mzn: number;
    total_remanescente_mzn: number;
    estado: string;
    cliente: string;
  }[];
}

export interface DespesaGeral {
  id: number;
  descricao: string;
  categoria: string; // e.g., 'Manutenção', 'Salários', 'Impostos', 'Escritório', etc.
  valor: number;
  data_despesa: string;
  funcionario_id?: number | null;
  funcionario_nome?: string;
  viatura_id?: number | null;
  viatura_matricula?: string;
  estado: string; // 'Pago', 'Pendente'
  observacoes?: string;
}

export interface PedidoRH {
  id: number;
  funcionario_id: number;
  funcionario_nome?: string;
  funcionario_cargo?: string;
  tipo: string; // 'Férias', 'Dispensa', 'Outro'
  data_inicio: string;
  data_fim: string;
  dias: number;
  motivo?: string;
  estado: string; // 'Pendente', 'Aprovado', 'Rejeitado'
  data_pedido: string;
  observacoes?: string;
}

export interface ReciboSalario {
  id: number;
  funcionario_id: number;
  funcionario_nome?: string;
  funcionario_cargo?: string;
  funcionario_nuit?: string;
  mes_ano: string; // 'MM/YYYY'
  salario_base: number;
  bonus: number;
  descontos: number;
  salario_liquido: number;
  data_emissao: string;
  estado: string; // 'Pago', 'Pendente'
  observacoes?: string;
  faltas: number;
  subsidios: number;
  horas_extras: number;
  inss: number;
  irps: number;
  empresa_nome?: string;
  empresa_nuit?: string;
  empresa_localizacao?: string;
}

export interface AuditLog {
  id: number;
  usuario_id: number | null;
  usuario_nome: string;
  acao: string;
  detalhes: string;
  data_hora: string;
  ip_address?: string;
}
