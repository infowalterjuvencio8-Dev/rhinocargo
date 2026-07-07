import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Fuel, Edit2, Search, Printer, Download, MapPin, 
  X, AlertTriangle, Check, FileSpreadsheet 
} from "lucide-react";
import { Abastecimento, PrecoProvincia, Usuario } from "../types";
<<<<<<< HEAD
import logoImg from "./logo.png";

import { PRINT_LOGO_SVG } from "./LogoConstant";
=======

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
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f


interface AbastecimentosProps {
  abastecimentos: Abastecimento[];
  provincias: PrecoProvincia[];
  currentUser: Usuario | null;
  onRefreshData: () => void;
}

export default function Abastecimentos({ 
  abastecimentos, provincias, currentUser, onRefreshData 
}: AbastecimentosProps) {
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "administracao";

  // State to edit fuel price
  const [editingProvince, setEditingProvince] = useState<PrecoProvincia | null>(null);
  const [priceForm, setPriceForm] = useState({
    diesel: 0,
    gasolina: 0,
    gas: 0
  });

  // Filters State
  const [filters, setFilters] = useState({
    viagem: "",
    viatura_matricula: "",
    cliente: "",
    bomba_name: "",
    provincia: "",
    bomba_litros: "",
    sistema_litros: "",
    diferenca: "",
    valor_combustivel: "",
    valor_unitario: ""
  });

  const handleFilterChange = (col: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };

  const clearFilters = () => {
    setFilters({
      viagem: "",
      viatura_matricula: "",
      cliente: "",
      bomba_name: "",
      provincia: "",
      bomba_litros: "",
      sistema_litros: "",
      diferenca: "",
      valor_combustivel: "",
      valor_unitario: ""
    });
  };

  // Filtered Fuel Refuels
  const filteredAbastecimentos = abastecimentos.filter(a => {
    return (
      (a.viagem || "").toLowerCase().includes(filters.viagem.toLowerCase()) &&
      (a.viatura_matricula || "").toLowerCase().includes(filters.viatura_matricula.toLowerCase()) &&
      (a.cliente || "").toLowerCase().includes(filters.cliente.toLowerCase()) &&
      (a.bomba_name || "").toLowerCase().includes(filters.bomba_name.toLowerCase()) &&
      (a.provincia || "").toLowerCase().includes(filters.provincia.toLowerCase()) &&
      (a.bomba_litros.toString()).includes(filters.bomba_litros) &&
      (a.sistema_litros.toString()).includes(filters.sistema_litros) &&
      (a.diferenca.toString()).includes(filters.diferenca) &&
      (a.valor_combustivel.toString()).includes(filters.valor_combustivel) &&
      (a.valor_unitario.toString()).includes(filters.valor_unitario)
    );
  });

  // Export to Excel/CSV
  const exportToExcel = () => {
    const headers = [
      "Viatura", "Viagem", "Cliente", "Data Abastecimento", "Bomba", 
      "Província", "Litros Bomba", "Litros Sistema", "Diferença", 
      "Custo Combustível (MZN)", "Preço Unitário (MZN/L)"
    ];
    const rows = filteredAbastecimentos.map(a => [
      a.viatura_matricula, a.viagem || "N/A", a.cliente || "N/A", 
      a.data_abastecimento, a.bomba_name, a.provincia, 
      a.bomba_litros, a.sistema_litros, a.diferenca, 
      a.valor_combustivel, a.valor_unitario
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RhinoCargo_Abastecimentos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger edit province price modal
  const startEditPrice = (prov: PrecoProvincia) => {
    if (!isAdmin) return;
    setEditingProvince(prov);
    setPriceForm({
      diesel: prov.diesel,
      gasolina: prov.gasolina,
      gas: prov.gas
    });
  };

  // Submit new price
  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvince) return;

    try {
      const response = await fetch(`/api/precos_provincias/${encodeURIComponent(editingProvince.provincia)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceForm)
      });

      if (response.ok) {
        setEditingProvince(null);
        onRefreshData();
      } else {
        alert("Erro ao salvar preços de combustível.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Print Fuel Report
  const printFuelReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalLitrosBomba = filteredAbastecimentos.reduce((acc, curr) => acc + curr.bomba_litros, 0);
    const totalLitrosSistema = filteredAbastecimentos.reduce((acc, curr) => acc + curr.sistema_litros, 0);
    const totalDesvio = filteredAbastecimentos.reduce((acc, curr) => acc + curr.diferenca, 0);
    const totalCusto = filteredAbastecimentos.reduce((acc, curr) => acc + curr.valor_combustivel, 0);

    const rowsHtml = filteredAbastecimentos.map(a => `
      <tr>
        <td>${a.viatura_matricula}</td>
        <td>${a.viagem || "Avulso"}</td>
        <td>${a.bomba_name} (${a.provincia})</td>
        <td style="text-align: right;">${a.bomba_litros.toFixed(1)} L</td>
        <td style="text-align: right;">${a.sistema_litros.toFixed(1)} L</td>
        <td style="text-align: right; color: ${Math.abs(a.diferenca) > 0 ? '#e53e3e' : '#2d3748'}; font-weight: bold;">
          ${a.diferenca.toFixed(1)} L
        </td>
        <td style="text-align: right;">${a.valor_unitario.toFixed(2)} MZN</td>
        <td style="text-align: right; font-weight: bold;">${a.valor_combustivel.toLocaleString("pt-MZ")} MZN</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Abastecimentos e Combustível - Rhino Cargo</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2d3748; background: #fff; line-height: 1.5; }
            .report-container { max-width: 1000px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
<<<<<<< HEAD
            .header-layout { display: flex; justify-content: space-between; align-items: center; background-color: #F0F2FA; padding: 20px; border-radius: 8px; border-bottom: 2px solid #283B91; padding-bottom: 20px; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .company-logo-container { width: 80px !important; height: 40px !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; }
            .company-logo-container svg, .company-logo-container img { width: 100% !important; height: auto !important; max-width: 80px !important; max-height: 40px !important; object-fit: contain !important; }
            
            .company-info { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.3; color: #4a5568; }
            .company-name { font-size: 18px; font-weight: 800; color: #283B91; margin: 0 0 2px 0; }
            .company-slogan { font-size: 11px; font-weight: bold; color: #EA088C; text-transform: uppercase; margin-bottom: 2px; }
            .company-subtitle { font-size: 10.5px; font-weight: 600; color: #38B44A; margin-bottom: 4px; }
            .company-details { font-size: 9.5px; color: #718096; }
            
            .doc-title-badge { background: #FFF0F6; color: #EA088C; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #FFD8E4; }
=======
            .header-layout { display: flex; justify-content: space-between; border-bottom: 2px solid #D69E2E; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { font-size: 13px; color: #4a5568; line-height: 1.4; }
            .company-name { font-size: 22px; font-weight: 800; color: #D69E2E; letter-spacing: -0.5px; margin-bottom: 4px; }
            .doc-title-badge { background: #FEFCBF; color: #975A16; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #FEEBC8; }
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f
            
            .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #edf2f7; text-align: center; }
            .stat-value { font-size: 18px; font-weight: 800; color: #2d3748; margin-top: 5px; }
            .stat-label { font-size: 10px; color: #718096; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }

            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
<<<<<<< HEAD
            .table th { background: #283B91; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 10px; text-align: left; }
=======
            .table th { background: #D69E2E; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 10px; text-align: left; }
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f
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
<<<<<<< HEAD
                  <div class="company-name">RHINO CARGO LDA</div>
                  <div class="company-slogan">Força | Flexibilidade | Movimento</div>
                  <div class="company-subtitle">Empresa Moçambicana</div>
                  <div class="company-details">
                    <div>🚛 Transportes de qualidade &nbsp;&bull;&nbsp; 📦 Entregas para todas províncias</div>
                    <div>📞 +258 871665500 &nbsp;&bull;&nbsp; Av. Romão Fernandes Farinha nr 1504, Maputo, Mozambique 1103</div>
                  </div>
=======
                  <div class="company-name">RHINO CARGO, LIMITADA</div>
                  <div>Porto de Maputo, Recinto Portuário, Maputo, Moçambique</div>
                  <div>NUIT: 400582914</div>
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f
                </div>
              </div>
              <div class="doc-title-badge">Relatório de Combustível</div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Abastecido (Bomba)</div>
<<<<<<< HEAD
                <div class="stat-value" style="color: #283B91;">${totalLitrosBomba.toLocaleString("pt-MZ")} L</div>
=======
                <div class="stat-value">${totalLitrosBomba.toLocaleString("pt-MZ")} L</div>
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Registado (Sistema)</div>
                <div class="stat-value">${totalLitrosSistema.toLocaleString("pt-MZ")} L</div>
              </div>
<<<<<<< HEAD
              <div class="stat-card" style="border-color: ${Math.abs(totalDesvio) > 0 ? '#FFD8E4' : '#edf2f7'}; background: ${Math.abs(totalDesvio) > 0 ? '#FFF0F6' : '#f7fafc'};">
                <div class="stat-label">Diferença / Desvio Acum.</div>
                <div class="stat-value" style="color: ${Math.abs(totalDesvio) > 0 ? '#EA088C' : '#2d3748'};">${totalDesvio.toFixed(1)} L</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Valor Total Gasto</div>
                <div class="stat-value" style="color: #38B44A;">${totalCusto.toLocaleString("pt-MZ")} MZN</div>
=======
              <div class="stat-card" style="border-color: ${Math.abs(totalDesvio) > 0 ? '#FED7D7' : '#edf2f7'}; background: ${Math.abs(totalDesvio) > 0 ? '#FFF5F5' : '#f7fafc'};">
                <div class="stat-label">Diferença / Desvio Acum.</div>
                <div class="stat-value" style="color: ${Math.abs(totalDesvio) > 0 ? '#e53e3e' : '#2d3748'};">${totalDesvio.toFixed(1)} L</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Valor Total Gasto</div>
                <div class="stat-value" style="color: #D69E2E;">${totalCusto.toLocaleString("pt-MZ")} MZN</div>
>>>>>>> 4e5fdc02b24fb0bdfc01f58ecafc0618baa4a82f
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Viatura</th>
                  <th>Viagem</th>
                  <th>Bomba / Província</th>
                  <th style="text-align: right;">Litros Bomba</th>
                  <th style="text-align: right;">Litros Sist.</th>
                  <th style="text-align: right;">Desvio</th>
                  <th style="text-align: right;">Preço Unitário</th>
                  <th style="text-align: right;">Custo Total</th>
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

  return (
    <div className="space-y-6" id="abastecimentos-tab-content">
      
      {/* LEFT 2 COLUMNS: Fuel Logs list */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Fuel className="text-amber-500 h-5 w-5" />
              <span>Registro de Abastecimentos</span>
            </h2>
            <p className="text-xs text-slate-400">Histórico detalhado de litros injetados na saída de viagem e análises de desvio.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2 px-3 rounded-lg cursor-pointer"
            >
              Limpar Filtros
            </button>
            <button
              onClick={printFuelReport}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 flex items-center gap-1.5 cursor-pointer rounded-lg font-sans"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={exportToExcel}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2 px-3 flex items-center gap-1.5 cursor-pointer rounded-lg"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden print-card">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Viatura</th>
                  <th className="p-3">Viagem</th>
                  <th className="p-3">Bomba / Província</th>
                  <th className="p-3 text-right">Lts Bomba</th>
                  <th className="p-3 text-right">Lts Sist.</th>
                  <th className="p-3 text-right">Preço/L</th>
                  <th className="p-3 text-right">Total</th>
                </tr>

                {/* Column Filters Row */}
                <tr className="bg-slate-900/60 border-b border-slate-800/40 no-print">
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="Viatura..."
                      value={filters.viatura_matricula}
                      onChange={(e) => handleFilterChange("viatura_matricula", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="Viagem..."
                      value={filters.viagem}
                      onChange={(e) => handleFilterChange("viagem", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="p-1">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Bomba..."
                        value={filters.bomba_name}
                        onChange={(e) => handleFilterChange("bomba_name", e.target.value)}
                        className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Província..."
                        value={filters.provincia}
                        onChange={(e) => handleFilterChange("provincia", e.target.value)}
                        className="w-1/2 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="Filtro..."
                      value={filters.bomba_litros}
                      onChange={(e) => handleFilterChange("bomba_litros", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="Filtro..."
                      value={filters.sistema_litros}
                      onChange={(e) => handleFilterChange("sistema_litros", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="Preço..."
                      value={filters.valor_unitario}
                      onChange={(e) => handleFilterChange("valor_unitario", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      placeholder="MZN..."
                      value={filters.valor_combustivel}
                      onChange={(e) => handleFilterChange("valor_combustivel", e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                    />
                  </td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {filteredAbastecimentos.map(a => {
                  const hasAnomaly = Math.abs(a.diferenca) > 0;
                  return (
                    <tr key={a.id} className="hover:bg-slate-800/10">
                      <td className="p-3 font-semibold whitespace-nowrap">{a.viatura_matricula}</td>
                      <td className="p-3 font-semibold text-slate-400 whitespace-nowrap">{a.viagem || "Avulso"}</td>
                      <td className="p-3 font-sans whitespace-nowrap">
                        <div className="font-semibold text-white">{a.bomba_name}</div>
                        <div className="text-[10px] text-slate-500 italic flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>{a.provincia}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold text-white">{a.bomba_litros} L</td>
                      <td className="p-3 text-right text-slate-300">{a.sistema_litros} L</td>
                      <td className="p-3 text-right font-semibold text-amber-500">{a.valor_unitario.toFixed(2)} MZN</td>
                      <td className="p-3 text-right">
                        <div className="font-bold text-white">{a.valor_combustivel.toLocaleString()} MZN</div>
                        {hasAnomaly && (
                          <div className="text-[9px] text-rose-400 font-bold flex items-center justify-end gap-1 font-sans">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            <span>Desvio: {a.diferenca.toFixed(1)}L</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredAbastecimentos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic font-sans">
                      Nenhum abastecimento registado na base de dados corresponde aos filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Editar Preço da Província */}
      <AnimatePresence>
        {editingProvince && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Editar Tarifas: {editingProvince.provincia}</h3>
                <button onClick={() => setEditingProvince(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePriceSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1.5">Preço Diesel (MZN / Litro)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceForm.diesel}
                    onChange={(e) => setPriceForm(p => ({ ...p, diesel: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1.5">Preço Gasolina (MZN / Litro)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceForm.gasolina}
                    onChange={(e) => setPriceForm(p => ({ ...p, gasolina: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1.5">Preço Gás (MZN / Litro)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceForm.gas}
                    onChange={(e) => setPriceForm(p => ({ ...p, gas: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingProvince(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-5 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Salvar Alterações</span>
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
