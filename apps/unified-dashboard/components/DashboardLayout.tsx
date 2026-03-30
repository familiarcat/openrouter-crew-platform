'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  Coins, 
  Zap, 
  Activity, 
  MessageSquare,
  Users,
  Terminal,
  Compass,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ icon: Icon, label, active }: NavItemProps) => (
  <div className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group",
    active 
      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
      : "hover:bg-white/5 text-gray-400 hover:text-white"
  )}>
    <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "group-hover:text-white")} />
    <span className="font-medium text-sm">{label}</span>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-gray-100 flex font-sans overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar: Mission Control (Picard & Troi) */}
      <aside className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight">CREW <span className="text-blue-500">PLATFORM</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={LayoutDashboard} label="Bridge Overview" active />
          <NavItem icon={Users} label="Crew Roster" />
          <NavItem icon={Compass} label="Mission Control" />
          <NavItem icon={MessageSquare} label="Subspace Comms" />
          <NavItem icon={Activity} label="System Analytics" />
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Local Node Active</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Top Header: Telemetry & Latinum Flow (Data & Quark) */}
        <header className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-8">
            {/* Latinum Flow Meter */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Coins className="w-3 h-3" /> Latinum Flow
              </div>
              <div className="text-sm font-mono text-yellow-500/90">$0.42 <span className="text-gray-600 text-[10px]">/ $1.50 target</span></div>
            </div>

            {/* Shield Status */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Shield className="w-3 h-3 text-blue-400" /> Shields
              </div>
              <div className="text-sm font-mono text-blue-400">98.2% <span className="text-gray-600 text-[10px]">nominal</span></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
              <Activity className="w-5 h-5 text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0b10]" />
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold uppercase tracking-tight">J.L. Picard</span>
                <span className="text-[10px] text-gray-500">Fleet Commander</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/20" />
            </div>
          </div>
        </header>

        {/* Main Content Area: Dark Forest Viewport */}
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer: Parity Logs (O'Brien & Uhura) */}
        <footer className="h-10 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <Terminal className="w-3 h-3" /> pnpm-workspace: verified
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-3 h-3" /> latency: 142ms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-500/80 underline cursor-pointer hover:text-blue-400">Documentation Index</span>
            <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              <AlertCircle className="w-3 h-3 text-yellow-500" />
              <span>2 warnings in deck 7</span>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}