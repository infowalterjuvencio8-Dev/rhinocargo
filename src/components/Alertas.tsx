import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, 
  Calendar, Search, Printer, AlertOctagon, CheckSquare,
  Activity, Trash2, Shield, Info, Lock, User, RefreshCw, HelpCircle
} from "lucide-react";
import { Alerta, Usuario, AuditLog } from "../types";
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


interface AlertasProps {
  alertas: Alerta[];
  onResolveAlerta: (id: string) => void;
  currentUser?: Usuario | null;
}

export default function Alertas({ alertas, onResolveAlerta, currentUser }: AlertasProps) {
  // Navigation section: 'anomalias' or 'auditoria'
  const [activeSection, setActiveSection] = useState<"anomalias" | "auditoria">("anomalias");
  
  // Alertas local states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'resolved'

  // Auditoria logs states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/auditoria_logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Print Fuel Anomalies Report
  const printAnomaliasReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredAlertas.map(a => `
      <tr>
        <td><strong>ID #${a.id}</strong></td>
        <td>${a.titulo}</td>
        <td>${a.mensagem}</td>
        <td>${new Date(a.data_hora).toLocaleString("pt-MZ")}</td>
        <td style="font-weight: bold; text-transform: uppercase; color: ${a.gravidade === 'alta' ? '#c53030' : '#d69e2e'};">
          ${a.gravidade}
        </td>
        <td>${a.resolvido ? 'Resolvido' : 'Pendente (Ativo)'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Desvios e Alertas - Rhino Cargo</title>
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
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
            .table th { background: #283B91; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 10px; text-align: left; }
=======
            .header-layout { display: flex; justify-content: space-between; border-bottom: 2px solid #E53E3E; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { font-size: 13px; color: #4a5568; line-height: 1.4; }
            .company-name { font-size: 22px; font-weight: 800; color: #E53E3E; letter-spacing: -0.5px; margin-bottom: 4px; }
            .doc-title-badge { background: #FFF5F5; color: #C53030; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #FED7D7; }
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
            .table th { background: #E53E3E; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 10px; text-align: left; }
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
              <div class="doc-title-badge">Relatório de Desvios de Combustível</div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Alerta ID</th>
                  <th>Título</th>
                  <th>Mensagem / Evidência</th>
                  <th>Data/Hora Ocorrência</th>
                  <th>Gravidade</th>
                  <th>Estado</th>
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

  // Print System Audit Logs Trail
  const printAuditLogs = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredAuditLogs.map(log => `
      <tr>
        <td>${new Date(log.data_hora).toLocaleString("pt-MZ")}</td>
        <td><strong>${log.usuario_nome}</strong></td>
        <td>${log.acao}</td>
        <td>${log.detalhes}</td>
        <td style="font-family: monospace; text-align: right;">#${log.id}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Trilho de Auditoria do Sistema - Rhino Cargo</title>
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
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
            .table th { background: #283B91; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 9px; text-align: left; }
=======
            .header-layout { display: flex; justify-content: space-between; border-bottom: 2px solid #4A5568; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { font-size: 13px; color: #4a5568; line-height: 1.4; }
            .company-name { font-size: 22px; font-weight: 800; color: #4A5568; letter-spacing: -0.5px; margin-bottom: 4px; }
            .doc-title-badge { background: #EDF2F7; color: #4A5568; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #E2E8F0; }
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
            .table th { background: #4A5568; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 9px; text-align: left; }
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
              <div class="doc-title-badge">Trilho de Auditoria de Sistema</div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Utilizador Responsável</th>
                  <th>Categoria / Ação</th>
                  <th>Detalhes do Evento</th>
                  <th style="text-align: right;">ID Log</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer-note">
              Trilho de auditoria gerado em ${new Date().toLocaleString("pt-MZ")} por ${currentUser?.nome || "Utilizador Rhino Cargo"}.
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

  useEffect(() => {
    if (activeSection === "auditoria") {
      fetchAuditLogs();
    }
  }, [activeSection]);

  // Handle Pruning Logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/auditoria_logs/clear", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(result.message);
        setShowClearConfirm(false);
        fetchAuditLogs();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  // Filter Alertas
  const filteredAlertas = alertas.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.mensagem.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "active") {
      return matchesSearch && a.resolvido === 0;
    }
    if (statusFilter === "resolved") {
      return matchesSearch && a.resolvido === 1;
    }
    return matchesSearch;
  });

  const activeCount = alertas.filter(a => !a.resolvido).length;

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.usuario_nome.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                          log.detalhes.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                          log.acao.toLowerCase().includes(logSearchTerm.toLowerCase());
    
    if (logActionFilter !== "all") {
      if (logActionFilter === "auth") return matchesSearch && log.acao.includes("Autenticação");
      if (logActionFilter === "rh") return matchesSearch && (log.acao.includes("Funcionário") || log.acao.includes("Motorista") || log.acao.includes("Pessoal"));
      if (logActionFilter === "ops") return matchesSearch && (log.acao.includes("Viagem") || log.acao.includes("Lançamento") || log.acao.includes("Abastecimento"));
      if (logActionFilter === "sys") return matchesSearch && (log.acao.includes("Sistema") || log.acao.includes("Limpeza") || log.acao.includes("Inicialização"));
    }
    return matchesSearch;
  });

  // Action badge customizer
  const getActionBadgeStyle = (acao: string) => {
    const act = acao.toLowerCase();
    if (act.includes("autenticação") || act.includes("login")) {
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
    if (act.includes("falha")) {
      return "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold";
    }
    if (act.includes("registo") || act.includes("criação") || act.includes("cadastro")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (act.includes("edição") || act.includes("atualização") || act.includes("alteração")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    if (act.includes("exclusão") || act.includes("remoção")) {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
    return "bg-slate-800 text-slate-400 border border-slate-700";
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6" id="alertas-tab-content">
      
      {/* 1. Header and Navigation Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 no-print" id="auditoria-tab-switcher">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-rhino-pink h-5 w-5" />
            <span>Segurança, Integridade & Auditoria</span>
          </h2>
          <p className="text-xs text-slate-400">Controles integrados de conformidade, histórico de ações e integridade de dados.</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveSection("anomalias")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === "anomalias"
                ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Desvios & Alertas ({activeCount})</span>
          </button>
          <button
            onClick={() => setActiveSection("auditoria")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === "auditoria"
                ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Registo de Auditoria (Logs)</span>
          </button>
        </div>
      </div>

      {/* SUCCESS STATUS NOTIFICATION */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION A: DESVIOS & ANOMALIAS */}
      {activeSection === "anomalias" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="alertas-header">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 font-mono">Controle de Desvios de Combustível</h3>
              <p className="text-xs text-slate-500">Alertas automáticos disparados por inconsistências entre os dados de bombas de abastecimento e o sistema Rhino Cargo.</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={printAnomaliasReport}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-sans"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Desvios
              </button>
              <span className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{activeCount} Pendentes</span>
              </span>
            </div>
          </div>

          {/* Filter and search bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 no-print">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar mensagens de desvio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto ml-0 sm:ml-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`text-xs py-2 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === "all" ? "bg-amber-500 text-slate-950 font-bold" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Todos ({alertas.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`text-xs py-2 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === "active" ? "bg-rose-500 text-white font-bold" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Ativos ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`text-xs py-2 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === "resolved" ? "bg-emerald-500 text-slate-950 font-bold" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Resolvidos ({alertas.length - activeCount})
              </button>
            </div>
          </div>

          {/* Main Alerts Feed Grid */}
          <div className="space-y-4 print-card">
            {filteredAlertas.map(alerta => {
              const date = new Date(alerta.data_hora);
              const isResolved = alerta.resolvido === 1;
              const isHigh = alerta.gravidade === "alta";

              return (
                <div 
                  key={alerta.id} 
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isResolved 
                      ? "bg-slate-900/40 border-slate-800 text-slate-400" 
                      : isHigh 
                        ? "bg-rose-500/[0.03] border-rose-500/20 text-slate-200 shadow-lg shadow-rose-950/5" 
                        : "bg-amber-500/[0.02] border-amber-500/25 text-slate-200 shadow-lg shadow-amber-950/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl mt-0.5 shrink-0 ${
                      isResolved 
                        ? "bg-slate-800 text-slate-500" 
                        : isHigh 
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {isResolved ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : isHigh ? (
                        <AlertOctagon className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-bold text-sm text-slate-100">{alerta.titulo}</h3>
                        <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${
                          isResolved 
                            ? "bg-slate-800 text-slate-400" 
                            : isHigh 
                              ? "bg-rose-500/20 text-rose-400" 
                              : "bg-amber-500/20 text-amber-500"
                        }`}>
                          {alerta.gravidade}
                        </span>
                        {isResolved && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Resolvido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{alerta.mensagem}</p>
                      
                      {/* Timestamp and code meta */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-600" />
                          <span>{date.toLocaleDateString("pt-MZ")} {date.toLocaleTimeString("pt-MZ")}</span>
                        </span>
                        <span>•</span>
                        <span>Alerta ID: {alerta.id}</span>
                      </div>
                    </div>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => onResolveAlerta(alerta.id)}
                      className="text-xs font-bold bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 align-middle self-end md:self-auto no-print"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>Concluir Auditoria</span>
                    </button>
                  )}
                </div>
              );
            })}

            {filteredAlertas.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 italic">
                Nenhuma notificação de anomalia encontrada com os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: SYSTEM AUDIT LOG */}
      {activeSection === "auditoria" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Section Introduction */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 font-mono">Histórico de Atividades do Sistema</h3>
              <p className="text-xs text-slate-500">Registo inviolável de modificações críticas no banco de dados para segurança e conformidade operacional.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={printAuditLogs}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-sans"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Logs
              </button>

              <button 
                onClick={fetchAuditLogs}
                title="Atualizar Logs"
                className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>

              {isAdmin && (
                <div className="relative">
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Limpar Histórico Antigo</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-rose-500/40 shadow-xl shadow-rose-950/20 animate-scaleIn">
                      <span className="text-[10px] text-rose-400 font-bold px-2">Tem certeza?</span>
                      <button
                        onClick={handleClearLogs}
                        className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer"
                      >
                        Sim, podar logs
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2 rounded cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 no-print">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Filtrar por utilizador, ação, detalhes..."
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start md:self-auto ml-0 md:ml-auto overflow-x-auto max-w-full pb-1 md:pb-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1 shrink-0">Ações:</span>
              <button
                onClick={() => setLogActionFilter("all")}
                className={`text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logActionFilter === "all" ? "bg-rhino-pink text-white" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setLogActionFilter("auth")}
                className={`text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logActionFilter === "auth" ? "bg-blue-500/20 text-blue-400 border border-blue-500/25" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Autenticação
              </button>
              <button
                onClick={() => setLogActionFilter("rh")}
                className={`text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logActionFilter === "rh" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                RH & Equipa
              </button>
              <button
                onClick={() => setLogActionFilter("ops")}
                className={`text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logActionFilter === "ops" ? "bg-amber-500/20 text-amber-400 border border-amber-500/25" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Operações
              </button>
              <button
                onClick={() => setLogActionFilter("sys")}
                className={`text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logActionFilter === "sys" ? "bg-purple-500/20 text-purple-400 border border-purple-500/25" : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Sistema
              </button>
            </div>
          </div>

          {/* Logs View Area */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
            {loadingLogs ? (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rhino-pink" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">A obter logs de auditoria...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                      <th className="py-3.5 px-4 font-mono">Data / Hora</th>
                      <th className="py-3.5 px-4">Utilizador</th>
                      <th className="py-3.5 px-4">Categoria / Ação</th>
                      <th className="py-3.5 px-4">Detalhes do Evento</th>
                      <th className="py-3.5 px-4 font-mono text-right">ID Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/45 text-xs text-slate-300">
                    {filteredAuditLogs.map(log => {
                      const date = new Date(log.data_hora);
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/20 transition-all">
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {date.toLocaleDateString("pt-MZ")} {date.toLocaleTimeString("pt-MZ")}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-slate-500" />
                              <span className="font-bold text-slate-200">{log.usuario_nome}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getActionBadgeStyle(log.acao)}`}>
                              {log.acao}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-sm text-slate-300 leading-relaxed break-words">
                            {log.detalhes}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 text-right">
                            #{log.id}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                          Nenhum registo de auditoria encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Advisory Alert Panel */}
          <div className="bg-gradient-to-r from-blue-950/20 to-slate-900 border border-blue-900/30 rounded-2xl p-4 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-300">Aviso de Integridade Operacional</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                As credenciais de login para novos funcionários e motoristas registados são automaticamente encriptadas na base de dados com o algoritmo de derivação de chaves **PBKDF2 com hash SHA-512** de 1000 iterações. Os registos de auditoria registam todas as ações sensíveis sem possibilidade de manipulação direta pela interface, em conformidade com as diretrizes de conformidade informática para frotas comerciais.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
