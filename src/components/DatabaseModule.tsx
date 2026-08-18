import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Download, 
  Database, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Truck, 
  User, 
  TreePine,
  FileSpreadsheet,
  Save
} from 'lucide-react';
import { ConductorItem, PatenteItem, ProductoItem } from '../types';
import { StorageService } from '../services/storageService';
import { INITIAL_CONDUCTORES, INITIAL_PATENTES, INITIAL_PRODUCTOS } from '../data/mockSeed';

export const DatabaseModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'patentes' | 'conductores' | 'productos'>('patentes');
  const [patentes, setPatentes] = useState<PatenteItem[]>([]);
  const [conductores, setConductores] = useState<ConductorItem[]>([]);
  const [productos, setProductosDb] = useState<ProductoItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatente, setNewPatente] = useState<PatenteItem>({ patenteCamion: '', patenteCarro: '', siglaCamion: '', transportista: '' });
  const [newConductor, setNewConductor] = useState<ConductorItem>({ rutConductor: '', nombreConductor: '', transportista: '' });
  const [newProducto, setNewProducto] = useState<ProductoItem>({ especie: 'PINO RADIATA', codigoProducto: '', largo: '2.65' });

  const loadData = () => {
    setPatentes(StorageService.getPatentes());
    setConductores(StorageService.getConductores());
    setProductosDb(StorageService.getProductos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus(null);
    try {
      const result = await StorageService.parseExcelFile(file);
      
      let updatedPatentes = patentes;
      let updatedConductores = conductores;
      let updatedProductos = productos;

      if (result.patentes.length > 0) {
        updatedPatentes = result.patentes;
        StorageService.savePatentes(result.patentes);
        setPatentes(result.patentes);
      }
      if (result.conductores.length > 0) {
        updatedConductores = result.conductores;
        StorageService.saveConductores(result.conductores);
        setConductores(result.conductores);
      }
      if (result.productos.length > 0) {
        updatedProductos = result.productos;
        StorageService.saveProductos(result.productos);
        setProductosDb(result.productos);
      }

      setUploadStatus(`Archivo cargado con éxito. ${result.summary}`);
    } catch (err: any) {
      setUploadStatus(`Error al procesar el archivo Excel: ${err.message || 'Formato no soportado'}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    StorageService.exportDatabaseExcel();
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Desea restablecer la base de datos a los valores predeterminados?')) {
      StorageService.savePatentes(INITIAL_PATENTES);
      StorageService.saveConductores(INITIAL_CONDUCTORES);
      StorageService.saveProductos(INITIAL_PRODUCTOS);
      loadData();
      setUploadStatus('Base de datos restablecida a los valores iniciales.');
    }
  };

  // Add Item Submit
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'patentes') {
      if (!newPatente.patenteCamion) return;
      const updated = [newPatente, ...patentes];
      StorageService.savePatentes(updated);
      setPatentes(updated);
      setNewPatente({ patenteCamion: '', patenteCarro: '', siglaCamion: '', transportista: '' });
    } else if (activeTab === 'conductores') {
      if (!newConductor.rutConductor) return;
      const updated = [newConductor, ...conductores];
      StorageService.saveConductores(updated);
      setConductores(updated);
      setNewConductor({ rutConductor: '', nombreConductor: '', transportista: '' });
    } else if (activeTab === 'productos') {
      if (!newProducto.codigoProducto) return;
      const updated = [newProducto, ...productos];
      StorageService.saveProductos(updated);
      setProductosDb(updated);
      setNewProducto({ especie: 'PINO RADIATA', codigoProducto: '', largo: '2.65' });
    }
    setShowAddModal(false);
  };

  const handleDeleteItem = (index: number) => {
    if (!window.confirm('¿Eliminar este registro de la base de datos?')) return;
    if (activeTab === 'patentes') {
      const updated = patentes.filter((_, idx) => idx !== index);
      StorageService.savePatentes(updated);
      setPatentes(updated);
    } else if (activeTab === 'conductores') {
      const updated = conductores.filter((_, idx) => idx !== index);
      StorageService.saveConductores(updated);
      setConductores(updated);
    } else if (activeTab === 'productos') {
      const updated = productos.filter((_, idx) => idx !== index);
      StorageService.saveProductos(updated);
      setProductosDb(updated);
    }
  };

  // Filtered views
  const filteredPatentes = patentes.filter(p => 
    p.patenteCamion.toUpperCase().includes(searchTerm.toUpperCase()) ||
    p.siglaCamion.toUpperCase().includes(searchTerm.toUpperCase()) ||
    p.transportista.toUpperCase().includes(searchTerm.toUpperCase())
  );

  const filteredConductores = conductores.filter(c => 
    c.rutConductor.toUpperCase().includes(searchTerm.toUpperCase()) ||
    c.nombreConductor.toUpperCase().includes(searchTerm.toUpperCase()) ||
    c.transportista.toUpperCase().includes(searchTerm.toUpperCase())
  );

  const filteredProductos = productos.filter(p => 
    p.especie.toUpperCase().includes(searchTerm.toUpperCase()) ||
    p.codigoProducto.toUpperCase().includes(searchTerm.toUpperCase())
  );

  return (
    <div id="database-module" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#676057]">
            <Database className="w-5 h-5 text-[#BCB703]" />
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">
              Módulo Base de Datos Forestal (Excel)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gestión sincronizada de Patentes, Conductores y Códigos de Productos. Puede subir archivos Excel (.xlsx/.csv) o editar los registros en tiempo real.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-file-uploader"
          />
          <label
            htmlFor="excel-file-uploader"
            className="px-4 py-2 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Excel "Base datos"</span>
          </label>

          <button
            id="btn-export-excel-db"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-[#676057] hover:bg-[#524d46] text-[#F2EDC9] text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Excel</span>
          </button>

          <button
            id="btn-reset-db"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded transition-colors flex items-center gap-1"
            title="Restablecer base de datos inicial"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload Notification Message */}
      {uploadStatus && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{uploadStatus}</span>
          </div>
          <button onClick={() => setUploadStatus(null)} className="text-stone-400 hover:text-stone-700 font-bold">✕</button>
        </div>
      )}

      {/* Main Database Table Tabs */}
      <div className="bg-white rounded-sm border border-stone-200 shadow-sm overflow-hidden">
        {/* Sub Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              id="tab-btn-patentes"
              onClick={() => { setActiveTab('patentes'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 ${
                activeTab === 'patentes'
                  ? 'bg-[#676057] text-[#F2EDC9] shadow-inner'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-[#BCB703]" />
              <span>Patentes ({patentes.length})</span>
            </button>

            <button
              id="tab-btn-conductores"
              onClick={() => { setActiveTab('conductores'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 ${
                activeTab === 'conductores'
                  ? 'bg-[#676057] text-[#F2EDC9] shadow-inner'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#BCB703]" />
              <span>Conductores ({conductores.length})</span>
            </button>

            <button
              id="tab-btn-productos"
              onClick={() => { setActiveTab('productos'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 ${
                activeTab === 'productos'
                  ? 'bg-[#676057] text-[#F2EDC9] shadow-inner'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <TreePine className="w-3.5 h-3.5 text-[#BCB703]" />
              <span>Productos ({productos.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 my-1">
            {/* Search Input */}
            <div className="relative">
              <input
                id="input-db-search"
                type="text"
                placeholder="Buscar en tabla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 sm:w-64 h-8 pl-8 pr-3 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] outline-none"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              id="btn-add-record"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase rounded flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          {activeTab === 'patentes' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#35322f] text-[#F2EDC9] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">Patente Camión</th>
                  <th className="py-2.5 px-4">Sigla Camión</th>
                  <th className="py-2.5 px-4">Patente Carro</th>
                  <th className="py-2.5 px-4">Transportista</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredPatentes.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-stone-400">No se encontraron patentes</td></tr>
                ) : (
                  filteredPatentes.map((p, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-stone-900">{p.patenteCamion}</td>
                      <td className="py-2.5 px-4 font-mono text-stone-700">{p.siglaCamion}</td>
                      <td className="py-2.5 px-4 font-mono text-stone-600">{p.patenteCarro || '-'}</td>
                      <td className="py-2.5 px-4 font-semibold text-stone-800">{p.transportista}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'conductores' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#35322f] text-[#F2EDC9] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">RUT Conductor</th>
                  <th className="py-2.5 px-4">Nombre Conductor</th>
                  <th className="py-2.5 px-4">Transportista Asignado</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredConductores.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-stone-400">No se encontraron conductores</td></tr>
                ) : (
                  filteredConductores.map((c, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-stone-900">{c.rutConductor}</td>
                      <td className="py-2.5 px-4 font-semibold text-stone-800">{c.nombreConductor}</td>
                      <td className="py-2.5 px-4 text-stone-700">{c.transportista}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Eliminar conductor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'productos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#35322f] text-[#F2EDC9] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">Especie Forestal</th>
                  <th className="py-2.5 px-4">Código Producto</th>
                  <th className="py-2.5 px-4">Largo (m)</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredProductos.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-stone-400">No se encontraron productos</td></tr>
                ) : (
                  filteredProductos.map((p, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-stone-800">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          p.especie.includes('PINO') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {p.especie}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-stone-900">{p.codigoProducto}</td>
                      <td className="py-2.5 px-4 font-mono text-stone-700">{p.largo} m</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded shadow-xl border border-stone-300 p-5">
            <h3 className="text-sm font-bold uppercase text-stone-900 mb-4 pb-2 border-b border-stone-200">
              Agregar Nuevo Registro ({activeTab.toUpperCase()})
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-3">
              {activeTab === 'patentes' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Patente Camión</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: RRFG94"
                      value={newPatente.patenteCamion}
                      onChange={(e) => setNewPatente({ ...newPatente, patenteCamion: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Sigla Camión</label>
                    <input
                      type="text"
                      placeholder="Ej: LL115"
                      value={newPatente.siglaCamion}
                      onChange={(e) => setNewPatente({ ...newPatente, siglaCamion: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Patente Carro</label>
                    <input
                      type="text"
                      placeholder="Ej: PWWX23"
                      value={newPatente.patenteCarro}
                      onChange={(e) => setNewPatente({ ...newPatente, patenteCarro: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Transportista</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: SOC.TRANSPORTES LLICO LTDA."
                      value={newPatente.transportista}
                      onChange={(e) => setNewPatente({ ...newPatente, transportista: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                </>
              )}

              {activeTab === 'conductores' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">RUT Conductor</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 16013391-0"
                      value={newConductor.rutConductor}
                      onChange={(e) => setNewConductor({ ...newConductor, rutConductor: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs font-mono uppercase border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Conductor</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo..."
                      value={newConductor.nombreConductor}
                      onChange={(e) => setNewConductor({ ...newConductor, nombreConductor: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Transportista Asignado</label>
                    <input
                      type="text"
                      required
                      placeholder="Empresa de transporte..."
                      value={newConductor.transportista}
                      onChange={(e) => setNewConductor({ ...newConductor, transportista: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded"
                    />
                  </div>
                </>
              )}

              {activeTab === 'productos' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Especie Forestal</label>
                    <select
                      value={newProducto.especie}
                      onChange={(e) => setNewProducto({ ...newProducto, especie: e.target.value })}
                      className="w-full h-8 px-2 text-xs border rounded"
                    >
                      <option value="PINO RADIATA">PINO RADIATA</option>
                      <option value="EUCALIPTUS GLOBULUS">EUCALIPTUS GLOBULUS</option>
                      <option value="EUCALIPTUS NITENS">EUCALIPTUS NITENS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Código Producto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: P0500RRCCAL1"
                      value={newProducto.codigoProducto}
                      onChange={(e) => setNewProducto({ ...newProducto, codigoProducto: e.target.value.toUpperCase() })}
                      className="w-full h-8 px-2 text-xs uppercase border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Largo (m)</label>
                    <input
                      type="text"
                      placeholder="Ej: 5.0"
                      value={newProducto.largo}
                      onChange={(e) => setNewProducto({ ...newProducto, largo: e.target.value })}
                      className="w-full h-8 px-2 text-xs border rounded"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold rounded shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
