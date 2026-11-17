import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';

interface AdminLoginViewProps {
  onLoginSuccess: (token: string) => void;
  onBackHome: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackHome
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Informe a senha da equipe clínica.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.error || 'Senha inválida.');
        return;
      }
      onLoginSuccess(data.token);
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#03422A]">
            <Lock className="w-4 h-4" />
            <span>Acesso Restrito · Equipe Clínica</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-stone-900">
            Painel EmagreSLIM
          </h1>
          <p className="text-sm text-stone-600">
            Área protegida para revisão clínica de nutricionistas, auditoria de e-mails/GTM e controles de teste.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-stone-700">Senha administrativa</span>
            <input
              type="password"
              value={password}
              onChange={e => {
                setError(null);
                setPassword(e.target.value);
              }}
              placeholder="Digite a senha configurada"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#03422A]"
            />
          </label>

          {error && (
            <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-5 py-3 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold uppercase tracking-wide disabled:opacity-60"
          >
            {isLoading ? 'Verificando...' : 'Entrar no Painel Clínico'}
          </button>
        </form>

        <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            onClick={onBackHome}
            className="font-medium text-stone-700 hover:text-[#03422A] flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o site público</span>
          </button>
          <span>ADMIN_PASSWORD</span>
        </div>
      </div>
    </section>
  );
};
