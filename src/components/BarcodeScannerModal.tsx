import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onScanSuccess: (sku: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulatedSku, setSimulatedSku] = useState('SKU-100452');

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setErrorMessage('Camera access denied or unavailable. You can use simulated barcode scanning below.');
        setScanning(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulatedScan = (sku: string) => {
    onScanSuccess(sku);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 animate-scale-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Barcode & SKU Scanner</h3>
              <p className="text-xs text-slate-400">Scan product barcodes via camera or quick select</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-6 space-y-6">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 h-64 flex items-center justify-center">
            {scanning && !errorMessage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-blue-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-24 border-2 border-dashed border-blue-400 rounded-xl animate-pulse flex items-center justify-center bg-blue-950/20 backdrop-blur-[2px]">
                    <ScanLine className="w-8 h-8 text-blue-400 animate-bounce" />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Quick Simulated SKU Barcode Selection for testing */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Barcode Simulation / Test Scans</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulatedScan('SKU-ELE-001')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-left border border-slate-700"
              >
                📦 SKU-ELE-001
              </button>
              <button
                onClick={() => handleSimulatedScan('SKU-HW-002')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-left border border-slate-700"
              >
                🔩 SKU-HW-002
              </button>
              <button
                onClick={() => handleSimulatedScan('SKU-RM-003')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-left border border-slate-700"
              >
                🧪 SKU-RM-003
              </button>
              <button
                onClick={() => handleSimulatedScan('SKU-PKG-004')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-left border border-slate-700"
              >
                📦 SKU-PKG-004
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
