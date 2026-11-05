'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { RequiredMark } from '@/components/RequiredField';

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState<'vazio' | 'formato' | null>(null);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = !fullName.trim();
    const nextEmail = !email.trim() ? 'vazio' as const : email.includes('@') && email.split('@')[1]?.includes('.') ? null : 'formato' as const;
    const nextPassword = password.length < 6;
    setNameError(nextName);
    setEmailError(nextEmail);
    setPasswordError(nextPassword);
    if (nextName || nextEmail || nextPassword) return;
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password);
    } catch (err: any) {
      setError('Não foi possível criar a conta. Use outro e-mail ou entre se ela já existir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0a0d12]">
      <div className="w-full max-w-md p-8 bg-[#161b22] border border-slate-800 rounded-3xl shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-400 shadow-xl shadow-teal-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Criar Conta</h1>
          <p className="text-xs text-slate-400 mt-1">Comece seus estudos potencializados com IA Local</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-slate-100">Quem é você</legend>
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-slate-200 mb-1.5">
                Nome<RequiredMark />
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  aria-invalid={nameError || undefined}
                  onChange={(e) => { setFullName(e.target.value); setNameError(false); }}
                  placeholder="Ana Souza"
                  className={`w-full min-h-12 pl-10 pr-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${nameError ? 'field-invalid' : ''}`}
                />
              </div>
              {nameError && <p className="field-error" role="alert">Preencha o nome.</p>}
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-200 mb-1.5">
                E-mail<RequiredMark />
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={emailError ? true : undefined}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="nome@exemplo.com"
                  className={`w-full min-h-12 pl-10 pr-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${emailError ? 'field-invalid' : ''}`}
                />
              </div>
              {emailError === 'vazio' && <p className="field-error" role="alert">Preencha o e-mail.</p>}
              {emailError === 'formato' && <p className="field-error" role="alert">Use um e-mail como nome@exemplo.com.</p>}
            </div>
          </fieldset>

          <fieldset className="space-y-3 pt-2 border-t border-slate-800">
            <legend className="text-sm font-bold text-slate-100">Como você entra</legend>
            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-slate-200 mb-1.5">
                Senha<RequiredMark />
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  aria-invalid={passwordError || undefined}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                  placeholder="Mínimo de 6 caracteres"
                  className={`w-full min-h-12 pl-10 pr-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${passwordError ? 'field-invalid' : ''}`}
                />
              </div>
              {passwordError && <p className="field-error" role="alert">A senha precisa ter pelo menos 6 caracteres.</p>}
            </div>
          </fieldset>
          {error && <p className="field-error" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Criar conta e entrar'}
            {!loading && <ArrowRight className="w-4 h-4 text-white" />}
          </button>
          {loading && <p className="text-xs text-slate-400" role="status">Criando sua conta…</p>}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Já possui conta?{' '}
          <Link href="/login" className="font-semibold text-teal-400 hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
