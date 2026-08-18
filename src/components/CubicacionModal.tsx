import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Check, RotateCcw, HelpCircle, ArrowRight } from 'lucide-react';

export interface MedidaBanco {
  ladoA: string;
  ladoB: string;
}

interface CubicacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  largoMadera: string; // e.g. "2.44" or "2.65"
  onApplyVolumen: (volumenMR: string, detalleCalculo?: string) => void;
}

export const CubicacionModal: React.FC<CubicacionModalProps> = ({
  isOpen,
  onClose,
  largoMadera,
  onApplyVolumen
}) => {
  if (!isOpen) return null;

  // Pairs of measurements (Lado A y Lado B) per bench (banco)
  const [bancos, setBancos] = useState<MedidaBanco[]>([
    { ladoA: '1.50', ladoB: '1.65' },
    { ladoA: '1.60', ladoB: '1.55' },
    { ladoA: '1.70', ladoB: '1.63' },
    { ladoA: '1.65', ladoB: '1.70' },
    { ladoA: '1.80', ladoB: '1.50' }
  ]);

  const [anchoAtril, setAnchoAtril] = useState<string>('2.40');
  const [largo, setLargo] = useState<string>(largoMadera || '2.44');
  const [factorMR, setFactorMR] = useState<string>('2.44'); // Constante para pasar de m³ a MR

  useEffect(() => {
    if (largoMadera) {
      setLargo(largoMadera.replace(',', '.'));
    }
  }, [largoMadera]);

  const handleAddBanco = () => {
    setBancos([...bancos, { ladoA: '', ladoB: '' }]);
  };

  const handleRemoveBanco = (index: number) => {
    if (bancos.length <= 1) return;
    setBancos(bancos.filter((_, i) => i !== index));
  };

  const handleUpdateMedida = (index: number, side: 'ladoA' | 'ladoB', value: string) => {
    const updated = [...bancos];
    updated[index][side] = value;
    setBancos(updated);
  };

  // Reset to default example
  const handleResetExample = () => {
    setBancos([
      { ladoA: '1.50', ladoB: '1.65' },
      { ladoA: '1.60', ladoB: '1.55' },
      { ladoA: '1.70', ladoB: '1.63' },
      { ladoA: '1.65', ladoB: '1.70' },
      { ladoA: '1.80', ladoB: '1.50' }
    ]);
    setAnchoAtril('2.40');
  };

  // Mathematical formula calculations:
  const calculations = React.useMemo(() => {
    const validPairs: { a: number; b: number }[] = [];
    let sumTotal = 0;
    let countMedidas = 0;

    bancos.forEach((b) => {
      const valA = parseFloat(b.ladoA.replace(',', '.'));
      const valB = parseFloat(b.ladoB.replace(',', '.'));
      
      const numA = isNaN(valA) ? 0 : valA;
      const numB = isNaN(valB) ? 0 : valB;

      if (numA > 0 || numB > 0) {
        if (numA > 0) { sumTotal += numA; countMedidas++; }
        if (numB > 0) { sumTotal += numB; countMedidas++; }
        validPairs.push({ a: numA, b: numB });
      }
    });

    const numBancos = validPairs.length;
    const alturaPromedio = countMedidas > 0 ? sumTotal / countMedidas : 0;
    const numAncho = parseFloat(anchoAtril.replace(',', '.')) || 2.40;
    const numLargo = parseFloat(largo.replace(',', '.')) || 2.44;
    const numFactorMR = parseFloat(factorMR.replace(',', '.')) || 2.44;

    // 1. Altura promedio * Ancho del atril = Volumen o sección de 1 banco
    const volumenUnBanco = alturaPromedio * numAncho;

    // 2. Volumen de 1 banco * cantidad de bancos
    const volumenTotalBancos = volumenUnBanco * numBancos;

    // 3. Multiplicar por largo de la madera
    const volumenM3Total = volumenTotalBancos * numLargo;

    // 4. Dividir por 2.44 (constante para convertir m³ a Metro Ruma MR)
    const volumenFinalMR = numFactorMR > 0 ? volumenM3Total / numFactorMR : 0;

    return {
      sumTotal: sumTotal.toFixed(2),
      countMedidas,
      numBancos,
      alturaPromedio: alturaPromedio.toFixed(2),
      alturaPromedioRaw: alturaPromedio,
      volumenUnBanco: volumenUnBanco.toFixed(2),
      volumenTotalBancos: volumenTotalBancos.toFixed(2),
      volumenM3Total: volumenM3Total.toFixed(2),
      volumenFinalMR: volumenFinalMR.toFixed(3),
      volumenFinalFormatted: volumenFinalMR.toFixed(2)
    };
  }, [bancos, anchoAtril, largo, factorMR]);

  const handleApply = () => {
    const detail = `Cubicación: ${calculations.numBancos} bancos (${calculations.countMedidas} medidas), Alt. Prom: ${calculations.alturaPromedio}m x Ancho: ${anchoAtril}m x Largo: ${largo}m / 2.44 = ${calculations.volumenFinalFormatted} MR`;
    onApplyVolumen(calculations.volumenFinalFormatted, detail);
    onClose();
  };

  return (
    <div 
      id="modal-cubicacion-backdrop"
      className="fixed inset-0 z-60 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="modal-cubicacion-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-sm shadow-2xl border border-stone-300 overflow-hidden flex flex-col my-4 max-h-[95vh]"
      >
        {/* Header */}
        <div className="bg-[#35322f] px-5 py-3.5 text-white flex items-center justify-between border-b-4 border-[#BCB703]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#BCB703] text-stone-900 rounded">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2EDC9]">
                Calculadora de Cubicación Forestal (Volumen MR)
              </h2>
              <p className="text-[11px] text-neutral-300">
                Fórmula de cubicación por bancos (Lado A y Lado B)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-[#fbfbf9]">
          
          {/* Top Parameters (Ancho Atril, Largo Madera, Constante) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-100 rounded border border-stone-200 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 mb-1">
                Ancho del Atril (m)
              </label>
              <input
                id="input-cubicar-ancho-atril"
                type="number"
                step="0.01"
                value={anchoAtril}
                onChange={(e) => setAnchoAtril(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 focus:border-[#BCB703] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 mb-1">
                Largo Madera (m)
              </label>
              <input
                id="input-cubicar-largo-madera"
                type="number"
                step="0.01"
                value={largo}
                onChange={(e) => setLargo(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-stone-300 rounded font-mono font-bold text-stone-900 focus:border-[#BCB703] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 mb-1">
                Constante MR (Divisor)
              </label>
              <input
                id="input-cubicar-factor-mr"
                type="number"
                step="0.01"
                value={factorMR}
                onChange={(e) => setFactorMR(e.target.value)}
                className="w-full h-8 px-2.5 bg-stone-50 border border-stone-300 rounded font-mono text-stone-600 outline-none"
                readOnly
              />
            </div>
          </div>

          {/* Measurements Table: Lado A y Lado B */}
          <div className="border border-stone-200 rounded bg-white shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-800 tracking-wider">
                Medidas de Altura por Banco (Metros)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetExample}
                  className="text-[10px] text-stone-500 hover:text-stone-800 underline flex items-center gap-1"
                  title="Cargar valores de ejemplo"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ejemplo estándar</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddBanco}
                  className="px-2.5 py-1 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 rounded text-[11px] font-bold uppercase flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Banco</span>
                </button>
              </div>
            </div>

            <div className="p-3 max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-600 font-bold uppercase text-[10px] border-b border-stone-100">
                    <th className="pb-1.5 text-left w-16">Banco</th>
                    <th className="pb-1.5 px-2 text-center">Lado A Camión (m)</th>
                    <th className="pb-1.5 px-2 text-center">Lado B Camión (m)</th>
                    <th className="pb-1.5 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {bancos.map((b, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40">
                      <td className="py-1.5 font-bold text-stone-700 font-sans text-[11px]">
                        Banco #{idx + 1}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="1.50"
                          value={b.ladoA}
                          onChange={(e) => handleUpdateMedida(idx, 'ladoA', e.target.value)}
                          className="w-full h-8 px-2 text-center border border-stone-300 rounded font-bold focus:border-[#BCB703] outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="1.65"
                          value={b.ladoB}
                          onChange={(e) => handleUpdateMedida(idx, 'ladoB', e.target.value)}
                          className="w-full h-8 px-2 text-center border border-stone-300 rounded font-bold focus:border-[#BCB703] outline-none"
                        />
                      </td>
                      <td className="py-1.5 text-right">
                        {bancos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBanco(idx)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                            title="Quitar este banco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown Steps matching user excel formula */}
          <div className="bg-amber-50/80 border border-amber-200 rounded p-3 text-xs space-y-2 text-stone-800">
            <h4 className="font-extrabold uppercase text-[11px] text-amber-950 flex items-center gap-1.5 border-b border-amber-200/80 pb-1">
              <span>Desglose de la Fórmula de Cubicación:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between bg-white px-2 py-1 rounded border border-amber-100">
                <span className="font-sans text-stone-600">Suma total medidas:</span>
                <strong className="text-stone-900">{calculations.sumTotal} m ({calculations.countMedidas} medidas)</strong>
              </div>

              <div className="flex justify-between bg-white px-2 py-1 rounded border border-amber-100">
                <span className="font-sans text-stone-600">Altura promedio:</span>
                <strong className="text-stone-900">{calculations.alturaPromedio} m</strong>
              </div>

              <div className="flex justify-between bg-white px-2 py-1 rounded border border-amber-100">
                <span className="font-sans text-stone-600">Sección banco (Alt x Ancho {anchoAtril}):</span>
                <strong className="text-stone-900">{calculations.volumenUnBanco} m²</strong>
              </div>

              <div className="flex justify-between bg-white px-2 py-1 rounded border border-amber-100">
                <span className="font-sans text-stone-600">Total {calculations.numBancos} bancos:</span>
                <strong className="text-stone-900">{calculations.volumenTotalBancos} m²</strong>
              </div>

              <div className="flex justify-between bg-white px-2 py-1 rounded border border-amber-100">
                <span className="font-sans text-stone-600">Volumen cúbico (x Largo {largo}m):</span>
                <strong className="text-stone-900">{calculations.volumenM3Total} m³</strong>
              </div>

              <div className="flex justify-between bg-amber-100/80 px-2 py-1 rounded border border-amber-300">
                <span className="font-sans font-bold text-amber-950">Volumen MR (/ 2.44 cte):</span>
                <strong className="text-base text-[#D37608] font-black">{calculations.volumenFinalFormatted} MR</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-xs font-semibold uppercase tracking-wider"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-stone-500 font-mono block">Resultado a transferir:</span>
              <span className="text-base font-black text-[#D37608] font-mono leading-none">
                {calculations.volumenFinalFormatted} MR
              </span>
            </div>

            <button
              id="btn-aplicar-cubicacion"
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 rounded text-xs font-black uppercase tracking-wider shadow flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar al Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
