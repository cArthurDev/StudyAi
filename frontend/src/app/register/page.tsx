'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0a0d12]">
      <div className="w-full max-w-md p-8 bg-[#161b22] border border-slate-800 rounded-3xl shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EBD053] to-[#FFEE8C] shadow-xl shadow-amber-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-[#221d06]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Criar Conta</h1>
          <p className="text-xs text-slate-400 mt-1">Comece seus estudos potencializados com IA Local</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-6 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arthur Silva"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFEE8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFEE8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFEE8C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-6 py-3 px-4 text-sm font-bold text-[#221d06] bg-[#FFEE8C] hover:bg-[#F3DD64] disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#221d06]" /> : 'Cadastrar e Começar'}
            {!loading && <ArrowRight className="w-4 h-4 text-[#221d06]" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Já possui conta?{' '}
          <Link href="/login" className="font-semibold text-[#FFEE8C] hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
