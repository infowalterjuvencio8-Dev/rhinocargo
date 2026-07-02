import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Fuel, Plus, Edit, Trash2, Search, X, CheckCircle2, 
  AlertCircle, MapPin, Phone, DollarSign, FileSpreadsheet, Percent
} from "lucide-react";
import { Bomba, Usuario } from "../types";

interface BombasProps {
  bombas: Bomba[];
  currentUser: Usuario | null;
  onRefreshData: () => void;
}

export default function Bombas({ bombas, currentUser, onRefreshData }: BombasProps) {
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "administracao";

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Column Filters State
  const [filters, setFilters] = useState({
    nome: "",
    endereco: "",
    contacto: "",
    provincia: "",
    estado: ""
  });

  // Bomba Form State
  const [formState, setFormState] = useState({
    id: 0,
    nome: "",
    endereco: "",
    contacto: "",
    provincia: "Maputo Cidade",
    ativo: 1,
    preco_diesel: 0,
    preco_gasolina: 0,
    preco_gas: 0
  });

  const handleFilterChange = (col: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };

  const clearFilters = () => {
    setFilters({
      nome: "",
      endereco: "",
      contacto: "",
      provincia: "",
      estado: ""
    });
  };

  // Filtered List
  const filteredBombas = bombas.filter(b => {
    const estadoStr = b.ativo === 1 ? "ativo" : "inativo";
    return (
      (b.nome || "").toLowerCase().includes(filters.nome.toLowerCase()) &&
      (b.endereco || "").toLowerCase().includes(filters.endereco.toLowerCase()) &&
      (b.contacto || "").toLowerCase().includes(filters.contacto.toLowerCase()) &&
      (b.provincia || "").toLowerCase().includes(filters.provincia.toLowerCase()) &&
      (filters.estado === "" || estadoStr === filters.estado.toLowerCase())
    );
  });

  // Export to Excel/CSV
  const exportToExcel = () => {
    const headers = ["ID", "Nome da Bomba", "Endereço", "Contacto", "Província", "Estado", "Preço Diesel (MZN)", "Preço Gasolina (MZN)", "Preço Gás (MZN)"];
    const rows = filteredBombas.map(b => [
      b.id, b.nome, b.endereco, b.contacto, b.provincia, b.ativo === 1 ? "Ativo" : "Inativo", b.preco_diesel || 0, b.preco_gasolina || 0, b.preco_gas || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RhinoCargo_Bombas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Create Form
  const triggerCreate = () => {
    setIsEditing(false);
    setFormState({
      id: 0,
      nome: "",
      endereco: "",
      contacto: "",
      provincia: "Maputo Cidade",
      ativo: 1,
      preco_diesel: 0,
      preco_gasolina: 0,
      preco_gas: 0
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // Open Edit Form
  const triggerEdit = (b: Bomba) => {
    setIsEditing(true);
    setFormState({
      id: b.id,
      nome: b.nome,
      endereco: b.endereco,
      contacto: b.contacto,
      provincia: b.provincia || "Maputo Cidade",
      ativo: b.ativo,
      preco_diesel: b.preco_diesel || 0,
      preco_gasolina: b.preco_gasolina || 0,
      preco_gas: b.preco_gas || 0
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nome.trim() || !formState.endereco.trim()) {
      setError("O nome da bomba e o endereço são obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = isEditing ? `/api/bombas/${formState.id}` : "/api/bombas";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formState.nome,
          endereco: formState.endereco,
          contacto: formState.contacto,
          provincia: formState.provincia,
          ativo: formState.ativo,
          preco_diesel: Number(formState.preco_diesel || 0),
          preco_gasolina: Number(formState.preco_gasolina || 0),
          preco_gas: Number(formState.preco_gas || 0)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(isEditing ? "Bomba atualizada com sucesso!" : "Bomba registada com sucesso!");
        onRefreshData();
        setTimeout(() => {
          setModalOpen(false);
        }, 1200);
      } else {
        setError(data.message || "Erro ao processar requisição.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Delete bomba
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem a certeza que deseja remover esta bomba de abastecimento?")) return;
    try {
      const response = await fetch(`/api/bombas/${id}`, { method: "DELETE" });
      if (response.ok) {
        onRefreshData();
      } else {
        alert("Erro ao remover a bomba.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stats calculations
  const totalBombas = bombas.length;
  const bombasAtivas = bombas.filter(b => b.ativo === 1).length;
  const uniqueProvinces = Array.from(new Set(bombas.map(b => b.provincia).filter(Boolean))).length;
  
  const activePumpsWithDiesel = bombas.filter(b => b.ativo === 1 && (b.preco_diesel || 0) > 0);
  const avgDieselPrice = activePumpsWithDiesel.length > 0 
    ? activePumpsWithDiesel.reduce((acc, b) => acc + (b.preco_diesel || 0), 0) / activePumpsWithDiesel.length 
    : 0;

  const provinciasMocambique = [
    "Maputo Cidade",
    "Maputo Província",
    "Gaza",
    "Inhambane",
    "Sofala",
    "Manica",
    "Tete",
    "Zambézia",
    "Nampula",
    "Cabo Delgado",
    "Niassa"
  ];

  return (
    <div className="space-y-6" id="bombas-container">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl" id="bombas-header">
        <div>
          <div className="flex items-center gap-2.5">
            <Fuel className="h-5 w-5 text-rhino-pink" />
            <h2 className="text-lg font-black tracking-wider text-white uppercase">Bomba de Combustível</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Registo e controle de bombas de abastecimento de rota e preços em vigor.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-bombas"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
          
          {isAdmin && (
            <button
              id="btn-add-bomba"
              onClick={triggerCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white rounded-lg text-xs font-black tracking-wide uppercase transition-all shadow-md shadow-rhino-pink/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Bomba</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="bombas-stats-grid">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between" id="stat-card-total">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Bombas</span>
            <div className="text-xl font-black text-white mt-1">{totalBombas}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
            <Fuel className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between" id="stat-card-active">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Bombas Ativas</span>
            <div className="text-xl font-black text-emerald-400 mt-1">{bombasAtivas}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between" id="stat-card-provinces">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Províncias Atendidas</span>
            <div className="text-xl font-black text-sky-400 mt-1">{uniqueProvinces}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-400/20">
            <MapPin className="h-5 w-5 text-sky-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between" id="stat-card-diesel">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Preço Médio Diesel</span>
            <div className="text-xl font-black text-rhino-pink mt-1">
              {avgDieselPrice > 0 ? `${avgDieselPrice.toFixed(2)} MZN` : "0.00 MZN"}
            </div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rhino-pink/20">
            <DollarSign className="h-5 w-5 text-rhino-pink" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" id="bombas-table-card">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 whitespace-nowrap">Nome da Bomba</th>
                <th className="p-3.5 whitespace-nowrap">Endereço</th>
                <th className="p-3.5 whitespace-nowrap">Província</th>
                <th className="p-3.5 whitespace-nowrap">Contacto</th>
                <th className="p-3.5 whitespace-nowrap text-right text-amber-400">Diesel (MZN)</th>
                <th className="p-3.5 whitespace-nowrap text-right text-sky-400">Gasolina (MZN)</th>
                <th className="p-3.5 whitespace-nowrap text-right text-emerald-400">Gás (MZN)</th>
                <th className="p-3.5 whitespace-nowrap text-center">Estado</th>
                <th className="p-3.5 whitespace-nowrap text-center no-print">Ações</th>
              </tr>

              {/* Column Filters Row */}
              <tr className="bg-slate-900/60 border-b border-slate-800/40 no-print">
                <td className="p-1 font-mono">
                  <input
                    type="text"
                    placeholder="Filtrar Nome..."
                    value={filters.nome}
                    onChange={(e) => handleFilterChange("nome", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtrar Endereço..."
                    value={filters.endereco}
                    onChange={(e) => handleFilterChange("endereco", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </td>
                <td className="p-1">
                  <select
                    value={filters.provincia}
                    onChange={(e) => handleFilterChange("provincia", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rhino-pink"
                  >
                    <option value="">Todas</option>
                    {provinciasMocambique.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Contacto..."
                    value={filters.contacto}
                    onChange={(e) => handleFilterChange("contacto", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </td>
                <td className="p-1" colSpan={3}>
                  <div className="flex items-center justify-end text-right px-2 text-[10px] text-slate-500 font-mono">
                    Preços de Combustível Local
                  </div>
                </td>
                <td className="p-1">
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange("estado", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rhino-pink"
                  >
                    <option value="">Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </td>
                <td className="p-1 text-center">
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer font-bold"
                  >
                    Limpar
                  </button>
                </td>
              </tr>
            </thead>

            <tbody>
              {filteredBombas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-slate-500 font-medium">
                    Nenhuma bomba de abastecimento encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBombas.map((b) => (
                  <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-850/30 transition-all">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <Fuel className="h-3.5 w-3.5 text-rhino-blue" />
                      <span>{b.nome}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{b.endereco}</td>
                    <td className="p-3.5 font-mono text-slate-400 font-semibold">{b.provincia || "Não Definida"}</td>
                    <td className="p-3.5 font-mono text-slate-400">{b.contacto || "-"}</td>
                    <td className="p-3.5 text-right font-mono font-black text-amber-400">
                      {(b.preco_diesel || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-sky-400">
                      {(b.preco_gasolina || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-400">
                      {(b.preco_gas || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        b.ativo === 1 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                          : "bg-slate-800 border border-slate-700 text-slate-500"
                      }`}>
                        {b.ativo === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        {isAdmin && (
                          <>
                            <button
                              id={`edit-bomba-${b.id}`}
                              onClick={() => triggerEdit(b)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-white transition-all cursor-pointer"
                              title="Editar Bomba"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`delete-bomba-${b.id}`}
                              onClick={() => handleDelete(b.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-white transition-all cursor-pointer"
                              title="Remover Bomba"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {!isAdmin && (
                          <span className="text-[10px] text-slate-600 font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print" id="bomba-form-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex justify-between items-center">
                <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-rhino-pink" />
                  {isEditing ? "EDITAR REGISTO DE BOMBA" : "REGISTAR NOVA BOMBA"}
                </h3>
                <button
                  id="btn-close-modal"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Nome */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome da Bomba *</label>
                    <div className="relative">
                      <Fuel className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Bomba Total Moçambique Maputo"
                        value={formState.nome}
                        onChange={(e) => setFormState(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                      />
                    </div>
                  </div>

                  {/* Endereco */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Completo *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Av. Eduardo Mondlane, No. 123"
                        value={formState.endereco}
                        onChange={(e) => setFormState(prev => ({ ...prev, endereco: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                      />
                    </div>
                  </div>

                  {/* Provincia & Contacto */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Província *</label>
                      <select
                        value={formState.provincia}
                        onChange={(e) => setFormState(prev => ({ ...prev, provincia: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rhino-pink"
                      >
                        {provinciasMocambique.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contacto Telefónico</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Ex: +258 84 123 4567"
                          value={formState.contacto}
                          onChange={(e) => setFormState(prev => ({ ...prev, contacto: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fuel Prices */}
                  <div className="bg-slate-950/60 p-3 border border-slate-850 rounded-lg space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-1.5 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-rhino-blue" />
                      <span>Tabela de Preços Unitários (MZN / Litro)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-amber-400 uppercase tracking-wide mb-1">Diesel</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formState.preco_diesel}
                          onChange={(e) => setFormState(prev => ({ ...prev, preco_diesel: Number(e.target.value || 0) }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right text-amber-400 font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-sky-400 uppercase tracking-wide mb-1">Gasolina</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formState.preco_gasolina}
                          onChange={(e) => setFormState(prev => ({ ...prev, preco_gasolina: Number(e.target.value || 0) }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right text-sky-400 font-semibold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-emerald-400 uppercase tracking-wide mb-1">Gás (LPG)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formState.preco_gas}
                          onChange={(e) => setFormState(prev => ({ ...prev, preco_gas: Number(e.target.value || 0) }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estado / Ativo */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800">
                    <div>
                      <span className="block text-xs font-bold text-white">Bomba Ativa no Sistema</span>
                      <span className="block text-[9px] text-slate-500">Permite que motoristas escolham esta bomba em viagens.</span>
                    </div>
                    <select
                      value={formState.ativo}
                      onChange={(e) => setFormState(prev => ({ ...prev, ativo: Number(e.target.value) }))}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rhino-pink font-semibold"
                    >
                      <option value={1}>Ativo</option>
                      <option value={0}>Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-black tracking-wider uppercase bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white rounded-lg transition-all cursor-pointer"
                  >
                    {saving ? "A Guardar..." : isEditing ? "Salvar Alterações" : "Gravar Registo"}
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
