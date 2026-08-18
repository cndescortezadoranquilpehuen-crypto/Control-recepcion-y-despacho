import React from 'react';
import { TicketItem } from '../types';
import { Printer, X, Check, Scissors } from 'lucide-react';

interface ThermalReceiptModalProps {
  ticket: TicketItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  ticket,
  isOpen,
  onClose
}) => {
  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReception = ticket.tipo === 'recepcion';

  return (
    <div 
      id="receipt-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="receipt-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded shadow-2xl border border-stone-300 max-w-md w-full overflow-hidden"
      >
        {/* Header Preview Controls */}
        <div className="bg-[#35322f] px-4 py-3 text-white flex items-center justify-between border-b border-[#BCB703]">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#BCB703]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F2EDC9]">
              Impresión Térmica (CITIZEN CT-S4000)
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper visual preview (Width 80mm, Max height 80mm ~ 8cm) */}
        <div className="p-6 bg-stone-100 flex flex-col items-center justify-center">
          <div className="text-[11px] text-stone-500 mb-2 font-mono">
            Formato compacto ≤ 8 cm (80mm x 80mm)
          </div>

          {/* Printable Container */}
          <div 
            id="thermal-printable-ticket"
            className="w-[76mm] bg-white border border-stone-300 shadow-md p-3 font-mono text-[10px] leading-tight text-black print:border-none print:shadow-none print:w-[76mm] print:p-1"
            style={{ maxHeight: '80mm' }}
          >
            {/* Header */}
            <div className="text-center pb-1 border-b border-dashed border-black">
              <p className="font-extrabold text-[12px] uppercase">
                {isReception ? 'TICKET RECEPCIÓN' : 'TICKET DESPACHO'}
              </p>
              <p className="text-[9px] font-bold">CN RANQUIL - CONTROL FORESTAL</p>
              <p className="text-[9px] font-extrabold tracking-wider mt-0.5">
                GUÍA Nº: <span className="text-[11px] font-black">{ticket.numeroGuia || 'S/N'}</span>
              </p>
            </div>

            {/* Date & Time Row */}
            <div className="flex justify-between py-1 border-b border-dashed border-black text-[9px]">
              <span>FECHA: <strong>{ticket.fechaPrograma}</strong></span>
              <span>HORA: <strong>{ticket.hora}</strong></span>
            </div>

            {/* Truck & Driver Info */}
            <div className="py-1 space-y-0.5 text-[9px] border-b border-dashed border-black">
              <div className="flex justify-between">
                <span>CAMIÓN: <strong>{ticket.patenteCamion}</strong> {ticket.siglaCamion ? `(${ticket.siglaCamion})` : ''}</span>
                <span>CARRO: <strong>{ticket.patenteCarro || '-'}</strong></span>
              </div>
              <p className="truncate">TRANSP: <strong>{ticket.transportista}</strong></p>
              <p className="truncate">CHOFER: <strong>{ticket.nombreConductor || ticket.rutConductor || '-'}</strong></p>
              {ticket.rutConductor && <p>RUT: <strong>{ticket.rutConductor}</strong></p>}
            </div>

            {/* Product & Volume (Highlighted) */}
            <div className="py-1 space-y-0.5 text-[9px] border-b border-dashed border-black bg-stone-50 print:bg-transparent">
              <p>ESPECIE: <strong>{ticket.especie}</strong></p>
              <div className="flex justify-between">
                <span>COD: <strong>{ticket.codigoProducto}</strong></span>
                <span>LARGO: <strong>{ticket.largo}m</strong></span>
              </div>
              <div className="flex justify-between text-[11px] pt-0.5 font-bold">
                <span>VOLUMEN MR:</span>
                <span className="font-black">{ticket.volumenMR} MR</span>
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="py-1 text-[8.5px] leading-tight border-b border-dashed border-black">
              <p className="truncate">ORIGEN: <strong>{ticket.origen || '-'}</strong></p>
              <p className="truncate">DESTINO: <strong>{ticket.destino || '-'}</strong></p>
              {ticket.numeroGiro && <p>Nº GIRO: <strong>{ticket.numeroGiro}</strong></p>}
            </div>

            {/* Footer cut mark */}
            <div className="pt-1 text-center text-[8px] text-stone-500 print:text-black">
              *** CONTROL DE PATIO ***
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded font-medium"
          >
            Cerrar
          </button>

          <button
            id="btn-trigger-print"
            onClick={handlePrint}
            className="px-5 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-extrabold uppercase tracking-wider rounded shadow flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir en CITIZEN CT-S4000</span>
          </button>
        </div>
      </div>
    </div>
  );
};
