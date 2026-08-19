import React, { useState } from 'react';
import { X, Truck, UserCheck, Trees, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { PatenteItem, ConductorItem, ProductoItem } from '../types';
import { StorageService } from '../services/storageService';

export type MasterType = 'patente' | 'conductor' | 'producto';

interface QuickAddMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MasterType;
  onItemAdded?: (type: MasterType, item: PatenteItem | ConductorItem | ProductoItem) => void;
}

export const QuickAddMasterModal: React.FC<QuickAddMasterModalProps> = ({
  isOpen,
  onClose,
  initialType = 'patente',
  onItemAdded
}) => {
  const [activeType, setActiveType] = useState<MasterType>(initialType);
  const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Form states
  const [patenteForm, setPatenteForm] = useState<PatenteItem>({
    patenteCamion: '',
    siglaCamion: '',
    patenteCarro: '',
    transportista: ''
  });

  const [conductorForm, setConductorForm] = useState<ConductorItem>({
    rutConductor: '',
    nombreConductor: '',
    transportista: ''
  });

  const [productoForm, setProductoForm] = useState<ProductoItem>({
    especie: 'PINO RADIATA',
    codigoProducto: '',
    largo: '2.65'
  });

  if (!isOpen) return null;

  const handlePatenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    const result = StorageService.addPatente(patenteForm);
    if (!result.success) {
      setAlertInfo({ type: 'error', message: result.message });
    } else {
      setAlertInfo({ type: 'success', message: result.message });
      if (onItemAdded) {
        onItemAdded('patente', {
          patenteCamion: patenteForm.patenteCamion.trim().toUpperCase(),
          siglaCamion: (patenteForm.siglaCamion || patenteForm.patenteCamion).trim().toUpperCase(),
          patenteCarro: (patenteForm.patenteCarro || '').trim().toUpperCase(),
          transportista: (patenteForm.transportista || 'GENERAL').trim().toUpperCase()
        });
      }
      // Reset form
      setPatenteForm({ patenteCamion: '', siglaCamion: '', patenteCarro: '', transportista: '' });
      setTimeout(() => {
        onClose();
        setAlertInfo(null);
      }, 1500);
    }
  };

  const handleConductorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    const result = StorageService.addConductor(conductorForm);
    if (!result.success) {
      setAlertInfo({ type: 'error', message: result.message });
    } else {
      setAlertInfo({ type: 'success', message: result.message });
      if (onItemAdded) {
        onItemAdded('conductor', {
          rutConductor: conductorForm.rutConductor.trim().toUpperCase(),
          nombreConductor: conductorForm.nombreConductor.trim().toUpperCase(),
          transportista: (conductorForm.transportista || 'GENERAL').trim().toUpperCase()
        });
      }
      setConductorForm({ rutConductor: '', nombreConductor: '', transportista: '' });
      setTimeout(() => {
        onClose();
        setAlertInfo(null);
      }, 1500);
    }
  };

  const handleProductoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    const result = StorageService.addProducto(productoForm);
    if (!result.success) {
      setAlertInfo({ type: 'error', message: result.message });
    } else {
      setAlertInfo({ type: 'success', message: result.message });
      if (onItemAdded) {
        onItemAdded('producto', {
          especie: productoForm.especie.trim().toUpperCase(),
          codigoProducto: productoForm.codigoProducto.trim().toUpperCase(),
          largo: String(productoForm.largo).trim()
        });
      }
      setProductoForm({ especie: 'PINO RADIATA', codigoProducto: '', largo: '2.65' });
      setTimeout(() => {
        onClose();
        setAlertInfo(null);
      }, 1500);
    }
  };

  return (
    <div id="quick-add-master-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-sm shadow-2xl border border-stone-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#676057] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#BCB703]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F2EDC9]">
              Agregar a la Base de Datos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1 rounded transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/90 p-1 gap-1">
          <button
            id="tab-btn-add-patente"
            onClick={() => { setActiveType('patente'); setAlertInfo(null); }}
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
              activeType === 'patente'
                ? 'bg-white text-stone-900 shadow-xs border-b-2 border-[#BCB703]'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Truck className="w-4 h-4 text-[#D37608]" />
            <span>+ Patente</span>
          </button>

          <button
            id="tab-btn-add-conductor"
            onClick={() => { setActiveType('conductor'); setAlertInfo(null); }}
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
              activeType === 'conductor'
                ? 'bg-white text-stone-900 shadow-xs border-b-2 border-[#BCB703]'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#0284c7]" />
            <span>+ Conductor</span>
          </button>

          <button
            id="tab-btn-add-producto"
            onClick={() => { setActiveType('producto'); setAlertInfo(null); }}
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
              activeType === 'producto'
                ? 'bg-white text-stone-900 shadow-xs border-b-2 border-[#BCB703]'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Trees className="w-4 h-4 text-[#15803d]" />
            <span>+ Producto</span>
          </button>
        </div>

        {/* Dynamic Alert Banner */}
        {alertInfo && (
          <div className={`p-3.5 mx-5 mt-4 rounded border text-xs flex items-start gap-2.5 ${
            alertInfo.type === 'error'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            {alertInfo.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="font-medium leading-relaxed">{alertInfo.message}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          {/* TAB 1: NUEVA PATENTE */}
          {activeType === 'patente' && (
            <form onSubmit={handlePatenteSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Patente Camión *
                  </label>
                  <input
                    id="quick-input-patente-camion"
                    type="text"
                    required
                    placeholder="Ej: RRFG94"
                    value={patenteForm.patenteCamion}
                    onChange={(e) => setPatenteForm({ ...patenteForm, patenteCamion: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Sigla Camión *
                  </label>
                  <input
                    id="quick-input-sigla-camion"
                    type="text"
                    required
                    placeholder="Ej: LL115"
                    value={patenteForm.siglaCamion}
                    onChange={(e) => setPatenteForm({ ...patenteForm, siglaCamion: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Patente Carro (Opcional)
                  </label>
                  <input
                    id="quick-input-patente-carro"
                    type="text"
                    placeholder="Ej: PWWX23"
                    value={patenteForm.patenteCarro}
                    onChange={(e) => setPatenteForm({ ...patenteForm, patenteCarro: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 text-xs font-mono uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Transportista *
                  </label>
                  <input
                    id="quick-input-transportista"
                    type="text"
                    required
                    placeholder="Ej: TRANSPORTES PEHUEN LTDA."
                    value={patenteForm.transportista}
                    onChange={(e) => setPatenteForm({ ...patenteForm, transportista: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 text-xs uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-stone-500 italic">
                * Si la patente ya existe en la base de datos, el sistema notificará inmediatamente para evitar registros duplicados.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-quick-patente"
                  type="submit"
                  className="px-4 py-1.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
                >
                  Guardar Patente
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: NUEVO CONDUCTOR */}
          {activeType === 'conductor' && (
            <form onSubmit={handleConductorSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  RUT Conductor *
                </label>
                <input
                  id="quick-input-rut-conductor"
                  type="text"
                  required
                  placeholder="Ej: 16.013.391-0"
                  value={conductorForm.rutConductor}
                  onChange={(e) => setConductorForm({ ...conductorForm, rutConductor: e.target.value.toUpperCase() })}
                  className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Nombre Completo Conductor *
                </label>
                <input
                  id="quick-input-nombre-conductor"
                  type="text"
                  required
                  placeholder="Ej: JUAN CARLOS PEREZ GOMEZ"
                  value={conductorForm.nombreConductor}
                  onChange={(e) => setConductorForm({ ...conductorForm, nombreConductor: e.target.value.toUpperCase() })}
                  className="w-full h-8 px-2.5 text-xs uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Transportista Asignado *
                </label>
                <input
                  id="quick-input-conductor-transportista"
                  type="text"
                  required
                  placeholder="Ej: SOC. TRANSPORTES LLICO LTDA."
                  value={conductorForm.transportista}
                  onChange={(e) => setConductorForm({ ...conductorForm, transportista: e.target.value.toUpperCase() })}
                  className="w-full h-8 px-2.5 text-xs uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                />
              </div>

              <p className="text-[11px] text-stone-500 italic">
                * Todos los textos se guardan automáticamente en formato mayúsculas.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-quick-conductor"
                  type="submit"
                  className="px-4 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
                >
                  Guardar Conductor
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NUEVO PRODUCTO */}
          {activeType === 'producto' && (
            <form onSubmit={handleProductoSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Especie Forestal *
                </label>
                <select
                  id="quick-select-especie"
                  value={productoForm.especie}
                  onChange={(e) => setProductoForm({ ...productoForm, especie: e.target.value })}
                  className="w-full h-8 px-2 text-xs uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none bg-white"
                >
                  <option value="PINO RADIATA">PINO RADIATA</option>
                  <option value="EUCALIPTUS GLOBULUS">EUCALIPTUS GLOBULUS</option>
                  <option value="EUCALIPTUS NITENS">EUCALIPTUS NITENS</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Código Producto *
                  </label>
                  <input
                    id="quick-input-codigo-producto"
                    type="text"
                    required
                    placeholder="Ej: P0265RRCCAL1"
                    value={productoForm.codigoProducto}
                    onChange={(e) => setProductoForm({ ...productoForm, codigoProducto: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Largo (m) *
                  </label>
                  <input
                    id="quick-input-largo-producto"
                    type="text"
                    required
                    placeholder="Ej: 2.65"
                    value={productoForm.largo}
                    onChange={(e) => setProductoForm({ ...productoForm, largo: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-stone-500 italic">
                * Se sincroniza inmediatamente con Firestore para disponibilidad de todos los operadores.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-quick-producto"
                  type="submit"
                  className="px-4 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
