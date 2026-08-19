import React, { useState, useEffect } from 'react';
import { KeyRound, User, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';
import { StorageService } from '../services/storageService';
import { FirestoreService } from '../lib/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isMandatory = false
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Load and sync users from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    
    // First load from local storage
    const localUsers = StorageService.getUsers();
    setAvailableUsers(localUsers);

    // Pull directly from Firestore to ensure cross-device recognition
    FirestoreService.fetchUsersOnce()
      .then((cloudUsers) => {
        if (!isMounted) return;
        if (cloudUsers && cloudUsers.length > 0) {
          setAvailableUsers(cloudUsers);
          localStorage.setItem('portal_users_db', JSON.stringify(cloudUsers));
        }
      })
      .catch((err) => {
        console.warn('Login: could not fetch cloud users:', err);
      })
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleSelectQuickUser = (user: UserAccount) => {
    setUsername(user.username);
    setPassword('');
    setErrorMsg(null);
    setTimeout(() => {
      const passInput = document.getElementById('input-login-password');
      if (passInput) passInput.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInputUser = username.trim().toLowerCase();
    const users = availableUsers.length > 0 ? availableUsers : StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === cleanInputUser);

    if (!user) {
      setErrorMsg(`Usuario "${username}" no encontrado en el sistema. Verifique las credenciales.`);
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isMandatory ? 'bg-[#2b2825]' : 'bg-stone-900/80 backdrop-blur-xs'
      }`}
    >
      <div 
        id="login-modal-box"
        className="bg-white w-full max-w-md rounded shadow-2xl border border-stone-300 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#35322f] p-6 text-white text-center relative border-b-4 border-[#BCB703]">
          <div className="w-12 h-12 rounded-full bg-[#BCB703]/20 border border-[#BCB703] flex items-center justify-center mx-auto mb-2.5">
            <KeyRound className="w-6 h-6 text-[#BCB703]" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-[#F2EDC9]">
            Control Recepción y Despacho
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Planta Ranquil / Descortezado - Acceso Seguro
          </p>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-300">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-amber-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sincronizando usuarios con la nube...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>Usuarios sincronizados ({availableUsers.length} cuentas)</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick User Selection Pills */}
        {availableUsers.length > 0 && (
          <div className="px-6 pt-4 pb-2 bg-stone-50 border-b border-stone-200">
            <label className="block text-[10px] font-black uppercase text-stone-500 tracking-wider mb-2">
              Cuentas Disponibles en el Sistema:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {availableUsers.map((u) => {
                const isAdmin = u.rol === 'admin';
                const isSelected = username.toLowerCase() === u.username.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'bg-[#BCB703] text-stone-900 border-stone-800 shadow-xs'
                        : 'bg-white hover:bg-stone-200 text-stone-700 border-stone-300'
                    }`}
                  >
                    {isAdmin ? (
                      <ShieldCheck className="w-3 h-3 text-[#D37608]" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-emerald-700" />
                    )}
                    <span>{u.nombre}</span>
                    <span className="text-[10px] text-stone-500 font-mono">({u.username})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
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
                placeholder="Ej: admin o recepcion"
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
            {!isMandatory ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded"
              >
                Cancelar
              </button>
            ) : (
              <span className="text-[11px] text-stone-500 font-medium">
                Inicio de sesión obligatorio
              </span>
            )}
            
            <button
              id="btn-submit-login"
              type="submit"
              className="px-6 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase tracking-wider rounded shadow transition-colors flex items-center gap-1.5 ml-auto"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
