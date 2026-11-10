import React, { useEffect, useState } from 'react';
import { Wrench, ShieldCheck, Database, FileText } from 'lucide-react';

interface SplashScreenProps {
  onLoaded: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing application...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Loading local database & inventory...');
    }, 250);

    const timer2 = setTimeout(() => {
      setProgress(90);
      setStatusText('Preparing workshop invoice engine...');
    }, 550);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready!');
    }, 850);

    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 950);

    const timer5 = setTimeout(() => {
      onLoaded();
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onLoaded]);

  return (
    <div
      className={`fixed inset-0 z-100 bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-amber-400 selection:text-slate-950 transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Branding Box */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
        
        {/* Animated Icon Ring */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 bg-amber-500/20 rounded-3xl blur-xl animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 border-2 border-amber-400 relative">
            <Wrench className="w-10 h-10 stroke-[2.5] text-slate-950 animate-bounce-short" />
          </div>
        </div>

        {/* Software Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase rounded-full tracking-wider mb-2">
          Pro Software
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
          Auto Workshop Invoice Maker
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-8 max-w-xs">
          Automotive Car Workshop Billing & Inventory Control System
        </p>

        {/* Animated Loading Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-3 border border-slate-700/50 p-0.5 shadow-inner">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#f59e0b]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Subtext */}
        <div className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400">
          <span className="truncate">{statusText}</span>
          <span className="font-bold text-amber-400 ml-2">{progress}%</span>
        </div>

        {/* Bottom Feature Pill Badges */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 w-full flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>GST Ready</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Local Storage</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Print & WhatsApp</span>
          </div>
        </div>

      </div>
    </div>
  );
};
