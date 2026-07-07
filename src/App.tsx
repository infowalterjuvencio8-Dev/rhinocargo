import React, { useState, useEffect } from "react";
import logoImg from "./components/Logo.svg";
import { 
  LayoutDashboard, Truck, Users, Fuel, ShieldAlert, LogOut, 
  MapPin, UserCheck, RefreshCw, Layers, Coins, CreditCard, Briefcase 
} from "lucide-react";
import { 
  Usuario, Viagem, Viatura, Motorista, Bomba, PrecoProvincia, 
  Alerta, PerformanceData, Abastecimento 
} from "./types";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Viagens from "./components/Viagens";
import Motoristas from "./components/Motoristas";
import Abastecimentos from "./components/Abastecimentos";
import Viaturas from "./components/Viaturas";
import Alertas from "./components/Alertas";
import Faturacoes from "./components/Faturacoes";
import Despesas from "./components/Despesas";
import Funcionarios from "./components/Funcionarios";
import RecursosHumanos from "./components/RecursosHumanos";
import Bombas from "./components/Bombas";

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronized States
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [bombas, setBombas] = useState<Bomba[]>([]);
  const [provincias, setProvincias] = useState<PrecoProvincia[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);

  // Check login session on load
  useEffect(() => {
    const savedUser = localStorage.getItem("rhino_cargo_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === "funcionario") {
          setActiveTab("recursoshumanos");
        }
      } catch (e) {
        console.error("Error parsing saved session:", e);
      }
    }
    setLoading(false);
  }, []);

  // Sync data loop
  const syncDatabaseData = async () => {
    if (!currentUser) return;
    try {
      // Parallel fetches for speed and performance
      const [
        resPerf, resTrips, resFleet, resDrivers, resPumps, resPrices, resAlerts, resRefuels
      ] = await Promise.all([
        fetch("/api/performance"),
        fetch("/api/viagens"),
        fetch("/api/viaturas"),
        fetch("/api/motoristas"),
        fetch("/api/bombas"),
        fetch("/api/precos_provincias"),
        fetch("/api/alertas"),
        fetch("/api/abastecimentos")
      ]);

      if (resPerf.ok && resTrips.ok && resFleet.ok && resDrivers.ok && resPumps.ok && resPrices.ok && resAlerts.ok && resRefuels.ok) {
        const perf = await resPerf.json();
        const trips = await resTrips.json();
        const fleet = await resFleet.json();
        const drivers = await resDrivers.json();
        const pumps = await resPumps.json();
        const prices = await resPrices.json();
        const alerts = await resAlerts.json();
        const refuels = await resRefuels.json();

        setPerformanceData(perf);
        setViagens(trips);
        setViaturas(fleet);
        setMotoristas(drivers);
        setBombas(pumps);
        setProvincias(prices);
        setAlertas(alerts);
        setAbastecimentos(refuels);
      }
    } catch (error) {
      console.error("Error synchronizing data with server:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      syncDatabaseData();
      // Poll every 10 seconds for real-time fleet operations updates
      const interval = setInterval(syncDatabaseData, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    localStorage.setItem("rhino_cargo_user", JSON.stringify(user));
    if (user.role === "funcionario") {
      setActiveTab("recursoshumanos");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("rhino_cargo_user");
  };

  // One-click resolve alert
  const handleResolveAlerta = async (id: string) => {
    try {
      const response = await fetch(`/api/alertas/${id}/resolver`, { method: "PUT" });
      if (response.ok) {
        syncDatabaseData();
      } else {
        alert("Erro ao resolver notificação.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rhino-dark flex items-center justify-center text-slate-400" id="app-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rhino-pink" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono text-rhino-pink">Sincronizando Frota...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const activeAlertsCount = alertas.filter(a => !a.resolvido).length;

  // Granular role-based access control flags
  const isNotFuncionario = currentUser.role !== "funcionario";
  const showDashboard = isNotFuncionario; 
  const showViagens = isNotFuncionario; 
  const showFaturacoes = currentUser.role === "admin" || currentUser.role === "administracao"; 
  const showDespesas = currentUser.role === "admin" || currentUser.role === "administracao"; 
  const showMotoristas = isNotFuncionario; 
  const showAbastecimentos = currentUser.role === "admin" || currentUser.role === "administracao"; 
  const showViaturas = isNotFuncionario; 
  const showFuncionarios = currentUser.role === "admin" || currentUser.role === "rh"; 
  const showRecursosHumanos = currentUser.role === "admin" || currentUser.role === "rh"; 
  const showAlertas = currentUser.role === "admin" || currentUser.role === "rh";

  return (
    <div className="min-h-screen flex flex-col bg-rhino-dark text-slate-100 font-sans" id="main-application-shell">
      
      {/* 1. Header (Hides on standard system printing) */}
      <header className="bg-rhino-card border-b border-rhino-border/60 py-3.5 px-6 flex items-center justify-between no-print sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            alt="Rhino Cargo Logo" 
            className="h-10 w-auto object-contain max-w-[150px]"
            id="app-header-logo"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-rhino-dark border border-rhino-border text-rhino-green font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                MOÇAMBIQUE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide">Sistema Integrado de Rastreamento & Custos</p>
          </div>
        </div>

        {/* User context menu */}
        <div className="flex items-center gap-4">
          <button 
            onClick={syncDatabaseData} 
            title="Sincronizar Dados"
            className="p-1.5 rounded-lg border border-rhino-border hover:bg-rhino-muted text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="hidden md:flex items-center gap-2.5 border-l border-rhino-border pl-4">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block">{currentUser.nome}</span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rhino-pink">
                {currentUser.role === "admin" 
                  ? "IT Admin / Diretor" 
                  : currentUser.role === "rh" 
                  ? "Recursos Humanos" 
                  : currentUser.role === "administracao" 
                  ? "Administração" 
                  : "Colaborador / Motorista"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-rhino-muted border border-rhino-border flex items-center justify-center text-xs font-bold font-mono text-white">
              {currentUser.nome.charAt(0)}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            id="logout-button"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* 2. Full layout container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar (Hides on standard system printing) */}
        <nav className="w-full md:w-64 bg-rhino-card border-b md:border-b-0 md:border-r border-rhino-border/60 p-4 space-y-2 no-print shrink-0">
          
          {currentUser.role !== "funcionario" ? (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3 block">
                Painel Geral
              </div>

              {showDashboard && (
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "dashboard" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Painel Principal</span>
                </button>
              )}

              {showViagens && (
                <button
                  onClick={() => setActiveTab("viagens")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "viagens" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>Controle de Viagens</span>
                </button>
              )}

              {showFaturacoes && (
                <button
                  onClick={() => setActiveTab("faturacoes")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "faturacoes" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Coins className="h-4 w-4" />
                  <span>Faturações</span>
                </button>
              )}

              {showDespesas && (
                <button
                  onClick={() => setActiveTab("despesas")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "despesas" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Despesas</span>
                </button>
              )}

              {showMotoristas && (
                <button
                  onClick={() => setActiveTab("motoristas")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "motoristas" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Motoristas</span>
                </button>
              )}

              {showAbastecimentos && (
                <button
                  onClick={() => setActiveTab("abastecimentos")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "abastecimentos" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Fuel className="h-4 w-4" />
                  <span>Abastecimentos & Preços</span>
                </button>
              )}

              {showAbastecimentos && (
                <button
                  id="tab-bombas"
                  onClick={() => setActiveTab("bombas")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "bombas" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Fuel className="h-4 w-4 text-rhino-pink" />
                  <span>Bombas de Combustível</span>
                </button>
              )}

              {(showViaturas || showFuncionarios || showRecursosHumanos || showAlertas) && (
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-6 mb-3 block">
                  Administração
                </div>
              )}

              {showViaturas && (
                <button
                  onClick={() => setActiveTab("viaturas")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "viaturas" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Cadastro de Frota</span>
                </button>
              )}

              {showFuncionarios && (
                <button
                  onClick={() => setActiveTab("funcionarios")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "funcionarios" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Directório de Pessoal</span>
                </button>
              )}

              {showRecursosHumanos && (
                <button
                  onClick={() => setActiveTab("recursoshumanos")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "recursoshumanos" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Recursos Humanos & RH</span>
                </button>
              )}

              {showAlertas && (
                <button
                  onClick={() => setActiveTab("alertas")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "alertas" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Anomalias & Auditoria</span>
                  </div>
                  {activeAlertsCount > 0 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === "alertas" ? "bg-slate-950 text-rhino-pink" : "bg-rose-500 text-white"
                    }`}>
                      {activeAlertsCount}
                    </span>
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3 block">
                Portal do Colaborador
              </div>

              <button
                onClick={() => setActiveTab("recursoshumanos")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "recursoshumanos" 
                    ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                    : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Área de Pessoal & Salários</span>
              </button>

              {currentUser.cargo?.toLowerCase().includes("motorista") && (
                <button
                  onClick={() => setActiveTab("viagens")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "viagens" 
                      ? "bg-gradient-to-r from-rhino-blue to-rhino-pink text-white shadow-lg shadow-rhino-pink/10" 
                      : "text-slate-400 hover:bg-rhino-muted hover:text-white"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>Minhas Viagens</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* 3. Main Dashboard Workspace area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          {activeTab === "dashboard" && showDashboard && (
            <Dashboard 
              perfData={performanceData} 
              alertas={alertas}
              onResolveAlerta={handleResolveAlerta}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              currentUser={currentUser}
            />
          )}

          {activeTab === "viagens" && (showViagens || currentUser.role === "funcionario") && (
            <Viagens 
              viagens={viagens} 
              viaturas={viaturas}
              motoristas={motoristas}
              bombas={bombas}
              provincias={provincias}
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "faturacoes" && showFaturacoes && (
            <Faturacoes 
              viagens={viagens} 
              viaturas={viaturas}
              motoristas={motoristas}
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "despesas" && showDespesas && (
            <Despesas 
              viagens={viagens} 
              viaturas={viaturas}
              motoristas={motoristas}
              abastecimentos={abastecimentos}
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "motoristas" && showMotoristas && (
            <Motoristas 
              motoristas={motoristas} 
              viagens={viagens}
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "abastecimentos" && showAbastecimentos && (
            <Abastecimentos 
              abastecimentos={abastecimentos} 
              provincias={provincias}
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "bombas" && showAbastecimentos && (
            <Bombas 
              bombas={bombas} 
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "viaturas" && showViaturas && (
            <Viaturas 
              viaturas={viaturas} 
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "funcionarios" && showFuncionarios && (
            <Funcionarios 
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "recursoshumanos" && (showRecursosHumanos || currentUser.role === "funcionario") && (
            <RecursosHumanos 
              currentUser={currentUser}
              onRefreshData={syncDatabaseData}
            />
          )}

          {activeTab === "alertas" && showAlertas && (
            <Alertas 
              alertas={alertas} 
              onResolveAlerta={handleResolveAlerta}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* 4. Footer info */}
      <footer className="bg-rhino-card border-t border-rhino-border/60 py-3 px-6 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 no-print">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-400">Rhino Cargo LDA</span>
          <span>© 2026 • Controle Operacional de Frotas</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-rhino-pink" />
            <span>Maputo, Moçambique</span>
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-rhino-green" />
            <span>
              Sessão: {currentUser.nome} (
              {currentUser.role === "admin" 
                ? "IT Admin" 
                : currentUser.role === "rh" 
                ? "RH" 
                : currentUser.role === "administracao" 
                ? "Administração" 
                : "Colaborador"}
              )
            </span>
          </span>
        </div>
      </footer>

    </div>
  );
}