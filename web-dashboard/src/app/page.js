"use client";
import React, { useState, useEffect } from 'react';
import { 
  SquareTerminal, BarChart, Settings2, Trash2, ShieldCheck, 
  Activity, ArrowUpRight, Cpu, HardDrive, Leaf, Orbit, Focus,
  ChevronDown, Search, Box, History, Users, LogOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VercelStyleDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', error: '', loading: false });
  
  const [vision, setVision] = useState({ state: 'scanning', type: 'organic', prob: 0, box: { top: 20, left: 20, w: 60, h: 60 }});
  const [logs, setLogs] = useState([
    { id: 1, time: '14:42:05', type: 'inorganic', item: 'Plastic Water Bottle', prob: 98.2 },
    { id: 2, time: '14:38:12', type: 'organic', item: 'Apple Core', prob: 91.1 },
  ]);
  const [caps, setCaps] = useState({ org: 24, inorg: 65 });

  useEffect(() => {
    setMounted(true);
    if(window.localStorage.getItem('visiobin_auth') === 'true') {
       setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);

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

  if(!mounted || isCheckingAuth) return null; // Prevent hydration error and wait for auth check

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginForm(p => ({ ...p, loading: true, error: '' }));
    try {
      // Connect to Go Backend Auth
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username: loginForm.username || "admin2", password: loginForm.password || "admin123" })
      });
      // Even if it fails, we will fallback to local UI bypass for showcase purposes
      if (res.ok || (loginForm.username === 'admin2' && loginForm.password === 'admin123')) {
        localStorage.setItem('visiobin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginForm(p => ({ ...p, error: 'Invalid credentials. (Hint: admin2 / admin123)' }));
      }
    } catch (err) {
      if (loginForm.username === 'admin' && loginForm.password === 'admin') {
         localStorage.setItem('visiobin_auth', 'true');
         setIsAuthenticated(true);
      }
      else setLoginForm(p => ({ ...p, error: 'Server offline. Local bypass: admin / admin' }));
    } finally {
      setLoginForm(p => ({ ...p, loading: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#000' }}>
         {/* LEFT PANE - Branding / SVG */}
         <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: 60, position: 'relative', overflow: 'hidden', background: '#050505', backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(16,185,129,0.05) 0%, transparent 60%)' }}>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{ width: 44, height: 44, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
                  <Trash2 size={24} color="#000" strokeWidth={2.5} />
               </div>
               <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>VisioBin Core</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: 40 }}>
               {/* Massive SVG Trash Bin illustration */}
               <svg width="180" height="240" viewBox="0 0 100 120" style={{ margin: '0 0 40px 0', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
                  <defs>
                     <linearGradient id="loginGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" style={{stopColor:'rgba(255,255,255,0.1)'}}/>
                       <stop offset="100%" style={{stopColor:'rgba(255,255,255,0.02)'}}/>
                     </linearGradient>
                  </defs>
                  <path d="M15,20 L85,20 L75,115 L25,115 Z" fill="url(#loginGlass)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M5,20 L95,20" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M50,20 L50,115" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4,4"/>
                  
                  {/* Organic Glow */}
                  <rect x="22" width="22" rx="2" fill="var(--brand-organic)" opacity="0.9" height="50" y="60" style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.4))' }} />
                  {/* Inorganic Glow */}
                  <rect x="56" width="22" rx="2" fill="var(--brand-inorganic)" opacity="0.9" height="75" y="35" style={{ filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.4))' }} />
               </svg>

               <h2 style={{ fontSize: 40, fontWeight: 600, color: '#fff', letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>Smart Edge AI<br/>Sorting Terminal.</h2>
               <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>Experience next-generation automated waste classification powered by neural vision models. Built for absolute precision.</p>
            </div>
         </div>

         {/* RIGHT PANE - Login Form */}
         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#000' }}>
            <div style={{ width: '100%', maxWidth: 360 }}>
               
               <h1 style={{ fontSize: 26, fontWeight: 600, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>Sign in securely</h1>
               <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 40 }}>Enter your credentials to access the console</p>
               
               <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Username</label>
                    <input type="text" value={loginForm.username} onChange={e=>setLoginForm(p=>({...p, username: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s' }} placeholder="admin2" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Password</label>
                    <input type="password" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p, password: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s' }} placeholder="••••••••" required />
                  </div>
                  
                  {loginForm.error && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 10, borderRadius: 6 }}>{loginForm.error}</div>}
                  
                  <button type="submit" disabled={loginForm.loading} style={{ width: '100%', padding: '14px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, marginTop: 12, cursor: 'pointer', transition: 'all 0.2s', opacity: loginForm.loading ? 0.7 : 1 }}>
                    {loginForm.loading ? 'Authenticating...' : 'Sign In to Edge'}
                  </button>
               </form>

               <div style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                  <ShieldCheck size={14} color="var(--brand-organic)" /> Secured by VisioBin Zero-Trust Protocol
               </div>
               
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 
        ========================================
        SIDEBAR
        ========================================
      */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 30, height: 30, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
             <Trash2 size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>VisioBin</span>
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
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginLeft: -12, marginRight: -12 }} className="nav-item">
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                IF
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Ifauze</div>
               <div style={{ fontSize: 11, color: 'var(--brand-organic)', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{width: 6, height: 6, background: 'var(--brand-organic)', borderRadius: '50%'}}></div> Online</div>
             </div>
          </div>
          
          <div onClick={() => { localStorage.removeItem('visiobin_auth'); setIsAuthenticated(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginLeft: -12, marginRight: -12, color: '#ef4444' }} className="nav-item">
             <LogOut size={16} />
             <span style={{ fontSize: 13, fontWeight: 500 }}>Sign Out Terminal</span>
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
