import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Truck, 
  User, 
  TreePine, 
  Calendar, 
  Clock, 
  FileText, 
  MapPin, 
  Printer,
  ChevronDown,
  Calculator
} from 'lucide-react';
import { ConductorItem, PatenteItem, ProductoItem, TicketItem, TicketType } from '../types';
import { StorageService } from '../services/storageService';
import { CubicacionModal } from './CubicacionModal';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit: TicketItem | null;
  defaultType: TicketType;
  onSave: (ticket: TicketItem) => void;
  onDelete: (id: string) => void;
  onPrintThermal?: (ticket: TicketItem) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  ticketToEdit,
  defaultType,
  onSave,
  onDelete,
  onPrintThermal
}) => {
  if (!isOpen) return null;

  // Databases
  const [patentesDb, setPatentesDb] = useState<PatenteItem[]>([]);
  const [conductoresDb, setConductoresDb] = useState<ConductorItem[]>([]);
  const [productosDb, setProductosDb] = useState<ProductoItem[]>([]);

  // Form State
  const [tipo, setTipo] = useState<TicketType>(ticketToEdit ? ticketToEdit.tipo : defaultType);
  const isReception = tipo === 'recepcion';

  // Guide Number (Important required field)
  const [numeroGuia, setNumeroGuia] = useState(ticketToEdit?.numeroGuia || '');
  const [fechaPrograma, setFechaPrograma] = useState(ticketToEdit?.fechaPrograma || new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(ticketToEdit?.hora || new Date().toTimeString().slice(0, 5));
  
  // Truck data
  const [patenteCamion, setPatenteCamion] = useState(ticketToEdit?.patenteCamion || '');
  const [siglaCamion, setSiglaCamion] = useState(ticketToEdit?.siglaCamion || '');
  const [patenteCarro, setPatenteCarro] = useState(ticketToEdit?.patenteCarro || '');
  const [transportista, setTransportista] = useState(ticketToEdit?.transportista || '');

  // Driver data
  const [rutConductor, setRutConductor] = useState(ticketToEdit?.rutConductor || '');
  const [nombreConductor, setNombreConductor] = useState(ticketToEdit?.nombreConductor || '');

  // Product data
  const [especie, setEspecie] = useState(ticketToEdit?.especie || 'PINO RADIATA');
  const [codigoProducto, setCodigoProducto] = useState(ticketToEdit?.codigoProducto || '');
  const [largo, setLargo] = useState(ticketToEdit?.largo || '');
  const [fechaCorta, setFechaCorta] = useState(ticketToEdit?.fechaCorta || new Date().toISOString().slice(0, 10));
  const [anoPlantacion, setAnoPlantacion] = useState(ticketToEdit?.anoPlantacion || '2010');
  
  // Volumen MR and Cubicacion
  const [volumenMR, setVolumenMR] = useState(ticketToEdit?.volumenMR || '');
  const [isCubicacionOpen, setIsCubicacionOpen] = useState(false);

  // Location & Logistics setup based on ticket type:
  // Recepcion:
  //   - Origen: Manual (empty by default)
  //   - Destino: 'N048 CN RANQUIL' | 'N817 CN DESCORTEZADO RANQUIL'
  // Despacho:
  //   - Origen: 2 options ('N048 CN RANQUIL' | 'N817 CN DESCORTEZADO RANQUIL')
  //   - Destino: 3 options ('N011 CP NUEVA ALDEA [N011]' | 'N048 CN RANQUIL' | 'N817 CN DESCORTEZADO RANQUIL')
  const [origen, setOrigen] = useState(
    ticketToEdit 
      ? ticketToEdit.origen 
      : (isReception ? '' : 'N048 CN RANQUIL')
  );
  const [destino, setDestino] = useState(
    ticketToEdit 
      ? ticketToEdit.destino 
      : (isReception ? 'N048 CN RANQUIL' : 'N011 CP NUEVA ALDEA [N011]')
  );

  const [emseforDespacho, setEmseforDespacho] = useState(ticketToEdit?.emseforDespacho || '');
  const [numeroGiro, setNumeroGiro] = useState(ticketToEdit?.numeroGiro || '');
  // Grúa: Dejar vacío para que el usuario lo complete manualmente
  const [grua, setGrua] = useState(ticketToEdit?.grua || '');
  const [observaciones, setObservaciones] = useState(ticketToEdit?.observaciones || '');

  // Autocomplete UI suggestions
  const [showPatenteSuggestions, setShowPatenteSuggestions] = useState(false);
  const [showRutSuggestions, setShowRutSuggestions] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);

  // Load databases on mount and on modal open, syncing in real-time
  useEffect(() => {
    const updateFromStorage = () => {
      setPatentesDb(StorageService.getPatentes());
      setConductoresDb(StorageService.getConductores());
      setProductosDb(StorageService.getProductos());
    };
    updateFromStorage();

    const unsubscribe = StorageService.subscribe(updateFromStorage);
    StorageService.syncWithFirestore();

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Filter conductors strictly by the current transportista
  const availableConductores = useMemo(() => {
    if (!transportista) return conductoresDb;
    const cleanTransp = transportista.trim().toUpperCase();
    const filtered = conductoresDb.filter(c => c.transportista && c.transportista.trim().toUpperCase() === cleanTransp);
    return filtered.length > 0 ? filtered : conductoresDb;
  }, [conductoresDb, transportista]);

  // Filtered patentes for real-time search & dropdown
  const filteredPatentes = useMemo(() => {
    const query = patenteCamion.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!query) return [];
    return patentesDb.filter(p => {
      const pCamion = (p.patenteCamion || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const pSigla = (p.siglaCamion || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const pTransp = (p.transportista || '').toUpperCase();
      return pCamion.includes(query) || pSigla.includes(query) || pTransp.includes(query);
    }).slice(0, 15);
  }, [patentesDb, patenteCamion]);

  // Filtered conductors for real-time search & dropdown
  const filteredConductores = useMemo(() => {
    const query = rutConductor.trim().toUpperCase().replace(/[^0-9Kk]/g, '');
    if (!query) return [];
    return availableConductores.filter(c => {
      const cRut = (c.rutConductor || '').toUpperCase().replace(/[^0-9Kk]/g, '');
      const cNom = (c.nombreConductor || '').toUpperCase();
      return cRut.includes(query) || cNom.includes(query);
    }).slice(0, 15);
  }, [availableConductores, rutConductor]);

  // Filter products by selected species
  const speciesProducts = useMemo(() => {
    if (!especie) return productosDb;
    return productosDb.filter(p => p.especie.toUpperCase() === especie.toUpperCase());
  }, [productosDb, especie]);

  // Live filter products as the user types the code
  const filteredProductsByTyping = useMemo(() => {
    if (!codigoProducto.trim()) return speciesProducts;
    const cleanQuery = codigoProducto.trim().toUpperCase();
    return speciesProducts.filter(p => p.codigoProducto.toUpperCase().includes(cleanQuery));
  }, [speciesProducts, codigoProducto]);

  // When Patente Camion is typed or selected:
  const handlePatenteChange = (inputVal: string) => {
    const val = inputVal.toUpperCase();
    setPatenteCamion(val);
    
    const cleanInput = val.trim().replace(/[^A-Z0-9]/g, '');
    const match = patentesDb.find(p => {
      const pClean = (p.patenteCamion || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return pClean === cleanInput;
    });

    if (match) {
      setSiglaCamion(match.siglaCamion || match.patenteCamion);
      setTransportista(match.transportista || 'GENERAL');
      if (!patenteCarro && match.patenteCarro) {
        setPatenteCarro(match.patenteCarro);
      }
      const driverBelongs = conductoresDb.some(c => 
        c.rutConductor.toUpperCase() === rutConductor.toUpperCase() && 
        c.transportista.toUpperCase() === match.transportista.toUpperCase()
      );
      if (!driverBelongs && rutConductor) {
        setRutConductor('');
        setNombreConductor('');
      }
    }
  };

  const selectPatente = (item: PatenteItem) => {
    setPatenteCamion(item.patenteCamion);
    setSiglaCamion(item.siglaCamion || item.patenteCamion);
    setTransportista(item.transportista || 'GENERAL');
    setPatenteCarro(item.patenteCarro || '');
    setShowPatenteSuggestions(false);
  };

  // When RUT Conductor is typed or selected:
  const handleRutChange = (inputVal: string) => {
    const val = inputVal.toUpperCase();
    setRutConductor(val);

    const cleanInput = val.trim().replace(/[^0-9Kk]/g, '');
    const match = availableConductores.find(c => {
      const cClean = (c.rutConductor || '').toUpperCase().replace(/[^0-9Kk]/g, '');
      return cClean === cleanInput;
    });

    if (match) {
      setNombreConductor(match.nombreConductor);
    }
  };

  const selectConductor = (item: ConductorItem) => {
    setRutConductor(item.rutConductor);
    setNombreConductor(item.nombreConductor);
    setShowRutSuggestions(false);
  };

  // When Especie changes:
  const handleEspecieChange = (newEspecie: string) => {
    setEspecie(newEspecie);
    const matching = productosDb.filter(p => p.especie.toUpperCase() === newEspecie.toUpperCase());
    if (matching.length > 0) {
      setCodigoProducto(matching[0].codigoProducto);
      setLargo(matching[0].largo);
    } else {
      setCodigoProducto('');
      setLargo('');
    }
  };

  // When Codigo Producto is typed:
  const handleProductTyping = (typedCode: string) => {
    const upper = typedCode.toUpperCase();
    setCodigoProducto(upper);
    setShowProductDropdown(true);

    const exactMatch = speciesProducts.find(p => p.codigoProducto.toUpperCase() === upper);
    if (exactMatch) {
      setLargo(exactMatch.largo);
    }
  };

  const selectProduct = (p: ProductoItem) => {
    setCodigoProducto(p.codigoProducto);
    setLargo(p.largo);
    setShowProductDropdown(false);
  };

  // Handle Cubicacion calculated result
  const handleApplyCubicacion = (calculatedMR: string, detail?: string) => {
    setVolumenMR(calculatedMR);
    if (detail && !observaciones) {
      setObservaciones(detail);
    }
  };

  // When switching Ticket Type:
  const handleTypeChange = (newT: TicketType) => {
    setTipo(newT);
    if (newT === 'recepcion') {
      setOrigen('');
      setDestino('N048 CN RANQUIL');
    } else {
      setOrigen('N048 CN RANQUIL');
      setDestino('N011 CP NUEVA ALDEA [N011]');
    }
  };

  // Submit & Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroGuia.trim()) {
      alert('Por favor ingrese el NÚMERO DE GUÍA (campo obligatorio).');
      return;
    }

    if (!patenteCamion.trim()) {
      alert('Por favor ingrese la PATENTE DEL CAMIÓN.');
      return;
    }

    const ticketData: TicketItem = {
      id: ticketToEdit ? ticketToEdit.id : `t-${Date.now()}`,
      tipo,
      numeroGuia: numeroGuia.trim(),
      fechaPrograma,
      hora,
      patenteCamion: patenteCamion.trim().toUpperCase(),
      siglaCamion: siglaCamion.trim().toUpperCase(),
      patenteCarro: patenteCarro.trim().toUpperCase(),
      transportista: transportista.trim().toUpperCase() || 'TRANSPORTES GENERAL',
      rutConductor: rutConductor.trim().toUpperCase(),
      nombreConductor: nombreConductor.trim().toUpperCase(),
      especie,
      codigoProducto: codigoProducto || 'P0265RRCCAL1',
      largo: String(largo || '2.65'),
      fechaCorta,
      anoPlantacion: String(anoPlantacion || '2010'),
      volumenMR: String(volumenMR || '0.0'),
      origen: origen.trim(),
      destino: destino.trim(),
      zonaForestal: '',
      emseforDespacho: emseforDespacho.trim() || transportista,
      numeroGiro: numeroGiro.trim(),
      grua: grua.trim(),
      observaciones: observaciones.trim(),
      createdAt: ticketToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(ticketData);
    onClose();
  };

  const handleDelete = () => {
    if (!ticketToEdit) return;
    if (window.confirm('¿Está seguro de que desea eliminar este evento definitivamente?')) {
      onDelete(ticketToEdit.id);
      onClose();
    }
  };

  const handlePrintClick = () => {
    if (onPrintThermal) {
      const currentTicket: TicketItem = {
        id: ticketToEdit ? ticketToEdit.id : `t-${Date.now()}`,
        tipo,
        numeroGuia: numeroGuia.trim() || 'S/N',
        fechaPrograma,
        hora,
        patenteCamion: patenteCamion.trim().toUpperCase(),
        siglaCamion: siglaCamion.trim().toUpperCase(),
        patenteCarro: patenteCarro.trim().toUpperCase(),
        transportista: transportista.trim().toUpperCase() || 'GENERAL',
        rutConductor: rutConductor.trim().toUpperCase(),
        nombreConductor: nombreConductor.trim().toUpperCase(),
        especie,
        codigoProducto: codigoProducto || 'P0265RRCCAL1',
        largo: String(largo || '2.65'),
        fechaCorta,
        anoPlantacion: String(anoPlantacion || '2010'),
        volumenMR: String(volumenMR || '0'),
        origen: origen.trim(),
        destino: destino.trim(),
        zonaForestal: '',
        emseforDespacho: emseforDespacho.trim(),
        numeroGiro: numeroGiro.trim(),
        grua: grua.trim(),
        observaciones: observaciones.trim(),
        createdAt: ticketToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onPrintThermal(currentTicket);
    }
  };

  return (
    <>
      <div 
        id="modal-ticket-backdrop"
        className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          id="modal-ticket-content"
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border border-stone-300 overflow-hidden flex flex-col my-6 max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className={`px-6 py-4 flex items-center justify-between text-white ${
            tipo === 'recepcion' ? 'bg-[#35322f] border-b-4 border-[#1e3a8a]' : 'bg-[#35322f] border-b-4 border-[#D37608]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${tipo === 'recepcion' ? 'bg-[#1e3a8a]' : 'bg-[#D37608]'}`}>
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider text-[#F2EDC9]">
                  {ticketToEdit ? 'Editar Evento de Guía' : `Nuevo Evento de ${tipo === 'recepcion' ? 'Recepción' : 'Despacho'}`}
                </h2>
                <p className="text-xs text-neutral-300">
                  {tipo === 'recepcion' ? 'Control de entrada a CN Ranquil / Descortezado' : 'Control de salida y despacho de camión'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onPrintThermal && (
                <button
                  type="button"
                  id="btn-modal-print"
                  onClick={handlePrintClick}
                  className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Imprimir ticket térmico en CITIZEN CT-S4000 (≤ 8cm)"
                >
                  <Printer className="w-3.5 h-3.5 text-[#BCB703]" />
                  <span className="hidden sm:inline">Ticket Térmico (8cm)</span>
                </button>
              )}

              <button
                id="btn-close-modal"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fcfcfb]">
            
            {/* Top Section: NÚMERO DE GUÍA & Tipo / Fecha / Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50/70 rounded border-2 border-amber-200 shadow-2xs">
              {/* NÚMERO DE GUÍA */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-black uppercase text-amber-950 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#D37608]" />
                  <span>NÚMERO DE GUÍA</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  id="input-ticket-guia"
                  type="text"
                  required
                  placeholder="Ej: 10075160"
                  value={numeroGuia}
                  onChange={(e) => setNumeroGuia(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-white border-2 border-[#D37608] rounded focus:ring-2 focus:ring-[#D37608]/40 outline-none font-mono font-black text-stone-900 shadow-xs"
                />
              </div>

              {/* Tipo de Ticket */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  id="select-ticket-tipo"
                  value={tipo}
                  onChange={(e) => handleTypeChange(e.target.value as TicketType)}
                  className="w-full h-9 px-2 text-xs font-bold bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                >
                  <option value="recepcion">RECEPCIÓN DE CAMIÓN</option>
                  <option value="despacho">DESPACHO DE CAMIÓN</option>
                </select>
              </div>

              {/* Fecha Programa */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Fecha Programa
                </label>
                <input
                  id="input-ticket-fecha"
                  type="date"
                  value={fechaPrograma}
                  onChange={(e) => setFechaPrograma(e.target.value)}
                  className="w-full h-9 px-2 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Hora Registro
                </label>
                <input
                  id="input-ticket-hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full h-9 px-2 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                />
              </div>
            </div>

            {/* Section 1: DATOS DEL CAMIÓN Y TRANSPORTISTA */}
            <div className="border border-stone-200 rounded p-4 bg-white shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100 text-[#676057]">
                <Truck className="w-4 h-4 text-[#BCB703]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  1. Datos de Patente y Transporte (Búsqueda Automática)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Patente Camion */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Patente Camión <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="input-ticket-patente"
                    type="text"
                    placeholder="Ej: RRFG94"
                    value={patenteCamion}
                    onFocus={() => setShowPatenteSuggestions(true)}
                    onChange={(e) => {
                      handlePatenteChange(e.target.value);
                      setShowPatenteSuggestions(true);
                    }}
                    className="w-full h-9 px-2.5 text-xs font-bold uppercase bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none"
                    required
                  />
                  
                  {showPatenteSuggestions && patenteCamion && filteredPatentes.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded shadow-lg z-30 max-h-48 overflow-y-auto">
                      {filteredPatentes.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectPatente(p)}
                          className="px-3 py-2 text-xs hover:bg-stone-100 cursor-pointer border-b border-stone-100 flex justify-between items-center"
                        >
                          <span className="font-bold text-stone-900">{p.patenteCamion} ({p.siglaCamion})</span>
                          <span className="text-[10px] text-stone-500 truncate max-w-[140px]">{p.transportista}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sigla Camion */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Sigla Camión (Auto)
                  </label>
                  <input
                    id="input-ticket-sigla"
                    type="text"
                    placeholder="LL115"
                    value={siglaCamion}
                    onChange={(e) => setSiglaCamion(e.target.value.toUpperCase())}
                    className="w-full h-9 px-2.5 text-xs bg-stone-100 font-bold border border-stone-300 rounded text-stone-800 focus:bg-white outline-none"
                  />
                </div>

                {/* Patente Carro */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Patente Carro (Manual)
                  </label>
                  <input
                    id="input-ticket-carro"
                    type="text"
                    placeholder="Ej: PWWX23"
                    value={patenteCarro}
                    onChange={(e) => setPatenteCarro(e.target.value.toUpperCase())}
                    className="w-full h-9 px-2.5 text-xs uppercase bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />
                </div>

                {/* Transportista */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Transportista (Auto)
                  </label>
                  <input
                    id="input-ticket-transportista"
                    type="text"
                    placeholder="Empresa de transporte..."
                    value={transportista}
                    onChange={(e) => setTransportista(e.target.value.toUpperCase())}
                    className="w-full h-9 px-2.5 text-xs font-semibold bg-stone-100 border border-stone-300 rounded text-stone-800 focus:bg-white outline-none truncate"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: CONDUCTOR */}
            <div className="border border-stone-200 rounded p-4 bg-white shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 text-[#676057]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#BCB703]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    2. Conductor (Filtrado exclusivo por Transportista: <span className="text-[#D37608]">{transportista || 'Todos'}</span>)
                  </h3>
                </div>
                <span className="text-[10px] text-stone-500">
                  {availableConductores.length} conductores disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RUT Conductor */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    RUT Conductor
                  </label>
                  <input
                    id="input-ticket-rut-conductor"
                    type="text"
                    placeholder="Ej: 16013391-0"
                    value={rutConductor}
                    onFocus={() => setShowRutSuggestions(true)}
                    onChange={(e) => {
                      handleRutChange(e.target.value);
                      setShowRutSuggestions(true);
                    }}
                    className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />

                  {showRutSuggestions && rutConductor && filteredConductores.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded shadow-lg z-30 max-h-48 overflow-y-auto">
                      {filteredConductores.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectConductor(c)}
                          className="px-3 py-2 text-xs hover:bg-stone-100 cursor-pointer border-b border-stone-100 flex justify-between items-center"
                        >
                          <span className="font-mono font-bold text-stone-900">{c.rutConductor}</span>
                          <span className="text-stone-700 truncate max-w-[200px]">{c.nombreConductor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nombre Conductor */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Nombre Conductor (Auto)
                  </label>
                  <input
                    id="input-ticket-nombre-conductor"
                    type="text"
                    placeholder="Nombre completo del conductor..."
                    value={nombreConductor}
                    onChange={(e) => setNombreConductor(e.target.value.toUpperCase())}
                    className="w-full h-9 px-2.5 text-xs font-semibold bg-stone-100 border border-stone-300 rounded text-stone-800 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: ESPECIE, CÓDIGO PRODUCTO, MEDIDAS Y CUBICACIÓN */}
            <div className="border border-stone-200 rounded p-4 bg-white shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100 text-[#676057]">
                <TreePine className="w-4 h-4 text-[#BCB703]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  3. Especie, Código de Producto y Cubicación de Volumen
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {/* Especie Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Especie Forestal
                  </label>
                  <select
                    id="select-ticket-especie"
                    value={especie}
                    onChange={(e) => handleEspecieChange(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs font-bold bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none text-stone-800"
                  >
                    <option value="PINO RADIATA">PINO RADIATA</option>
                    <option value="EUCALIPTUS GLOBULUS">EUCALIPTUS GLOBULUS</option>
                    <option value="EUCALIPTUS NITENS">EUCALIPTUS NITENS</option>
                  </select>
                </div>

                {/* Codigo Producto - Dynamic search */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1 flex items-center justify-between">
                    <span>Código Producto</span>
                    <span className="text-[10px] font-normal text-stone-500 font-mono">
                      {filteredProductsByTyping.length} coincidentes
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      ref={productInputRef}
                      id="input-ticket-codigo-producto"
                      type="text"
                      placeholder="Escribe código (ej: P0265, E0350)..."
                      value={codigoProducto}
                      onFocus={() => setShowProductDropdown(true)}
                      onChange={(e) => handleProductTyping(e.target.value)}
                      className="w-full h-9 px-2.5 pr-8 text-xs font-mono font-bold uppercase bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {showProductDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded shadow-xl z-30 max-h-52 overflow-y-auto">
                      {filteredProductsByTyping.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-stone-400 text-center">
                          No hay códigos para "{codigoProducto}" en {especie}
                        </div>
                      ) : (
                        filteredProductsByTyping.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectProduct(p)}
                            className="px-3 py-2 text-xs hover:bg-amber-50 cursor-pointer border-b border-stone-100 flex justify-between items-center"
                          >
                            <span className="font-mono font-bold text-stone-900">{p.codigoProducto}</span>
                            <span className="text-stone-500 font-mono text-[11px]">Largo: {p.largo}m</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Largo */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Largo (metros)
                  </label>
                  <input
                    id="input-ticket-largo"
                    type="text"
                    placeholder="Ej: 2.65"
                    value={largo}
                    onChange={(e) => setLargo(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs font-mono font-bold bg-stone-100 border border-stone-300 rounded text-stone-800 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Manual Fields: Fecha Corta, Año Plantación and VOLUMEN MR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Fecha de Corta (Manual)
                  </label>
                  <input
                    id="input-ticket-fecha-corta"
                    type="date"
                    value={fechaCorta}
                    onChange={(e) => setFechaCorta(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Año Plantación (Manual)
                  </label>
                  <input
                    id="input-ticket-ano-plantacion"
                    type="number"
                    placeholder="Ej: 2008"
                    min="1970"
                    max="2030"
                    value={anoPlantacion}
                    onChange={(e) => setAnoPlantacion(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />
                </div>

                {/* VOLUMEN MR - Directo o Botón Cubicar */}
                <div className="bg-amber-50/70 p-2 rounded border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black uppercase text-[#D37608] flex items-center gap-1">
                      <span>VOLUMEN MR</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    
                    <button
                      type="button"
                      id="btn-abrir-cubicar"
                      onClick={() => setIsCubicacionOpen(true)}
                      className="px-2 py-0.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-2xs transition-colors"
                      title="Abrir calculadora de cubicación por bancos (Lado A y B)"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>📐 Cubicar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="input-ticket-volumen-mr"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 19.54"
                        value={volumenMR}
                        onChange={(e) => setVolumenMR(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono font-black bg-white border-2 border-[#D37608] rounded focus:border-[#D37608] outline-none text-stone-900"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                        MR
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCubicacionOpen(true)}
                      className="h-8 px-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-xs flex items-center justify-center font-bold"
                      title="Calcular cubicación"
                    >
                      <Calculator className="w-4 h-4 text-[#676057]" />
                    </button>
                  </div>
                  <span className="text-[9px] text-stone-500 block mt-0.5">
                    Ingresa directo o presiona <strong>Cubicar</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: ORIGEN Y DESTINO (CONFIGURADO POR TIPO), N° GIRO Y GRÚA (VACÍA) */}
            <div className="border border-stone-200 rounded p-4 bg-white shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100 text-[#676057]">
                <MapPin className="w-4 h-4 text-[#BCB703]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  4. Origen, Destino y Logística de Patio
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Origen:
                    - Recepcion: En blanco para ingreso manual
                    - Despacho: 2 opciones (N048 CN RANQUIL y N817 CN DESCORTEZADO RANQUIL)
                */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Origen {isReception ? '(Ingreso Manual)' : '(Seleccionar)'}
                  </label>
                  {isReception ? (
                    <input
                      id="input-ticket-origen"
                      type="text"
                      placeholder="Ingrese predio o bosque de origen..."
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                    />
                  ) : (
                    <select
                      id="select-ticket-origen-despacho"
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="w-full h-8 px-2 text-xs font-bold bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none text-stone-800"
                    >
                      <option value="N048 CN RANQUIL">N048 CN RANQUIL</option>
                      <option value="N817 CN DESCORTEZADO RANQUIL">N817 CN DESCORTEZADO RANQUIL</option>
                    </select>
                  )}
                </div>

                {/* Destino:
                    - Recepcion: 2 opciones (N048 CN RANQUIL y N817 CN DESCORTEZADO RANQUIL)
                    - Despacho: 3 opciones (N011 CP NUEVA ALDEA [N011], N048 CN RANQUIL, N817 CN DESCORTEZADO RANQUIL)
                */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Destino (Seleccionar)
                  </label>
                  {isReception ? (
                    <select
                      id="select-ticket-destino-recepcion"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full h-8 px-2 text-xs font-bold bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none text-stone-800"
                    >
                      <option value="N048 CN RANQUIL">N048 CN RANQUIL</option>
                      <option value="N817 CN DESCORTEZADO RANQUIL">N817 CN DESCORTEZADO RANQUIL</option>
                    </select>
                  ) : (
                    <select
                      id="select-ticket-destino-despacho"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full h-8 px-2 text-xs font-bold bg-white border-2 border-stone-300 rounded focus:border-[#BCB703] outline-none text-stone-800"
                    >
                      <option value="N011 CP NUEVA ALDEA [N011]">N011 CP NUEVA ALDEA [N011]</option>
                      <option value="N048 CN RANQUIL">N048 CN RANQUIL</option>
                      <option value="N817 CN DESCORTEZADO RANQUIL">N817 CN DESCORTEZADO RANQUIL</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Número de Giro
                  </label>
                  <input
                    id="input-ticket-numero-giro"
                    type="text"
                    placeholder="Ej: 1005597"
                    value={numeroGiro}
                    onChange={(e) => setNumeroGiro(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />
                </div>

                {/* Identificador Grúa: Dejado en blanco para llenado manual por el usuario */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Identificador Grúa
                  </label>
                  <input
                    id="input-ticket-grua"
                    type="text"
                    placeholder="Completar grúa (ej: GRU-01)..."
                    value={grua}
                    onChange={(e) => setGrua(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Observaciones / Detalle Cubicación
                </label>
                <input
                  id="input-ticket-observaciones"
                  type="text"
                  placeholder="Observaciones de recepción o detalle de cálculo de cubicación..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
                />
              </div>
            </div>
          </form>

          {/* Modal Footer Actions */}
          <div className="px-6 py-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {ticketToEdit && (
                <button
                  type="button"
                  id="btn-eliminar-evento"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Evento</span>
                </button>
              )}

              {ticketToEdit && onPrintThermal && (
                <button
                  type="button"
                  onClick={handlePrintClick}
                  className="px-3.5 py-2 bg-[#676057] hover:bg-[#524d46] text-[#F2EDC9] rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-[#BCB703]" />
                  <span>Imprimir Ticket (≤ 8cm)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-cancelar-modal"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="btn-guardar-evento"
                onClick={handleSave}
                className="px-6 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 rounded text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Evento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cubicacion Modal */}
      <CubicacionModal
        isOpen={isCubicacionOpen}
        onClose={() => setIsCubicacionOpen(false)}
        largoMadera={largo || '2.44'}
        onApplyVolumen={handleApplyCubicacion}
      />
    </>
  );
};
