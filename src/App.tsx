/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Truck, 
  Package, 
  Calendar, 
  Layers, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer,
  MonitorDown,
  RotateCcw
} from 'lucide-react';

import { FilterState, TicketItem, TicketType, UserAccount } from './types';
import { StorageService } from './services/storageService';
import { FirestoreService, testFirestoreConnection } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { TicketCard } from './components/TicketCard';
import { TicketModal } from './components/TicketModal';
import { DatabaseModule } from './components/DatabaseModule';
import { UserManagement } from './components/UserManagementModal';
import { LoginModal } from './components/LoginModal';
import { ThermalReceiptModal } from './components/ThermalReceipt';
import { DesktopInstallModal } from './components/DesktopInstallModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('recepcion');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Tickets state
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [modalDefaultType, setModalDefaultType] = useState<TicketType>('recepcion');

  // Thermal Printer state
  const [ticketToPrint, setTicketToPrint] = useState<TicketItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Desktop PWA Install state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    fechaPrograma: '',
    zonaForestal: '',
    emseforDespacho: '',
    origen: '',
    destino: '',
    numeroGiro: '',
    grua: '',
    textoBusqueda: ''
  });

  // View filter for Reception/Dispatch: 'activos' (en patio) vs 'todos'
  const [ticketViewFilter, setTicketViewFilter] = useState<'activos' | 'todos'>('activos');
  // View filter for Panel General: 'todos' | 'activos' | 'cerrados'
  const [panelFilter, setPanelFilter] = useState<'todos' | 'activos' | 'cerrados'>('todos');

  // Load initial session & tickets with real-time Firebase subscriptions
  useEffect(() => {
    testFirestoreConnection();
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setTickets(StorageService.getTickets());
    
    if (user && user.rol !== 'admin' && currentTab === 'usuarios') {
      setCurrentTab('recepcion');
    }

    // Capture PWA install prompt for Windows / Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Initial sync with Firestore in background for all databases
    StorageService.syncWithFirestore();

    // Subscribe to real-time Firestore updates for Tickets
    const unsubscribeTickets = FirestoreService.subscribeTickets((firestoreTickets) => {
      if (firestoreTickets && firestoreTickets.length > 0) {
        setTickets(firestoreTickets);
        localStorage.setItem('portal_tickets_db', JSON.stringify(firestoreTickets));
      }
    });

    // Subscribe to real-time Firestore updates for Patentes
    const unsubscribePatentes = FirestoreService.subscribePatentes((patentes) => {
      if (patentes && patentes.length > 0) {
        localStorage.setItem('portal_patentes_db', JSON.stringify(patentes));
      }
    });

    // Subscribe to real-time Firestore updates for Conductores
    const unsubscribeConductores = FirestoreService.subscribeConductores((conductores) => {
      if (conductores && conductores.length > 0) {
        localStorage.setItem('portal_conductores_db', JSON.stringify(conductores));
      }
    });

    // Subscribe to real-time Firestore updates for Productos
    const unsubscribeProductos = FirestoreService.subscribeProductos((productos) => {
      if (productos && productos.length > 0) {
        localStorage.setItem('portal_productos_db', JSON.stringify(productos));
      }
    });

    // Subscribe to real-time Firestore updates for Users
    const unsubscribeUsers = FirestoreService.subscribeUsers((users) => {
      if (users && users.length > 0) {
        localStorage.setItem('portal_users_db', JSON.stringify(users));
      }
    });

    // Subscribe to local storage service changes
    const unsubscribeStorage = StorageService.subscribe(() => {
      setTickets(StorageService.getTickets());
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      unsubscribeTickets();
      unsubscribePatentes();
      unsubscribeConductores();
      unsubscribeProductos();
      unsubscribeUsers();
      unsubscribeStorage();
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.rol !== 'admin' && currentTab === 'usuarios') {
      setCurrentTab('recepcion');
    }
  }, [currentUser, currentTab]);

  const refreshTickets = () => {
    setTickets(StorageService.getTickets());
  };

  // Trigger native PWA install prompt
  const handleNativeInstall = async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('¡Instalación de la aplicación completada con éxito!');
        }
        setDeferredInstallPrompt(null);
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
    }
  };

  // Filter tickets logic
  const filteredTickets = useMemo(() => {
    const matched = tickets.filter((t) => {
      // Tab filter
      if (currentTab === 'recepcion' && t.tipo !== 'recepcion') return false;
      if (currentTab === 'despacho' && t.tipo !== 'despacho') return false;

      // Active vs Closed sub-filter in Reception/Dispatch tabs
      if ((currentTab === 'recepcion' || currentTab === 'despacho') && ticketViewFilter === 'activos') {
        if (t.estado === 'cerrado') return false;
      }

      // Filter Bar: fechaPrograma matching
      if (filters.fechaPrograma && t.fechaPrograma) {
        const normFilter = filters.fechaPrograma.replace(/\//g, '-');
        const normTicket = t.fechaPrograma.replace(/\//g, '-');
        const partsFilter = normFilter.split('-');
        const revFilter = partsFilter.length === 3 ? `${partsFilter[2]}-${partsFilter[1]}-${partsFilter[0]}` : normFilter;
        if (normTicket !== normFilter && normTicket !== revFilter && !normTicket.includes(normFilter)) {
          return false;
        }
      }
      if (filters.emseforDespacho && !t.transportista.toLowerCase().includes(filters.emseforDespacho.toLowerCase()) && !t.emseforDespacho.toLowerCase().includes(filters.emseforDespacho.toLowerCase())) {
        return false;
      }
      if (filters.origen && t.origen && !t.origen.toLowerCase().includes(filters.origen.toLowerCase())) {
        return false;
      }
      if (filters.destino && t.destino && !t.destino.toLowerCase().includes(filters.destino.toLowerCase())) {
        return false;
      }
      if (filters.numeroGiro) {
        const query = filters.numeroGiro.toLowerCase();
        const matchesGiro = t.numeroGiro && t.numeroGiro.toLowerCase().includes(query);
        const matchesGuia = t.numeroGuia && t.numeroGuia.toLowerCase().includes(query);
        if (!matchesGiro && !matchesGuia) return false;
      }
      if (filters.grua && t.grua && !t.grua.toLowerCase().includes(filters.grua.toLowerCase())) {
        return false;
      }

      // Quick Search text across multiple fields
      if (filters.textoBusqueda) {
        const q = filters.textoBusqueda.toLowerCase();
        const matches = 
          (t.numeroGuia && t.numeroGuia.toLowerCase().includes(q)) ||
          (t.numeroTicket && t.numeroTicket.toLowerCase().includes(q)) ||
          (t.patenteCamion && t.patenteCamion.toLowerCase().includes(q)) ||
          (t.patenteCarro && t.patenteCarro.toLowerCase().includes(q)) ||
          (t.siglaCamion && t.siglaCamion.toLowerCase().includes(q)) ||
          (t.transportista && t.transportista.toLowerCase().includes(q)) ||
          (t.nombreConductor && t.nombreConductor.toLowerCase().includes(q)) ||
          (t.codigoProducto && t.codigoProducto.toLowerCase().includes(q)) ||
          (t.origen && t.origen.toLowerCase().includes(q)) ||
          (t.destino && t.destino.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
    return StorageService.sortTicketsDesc(matched);
  }, [tickets, currentTab, filters, ticketViewFilter]);

  // Reception vs Dispatch counts (sorted descending)
  const receptionTickets = useMemo(() => StorageService.sortTicketsDesc(tickets.filter(t => t.tipo === 'recepcion')), [tickets]);
  const dispatchTickets = useMemo(() => StorageService.sortTicketsDesc(tickets.filter(t => t.tipo === 'despacho')), [tickets]);
  
  // Active counts (En Patio)
  const activeReceptionCount = useMemo(() => tickets.filter(t => t.tipo === 'recepcion' && t.estado !== 'cerrado').length, [tickets]);
  const activeDispatchCount = useMemo(() => tickets.filter(t => t.tipo === 'despacho' && t.estado !== 'cerrado').length, [tickets]);
  const totalActiveCount = useMemo(() => tickets.filter(t => t.estado !== 'cerrado').length, [tickets]);
  const totalClosedCount = useMemo(() => tickets.filter(t => t.estado === 'cerrado').length, [tickets]);

  // Panel General filtered tickets
  const panelGeneralTickets = useMemo(() => {
    let list = tickets;
    if (panelFilter === 'activos') {
      list = list.filter(t => t.estado !== 'cerrado');
    } else if (panelFilter === 'cerrados') {
      list = list.filter(t => t.estado === 'cerrado');
    }
    return StorageService.sortTicketsDesc(list);
  }, [tickets, panelFilter]);

  // Open modal to add new event
  const handleOpenAddEvent = (type: TicketType) => {
    setSelectedTicket(null);
    setModalDefaultType(type);
    setIsTicketModalOpen(true);
  };

  // Open modal to edit existing ticket
  const handleEditTicket = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setModalDefaultType(ticket.tipo);
    setIsTicketModalOpen(true);
  };

  // Open Citizen CT-S4000 Thermal Printer modal
  const handleTriggerThermalPrint = (ticket: TicketItem) => {
    setTicketToPrint(ticket);
    setIsPrintModalOpen(true);
  };

  // Save ticket handler
  const handleSaveTicket = (ticket: TicketItem) => {
    StorageService.saveTicket(ticket);
    refreshTickets();
    showToast(selectedTicket ? 'Ticket actualizado y sincronizado en la nube.' : 'Nuevo Ticket emitido y guardado exitosamente.');
  };

  // Close ticket handler (trasladar a Panel General)
  const handleCloseTicket = (id: string) => {
    const operatorName = currentUser?.nombre || currentUser?.username || 'Operador';
    StorageService.closeTicket(id, operatorName);
    refreshTickets();
    showToast('Evento finalizado y trasladado al Panel General.');
  };

  // Reopen ticket handler (volver a la ventana activa de Patio)
  const handleReopenTicket = (id: string) => {
    StorageService.reopenTicket(id);
    refreshTickets();
    showToast('Evento reabierto y regresado a la ventana activa.');
  };

  // Delete ticket handler
  const handleDeleteTicket = (id: string) => {
    StorageService.deleteTicket(id);
    refreshTickets();
    showToast('Evento eliminado definitivamente del sistema.');
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleResetFilters = () => {
    setFilters({
      fechaPrograma: '',
      zonaForestal: '',
      emseforDespacho: '',
      origen: '',
      destino: '',
      numeroGiro: '',
      grua: '',
      textoBusqueda: ''
    });
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f5f5f2] text-stone-900 font-sans antialiased overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        receptionCount={activeReceptionCount}
        dispatchCount={activeDispatchCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${
              currentTab === 'recepcion' 
                ? 'bg-[#1e3a8a] text-white' 
                : currentTab === 'despacho'
                ? 'bg-[#D37608] text-white'
                : 'bg-[#676057] text-[#F2EDC9]'
            }`}>
              {currentTab === 'recepcion' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : currentTab === 'despacho' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5 text-[#BCB703]" />
              )}
            </div>
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-wide text-stone-900">
                {currentTab === 'recepcion' && 'Monitor de Guías - Tickets de Recepción'}
                {currentTab === 'despacho' && 'Monitor de Guías - Tickets de Despacho'}
                {currentTab === 'inicio' && 'Panel General de Control Forestal'}
                {currentTab === 'database' && 'Base de Datos de Transporte y Productos'}
                {currentTab === 'usuarios' && 'Gestión de Personal y Roles'}
              </h1>
              <p className="text-xs text-stone-500 flex items-center gap-2">
                <span>Planta: <strong>CN RANQUIL / DESCORTEZADO</strong></span>
                <span>•</span>
                <span>Impresora Térmica: <strong>CITIZEN CT-S4000 (≤ 8cm)</strong></span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Desktop Install Button */}
            <button
              id="btn-header-install-desktop"
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3.5 py-2 bg-[#47433f] hover:bg-[#35322f] text-[#F2EDC9] text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 border border-[#676057] shadow-xs"
              title="Descargar o instalar en el escritorio de Windows"
            >
              <MonitorDown className="w-4 h-4 text-[#BCB703]" />
              <span className="hidden md:inline">Instalar en Windows</span>
            </button>

            {(currentTab === 'recepcion' || currentTab === 'inicio') && (
              <button
                id="btn-agregar-recepcion"
                onClick={() => handleOpenAddEvent('recepcion')}
                className="px-4 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase tracking-wider rounded shadow transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Recepción</span>
              </button>
            )}

            {(currentTab === 'despacho' || currentTab === 'inicio') && (
              <button
                id="btn-agregar-despacho"
                onClick={() => handleOpenAddEvent('despacho')}
                className="px-4 py-2 bg-[#D37608] hover:bg-[#ba6502] text-white text-xs font-extrabold uppercase tracking-wider rounded shadow transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Despacho</span>
              </button>
            )}

            <button
              id="btn-export-excel-header"
              onClick={() => StorageService.exportDatabaseExcel()}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 border border-stone-300"
              title="Descargar respaldo de eventos y base de datos"
            >
              <Download className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded shadow-sm text-xs flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Body Content by Current Tab */}
        <div className="p-6 flex-1">
          {/* TAB: RECEPCION OR DESPACHO */}
          {(currentTab === 'recepcion' || currentTab === 'despacho') && (
            <div className="space-y-4">
              {/* Active vs Completed toggle bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-stone-700 uppercase tracking-wider">Estado de Cola:</span>
                  <button
                    id="btn-filter-activos"
                    onClick={() => setTicketViewFilter('activos')}
                    className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${
                      ticketViewFilter === 'activos'
                        ? 'bg-[#BCB703] text-stone-900 shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                    <span>En Patio / Activos ({currentTab === 'recepcion' ? activeReceptionCount : activeDispatchCount})</span>
                  </button>
                  <button
                    id="btn-filter-todos"
                    onClick={() => setTicketViewFilter('todos')}
                    className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${
                      ticketViewFilter === 'todos'
                        ? 'bg-stone-800 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>Historial Completo ({currentTab === 'recepcion' ? receptionTickets.length : dispatchTickets.length})</span>
                  </button>
                </div>

                <div className="text-xs text-stone-500 hidden sm:block">
                  {ticketViewFilter === 'activos' 
                    ? '⚡ Camiones en patio. Al presionar "Cerrar", el ticket se traslada al Panel General.'
                    : '📋 Todos los eventos registrados (activos y finalizados).'}
                </div>
              </div>

              {/* Filter Bar */}
              <FilterBar
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetFilters}
                totalCount={filteredTickets.length}
                tipo={currentTab as TicketType}
              />

              {/* Tickets List / Empty State */}
              {filteredTickets.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-stone-300 rounded p-12 text-center">
                  <Truck className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">
                    {ticketViewFilter === 'activos'
                      ? `No hay camiones pendientes o activos en la cola de ${currentTab === 'recepcion' ? 'Recepción' : 'Despacho'}`
                      : 'No se encontraron tickets con los filtros seleccionados'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Haga clic en "+ Agregar {currentTab === 'recepcion' ? 'Recepción' : 'Despacho'}" para registrar un nuevo camión.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenAddEvent(currentTab as TicketType)}
                      className="px-4 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase rounded inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Nuevo Ticket</span>
                    </button>
                    {ticketViewFilter === 'activos' && (
                      <button
                        onClick={() => setTicketViewFilter('todos')}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase rounded"
                      >
                        Ver Historial Completo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onEdit={handleEditTicket}
                      onDelete={handleDeleteTicket}
                      onPrint={handleTriggerThermalPrint}
                      onCloseTicket={handleCloseTicket}
                      onReopenTicket={handleReopenTicket}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: INICIO / DASHBOARD (PANEL GENERAL) */}
          {currentTab === 'inicio' && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-500">Total General</span>
                    <Layers className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-stone-900 mt-2">{tickets.length}</p>
                  <p className="text-[11px] text-stone-500 mt-1">Registros en el sistema</p>
                </div>

                <div className="bg-white p-4 rounded border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-amber-600">En Patio (Activos)</span>
                    <Truck className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-600 mt-2">{totalActiveCount}</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {activeReceptionCount} recep. • {activeDispatchCount} desp.
                  </p>
                </div>

                <div className="bg-white p-4 rounded border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-600">Finalizados / Cerrados</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-2">{totalClosedCount}</p>
                  <p className="text-[11px] text-stone-500 mt-1">Trasladados al Panel General</p>
                </div>

                <div className="bg-white p-4 rounded border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-600">Recepción / Despacho</span>
                    <ArrowDownLeft className="w-4 h-4 text-[#1e3a8a]" />
                  </div>
                  <p className="text-2xl font-extrabold text-stone-800 mt-2">
                    {receptionTickets.length} <span className="text-sm font-normal text-stone-400">/</span> {dispatchTickets.length}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Total por tipo de flujo</p>
                </div>
              </div>

              {/* Panel General Feed */}
              <div className="bg-white rounded border border-stone-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                      Panel General de Eventos y Auditoría
                    </h3>
                    <span className="text-xs text-stone-500 font-mono">
                      ({panelGeneralTickets.length} mostrados)
                    </span>
                  </div>

                  {/* Filter Sub-Pills */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-panel-filter-todos"
                      onClick={() => setPanelFilter('todos')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        panelFilter === 'todos'
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      Todos ({tickets.length})
                    </button>
                    <button
                      id="btn-panel-filter-activos"
                      onClick={() => setPanelFilter('activos')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
                        panelFilter === 'activos'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                      <span>En Patio ({totalActiveCount})</span>
                    </button>
                    <button
                      id="btn-panel-filter-cerrados"
                      onClick={() => setPanelFilter('cerrados')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
                        panelFilter === 'cerrados'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Cerrados ({totalClosedCount})</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {panelGeneralTickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-stone-500 font-semibold">
                      No hay eventos en esta categoría del Panel General.
                    </div>
                  ) : (
                    panelGeneralTickets.map((t) => {
                      const isClosed = t.estado === 'cerrado';
                      return (
                        <div key={t.id} className="p-4 hover:bg-stone-50 transition-colors flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                t.tipo === 'recepcion' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {t.tipo}
                              </span>
                              {isClosed ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  CERRADO
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                  EN PATIO
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                                <span>Guía #{t.numeroGuia || 'S/N'}</span>
                                <span>•</span>
                                <span>Patente: {t.patenteCamion}</span>
                                {t.siglaCamion && <span className="text-stone-500 font-normal">({t.siglaCamion})</span>}
                              </p>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                {t.transportista} | {t.nombreConductor || 'Conductor N/A'} | Prod: {t.codigoProducto} | Vol: {t.volumenMR || '0.00'} MR
                              </p>
                              {t.fechaCierre && (
                                <p className="text-[10px] text-stone-400 mt-0.5">
                                  Cerrado: {new Date(t.fechaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Por: {t.cerradoPor || 'Operador'}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isClosed ? (
                              <button
                                onClick={() => handleCloseTicket(t.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                title="Cerrar evento y finalizar atención"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Cerrar Evento</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReopenTicket(t.id)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                title="Reabrir a la cola activa de Recepción/Despacho"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reabrir a Patio</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleTriggerThermalPrint(t)}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors"
                              title="Imprimir Ticket Térmico CITIZEN CT-S4000"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditTicket(t)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded transition-colors"
                            >
                              Ver Detalle
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE MODULE */}
          {currentTab === 'database' && (
            <DatabaseModule />
          )}

          {/* TAB: USERS MODULE */}
          {currentTab === 'usuarios' && (
            <UserManagement currentUser={currentUser} />
          )}
        </div>
      </main>

      {/* Ticket Modal (Add / Edit) */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticketToEdit={selectedTicket}
        defaultType={modalDefaultType}
        currentUser={currentUser}
        onSave={handleSaveTicket}
        onDelete={handleDeleteTicket}
        onPrintThermal={handleTriggerThermalPrint}
      />

      {/* Thermal Receipt Print Modal for Citizen CT-S4000 (<= 8cm) */}
      <ThermalReceiptModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        ticket={ticketToPrint}
      />

      {/* Desktop Windows Install Modal */}
      <DesktopInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onNativeInstall={handleNativeInstall}
        canInstallNative={!!deferredInstallPrompt}
      />

      {/* Login / Mandatory Startup Entry / User Switch Modal */}
      <LoginModal
        isOpen={!currentUser || isLoginOpen}
        isMandatory={!currentUser}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
          showToast(`Sesión iniciada como ${user.nombre} (${user.rol.toUpperCase()})`);
        }}
      />
    </div>
  );
}
