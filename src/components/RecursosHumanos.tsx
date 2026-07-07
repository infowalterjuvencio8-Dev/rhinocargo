import React, { useState, useEffect } from "react";
import { 
  Briefcase, Calendar, CheckCircle, AlertTriangle, Clock, 
  DollarSign, FileText, Plus, User, Eye, Check, X, ShieldAlert, FileDown, Printer, Pencil
} from "lucide-react";
import { PedidoRH, ReciboSalario, Funcionario, Usuario } from "../types";
import logoImg from "./logo.png";

import { PRINT_LOGO_SVG } from "./LogoConstant";

import { motion, AnimatePresence } from "motion/react";

interface RecursosHumanosProps {
  currentUser: Usuario;
  onRefreshData: () => Promise<void>;
}

export default function RecursosHumanos({ currentUser, onRefreshData }: RecursosHumanosProps) {
  const [pedidos, setPedidos] = useState<PedidoRH[]>([]);
  const [recibos, setRecibos] = useState<ReciboSalario[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeSubTab, setActiveSubTab] = useState<"pedidos" | "recibos">("pedidos");

  // Form states for leave requests
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    funcionario_id: "",
    tipo: "Férias",
    data_inicio: "",
    data_fim: "",
    dias: "5",
    motivo: "",
    observacoes: ""
  });

  // Form states for payslips
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingPayslipId, setEditingPayslipId] = useState<number | null>(null);
  const [payForm, setPayForm] = useState({
    funcionario_id: "",
    mes_ano: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
    salario_base: "15000",
    bonus: "0",
    descontos: "0",
    estado: "Pago",
    observacoes: "",
    faltas: "0",
    subsidios: "0",
    horas_extras: "0",
    inss: "0",
    irps: "0"
  });

  const [saving, setSaving] = useState(false);

  // Determine user permissions
  // Roles: 'admin', 'rh', 'administracao', 'funcionario'
  const isEmployeeOnly = currentUser.role === "funcionario" || !currentUser.role;
  const isHR = currentUser.role === "rh" || currentUser.role === "admin";
  const isManager = currentUser.role === "admin" || currentUser.role === "rh" || currentUser.role === "administracao";

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPed, resRec, resFunc] = await Promise.all([
        fetch("/api/pedidos_rh"),
        fetch("/api/recibos_salarios"),
        fetch("/api/funcionarios")
      ]);

      if (resPed.ok && resRec.ok && resFunc.ok) {
        const dataPed = await resPed.json();
        const dataRec = await resRec.json();
        const dataFunc = await resFunc.json();

        setPedidos(dataPed);
        setRecibos(dataRec);
        setFuncionarios(dataFunc);
      } else {
        setError("Erro ao obter dados do pessoal e salários.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handle employee salary auto-fill when generating payslip
  const handlePayFuncionarioChange = (idStr: string) => {
    const fId = Number(idStr);
    const emp = funcionarios.find(f => f.id === fId);
    if (emp) {
      const base = emp.salario_base || 15000;
      const calculatedInss = Math.round(base * 0.03); // 3% standard employee INSS
      
      // Simple IRPS estimation for Mozambique:
      // Exempt up to 20,249 MZN, then progressive approximation
      let estimatedIrps = 0;
      if (base > 20249 && base <= 30000) {
        estimatedIrps = Math.round((base - 20249) * 0.10);
      } else if (base > 30000 && base <= 60000) {
        estimatedIrps = Math.round(975 + (base - 30000) * 0.15);
      } else if (base > 60000) {
        estimatedIrps = Math.round(5475 + (base - 60000) * 0.20);
      }

      setPayForm(prev => ({
        ...prev,
        funcionario_id: idStr,
        salario_base: String(base),
        bonus: "0",
        descontos: "0",
        faltas: "0",
        subsidios: "0",
        horas_extras: "0",
        inss: String(calculatedInss),
        irps: String(estimatedIrps)
      }));
    } else {
      setPayForm(prev => ({ ...prev, funcionario_id: idStr }));
    }
  };

  const handleCreateLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Identify target employee
    let targetFuncId = currentUser.funcionario_id;
    if (isManager && leaveForm.funcionario_id) {
      targetFuncId = Number(leaveForm.funcionario_id);
    }

    if (!targetFuncId) {
      setError("Nenhum funcionário selecionado ou associado.");
      return;
    }

    if (!leaveForm.data_inicio || !leaveForm.data_fim) {
      setError("As datas de início e fim são obrigatórias.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pedidos_rh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionario_id: targetFuncId,
          tipo: leaveForm.tipo,
          data_inicio: leaveForm.data_inicio,
          data_fim: leaveForm.data_fim,
          dias: Number(leaveForm.dias),
          motivo: leaveForm.motivo,
          estado: isHR ? "Aprovado" : "Pendente", // Auto-approved if created by HR/Admin
          observacoes: leaveForm.observacoes
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess("Pedido de licença registado com sucesso!");
        await loadData();
        setTimeout(() => {
          setIsLeaveModalOpen(false);
          setSuccess("");
        }, 1200);
      } else {
        setError(result.message || "Erro ao criar pedido.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha na ligação.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.funcionario_id || !payForm.mes_ano) {
      setError("Indique o funcionário e o mês/ano de referência.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingPayslipId 
        ? `/api/recibos_salarios/${editingPayslipId}` 
        : "/api/recibos_salarios";
      const method = editingPayslipId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionario_id: Number(payForm.funcionario_id),
          mes_ano: payForm.mes_ano,
          salario_base: Number(payForm.salario_base),
          bonus: Number(payForm.bonus || 0),
          descontos: Number(payForm.descontos || 0),
          estado: payForm.estado,
          observacoes: payForm.observacoes,
          faltas: Number(payForm.faltas || 0),
          subsidios: Number(payForm.subsidios || 0),
          horas_extras: Number(payForm.horas_extras || 0),
          inss: Number(payForm.inss || 0),
          irps: Number(payForm.irps || 0)
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(editingPayslipId ? "Recibo de salário atualizado com sucesso!" : "Recibo de salário gerado com sucesso!");
        await loadData();
        setTimeout(() => {
          setIsPayModalOpen(false);
          setEditingPayslipId(null);
          setSuccess("");
        }, 1200);
      } else {
        setError(result.message || "Erro ao processar recibo de salário.");
      }
    } catch (err) {
      console.error(err);
      setError("Falha ao submeter.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLeaveStatus = async (id: number, newStatus: "Aprovado" | "Rejeitado") => {
    try {
      const res = await fetch(`/api/pedidos_rh/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: newStatus,
          observacoes: `Atualizado por ${currentUser.nome} em ${new Date().toLocaleDateString()}`
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(`Pedido ${newStatus.toLowerCase()} com sucesso!`);
        await loadData();
        setTimeout(() => setSuccess(""), 1500);
      } else {
        setError(result.message || "Erro ao alterar estado do pedido.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar.");
    }
  };

  const handleUpdatePayslipStatus = async (id: number, newStatus: "Pago" | "Pendente") => {
    try {
      const res = await fetch(`/api/recibos_salarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: newStatus,
          observacoes: `Estado alterado em ${new Date().toLocaleDateString()}`
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(`Estado do recibo atualizado para ${newStatus}!`);
        await loadData();
        setTimeout(() => setSuccess(""), 1500);
      } else {
        setError(result.message || "Erro ao alterar estado.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede.");
    }
  };

  const openEditPayslip = (r: ReciboSalario) => {
    setEditingPayslipId(r.id);
    setPayForm({
      funcionario_id: String(r.funcionario_id),
      mes_ano: r.mes_ano,
      salario_base: String(r.salario_base),
      bonus: String(r.bonus || 0),
      descontos: String(r.descontos || 0),
      estado: r.estado,
      observacoes: r.observacoes || "",
      faltas: String(r.faltas || 0),
      subsidios: String(r.subsidios || 0),
      horas_extras: String(r.horas_extras || 0),
      inss: String(r.inss || 0),
      irps: String(r.irps || 0)
    });
    setIsPayModalOpen(true);
  };

  const downloadPayslip = (r: ReciboSalario) => {
    const base = r.salario_base || 0;
    const bonus = r.bonus || 0;
    const descontos = r.descontos || 0;
    const faltas = r.faltas || 0;
    const subsidios = r.subsidios || 0;
    const horasExtras = r.horas_extras || 0;
    const inss = r.inss || 0;
    const irps = r.irps || 0;

    const totalRendimentos = base + subsidios + horasExtras + bonus;
    const totalDescontos = faltas + inss + irps + descontos;
    const liquido = r.salario_liquido || (totalRendimentos - totalDescontos);

    const companyName = r.empresa_nome || "RHINO CARGO, LIMITADA";
    const companyNuit = r.empresa_nuit || "400582914";
    const companyLocation = r.empresa_localizacao || "Porto de Maputo, Recinto Portuário, Maputo, Moçambique";

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recibo de Salário - ${r.funcionario_nome}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2d3748; background: #fff; line-height: 1.5; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header-layout { display: flex; justify-content: space-between; align-items: center; background-color: #F0F2FA; padding: 20px; border-radius: 8px; border-bottom: 2px solid #283B91; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .company-logo-container { width: 80px !important; height: 40px !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; }
            .company-logo-container svg, .company-logo-container img { width: 100% !important; height: auto !important; max-width: 80px !important; max-height: 40px !important; object-fit: contain !important; }
            
            .company-info { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.3; color: #4a5568; }
            .company-name { font-size: 18px; font-weight: 800; color: #283B91; margin: 0 0 2px 0; }
            .company-slogan { font-size: 11px; font-weight: bold; color: #EA088C; text-transform: uppercase; margin-bottom: 2px; }
            .company-subtitle { font-size: 10.5px; font-weight: 600; color: #38B44A; margin-bottom: 4px; }
            .company-details { font-size: 9.5px; color: #718096; }
            
            .doc-title-badge { background: #FFF0F6; color: #EA088C; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #FFD8E4; }
            
            .meta-grid { display: grid; grid-template-cols: 12fr; gap: 15px; margin-bottom: 25px; background: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #edf2f7; }
            .meta-section { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; font-size: 12.5px; }
            .meta-item { margin-bottom: 6px; }
            .meta-label { font-weight: bold; color: #718096; display: inline-block; width: 140px; text-transform: uppercase; font-size: 11px; }
            .meta-value { color: #2d3748; font-weight: 600; }
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            .table th { background: #283B91; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 11px; text-align: left; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; }
            .table tr:nth-child(even) td { background: #fcfdfd; }
            
            .totals-section { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 15px; margin-bottom: 30px; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .totals-box { background: #f7fafc; padding: 12px; border-radius: 6px; border: 1px solid #edf2f7; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; }
            .totals-row.final { border-top: 2px solid #283B91; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 800; color: #283B91; }
            
            .signatures-container { margin-top: 50px; display: flex; justify-content: space-between; gap: 50px; }
            .sig-box { flex: 1; text-align: center; font-size: 12px; }
            .sig-line { border-top: 1px solid #a0aec0; margin-bottom: 8px; margin-top: 45px; }
            .sig-title { font-weight: 700; color: #4a5568; }
            .sig-sub { color: #718096; font-size: 11px; margin-top: 2px; }
 
            .footer-note { text-align: center; color: #a0aec0; font-size: 10px; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header-layout">
              <div style="display: flex; align-items: center; gap: 20px;">
                ${PRINT_LOGO_SVG}
                <div class="company-info">
                  <div class="company-name">RHINO CARGO LDA</div>
                  <div class="company-slogan">Força | Flexibilidade | Movimento</div>
                  <div class="company-subtitle">Empresa Moçambicana</div>
                  <div class="company-details">
                    <div>🚛 Transportes de qualidade &nbsp;&bull;&nbsp; 📦 Entregas para todas províncias</div>
                    <div>📞 +258 871665500 &nbsp;&bull;&nbsp; Av. Romão Fernandes Farinha nr 1504, Maputo, Mozambique 1103</div>
                  </div>
                </div>
              </div>
              <div class="doc-title-badge">Recibo de Salário</div>
            </div>

            <div class="meta-grid">
              <div class="meta-section">
                <div>
                  <div class="meta-item"><span class="meta-label">Colaborador:</span><span class="meta-value">${r.funcionario_nome}</span></div>
                  <div class="meta-item"><span class="meta-label">Função / Cargo:</span><span class="meta-value">${r.funcionario_cargo}</span></div>
                  <div class="meta-item"><span class="meta-label">Nuit:</span><span class="meta-value">${r.funcionario_nuit || "N/D"}</span></div>
                </div>
                <div>
                  <div class="meta-item"><span class="meta-label">ID Recibo:</span><span class="meta-value">#${r.id}</span></div>
                  <div class="meta-item"><span class="meta-label">Período Ref:</span><span class="meta-value">${r.mes_ano}</span></div>
                  <div class="meta-item"><span class="meta-label">Data Emissão:</span><span class="meta-value">${r.data_emissao}</span></div>
                  <div class="meta-item"><span class="meta-label">Estado:</span><span class="meta-value" style="color: ${r.estado === 'Pago' ? '#2f855a' : '#dd6b20'};">${r.estado}</span></div>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Descrição da Rubrica</th>
                  <th style="text-align: right;">Rendimentos (+)</th>
                  <th style="text-align: right;">Descontos (-)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salário Base Mensal</td>
                  <td style="text-align: right; font-weight: 600;">${base.toLocaleString("pt-MZ")} MZN</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>
                ${subsidios > 0 ? `
                <tr>
                  <td>Subsídios de Alimentação / Outros</td>
                  <td style="text-align: right; font-weight: 600;">${subsidios.toLocaleString("pt-MZ")} MZN</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${horasExtras > 0 ? `
                <tr>
                  <td>Horas Extras Regulamentares</td>
                  <td style="text-align: right; font-weight: 600;">${horasExtras.toLocaleString("pt-MZ")} MZN</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${bonus > 0 ? `
                <tr>
                  <td>Bónus / Prémios de Rota</td>
                  <td style="text-align: right; font-weight: 600;">${bonus.toLocaleString("pt-MZ")} MZN</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${faltas > 0 ? `
                <tr>
                  <td>Ausências / Dedução de Faltas</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${faltas.toLocaleString("pt-MZ")} MZN</td>
                </tr>` : ""}
                ${inss > 0 ? `
                <tr>
                  <td>Contribuição INSS Trabalhador (3%)</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${inss.toLocaleString("pt-MZ")} MZN</td>
                </tr>` : ""}
                ${irps > 0 ? `
                <tr>
                  <td>Retenção na Fonte IRPS</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${irps.toLocaleString("pt-MZ")} MZN</td>
                </tr>` : ""}
                ${descontos > 0 ? `
                <tr>
                  <td>Outros Descontos / Adiantamentos</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${descontos.toLocaleString("pt-MZ")} MZN</td>
                </tr>` : ""}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-box">
                <div class="totals-row">
                  <span style="color: #718096;">Total de Rendimentos (Ilíquido):</span>
                  <span style="color: #2D3748;">${totalRendimentos.toLocaleString("pt-MZ")} MZN</span>
                </div>
                <div class="totals-row">
                  <span style="color: #718096;">Total de Descontos:</span>
                  <span style="color: #e53e3e;">-${totalDescontos.toLocaleString("pt-MZ")} MZN</span>
                </div>
              </div>
              <div class="totals-box" style="background: #EBF8FF; border-color: #BEE3F8;">
                <div class="totals-row final">
                  <span>LÍQUIDO A RECEBER:</span>
                  <span>${liquido.toLocaleString("pt-MZ")} MZN</span>
                </div>
              </div>
            </div>

            <div class="signatures-container">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">${companyName}</div>
                <div class="sig-sub">Assinatura da Administração</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">${r.funcionario_nome}</div>
                <div class="sig-sub">Assinatura do Funcionário</div>
              </div>
            </div>

            <div class="footer-note">
              Processado em conformidade com o Regulamento do INSS e Regulamento do IRPS de Moçambique.<br/>
              Obrigado pelo seu compromisso e dedicação profissional.
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Recibo_Salario_${r.funcionario_nome.replace(/\s+/g, "_")}_${r.mes_ano.replace("/", "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPayslip = (r: ReciboSalario) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const base = r.salario_base || 0;
    const bonus = r.bonus || 0;
    const descontos = r.descontos || 0;
    const faltas = r.faltas || 0;
    const subsidios = r.subsidios || 0;
    const horasExtras = r.horas_extras || 0;
    const inss = r.inss || 0;
    const irps = r.irps || 0;

    const totalRendimentos = base + subsidios + horasExtras + bonus;
    const totalDescontos = faltas + inss + irps + descontos;
    const liquido = r.salario_liquido || (totalRendimentos - totalDescontos);

    const companyName = r.empresa_nome || "RHINO CARGO, LIMITADA";
    const companyNuit = r.empresa_nuit || "400582914";
    const companyLocation = r.empresa_localizacao || "Porto de Maputo, Recinto Portuário, Maputo, Moçambique";

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Salário - ${r.funcionario_nome}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2d3748; background: #fff; line-height: 1.5; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header-layout { display: flex; justify-content: space-between; align-items: center; background-color: #F0F2FA; padding: 20px; border-radius: 8px; border-bottom: 2px solid #283B91; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .company-logo-container { width: 80px !important; height: 40px !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; }
            .company-logo-container svg, .company-logo-container img { width: 100% !important; height: auto !important; max-width: 80px !important; max-height: 40px !important; object-fit: contain !important; }
            
            .company-info { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.3; color: #4a5568; }
            .company-name { font-size: 18px; font-weight: 800; color: #283B91; margin: 0 0 2px 0; }
            .company-slogan { font-size: 11px; font-weight: bold; color: #EA088C; text-transform: uppercase; margin-bottom: 2px; }
            .company-subtitle { font-size: 10.5px; font-weight: 600; color: #38B44A; margin-bottom: 4px; }
            .company-details { font-size: 9.5px; color: #718096; }
            
            .doc-title-badge { background: #FFF0F6; color: #EA088C; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; height: fit-content; text-transform: uppercase; border: 1px solid #FFD8E4; }
            
            .meta-grid { display: grid; grid-template-cols: 12fr; gap: 15px; margin-bottom: 25px; background: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #edf2f7; }
            .meta-section { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; font-size: 12.5px; }
            .meta-item { margin-bottom: 6px; }
            .meta-label { font-weight: bold; color: #718096; display: inline-block; width: 140px; text-transform: uppercase; font-size: 11px; }
            .meta-value { color: #2d3748; font-weight: 600; }
            
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            .table th { background: #283B91; color: #ffffff; font-weight: 700; padding: 10px 12px; text-transform: uppercase; font-size: 11px; text-align: left; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; }
            .table tr:nth-child(even) td { background: #fcfdfd; }
            
            .totals-section { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 15px; margin-bottom: 30px; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .totals-box { background: #f7fafc; padding: 12px; border-radius: 6px; border: 1px solid #edf2f7; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; }
            .totals-row.final { border-top: 2px solid #283B91; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 800; color: #283B91; }
            
            .signatures-container { margin-top: 50px; display: flex; justify-content: space-between; gap: 50px; }
            .sig-box { flex: 1; text-align: center; font-size: 12px; }
            .sig-line { border-top: 1px solid #a0aec0; margin-bottom: 8px; margin-top: 45px; }
            .sig-title { font-weight: 700; color: #4a5568; }
            .sig-sub { color: #718096; font-size: 11px; margin-top: 2px; }
 
            .footer-note { text-align: center; color: #a0aec0; font-size: 10px; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
            @media print {
              body { padding: 0; background: none; }
              .receipt-container { border: none; box-shadow: none; padding: 0; }
              .header-layout { background-color: #F0F2FA !important; border-bottom: 2px solid #283B91 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .doc-title-badge { background-color: #FFF0F6 !important; border-color: #FFD8E4 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header-layout">
              <div style="display: flex; align-items: center; gap: 20px;">
                ${PRINT_LOGO_SVG}
                <div class="company-info">
                  <div class="company-name">RHINO CARGO LDA</div>
                  <div class="company-slogan">Força | Flexibilidade | Movimento</div>
                  <div class="company-subtitle">Empresa Moçambicana</div>
                  <div class="company-details">
                    <div>🚛 Transportes de qualidade &nbsp;&bull;&nbsp; 📦 Entregas para todas províncias</div>
                    <div>📞 +258 871665500 &nbsp;&bull;&nbsp; Av. Romão Fernandes Farinha nr 1504, Maputo, Mozambique 1103</div>
                  </div>
                </div>
              </div>
              <div class="doc-title-badge">
                Recibo de Vencimento
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-section">
                <div>
                  <div class="meta-item">
                    <span class="meta-label">Trabalhador:</span>
                    <span class="meta-value">${r.funcionario_nome}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Categoria:</span>
                    <span class="meta-value">${r.funcionario_cargo}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">NUIT Trab.:</span>
                    <span class="meta-value">${r.funcionario_nuit || "Isento / Não indicado"}</span>
                  </div>
                </div>
                <div>
                  <div class="meta-item">
                    <span class="meta-label">Referência:</span>
                    <span class="meta-value">${r.mes_ano}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Data Recibo:</span>
                    <span class="meta-value">${r.data_emissao}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Estado:</span>
                    <span class="meta-value" style="color: ${r.estado === 'Pago' ? '#38A169' : '#DD6B20'}">${r.estado.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50%;">Descrição da Rubrica</th>
                  <th style="text-align: right; width: 25%;">Vencimentos (Crédito MZN)</th>
                  <th style="text-align: right; width: 25%;">Descontos (Débito MZN)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salário Base Mensal</td>
                  <td style="text-align: right; font-weight: 600;">${base.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>
                ${subsidios > 0 ? `
                <tr>
                  <td>Subsídios de Alimentação / Outros</td>
                  <td style="text-align: right; font-weight: 600;">${subsidios.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${horasExtras > 0 ? `
                <tr>
                  <td>Horas Extras Regulamentares</td>
                  <td style="text-align: right; font-weight: 600;">${horasExtras.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${bonus > 0 ? `
                <tr>
                  <td>Bónus / Prémios de Rota</td>
                  <td style="text-align: right; font-weight: 600;">${bonus.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                </tr>` : ""}
                ${faltas > 0 ? `
                <tr>
                  <td>Ausências / Dedução de Faltas</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${faltas.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                </tr>` : ""}
                ${inss > 0 ? `
                <tr>
                  <td>Contribuição INSS Trabalhador (3%)</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${inss.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                </tr>` : ""}
                ${irps > 0 ? `
                <tr>
                  <td>Retenção na Fonte IRPS</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${irps.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                </tr>` : ""}
                ${descontos > 0 ? `
                <tr>
                  <td>Outros Descontos / Adiantamentos</td>
                  <td style="text-align: right; color: #a0aec0;">-</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: 600;">${descontos.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}</td>
                </tr>` : ""}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-box">
                <div class="totals-row">
                  <span style="color: #718096;">Total de Rendimentos (Ilíquido):</span>
                  <span style="color: #2D3748;">${totalRendimentos.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
                <div class="totals-row">
                  <span style="color: #718096;">Total de Descontos:</span>
                  <span style="color: #e53e3e;">-${totalDescontos.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
              </div>
              <div class="totals-box" style="background: #EBF8FF; border-color: #BEE3F8;">
                <div class="totals-row final">
                  <span>LÍQUIDO A RECEBER:</span>
                  <span>${liquido.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
              </div>
            </div>

            <div class="signatures-container">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">${companyName}</div>
                <div class="sig-sub">Assinatura da Administração</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">${r.funcionario_nome}</div>
                <div class="sig-sub">Assinatura do Funcionário</div>
              </div>
            </div>

            <div class="footer-note">
              Processado em conformidade com o Regulamento do INSS e Regulamento do IRPS de Moçambique.<br/>
              Obrigado pelo seu compromisso e dedicação profissional.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter lists based on role
  // Standard employees can ONLY see their own requests and payslips
  const displayedPedidos = pedidos.filter(p => {
    if (isEmployeeOnly) {
      return p.funcionario_id === currentUser.funcionario_id;
    }
    return true;
  });

  const displayedRecibos = recibos.filter(r => {
    if (isEmployeeOnly) {
      return r.funcionario_id === currentUser.funcionario_id;
    }
    return true;
  });

  return (
    <div className="space-y-6" id="recursos-humanos-view">
      
      {/* 1. Header and switches */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-rhino-pink" />
            RECURSOS HUMANOS & SALÁRIOS
          </h1>
          <p className="text-xs text-slate-400">
            {isEmployeeOnly 
              ? `Portal de Autogestão de ${currentUser.nome}. Solicite férias e aceda aos seus recibos de vencimento.`
              : "Gestão administrativa de licenças, aprovação de férias de colaboradores e folha salarial."
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "pedidos" && (
            <button
              onClick={() => {
                setLeaveForm({
                  funcionario_id: "",
                  tipo: "Férias",
                  data_inicio: "",
                  data_fim: "",
                  dias: "5",
                  motivo: "",
                  observacoes: ""
                });
                setIsLeaveModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {isEmployeeOnly ? "Solicitar Licença / Férias" : "Lançar Pedido (Do próprio ou de Terceiros)"}
            </button>
          )}

          {activeSubTab === "recibos" && isHR && (
            <button
              onClick={() => {
                setPayForm({
                  funcionario_id: "",
                  mes_ano: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
                  salario_base: "15000",
                  bonus: "0",
                  descontos: "0",
                  estado: "Pago",
                  observacoes: "",
                  faltas: "0",
                  subsidios: "0",
                  horas_extras: "0",
                  inss: "0",
                  irps: "0"
                });
                setIsPayModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Gerar Recibo de Salário
            </button>
          )}
        </div>
      </div>

      {/* Subtab selection */}
      <div className="flex items-center gap-2 bg-rhino-dark/60 p-1 rounded-lg border border-rhino-border w-fit no-print">
        <button
          onClick={() => setActiveSubTab("pedidos")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "pedidos" 
              ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pedidos de Férias & Dispensas
        </button>
        <button
          onClick={() => setActiveSubTab("recibos")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "recibos" 
              ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Recibos de Salário
        </button>
      </div>

      {/* Message alerts */}
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

      {/* 2. Main content grids */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-rhino-card border border-rhino-border rounded-xl">Carregando dados...</div>
      ) : activeSubTab === "pedidos" ? (
        // LEAVE REQUESTS TAB
        <div className="bg-rhino-card border border-rhino-border rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-950/40 border-b border-rhino-border/40">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Pedidos de Dispensa & Férias</h3>
          </div>
          {displayedPedidos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">Sem pedidos registados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/20 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-rhino-border/60">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Período</th>
                    <th className="p-4 text-center">Dias</th>
                    <th className="p-4">Motivo / Razão</th>
                    <th className="p-4">Data Pedido</th>
                    <th className="p-4">Estado</th>
                    {isHR && <th className="p-4 text-right">Aprovação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rhino-border/30">
                  {displayedPedidos.map(p => (
                    <tr key={p.id} className="hover:bg-rhino-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-white block">{p.funcionario_nome || "Utilizador de Testes"}</span>
                        <span className="text-[10px] text-slate-500 block">{p.funcionario_cargo || "Colaborador"}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          p.tipo === "Férias" 
                            ? "bg-rhino-blue/15 text-rhino-blue border border-rhino-blue/30" 
                            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        }`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {p.data_inicio} até {p.data_fim}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-white">
                        {p.dias}
                      </td>
                      <td className="p-4 text-slate-300">
                        <span className="font-medium">{p.motivo || "Não especificado"}</span>
                        {p.observacoes && <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{p.observacoes}</span>}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {p.data_pedido}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit ${
                          p.estado === "Aprovado" 
                            ? "bg-rhino-green/15 text-rhino-green" 
                            : p.estado === "Rejeitado" 
                            ? "bg-rose-500/15 text-rose-400" 
                            : "bg-amber-500/15 text-amber-500"
                        }`}>
                          {p.estado === "Pendente" && <Clock className="h-3 w-3 shrink-0" />}
                          {p.estado}
                        </span>
                      </td>
                      {isHR && (
                        <td className="p-4 text-right">
                          {p.estado === "Pendente" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateLeaveStatus(p.id, "Aprovado")}
                                className="p-1 rounded bg-rhino-green/10 hover:bg-rhino-green text-emerald-400 hover:text-white transition-all cursor-pointer"
                                title="Aprovar Pedido"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(p.id, "Rejeitado")}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
                                title="Rejeitar Pedido"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono">Decidido</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // PAYSLIPS LIST TAB
        <div className="bg-rhino-card border border-rhino-border rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-950/40 border-b border-rhino-border/40">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Salários Emitidos & Recibos</h3>
          </div>
          {displayedRecibos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">Sem recibos de salário registados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/20 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-rhino-border/60">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Mês/Ano Ref</th>
                    <th className="p-4 text-right">Salário Base</th>
                    <th className="p-4 text-right text-rhino-green">Bónus (+)</th>
                    <th className="p-4 text-right text-rose-400">Descontos (-)</th>
                    <th className="p-4 text-right font-black">Líquido Recebido</th>
                    <th className="p-4">Data Emissão</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rhino-border/30 font-mono">
                  {displayedRecibos.map(r => (
                    <tr key={r.id} className="hover:bg-rhino-muted/30 transition-colors text-slate-300">
                      <td className="p-4 font-sans text-left">
                        <span className="font-bold text-white block">{r.funcionario_nome}</span>
                        <span className="text-[10px] text-slate-500 block">{r.funcionario_cargo}</span>
                      </td>
                      <td className="p-4 font-bold text-white">
                        {r.mes_ano}
                      </td>
                      <td className="p-4 text-right">
                        {r.salario_base.toLocaleString("pt-MZ")} MZN
                      </td>
                      <td className="p-4 text-right text-rhino-green">
                        {r.bonus > 0 ? `+${r.bonus.toLocaleString("pt-MZ")}` : "0"} MZN
                      </td>
                      <td className="p-4 text-right text-rose-400">
                        {r.descontos > 0 ? `-${r.descontos.toLocaleString("pt-MZ")}` : "0"} MZN
                      </td>
                      <td className="p-4 text-right text-white font-black bg-slate-950/10">
                        {r.salario_liquido.toLocaleString("pt-MZ")} MZN
                      </td>
                      <td className="p-4 font-sans text-slate-500 text-[11px]">
                        {r.data_emissao}
                      </td>
                      <td className="p-4 font-sans">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          r.estado === "Pago" 
                            ? "bg-rhino-green/15 text-rhino-green" 
                            : "bg-amber-500/15 text-amber-500"
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isHR && r.estado === "Pendente" && (
                            <button
                              onClick={() => handleUpdatePayslipStatus(r.id, "Pago")}
                              className="px-2 py-1.5 rounded bg-rhino-green/10 hover:bg-rhino-green text-emerald-400 hover:text-white text-[10px] font-bold cursor-pointer"
                              title="Marcar como Pago"
                            >
                              Pagar
                            </button>
                          )}
                          <button
                            onClick={() => printPayslip(r)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Visualizar / Imprimir Recibo"
                          >
                            <Eye className="h-3.5 w-3.5 text-sky-400" />
                          </button>
                          {isHR && (
                            <button
                              onClick={() => openEditPayslip(r)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                              title="Editar Recibo de Salário"
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-400" />
                            </button>
                          )}
                          <button
                            onClick={() => downloadPayslip(r)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Descarregar / Baixar Recibo (HTML)"
                          >
                            <FileDown className="h-3.5 w-3.5 text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* A. Create Leave request Modal */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rhino-card border border-rhino-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-4.5 bg-slate-950 border-b border-rhino-border/60 flex justify-between items-center">
                <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-rhino-pink" />
                  REGISTAR SOLICITAÇÃO DE LICENÇA / FÉRIAS
                </h3>
                <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLeaveRequest} className="p-6 space-y-4">
                
                {/* Employee linkage (Only managers can do it on behalf of others, employees are locked to themselves) */}
                {isManager ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Seleção de Funcionário *</label>
                    <select
                      value={leaveForm.funcionario_id}
                      onChange={(e) => setLeaveForm(p => ({ ...p, funcionario_id: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="">-- Seleccionar Funcionário --</option>
                      {funcionarios.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Permissão de Gestor: RH pode abrir pedidos a favor de motoristas ou outros funcionários.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Colaborador Pedinte</label>
                    <div className="p-3 bg-slate-950 border border-rhino-border/60 rounded-lg text-xs text-slate-300">
                      <strong>{currentUser.nome}</strong> | Cargo: {currentUser.cargo || "Funcionário"}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tipo de Licença</label>
                    <select
                      value={leaveForm.tipo}
                      onChange={(e) => setLeaveForm(p => ({ ...p, tipo: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="Férias">Férias Anuais</option>
                      <option value="Dispensa">Dispensa / Licença Médica</option>
                      <option value="Outro">Outros Motivos</option>
                    </select>
                  </div>

                  {/* Dias */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Duração (Dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={leaveForm.dias}
                      onChange={(e) => setLeaveForm(p => ({ ...p, dias: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data Inicio */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Data de Início *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.data_inicio}
                      onChange={(e) => setLeaveForm(p => ({ ...p, data_inicio: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Data de Término *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.data_fim}
                      onChange={(e) => setLeaveForm(p => ({ ...p, data_fim: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Justificação / Motivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gozo de férias anuais regulamentares, consulta médica..."
                    value={leaveForm.motivo}
                    onChange={(e) => setLeaveForm(p => ({ ...p, motivo: e.target.value }))}
                    className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Observações Internas</label>
                  <textarea
                    rows={2}
                    placeholder="Outras notas de coordenação ou substitutos recomendados..."
                    value={leaveForm.observacoes}
                    onChange={(e) => setLeaveForm(p => ({ ...p, observacoes: e.target.value }))}
                    className="w-full bg-slate-950 border border-rhino-border rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-rhino-border/60">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
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
                    {saving ? "Processando..." : isHR ? "Lançar e Aprovar" : "Enviar Solicitação"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. Create Payslip Modal */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rhino-card border border-rhino-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-4.5 bg-slate-950 border-b border-rhino-border/60 flex justify-between items-center">
                <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-rhino-pink" />
                  {editingPayslipId ? "EDITAR RECIBO DE SALÁRIO" : "EMITIR RECIBO DE SALÁRIO"}
                </h3>
                <button onClick={() => { setIsPayModalOpen(false); setEditingPayslipId(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePayslip} className="flex flex-col max-h-[82vh]">
                <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-800">
                  {/* Employee select */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Colaborador Destinatário *</label>
                    <select
                      required
                      value={payForm.funcionario_id}
                      onChange={(e) => handlePayFuncionarioChange(e.target.value)}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                    >
                      <option value="">-- Seleccionar Funcionário --</option>
                      {funcionarios.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Mes/Ano */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mês / Ano Ref *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YYYY"
                        value={payForm.mes_ano}
                        onChange={(e) => setPayForm(p => ({ ...p, mes_ano: e.target.value }))}
                        className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Estado de Pagamento</label>
                      <select
                        value={payForm.estado}
                        onChange={(e) => setPayForm(p => ({ ...p, estado: e.target.value }))}
                        className="w-full bg-slate-950 border border-rhino-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rhino-pink"
                      >
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </div>

                  {/* RENDIMENTOS E DEDUÇÕES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column: Rendimentos (Credits) */}
                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-lg border border-rhino-border/40">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-rhino-border/20 pb-1.5 flex items-center justify-between">
                        <span>Rendimentos (+)</span>
                      </h4>
                      
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Salário Base (MZN) *</label>
                        <input
                          type="number"
                          required
                          value={payForm.salario_base}
                          onChange={(e) => setPayForm(p => ({ ...p, salario_base: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Subsídios (MZN)</label>
                        <input
                          type="number"
                          value={payForm.subsidios}
                          onChange={(e) => setPayForm(p => ({ ...p, subsidios: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Horas Extras (MZN)</label>
                        <input
                          type="number"
                          value={payForm.horas_extras}
                          onChange={(e) => setPayForm(p => ({ ...p, horas_extras: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Outros Bónus / Rotas</label>
                        <input
                          type="number"
                          value={payForm.bonus}
                          onChange={(e) => setPayForm(p => ({ ...p, bonus: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Right Column: Deduções (Debits) */}
                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-lg border border-rhino-border/40">
                      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider border-b border-rhino-border/20 pb-1.5">
                        <span>Deduções (-)</span>
                      </h4>
                      
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Faltas (MZN)</label>
                        <input
                          type="number"
                          value={payForm.faltas}
                          onChange={(e) => setPayForm(p => ({ ...p, faltas: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-rose-400 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">INSS Trabalhador (3%) (MZN)</label>
                        <input
                          type="number"
                          value={payForm.inss}
                          onChange={(e) => setPayForm(p => ({ ...p, inss: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-rose-400 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Retenção IRPS (MZN)</label>
                        <input
                          type="number"
                          value={payForm.irps}
                          onChange={(e) => setPayForm(p => ({ ...p, irps: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-rose-400 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Outros Descontos</label>
                        <input
                          type="number"
                          value={payForm.descontos}
                          onChange={(e) => setPayForm(p => ({ ...p, descontos: e.target.value }))}
                          className="w-full bg-slate-950 border border-rhino-border rounded-lg px-2.5 py-1.5 text-xs text-rose-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Net total estimation live */}
                  {(() => {
                    const gross = Number(payForm.salario_base || 0) + Number(payForm.subsidios || 0) + Number(payForm.horas_extras || 0) + Number(payForm.bonus || 0);
                    const deductions = Number(payForm.faltas || 0) + Number(payForm.inss || 0) + Number(payForm.irps || 0) + Number(payForm.descontos || 0);
                    const net = gross - deductions;
                    return (
                      <div className="p-3.5 bg-slate-950 rounded-lg border border-rhino-border/80 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Total de Rendimentos (Bruto):</span>
                          <span className="text-emerald-400">{gross.toLocaleString("pt-MZ")} MZN</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total de Descontos / Deduções:</span>
                          <span className="text-rose-400">-{deductions.toLocaleString("pt-MZ")} MZN</span>
                        </div>
                        <div className="border-t border-slate-800/80 pt-1.5 flex justify-between font-bold text-white text-[12px]">
                          <span>Salário Líquido Estimado:</span>
                          <span className="text-rhino-pink">
                            {net.toLocaleString("pt-MZ")} MZN
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Observações */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Anotações do Recibo</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Inclui prémio de segurança rodoviária e descontos de adiantamento..."
                      value={payForm.observacoes}
                      onChange={(e) => setPayForm(p => ({ ...p, observacoes: e.target.value }))}
                      className="w-full bg-slate-950 border border-rhino-border rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink"
                    />
                  </div>
                </div>

                {/* Submit actions */}
                <div className="p-4 bg-slate-950 border-t border-rhino-border/60 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsPayModalOpen(false); setEditingPayslipId(null); }}
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
                    {saving ? (editingPayslipId ? "Gravando..." : "Emitindo...") : (editingPayslipId ? "Salvar Alterações" : "Gerar e Lançar Vencimento")}
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
