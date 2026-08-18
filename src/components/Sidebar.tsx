import React from 'react';
import { 
  Home, 
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Database, 
  Users, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck,
  UserCheck,
  Lock
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  receptionCount: number;
  dispatchCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  onOpenLogin,
  receptionCount,
  dispatchCount
}) => {
  const [monitorOpen, setMonitorOpen] = React.useState(true);
  const isAdmin = currentUser?.rol === 'admin';

  return (
    <aside 
      id="sidebar-container" 
      className="w-64 bg-[#35322f] text-neutral-200 flex flex-col flex-shrink-0 min-h-screen border-r border-[#47433f] shadow-lg select-none"
    >
      {/* Brand Header */}
      <div id="sidebar-header" className="p-4 border-b border-[#47433f] flex flex-col items-center gap-2 bg-[#2d2a27]">
        {/* Geometric golden triangle logo */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#BCB703] rotate-45 flex items-center justify-center bg-[#BCB703]/10 rounded-sm">
            <div className="w-5 h-5 bg-[#BCB703] rotate-45 transform origin-center opacity-80" />
          </div>
          <div className="absolute inset-0 border border-[#D37608]/40 rotate-12 pointer-events-none" />
        </div>
        <div className="text-center">
          <h1 className="text-xs font-bold uppercase tracking-widest text-[#F2EDC9]">
            Control Recepción
          </h1>
          <span className="text-[10px] text-[#BCB703] font-bold font-mono tracking-wider">
            &amp; DESPACHO
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav id="sidebar-nav" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Inicio - Only for admin or general overview */}
        {isAdmin && (
          <button
            id="btn-nav-inicio"
            onClick={() => setCurrentTab('inicio')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
              currentTab === 'inicio' 
                ? 'bg-[#676057] text-[#F2EDC9] shadow-inner' 
                : 'hover:bg-[#423f3b] text-neutral-300'
            }`}
          >
            <Home className="w-4 h-4 text-[#BCB703]" />
            <span>Panel General</span>
          </button>
        )}

        {/* Monitor Menu with Dropdown - Available to both user and admin */}
        <div className="pt-2">
          <button
            id="btn-nav-monitor-toggle"
            onClick={() => setMonitorOpen(!monitorOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold tracking-wider uppercase text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#BCB703]" />
              Gestión de Tickets
            </span>
            {monitorOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {monitorOpen && (
            <div className="mt-1 space-y-1 pl-2">
              <button
                id="btn-nav-recepcion"
                onClick={() => setCurrentTab('recepcion')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                  currentTab === 'recepcion'
                    ? 'bg-[#BCB703] text-stone-900 font-bold shadow'
                    : 'hover:bg-[#423f3b] text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Tickets Recepción</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  currentTab === 'recepcion' ? 'bg-stone-900 text-[#BCB703]' : 'bg-[#47433f] text-neutral-300'
                }`}>
                  {receptionCount}
                </span>
              </button>

              <button
                id="btn-nav-despacho"
                onClick={() => setCurrentTab('despacho')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                  currentTab === 'despacho'
                    ? 'bg-[#D37608] text-white font-bold shadow'
                    : 'hover:bg-[#423f3b] text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Tickets Despacho</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  currentTab === 'despacho' ? 'bg-stone-900 text-white' : 'bg-[#47433f] text-neutral-300'
                }`}>
                  {dispatchCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Database & Management - Restricted strictly to Administrator */}
        {isAdmin ? (
          <div className="pt-4 border-t border-[#47433f]/60 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-widest text-[#D37608] uppercase">
              Administración
            </div>
            <button
              id="btn-nav-database"
              onClick={() => setCurrentTab('database')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                currentTab === 'database' 
                  ? 'bg-[#676057] text-[#F2EDC9]' 
                  : 'hover:bg-[#423f3b] text-neutral-300'
              }`}
            >
              <Database className="w-4 h-4 text-[#BCB703]" />
              <span>Base de Datos Excel</span>
            </button>

            <button
              id="btn-nav-usuarios"
              onClick={() => setCurrentTab('usuarios')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                currentTab === 'usuarios' 
                  ? 'bg-[#676057] text-[#F2EDC9]' 
                  : 'hover:bg-[#423f3b] text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 text-[#BCB703]" />
              <span>Gestión Usuarios</span>
            </button>
          </div>
        ) : (
          <div className="pt-6 border-t border-[#47433f]/60 px-3">
            <div className="p-3 bg-[#2d2a27] rounded border border-[#47433f] text-[11px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1 text-[#BCB703] font-bold uppercase text-[10px]">
                <Lock className="w-3 h-3" />
                <span>Perfil Operador</span>
              </div>
              <p className="leading-tight text-[10px]">
                Acceso completo a creación, edición, cubicación e impresión de tickets. Las bases maestras son administradas por el Administrador.
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* User Info & Footer */}
      <div id="sidebar-footer" className="p-3 border-t border-[#47433f] bg-[#2d2a27]">
        {currentUser ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                  isAdmin ? 'bg-[#D37608] border-[#F2EDC9] text-white' : 'bg-[#676057] border-[#BCB703] text-[#F2EDC9]'
                }`}>
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-neutral-200 truncate">{currentUser.nombre}</p>
                  <span className="text-[10px] text-[#BCB703] uppercase font-mono tracking-wider flex items-center gap-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[#D37608] font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        ADMINISTRADOR
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#BCB703] font-bold">
                        <UserCheck className="w-3 h-3" />
                        RECEPCIONISTA / OPERADOR
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <button
                id="btn-logout"
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            id="btn-open-login"
            onClick={onOpenLogin}
            className="w-full py-2 px-3 bg-[#BCB703] text-stone-900 rounded font-semibold text-xs hover:bg-[#a8a302] transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};
