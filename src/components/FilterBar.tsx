import React, { useState } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Search, X, FileText } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  onSearch: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  onReset,
  onSearch
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearOrigen = () => {
    setFilters(prev => ({ ...prev, origen: '' }));
  };

  return (
    <div id="filter-container" className="bg-white border-b-2 border-[#676057] shadow-sm mb-6 rounded-t-sm overflow-hidden">
      {/* Header */}
      <div 
        id="filter-header"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-200/60 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
          FILTROS DE BÚSQUEDA
        </span>
        <button 
          id="btn-toggle-filters"
          className="text-stone-600 hover:text-stone-900 p-1"
          aria-label="Alternar filtros"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filter inputs */}
      {isOpen && (
        <div id="filter-body" className="p-4 bg-[#fdfdfb]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-4 gap-y-3">
            {/* FECHA PROGRAMA */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                FECHA PROGRAMA
              </label>
              <input
                id="input-filter-fecha"
                type="date"
                value={filters.fechaPrograma}
                onChange={(e) => handleChange('fechaPrograma', e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800"
              />
            </div>

            {/* NÚMERO DE GUÍA */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#D37608]" />
                <span>NÚMERO DE GUÍA</span>
              </label>
              <input
                id="input-filter-guia"
                type="text"
                placeholder="Ej: 10075160"
                value={filters.numeroGiro}
                onChange={(e) => handleChange('numeroGiro', e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800 font-mono font-bold"
              />
            </div>

            {/* EMSEFOR DESPACHO / TRANSPORTISTA */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                EMSEFOR / TRANSPORTISTA
              </label>
              <input
                id="input-filter-emsefor"
                type="text"
                placeholder="Buscar transportista..."
                value={filters.emseforDespacho}
                onChange={(e) => handleChange('emseforDespacho', e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800"
              />
            </div>

            {/* ORIGEN */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                ORIGEN
              </label>
              <div className="relative">
                <input
                  id="input-filter-origen"
                  type="text"
                  placeholder="Predio o procedencia..."
                  value={filters.origen}
                  onChange={(e) => handleChange('origen', e.target.value)}
                  className="w-full h-8 px-2.5 pr-7 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800"
                />
                {filters.origen && (
                  <button
                    id="btn-clear-origen"
                    onClick={handleClearOrigen}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* DESTINO */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                DESTINO
              </label>
              <input
                id="input-filter-destino"
                type="text"
                placeholder="Ej: N048 CN RANQUIL"
                value={filters.destino}
                onChange={(e) => handleChange('destino', e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800"
              />
            </div>

            {/* GRÚA */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                GRÚA
              </label>
              <input
                id="input-filter-grua"
                type="text"
                placeholder="Identificador grúa..."
                value={filters.grua}
                onChange={(e) => handleChange('grua', e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-stone-300 rounded focus:border-[#BCB703] focus:ring-1 focus:ring-[#BCB703] outline-none text-stone-800"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-2 pt-2 border-t border-stone-200">
            <button
              id="btn-filter-limpiar"
              onClick={onReset}
              className="px-4 py-1.5 bg-[#676057] text-[#F2EDC9] hover:bg-[#524d46] text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>LIMPIAR</span>
            </button>

            <button
              id="btn-filter-buscar"
              onClick={onSearch}
              className="px-5 py-1.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>BUSCAR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
