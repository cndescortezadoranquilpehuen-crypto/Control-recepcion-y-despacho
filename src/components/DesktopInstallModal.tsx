import React from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  CheckCircle2, 
  ExternalLink,
  Laptop,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall: () => void;
  canInstallNative: boolean;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canInstallNative
}) => {
  if (!isOpen) return null;

  // Download Windows shortcut file (.url)
  const handleDownloadWindowsShortcut = () => {
    const appUrl = window.location.origin;
    const shortcutContent = `[InternetShortcut]
URL=${appUrl}
IconIndex=0
IconFile=${appUrl}/favicon.ico
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,0
[InternetShortcut.A]
URL=${appUrl}
[InternetShortcut.W]
URL=${appUrl}
`;

    const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Control Recepcion y Despacho.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="modal-desktop-install-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="modal-desktop-install-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-sm shadow-2xl border border-stone-300 overflow-hidden flex flex-col my-6"
      >
        {/* Header */}
        <div className="bg-[#35322f] text-[#F2EDC9] px-6 py-4 border-b-4 border-[#BCB703] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BCB703] text-stone-900 rounded">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                Instalar en Escritorio Windows
              </h2>
              <p className="text-xs text-neutral-300">
                Acceso directo rápido y ventana independiente de escritorio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-[#fafaf9]">
          
          {/* Main Action 1: Native PWA Install */}
          <div className="bg-white p-5 rounded border-2 border-[#BCB703] shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#BCB703] text-stone-900 rounded inline-block mb-1">
                  Opción Recomendada
                </span>
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  Instalar como Aplicación de Windows (PWA)
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Crea un icono en el Escritorio de Windows y en el Menú Inicio. Se abre en una ventana limpia sin barras de navegación del explorador.
                </p>
              </div>

              <div className="flex-shrink-0">
                {canInstallNative ? (
                  <button
                    id="btn-trigger-pwa-install"
                    onClick={() => {
                      onNativeInstall();
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-[#BCB703] hover:bg-[#a8a302] text-stone-900 font-extrabold text-xs uppercase tracking-wider rounded shadow transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Ahora</span>
                  </button>
                ) : (
                  <button
                    id="btn-trigger-shortcut-download"
                    onClick={handleDownloadWindowsShortcut}
                    className="px-4 py-2.5 bg-[#D37608] hover:bg-[#ba6502] text-white font-extrabold text-xs uppercase tracking-wider rounded shadow transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Acceso Directo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick guide if native prompt already installed or browser specific */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Compatible con Google Chrome, Microsoft Edge y navegadores modernos de Windows 10/11.</span>
            </div>
          </div>

          {/* Direct Windows Shortcut (.url) */}
          <div className="bg-white p-4 rounded border border-stone-200 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 rounded text-stone-700">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase">
                  Acceso Directo para Windows (.url)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Descarga el archivo y arrástralo a tu Escritorio de Windows.
                </p>
              </div>
            </div>

            <button
              id="btn-download-direct-url"
              onClick={handleDownloadWindowsShortcut}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .URL</span>
            </button>
          </div>

          {/* Browser Step-by-Step Instructions */}
          <div className="bg-stone-50 p-4 rounded border border-stone-200">
            <h4 className="text-xs font-bold uppercase text-stone-700 mb-2.5 flex items-center gap-1.5">
              <span>Instrucciones manuales en Google Chrome / Microsoft Edge:</span>
            </h4>
            
            <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside">
              <li>
                En la barra de direcciones superior de tu navegador, haz clic en el icono <strong>Instalar</strong> (o menú de 3 puntos <span className="font-mono font-bold">⋮</span>).
              </li>
              <li>
                Selecciona <strong>"Instalar Control Recepción y Despacho..."</strong> o <strong>"Crear acceso directo..."</strong>.
              </li>
              <li>
                Marca la casilla <strong>"Abrir como ventana"</strong> y haz clic en <strong>Instalar</strong>.
              </li>
              <li>
                ¡Listo! La aplicación quedará guardada como programa en tu escritorio y barra de tareas de Windows.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase rounded transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
