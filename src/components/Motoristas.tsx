import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Plus, Edit, Trash2, Eye, Download, Printer, Search, 
  X, UserCheck, UserX, Star, Phone, Mail, Award, FileSpreadsheet 
} from "lucide-react";
import { Motorista, Viagem, Usuario } from "../types";
import logoImg from "./Logo.svg";

interface MotoristasProps {
  motoristas: Motorista[];
  viagens: Viagem[];
  currentUser: Usuario | null;
  onRefreshData: () => void;
}

export default function Motoristas({ motoristas, viagens, currentUser, onRefreshData }: MotoristasProps) {
  const isAdmin = currentUser?.role === "admin";

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // States
  const [selectedDriver, setSelectedDriver] = useState<Motorista | null>(null);

  // Filters State
  const [filters, setFilters] = useState({
    nome: "",
    email: "",
    telefone: "",
    carta_conducao: "",
    categoria_carta: "",
    bi: "",
    nuit: "",
    score: "",
    ativo: ""
  });

  // Driver Form State
  const [formState, setFormState] = useState({
    id: 0,
    nome: "",
    email: "",
    telefone: "",
    carta_conducao: "",
    validade_carta: new Date().toISOString().split("T")[0],
    ativo: 1,
    categoria_carta: "CE",
    bi: "",
    nuit: "",
    observacoes: "",
    score: 100
  });

  // Filter change handler
  const handleFilterChange = (col: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };

  const clearFilters = () => {
    setFilters({
      nome: "",
      email: "",
      telefone: "",
      carta_conducao: "",
      categoria_carta: "",
      bi: "",
      nuit: "",
      score: "",
      ativo: ""
    });
  };

  // Filtered list
  const filteredMotoristas = motoristas.filter(d => {
    return (
      (d.nome || "").toLowerCase().includes(filters.nome.toLowerCase()) &&
      (d.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
      (d.telefone || "").toLowerCase().includes(filters.telefone.toLowerCase()) &&
      (d.carta_conducao || "").toLowerCase().includes(filters.carta_conducao.toLowerCase()) &&
      (d.categoria_carta || "").toLowerCase().includes(filters.categoria_carta.toLowerCase()) &&
      (d.bi || "").toLowerCase().includes(filters.bi.toLowerCase()) &&
      (d.nuit || "").toLowerCase().includes(filters.nuit.toLowerCase()) &&
      (d.score.toString()).includes(filters.score) &&
      (filters.ativo === "" || d.ativo.toString() === filters.ativo)
    );
  });

  // Export to Excel/CSV
  const exportToExcel = () => {
    const headers = ["ID", "Nome", "Email", "Telefone", "BI", "NUIT", "Carta Condução", "Categoria", "Validade", "Ativo", "Score"];
    const rows = filteredMotoristas.map(d => [
      d.id, d.nome, d.email, d.telefone, d.bi, d.nuit, d.carta_conducao, d.categoria_carta, d.validade_carta, d.ativo === 1 ? "Ativo" : "Inativo", d.score
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RhinoCargo_Motoristas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Create Form
  const triggerCreate = () => {
    setIsEditing(false);
    setFormState({
      id: 0,
      nome: "",
      email: "",
      telefone: "",
      carta_conducao: "",
      validade_carta: new Date().toISOString().split("T")[0],
      ativo: 1,
      categoria_carta: "CE",
      bi: "",
      nuit: "",
      observacoes: "",
      score: 100
    });
    setModalOpen(true);
  };

  // Trigger Edit Form
  const triggerEdit = (driver: Motorista) => {
    setIsEditing(true);
    setFormState({
      id: driver.id,
      nome: driver.nome,
      email: driver.email,
      telefone: driver.telefone,
      carta_conducao: driver.carta_conducao,
      validade_carta: driver.validade_carta,
      ativo: driver.ativo,
      categoria_carta: driver.categoria_carta,
      bi: driver.bi,
      nuit: driver.nuit,
      observacoes: driver.observacoes || "",
      score: driver.score
    });
    setModalOpen(true);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/motoristas/${formState.id}` : "/api/motoristas";

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
        alert(`Erro: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar ao servidor.");
    }
  };

  // Delete Driver
  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente remover este motorista? Esta operação é irreversível.")) return;

    try {
      const response = await fetch(`/api/motoristas/${id}`, { method: "DELETE" });
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

  // View Profile
  const triggerProfile = (driver: Motorista) => {
    setSelectedDriver(driver);
    setProfileOpen(true);
  };

  // Calculate Driver metrics based on associated trips
  const getDriverTrips = (driverId: number) => {
    return viagens.filter(v => v.motorista_id === driverId);
  };

  return (
    <div className="space-y-6" id="motoristas-tab-content">
      {/* Header and top tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print" id="motoristas-header">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-amber-500 h-5 w-5" />
            <span>Cadastro e Desempenho de Motoristas</span>
          </h2>
          <p className="text-xs text-slate-400">Gerencie perfis, categorias de habilitação, dados de BI/NUIT e score de direção.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={clearFilters}
            className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2 px-3 rounded-lg transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
          <button
            onClick={exportToExcel}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={triggerCreate}
            className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Motorista</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden print-card" id="motoristas-table-card">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 whitespace-nowrap">ID</th>
                <th className="p-3.5 whitespace-nowrap">Nome</th>
                <th className="p-3.5 whitespace-nowrap">Contacto</th>
                <th className="p-3.5 whitespace-nowrap">BI / NUIT</th>
                <th className="p-3.5 whitespace-nowrap">Carta Condução</th>
                <th className="p-3.5 whitespace-nowrap">Validade Carta</th>
                <th className="p-3.5 whitespace-nowrap text-center">Score</th>
                <th className="p-3.5 whitespace-nowrap text-center">Estado</th>
                <th className="p-3.5 whitespace-nowrap text-center no-print">Ações</th>
              </tr>

              {/* Column Filters row */}
              <tr className="bg-slate-900/60 border-b border-slate-800/40 no-print">
                <td className="p-1 font-mono"></td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Nome..."
                    value={filters.nome}
                    onChange={(e) => handleFilterChange("nome", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtro..."
                    value={filters.telefone}
                    onChange={(e) => handleFilterChange("telefone", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="BI..."
                      value={filters.bi}
                      onChange={(e) => handleFilterChange("bi", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="NUIT..."
                      value={filters.nuit}
                      onChange={(e) => handleFilterChange("nuit", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </td>
                <td className="p-1">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Carta..."
                      value={filters.carta_conducao}
                      onChange={(e) => handleFilterChange("carta_conducao", e.target.value)}
                      className="w-2/3 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Cat..."
                      value={filters.categoria_carta}
                      onChange={(e) => handleFilterChange("categoria_carta", e.target.value)}
                      className="w-1/3 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </td>
                <td className="p-1"></td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Score..."
                    value={filters.score}
                    onChange={(e) => handleFilterChange("score", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <select
                    value={filters.ativo}
                    onChange={(e) => handleFilterChange("ativo", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Todos</option>
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </td>
                <td className="p-1 no-print"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredMotoristas.map(d => {
                const isDriverActive = d.ativo === 1;
                const scoreExcellence = d.score >= 95;
                const scoreCritical = d.score < 80;

                return (
                  <tr key={d.id} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{d.id}</td>
                    <td className="p-3.5 font-sans font-semibold text-white whitespace-nowrap">{d.nome}</td>
                    <td className="p-3.5 font-sans text-xs whitespace-nowrap">
                      <div>{d.telefone}</div>
                      <div className="text-[10px] text-slate-500">{d.email}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-300">
                      <div>BI: {d.bi}</div>
                      <div>NUIT: {d.nuit}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-semibold">
                      {d.carta_conducao} <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded ml-1 font-mono">{d.categoria_carta}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-xs text-slate-400 font-sans">
                      {new Date(d.validade_carta).toLocaleDateString("pt-MZ")}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                        scoreExcellence ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        scoreCritical ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {d.score} pts
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center font-sans">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isDriverActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"
                      }`}>
                        {isDriverActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        <span>{isDriverActive ? "Ativo" : "Inativo"}</span>
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => triggerProfile(d)}
                          title="Ver Perfil"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerEdit(d)}
                          title="Editar Cadastro"
                          className="p-1.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            title="Remover"
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMotoristas.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic font-sans">
                    Nenhum motorista cadastrado corresponde aos critérios de pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Adicionar / Editar Motorista */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-lg font-bold text-white">
                  {isEditing ? "Editar Motorista" : "Adicionar Novo Motorista"}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formState.nome}
                      onChange={(e) => setFormState(p => ({ ...p, nome: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider font-sans">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider font-sans">Contacto Telefónico</label>
                    <input
                      type="text"
                      required
                      placeholder="+258 8X XXX XXXX"
                      value={formState.telefone}
                      onChange={(e) => setFormState(p => ({ ...p, telefone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* BI */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider font-sans">Número do BI</label>
                    <input
                      type="text"
                      required
                      value={formState.bi}
                      onChange={(e) => setFormState(p => ({ ...p, bi: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* NUIT */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider font-sans">Número NUIT</label>
                    <input
                      type="text"
                      required
                      value={formState.nuit}
                      onChange={(e) => setFormState(p => ({ ...p, nuit: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Carta de Condução */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Carta de Condução (Nº)</label>
                    <input
                      type="text"
                      required
                      value={formState.carta_conducao}
                      onChange={(e) => setFormState(p => ({ ...p, carta_conducao: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Categoria Carta */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Categoria Carta</label>
                    <select
                      value={formState.categoria_carta}
                      onChange={(e) => setFormState(p => ({ ...p, categoria_carta: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="CE">CE (Pesado com Reboque)</option>
                      <option value="C">C (Pesado de Carga)</option>
                      <option value="B">B (Ligeiro)</option>
                      <option value="PG">PG (Serviço Público)</option>
                    </select>
                  </div>

                  {/* Validade Carta */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Validade da Carta</label>
                    <input
                      type="date"
                      required
                      value={formState.validade_carta}
                      onChange={(e) => setFormState(p => ({ ...p, validade_carta: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Score Inicial</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formState.score}
                      onChange={(e) => setFormState(p => ({ ...p, score: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Ativo */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Estado de Contratação</label>
                    <select
                      value={formState.ativo}
                      onChange={(e) => setFormState(p => ({ ...p, ativo: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="1">Ativo / Contratado</option>
                      <option value="0">Suspenso / Demitido</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Observações de Cadastro</label>
                  <textarea
                    rows={2}
                    placeholder="Histórico médico, restrições ou detalhes de contratação"
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
                    Guardar Registro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROFILE MODAL: Perfil Individual do Motorista e Histórico */}
      <AnimatePresence>
        {profileOpen && selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-xs"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50 no-print">
                <h3 className="text-lg font-bold text-white">Perfil do Motorista e Histórico</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir Ficha</span>
                  </button>
                  <button 
                    onClick={() => setProfileOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Profile Card Body */}
              <div className="p-8 space-y-6 bg-slate-950 text-slate-100 max-h-[75vh] overflow-y-auto print-card" id="printable-driver-profile">
                
                {/* Company Logo Header for Print */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <img src={logoImg} className="h-9 w-auto object-contain print:h-9" alt="RHINO CARGO" />
                    <div>
                      <span className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">RHINO CARGO LDA</span>
                      <p className="text-[9px] text-slate-500 font-mono">Ficha de Registo do Motorista</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    Emitido em: <span className="font-mono">{new Date().toLocaleDateString("pt-MZ")}</span>
                  </div>
                </div>

                {/* Header Driver Card */}
                <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-2xl font-bold shrink-0">
                    {selectedDriver.nome.charAt(0)}
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-white">{selectedDriver.nome}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span>{selectedDriver.email}</span>
                      <span className="text-slate-700">•</span>
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>{selectedDriver.telefone}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 py-0.5 px-2 rounded-full font-mono">
                        Carta {selectedDriver.categoria_carta} • No. {selectedDriver.carta_conducao}
                      </span>
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedDriver.ativo === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                      }`}>
                        {selectedDriver.ativo === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score */}
                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Score Direção</span>
                      <span className="text-lg font-mono font-bold text-white">{selectedDriver.score} pts</span>
                    </div>
                  </div>

                  {/* Associated Trips count */}
                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Viagens Totais</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {getDriverTrips(selectedDriver.id).length} viagens
                      </span>
                    </div>
                  </div>

                  {/* Save fuel indicator */}
                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Star className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Desvio Médio L</span>
                      <span className="text-lg font-mono font-bold text-emerald-400">
                        {getDriverTrips(selectedDriver.id).length > 0 
                          ? (getDriverTrips(selectedDriver.id).reduce((acc, curr) => acc + Math.abs(curr.diferenca_litros), 0) / getDriverTrips(selectedDriver.id).length).toFixed(1)
                          : "0.0"} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver Identifications details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Documento de Identificação (BI)</span>
                    <span className="text-white font-bold">{selectedDriver.bi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Identificação Tributária (NUIT)</span>
                    <span className="text-white font-bold">{selectedDriver.nuit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Validade Habilitação (Carta)</span>
                    <span className="text-white font-bold">{new Date(selectedDriver.validade_carta).toLocaleDateString("pt-MZ")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Categoria Profissional</span>
                    <span className="text-amber-500 font-bold">{selectedDriver.categoria_carta} (Pesados)</span>
                  </div>
                </div>

                {/* Drivers trip list history */}
                <div className="space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-amber-500 text-[10px] border-b border-slate-800 pb-1">Histórico de Rotas Conduzidas</h4>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="p-3">Código Viagem</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Trajeto</th>
                          <th className="p-3 text-right">Faturação</th>
                          <th className="p-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {getDriverTrips(selectedDriver.id).map(vt => (
                          <tr key={vt.id} className="text-slate-300">
                            <td className="p-3 font-semibold">{vt.numero_viagem}</td>
                            <td className="p-3 font-sans font-semibold text-amber-500">{vt.cliente}</td>
                            <td className="p-3 font-sans">{vt.origem} ➔ {vt.destino}</td>
                            <td className="p-3 text-right text-emerald-400 font-bold">{vt.faturacao_mzn.toLocaleString()} MZN</td>
                            <td className="p-3 text-center font-sans">
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                vt.estado === "concluida" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {vt.estado === "concluida" ? "Concluída" : "Ativa"}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {getDriverTrips(selectedDriver.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500 italic font-sans">
                              Este motorista não conduziu nenhuma rota registada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional audit notes */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-amber-500 text-[10px] block border-b border-slate-800 pb-1">Notas Internas de Recursos Humanos</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 leading-relaxed italic">
                    {selectedDriver.observacoes || "Ficha limpa. Nenhuma ocorrência disciplinar anotada na pasta de pessoal."}
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end no-print">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2.5 px-6 rounded-lg cursor-pointer transition-colors"
                >
                  Fechar Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
