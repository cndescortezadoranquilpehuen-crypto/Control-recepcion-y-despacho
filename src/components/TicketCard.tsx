import React from 'react';
import { Clock, Calendar, Truck, Package, Edit3, Trash2, Tag, Printer, FileText, Scale, Layers, CheckCircle2, RotateCcw } from 'lucide-react';
import { TicketItem } from '../types';

interface TicketCardProps {
  ticket: TicketItem;
  onEdit: (ticket: TicketItem) => void;
  onDelete: (id: string) => void;
  onPrint?: (ticket: TicketItem) => void;
  onCloseTicket?: (id: string) => void;
  onReopenTicket?: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onEdit,
  onDelete,
  onPrint,
  onCloseTicket,
  onReopenTicket
}) => {
  const isReception = ticket.tipo === 'recepcion';
  const isClosed = ticket.estado === 'cerrado';
  const accentBorderColor = isClosed 
    ? 'bg-emerald-600' 
    : (isReception ? 'bg-[#1e3a8a]' : 'bg-[#D37608]');
  const tagBg = isReception ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-900';

  // Format date display (e.g., DD-MM-YYYY)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.length === 10) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(ticket);
    }
  };

  return (
    <div
      id={`ticket-card-${ticket.id}`}
      onClick={handleCardClick}
      className={`group relative bg-white border-2 ${
        isClosed ? 'border-emerald-200 opacity-90' : 'border-stone-200'
      } hover:border-[#BCB703] rounded shadow-xs hover:shadow-md transition-all duration-150 flex flex-col cursor-pointer active:scale-[0.99] overflow-hidden`}
      title="Haga clic para ver o editar los datos del ticket"
    >
      {/* Left colored bar accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${accentBorderColor}`} />

      {/* Card Content */}
      <div className="pl-5 pr-3.5 pt-3 pb-2.5 flex-1 flex flex-col justify-between">
        
        {/* Top Header: Patente(Sigla) & Guías N° (Prominente) */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-2 mb-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-stone-900 tracking-wide block">
                {ticket.patenteCamion || 'SIN PATENTE'}{ticket.siglaCamion ? ` (${ticket.siglaCamion})` : ''}
              </span>
              {isClosed ? (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                  CERRADO
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded animate-pulse">
                  EN PATIO
                </span>
              )}
            </div>
            {ticket.patenteCarro && (
              <span className="text-[10px] text-stone-500 font-mono font-bold block">
                Carro: {ticket.patenteCarro}
              </span>
            )}
          </div>

          <div className="text-right bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="text-[9px] uppercase font-bold text-amber-900 block leading-tight flex items-center gap-1 justify-end">
              <FileText className="w-2.5 h-2.5 text-[#D37608]" />
              GUÍA Nº:
            </span>
            <span className="text-xs font-black text-stone-900 font-mono tracking-wider">
              {ticket.numeroGuia || 'S/N'}
            </span>
          </div>
        </div>

        {/* Transportista & Route */}
        <div className="space-y-0.5 my-1">
          <p className="text-xs font-extrabold text-stone-800 uppercase tracking-tight truncate" title={ticket.transportista}>
            {ticket.transportista || 'TRANSPORTISTA NO ESPECIFICADO'}
          </p>
          
          <div className="text-[11px] text-stone-600 space-y-0.5">
            <p className="truncate">
              <span className="font-bold text-stone-700">ORIGEN:</span> {ticket.origen || '(Sin origen especificado)'}
            </p>
            <p className="truncate">
              <span className="font-bold text-stone-700">DESTINO:</span> <strong className="text-stone-900">{ticket.destino || 'N048 CN RANQUIL'}</strong>
            </p>
            {ticket.nombreConductor && (
              <p className="truncate text-stone-600 text-[10.5px]">
                <span className="font-bold text-stone-700">CHOFER:</span> {ticket.nombreConductor}
              </p>
            )}
          </div>
        </div>

        {/* Weights & Ruma Row (if present) */}
        {(ticket.numeroRuma || ticket.pesoNeto || ticket.pesoBruto) && (
          <div className="my-1.5 p-1.5 bg-stone-50 rounded border border-stone-200 grid grid-cols-2 gap-1 text-[10px] font-mono">
            {ticket.numeroRuma && (
              <div className="flex items-center gap-1 text-stone-700 col-span-2">
                <Layers className="w-3 h-3 text-[#BCB703] flex-shrink-0" />
                <span>N° Ruma: <strong className="text-stone-900">{ticket.numeroRuma}</strong></span>
              </div>
            )}
            {ticket.pesoBruto && (
              <div>
                <span className="text-stone-500">P. Bruto:</span> <strong>{ticket.pesoBruto} kg</strong>
              </div>
            )}
            {ticket.pesoNeto && (
              <div className="text-right">
                <span className="text-[#D37608] font-bold">P. Neto:</span> <strong className="text-stone-900">{ticket.pesoNeto} kg</strong>
              </div>
            )}
          </div>
        )}

        {/* Meta Info: Hora, Fecha, Giro (if Despacho) / Grúa */}
        <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1.5 border-t border-stone-100 my-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            <span className="font-mono text-xs">{ticket.hora || '08:00'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-stone-400" />
            <span className="font-mono text-xs">{formatDateDisplay(ticket.fechaPrograma)}</span>
          </div>

          {!isReception && ticket.numeroGiro ? (
            <div className="flex items-center gap-1 text-stone-700" title="Número de Giro">
              <Truck className="w-3 h-3 text-stone-500" />
              <span className="font-mono text-xs font-bold text-stone-800">Giro: {ticket.numeroGiro}</span>
            </div>
          ) : ticket.grua ? (
            <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
              Grúa: {ticket.grua}
            </span>
          ) : null}
        </div>

        {/* Bottom Product Banner */}
        <div className="mt-1 flex items-center justify-between bg-stone-100 rounded px-2 py-1 border border-stone-200">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Package className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />
            <span className="text-xs font-bold font-mono text-stone-800 truncate" title={ticket.codigoProducto}>
              {ticket.codigoProducto || ticket.especie || 'PRODUCTO'}
            </span>
          </div>

          {ticket.volumenMR && (
            <div className="flex items-center gap-1 pl-2 text-stone-700 font-mono text-[11px] flex-shrink-0">
              <span className="font-extrabold text-[#D37608]">{ticket.volumenMR}</span>
              <span className="text-[10px] text-stone-500 font-bold">MR</span>
            </div>
          )}
        </div>

        {/* Action quick buttons on footer */}
        <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${tagBg}`}>
              {isReception ? 'Recepción' : 'Despacho'}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Botón para Cerrar Evento / Enviar al Panel General */}
            {!isClosed && onCloseTicket && (
              <button
                id={`btn-close-ticket-${ticket.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTicket(ticket.id);
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10.5px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                title="Cerrar ticket de la ventana activa y enviarlo al Panel General"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Cerrar</span>
              </button>
            )}

            {isClosed && onReopenTicket && (
              <button
                id={`btn-reopen-ticket-${ticket.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReopenTicket(ticket.id);
                }}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10.5px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                title="Reabrir ticket a la ventana activa"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reabrir</span>
              </button>
            )}

            {onPrint && (
              <button
                id={`btn-print-ticket-${ticket.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint(ticket);
                }}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                title="Imprimir ticket térmico CITIZEN CT-S4000 (≤ 8cm)"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id={`btn-edit-ticket-${ticket.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(ticket);
              }}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Ver y editar evento"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-ticket-${ticket.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ticket.id);
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
              title="Eliminar evento permanentemente"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
