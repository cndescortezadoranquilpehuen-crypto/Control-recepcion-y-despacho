import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, ShieldCheck, UserCheck, Key, UserPlus, CheckCircle, Edit2 } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface UserManagementProps {
  currentUser: UserAccount | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<UserRole>('usuario');
  const [cargo, setCargo] = useState('');

  const loadUsers = () => {
    setUsers(StorageService.getUsers());
  };

  useEffect(() => {
    loadUsers();
    const unsubscribe = StorageService.subscribe(() => {
      loadUsers();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nombre.trim()) return;

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: username.trim().toLowerCase(),
      password: password || '123',
      nombre: nombre.trim(),
      rol,
      cargo: cargo.trim() || (rol === 'admin' ? 'Administrador' : 'Recepcionista')
    };

    StorageService.saveUser(newUser);
    loadUsers();
    setShowAddForm(false);
    setUsername('');
    setPassword('');
    setNombre('');
    setCargo('');
    setNotification(`Usuario ${newUser.nombre} creado con éxito.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (currentUser?.id === id) {
      alert('No puedes eliminar tu propia cuenta en sesión.');
      return;
    }
    if (window.confirm(`¿Eliminar al usuario ${name}?`)) {
      StorageService.deleteUser(id);
      loadUsers();
      setNotification(`Usuario ${name} eliminado.`);
    }
  };

  return (
    <div id="user-management-module" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#676057]">
            <Users className="w-5 h-5 text-[#BCB703]" />
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">
              Módulo Gestión de Usuarios y Roles
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Administración de cuentas de acceso para el personal de Recepción, Despacho y Administración.
          </p>
        </div>

        <button
          id="btn-create-user-modal"
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">✕</button>
        </div>
      )}

      {/* Users Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u) => {
          const isAdmin = u.rol === 'admin';
          const isMe = currentUser?.id === u.id;

          return (
            <div
              key={u.id}
              className="bg-white border border-stone-200 rounded-sm p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isAdmin ? 'bg-[#D37608]/10 text-[#D37608] border border-[#D37608]' : 'bg-[#BCB703]/20 text-stone-800 border border-[#BCB703]'
                    }`}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">{u.nombre}</h3>
                      <p className="text-[11px] text-stone-500 font-mono">@{u.username}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1 ${
                    isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-3 h-3 text-[#D37608]" /> : <UserCheck className="w-3 h-3 text-emerald-700" />}
                    {u.rol}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                  <p><span className="font-semibold text-stone-700">Cargo:</span> {u.cargo || (isAdmin ? 'Administrador del Sistema' : 'Recepcionista')}</p>
                  <p><span className="font-semibold text-stone-700">Contraseña:</span> <span className="font-mono text-stone-400">••••••••</span></p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between">
                {isMe ? (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    SESIÓN ACTIVA
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400">ID: {u.id}</span>
                )}

                {!isMe && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.nombre)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded shadow-2xl border border-stone-300 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4 pb-2 border-b border-stone-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#BCB703]" />
              Crear Nuevo Usuario
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro Valdivia"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border rounded focus:border-[#BCB703] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: pvaldivia"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border rounded focus:border-[#BCB703] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Contraseña de acceso..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border rounded focus:border-[#BCB703] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Rol de Acceso</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as UserRole)}
                  className="w-full h-8 px-2 text-xs border rounded focus:border-[#BCB703] outline-none"
                >
                  <option value="usuario">Usuario / Recepcionista (Operación de Tickets)</option>
                  <option value="admin">Administrador (Control total y Excel DB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cargo o Función</label>
                <input
                  type="text"
                  placeholder="Ej: Recepcionista de Turno Tarde"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border rounded focus:border-[#BCB703] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase rounded shadow"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
