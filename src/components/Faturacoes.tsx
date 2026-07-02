import React, { useState } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Printer, 
  Coins, 
  Calendar, 
  MapPin, 
  User, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  ArrowLeft,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Viagem, Usuario, Viatura, Motorista } from "../types";
import logoImg from "./Logo.svg";

const PRINT_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 450" style="width: 130px; height: auto; display: block;">
  <defs>
    <style>
      .blue-text { font-family: 'Segoe UI', -apple-system, sans-serif; font-weight: 900; fill: #2E4399; }
      .pink-text { font-family: 'Segoe UI', -apple-system, sans-serif; font-weight: 900; fill: #E9008C; font-style: italic; }
      .sub-text { font-family: 'Segoe UI', -apple-system, sans-serif; font-weight: 700; fill: #2E4399; letter-spacing: 11px; }
    </style>
  </defs>
  <g transform="translate(40, 20)">
    <g id="rhino-illustration" stroke="#2E4399" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 380,180 C 365,150, 395,115, 440,105 C 490,95, 570,95, 610,105 C 640,112, 665,95, 685,90 C 705,85, 715,75, 720,70 C 725,65, 730,75, 725,85 L 715,100 C 726,93, 734,87, 738,84 C 742,81, 745,86, 739,95 L 728,110 C 742,113, 748,119, 745,126 C 741,133, 730,135, 718,135 C 695,135, 680,140, 668,155 C 660,165, 655,175, 655,185 L 590,185 C 575,185, 565,175, 558,165 C 550,155, 535,155, 520,155 L 470,155 C 450,155, 438,170, 430,180 C 422,190, 410,195, 395,195 L 380,195 Z" />
      <path d="M 630,130 Q 637,137 644,130" stroke-width="4" />
      <path d="M 710,114 Q 706,116 703,113" stroke-width="4" />
      <path d="M 595,105 Q 602,85 612,100" stroke-width="4" />
      <path d="M 580,108 Q 585,90 594,103" stroke-width="3" />
      <path d="M 380,150 C 372,154, 368,163, 372,172" stroke-width="4" />
    </g>
    <text x="50" y="300" class="blue-text" font-size="120" letter-spacing="-3">RHINO</text>
    <text x="495" y="300" class="pink-text" font-size="120" letter-spacing="-2">cargo</text>
    <text x="55" y="365" class="sub-text" font-size="24">LOGÍSTICA &amp; SERVIÇOS</text>
    <g id="chevrons" transform="translate(30, 0)">
      <path d="M 790,50 L 890,195 L 790,340 L 835,340 L 935,195 L 835,50 Z" fill="#E9008C" />
      <path d="M 870,145 L 905,195 L 870,245 L 890,245 L 925,195 L 890,145 Z" fill="#32B64A" />
    </g>
  </g>
</svg>
`;


interface FaturacoesProps {
  viagens: Viagem[];
  viaturas: Viatura[];
  motoristas: Motorista[];
  currentUser: Usuario;
  onRefreshData: () => Promise<void>;
}

export default function Faturacoes({ 
  viagens, 
  viaturas, 
  motoristas, 
  currentUser, 
  onRefreshData 
}: FaturacoesProps) {
  
  // Filter States
  const [filters, setFilters] = useState({
    numero_viagem: "",
    data_partida: "",
    origem: "",
    destino: "",
    produto: "",
    p_o: "",
    faturacao_mzn: "",
    motorista_nome: "",
    estado: ""
  });

  // Modal States
  const [editingTrip, setEditingTrip] = useState<Viagem | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Viagem | null>(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    faturacao_mzn: 0,
    p_o: "",
    intermediacao_mzn: 0,
    escolta_mzn: 0,
    quebras_faltas_mzn: 0,
    estado: "em_curso" as "em_curso" | "concluida",
    observacoes: ""
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      numero_viagem: "",
      data_partida: "",
      origem: "",
      destino: "",
      produto: "",
      p_o: "",
      faturacao_mzn: "",
      motorista_nome: "",
      estado: ""
    });
  };

  // Filtered Voyages
  const filteredViagens = viagens.filter(t => {
    const totalMatch = filters.faturacao_mzn === "" || 
      t.faturacao_mzn.toString().includes(filters.faturacao_mzn) ||
      t.faturacao_mzn.toLocaleString().includes(filters.faturacao_mzn);

    return (
      (t.numero_viagem || "").toLowerCase().includes(filters.numero_viagem.toLowerCase()) &&
      (t.data_partida || "").toLowerCase().includes(filters.data_partida.toLowerCase()) &&
      (t.origem || "").toLowerCase().includes(filters.origem.toLowerCase()) &&
      (t.destino || "").toLowerCase().includes(filters.destino.toLowerCase()) &&
      (t.produto || "").toLowerCase().includes(filters.produto.toLowerCase()) &&
      (t.p_o || "").toLowerCase().includes(filters.p_o.toLowerCase()) &&
      totalMatch &&
      (t.motorista_nome || "").toLowerCase().includes(filters.motorista_nome.toLowerCase()) &&
      (filters.estado === "" || t.estado === filters.estado)
    );
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Fatura/Viagem", "Data", "Origem/Local", "Destino", "Produto", 
      "Guia/P.O.", "Total Faturado (MZN)", "Motorista", "Estado", 
      "Custos Combustivel (MZN)", "Intermediação (MZN)", "Escolta (MZN)", 
      "Quebras/Faltas (MZN)", "Remanescente Líquido (MZN)"
    ];

    const rows = filteredViagens.map(t => [
      t.numero_viagem,
      t.data_partida,
      t.origem,
      t.destino,
      t.produto,
      t.p_o || "Sem Guia",
      t.faturacao_mzn,
      t.motorista_nome,
      t.estado === "concluida" ? "Concluída" : "Em Curso",
      t.total_combustivel_mzn,
      t.intermediacao_mzn,
      t.escolta_mzn,
      t.quebras_faltas_mzn,
      t.total_remanescente_mzn
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Faturacao_Viagens_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
  const handleOpenEdit = (trip: Viagem) => {
    setEditingTrip(trip);
    setEditForm({
      faturacao_mzn: trip.faturacao_mzn || 0,
      p_o: trip.p_o || "",
      intermediacao_mzn: trip.intermediacao_mzn || 0,
      escolta_mzn: trip.escolta_mzn || 0,
      quebras_faltas_mzn: trip.quebras_faltas_mzn || 0,
      estado: trip.estado,
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
      // Calculate remaining value on client side before sending
      const res = await fetch(`/api/viagens/${editingTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: editForm.estado,
          intermediacao_mzn: editForm.intermediacao_mzn,
          escolta_mzn: editForm.escolta_mzn,
          quebras_faltas_mzn: editForm.quebras_faltas_mzn,
          faturacao_mzn: editForm.faturacao_mzn,
          p_o: editForm.p_o,
          observacoes: editForm.observacoes,
          // maintain existing details
          data_chegada: editingTrip.data_chegada || new Date().toISOString().substring(0, 16),
          origem_combustivel: editingTrip.origem_combustivel || ""
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar alterações da faturamento.");
      }

      setSaveSuccess("Dados de faturação e custos atualizados com sucesso!");
      await onRefreshData();
      
      // Keep modal open briefly to show success, then close
      setTimeout(() => {
        setEditingTrip(null);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Houve um problema de rede ao atualizar a faturamento.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Print Invoicing Report
  const printInvoicingReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalFaturado = filteredViagens.reduce((sum, t) => sum + (t.faturacao_mzn || 0), 0);
    const totalCombustivel = filteredViagens.reduce((sum, t) => sum + (t.total_combustivel_mzn || 0), 0);
    const totalDespesas = filteredViagens.reduce((sum, t) => sum + (t.intermediacao_mzn + t.escolta_mzn + t.quebras_faltas_mzn), 0);
    const totalLiquido = filteredViagens.reduce((sum, t) => sum + (t.total_remanescente_mzn || 0), 0);

    const rowsHtml = filteredViagens.map(t => `
      <tr>
        <td><strong>${t.numero_viagem}</strong></td>
        <td>${t.data_partida.replace("T", " ")}</td>
        <td>${t.origem} → ${t.destino}</td>
        <td>${t.cliente}</td>
        <td>${t.produto}</td>
        <td style="text-align: right;">${t.faturacao_mzn.toLocaleString("pt-MZ")} MZN</td>
        <td style="text-align: right;">${t.total_combustivel_mzn.toLocaleString("pt-MZ")} MZN</td>
        <td style="text-align: right;">${(t.intermediacao_mzn + t.escolta_mzn + t.quebras_faltas_mzn).toLocaleString("pt-MZ")} MZN</td>
        <td style="text-align: right; font-weight: bold; color: ${t.total_remanescente_mzn >= 0 ? '#2f855a' : '#c53030'};">
          ${t.total_remanescente_mzn.toLocaleString("pt-MZ")} MZN
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Faturação e Receitas - Rhino Cargo</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2d3748; background: #fff; line-height: 1.5; }
            .report-container { max-width: 1100px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header-layout { display: flex; justify-content: space-between; border-bottom: 2px solid #2B6CB0; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { font-size: 13px; color: #4a5568; line-height: 1.4; }
            .company-name { font-size: 22px; font-weight: 800; color: #2B6CB0; letter-spacing: -0.5px; margin-bottom: 4px; }
            .doc-title-badge { background: #EBF8FF; color: #2B6CB0; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #BEE3F8; }
            
            .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #edf2f7; text-align: center; }
            .stat-value { font-size: 18px; font-weight: 800; color: #2d3748; margin-top: 5px; }
            .stat-label { font-size: 10px; color: #718096; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }

            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
            .table th { background: #2B6CB0; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 10px; text-align: left; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; }
            .table tr:nth-child(even) td { background: #fcfdfd; }
            
            .footer-note { text-align: center; color: #a0aec0; font-size: 10px; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
            @media print {
              body { padding: 0; background: none; }
              .report-container { border: none; padding: 0; max-width: 100%; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header-layout">
              <div style="display: flex; align-items: center; gap: 20px;">
                ${PRINT_LOGO_SVG}
                <div class="company-info">
                  <div class="company-name">RHINO CARGO, LIMITADA</div>
                  <div>Porto de Maputo, Recinto Portuário, Maputo, Moçambique</div>
                  <div>NUIT: 400582914</div>
                </div>
              </div>
              <div class="doc-title-badge">Relatório Financeiro de Faturação</div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Faturado (Bruto)</div>
                <div class="stat-value">${totalFaturado.toLocaleString("pt-MZ")} MZN</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Custo de Combustível</div>
                <div class="stat-value">${totalCombustivel.toLocaleString("pt-MZ")} MZN</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Custos Extra Operações</div>
                <div class="stat-value">${totalDespesas.toLocaleString("pt-MZ")} MZN</div>
              </div>
              <div class="stat-card" style="background: #E6FFFA; border-color: #B2F5EA;">
                <div class="stat-label">Saldo / Margem Líquida</div>
                <div class="stat-value" style="color: #234E52;">${totalLiquido.toLocaleString("pt-MZ")} MZN</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Fatura</th>
                  <th>Partida</th>
                  <th>Trajeto (Rota)</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th style="text-align: right;">Faturado Bruto</th>
                  <th style="text-align: right;">Combustível</th>
                  <th style="text-align: right;">Despesas Extra</th>
                  <th style="text-align: right;">Saldo Líquido</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer-note">
              Relatório emitido em ${new Date().toLocaleString("pt-MZ")} por ${currentUser?.nome || "Utilizador Rhino Cargo"}.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Aggregated Statistics for Invoicing Tab
  const totalBilled = filteredViagens.reduce((sum, t) => sum + (t.faturacao_mzn || 0), 0);
  const totalRemaining = filteredViagens.reduce((sum, t) => sum + (t.total_remanescente_mzn || 0), 0);
  const totalFuelCost = filteredViagens.reduce((sum, t) => sum + (t.total_combustivel_mzn || 0), 0);
  const totalExpenses = filteredViagens.reduce((sum, t) => sum + (t.intermediacao_mzn + t.escolta_mzn + t.quebras_faltas_mzn), 0);

  return (
    <div className="space-y-6" id="faturacoes-tab-container">
      
      {/* 1. Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Coins className="h-5 w-5 text-rhino-pink" />
            FATURAÇÕES & RECEITAS
          </h1>
          <p className="text-xs text-slate-400">
            Controle de faturamento, guias de transporte (P.O.), margens operacionais e despesas de viagem.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg bg-rhino-muted hover:bg-rhino-muted/80 text-xs text-slate-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rhino-border"
          >
            <X className="h-3.5 w-3.5" />
            Limpar Filtros
          </button>

          <button 
            onClick={printInvoicingReport}
            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-600 font-sans"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Relatório
          </button>
          
          <button 
            onClick={exportToCSV}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rhino-pink/10"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* 2. Key Billing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        
        {/* Total Gross Invoiced */}
        <div className="bg-rhino-card border border-rhino-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rhino-blue/15 text-rhino-blue rounded-lg">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Faturado (Bruto)</span>
            <span className="text-lg font-mono font-black text-white block mt-0.5">
              {totalBilled.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Frete bruto acumulado</span>
          </div>
        </div>

        {/* Total Fuel Spent */}
        <div className="bg-rhino-card border border-rhino-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rhino-pink/15 text-rhino-pink rounded-lg">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Custo Combustível</span>
            <span className="text-lg font-mono font-black text-white block mt-0.5">
              {totalFuelCost.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[9px] text-rhino-pink/80 font-mono">
              {totalBilled > 0 ? ((totalFuelCost / totalBilled) * 100).toFixed(1) : 0}% do faturamento
            </span>
          </div>
        </div>

        {/* Extra Expenses */}
        <div className="bg-rhino-card border border-rhino-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Despesas Extra (Rotas)</span>
            <span className="text-lg font-mono font-black text-white block mt-0.5">
              {totalExpenses.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Escolta, Intermediação, Faltas</span>
          </div>
        </div>

        {/* Remaining Net Income */}
        <div className="bg-rhino-card border border-rhino-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rhino-green/15 text-rhino-green rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Saldo Líquido</span>
            <span className="text-lg font-mono font-black text-rhino-green block mt-0.5">
              {totalRemaining.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[9px] text-rhino-green font-mono">
              Margem Líquida: {totalBilled > 0 ? ((totalRemaining / totalBilled) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* 3. Main Invoicing Table */}
      <div className="bg-rhino-card border border-rhino-border rounded-xl overflow-hidden shadow-xl no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Header Title Row */}
              <tr className="bg-rhino-dark/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-rhino-border">
                <th className="p-3.5 whitespace-nowrap">Nº Fatura</th>
                <th className="p-3.5 whitespace-nowrap">Data Partida</th>
                <th className="p-3.5 whitespace-nowrap">Local (Origem)</th>
                <th className="p-3.5 whitespace-nowrap">Destino</th>
                <th className="p-3.5 whitespace-nowrap">Produto</th>
                <th className="p-3.5 whitespace-nowrap">Guia / P.O.</th>
                <th className="p-3.5 whitespace-nowrap text-right">Total (Bruto)</th>
                <th className="p-3.5 whitespace-nowrap">Motorista</th>
                <th className="p-3.5 whitespace-nowrap">Estado</th>
                <th className="p-3.5 whitespace-nowrap text-center">Ações</th>
              </tr>
              
              {/* Filtering Input Row */}
              <tr className="bg-rhino-dark/40 border-b border-rhino-border/80">
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.numero_viagem}
                    onChange={(e) => handleFilterChange("numero_viagem", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.data_partida}
                    onChange={(e) => handleFilterChange("data_partida", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.origem}
                    onChange={(e) => handleFilterChange("origem", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.destino}
                    onChange={(e) => handleFilterChange("destino", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.produto}
                    onChange={(e) => handleFilterChange("produto", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.p_o}
                    onChange={(e) => handleFilterChange("p_o", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar MZN..."
                    value={filters.faturacao_mzn}
                    onChange={(e) => handleFilterChange("faturacao_mzn", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-right text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.motorista_nome}
                    onChange={(e) => handleFilterChange("motorista_nome", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="p-2">
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange("estado", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">Todos</option>
                    <option value="em_curso">Em Curso</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </td>
                <td className="p-2"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredViagens.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Nenhuma viagem ou faturação encontrada para os filtros indicados.
                  </td>
                </tr>
              ) : (
                filteredViagens.map(t => {
                  const isCompleted = t.estado === "concluida";
                  return (
                    <tr 
                      key={t.id} 
                      className="hover:bg-slate-800/30 transition-all group"
                    >
                      {/* Nº Fatura */}
                      <td className="p-3.5 font-mono font-bold text-white tracking-wider">
                        {t.numero_viagem}
                      </td>
                      
                      {/* Data Partida */}
                      <td className="p-3.5 font-mono text-slate-300">
                        {t.data_partida.replace("T", " ")}
                      </td>
                      
                      {/* Local */}
                      <td className="p-3.5 text-slate-300 font-medium">
                        {t.origem}
                      </td>
                      
                      {/* Destino */}
                      <td className="p-3.5 text-slate-300 font-medium">
                        {t.destino}
                      </td>
                      
                      {/* Produto */}
                      <td className="p-3.5 text-slate-400">
                        {t.produto}
                      </td>
                      
                      {/* Guia */}
                      <td className="p-3.5 text-slate-400 font-mono">
                        {t.p_o || <span className="text-slate-600 italic">Não Informado</span>}
                      </td>
                      
                      {/* Total */}
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                        {t.faturacao_mzn.toLocaleString("pt-MZ")} MZN
                      </td>
                      
                      {/* Motorista */}
                      <td className="p-3.5 text-slate-300 font-medium">
                        {t.motorista_nome}
                      </td>
                      
                      {/* Estado */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                          {isCompleted ? "CONCLUÍDA" : "EM CURSO"}
                        </span>
                      </td>
                      
                      {/* Ações */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Editar Dados de Faturação"
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingInvoice(t)}
                            title="Visualizar Nota de Crédito/Fatura"
                            className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: EDIT INVOICING PARAMETERS */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ajustar Faturação</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Viagem Ref: {editingTrip.numero_viagem}</p>
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
                
                {/* Faturação Bruta */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Faturação Bruta (MZN)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editForm.faturacao_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, faturacao_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Guia / P.O. Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nº Guia / P.O.</label>
                  <input
                    type="text"
                    placeholder="Ex: PO-10293"
                    value={editForm.p_o}
                    onChange={(e) => setEditForm(p => ({ ...p, p_o: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Custos de Intermediação */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Intermediação (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.intermediacao_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, intermediacao_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Custos de Escolta */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Escolta (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.escolta_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, escolta_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quebras / Faltas */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Quebras / Faltas (MZN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.quebras_faltas_mzn}
                    onChange={(e) => setEditForm(p => ({ ...p, quebras_faltas_mzn: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Estado Fatura */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Estado da Fatura</label>
                  <select
                    value={editForm.estado}
                    onChange={(e) => setEditForm(p => ({ ...p, estado: e.target.value as "em_curso" | "concluida" }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="em_curso">Em Curso (Aberto)</option>
                    <option value="concluida">Concluída (Faturado)</option>
                  </select>
                </div>

              </div>

              {/* Observações */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Observações da Faturação</label>
                <textarea
                  rows={2}
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Notas de auditoria ou pendências financeiras..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Real-time Math Summary */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Faturação Bruta:</span>
                  <span className="text-emerald-400">+{editForm.faturacao_mzn.toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>(-) Abastecimento Inicial:</span>
                  <span>-{editingTrip.total_combustivel_mzn.toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>(-) Outros Custos (Soma):</span>
                  <span>-{(editForm.intermediacao_mzn + editForm.escolta_mzn + editForm.quebras_faltas_mzn).toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div className="border-t border-slate-800/80 pt-1.5 flex justify-between font-bold">
                  <span className="text-slate-300">Margem Líquida Remanescente:</span>
                  <span className={editForm.faturacao_mzn - (editingTrip.total_combustivel_mzn + editForm.intermediacao_mzn + editForm.escolta_mzn + editForm.quebras_faltas_mzn) >= 0 ? "text-emerald-400" : "text-rose-500"}>
                    {(editForm.faturacao_mzn - (editingTrip.total_combustivel_mzn + editForm.intermediacao_mzn + editForm.escolta_mzn + editForm.quebras_faltas_mzn)).toLocaleString("pt-MZ")} MZN
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
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VIEW & PRINT CORPORATE INVOICE */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-sm flex items-start justify-center p-4 md:p-8">
          
          {/* Printable Container */}
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden print:bg-white print:text-slate-950 print:border-0 print:shadow-none print:m-0 print:p-0">
            
            {/* Top Command Bar (Hidden during print) */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-500 h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">Visualizador de Documento de Faturação</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Documento
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-slate-400 hover:text-white transition-all p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* The Invoice Form Sheet itself */}
            <div className="p-8 md:p-12 space-y-8 bg-slate-900 text-slate-300 print:bg-white print:text-slate-950 print:p-0">
              
              {/* Invoice Sheet Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-800/80 pb-6 print:border-slate-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img src={logoImg} className="h-14 w-auto object-contain print:h-14" alt="RHINO CARGO" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-black text-white tracking-wider uppercase print:text-slate-950">RHINO CARGO LDA</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold uppercase print:border print:border-slate-300 print:bg-white print:text-slate-700">MOÇAMBIQUE</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium print:text-slate-500">Transportes Internacionais & Logística Integrada</p>
                    <p className="text-[9px] text-slate-500 font-mono print:text-slate-600">Av. das Indústrias, Nº 4812, Bairro da Machava • Maputo, Moçambique</p>
                    <p className="text-[9px] text-slate-500 font-mono print:text-slate-600">NUIT: 4005849302 | Email: financeiro@rhinocargo.co.mz</p>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">Nota de Débito / Fatura</span>
                  <h2 className="text-xl font-mono font-bold text-white print:text-slate-900">Nº {viewingInvoice.numero_viagem}</h2>
                  <div className="text-[10px] text-slate-400 space-y-0.5 print:text-slate-600">
                    <span className="block">Data Emissão: <span className="font-mono">{new Date().toISOString().substring(0,10)}</span></span>
                    <span className="block">Guia Ref: <span className="font-mono">{viewingInvoice.p_o || "Não Informada"}</span></span>
                    <span className="block">Estado Operação: <span className="font-bold">{viewingInvoice.estado === "concluida" ? "CONCLUÍDA" : "EM CURSO"}</span></span>
                  </div>
                </div>
              </div>

              {/* Entity Billing Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                
                {/* Client / Bill To */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Facturar a (Cliente):</span>
                  <h3 className="text-xs font-bold text-white uppercase print:text-slate-900">{viewingInvoice.cliente}</h3>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">Entidade registada para serviços de logística rodoviária.</p>
                  <p className="text-[9px] text-slate-500 print:text-slate-500">Moçambique, África Oriental</p>
                </div>

                {/* Voyage context & Fleet */}
                <div className="space-y-1 font-mono text-[10px] text-slate-400 print:text-slate-600">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block font-sans">Contexto de Transporte:</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    <span>Viatura / Frota:</span>
                    <span className="text-white font-sans font-semibold print:text-slate-900">{viewingInvoice.viatura_marca} {viewingInvoice.viatura_modelo} ({viewingInvoice.viatura_matricula})</span>
                    
                    <span>Motorista:</span>
                    <span className="text-white font-sans print:text-slate-900">{viewingInvoice.motorista_nome}</span>

                    <span>Data de Partida:</span>
                    <span className="text-slate-300">{viewingInvoice.data_partida.replace("T", " ")}</span>

                    {viewingInvoice.data_chegada && (
                      <>
                        <span>Data de Chegada:</span>
                        <span className="text-slate-300">{viewingInvoice.data_chegada.replace("T", " ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Itemized Services Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden print:border-slate-300">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                      <th className="p-3">Descrição do Serviço / Rota</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3 text-right">Quantidade (Sistemas)</th>
                      <th className="p-3 text-right">Tarifa Unitária / Frete</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    <tr className="text-slate-300 print:text-slate-800">
                      <td className="p-3">
                        <span className="font-bold text-white print:text-slate-900">Frete de Rota Rodoviária</span>
                        <div className="text-[9px] text-slate-500 mt-0.5 print:text-slate-500">Trajeto operacional: {viewingInvoice.origem} para {viewingInvoice.destino}</div>
                      </td>
                      <td className="p-3 font-mono">{viewingInvoice.produto}</td>
                      <td className="p-3 text-right font-mono">1 Rota Completa</td>
                      <td className="p-3 text-right font-mono">{viewingInvoice.faturacao_mzn.toLocaleString("pt-MZ")} MZN</td>
                      <td className="p-3 text-right font-mono font-bold text-white print:text-slate-900">{viewingInvoice.faturacao_mzn.toLocaleString("pt-MZ")} MZN</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Invoicing Adjustments & Expenses Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* Notes/Terms */}
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-[9px] leading-relaxed text-slate-400 print:bg-white print:text-slate-500 print:border-slate-300">
                    <span className="font-bold text-slate-300 block mb-1 print:text-slate-700">Termos de Pagamento e Condições:</span>
                    O pagamento desta nota de débito deve ser efetuado no prazo máximo de 15 dias após a emissão. Os valores indicados são finais e refletem o frete acordado, já deduzidos de possíveis custos e quebras imputadas ao trajeto. Por favor, envie o comprovativo para financeiro@rhinocargo.co.mz.
                  </div>
                  {viewingInvoice.observacoes && (
                    <div className="text-[9px] text-slate-400 print:text-slate-500">
                      <span className="font-bold text-slate-300 block print:text-slate-700">Observações:</span>
                      {viewingInvoice.observacoes}
                    </div>
                  )}
                </div>

                {/* Math totals sheet */}
                <div className="space-y-2 font-mono text-[10px] text-slate-400 print:text-slate-700">
                  <div className="flex justify-between">
                    <span>Faturação Rodoviária Bruta:</span>
                    <span className="text-white font-bold print:text-slate-900">+{viewingInvoice.faturacao_mzn.toLocaleString("pt-MZ")} MZN</span>
                  </div>
                  
                  <div className="flex justify-between text-slate-500 print:text-slate-500 border-b border-slate-800/40 pb-1.5 print:border-slate-100">
                    <span>(-) Custos de Abastecimento:</span>
                    <span>-{viewingInvoice.total_combustivel_mzn.toLocaleString("pt-MZ")} MZN</span>
                  </div>

                  <div className="flex justify-between text-slate-500 print:text-slate-500">
                    <span>(-) Custos de Intermediação:</span>
                    <span>-{viewingInvoice.intermediacao_mzn.toLocaleString("pt-MZ")} MZN</span>
                  </div>

                  <div className="flex justify-between text-slate-500 print:text-slate-500">
                    <span>(-) Custos de Escolta:</span>
                    <span>-{viewingInvoice.escolta_mzn.toLocaleString("pt-MZ")} MZN</span>
                  </div>

                  <div className="flex justify-between text-slate-500 print:text-slate-500 border-b border-slate-800/40 pb-1.5 print:border-slate-100">
                    <span>(-) Penalidades (Faltas/Quebras):</span>
                    <span>-{viewingInvoice.quebras_faltas_mzn.toLocaleString("pt-MZ")} MZN</span>
                  </div>

                  <div className="flex justify-between text-[12px] font-bold font-sans pt-1">
                    <span className="text-slate-200 print:text-slate-900">Saldo Líquido da Viagem:</span>
                    <span className="text-emerald-400 print:text-emerald-600 font-mono text-[13px]">
                      {viewingInvoice.total_remanescente_mzn.toLocaleString("pt-MZ")} MZN
                    </span>
                  </div>
                </div>

              </div>

              {/* Signature Sheet */}
              <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[10px]">
                <div className="space-y-1">
                  <div className="border-b border-slate-800/80 mx-auto w-3/4 print:border-slate-400"></div>
                  <span className="text-slate-500 block">Autorizado por Rhino Cargo Financeiro</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-800/80 mx-auto w-3/4 print:border-slate-400"></div>
                  <span className="text-slate-500 block">Recebido e Aceito por Cliente / Parceiro</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
