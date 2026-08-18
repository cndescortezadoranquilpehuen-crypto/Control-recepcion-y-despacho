import React from 'react';
import { Clock, Calendar, Truck, Package, Edit3, Trash2, Tag, Printer, FileText } from 'lucide-react';
import { TicketItem } from '../types';

interface TicketCardProps {
  ticket: TicketItem;
  onOpenEdit: (ticket: TicketItem) => void;
  onDelete: (id: string) => void;
  onPrintThermal?: (ticket: TicketItem) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onOpenEdit,
  onDelete,
  onPrintThermal
}) => {
  const isReception = ticket.tipo === 'recepcion';
  const accentBorderColor = isReception ? 'bg-[#1e3a8a]' : 'bg-[#D37608]';
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

  return (
    <div
      id={`ticket-card-${ticket.id}`}
      onClick={() => onOpenEdit(ticket)}
      className="group relative bg-white border border-stone-200 rounded-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer hover:border-stone-400"
    >
      {/* Left colored bar accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${accentBorderColor}`} />

      {/* Card Content with left padding to offset accent bar */}
      <div className="pl-6 pr-4 pt-3.5 pb-3 flex-1 flex flex-col justify-between">
        
        {/* Top Header: Patente(Sigla) & Guías N° (Prominente) */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-2 mb-2">
          <div>
            <span className="text-sm font-extrabold text-stone-900 tracking-wide">
              {ticket.patenteCamion || 'SIN PATENTE'}{ticket.siglaCamion ? `(${ticket.siglaCamion})` : ''}
            </span>
            {ticket.patenteCarro && (
              <span className="block text-[10px] text-stone-500 font-mono">
                Carro: {ticket.patenteCarro}
              </span>
            )}
          </div>
          <div className="text-right bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
            <span className="text-[9px] uppercase font-bold text-amber-900 block leading-tight flex items-center gap-1 justify-end">
              <FileText className="w-2.5 h-2.5 text-[#D37608]" />
              GUÍAS Nº:
            </span>
            <span className="text-xs font-black text-stone-900 font-mono tracking-wider">
              {ticket.numeroGuia || 'S/N'}
            </span>
          </div>
        </div>

        {/* Transportista & Route */}
        <div className="space-y-1 my-1">
          <p className="text-xs font-bold text-stone-800 uppercase tracking-tight truncate" title={ticket.transportista}>
            {ticket.transportista || 'TRANSPORTISTA NO ESPECIFICADO'}
          </p>
          
          <div className="text-[11px] text-stone-600 space-y-0.5">
            <p className="truncate">
              <span className="font-semibold text-stone-700">ORIGEN:</span> {ticket.origen || '(Sin origen especificado)'}
            </p>
            <p className="truncate">
              <span className="font-semibold text-stone-700">DESTINO:</span> <strong className="text-stone-900">{ticket.destino || 'N048 CN RANQUIL'}</strong>
            </p>
            {ticket.nombreConductor && (
              <p className="truncate text-stone-500 text-[10px]">
                <span className="font-semibold text-stone-600">CONDUCTOR:</span> {ticket.nombreConductor}
              </p>
            )}
          </div>
        </div>

        {/* Meta Info: Hora, Fecha, Giro */}
        <div className="flex items-center justify-between text-[11px] text-stone-600 pt-2 border-t border-stone-100 my-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-mono text-xs">{ticket.hora || '08:00'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-mono text-xs">{formatDateDisplay(ticket.fechaPrograma)}</span>
          </div>

          <div className="flex items-center gap-1 text-stone-700" title="Número de Giro o Sigla">
            <Truck className="w-3.5 h-3.5 text-stone-600" />
            <span className="font-mono text-xs font-medium">{ticket.numeroGiro || ticket.siglaCamion || '1004000'}</span>
          </div>
        </div>

        {/* Bottom Product Banner */}
        <div className="mt-1 flex items-center justify-between bg-stone-100/90 rounded px-2.5 py-1.5 border border-stone-200">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Package className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />
            <span className="text-xs font-bold font-mono text-stone-800 truncate" title={ticket.codigoProducto}>
              {ticket.codigoProducto || ticket.especie || 'PRODUCTO'}
            </span>
          </div>

          {ticket.volumenMR && (
            <div className="flex items-center gap-1 pl-2 text-stone-700 font-mono text-[11px] flex-shrink-0">
              <span className="font-extrabold text-[#D37608]">{ticket.volumenMR}</span>
              <span className="text-[10px] text-stone-500">MR</span>
            </div>
          )}
        </div>

        {/* Action quick buttons on hover */}
        <div className="mt-2 pt-1 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${tagBg}`}>
            {isReception ? 'Recepción' : 'Despacho'}
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {onPrintThermal && (
              <button
                id={`btn-print-ticket-${ticket.id}`}
                onClick={() => onPrintThermal(ticket)}
                className="p-1 text-[#676057] hover:text-[#BCB703] hover:bg-stone-100 rounded"
                title="Imprimir ticket en impresora térmica CITIZEN CT-S4000 (≤ 8cm)"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id={`btn-edit-ticket-${ticket.id}`}
              onClick={() => onOpenEdit(ticket)}
              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
              title="Ver y editar evento"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-ticket-${ticket.id}`}
              onClick={() => onDelete(ticket.id)}
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
              title="Eliminar evento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
