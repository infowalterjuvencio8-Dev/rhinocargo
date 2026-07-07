import React, { useState } from "react";
import { 
  Coins, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Printer, 
  Calendar, 
  MapPin, 
  User, 
  AlertTriangle, 
  FileSpreadsheet, 
  Fuel, 
  ShieldCheck, 
  DollarSign, 
  Briefcase,
  AlertCircle,
  Truck,
  ArrowUpDown,
  CreditCard,
  Plus
} from "lucide-react";
import { Viagem, Usuario, Viatura, Motorista, Abastecimento } from "../types";
import DespesasGerais from "./DespesasGerais";

interface DespesasProps {
  viagens: Viagem[];
  viaturas: Viatura[];
  motoristas: Motorista[];
  abastecimentos: Abastecimento[];
  currentUser: Usuario;
  onRefreshData: () => Promise<void>;
}

export default function Despesas({ 
  viagens, 
  viaturas, 
  motoristas, 
  abastecimentos,
  currentUser, 
  onRefreshData 
}: DespesasProps) {
  
  // Tab/View selector: "viagens" (trip expenses), "abastecimentos" (fuel logs) or "gerais" (general company expenses)
  const [activeSubTab, setActiveSubTab] = useState<"viagens" | "abastecimentos" | "gerais">("viagens");

  // Filters for Trip Expenses
  const [viagemFilters, setViagemFilters] = useState({
    numero_viagem: "",
    motorista_nome: "",
    viatura_matricula: "",
    min_total: "",
    max_total: ""
  });

  // Filters for Fuel Logs
  const [abastecimentoFilters, setAbastecimentoFilters] = useState({
    viatura_matricula: "",
    bomba_name: "",
    provincia: "",
    viagem: ""
  });

  // Modal States
  const [editingTrip, setEditingTrip] = useState<Viagem | null>(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    total_combustivel_mzn: 0,
    intermediacao_mzn: 0,
    escolta_mzn: 0,
    quebras_faltas_mzn: 0,
    observacoes: ""
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const handleViagemFilterChange = (key: keyof typeof viagemFilters, value: string) => {
    setViagemFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAbastecimentoFilterChange = (key: keyof typeof abastecimentoFilters, value: string) => {
    setAbastecimentoFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearViagemFilters = () => {
    setViagemFilters({
      numero_viagem: "",
      motorista_nome: "",
      viatura_matricula: "",
      min_total: "",
      max_total: ""
    });
  };

  const clearAbastecimentoFilters = () => {
    setAbastecimentoFilters({
      viatura_matricula: "",
      bomba_name: "",
      provincia: "",
      viagem: ""
    });
  };

  // Filtered Voyages Expenses
  const filteredViagens = viagens.filter(t => {
    const totalDespesas = (t.total_combustivel_mzn || 0) + 
                          (t.intermediacao_mzn || 0) + 
                          (t.escolta_mzn || 0) + 
                          (t.quebras_faltas_mzn || 0);

    const minMatch = viagemFilters.min_total === "" || totalDespesas >= Number(viagemFilters.min_total);
    const maxMatch = viagemFilters.max_total === "" || totalDespesas <= Number(viagemFilters.max_total);

    return (
      (t.numero_viagem || "").toLowerCase().includes(viagemFilters.numero_viagem.toLowerCase()) &&
      (t.motorista_nome || "").toLowerCase().includes(viagemFilters.motorista_nome.toLowerCase()) &&
      (t.viatura_matricula || "").toLowerCase().includes(viagemFilters.viatura_matricula.toLowerCase()) &&
      minMatch && maxMatch
    );
  });

  // Filtered Fuel Logs
  const filteredAbastecimentos = abastecimentos.filter(a => {
    return (
      (a.viatura_matricula || "").toLowerCase().includes(abastecimentoFilters.viatura_matricula.toLowerCase()) &&
      (a.bomba_name || "").toLowerCase().includes(abastecimentoFilters.bomba_name.toLowerCase()) &&
      (a.provincia || "").toLowerCase().includes(abastecimentoFilters.provincia.toLowerCase()) &&
      (a.viagem || "").toLowerCase().includes(abastecimentoFilters.viagem.toLowerCase())
    );
  });

  // Calculations for Trip Expenses
  const totalFuel = filteredViagens.reduce((sum, t) => sum + (t.total_combustivel_mzn || 0), 0);
  const totalIntermed = filteredViagens.reduce((sum, t) => sum + (t.intermediacao_mzn || 0), 0);
  const totalEscolta = filteredViagens.reduce((sum, t) => sum + (t.escolta_mzn || 0), 0);
  const totalQuebras = filteredViagens.reduce((sum, t) => sum + (t.quebras_faltas_mzn || 0), 0);
  const grandTotalExpenses = totalFuel + totalIntermed + totalEscolta + totalQuebras;

  // Open Edit Modal
  const handleOpenEdit = (trip: Viagem) => {
    setEditingTrip(trip);
    setEditForm({
      total_combustivel_mzn: trip.total_combustivel_mzn || 0,
      intermediacao_mzn: trip.intermediacao_mzn || 0,
      escolta_mzn: trip.escolta_mzn || 0,
      quebras_faltas_mzn: trip.quebras_faltas_mzn || 0,
      observacoes: trip.observacoes || ""
    });
    setSaveError("");
    setSaveSuccess("");
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const res = await fetch(`/api/viagens/${editingTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // maintain existing details
          estado: editingTrip.estado,
          faturacao_mzn: editingTrip.faturacao_mzn,
          p_o: editingTrip.p_o || "",
          data_chegada: editingTrip.data_chegada || new Date().toISOString().substring(0, 16),
          origem_combustivel: editingTrip.origem_combustivel || "",
          
          // actual updated expenses
          total_combustivel_mzn: editForm.total_combustivel_mzn,
          intermediacao_mzn: editForm.intermediacao_mzn,
          escolta_mzn: editForm.escolta_mzn,
          quebras_faltas_mzn: editForm.quebras_faltas_mzn,
          observacoes: editForm.observacoes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar alterações das despesas.");
      }

      setSaveSuccess("Dados de despesa atualizados com sucesso!");
      await onRefreshData();
      
      setTimeout(() => {
        setEditingTrip(null);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Houve um problema ao atualizar despesas.");
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportExpensesToCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    if (activeSubTab === "viagens") {
      headers = [
        "Nº Viagem", "Motorista", "Viatura", "Combustível (MZN)", 
        "Intermediação (MZN)", "Escolta (MZN)", "Quebras/Faltas (MZN)", "Total Despesas (MZN)"
      ];
      rows = filteredViagens.map(t => [
        t.numero_viagem,
        t.motorista_nome,
        t.viatura_matricula,
        t.total_combustivel_mzn,
        t.intermediacao_mzn,
        t.escolta_mzn,
        t.quebras_faltas_mzn,
        (t.total_combustivel_mzn + t.intermediacao_mzn + t.escolta_mzn + t.quebras_faltas_mzn)
      ]);
      filename = `Despesas_Viagem_${new Date().toISOString().slice(0,10)}.csv`;
    } else {
      headers = [
        "Viatura", "Nº Viagem", "Bomba", "Província", 
        "Litros Bomba", "Valor Combustível (MZN)", "Data"
      ];
      rows = filteredAbastecimentos.map(a => [
        a.viatura_matricula,
        a.viagem || "Sem Viagem",
        a.bomba_name,
        a.provincia,
        a.bomba_litros,
        a.valor_combustivel,
        a.data_abastecimento
      ]);
      filename = `Abastecimentos_${new Date().toISOString().slice(0,10)}.csv`;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="despesas-tab-container">
      
      {/* Tab Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-rhino-pink" />
            GESTOR DE DESPESAS
          </h1>
          <p className="text-xs text-slate-400">
            Controle analítico de combustível, taxas de intermediação, escoltas rodoviárias e multas/quebras.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSubTab === "viagens" ? (
            <button 
              onClick={clearViagemFilters}
              className="px-3 py-2 rounded-lg bg-rhino-muted hover:bg-rhino-muted/80 text-xs text-slate-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rhino-border"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </button>
          ) : (
            <button 
              onClick={clearAbastecimentoFilters}
              className="px-3 py-2 rounded-lg bg-rhino-muted hover:bg-rhino-muted/80 text-xs text-slate-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rhino-border"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </button>
          )}
          
          <button 
            onClick={exportExpensesToCSV}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rhino-pink/10"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className="flex flex-wrap items-center gap-2 bg-rhino-dark/60 p-1 rounded-lg border border-rhino-border w-fit no-print">
        <button
          onClick={() => setActiveSubTab("viagens")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "viagens" 
              ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Despesas por Viagem
        </button>
        <button
          onClick={() => setActiveSubTab("abastecimentos")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "abastecimentos" 
              ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Abastecimentos Detalhados
        </button>
        <button
          onClick={() => setActiveSubTab("gerais")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "gerais" 
              ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Custos Gerais de Empresa
        </button>
      </div>

      {/* Statistics Cards Row */}
      {activeSubTab === "viagens" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Total Despesas */}
          <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rhino-pink/5 rounded-full blur-xl" />
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total de Custos</span>
            <span className="text-xl font-mono font-black text-white block mt-1">
              {grandTotalExpenses.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[9px] text-rhino-pink font-mono">Custo operacional total</span>
          </div>

          {/* Combustível */}
          <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Combustível (Rotas)</span>
                <span className="text-xl font-mono font-black text-rhino-pink block mt-1">
                  {totalFuel.toLocaleString("pt-MZ")} MZN
                </span>
              </div>
              <div className="p-1.5 rounded bg-rhino-pink/15 text-rhino-pink text-[10px] font-bold">
                {grandTotalExpenses > 0 ? ((totalFuel / grandTotalExpenses) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-2">Dedicado a abastecimentos</span>
          </div>

          {/* Intermediação */}
          <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Intermediação</span>
                <span className="text-xl font-mono font-black text-amber-500 block mt-1">
                  {totalIntermed.toLocaleString("pt-MZ")} MZN
                </span>
              </div>
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                {grandTotalExpenses > 0 ? ((totalIntermed / grandTotalExpenses) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-2">Comissões e taxas locais</span>
          </div>

          {/* Escolta */}
          <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Escoltas</span>
                <span className="text-xl font-mono font-black text-rhino-blue block mt-1">
                  {totalEscolta.toLocaleString("pt-MZ")} MZN
                </span>
              </div>
              <div className="p-1.5 rounded bg-rhino-blue/15 text-rhino-blue text-[10px] font-bold">
                {grandTotalExpenses > 0 ? ((totalEscolta / grandTotalExpenses) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-2">Segurança armada e comboios</span>
          </div>

          {/* Quebras / Faltas */}
          <div className="bg-rhino-card border border-rhino-border p-4.5 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Quebras / Faltas</span>
                <span className="text-xl font-mono font-black text-purple-400 block mt-1">
                  {totalQuebras.toLocaleString("pt-MZ")} MZN
                </span>
              </div>
              <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                {grandTotalExpenses > 0 ? ((totalQuebras / grandTotalExpenses) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-2">Descontos e penalizações</span>
          </div>

        </div>
      )}

      {/* Visual Analytics Grid: Category Breakdown bars */}
      {activeSubTab === "viagens" && (
        <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 no-print">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4 text-xs uppercase tracking-wider text-slate-400">
            <ArrowUpDown className="h-4 w-4 text-rhino-pink" />
            Proporção de Custos Rodoviários
          </h3>
          <div className="space-y-3.5">
            {[
              { label: "Combustível de Rota", value: totalFuel, color: "bg-rhino-pink", text: "text-rhino-pink" },
              { label: "Serviço de Escolta", value: totalEscolta, color: "bg-rhino-blue", text: "text-rhino-blue" },
              { label: "Comissões de Intermediação", value: totalIntermed, color: "bg-amber-500", text: "text-amber-500" },
              { label: "Quebras, Roubos e Multas", value: totalQuebras, color: "bg-purple-500", text: "text-purple-400" }
            ].map((item, index) => {
              const pct = grandTotalExpenses > 0 ? (item.value / grandTotalExpenses) * 100 : 0;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-mono text-slate-400">
                      <span className={`${item.text} font-bold mr-2`}>{item.value.toLocaleString("pt-MZ")} MZN</span>
                      ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-rhino-dark rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content Section */}
      {activeSubTab === "viagens" && (
        
        /* VIEW 1: Expenses by Voyage */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-3.5">Viagem / ID</th>
                  <th className="p-3.5">Motorista</th>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5 text-right text-red-400">Combustível (MZN)</th>
                  <th className="p-3.5 text-right text-amber-500">Intermediação (MZN)</th>
                  <th className="p-3.5 text-right text-blue-400">Escolta (MZN)</th>
                  <th className="p-3.5 text-right text-purple-400">Quebras/Multas (MZN)</th>
                  <th className="p-3.5 text-right font-bold">Total Despesas</th>
                  <th className="p-3.5 text-center">Editar</th>
                </tr>

                {/* Filter Row */}
                <tr className="bg-slate-950/40 border-b border-slate-800/80">
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={viagemFilters.numero_viagem}
                      onChange={(e) => handleViagemFilterChange("numero_viagem", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={viagemFilters.motorista_nome}
                      onChange={(e) => handleViagemFilterChange("motorista_nome", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={viagemFilters.viatura_matricula}
                      onChange={(e) => handleViagemFilterChange("viatura_matricula", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </td>
                  <td className="p-2" colSpan={4}>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Intervalo Total:</span>
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={viagemFilters.min_total}
                        onChange={(e) => handleViagemFilterChange("min_total", e.target.value)}
                        className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-right text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                      <span className="text-slate-600">-</span>
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={viagemFilters.max_total}
                        onChange={(e) => handleViagemFilterChange("max_total", e.target.value)}
                        className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-right text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </td>
                  <td className="p-2" colSpan={2}></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredViagens.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Nenhuma despesa ou viagem encontrada com estes filtros.
                    </td>
                  </tr>
                ) : (
                  filteredViagens.map(t => {
                    const rowTotal = (t.total_combustivel_mzn || 0) + 
                                     (t.intermediacao_mzn || 0) + 
                                     (t.escolta_mzn || 0) + 
                                     (t.quebras_faltas_mzn || 0);
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-all font-sans">
                        <td className="p-3.5 font-mono font-bold text-white tracking-wider">
                          {t.numero_viagem}
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {t.motorista_nome}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {t.viatura_matricula}
                        </td>
                        <td className="p-3.5 text-right font-mono text-red-400 font-semibold">
                          {t.total_combustivel_mzn.toLocaleString("pt-MZ")} MZN
                        </td>
                        <td className="p-3.5 text-right font-mono text-amber-500">
                          {t.intermediacao_mzn.toLocaleString("pt-MZ")} MZN
                        </td>
                        <td className="p-3.5 text-right font-mono text-blue-400">
                          {t.escolta_mzn.toLocaleString("pt-MZ")} MZN
                        </td>
                        <td className="p-3.5 text-right font-mono text-purple-400">
                          {t.quebras_faltas_mzn.toLocaleString("pt-MZ")} MZN
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-white bg-slate-950/20">
                          {rowTotal.toLocaleString("pt-MZ")} MZN
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Ajustar despesas da viagem"
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "abastecimentos" && (
        
        /* VIEW 2: Detailed Fuel logs */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5 font-mono">Viagem Ref</th>
                  <th className="p-3.5">Bomba / Posto</th>
                  <th className="p-3.5">Província</th>
                  <th className="p-3.5 text-right">Litros Bomba</th>
                  <th className="p-3.5 text-right text-red-400">Valor Abastecimento</th>
                  <th className="p-3.5 text-right">Preço Unitário</th>
                  <th className="p-3.5">Data Registo</th>
                </tr>

                {/* Filters */}
                <tr className="bg-slate-950/40 border-b border-slate-800/80">
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Matrícula..."
                      value={abastecimentoFilters.viatura_matricula}
                      onChange={(e) => handleAbastecimentoFilterChange("viatura_matricula", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Viagem..."
                      value={abastecimentoFilters.viagem}
                      onChange={(e) => handleAbastecimentoFilterChange("viagem", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Bomba..."
                      value={abastecimentoFilters.bomba_name}
                      onChange={(e) => handleAbastecimentoFilterChange("bomba_name", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Província..."
                      value={abastecimentoFilters.provincia}
                      onChange={(e) => handleAbastecimentoFilterChange("provincia", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td colSpan={4} className="p-2"></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAbastecimentos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhum registo de abastecimento de combustível encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredAbastecimentos.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="p-3.5 font-mono font-bold text-white">
                        {a.viatura_matricula}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {a.viagem || <span className="text-slate-600 italic">Geral / Frota</span>}
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {a.bomba_name}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {a.provincia}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {a.bomba_litros.toLocaleString()} L
                      </td>
                      <td className="p-3.5 text-right font-mono text-red-400 font-bold">
                        {a.valor_combustivel.toLocaleString("pt-MZ")} MZN
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-500">
                        {a.valor_unitario.toFixed(2)} MZN/L
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        {a.data_abastecimento.replace("T", " ")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "gerais" && (
        <DespesasGerais 
          viaturas={viaturas}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
        />
      )}

      {/* EDIT EXPENSES MODAL */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-red-500/10 text-red-500">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Ajustar Despesas de Viagem</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID da Viagem: {editingTrip.numero_viagem}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTrip(null)}
                className="text-slate-400 hover:text-white transition-all p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              
              {saveError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Custo Combustivel */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Custo Combustível (MZN)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editForm.total_combustivel_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, total_combustivel_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Intermediação */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Intermediação (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.intermediacao_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, intermediacao_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Escolta */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Escolta Rodoviária (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.escolta_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, escolta_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Quebras / Faltas */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Quebras / Penalizações (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.quebras_faltas_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, quebras_faltas_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

              </div>

              {/* Observações */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Notas de Despesa</label>
                <textarea
                  rows={2}
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Justificativa ou recibos de custos operacionais adicionais..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Summary */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Combustível:</span>
                  <span className="text-red-400">{editForm.total_combustivel_mzn.toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Outros Custos Combinados:</span>
                  <span className="text-amber-500">{(editForm.intermediacao_mzn + editForm.escolta_mzn + editForm.quebras_faltas_mzn).toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div className="border-t border-slate-800/80 pt-1.5 flex justify-between font-bold text-white text-[12px]">
                  <span>Total Despesas de Viagem:</span>
                  <span className="text-red-400">
                    {(editForm.total_combustivel_mzn + editForm.intermediacao_mzn + editForm.escolta_mzn + editForm.quebras_faltas_mzn).toLocaleString("pt-MZ")} MZN
                  </span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-750 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-red-500/10"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Helper check icon
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
