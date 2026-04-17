"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trash2, 
  LineChart, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Droplets,
  Activity,
  Bell,
  Search,
  CheckCircle2,
  Menu
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Poll dashboard summary API every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Authenticate as admin
        const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({username: "admin2", password: "admin123"})
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.token;

        if (token) {
          const summaryRes = await fetch("http://localhost:8080/api/v1/dashboard/summary", {
            headers: {"Authorization": `Bearer ${token}`}
          });
          const summaryData = await summaryRes.json();
          setData(summaryData.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Live updates
    return () => clearInterval(interval);
  }, []);

  // Mock chart data for visualization since backend history might not be enough yet
  const chartData = [
    { time: '08:00', organic: 12, inorganic: 8 },
    { time: '09:00', organic: 18, inorganic: 15 },
    { time: '10:00', organic: 25, inorganic: 22 },
    { time: '11:00', organic: 35, inorganic: 30 },
    { time: '12:00', organic: 48, inorganic: 41 },
    { time: '13:00', organic: 52, inorganic: 45 },
    { time: '14:00', organic: 61, inorganic: 52 }
  ];

  if (loading && !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" style={{width: 32, height: 32}}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel" style={{borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0}}>
        <div className="logo-container">
          <div className="logo-icon">
            <Trash2 color="white" size={20} />
          </div>
          <span className="logo-text">VISIOBIN</span>
        </div>

        <nav className="nav-menu" style={{marginTop: 24}}>
          <div className="nav-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <Trash2 size={20} />
            <span>Bin Tracker</span>
          </div>
          <div className="nav-item">
            <LineChart size={20} />
            <span>Analytics</span>
          </div>
          <div className="nav-item">
            <AlertTriangle size={20} />
            <span>Alerts</span>
            {data?.unread_alerts > 0 && (
              <span style={{marginLeft: 'auto', background: 'var(--status-danger)', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem'}}>
                {data.unread_alerts}
              </span>
            )}
          </div>
        </nav>

        <div style={{marginTop: 'auto'}}>
          <div className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </div>
          <div className="nav-item">
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <h1 className="page-title">Overview</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,230,118,0.1)', color: 'var(--status-organic)', padding: '4px 12px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 500}}>
                <div className="pulse-dot"></div>
                Live Systems Normal
              </div>
            </div>
            <p className="page-subtitle">Real-time waste monitoring & analytics</p>
          </div>
          
          <div style={{display: 'flex', gap: 20, alignItems: 'center'}}>
            <div className="glass-panel" style={{padding: '12px 16px', display: 'flex', gap: 12, borderRadius: 50}}>
              <Search size={20} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search bins, alerts..." 
                style={{background: 'transparent', border: 'none', color: 'white', outline: 'none', width: 200}}
              />
            </div>
            <div style={{position: 'relative'}}>
              <Bell size={24} />
              {data?.unread_alerts > 0 && (
                <div style={{position: 'absolute', top: -5, right: -5, width: 10, height: 10, borderRadius: '50%', background: 'var(--status-danger)'}}></div>
              )}
            </div>
            <div className="user-profile">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 600, fontSize: '0.95rem'}}>Admin User</div>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>System Manager</div>
              </div>
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=7000ff&color=fff" alt="User" className="avatar" />
            </div>
          </div>
        </header>

        {/* Top Stats */}
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-header">
              <span>Total Active Bins</span>
              <div className="stat-icon-wrapper" style={{background: 'rgba(0, 240, 255, 0.1)'}}>
                <Trash2 color="var(--accent-primary)" size={24} />
              </div>
            </div>
            <div>
              <div className="stat-value">{data?.active_bins || 0}</div>
              <div className="stat-trend trend-up">
                <CheckCircle2 size={16} /> All systems operational
              </div>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-header">
              <span>AI Classifications Today</span>
              <div className="stat-icon-wrapper" style={{background: 'rgba(112, 0, 255, 0.1)'}}>
                <Activity color="var(--accent-secondary)" size={24} />
              </div>
            </div>
            <div>
              <div className="stat-value">{data?.total_classifications_today || 0}</div>
              <div className="stat-trend trend-up">
                +{((data?.organic_count_today || 0) + (data?.inorganic_count_today || 0))} New Items
              </div>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-header">
              <span>Average Fill Level</span>
              <div className="stat-icon-wrapper" style={{background: 'rgba(255, 234, 0, 0.1)'}}>
                <LineChart color="var(--status-warning)" size={24} />
              </div>
            </div>
            <div>
              <div className="stat-value">54%</div> {/* Mocked avg */}
              <div className="stat-trend trend-up">
                Organic: {data?.organic_count_today || 0} | Inorganic: {data?.inorganic_count_today || 0}
              </div>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-header">
              <span>Bins Near Full</span>
              <div className="stat-icon-wrapper" style={{background: 'rgba(255, 23, 68, 0.1)'}}>
                <AlertTriangle color="var(--status-danger)" size={24} />
              </div>
            </div>
            <div>
              <div className="stat-value">{data?.bins_near_full || 0}</div>
              <div className="stat-trend trend-down">
                Requires immediate collection
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Chart Section */}
          <div className="chart-section glass-panel">
            <h2 className="section-title">
              <Activity size={20} /> Volume Fill Rate (Today)
            </h2>
            <div style={{height: 300, width: '100%', marginTop: 24}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-organic)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--status-organic)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInorganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-inorganic)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--status-inorganic)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff'}}
                    itemStyle={{color: '#fff'}}
                  />
                  <Area type="monotone" dataKey="organic" name="Organic Volume" stroke="var(--status-organic)" strokeWidth={3} fillOpacity={1} fill="url(#colorOrganic)" />
                  <Area type="monotone" dataKey="inorganic" name="Inorganic Volume" stroke="var(--status-inorganic)" strokeWidth={3} fillOpacity={1} fill="url(#colorInorganic)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Alerts Section */}
          <div className="list-section glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
            <h2 className="section-title">
              <Bell size={20} /> System Alerts
            </h2>
            <div style={{flex: 1, overflowY: 'auto', paddingRight: 8}}>
              {data?.recent_alerts && data.recent_alerts.length > 0 ? (
                data.recent_alerts.map((alert, idx) => (
                  <div key={idx} className="alert-item">
                    <div className="alert-icon">
                      {alert.severity === 'critical' ? (
                        <div style={{background: 'rgba(255,23,68,0.1)', padding: 8, borderRadius: '50%'}}>
                           <AlertTriangle size={18} color="var(--status-danger)" />
                        </div>
                      ) : (
                        <div style={{background: 'rgba(255,234,0,0.1)', padding: 8, borderRadius: '50%'}}>
                           <AlertTriangle size={18} color="var(--status-warning)" />
                        </div>
                      )}
                    </div>
                    <div className="alert-content">
                      <h4>{alert.bin_name}</h4>
                      <p>{alert.message}</p>
                      <div className="alert-time">{new Date(alert.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40}}>
                  <CheckCircle2 size={48} style={{opacity: 0.2, marginBottom: 16, margin: '0 auto'}} />
                  <p>All systems clear.<br/>No active alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bin Live Status */}
        <div>
          <h2 className="section-title" style={{marginTop: 16}}>
            <LayoutDashboard size={20} /> Bin Stations Live Status
          </h2>
          <div className="bin-grid">
            {data?.bin_statuses && data.bin_statuses.map((bin) => {
              const organicPct = bin.volume_organic_pct || 0;
              const inorganicPct = bin.volume_inorganic_pct || 0;
              const gasLabel = bin.gas_amonia_ppm ? `${bin.gas_amonia_ppm.toFixed(1)} ppm` : 'Unknown';
              
              const getBarColorClass = (pct) => {
                if (pct >= 90) return 'fill-danger';
                if (pct >= 75) return 'fill-warning';
                return 'fill-organic';
              };
              
              const getInorganicBarColor = (pct) => {
                if (pct >= 90) return 'fill-danger';
                if (pct >= 75) return 'fill-warning';
                return 'fill-inorganic';
              };

              return (
                <div key={bin.bin_id} className="bin-card glass-panel">
                  <div className="bin-header">
                    <div>
                      <div className="bin-title">{bin.bin_name}</div>
                      <div className="bin-id">ID: {bin.bin_id.split('-')[0]}</div>
                    </div>
                    {bin.status === 'active' ? 
                      <span className="glass-pill" style={{color: 'var(--status-organic)', border: '1px solid var(--status-organic)'}}>Active</span> :
                      <span className="glass-pill" style={{color: 'var(--text-secondary)'}}>Inactive</span>
                    }
                  </div>

                  <div className="progress-container">
                    <div className="progress-label">
                      <span>Organic Compartment</span>
                      <span style={{fontWeight: 600, color: organicPct >= 80 ? 'var(--status-danger)' : 'white'}}>{organicPct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${getBarColorClass(organicPct)}`} style={{width: `${organicPct}%`}}></div>
                    </div>
                  </div>

                  <div className="progress-container">
                    <div className="progress-label">
                      <span>Inorganic Compartment</span>
                      <span style={{fontWeight: 600, color: inorganicPct >= 80 ? 'var(--status-danger)' : 'white'}}>{inorganicPct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${getInorganicBarColor(inorganicPct)}`} style={{width: `${inorganicPct}%`}}></div>
                    </div>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                      <Droplets size={16} color={bin.gas_amonia_ppm > 25 ? 'var(--status-warning)' : 'var(--text-secondary)'} />
                      <span style={{color: bin.gas_amonia_ppm > 25 ? 'var(--status-warning)' : 'inherit'}}>
                        Gas: {gasLabel}
                      </span>
                    </div>
                    
                    <button style={{
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
