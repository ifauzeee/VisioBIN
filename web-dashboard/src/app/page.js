"use client";
import React, { useState, useEffect } from 'react';
import { 
  SquareTerminal, BarChart, Settings2, Trash2, ShieldCheck, 
  Activity, ArrowUpRight, Cpu, HardDrive, Leaf, Orbit, Focus,
  ChevronDown, Search, Box, History, Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VercelStyleDashboard() {
  const [mounted, setMounted] = useState(false);
  const [vision, setVision] = useState({ state: 'scanning', type: 'organic', prob: 0, box: { top: 20, left: 20, w: 60, h: 60 }});
  const [logs, setLogs] = useState([
    { id: 1, time: '14:42:05', type: 'inorganic', item: 'Plastic Water Bottle', prob: 98.2 },
    { id: 2, time: '14:38:12', type: 'organic', item: 'Apple Core', prob: 91.1 },
  ]);
  const [caps, setCaps] = useState({ org: 24, inorg: 65 });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      // Simulate detection
      const isOrg = Math.random() > 0.4;
      setVision(v => ({
        state: 'locked',
        type: isOrg ? 'organic' : 'inorganic',
        prob: +(Math.random() * 8 + 91).toFixed(1),
        box: { top: Math.random() * 40 + 10, left: Math.random() * 40 + 10, w: 30, h: 40 }
      }));
      
      setTimeout(() => {
        setVision(v => ({...v, state: 'scanning'}));
      }, 2000);

      // Add log
      setLogs(prev => [{
        id: Date.now(), 
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type: isOrg ? 'organic' : 'inorganic', 
        item: isOrg ? 'Banana Peel' : 'Soda Can', 
        prob: +(Math.random() * 8 + 91).toFixed(1)
      }, ...prev].slice(0, 5));

      // Update caps
      if(isOrg) setCaps(c => ({...c, org: Math.min(c.org + 1, 100)}));
      else setCaps(c => ({...c, inorg: Math.min(c.inorg + 1, 100)}));

    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const graphData = [
    { time: '09:00', org: 5, inorg: 10 },
    { time: '10:00', org: 12, inorg: 25 },
    { time: '11:00', org: 18, inorg: 42 },
    { time: '12:00', org: 20, inorg: 48 },
    { time: '13:00', org: 24, inorg: 60 },
    { time: '14:00', org: caps.org, inorg: caps.inorg },
  ];

  if(!mounted) return null; // Prevent hydration error

  return (
    <div className="app-container">
      {/* 
        ========================================
        SIDEBAR
        ========================================
      */}
      <aside className="sidebar">
        {/* Workspace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', marginBottom: 24, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Trash2 size={14} color="#000" strokeWidth={2.5}/>
            </div>
            <div>
               <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Ifauze's Org</div>
               <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Plan</div>
            </div>
          </div>
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>

        {/* Global Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
           <Search size={14} color="#666" style={{ position: 'absolute', left: 12, top: 9 }} />
           <input type="text" placeholder="Search..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none', transition: 'border 0.2s' }} />
        </div>

        {/* Navigation Categories */}
        <nav style={{ flex: 1, overflowY: 'auto', marginRight: -8, paddingRight: 8 }} className="custom-scrollbar">
          <div className="sidebar-section">Monitoring</div>
          <div className="nav-item active"><SquareTerminal size={16} /> <span style={{ flex: 1 }}>Overview</span></div>
          <div className="nav-item"><Activity size={16} /> <span style={{ flex: 1 }}>Live Feeds</span></div>
          <div className="nav-item"><BarChart size={16} /> <span style={{ flex: 1 }}>Analytics</span></div>
          
          <div className="sidebar-section">Fleet Management</div>
          <div className="nav-item">
            <Box size={16} /> <span style={{ flex: 1 }}>Bin Stations</span> 
            <div style={{ background: 'var(--border-color)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#fff' }}>12</div>
          </div>
          <div className="nav-item"><History size={16} /> <span style={{ flex: 1 }}>Maintenance Log</span></div>

          <div className="sidebar-section">Settings</div>
          <div className="nav-item"><Users size={16} /> <span style={{ flex: 1 }}>Team Members</span></div>
          <div className="nav-item"><Settings2 size={16} /> <span style={{ flex: 1 }}>Configuration</span></div>
        </nav>

        {/* User / Status Block at Bottom */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginLeft: -12, marginRight: -12 }} className="nav-item">
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                IF
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Ifauze</div>
               <div style={{ fontSize: 11, color: 'var(--brand-organic)', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{width: 6, height: 6, background: 'var(--brand-organic)', borderRadius: '50%'}}></div> Online</div>
             </div>
             <Settings2 size={14} color="#666" />
          </div>
        </div>
      </aside>

      {/* 
        ========================================
        MAIN CONTENT
        ========================================
      */}
      <main className="main-content">
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1px', marginBottom: 8 }}>System Overview</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Real-time telemetry and AI sorting analysis.</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
             <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} color="var(--brand-organic)" />
                <span style={{ fontSize: 13, fontWeight: 500 }}>All Systems Nominal</span>
             </div>
          </div>
        </header>

        {/* 
          LAYOUT GRID
          1 Row of top level metrics
          1 Row for massive Camera Feed + Hardware status
          1 Row for Charts + Logs
        */}
        
        {/* --- METRICS ROW --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card">
            <div className="card-title"><Leaf size={16} color="var(--brand-organic)" /> Organic Processed</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{caps.org}</span>
              <span style={{ color: 'var(--brand-organic)', fontSize: 13, display: 'flex', alignItems: 'center' }}><ArrowUpRight size={14}/> 12%</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title"><HardDrive size={16} color="var(--brand-inorganic)" /> Inorganic Processed</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{caps.inorg}</span>
              <span style={{ color: 'var(--brand-inorganic)', fontSize: 13, display: 'flex', alignItems: 'center' }}><ArrowUpRight size={14}/> 8%</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Orbit size={16} /> CO₂ Reduced</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>1.2</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>kg</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Cpu size={16} /> Edge Latency</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>14</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ms</span>
            </div>
          </div>
        </div>

        {/* --- VISUALIZATION ROW --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
          
          {/* CAMERA FEED */}
          <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ margin: 0 }}><Focus size={16} /> AI Vision Engine</div>
              <div style={{ width: 8, height: 8, background: vision.state === 'locked' ? 'var(--brand-organic)' : 'var(--text-muted)', borderRadius: '50%' }}></div>
            </div>
            <div className="scanner-container" style={{ height: 320 }}>
               {vision.state === 'scanning' && <div className="scan-laser"></div>}
               
               <div className="bounding-box" style={{
                 opacity: vision.state === 'locked' ? 1 : 0,
                 borderColor: vision.type === 'organic' ? 'var(--brand-organic)' : 'var(--brand-inorganic)',
                 top: `${vision.box.top}%`, left: `${vision.box.left}%`,
                 width: `${vision.box.w}%`, height: `${vision.box.h}%`
               }}>
                 <div className="mono" style={{ 
                   position: 'absolute', top: -25, left: -1, 
                   background: vision.type === 'organic' ? 'var(--brand-organic)' : 'var(--brand-inorganic)',
                   color: '#000', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4
                 }}>
                   {vision.type.toUpperCase()} {(vision.prob).toFixed(1)}%
                 </div>
               </div>
            </div>
          </div>

          {/* INTERNAL HARDWARE SVG DASHBOARD */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-title"><Activity size={16} /> Hardware Reservoir</div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
               <svg width="200" height="220" viewBox="0 0 100 120">
                  <path d="M10,20 L90,20 L80,110 L20,110 Z" fill="none" stroke="var(--border-hover)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M0,20 L100,20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M50,20 L50,110" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4,4"/>
                  
                  {/* Organic Fill Rectangle */}
                  <rect x="18" width="28" rx="2" fill="var(--brand-organic)" opacity="0.9"
                        height={(caps.org / 100) * 85} y={110 - ((caps.org / 100) * 85)} 
                        style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  
                  {/* Inorganic Fill Rectangle */}
                  <rect x="54" width="28" rx="2" fill="var(--brand-inorganic)" opacity="0.9"
                        height={(caps.inorg / 100) * 85} y={110 - ((caps.inorg / 100) * 85)} 
                        style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
               </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
               <div>
                 <div style={{ fontSize: 12, color: 'var(--brand-organic)' }}>Organic Capacity</div>
                 <div style={{ fontSize: 24, fontWeight: 600 }}>{caps.org}%</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: 12, color: 'var(--brand-inorganic)' }}>Inorganic Capacity</div>
                 <div style={{ fontSize: 24, fontWeight: 600 }}>{caps.inorg}%</div>
               </div>
            </div>
          </div>
        </div>

        {/* --- CHARTS AND LOGS ROW --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          
          <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <div className="card-title">Volume History Tracker</div>
            <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                  <defs>
                    <linearGradient id="gOrg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-organic)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--brand-organic)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gInorg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-inorganic)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--brand-inorganic)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid var(--border-color)', borderRadius: 8 }} itemStyle={{ color: '#fff' }}/>
                  <Area type="monotone" dataKey="org" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gOrg)" />
                  <Area type="monotone" dataKey="inorg" stroke="var(--brand-inorganic)" strokeWidth={2} fill="url(#gInorg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
             <div className="card-title">Recent Activity</div>
             <div style={{ flex: 1, overflowY: 'auto', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{log.item}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{log.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: 11, textTransform: 'uppercase', color: log.type === 'organic' ? 'var(--brand-organic)' : 'var(--brand-inorganic)' }}>{log.type}</div>
                       <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{log.prob}%</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>

      </main>
    </div>
  );
}
