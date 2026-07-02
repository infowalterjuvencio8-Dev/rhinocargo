import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Truck, Plus, Edit, Trash2, Search, X, CheckCircle2, 
  AlertCircle, Settings, FileSpreadsheet 
} from "lucide-react";
import { Viatura, Usuario } from "../types";

interface ViaturasProps {
  viaturas: Viatura[];
  currentUser: Usuario | null;
  onRefreshData: () => void;
}

export default function Viaturas({ viaturas, currentUser, onRefreshData }: ViaturasProps) {
  const isAdmin = currentUser?.role === "admin";

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Column Filters State
  const [filters, setFilters] = useState({
    matricula: "",
    marca: "",
    modelo: "",
    tipo: "",
    combustivel: "",
    estado: "",
    km_atual: "",
    capacidade: ""
  });

  // Vehicle Form State
  const [formState, setFormState] = useState({
    id: 0,
    matricula: "",
    marca: "",
    modelo: "",
    tipo: "Camião Porta Contentor",
    ano: new Date().getFullYear(),
    kilometragem: 0,
    km_atual: 0,
    capacidade: 700,
    combustivel: "Diesel",
    estado: "Disponível",
    observacoes: ""
  });

  const handleFilterChange = (col: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };

  const clearFilters = () => {
    setFilters({
      matricula: "",
      marca: "",
      modelo: "",
      tipo: "",
      combustivel: "",
      estado: "",
      km_atual: "",
      capacidade: ""
    });
  };

  // Filtered List
  const filteredViaturas = viaturas.filter(v => {
    return (
      (v.matricula || "").toLowerCase().includes(filters.matricula.toLowerCase()) &&
      (v.marca || "").toLowerCase().includes(filters.marca.toLowerCase()) &&
      (v.modelo || "").toLowerCase().includes(filters.modelo.toLowerCase()) &&
      (v.tipo || "").toLowerCase().includes(filters.tipo.toLowerCase()) &&
      (v.combustivel || "").toLowerCase().includes(filters.combustivel.toLowerCase()) &&
      (v.estado || "").toLowerCase().includes(filters.estado.toLowerCase()) &&
      (v.km_atual.toString()).includes(filters.km_atual) &&
      (v.capacidade.toString()).includes(filters.capacidade)
    );
  });

  // Export to Excel/CSV
  const exportToExcel = () => {
    const headers = ["ID", "Matrícula", "Marca", "Modelo", "Tipo", "Ano", "KM Inicial", "KM Atual", "Capacidade Tanque (L)", "Combustível", "Estado", "Observações"];
    const rows = filteredViaturas.map(v => [
      v.id, v.matricula, v.marca, v.modelo, v.tipo, v.ano, v.kilometragem, v.km_atual, v.capacidade, v.combustivel, v.estado, v.observacoes || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RhinoCargo_Frota_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Create Form
  const triggerCreate = () => {
    setIsEditing(false);
    setFormState({
      id: 0,
      matricula: "",
      marca: "",
      modelo: "",
      tipo: "Camião Porta Contentor",
      ano: new Date().getFullYear(),
      kilometragem: 0,
      km_atual: 0,
      capacidade: 700,
      combustivel: "Diesel",
      estado: "Disponível",
      observacoes: ""
    });
    setModalOpen(true);
  };

  // Open Edit Form
  const triggerEdit = (v: Viatura) => {
    setIsEditing(true);
    setFormState({
      id: v.id,
      matricula: v.matricula,
      marca: v.marca,
      modelo: v.modelo,
      tipo: v.tipo,
      ano: v.ano,
      kilometragem: v.kilometragem,
      km_atual: v.km_atual,
      capacidade: v.capacidade,
      combustivel: v.combustivel,
      estado: v.estado,
      observacoes: v.observacoes || ""
    });
    setModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/viaturas/${formState.id}` : "/api/viaturas";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState)
      });

      if (response.ok) {
        setModalOpen(false);
        onRefreshData();
      } else {
        const err = await response.json();
        alert(`Erro ao salvar viatura: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao servidor.");
    }
  };

  // Delete vehicle
  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente remover esta viatura? Todos os históricos associados podem perder a integridade estrutural.")) return;

    try {
      const response = await fetch(`/api/viaturas/${id}`, { method: "DELETE" });
      if (response.ok) {
        onRefreshData();
      } else {
        const err = await response.json();
        alert(`Erro ao remover: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="space-y-6" id="viaturas-tab-content">
      {/* Header and top commands */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-amber-500 h-5 w-5" />
            <span>Gestão de Frota (Viaturas)</span>
          </h2>
          <p className="text-xs text-slate-400">Gerencie caminhões, utilitários, faturamento técnico, combustível de suporte e estado.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={clearFilters}
            className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2 px-3 rounded-lg cursor-pointer"
          >
            Limpar Filtros
          </button>
          <button
            onClick={exportToExcel}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2 px-3.5 flex items-center gap-1.5 cursor-pointer rounded-lg"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={triggerCreate}
            className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Viatura</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden print-card">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 whitespace-nowrap">Matrícula</th>
                <th className="p-3.5 whitespace-nowrap">Marca / Modelo</th>
                <th className="p-3.5 whitespace-nowrap">Tipo de Veículo</th>
                <th className="p-3.5 whitespace-nowrap text-right">KM Atual</th>
                <th className="p-3.5 whitespace-nowrap text-right">Tanque (L)</th>
                <th className="p-3.5 whitespace-nowrap text-center">Combustível</th>
                <th className="p-3.5 whitespace-nowrap text-center">Estado</th>
                <th className="p-3.5 whitespace-nowrap text-center no-print">Ações</th>
              </tr>

              {/* Column Filters row */}
              <tr className="bg-slate-900/60 border-b border-slate-800/40 no-print">
                <td className="p-1 font-mono">
                  <input
                    type="text"
                    placeholder="Matrícula..."
                    value={filters.matricula}
                    onChange={(e) => handleFilterChange("matricula", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Marca..."
                      value={filters.marca}
                      onChange={(e) => handleFilterChange("marca", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Modelo..."
                      value={filters.modelo}
                      onChange={(e) => handleFilterChange("modelo", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Tipo..."
                    value={filters.tipo}
                    onChange={(e) => handleFilterChange("tipo", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="KM..."
                    value={filters.km_atual}
                    onChange={(e) => handleFilterChange("km_atual", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Litros..."
                    value={filters.capacidade}
                    onChange={(e) => handleFilterChange("capacidade", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Combustível..."
                    value={filters.combustivel}
                    onChange={(e) => handleFilterChange("combustivel", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-center text-white placeholder-slate-600 focus:outline-none"
                  />
                </td>
                <td className="p-1">
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange("estado", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Em Viagem">Em Viagem</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </td>
                <td className="p-1 no-print"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {filteredViaturas.map(v => {
                const isAvailable = v.estado === "Disponível";
                const isDriving = v.estado === "Em Viagem";

                return (
                  <tr key={v.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">{v.matricula}</td>
                    <td className="p-3.5 font-sans whitespace-nowrap">
                      <div className="font-semibold text-white">{v.marca}</div>
                      <div className="text-[10px] text-slate-500">{v.modelo} • {v.ano}</div>
                    </td>
                    <td className="p-3.5 font-sans whitespace-nowrap text-slate-400">{v.tipo}</td>
                    <td className="p-3.5 text-right font-bold text-white whitespace-nowrap">{v.km_atual.toLocaleString()} KM</td>
                    <td className="p-3.5 text-right text-slate-300 whitespace-nowrap">{v.capacidade} Litros</td>
                    <td className="p-3.5 text-center font-sans whitespace-nowrap">
                      <span className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
                        {v.combustivel}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-sans whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                        isDriving ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                        "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>{v.estado}</span>
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => triggerEdit(v)}
                          title="Editar Cadastro"
                          className="p-1.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(v.id)}
                            title="Remover"
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredViaturas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic font-sans">
                    Nenhuma viatura correspondente encontrada nos registros de frota.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Adicionar / Editar Viatura */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-lg font-bold text-white">
                  {isEditing ? "Editar Viatura" : "Adicionar Nova Viatura"}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Matricula */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider font-mono">Matrícula (Ex: AGP-223-MP)</label>
                    <input
                      type="text"
                      required
                      placeholder="AGP-223-MP"
                      value={formState.matricula}
                      onChange={(e) => setFormState(p => ({ ...p, matricula: e.target.value.toUpperCase() }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Tipo de Viatura */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Tipo de Veículo</label>
                    <input
                      type="text"
                      required
                      placeholder="Camião Porta Contentor, Carrinha de Carga"
                      value={formState.tipo}
                      onChange={(e) => setFormState(p => ({ ...p, tipo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Marca</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: SCANIA, Volvo, Isuzu"
                      value={formState.marca}
                      onChange={(e) => setFormState(p => ({ ...p, marca: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Modelo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: R500, FMX, NQR"
                      value={formState.modelo}
                      onChange={(e) => setFormState(p => ({ ...p, modelo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Ano */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Ano Fabrico</label>
                    <input
                      type="number"
                      required
                      value={formState.ano}
                      onChange={(e) => setFormState(p => ({ ...p, ano: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Capacidade Tanque */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Capacidade Tanque (Litros)</label>
                    <input
                      type="number"
                      required
                      value={formState.capacidade}
                      onChange={(e) => setFormState(p => ({ ...p, capacidade: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* KM Inicial */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Kilometragem Inicial</label>
                    <input
                      type="number"
                      required
                      value={formState.kilometragem}
                      onChange={(e) => setFormState(p => ({ ...p, kilometragem: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* KM Atual */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Kilometragem Atual</label>
                    <input
                      type="number"
                      required
                      value={formState.km_atual}
                      onChange={(e) => setFormState(p => ({ ...p, km_atual: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Combustível */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Combustível</label>
                    <select
                      value={formState.combustivel}
                      onChange={(e) => setFormState(p => ({ ...p, combustivel: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Gás">Gás</option>
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Estado Operativo</label>
                    <select
                      value={formState.estado}
                      onChange={(e) => setFormState(p => ({ ...p, estado: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em Viagem">Em Viagem</option>
                      <option value="Manutenção">Manutenção</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Observações de Prontidão</label>
                  <textarea
                    rows={2}
                    placeholder="Histórico mecânico recente, observações técnicas de suspensão ou pneus"
                    value={formState.observacoes}
                    onChange={(e) => setFormState(p => ({ ...p, observacoes: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2.5 px-6 rounded-lg cursor-pointer transition-colors"
                  >
                    Guardar Viatura
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
