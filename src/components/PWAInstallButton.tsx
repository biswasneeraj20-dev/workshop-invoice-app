import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
        title="Install Auto Workshop App on Home Screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img
                    src="/pwa-192x192.png"
                    alt="Auto Workshop App Icon"
                    className="w-8 h-8 rounded-lg"
                  />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Install on iPhone / iPad
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                1. Safari browser ke bottom me <strong>Share</strong> icon par tap karein.
                <br />
                2. Neeche scroll karke <strong>Add to Home Screen</strong> select karein.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-slate-950 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
