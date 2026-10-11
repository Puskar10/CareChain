import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { AppTab } from '../types';
import {
  LayoutDashboard,
  Clock,
  Sparkles,
  Flame,
  Pill,
  HeartPulse,
  FileText,
  Stethoscope,
  ShieldCheck,
  Share2
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, events, activePatient } = useCareChain();

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'timeline',
      label: 'Patient Timeline',
      icon: <Clock className="w-4 h-4" />,
      badge: `${events.length}`,
      badgeColor: 'bg-brand-50 text-brand-700'
    },
    {
      id: 'handover',
      label: '60-Sec Handover',
      icon: <Sparkles className="w-4 h-4 text-brand-500" />,
      badge: 'AI Core',
      badgeColor: 'bg-teal-100 text-teal-800 font-bold'
    },
    {
      id: 'emergency',
      label: 'Emergency Mode',
      icon: <Flame className="w-4 h-4 text-red-500" />,
      badge: 'URGENT',
      badgeColor: 'bg-red-100 text-red-700 animate-pulse font-bold'
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: <Pill className="w-4 h-4" />
    },
    {
      id: 'vitals',
      label: 'Vitals & Trends',
      icon: <HeartPulse className="w-4 h-4" />
    },
    {
      id: 'reports',
      label: 'Medical Reports',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'doctor',
      label: 'Doctor View',
      icon: <Stethoscope className="w-4 h-4" />
    },
    {
      id: 'sharing',
      label: 'Audit & Sharing',
      icon: <Share2 className="w-4 h-4" />
    }
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-18 z-20 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-soft font-semibold'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
