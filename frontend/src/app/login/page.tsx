'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoPreta from '../../../images/logo_preto.png';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { RequiredMark } from '@/components/RequiredField';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextEmailError = !email.trim()
      ? 'vazio'
      : email.includes('@') && email.split('@')[1]?.includes('.')
      ? null
      : 'formato';
    const nextPasswordError = !password ? 'vazia' : password.length < 6 ? 'curta' : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0a0d12]">
      <div className="w-full max-w-md p-8 bg-[#161b22] border border-slate-800 rounded-3xl shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <Image src={logoPreta} alt="Study AI" className="h-auto w-56 max-w-full mb-3" preload />
          <p className="text-xs text-slate-400 mt-1">Sua plataforma de estudos com IA Local</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-slate-100 mb-2">Acesso à sua conta</legend>
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-200 mb-1.5">
                E-mail<RequiredMark />
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={emailError ? true : undefined}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); setError(null); }}
                  placeholder="nome@exemplo.com"
                  className={`w-full min-h-12 pl-10 pr-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${emailError ? 'field-invalid' : ''}`}
                />
              </div>
              {emailError === 'vazio' && <p className="field-error" role="alert">Preencha o e-mail.</p>}
              {emailError === 'formato' && <p className="field-error" role="alert">Use um e-mail como nome@exemplo.com.</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-200 mb-1.5">
                Senha<RequiredMark />
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={passwordError ? true : undefined}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(null); setError(null); }}
                  placeholder="Mínimo de 6 caracteres"
                  className={`w-full min-h-12 pl-10 pr-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${passwordError ? 'field-invalid' : ''}`}
                />
              </div>
              {passwordError === 'vazia' && <p className="field-error" role="alert">Preencha a senha.</p>}
              {passwordError === 'curta' && <p className="field-error" role="alert">A senha precisa ter pelo menos 6 caracteres.</p>}
            </div>
          </fieldset>
          {error && <p className="field-error" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Entrar na plataforma'}
            {!loading && <ArrowRight className="w-4 h-4 text-white" />}
          </button>
          {loading && <p className="text-xs text-slate-400" role="status">Conferindo e-mail e senha…</p>}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Ainda não tem uma conta?{' '}
          <Link href="/register" className="font-semibold text-teal-400 hover:underline">
            Criar conta gratuita
          </Link>
        </div>
      </div>
    </div>
  );
}
