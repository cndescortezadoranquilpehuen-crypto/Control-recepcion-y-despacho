import React, { useState } from 'react';
import { KeyRound, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { UserAccount } from '../types';
import { StorageService } from '../services/storageService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const users = StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!user) {
      setErrorMsg('Usuario no encontrado.');
      return;
    }

    if (user.password && user.password !== password) {
      setErrorMsg('Contraseña incorrecta.');
      return;
    }

    StorageService.setCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div 
      id="login-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div 
        id="login-modal-box"
        className="bg-white w-full max-w-md rounded-sm shadow-2xl border border-stone-300 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#35322f] p-6 text-white text-center relative border-b-4 border-[#BCB703]">
          <div className="w-12 h-12 rounded-full bg-[#BCB703]/20 border border-[#BCB703] flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-[#BCB703]" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-wider text-[#F2EDC9]">
            Portal Control Forestal
          </h2>
          <p className="text-xs text-neutral-400">
            Recepción y Despacho - Ingreso con Credenciales
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#fcfcfb]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
              Nombre de Usuario
            </label>
            <div className="relative">
              <input
                id="input-login-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none font-mono"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="input-login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded"
            >
              Cerrar
            </button>
            <button
              id="btn-submit-login"
              type="submit"
              className="px-6 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase tracking-wider rounded shadow transition-colors flex items-center gap-1.5"
            >
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
