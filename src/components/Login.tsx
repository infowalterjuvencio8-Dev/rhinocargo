import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Lock, Mail, Truck } from "lucide-react";
import { Usuario } from "../types";
import logoImg from "./Logo.svg";

interface LoginProps {
  onLoginSuccess: (user: Usuario) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || "Credenciais inválidas. Verifique e tente novamente.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro ao conectar ao servidor. Verifique se o backend está ativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rhino-dark px-4 relative overflow-hidden" id="login-container">
      {/* Background Decorative Accent */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rhino-blue/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rhino-pink/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-rhino-card border border-rhino-border rounded-2xl shadow-2xl overflow-hidden"
        id="login-card"
      >
        <div className="p-8 text-center border-b border-rhino-border bg-rhino-card/50">
          <div className="flex flex-col items-center justify-center mb-2" id="brand-logo-container">
            <img 
              src={logoImg} 
              alt="Rhino Cargo Logo" 
              className="h-20 w-auto object-contain max-w-[240px]"
              id="brand-logo"
            />
          </div>
          <p className="text-[11px] text-rhino-green font-bold tracking-widest uppercase mt-2" id="brand-tagline">
            Logística & Serviços
          </p>
        </div>

        <div className="p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2"
              id="login-error-alert"
            >
              <Shield className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="login-email-input"
                  type="text"
                  required
                  placeholder="exemplo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-rhino-dark/60 border border-rhino-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink transition-colors font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-rhino-dark/60 border border-rhino-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-rhino-pink transition-colors font-sans"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rhino-blue to-rhino-pink hover:opacity-90 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-rhino-pink/10"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Iniciar Sessão</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-rhino-border/40 text-center">
            <span className="text-xs text-slate-500">
              Acesso exclusivo para colaboradores Rhino Cargo.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
