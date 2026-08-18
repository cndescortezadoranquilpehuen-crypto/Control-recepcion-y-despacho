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
  Printer
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

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    fechaPrograma: '2026-08-18',
    zonaForestal: '',
    emseforDespacho: '',
    origen: '',
    destino: '',
    numeroGiro: '',
    grua: '',
    textoBusqueda: ''
  });

  // Load initial session & tickets with real-time Firebase subscription
  useEffect(() => {
    testFirestoreConnection();
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setTickets(StorageService.getTickets());
    if (user && user.rol !== 'admin' && (currentTab === 'database' || currentTab === 'usuarios' || currentTab === 'inicio')) {
      setCurrentTab('recepcion');
    }

    // Subscribe to real-time Firestore updates
    const unsubscribe = FirestoreService.subscribeTickets((firestoreTickets) => {
      if (firestoreTickets && firestoreTickets.length > 0) {
        setTickets(firestoreTickets);
        localStorage.setItem('portal_tickets_db', JSON.stringify(firestoreTickets));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.rol !== 'admin' && (currentTab === 'database' || currentTab === 'usuarios' || currentTab === 'inicio')) {
      setCurrentTab('recepcion');
    }
  }, [currentUser, currentTab]);

  const refreshTickets = () => {
    setTickets(StorageService.getTickets());
  };

  // Filter tickets logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Tab filter
      if (currentTab === 'recepcion' && t.tipo !== 'recepcion') return false;
      if (currentTab === 'despacho' && t.tipo !== 'despacho') return false;

      // Filter Bar filters
      if (filters.fechaPrograma && t.fechaPrograma && t.fechaPrograma !== filters.fechaPrograma) {
        if (!t.fechaPrograma.includes(filters.fechaPrograma)) return false;
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
        const matchGiro = t.numeroGiro && t.numeroGiro.toLowerCase().includes(query);
        const matchGuia = t.numeroGuia && t.numeroGuia.toLowerCase().includes(query);
        if (!matchGiro && !matchGuia) return false;
      }
      if (filters.grua && t.grua && !t.grua.toLowerCase().includes(filters.grua.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tickets, currentTab, filters]);

  // Statistics
  const receptionTickets = tickets.filter(t => t.tipo === 'recepcion');
  const dispatchTickets = tickets.filter(t => t.tipo === 'despacho');

  const totalVolumenMR = useMemo(() => {
    return filteredTickets.reduce((acc, curr) => {
      const v = parseFloat(curr.volumenMR) || 0;
      return acc + v;
    }, 0).toFixed(1);
  }, [filteredTickets]);

  // Open modal to add new event
  const handleOpenAddEvent = (type: TicketType) => {
    setSelectedTicket(null);
    setModalDefaultType(type);
    setIsTicketModalOpen(true);
  };

  // Open modal to edit existing ticket
  const handleOpenEditEvent = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setModalDefaultType(ticket.tipo);
    setIsTicketModalOpen(true);
  };

  // Print Thermal Ticket
  const handleTriggerThermalPrint = (ticket: TicketItem) => {
    setTicketToPrint(ticket);
    setIsPrintModalOpen(true);
  };

  // Save ticket handler
  const handleSaveTicket = (ticket: TicketItem) => {
    StorageService.saveTicket(ticket);
    refreshTickets();
    showToast(`Evento de ${ticket.tipo === 'recepcion' ? 'Recepción' : 'Despacho'} (Guía Nº ${ticket.numeroGuia}) guardado con éxito.`);
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
        receptionCount={receptionTickets.length}
        dispatchCount={dispatchTickets.length}
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
              {/* Filter Bar */}
              <FilterBar
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetFilters}
                onSearch={() => refreshTickets()}
              />

              {/* Statistics & Overview Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white p-3 rounded border border-stone-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    {currentTab === 'recepcion' ? 'Total Recepciones' : 'Total Despachos'}
                  </span>
                  <span className="text-xl font-extrabold text-stone-900 font-mono">
                    {filteredTickets.length}
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Volumen Total MR
                  </span>
                  <span className="text-xl font-extrabold text-[#D37608] font-mono">
                    {totalVolumenMR} <span className="text-xs text-stone-500 font-normal">MR</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Destino Principal
                  </span>
                  <span className="text-xs font-bold text-stone-800 truncate block mt-1">
                    {currentTab === 'recepcion' ? 'CN RANQUIL' : (filters.destino || 'Todos')}
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Fecha Programa
                  </span>
                  <span className="text-xs font-bold text-stone-800 font-mono block mt-1">
                    {filters.fechaPrograma || 'Todas'}
                  </span>
                </div>
              </div>

              {/* Cards Grid Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                  Eventos Registrados ({filteredTickets.length})
                </h3>
                <span className="text-[11px] text-stone-500">
                  Haz clic en cualquier tarjeta para editar o presiona el icono <Printer className="w-3 h-3 inline text-stone-600" /> para imprimir en formato térmico (≤ 8cm)
                </span>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-stone-300 rounded p-12 text-center my-6">
                  <Truck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-700 uppercase">No hay tickets registrados</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
                    No se encontraron eventos que coincidan con los filtros actuales.
                  </p>
                  <button
                    onClick={() => handleOpenAddEvent(currentTab as TicketType)}
                    className="px-5 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase rounded shadow"
                  >
                    + Agregar Evento de {currentTab === 'recepcion' ? 'Recepción' : 'Despacho'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpenEdit={handleOpenEditEvent}
                      onDelete={handleDeleteTicket}
                      onPrintThermal={handleTriggerThermalPrint}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: INICIO DASHBOARD */}
          {currentTab === 'inicio' && (
            <div className="space-y-6">
              {/* Quick Actions Hero */}
              <div className="bg-gradient-to-r from-[#35322f] to-[#47433f] text-[#F2EDC9] p-6 rounded-sm shadow-md border-b-4 border-[#BCB703] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                    Bienvenido al Portal de Recepción y Despacho Forestal
                  </h2>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                    Control de pesaje, recepción y despacho de camiones. Formatos adaptados para impresión en ticketera térmica CITIZEN CT-S4000 (≤ 8cm).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setCurrentTab('recepcion'); handleOpenAddEvent('recepcion'); }}
                    className="px-5 py-2.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase rounded shadow transition-all flex items-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Nueva Recepción</span>
                  </button>
                  <button
                    onClick={() => { setCurrentTab('despacho'); handleOpenAddEvent('despacho'); }}
                    className="px-5 py-2.5 bg-[#D37608] hover:bg-[#ba6502] text-white text-xs font-extrabold uppercase rounded shadow transition-all flex items-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Nuevo Despacho</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setCurrentTab('recepcion')}
                  className="bg-white p-5 rounded border border-stone-200 shadow-sm hover:border-[#1e3a8a] cursor-pointer transition-all border-l-4 border-l-[#1e3a8a]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-stone-600">Recepción de Camiones</span>
                    <ArrowDownLeft className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 font-mono">{receptionTickets.length}</div>
                  <p className="text-[11px] text-stone-500 mt-1">Destinos: CN Ranquil / Descortezado</p>
                </div>

                <div 
                  onClick={() => setCurrentTab('despacho')}
                  className="bg-white p-5 rounded border border-stone-200 shadow-sm hover:border-[#D37608] cursor-pointer transition-all border-l-4 border-l-[#D37608]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-stone-600">Despacho de Camiones</span>
                    <ArrowUpRight className="w-5 h-5 text-[#D37608]" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 font-mono">{dispatchTickets.length}</div>
                  <p className="text-[11px] text-stone-500 mt-1">Salidas registradas</p>
                </div>

                <div 
                  onClick={() => setCurrentTab('database')}
                  className="bg-white p-5 rounded border border-stone-200 shadow-sm hover:border-[#BCB703] cursor-pointer transition-all border-l-4 border-l-[#BCB703]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-stone-600">Base de Datos Excel</span>
                    <FileSpreadsheet className="w-5 h-5 text-[#BCB703]" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 font-mono">Activa</div>
                  <p className="text-[11px] text-stone-500 mt-1">Patentes, Choferes y Especies sincronizadas</p>
                </div>
              </div>

              {/* Recent Events List */}
              <div className="bg-white rounded border border-stone-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                    Últimos Eventos Registrados en el Sistema
                  </h3>
                  <button 
                    onClick={() => setCurrentTab('recepcion')}
                    className="text-xs font-bold text-[#676057] hover:text-[#BCB703]"
                  >
                    Ver todos →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.slice(0, 6).map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpenEdit={handleOpenEditEvent}
                      onDelete={handleDeleteTicket}
                      onPrintThermal={handleTriggerThermalPrint}
                    />
                  ))}
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

      {/* Login / User Switch Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Sesión iniciada como ${user.nombre} (${user.rol.toUpperCase()})`);
        }}
      />
    </div>
  );
}
