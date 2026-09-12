// src/pages/LandingPage.jsx
// Crystal Ball — Executive Module Launchpad
// All 6 module cards open a right-side drawer on click
// Revenue drawer has live KPI preview + Enter Dashboard CTA
// Inactive drawers show planned features

import { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Zap,
  Users,
  Building2,
  ArrowRight,
  X,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  Activity,
  Globe2,
  Layers,
  Target,
  TrendingDown,
  Calendar,
  BarChart2,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext.jsx';
import TCSLogo from '../assets/TCSLogo.png';

/* ─── Module definitions ────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 'revenue',
    label: 'Revenue Performance',
    shortDesc: 'Multi-year revenue analytics, AOP tracking, gap analysis and quarterly insights.',
    icon: BarChart3,
    color: 'blue',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'Revenue Performance Analytics',
      subheadline: 'Full multi-year revenue intelligence platform',
      kpis: [
        { label: 'Total Revenue', value: '₹34.2K Cr', good: true },
        { label: 'AOP Target', value: '₹38.5K Cr', good: null },
        { label: 'AOP Achievement', value: '88.8%', good: false },
        { label: 'YoY Growth', value: '+12.4%', good: true },
      ],
      views: [
        { icon: BarChart3, label: 'Annual Performance', desc: 'FY-wise AOP vs actual, YoY trends' },
        { icon: Target, label: 'AOP Performance', desc: 'Quarterly AOP tracking & gap drill' },
        { icon: PieChart, label: 'Current Quarter', desc: 'Live projection vs target matrix' },
        { icon: Activity, label: 'Weekly Trend', desc: 'Week-by-week run-rate analysis' },
      ],
      cta: 'Enter Revenue Dashboard',
    },
  },
  {
    id: 'finance',
    label: 'Finance Performance',
    shortDesc: 'Gross margin analytics, cost breakdown, realization rates and BTA % by cluster, geo and sub unit.',
    icon: DollarSign,
    color: 'emerald',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'Finance Performance Analytics',
      subheadline: 'Margin intelligence, cost analytics & BTA performance platform',
      kpis: [
        { label: 'Gross Margin %', value: '41.4%', good: null },
        { label: 'Total Cost %', value: '58.6%', good: false },
        { label: 'Offshore BTA', value: '97.8%', good: false },
        { label: 'Adjusted BTA', value: '98.2%', good: false },
      ],
      views: [
        { icon: BarChart3, label: 'Margin Performance', desc: 'Revenue, GM%, Cost % by FY & cluster' },
        { icon: TrendingUp, label: 'Realization & BTA', desc: 'Yearly/quarterly realization & BTA trends' },
      ],
      cta: 'Enter Finance Dashboard',
    },
  },
  {
    id: 'sales',
    label: 'Sales Performance',
    shortDesc: 'Pipeline analytics, win rates, deal velocity and competitive win/loss tracking.',
    icon: TrendingUp,
    color: 'orange',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'Sales Performance Analytics',
      subheadline: 'End-to-end TCV pipeline intelligence & deal tracking platform',
      kpis: [
        { label: 'TCV AOP (FY27)', value: '$2,916M', good: null },
        { label: 'TCV Won', value: '$701M', good: null },
        { label: '% Achieved', value: '24.0%', good: false },
        { label: 'Pipeline', value: '$2,486M', good: true },
      ],
      views: [
        { icon: BarChart3, label: 'FY Performance', desc: 'FY TCV AOP vs Won with trend analysis' },
        { icon: TrendingUp, label: 'Quarterly Performance', desc: 'Quarterly TCV, pipeline & new deals' },
        { icon: Target, label: 'Current Qtr Performance', desc: 'Live quarter achievement & stage mix' },
        { icon: Activity, label: 'Weekly Trend Analysis', desc: 'Week-by-week run-rate & pipeline trend' },
      ],
      cta: 'Enter Sales Dashboard',
    },
  },
  {
    id: 'deg',
    label: 'DEG Performance',
    shortDesc: 'Delivery excellence, engineering quality metrics and project health KPIs.',
    icon: Zap,
    color: 'teal',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'DEG Performance Analytics',
      subheadline: 'Customer satisfaction & delivery excellence intelligence platform',
      kpis: [
        { label: 'Overall CSI Score', value: '94.2%', good: true },
        { label: 'Total Projects', value: '2,287', good: null },
        { label: '100% CSI Projects', value: '700', good: true },
        { label: 'Customer Loyalty%', value: '73.1%', good: true },
      ],
      views: [
        { icon: Activity, label: 'CSI% Trend', desc: 'CSI score trend across H1/H2 periods' },
        { icon: BarChart3, label: 'Project vs 100% CSI', desc: 'Total projects vs 100% CSI count per period' },
        { icon: BarChart3, label: 'CSI by Sub Unit', desc: 'Sub-unit CSI performance breakdown' },
        { icon: Layers, label: 'CSI Detail Table', desc: 'Hierarchical table with all CSI metrics' },
      ],
      cta: 'Enter DEG Dashboard',
    },
  },
  {
    id: 'rmg',
    label: 'RMG Performance',
    shortDesc: 'Resource management, weekly headcount additions, cluster trajectories and account drilldowns.',
    icon: Users,
    color: 'violet',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'RMG Performance Analytics',
      subheadline: 'Resource Management Group headcount & workforce intelligence platform',
      kpis: [
        { label: 'Current Qtr Addition', value: '+21,450', good: true },
        { label: 'Current Wk Addition', value: '+1,820', good: true },
        { label: 'Active Clusters', value: '4', good: null },
        { label: 'Reporting Weeks', value: '10 Weeks', good: null },
      ],
      views: [
        { icon: BarChart3, label: 'WON HC Trend', desc: 'Weekly headcount additions across reporting periods' },
        { icon: TrendingUp, label: 'BG Cluster Wise Trend', desc: 'Headcount trajectories across business clusters' },
        { icon: Activity, label: 'Sub Unit Wise Trend', desc: 'Top sub-units comparative headcount trends' },
        { icon: Layers, label: 'BG Cluster & Account Tables', desc: 'Detailed weekly cross-tabulation matrices' },
      ],
      cta: 'Enter RMG Dashboard',
    },
  },
  {
    id: 'account',
    label: 'Account Performance',
    shortDesc: 'Comprehensive account intelligence, multi-year performance, and client visit analytics.',
    icon: Building2,
    color: 'sky',
    active: true,
    badge: 'Live',
    drawer: {
      headline: 'Account Performance Analytics',
      subheadline: 'Multi-year account trajectory, cross-module performance & client visit intelligence',
      kpis: [
        { label: 'Active Key Accounts', value: '48 Accounts', good: true },
        { label: 'Total Client Meetings', value: '87 Visits', good: true },
        { label: 'Revenue (FY26)', value: '₹ 14,511 Cr', good: true },
        { label: 'AOP Achievement', value: '94.4%', good: true },
      ],
      views: [
        { icon: TrendingUp, label: 'Performance Analysis', desc: 'FY & quarterly performance with cross-module lens' },
        { icon: Users, label: 'Client Visit Intelligence', desc: 'Meeting category KPIs, trends, and client matrices' },
        { icon: Layers, label: 'Yearly Performance Matrix', desc: 'Sub-unit multi-year AOP, actuals, and YoY trends' },
        { icon: Calendar, label: 'Visit Detail Records', desc: 'Detailed meeting records with attendee coverage' },
      ],
      cta: 'Enter Account Dashboard',
    },
  },
];

/* ─── Color palette ─────────────────────────────────────────────────────── */
const COLORS = {
  blue: { icon: '#2563EB', iconBg: '#EFF6FF', iconBgD: 'rgba(37,99,235,0.15)', bar: '#2563EB', badge: { bg: '#DBEAFE', text: '#1D4ED8', bgD: 'rgba(59,130,246,0.15)', textD: '#93C5FD' }, glow: 'rgba(37,99,235,0.15)' },
  emerald: { icon: '#059669', iconBg: '#ECFDF5', iconBgD: 'rgba(5,150,105,0.15)', bar: '#059669', badge: { bg: '#D1FAE5', text: '#065F46', bgD: 'rgba(16,185,129,0.15)', textD: '#6EE7B7' }, glow: 'rgba(5,150,105,0.12)' },
  orange: { icon: '#EA580C', iconBg: '#FFF7ED', iconBgD: 'rgba(234,88,12,0.15)', bar: '#EA580C', badge: { bg: '#FFEDD5', text: '#9A3412', bgD: 'rgba(249,115,22,0.15)', textD: '#FDba74' }, glow: 'rgba(234,88,12,0.12)' },
  teal: { icon: '#0891B2', iconBg: '#F0FDFA', iconBgD: 'rgba(8,145,178,0.15)', bar: '#0891B2', badge: { bg: '#CCFBF1', text: '#134E4A', bgD: 'rgba(20,184,166,0.15)', textD: '#5EEAD4' }, glow: 'rgba(8,145,178,0.12)' },
  violet: { icon: '#7C3AED', iconBg: '#F5F3FF', iconBgD: 'rgba(124,58,237,0.15)', bar: '#7C3AED', badge: { bg: '#EDE9FE', text: '#5B21B6', bgD: 'rgba(139,92,246,0.15)', textD: '#C4B5FD' }, glow: 'rgba(124,58,237,0.12)' },
  sky: { icon: '#0369A1', iconBg: '#F0F9FF', iconBgD: 'rgba(3,105,161,0.15)', bar: '#0369A1', badge: { bg: '#E0F2FE', text: '#0C4A6E', bgD: 'rgba(14,165,233,0.15)', textD: '#7DD3FC' }, glow: 'rgba(3,105,161,0.12)' },
};

/* ─── Live KPI ticker data ──────────────────────────────────────────────── */
const LIVE_METRICS = [
  { label: 'Total Revenue', value: '₹34.2K Cr' },
  { label: 'AOP Target', value: '₹38.5K Cr' },
  { label: 'AOP Achievement', value: '88.8%' },
  { label: 'Clusters', value: '4' },
  { label: 'Sub Units', value: '16' },
  { label: 'Geographies', value: '12' },
];

/* ─── Drawer Component ──────────────────────────────────────────────────── */
function Drawer({ mod, onClose, onEnter, isDark }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mod) {
      // small delay so CSS transition fires
      requestAnimationFrame(() => setMounted(true));
      document.body.style.overflow = 'hidden';
    } else {
      setMounted(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mod]);

  if (!mod) return null;

  const c = COLORS[mod.color];
  const Icon = mod.icon;
  const d = mod.drawer;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 420, zIndex: 50,
          background: isDark ? '#111D35' : '#FFFFFF',
          borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
          boxShadow: '-12px 0 40px rgba(0,0,0,0.2)',
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: '24px 24px 20px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9'}`,
            background: isDark ? '#0D1E38' : '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: isDark ? c.iconBgD : c.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}>
                <Icon style={{ width: 22, height: 22, color: c.icon }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                    padding: '2px 8px', borderRadius: 20,
                    background: isDark ? c.badge.bgD : c.badge.bg,
                    color: isDark ? c.badge.textD : c.badge.text,
                  }}>
                    {mod.active ? '● LIVE' : mod.badge}
                  </span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: isDark ? '#E2E8F0' : '#0F172A', marginTop: 4, letterSpacing: '-0.01em' }}>
                  {d.headline}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                color: isDark ? '#94A3B8' : '#64748B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.5 }}>
            {d.subheadline}
          </p>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Revenue: live KPI cards */}
          {mod.active && d.kpis && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#475569' : '#94A3B8', marginBottom: 10 }}>
                Live Platform Metrics
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {d.kpis.map((kpi) => (
                  <div key={kpi.label} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: kpi.good === true ? '#10B981' : kpi.good === false ? '#F59E0B' : (isDark ? '#E2E8F0' : '#0F172A') }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: isDark ? '#64748B' : '#94A3B8', marginTop: 3 }}>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue: dashboard views */}
          {mod.active && d.views && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#475569' : '#94A3B8', marginBottom: 10 }}>
                4 Analytical Views Included
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.views.map((v) => {
                  const VIcon = v.icon;
                  return (
                    <div key={v.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: isDark ? c.iconBgD : c.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <VIcon style={{ width: 15, height: 15, color: c.icon }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#E2E8F0' : '#0F172A' }}>{v.label}</div>
                        <div style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', marginTop: 1 }}>{v.desc}</div>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: isDark ? '#334155' : '#CBD5E1', marginLeft: 'auto', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inactive: planned features */}
          {!mod.active && d.planned && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
                border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A'}`,
              }}>
                <Calendar style={{ width: 15, height: 15, color: '#F59E0B', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>
                  Planned release: {mod.badge}
                </span>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#475569' : '#94A3B8', marginBottom: 10 }}>
                Planned Analytics Features
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.planned.map((item) => {
                  const IIcon = item.icon;
                  return (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}`,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: isDark ? c.iconBgD : c.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IIcon style={{ width: 15, height: 15, color: c.icon }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#CBD5E1' : '#334155' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9'}`,
        }}>
          {mod.active ? (
            <button
              onClick={onEnter}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)'; }}
            >
              {d.cta}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
            }}>
              <Lock style={{ width: 15, height: 15, color: isDark ? '#475569' : '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: isDark ? '#64748B' : '#94A3B8' }}>
                This module is in development. Updates coming soon.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Module Card ────────────────────────────────────────────────────────── */
function ModuleCard({ mod, onClick, isDark }) {
  const c = COLORS[mod.color];
  const Icon = mod.icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${mod.label}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        position: 'relative',
        background: isDark ? '#111D35' : '#FFFFFF',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
        borderRadius: 16,
        padding: '22px 22px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
        // accent top bar
        borderTop: `3px solid ${c.icon}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isDark
          ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${c.icon}33`
          : `0 8px 24px ${c.glow}, 0 0 0 1px ${c.icon}22`;
        e.currentTarget.style.borderColor = isDark ? `${c.icon}55` : `${c.icon}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
      }}
    >
      {/* Status badge */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '3px 8px', borderRadius: 20,
          background: isDark ? c.badge.bgD : c.badge.bg,
          color: isDark ? c.badge.textD : c.badge.text,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {mod.active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />}
          {mod.active ? 'Live' : mod.badge}
        </span>
      </div>

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: isDark ? c.iconBgD : c.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <Icon style={{ width: 22, height: 22, color: c.icon }} />
      </div>

      {/* Title & description */}
      <div style={{ flex: 1, paddingRight: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#E2E8F0' : '#0F172A', marginBottom: 6, letterSpacing: '-0.01em' }}>
          {mod.label}
        </h3>
        <p style={{ fontSize: 12, lineHeight: 1.55, color: isDark ? '#64748B' : '#64748B' }}>
          {mod.shortDesc}
        </p>
      </div>

      {/* Footer CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.icon }}>
          {mod.active ? 'View Dashboard' : 'Preview Details'}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: isDark ? c.iconBgD : c.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronRight style={{ width: 14, height: 14, color: c.icon }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function LandingPage({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const [activeDrawer, setActiveDrawer] = useState(null); // module id

  const openedMod = activeDrawer ? MODULES.find((m) => m.id === activeDrawer) : null;

  const bgColor = isDark ? '#080F1E' : '#F0F4F8';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bgColor }}>

      {/* ─── Ambient glow (dark only) */}
      {isDark && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.1) 0%, transparent 70%)',
        }} />
      )}

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0D2040 100%)',
        minHeight: 60,
        boxShadow: '0 2px 16px rgba(0,0,0,0.28)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Left branding lockup: TCS Logo + IAE Division + Divider + Crystal Ball */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* TCS Logo */}
          <div style={{ background: 'rgba(255,255,255,0.97)', padding: '4px 10px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
            <img src={TCSLogo} alt="TCS" style={{ height: 26, width: 'auto', display: 'block' }} />
          </div>

          {/* Division Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
              Industrial Autonomy
            </span>
            <span style={{ fontSize: 8.5, letterSpacing: '0.05em', color: '#93C5FD' }}>
              &amp; Engineering Division
            </span>
          </div>

          {/* Subtle Vertical Divider */}
          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />

          {/* Crystal Ball Platform Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', margin: 0, lineHeight: 1 }}>
              Crystal Ball
            </h1>
            <span style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: '#93C5FD',
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(147,197,253,0.3)',
              padding: '2px 9px',
              borderRadius: 12,
              letterSpacing: '0.02em',
            }}>
              Analytics Platform
            </span>
          </div>
        </div>

        {/* Right Section: Status Indicator & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* <div
            className="hidden sm:flex items-center gap-2"
            style={{
              padding: '4px 12px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span>6 Modules Live</span>
          </div> */}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </header>

      {/* ─── KPI ticker ──────────────────────────────────────────────────── */}
      {/* <div style={{
        position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
        background: isDark ? 'rgba(10,18,38,0.95)' : 'rgba(22,40,70,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3B82F6', marginRight: 20, flexShrink: 0 }}>
            Platform Metrics
          </span>
          {LIVE_METRICS.map((m, i) => (
            <div key={m.label} style={{
              display: 'flex', flexDirection: 'column', padding: '10px 20px', flexShrink: 0,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#FFFFFF', lineHeight: 1 }}>
                {m.value}
              </span>
              <span style={{ fontSize: 9.5, letterSpacing: '0.03em', color: '#64748B', marginTop: 3 }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div> */}

      {/* ─── Main content ─────────────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 24px' }}>

        {/* Page intro */}
        <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
            padding: '5px 14px', borderRadius: 20,
            background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.07)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.15)'}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#93C5FD' : '#1D4ED8' }}>
              Engineering Expo 2026 · Analytical Intelligence Platform
            </span>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: isDark ? '#E2E8F0' : '#0F172A', marginBottom: 10 }}>
            Welcome to Crystal Ball
          </h2>
          {/* <p style={{ fontSize: 14, lineHeight: 1.65, color: isDark ? '#64748B' : '#475569' }}>
            All 6 enterprise analytics modules are now live: <strong>Revenue Performance</strong>, <strong>Finance Performance</strong>, <strong>Sales Performance</strong>, <strong>DEG Performance</strong>, <strong>RMG Performance</strong>, and <strong>Account Performance</strong>.
          </p> */}
        </div>

        {/* 6 Module cards — 3×2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
          width: '100%',
          maxWidth: 960,
        }}>
          {MODULES.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isDark={isDark}
              onClick={() => setActiveDrawer(mod.id)}
            />
          ))}
        </div>
      </main>

      {/* ─── Drawer ─────────────────────────────────────────────────────── */}
      <Drawer
        mod={openedMod}
        isDark={isDark}
        onClose={() => setActiveDrawer(null)}
        onEnter={() => {
          setActiveDrawer(null);
          const id = openedMod?.id;
          const dest = id === 'finance' ? 'finance' : id === 'sales' ? 'sales' : id === 'deg' ? 'deg' : id === 'rmg' ? 'rmg' : id === 'account' ? 'account' : 'revenue';
          onNavigate(dest);
        }}
      />
    </div>
  );
}
