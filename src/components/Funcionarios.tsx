import React, { useState, useEffect } from "react";
import { 
  Users, Search, Filter, X, Edit, Trash2, Calendar, 
  User, Briefcase, Plus, CheckCircle, AlertTriangle, Shield, Key, Copy 
} from "lucide-react";
import { Funcionario, Usuario } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface FuncionariosProps {
  currentUser: Usuario;
  onRefreshData: () => Promise<void>;
}

export default function Funcionarios({ currentUser, onRefreshData }: FuncionariosProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // CRUD Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
  const [saving, setSaving] = useState(false);

  // New credentials display state
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pass: string } | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "Outro",
    salario_base: "15000",
    data_admissao: new Date().toISOString().split("T")[0],
    carta_conducao: "",
    validade_carta: "",
    categoria_carta: "",
    bi: "",
    nuit: "",
    observacoes: "",
    ativo: 1,
    empresa_nome: "RHINO CARGO, LIMITADA",
    empresa_nuit: "400582914",
    empresa_localizacao: "Porto de Maputo, Recinto Portuário, Maputo, Moçambique"
  });

  const roles = ["Motorista", "Recursos Humanos (RH)", "Administração", "IT (Admin)", "Mecânico", "Logística", "Outro"];

  const loadFuncionarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/funcionarios");
      if (res.ok) {
        const data = await res.json();
        setFuncionarios(data);
      } else {
        setError("Erro ao carregar directório de funcionários.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha na ligação à base de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const handleOpenAdd = () => {
    setEditingFunc(null);
    setCreatedCredentials(null);
    setForm({
      nome: "",
      email: "",
      telefone: "",
      cargo: "Motorista",
      salario_base: "18500",
      data_admissao: new Date().toISOString().split("T")[0],
      carta_conducao: "",
      validade_carta: "",
      categoria_carta: "",
      bi: "",
      nuit: "",
      observacoes: "",
      ativo: 1,
      empresa_nome: "RHINO CARGO, LIMITADA",
      empresa_nuit: "400582914",
      empresa_localizacao: "Porto de Maputo, Recinto Portuário, Maputo, Moçambique"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Funcionario) => {
    setEditingFunc(f);
    setCreatedCredentials(null);
    setForm({
      nome: f.nome,
      email: f.email,
      telefone: f.telefone,
      cargo: f.cargo,
      salario_base: String(f.salario_base || 15000),
      data_admissao: f.data_admissao || new Date().toISOString().split("T")[0],
      carta_conducao: f.carta_conducao || "",
      validade_carta: f.validade_carta || "",
      categoria_carta: f.categoria_carta || "",
      bi: f.bi || "",
      nuit: f.nuit || "",
      observacoes: f.observacoes || "",
      ativo: f.ativo,
      empresa_nome: f.empresa_nome || "RHINO CARGO, LIMITADA",
      empresa_nuit: f.empresa_nuit || "400582914",
      empresa_localizacao: f.empresa_localizacao || "Porto de Maputo, Recinto Portuário, Maputo, Moçambique"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.telefone) {
      setError("Campos Nome, Email e Telefone são de preenchimento obrigatório.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingFunc ? `/api/funcionarios/${editingFunc.id}` : "/api/funcionarios";
      const method = editingFunc ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salario_base: Number(form.salario_base)
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(editingFunc ? "Funcionário atualizado com sucesso!" : "Funcionário registado com sucesso!");
        
        // If created new, extract generated credentials to show the beautiful credential card
        if (!editingFunc) {
          const uName = form.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          const password = `${uName}.123`;
          setCreatedCredentials({ username: uName, pass: password });
        } else {
          setTimeout(() => {
            setIsModalOpen(false);
            setSuccess("");
          }, 1200);
        }

        await loadFuncionarios();
        await onRefreshData();
      } else {
        setError(result.message || "Ocorreu um erro ao salvar.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha de rede ao registar funcionário.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Atenção: Ao remover o funcionário, a sua conta de utilizador associada também será eliminada permanentemente. Continuar?")) return;
    try {
      const res = await fetch(`/api/funcionarios/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess("Funcionário e conta associada removidos com sucesso.");
        loadFuncionarios();
        onRefreshData();
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(result.message || "Erro ao remover funcionário.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar ao servidor.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Credenciais copiadas com sucesso!");
  };

  // Filter
  const filteredFuncionarios = funcionarios.filter(f => {
    const cargoLower = (f.cargo || "").toLowerCase();
    const filterLower = filterRole.toLowerCase();

    const matchesRole = filterRole === "" || 
      (filterRole === "Motorista" && cargoLower.includes("motorista")) ||
      (filterRole === "RH" && (cargoLower.includes("rh") || cargoLower.includes("recursos"))) ||
      (filterRole === "Administração" && cargoLower.includes("administra")) ||
      (filterRole === "IT" && (cargoLower.includes("it") || cargoLower.includes("admin"))) ||
      (filterRole === "Mecânico" && cargoLower.includes("mec")) ||
      (filterRole === "Outro" && !cargoLower.includes("motorista") && !cargoLower.includes("rh") && !cargoLower.includes("recursos") && !cargoLower.includes("administra") && !cargoLower.includes("it") && !cargoLower.includes("mec"));

    return (
      (f.nome || "").toLowerCase().includes(filterName.toLowerCase()) &&
      matchesRole
    );
  });

  const canEdit = currentUser.role === "admin" || currentUser.role === "administracao";

  return (
    <div className="space-y-6" id="funcionarios-tab-container">
      
      {/* Tab Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-rhino-pink" />
            DIRECTÓRIO DE FUNCIONÁRIOS
          </h1>
          <p className="text-xs text-slate-400">
            Registo unificado de pessoal, gestão de salários-base, e emissão automática de credenciais de acesso.
          </p>
        </div>

        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rhino-pink/10 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Funcionário
          </button>
        )}
      </div>

      {/* Directory filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-rhino-card p-4 rounded-xl border border-rhino-border no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar funcionário por nome..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full bg-rhino-dark/60 border border-rhino-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rhino-pink transition-colors"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-rhino-dark/60 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
        >
          <option value="">Todos Departamentos</option>
          <option value="Motorista">Motoristas</option>
          <option value="RH">Recursos Humanos (RH)</option>
          <option value="Administração">Administração</option>
          <option value="IT">IT / Engenharia</option>
          <option value="Mecânico">Mecânicos</option>
          <option value="Outro">Outros Cargos</option>
        </select>
      </div>

      {/* Alert display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid listing */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Carregando dados de funcionários...</div>
      ) : filteredFuncionarios.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-rhino-card border border-rhino-border rounded-xl">
          Nenhum funcionário encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFuncionarios.map((f) => {
            const isDriver = (f.cargo || "").toLowerCase().includes("motorista");
            return (
              <div 
                key={f.id} 
                className={`bg-rhino-card border ${f.ativo ? 'border-rhino-border' : 'border-rose-500/30 opacity-70'} p-5 rounded-xl relative overflow-hidden flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-950 border border-rhino-border text-slate-400 group-hover:text-rhino-pink transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm line-clamp-1">{f.nome}</h3>
                        <span className="text-[10px] text-rhino-pink font-bold uppercase tracking-wide">{f.cargo}</span>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                      f.ativo ? "bg-rhino-green/15 text-rhino-green" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {f.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 font-sans border-t border-rhino-border/40 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-white font-mono">{f.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Telefone:</span>
                      <span className="text-white font-mono">{f.telefone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">BI:</span>
                      <span className="text-white font-mono">{f.bi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Salário Base:</span>
                      <span className="text-rhino-green font-mono font-bold">{(f.salario_base || 0).toLocaleString("pt-MZ")} MZN</span>
                    </div>
                    
                    {isDriver && f.carta_conducao && (
                      <div className="p-2 bg-slate-950/40 rounded border border-rhino-border/40 space-y-1 mt-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Carta:</span>
                          <span className="text-slate-300 font-mono font-bold">{f.carta_conducao} ({f.categoria_carta})</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Validade:</span>
                          <span className="text-amber-500 font-mono">{f.validade_carta}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-rhino-border/40 pt-3 mt-4">
                  <div className="text-[10px] text-slate-500">
                    Admissão: <span className="font-mono text-slate-300">{f.data_admissao || "N/A"}</span>
                  </div>

                  {canEdit && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-1.5 rounded bg-rhino-muted text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                        title="Editar Detalhes"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title="Eliminar Funcionário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rhino-card border border-rhino-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4.5 bg-slate-950 border-b border-rhino-border/60 flex justify-between items-center">
                <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-rhino-pink" />
                  {editingFunc ? "EDITAR DETALHES DO FUNCIONÁRIO" : "REGISTAR NOVO FUNCIONÁRIO"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-6 space-y-5 flex-1">
                {createdCredentials ? (
                  // Credentials Display on Success (ONLY on Add)
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h4 className="text-white font-bold text-base">Acesso do Funcionário Criado!</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      As credenciais de login foram geradas automaticamente de acordo com as especificações (nome do utilizador e senha padrão):
                    </p>

                    <div className="bg-slate-950 p-4 rounded-lg border border-rhino-border max-w-sm mx-auto space-y-2.5 text-left font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Utilizador:</span>
                        <span className="text-white font-bold">{createdCredentials.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Palavra-passe:</span>
                        <span className="text-rhino-pink font-bold">{createdCredentials.pass}</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => copyToClipboard(`Utilizador: ${createdCredentials.username}\nSenha: ${createdCredentials.pass}`)}
                        className="px-3 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:text-white hover:bg-slate-750 transition-all cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Credenciais
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    {/* Basic employee Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Walter Juvêncio"
                          value={form.nome}
                          onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Função / Cargo *</label>
                        <select
                          value={form.cargo}
                          onChange={(e) => setForm(p => ({ ...p, cargo: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                        >
                          {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Corporativo / Geral *</label>
                        <input
                          type="email"
                          required
                          placeholder="walter@rhinocargo.com"
                          value={form.email}
                          onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Telemóvel *</label>
                        <input
                          type="text"
                          required
                          placeholder="+258 84..."
                          value={form.telefone}
                          onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nº Bilhete Identidade (BI)</label>
                        <input
                          type="text"
                          placeholder="Ex: 110204..."
                          value={form.bi}
                          onChange={(e) => setForm(p => ({ ...p, bi: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nuit</label>
                        <input
                          type="text"
                          placeholder="NIF / NUIT Moçambique"
                          value={form.nuit}
                          onChange={(e) => setForm(p => ({ ...p, nuit: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Salário Base (MZN)</label>
                        <input
                          type="number"
                          value={form.salario_base}
                          onChange={(e) => setForm(p => ({ ...p, salario_base: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Data de Admissão</label>
                        <input
                          type="date"
                          value={form.data_admissao}
                          onChange={(e) => setForm(p => ({ ...p, data_admissao: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink font-mono"
                        />
                      </div>
                    </div>

                    {/* Driver details section, conditionally expanded if cargo is Motorista */}
                    {form.cargo.toLowerCase().includes("motorista") && (
                      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                        <span className="text-[10px] font-black text-rhino-pink uppercase block tracking-wider">Dados de Carta de Condução (Necessário para Motoristas)</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Nº Carta</label>
                            <input
                              type="text"
                              value={form.carta_conducao}
                              onChange={(e) => setForm(p => ({ ...p, carta_conducao: e.target.value }))}
                              className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rhino-pink"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Validade</label>
                            <input
                              type="date"
                              value={form.validade_carta}
                              onChange={(e) => setForm(p => ({ ...p, validade_carta: e.target.value }))}
                              className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Categoria</label>
                            <input
                              type="text"
                              placeholder="Ex: C, CE"
                              value={form.categoria_carta}
                              onChange={(e) => setForm(p => ({ ...p, categoria_carta: e.target.value }))}
                              className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Employer Company Details (Customizable) */}
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-rhino-border/40 space-y-3">
                      <span className="text-[10px] font-black text-rhino-pink uppercase block tracking-wider">
                        Dados da Empresa Empregadora (Para Recibos de Salários Personalizados)
                      </span>
                      <p className="text-[10px] text-slate-400 -mt-1 leading-normal">
                        Caso este colaborador pertença a uma outra empresa, altere os dados abaixo. O recibo de vencimento será emitido com estas informações.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Nome da Empresa</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Rhino Cargo, Lda"
                            value={form.empresa_nome}
                            onChange={(e) => setForm(p => ({ ...p, empresa_nome: e.target.value }))}
                            className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rhino-pink font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">NUIT da Empresa</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 400582914"
                            value={form.empresa_nuit}
                            onChange={(e) => setForm(p => ({ ...p, empresa_nuit: e.target.value }))}
                            className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rhino-pink font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Localização / Endereço da Empresa</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Porto de Maputo, Recinto Portuário, Maputo..."
                          value={form.empresa_localizacao}
                          onChange={(e) => setForm(p => ({ ...p, empresa_localizacao: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rhino-pink font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Ativo Status */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Estado do Funcionário</label>
                        <select
                          value={form.ativo}
                          onChange={(e) => setForm(p => ({ ...p, ativo: Number(e.target.value) }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                        >
                          <option value="1">Ativo / Operacional</option>
                          <option value="0">Suspenso / Inativo</option>
                        </select>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Observações / Anotações</label>
                      <textarea
                        rows={2}
                        placeholder="Contatos de emergência, registos de exames médicos, ou observações contratuais..."
                        value={form.observacoes}
                        onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))}
                        className="w-full bg-slate-950 border border-rhino-border rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                      />
                    </div>

                    {/* Form Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-rhino-border/60">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white rounded-lg transition-all cursor-pointer"
                      >
                        {saving ? "Salvando..." : editingFunc ? "Salvar Alterações" : "Adicionar e Criar Acesso"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
