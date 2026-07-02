import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, Fuel, DollarSign, Truck, Users, AlertTriangle, 
  MapPin, CheckCircle, ShieldAlert, AlertCircle 
} from "lucide-react";
import { PerformanceData, Alerta, Usuario } from "../types";

interface DashboardProps {
  perfData: PerformanceData | null;
  alertas: Alerta[];
  onResolveAlerta: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  currentUser: Usuario;
}

export default function Dashboard({ perfData, alertas, onResolveAlerta, onNavigateToTab, currentUser }: DashboardProps) {
  if (!perfData) {
    return (
      <div className="flex items-center justify-center h-96" id="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rhino-pink" />
      </div>
    );
  }

  const { summary, driversPerformance, fuelByProvince } = perfData;

  const activeAlerts = alertas.filter(a => !a.resolvido);
  const isRH = currentUser.role === "rh";
  const isAdministracao = currentUser.role === "administracao";
  const showAlertas = currentUser.role === "admin" || currentUser.role === "rh";

  return (
    <div className="space-y-6" id="dashboard-tab-content">
      {/* Notifications banner if there are active alerts */}
      {activeAlerts.length > 0 && !isAdministracao && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rhino-pink/5 border border-rhino-pink/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          id="dashboard-notifications-banner"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rhino-pink/15 text-rhino-pink shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rhino-pink">
                Alerta Crítico: Desvios de Consumo Detetados!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Existem {activeAlerts.length} notificações de anomalia pendentes para revisão e auditoria.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("alertas")}
            className="text-xs bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white font-bold py-2 px-4 rounded-lg transition-all cursor-pointer self-start md:self-auto shadow-md shadow-rhino-pink/10"
            id="go-to-alerts-button"
          >
            Ver Anomalias
          </button>
        </motion.div>
      )}

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-bento-grid">
        {isRH ? (
          <>
            {/* Total de Motoristas */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-blue/5 rounded-full blur-xl group-hover:bg-rhino-blue/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motoristas</p>
                  <h3 className="text-2xl font-black text-white mt-1 font-sans">
                    {summary.totalMotoristas} Ativos
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-blue/15 text-rhino-blue">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Total de motoristas sob controle</span>
              </div>
            </div>

            {/* Total Viaturas */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-pink/5 rounded-full blur-xl group-hover:bg-rhino-pink/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frota Total</p>
                  <h3 className="text-2xl font-black text-rhino-pink mt-1 font-sans">
                    {summary.totalViaturas} Veículos
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-pink/15 text-rhino-pink">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Viaturas registadas no sistema</span>
              </div>
            </div>

            {/* Viaturas em Viagem */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-green/5 rounded-full blur-xl group-hover:bg-rhino-green/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Viagem</p>
                  <h3 className="text-2xl font-black text-rhino-green mt-1 font-sans">
                    {summary.viaturasEmViagem} Ativas
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-green/15 text-rhino-green">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Viaturas atualmente em viagem</span>
              </div>
            </div>

            {/* Alertas Ativos */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anomalias de Frota</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1 font-sans">
                    {activeAlerts.length} Pendentes
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Auditorias por processar</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Total Billing */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-blue/5 rounded-full blur-xl group-hover:bg-rhino-blue/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturação Total</p>
                  <h3 className="text-2xl font-black text-white mt-1 font-sans">
                    {summary.totalFaturacao.toLocaleString()} MZN
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-blue/15 text-rhino-blue">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Receita bruta acumulada</span>
              </div>
            </div>

            {/* Total Combustivel */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-pink/5 rounded-full blur-xl group-hover:bg-rhino-pink/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Combustível</p>
                  <h3 className="text-2xl font-black text-rhino-pink mt-1 font-sans">
                    {summary.totalCombustivel.toLocaleString()} MZN
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-pink/15 text-rhino-pink">
                  <Fuel className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Representa {summary.totalFaturacao > 0 ? ((summary.totalCombustivel / summary.totalFaturacao) * 100).toFixed(1) : 0}% da faturação</span>
              </div>
            </div>

            {/* Net Remanescente */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-green/5 rounded-full blur-xl group-hover:bg-rhino-green/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remanescente Líquido</p>
                  <h3 className="text-2xl font-black text-rhino-green mt-1 font-sans">
                    {summary.totalRemanescente.toLocaleString()} MZN
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-green/15 text-rhino-green">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Lucro líquido pós-custos operacionais</span>
              </div>
            </div>

            {/* Fleet & Alerts overview */}
            <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rhino-blue/5 rounded-full blur-xl group-hover:bg-rhino-blue/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Frota</p>
                  <h3 className="text-2xl font-black text-white mt-1 font-sans">
                    {summary.viaturasEmViagem}/{summary.totalViaturas} em Viagem
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-rhino-blue/15 text-rhino-blue">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Com {summary.totalMotoristas} motoristas ativos</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual Analytics - Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
        {/* Fuel Consumption by Province Custom SVG Graphic */}
        {!isRH && (
          <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 lg:col-span-2 space-y-4" id="province-fuel-card">
            <div className="flex items-center justify-between border-b border-rhino-border/60 pb-3">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rhino-pink" />
                  <span>Gastos de Combustível por Província</span>
                </h3>
                <p className="text-xs text-slate-500">Consumo em litros e valor total em MZN por província</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {fuelByProvince && fuelByProvince.length > 0 ? (
                fuelByProvince.map((item, idx) => {
                  const maxGasto = Math.max(...fuelByProvince.map(f => f.total_gasto));
                  const percentage = maxGasto > 0 ? (item.total_gasto / maxGasto) * 100 : 0;
                  return (
                    <div key={item.provincia} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{item.provincia}</span>
                        <span className="font-mono text-slate-400">
                          {item.total_litros.toFixed(1)} L • <b className="text-rhino-pink">{item.total_gasto.toLocaleString()} MZN</b>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-rhino-dark rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-rhino-blue to-rhino-pink rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-slate-500 py-12">
                  Nenhum abastecimento registado para gerar gráficos de província.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Driver Rankings scoreboard */}
        <div className={`bg-rhino-card border border-rhino-border rounded-xl p-5 space-y-4 ${isRH ? "lg:col-span-3" : ""}`} id="driver-rankings-card">
          <div className="flex items-center justify-between border-b border-rhino-border/60 pb-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-rhino-blue" />
                <span>Desempenho dos Motoristas</span>
              </h3>
              <p className="text-xs text-slate-500">Lista ordenada por score (0 - 100)</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1 overflow-y-auto max-h-[300px]">
            {driversPerformance.map((driver) => {
              let scoreColor = "text-rhino-green bg-rhino-green/10 border-rhino-green/20";
              if (driver.score < 80) scoreColor = "text-rhino-pink bg-rhino-pink/10 border-rhino-pink/20";
              else if (driver.score < 95) scoreColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";

              return (
                <div 
                  key={driver.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg border border-rhino-border/40 bg-rhino-dark/20 hover:bg-rhino-dark/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-slate-300">{driver.nome}</h4>
                    <p className="text-[10px] text-slate-500">{driver.categoria_carta} • BI: {driver.bi}</p>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${scoreColor}`}>
                    {driver.score} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Consumption Alert Monitor (Automatic alerts list) */}
      {!isAdministracao && (
        <div className="bg-rhino-card border border-rhino-border rounded-xl p-5 space-y-4" id="alerts-monitor-card">
          <div className="flex items-center justify-between border-b border-rhino-border/60 pb-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rhino-pink animate-pulse" />
                <span>Painel de Auditoria de Desvios (Alertas Recentes)</span>
              </h3>
              <p className="text-xs text-slate-500">Gerados pelo sistema ao detetar consumo inconsistente</p>
            </div>
            {showAlertas && (
              <button
                onClick={() => onNavigateToTab("alertas")}
                className="text-xs text-rhino-pink hover:text-rhino-pink/80 font-bold transition-all"
              >
                Ver todos ({alertas.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {alertas.slice(0, 4).map((alerta) => {
              const date = new Date(alerta.data_hora);
              return (
                <div 
                  key={alerta.id} 
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    alerta.resolvido 
                      ? "bg-rhino-dark/20 border-rhino-border/60 opacity-60" 
                      : "bg-rhino-pink/5 border-rhino-pink/20 text-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${alerta.resolvido ? "bg-rhino-muted text-slate-500" : "bg-rhino-pink/10 text-rhino-pink"}`}>
                      {alerta.resolvido ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{alerta.titulo}</span>
                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                          alerta.gravidade === "alta" ? "bg-rhino-pink/15 text-rhino-pink font-bold" : "bg-amber-500/10 text-amber-400 font-bold"
                        }`}>
                          {alerta.gravidade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{alerta.mensagem}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {date.toLocaleDateString("pt-MZ")} {date.toLocaleTimeString("pt-MZ")}
                      </p>
                    </div>
                  </div>

                  {!alerta.resolvido && (
                    <button
                      onClick={() => onResolveAlerta(alerta.id)}
                      className="text-xs border border-rhino-pink/20 hover:bg-rhino-pink hover:text-white text-rhino-pink py-1.5 px-3 rounded-lg transition-all shrink-0 self-end sm:self-auto cursor-pointer font-semibold"
                    >
                      Marcar Resolvido
                    </button>
                  )}
                </div>
              );
            })}

            {alertas.length === 0 && (
              <div className="text-center text-xs text-slate-500 py-8">
                Nenhuma notificação de desvio registada na base de dados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
