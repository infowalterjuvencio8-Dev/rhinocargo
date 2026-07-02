import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Edit, Eye, Download, Printer, Search, Calendar, 
  MapPin, User, Truck, DollarSign, Fuel, CheckCircle, 
  Clock, X, AlertTriangle, FileSpreadsheet
} from "lucide-react";
import { Viagem, Viatura, Motorista, Bomba, PrecoProvincia, Usuario } from "../types";
import logoImg from "./Logo.svg";


interface ViagensProps {
  viagens: Viagem[];
  viaturas: Viatura[];
  motoristas: Motorista[];
  bombas: Bomba[];
  provincias: PrecoProvincia[];
  currentUser: Usuario | null;
  onRefreshData: () => void;
}

export default function Viagens({ 
  viagens, viaturas, motoristas, bombas, provincias, currentUser, onRefreshData 
}: ViagensProps) {
  
  // Modals
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  const [selectedTrip, setSelectedTrip] = useState<Viagem | null>(null);

  // Column Filters State
  const [filters, setFilters] = useState({
    numero_viagem: "",
    viatura_matricula: "",
    motorista_nome: "",
    cliente: "",
    produto: "",
    origem: "",
    destino: "",
    total_combustivel_mzn: "",
    faturacao_mzn: "",
    total_remanescente_mzn: "",
    estado: ""
  });

  // Start Trip Form State
  const [newTrip, setNewTrip] = useState({
    numero_viagem: `VJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    data_partida: new Date().toISOString().substring(0, 16),
    viatura_id: "",
    motorista_id: "",
    bomba_id: "",
    litros_bomba: 100,
    litros_sistema: 100,
    cliente: "",
    produto: "",
    origem: "",
    destino: "",
    observacoes: ""
  });

  // Edit Trip Form State (Conclude trip / add expenses)
  const [editTrip, setEditTrip] = useState({
    id: 0,
    estado: "em_curso" as "em_curso" | "concluida",
    data_chegada: new Date().toISOString().substring(0, 16),
    km_chegada: 0,
    intermediacao_mzn: 0,
    escolta_mzn: 0,
    quebras_faltas_mzn: 0,
    faturacao_mzn: 0,
    observacoes: "",
    expediente: "",
    reforcos: "",
    p_o: "",
    origem_combustivel: ""
  });

  // Handle column filter change
  const handleFilterChange = (column: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      numero_viagem: "",
      viatura_matricula: "",
      motorista_nome: "",
      cliente: "",
      produto: "",
      origem: "",
      destino: "",
      total_combustivel_mzn: "",
      faturacao_mzn: "",
      total_remanescente_mzn: "",
      estado: ""
    });
  };

  // Filtered Voyages
  const filteredViagens = viagens.filter(t => {
    // If standard employee, restrict to their own voyages
    if (currentUser && currentUser.role === "funcionario") {
      if (t.motorista_id !== currentUser.funcionario_id) {
        return false;
      }
    }
    return (
      (t.numero_viagem || "").toLowerCase().includes(filters.numero_viagem.toLowerCase()) &&
      (t.viatura_matricula || "").toLowerCase().includes(filters.viatura_matricula.toLowerCase()) &&
      (t.motorista_nome || "").toLowerCase().includes(filters.motorista_nome.toLowerCase()) &&
      (t.cliente || "").toLowerCase().includes(filters.cliente.toLowerCase()) &&
      (t.produto || "").toLowerCase().includes(filters.produto.toLowerCase()) &&
      (t.origem || "").toLowerCase().includes(filters.origem.toLowerCase()) &&
      (t.destino || "").toLowerCase().includes(filters.destino.toLowerCase()) &&
      (t.total_combustivel_mzn.toString()).includes(filters.total_combustivel_mzn) &&
      (t.faturacao_mzn.toString()).includes(filters.faturacao_mzn) &&
      (t.total_remanescente_mzn.toString()).includes(filters.total_remanescente_mzn) &&
      (t.estado || "").toLowerCase().includes(filters.estado.toLowerCase())
    );
  });

  // Export Voyages to Excel/CSV
  const exportToExcel = () => {
    const headers = [
      "No. Viagem", "Data Partida", "Data Chegada", "Viatura", "Motorista", 
      "Bomba", "Litros Abastecidos", "Litros Sistema", "Diferença", 
      "Valor Combustível (MZN)", "Cliente", "Produto", "Origem", "Destino", 
      "Intermediação (MZN)", "Escolta (MZN)", "Quebras/Faltas (MZN)", 
      "Faturação (MZN)", "Remanescente Líquido (MZN)", "Estado"
    ];

    const rows = filteredViagens.map(t => [
      t.numero_viagem,
      t.data_partida,
      t.data_chegada || "Em Curso",
      t.viatura_matricula,
      t.motorista_nome,
      t.bomba_nome || "N/A",
      t.litros_bomba,
      t.litros_sistema,
      t.diferenca_litros,
      t.total_combustivel_mzn,
      t.cliente,
      t.produto,
      t.origem,
      t.destino,
      t.intermediacao_mzn,
      t.escolta_mzn,
      t.quebras_faltas_mzn,
      t.faturacao_mzn,
      t.total_remanescente_mzn,
      t.estado === "concluida" ? "Concluída" : "Em Curso"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RhinoCargo_Viagens_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print full table
  const printTable = () => {
    window.print();
  };

  // Live Fuel Calculation helper for Start Trip Modal
  const getLiveFuelTariff = () => {
    if (!newTrip.viatura_id || !newTrip.bomba_id) return { unitPrice: 0, fuelType: "" };

    const viatura = viaturas.find(v => v.id === Number(newTrip.viatura_id));
    const bomba = bombas.find(b => b.id === Number(newTrip.bomba_id));

    if (!viatura || !bomba) return { unitPrice: 0, fuelType: "" };

    const fuelType = viatura.combustivel.toLowerCase();
    let unitPrice = 0;

    // Check pump-specific prices first
    if (fuelType.includes("diesel")) {
      unitPrice = bomba.preco_diesel || 0;
    } else if (fuelType.includes("gasolina")) {
      unitPrice = bomba.preco_gasolina || 0;
    } else if (fuelType.includes("gas")) {
      unitPrice = bomba.preco_gas || 0;
    }

    // If pump specific price is null or zero, find province default price
    if (unitPrice === 0) {
      const provPrice = provincias.find(p => p.provincia === bomba.provincia);
      if (provPrice) {
        if (fuelType.includes("diesel")) unitPrice = provPrice.diesel;
        else if (fuelType.includes("gasolina")) unitPrice = provPrice.gasolina;
        else if (fuelType.includes("gas")) unitPrice = provPrice.gas;
      }
    }

    return { unitPrice, fuelType: viatura.combustivel };
  };

  const { unitPrice: liveUnitPrice, fuelType: liveFuelType } = getLiveFuelTariff();
  const liveTotalFuelCost = liveUnitPrice * newTrip.litros_bomba;
  const liveLiterDifference = newTrip.litros_bomba - newTrip.litros_sistema;

  // Start Trip submit
  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.viatura_id || !newTrip.motorista_id || !newTrip.bomba_id) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const response = await fetch("/api/viagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTrip,
          viatura_id: Number(newTrip.viatura_id),
          motorista_id: Number(newTrip.motorista_id),
          bomba_id: Number(newTrip.bomba_id),
          litros_bomba: Number(newTrip.litros_bomba),
          litros_sistema: Number(newTrip.litros_sistema),
        })
      });

      if (response.ok) {
        setStartModalOpen(false);
        onRefreshData();
        // Reset trip ID with new random value
        setNewTrip(prev => ({
          ...prev,
          numero_viagem: `VJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
          cliente: "",
          produto: "",
          origem: "",
          destino: "",
          observacoes: ""
        }));
      } else {
        const err = await response.json();
        alert(`Erro ao iniciar viagem: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Open Edit Modal
  const openEditTrip = (trip: Viagem) => {
    setSelectedTrip(trip);
    setEditTrip({
      id: trip.id,
      estado: trip.estado,
      data_chegada: trip.data_chegada || new Date().toISOString().substring(0, 16),
      km_chegada: viaturas.find(v => v.id === trip.viatura_id)?.km_atual || 0,
      intermediacao_mzn: trip.intermediacao_mzn || 0,
      escolta_mzn: trip.escolta_mzn || 0,
      quebras_faltas_mzn: trip.quebras_faltas_mzn || 0,
      faturacao_mzn: trip.faturacao_mzn || 0,
      observacoes: trip.observacoes || "",
      expediente: trip.expediente || "",
      reforcos: trip.reforcos || "",
      p_o: trip.p_o || "",
      origem_combustivel: trip.origem_combustivel || ""
    });
    setEditModalOpen(true);
  };

  // Edit Trip submit (Save / Conclude)
  const handleEditTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/viagens/${editTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTrip)
      });

      if (response.ok) {
        setEditModalOpen(false);
        onRefreshData();
      } else {
        const err = await response.json();
        alert(`Erro ao salvar viagem: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // View Trip detail and print single trip receipt
  const openViewTrip = (trip: Viagem) => {
    setSelectedTrip(trip);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6" id="viagens-tab-content">
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print" id="viagens-header">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-amber-500 h-5 w-5" />
            <span>Controle de Viagens</span>
          </h2>
          <p className="text-xs text-slate-400">Gerencie partidas, retornos, faturamento e custos operacionais</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={clearFilters}
            className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2 px-3 rounded-lg transition-colors cursor-pointer"
            id="clear-filters-button"
          >
            Limpar Filtros
          </button>
          <button
            onClick={exportToExcel}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            id="export-excel-button"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={printTable}
            className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-300 py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            id="print-table-button"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() => setStartModalOpen(true)}
            className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            id="start-trip-button"
          >
            <Plus className="h-4 w-4" />
            <span>Iniciar Viagem</span>
          </button>
        </div>
      </div>

      {/* Main Table with Column filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden print-card" id="viagens-table-card">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 whitespace-nowrap">Cód. Viagem</th>
                <th className="p-3.5 whitespace-nowrap">Viatura</th>
                <th className="p-3.5 whitespace-nowrap">Motorista</th>
                <th className="p-3.5 whitespace-nowrap">Cliente</th>
                <th className="p-3.5 whitespace-nowrap">Rota</th>
                <th className="p-3.5 whitespace-nowrap text-right">Combustível</th>
                <th className="p-3.5 whitespace-nowrap text-right">Faturação</th>
                <th className="p-3.5 whitespace-nowrap text-right">Remanescente</th>
                <th className="p-3.5 whitespace-nowrap text-center">Estado</th>
                <th className="p-3.5 whitespace-nowrap text-center no-print">Ações</th>
              </tr>

              {/* Column Filters Row */}
              <tr className="bg-slate-900/60 border-b border-slate-800/40 no-print">
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.numero_viagem}
                    onChange={(e) => handleFilterChange("numero_viagem", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.viatura_matricula}
                    onChange={(e) => handleFilterChange("viatura_matricula", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.motorista_nome}
                    onChange={(e) => handleFilterChange("motorista_nome", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.cliente}
                    onChange={(e) => handleFilterChange("cliente", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Origem..."
                      value={filters.origem}
                      onChange={(e) => handleFilterChange("origem", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Destino..."
                      value={filters.destino}
                      onChange={(e) => handleFilterChange("destino", e.target.value)}
                      className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="MZN..."
                    value={filters.total_combustivel_mzn}
                    onChange={(e) => handleFilterChange("total_combustivel_mzn", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="MZN..."
                    value={filters.faturacao_mzn}
                    onChange={(e) => handleFilterChange("faturacao_mzn", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="MZN..."
                    value={filters.total_remanescente_mzn}
                    onChange={(e) => handleFilterChange("total_remanescente_mzn", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-1">
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange("estado", e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Todos</option>
                    <option value="em_curso">Em Curso</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </td>
                <td className="p-1 no-print"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredViagens.map(t => {
                const isCompleted = t.estado === "concluida";
                const isDeviating = Math.abs(t.diferenca_litros) > 0;
                
                return (
                  <tr 
                    key={t.id} 
                    className={`hover:bg-slate-800/20 transition-colors ${
                      isCompleted ? "text-slate-400" : "text-white"
                    }`}
                  >
                    <td className="p-3.5 font-mono font-semibold whitespace-nowrap">
                      {t.numero_viagem}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono text-xs">{t.viatura_matricula}</div>
                      <div className="text-[10px] text-slate-500">{t.viatura_marca} {t.viatura_modelo}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div>{t.motorista_nome}</div>
                    </td>
                    <td className="p-3.5 font-semibold whitespace-nowrap text-amber-500">
                      {t.cliente}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-300">
                        <span>{t.origem}</span>
                        <span className="text-slate-600">➔</span>
                        <span>{t.destino}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">{t.produto}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono whitespace-nowrap">
                      <div>{t.total_combustivel_mzn.toLocaleString()} MZN</div>
                      <div className={`text-[10px] ${isDeviating ? "text-rose-400 font-bold" : "text-slate-500"}`}>
                        {t.litros_bomba} L {isDeviating && `(Devio: ${t.diferenca_litros.toFixed(1)}L)`}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono whitespace-nowrap font-bold text-slate-200">
                      {t.faturacao_mzn.toLocaleString()} MZN
                    </td>
                    <td className="p-3.5 text-right font-mono whitespace-nowrap font-bold text-emerald-400">
                      {t.total_remanescente_mzn.toLocaleString()} MZN
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      }`}>
                        {isCompleted ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
                        <span>{isCompleted ? "Concluída" : "Em Curso"}</span>
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewTrip(t)}
                          title="Visualizar e Imprimir"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditTrip(t)}
                          title="Editar Viagem"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredViagens.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                    Nenhuma viagem encontrada com os filtros especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Iniciar Viagem */}
      <AnimatePresence>
        {startModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-lg font-bold text-white">Iniciar Nova Viagem</h3>
                  <p className="text-xs text-slate-400">Preencha os detalhes operacionais e o abastecimento inicial obrigatório.</p>
                </div>
                <button 
                  onClick={() => setStartModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleStartTripSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trip Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Cód. Viagem</label>
                    <input
                      type="text"
                      required
                      value={newTrip.numero_viagem}
                      onChange={(e) => setNewTrip(p => ({ ...p, numero_viagem: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Departure Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Data Partida</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTrip.data_partida}
                      onChange={(e) => setNewTrip(p => ({ ...p, data_partida: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Viatura Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Viatura</label>
                    <select
                      required
                      value={newTrip.viatura_id}
                      onChange={(e) => setNewTrip(p => ({ ...p, viatura_id: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Selecione Viatura...</option>
                      {viaturas.map(v => (
                        <option key={v.id} value={v.id} disabled={v.estado === "Em Viagem"}>
                          {v.matricula} - {v.marca} {v.modelo} ({v.combustivel}) {v.estado === "Em Viagem" ? "[EM VIAGEM]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Motorista Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Motorista</label>
                    <select
                      required
                      value={newTrip.motorista_id}
                      onChange={(e) => setNewTrip(p => ({ ...p, motorista_id: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Selecione Motorista...</option>
                      {motoristas.filter(m => m.ativo === 1).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (Score: {m.score} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Cliente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CDM, Mozal, Vale"
                      value={newTrip.cliente}
                      onChange={(e) => setNewTrip(p => ({ ...p, cliente: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Produto */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Produto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bebidas, Carvão, Cimento"
                      value={newTrip.produto}
                      onChange={(e) => setNewTrip(p => ({ ...p, produto: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Origem */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Origem</label>
                    <input
                      type="text"
                      required
                      placeholder="Cidade de Origem"
                      value={newTrip.origem}
                      onChange={(e) => setNewTrip(p => ({ ...p, origem: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Destino */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Destino</label>
                    <input
                      type="text"
                      required
                      placeholder="Cidade de Destino"
                      value={newTrip.destino}
                      onChange={(e) => setNewTrip(p => ({ ...p, destino: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Abastecimento Section with Auto calculations */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
                    <Fuel className="h-4 w-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Abastecimento Obrigatório de Saída</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bomba Selection */}
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Posto (Bomba)</label>
                      <select
                        required
                        value={newTrip.bomba_id}
                        onChange={(e) => setNewTrip(p => ({ ...p, bomba_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Selecione Posto...</option>
                        {bombas.filter(b => b.ativo === 1).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.nome} ({b.provincia})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Litros Bomba */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Litros Bomba (Real)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newTrip.litros_bomba}
                        onChange={(e) => setNewTrip(p => ({ ...p, litros_bomba: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Litros Sistema */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Litros Sistema (GPS/Medidor)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newTrip.litros_sistema}
                        onChange={(e) => setNewTrip(p => ({ ...p, litros_sistema: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Interactive Calculation feedback */}
                  {newTrip.viatura_id && newTrip.bomba_id && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Combustível</span>
                        <span className="text-white font-semibold">{liveFuelType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Preço / Litro</span>
                        <span className="text-amber-500 font-bold">{liveUnitPrice.toFixed(2)} MZN</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Valor Total</span>
                        <span className="text-emerald-400 font-bold">{liveTotalFuelCost.toLocaleString()} MZN</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Desvio Litros</span>
                        <span className={`font-bold ${Math.abs(liveLiterDifference) > 0 ? "text-rose-400" : "text-slate-400"}`}>
                          {liveLiterDifference.toFixed(1)} L
                        </span>
                      </div>

                      {Math.abs(liveLiterDifference) >= 5 && (
                        <div className="col-span-2 md:col-span-4 mt-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded flex items-center gap-2 text-[10px]">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Alerta de consumo! Desvio significativo detectado. O sistema gerará um alerta automático para auditoria.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Observações Iniciais</label>
                  <textarea
                    rows={2}
                    placeholder="Descreva as instruções de carregamento ou detalhes adicionais"
                    value={newTrip.observacoes}
                    onChange={(e) => setNewTrip(p => ({ ...p, observacoes: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setStartModalOpen(false)}
                    className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2.5 px-6 rounded-lg cursor-pointer transition-colors"
                  >
                    Confirmar e Partir
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Editar Viagem (Adicionar despesas e faturamento no fim da viagem) */}
      <AnimatePresence>
        {editModalOpen && selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-lg font-bold text-white">Atualizar / Fechar Viagem</h3>
                  <p className="text-xs text-slate-400">Preencha os valores finais de intermediação, escolta, quebras e faturamento.</p>
                </div>
                <button 
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditTripSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Trip Header Status Info */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">No. Viagem</span>
                    <span className="text-white font-bold">{selectedTrip.numero_viagem}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Cliente</span>
                    <span className="text-amber-500 font-bold">{selectedTrip.cliente}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Custo Combustível</span>
                    <span className="text-red-400 font-bold">{selectedTrip.total_combustivel_mzn.toLocaleString()} MZN</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voyage State */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Estado da Viagem</label>
                    <select
                      value={editTrip.estado}
                      onChange={(e) => setEditTrip(p => ({ ...p, estado: e.target.value as "em_curso" | "concluida" }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="em_curso">Em Curso</option>
                      <option value="concluida">Concluída (Chegada)</option>
                    </select>
                  </div>

                  {/* Arrival Date (Active only if concluded) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Data de Chegada</label>
                    <input
                      type="datetime-local"
                      required={editTrip.estado === "concluida"}
                      disabled={editTrip.estado !== "concluida"}
                      value={editTrip.data_chegada}
                      onChange={(e) => setEditTrip(p => ({ ...p, data_chegada: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Current Milage at arrival */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Kilometragem de Chegada</label>
                    <input
                      type="number"
                      required={editTrip.estado === "concluida"}
                      disabled={editTrip.estado !== "concluida"}
                      value={editTrip.km_chegada}
                      onChange={(e) => setEditTrip(p => ({ ...p, km_chegada: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Faturação MZN */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Faturação Total (Bruta)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editTrip.faturacao_mzn}
                      onChange={(e) => setEditTrip(p => ({ ...p, faturacao_mzn: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Additional operational details */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Custos Operacionais Finais</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Intermediação */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Intermediação (MZN)</label>
                      <input
                        type="number"
                        min="0"
                        value={editTrip.intermediacao_mzn}
                        onChange={(e) => setEditTrip(p => ({ ...p, intermediacao_mzn: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Escolta */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Escolta (MZN)</label>
                      <input
                        type="number"
                        min="0"
                        value={editTrip.escolta_mzn}
                        onChange={(e) => setEditTrip(p => ({ ...p, escolta_mzn: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Faltas / Quebras */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Faltas & Quebras (MZN)</label>
                      <input
                        type="number"
                        min="0"
                        value={editTrip.quebras_faltas_mzn}
                        onChange={(e) => setEditTrip(p => ({ ...p, quebras_faltas_mzn: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Expediente */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Expediente</label>
                      <input
                        type="text"
                        placeholder="Ex: Documentação de trânsito"
                        value={editTrip.expediente}
                        onChange={(e) => setEditTrip(p => ({ ...p, expediente: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Reforços */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Reforços</label>
                      <input
                        type="text"
                        placeholder="Reforços no trajeto"
                        value={editTrip.reforcos}
                        onChange={(e) => setEditTrip(p => ({ ...p, reforcos: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* P.O. */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">P.O. (No.)</label>
                      <input
                        type="text"
                        placeholder="Ex: PO-49503"
                        value={editTrip.p_o}
                        onChange={(e) => setEditTrip(p => ({ ...p, p_o: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Origem Combustível */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Origem Combustível</label>
                    <input
                      type="text"
                      placeholder="Ex: Depósito central Rhino Cargo"
                      value={editTrip.origem_combustivel}
                      onChange={(e) => setEditTrip(p => ({ ...p, origem_combustivel: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Remanescente live calculation info */}
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-xs flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px]">Resultado Remanescente Estimado:</span>
                    <span className={`text-sm font-bold ${
                      editTrip.faturacao_mzn - (selectedTrip.total_combustivel_mzn + editTrip.intermediacao_mzn + editTrip.escolta_mzn + editTrip.quebras_faltas_mzn) >= 0 
                        ? "text-emerald-400" 
                        : "text-rose-400"
                    }`}>
                      {(editTrip.faturacao_mzn - (selectedTrip.total_combustivel_mzn + editTrip.intermediacao_mzn + editTrip.escolta_mzn + editTrip.quebras_faltas_mzn)).toLocaleString()} MZN
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Notas de Fecho de Viagem</label>
                  <textarea
                    rows={2}
                    placeholder="Descreva quebras, observações de estrada, ocorrências de segurança, etc."
                    value={editTrip.observacoes}
                    onChange={(e) => setEditTrip(p => ({ ...p, observacoes: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2.5 px-6 rounded-lg cursor-pointer transition-colors"
                  >
                    Guardar e Concluir
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Visualizar Detalhes e Imprimir Viagem Estilizada */}
      <AnimatePresence>
        {viewModalOpen && selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50 no-print">
                <h3 className="text-lg font-bold text-white">Relatório Detalhado de Viagem</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir Relatório</span>
                  </button>
                  <button 
                    onClick={() => setViewModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="p-8 space-y-6 bg-slate-950 text-slate-100 max-h-[75vh] overflow-y-auto print-card" id="printable-trip-receipt">
                
                {/* Invoice style Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <img src={logoImg} className="h-12 w-auto object-contain print:h-12" alt="RHINO CARGO" />
                    <div className="space-y-1">
                      <h1 className="text-xl font-bold tracking-tight text-white uppercase print:text-slate-900">RHINO CARGO LDA</h1>
                      <p className="text-xs text-slate-400 print:text-slate-600">Transporte de Carga e Logística Integrada Moçambique</p>
                      <p className="text-[10px] text-slate-500 print:text-slate-600">Maputo Cidade, Moçambique • Contacto: +258 84 100 2000</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider">Cód. Identificador</span>
                    <h2 className="text-2xl font-mono font-bold text-white">{selectedTrip.numero_viagem}</h2>
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1 rounded ${
                      selectedTrip.estado === "concluida" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-500"
                    }`}>
                      {selectedTrip.estado === "concluida" ? "CONCLUÍDA" : "EM CURSO"}
                    </span>
                  </div>
                </div>

                {/* Grid of basic parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Left Column: Operation Details */}
                  <div className="space-y-3.5">
                    <h4 className="font-bold uppercase tracking-wider text-amber-500 text-[10px] border-b border-slate-800 pb-1">1. Informação Operacional</h4>
                    
                    <div className="grid grid-cols-3 gap-y-2 text-slate-300">
                      <span className="text-slate-500 font-semibold">Cliente:</span>
                      <span className="col-span-2 font-bold text-white">{selectedTrip.cliente}</span>

                      <span className="text-slate-500 font-semibold">Produto:</span>
                      <span className="col-span-2">{selectedTrip.produto}</span>

                      <span className="text-slate-500 font-semibold">Origem:</span>
                      <span className="col-span-2">{selectedTrip.origem}</span>

                      <span className="text-slate-500 font-semibold">Destino:</span>
                      <span className="col-span-2 font-semibold text-white">{selectedTrip.destino}</span>

                      <span className="text-slate-500 font-semibold">Viatura:</span>
                      <span className="col-span-2 font-mono text-white">{selectedTrip.viatura_matricula} ({selectedTrip.viatura_marca} {selectedTrip.viatura_modelo})</span>

                      <span className="text-slate-500 font-semibold">Motorista:</span>
                      <span className="col-span-2">{selectedTrip.motorista_nome} ({selectedTrip.motorista_telefone})</span>
                    </div>
                  </div>

                  {/* Right Column: Timeline & Fuel */}
                  <div className="space-y-3.5">
                    <h4 className="font-bold uppercase tracking-wider text-amber-500 text-[10px] border-b border-slate-800 pb-1">2. Cronograma & Abastecimento</h4>

                    <div className="grid grid-cols-3 gap-y-2 text-slate-300">
                      <span className="text-slate-500 font-semibold">Partida:</span>
                      <span className="col-span-2 font-mono">{new Date(selectedTrip.data_partida).toLocaleString("pt-MZ")}</span>

                      <span className="text-slate-500 font-semibold">Chegada:</span>
                      <span className="col-span-2 font-mono">
                        {selectedTrip.data_chegada ? new Date(selectedTrip.data_chegada).toLocaleString("pt-MZ") : "Viagem Ativa"}
                      </span>

                      <span className="text-slate-500 font-semibold">Posto Saída:</span>
                      <span className="col-span-2">{selectedTrip.bomba_nome} ({selectedTrip.bomba_provincia})</span>

                      <span className="text-slate-500 font-semibold">Litros Abast.:</span>
                      <span className="col-span-2 font-mono">{selectedTrip.litros_bomba} L (Bomba) / {selectedTrip.litros_sistema} L (Sistema)</span>

                      <span className="text-slate-500 font-semibold">Desvio Litros:</span>
                      <span className={`col-span-2 font-mono font-bold ${Math.abs(selectedTrip.diferenca_litros) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedTrip.diferenca_litros.toFixed(1)} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Breakdown table */}
                <div className="space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-amber-500 text-[10px] border-b border-slate-800 pb-1">3. Demonstrativo Financeiro de Viagem</h4>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="p-3">Descrição da Conta / Custos</th>
                          <th className="p-3 text-right">Faturação (+)</th>
                          <th className="p-3 text-right">Custos Operacionais (-)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {/* Billing */}
                        <tr>
                          <td className="p-3 font-sans font-semibold text-slate-300">Faturação Bruta do Serviço (Frete)</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">{selectedTrip.faturacao_mzn.toLocaleString()} MZN</td>
                          <td className="p-3 text-right text-slate-600">-</td>
                        </tr>
                        {/* Fuel */}
                        <tr>
                          <td className="p-3 font-sans text-slate-400">Despesa de Combustível (Saída de Viagem)</td>
                          <td className="p-3 text-right text-slate-600">-</td>
                          <td className="p-3 text-right text-red-400">{selectedTrip.total_combustivel_mzn.toLocaleString()} MZN</td>
                        </tr>
                        {/* Intermediação */}
                        <tr>
                          <td className="p-3 font-sans text-slate-400">Serviço de Intermediação</td>
                          <td className="p-3 text-right text-slate-600">-</td>
                          <td className="p-3 text-right text-red-400">{selectedTrip.intermediacao_mzn.toLocaleString()} MZN</td>
                        </tr>
                        {/* Escolta */}
                        <tr>
                          <td className="p-3 font-sans text-slate-400">Serviço de Escolta na Estrada</td>
                          <td className="p-3 text-right text-slate-600">-</td>
                          <td className="p-3 text-right text-red-400">{selectedTrip.escolta_mzn.toLocaleString()} MZN</td>
                        </tr>
                        {/* Faltas & Quebras */}
                        <tr>
                          <td className="p-3 font-sans text-slate-400 font-semibold text-rose-300">Quebras, Faltas e Ocorrências</td>
                          <td className="p-3 text-right text-slate-600">-</td>
                          <td className="p-3 text-right text-rose-400">{selectedTrip.quebras_faltas_mzn.toLocaleString()} MZN</td>
                        </tr>
                        {/* Net remainder balance row */}
                        <tr className="bg-slate-950 font-bold">
                          <td className="p-3 font-sans uppercase text-amber-500">Remanescente Líquido (Saldo da Viagem)</td>
                          <td colSpan={2} className="p-3 text-right text-emerald-400 text-sm">
                            {selectedTrip.total_remanescente_mzn.toLocaleString()} MZN
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional audit notes */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-amber-500 text-[10px] block border-b border-slate-800 pb-1">4. Observações de Auditoria</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 leading-relaxed italic">
                    {selectedTrip.observacoes || "Nenhuma ocorrência ou observação de relevo registada durante a rota."}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-800 text-center text-xs">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 mx-auto w-48 h-6" />
                    <span className="text-slate-500 block">Assinatura do Motorista</span>
                    <span className="text-[10px] text-slate-600">{selectedTrip.motorista_nome}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 mx-auto w-48 h-6" />
                    <span className="text-slate-500 block">Assinatura de Gestão / Auditoria</span>
                    <span className="text-[10px] text-slate-600">Rhino Cargo Fleet Management</span>
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end no-print">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2.5 px-6 rounded-lg cursor-pointer transition-colors"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
