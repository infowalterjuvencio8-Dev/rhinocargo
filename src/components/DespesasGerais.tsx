import React, { useState, useEffect } from "react";
import { 
  Coins, Search, Filter, X, Edit, Trash2, Calendar, 
  User, Briefcase, Plus, CheckCircle, AlertTriangle, Printer 
} from "lucide-react";
import { DespesaGeral, Funcionario, Viatura, Usuario } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DespesasGeraisProps {
  viaturas: Viatura[];
  currentUser: Usuario;
  onRefreshData: () => Promise<void>;
}

export default function DespesasGerais({ 
  viaturas, 
  currentUser, 
  onRefreshData 
}: DespesasGeraisProps) {
  const [despesas, setDespesas] = useState<DespesaGeral[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter States
  const [filterDesc, setFilterDesc] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // CRUD Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<DespesaGeral | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    descricao: "",
    categoria: "Manutenção",
    valor: "",
    data_despesa: new Date().toISOString().split("T")[0],
    funcionario_id: "",
    viatura_id: "",
    estado: "Pago",
    observacoes: ""
  });

  const categories = ["Manutenção", "Salários", "Impostos", "Escritório", "Aluguer", "Combustível Extra", "Outros"];

  const loadData = async () => {
    setLoading(true);
    try {
      const [resExp, resFunc] = await Promise.all([
        fetch("/api/despesas_gerais"),
        fetch("/api/funcionarios")
      ]);
      if (resExp.ok && resFunc.ok) {
        const dataExp = await resExp.json();
        const dataFunc = await resFunc.json();
        setDespesas(dataExp);
        setFuncionarios(dataFunc);
      } else {
        setError("Erro ao carregar dados do servidor.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha na comunicação com a base de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDespesa(null);
    setForm({
      descricao: "",
      categoria: "Manutenção",
      valor: "",
      data_despesa: new Date().toISOString().split("T")[0],
      funcionario_id: "",
      viatura_id: "",
      estado: "Pago",
      observacoes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DespesaGeral) => {
    setEditingDespesa(d);
    setForm({
      descricao: d.descricao,
      categoria: d.categoria,
      valor: String(d.valor),
      data_despesa: d.data_despesa,
      funcionario_id: d.funcionario_id ? String(d.funcionario_id) : "",
      viatura_id: d.viatura_id ? String(d.viatura_id) : "",
      estado: d.estado,
      observacoes: d.observacoes || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) {
      setError("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      descricao: form.descricao,
      categoria: form.categoria,
      valor: Number(form.valor),
      data_despesa: form.data_despesa,
      funcionario_id: form.funcionario_id ? Number(form.funcionario_id) : null,
      viatura_id: form.viatura_id ? Number(form.viatura_id) : null,
      estado: form.estado,
      observacoes: form.observacoes
    };

    try {
      const url = editingDespesa ? `/api/despesas_gerais/${editingDespesa.id}` : "/api/despesas_gerais";
      const method = editingDespesa ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(editingDespesa ? "Despesa atualizada com sucesso!" : "Despesa registada com sucesso!");
        await loadData();
        await onRefreshData();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
        }, 1200);
      } else {
        setError(result.message || "Erro ao salvar a despesa.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar. Verifique a rede.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem a certeza que deseja remover esta despesa?")) return;
    try {
      const res = await fetch(`/api/despesas_gerais/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess("Despesa removida.");
        loadData();
        onRefreshData();
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(result.message || "Erro ao remover despesa.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar ao servidor.");
    }
  };

  // Filter despesas list
  const filteredDespesas = despesas.filter(d => {
    return (
      (d.descricao || "").toLowerCase().includes(filterDesc.toLowerCase()) &&
      (filterCat === "" || d.categoria === filterCat) &&
      (filterEstado === "" || d.estado === filterEstado)
    );
  });

  // Calculate totals
  const totalGeral = filteredDespesas.reduce((acc, d) => acc + d.valor, 0);
  const totalPago = filteredDespesas.filter(d => d.estado === "Pago").reduce((acc, d) => acc + d.valor, 0);
  const totalPendente = filteredDespesas.filter(d => d.estado === "Pendente").reduce((acc, d) => acc + d.valor, 0);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Manutenção": return "bg-rhino-blue/15 text-rhino-blue border border-rhino-blue/30";
      case "Salários": return "bg-rhino-green/15 text-rhino-green border border-rhino-green/30";
      case "Impostos": return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
      case "Escritório": return "bg-slate-500/15 text-slate-300 border border-slate-500/20";
      case "Aluguer": return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      default: return "bg-rhino-pink/15 text-rhino-pink border border-rhino-pink/30";
    }
  };

  const isHR = currentUser.role === "rh";
  const canEdit = currentUser.role === "admin" || currentUser.role === "administracao";

  return (
    <div className="space-y-6" id="despesas-gerais-subtab">
      
      {/* 1. Quick Info stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total de Custos Gerais</span>
          <span className="text-xl font-mono font-black text-white block mt-1">
            {totalGeral.toLocaleString("pt-MZ")} MZN
          </span>
          <span className="text-[9px] text-slate-500">Filtrado das despesas gerais</span>
        </div>

        <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Liquidado (Pago)</span>
          <span className="text-xl font-mono font-black text-rhino-green block mt-1">
            {totalPago.toLocaleString("pt-MZ")} MZN
          </span>
          <span className="text-[9px] text-rhino-green">Pagamentos concluídos</span>
        </div>

        <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Pendente</span>
          <span className="text-xl font-mono font-black text-amber-500 block mt-1">
            {totalPendente.toLocaleString("pt-MZ")} MZN
          </span>
          <span className="text-[9px] text-amber-500">Compromissos em aberto</span>
        </div>
      </div>

      {/* 2. Actions & Filter row */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between no-print bg-rhino-card p-4 rounded-xl border border-rhino-border">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Description Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar despesa..."
              value={filterDesc}
              onChange={(e) => setFilterDesc(e.target.value)}
              className="w-full bg-rhino-dark/60 border border-rhino-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rhino-pink transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-rhino-dark/60 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
          >
            <option value="">Todas Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Estado Filter */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-rhino-dark/60 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
          >
            <option value="">Todos Estados</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>

          {(filterDesc || filterCat || filterEstado) && (
            <button
              onClick={() => { setFilterDesc(""); setFilterCat(""); setFilterEstado(""); }}
              className="p-2 text-xs font-bold text-rose-400 hover:text-white flex items-center gap-1 cursor-pointer bg-rose-500/10 border border-rose-500/20 rounded-lg"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rhino-pink/10"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </button>
        )}
      </div>

      {/* Alert feeds */}
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

      {/* 3. Main Data Table / List */}
      <div className="bg-rhino-card border border-rhino-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Carregando despesas gerais...</div>
        ) : filteredDespesas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">Nenhuma despesa geral encontrada com os filtros selecionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rhino-border/60 bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Funcionário</th>
                  <th className="p-4">Viatura</th>
                  <th className="p-4">Estado</th>
                  {canEdit && <th className="p-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-rhino-border/40 text-xs">
                {filteredDespesas.map((d) => (
                  <tr key={d.id} className="hover:bg-rhino-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white block">{d.descricao}</span>
                      {d.observacoes && <span className="text-[10px] text-slate-400 block mt-0.5">{d.observacoes}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getCategoryColor(d.categoria)}`}>
                        {d.categoria}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {d.valor.toLocaleString("pt-MZ")} MZN
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      {d.data_despesa}
                    </td>
                    <td className="p-4 text-slate-300">
                      {d.funcionario_nome ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-rhino-pink" />
                          {d.funcionario_nome}
                        </span>
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      {d.viatura_matricula ? d.viatura_matricula : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        d.estado === "Pago" 
                          ? "bg-rhino-green/15 text-rhino-green" 
                          : "bg-amber-500/15 text-amber-500"
                      }`}>
                        {d.estado}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 rounded bg-rhino-muted text-slate-300 hover:text-white transition-all cursor-pointer hover:bg-slate-700"
                            title="Editar Despesa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            title="Eliminar Despesa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rhino-card border border-rhino-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-4.5 bg-slate-950 border-b border-rhino-border/60 flex justify-between items-center">
                <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                  <Coins className="h-4 w-4 text-rhino-pink" />
                  {editingDespesa ? "EDITAR CUSTO GERAL" : "REGISTAR NOVA DESPESA GERAL"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Descrição do Custo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Compra de Óleo Hidráulico, Resmas de Papel, Aluguer Escritório..."
                    value={form.descricao}
                    onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))}
                    className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Categoria */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Categoria *</label>
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm(p => ({ ...p, categoria: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Valor (MZN) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Valor em MZN"
                      value={form.valor}
                      onChange={(e) => setForm(p => ({ ...p, valor: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Data de Despesa *</label>
                    <input
                      type="date"
                      required
                      value={form.data_despesa}
                      onChange={(e) => setForm(p => ({ ...p, data_despesa: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink font-mono"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Estado de Pagamento</label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm(p => ({ ...p, estado: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Linked Employee */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Funcionário Relacionado</label>
                    <select
                      value={form.funcionario_id}
                      onChange={(e) => setForm(p => ({ ...p, funcionario_id: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="">Nenhum</option>
                      {funcionarios.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                      ))}
                    </select>
                  </div>

                  {/* Linked Vehicle */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Viatura Relacionada</label>
                    <select
                      value={form.viatura_id}
                      onChange={(e) => setForm(p => ({ ...p, viatura_id: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="">Nenhuma</option>
                      {viaturas.map(v => (
                        <option key={v.id} value={v.id}>{v.matricula} ({v.marca} {v.modelo})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notas / Observações */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Notas Adicionais</label>
                  <textarea
                    rows={2}
                    placeholder="Outros detalhes explicativos ou referências de faturas..."
                    value={form.observacoes}
                    onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))}
                    className="w-full bg-slate-950 border border-rhino-border rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </div>

                {/* Form actions */}
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
                    className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : editingDespesa ? "Salvar Alterações" : "Adicionar Despesa"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
