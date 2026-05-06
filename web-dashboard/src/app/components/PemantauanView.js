import React, { useState } from 'react';
import { Video, Wifi, AlertTriangle, Clock3, VideoOff, RefreshCw, Settings2, Activity } from 'lucide-react';
import { liveFeedSummary, liveFeedStreams as initialStreams, liveEventQueue } from '../dashboardData';
import EmptyState from './shared/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

const ICONS_MAP = {
  'Stream Aktif': Video,
  'Uptime Jaringan': Wifi,
  'Peringatan Kritis': AlertTriangle,
  'Active Streams': Video,
  'Network Uptime': Wifi,
  'Critical Alerts': AlertTriangle
};

export default function PemantauanView() {
  const t = useTranslations('monitoring');
  const locale = useLocale();
  const [streams, setStreams] = useState(initialStreams);
  const [streamUrl, setStreamUrl] = useState("https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-warehouse-at-night-42283-large.mp4");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [tempUrl, setTempUrl] = useState(streamUrl);

  const activeStreams = streams.filter(s => s.status !== 'offline');
  const allOffline = activeStreams.length === 0;

  const handleReconnect = () => {
    setStreams(initialStreams);
  };

  const handleSaveConfig = () => {
    setStreamUrl(tempUrl);
    setIsConfiguring(false);
  };

  // Helper to translate summary labels from dashboardData
  const getTranslatedLabel = (label) => {
    if (label === 'Stream Aktif') return t('activeStreams');
    if (label === 'Uptime Jaringan') return t('uptime');
    if (label === 'Peringatan Kritis') return t('alerts');
    return label;
  };

  const getTranslatedNote = (label, note) => {
    if (label === 'Stream Aktif') return allOffline ? t('allOffline') : note;
    return note;
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 24, marginBottom: 24 }}>
        {liveFeedSummary.map(item => {
          const ItemIcon = ICONS_MAP[item.label] || Video;
          return (
            <motion.div 
              key={item.label} 
              className="card live-summary-card"
              whileHover={{ y: -5 }}
            >
              <div className="card-title">
                <ItemIcon size={16} color={item.tone} /> {getTranslatedLabel(item.label)}
              </div>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-1px', marginTop: 8 }}>
                {allOffline && item.label === 'Stream Aktif' ? '0' : item.value}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                {getTranslatedNote(item.label, item.note)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 450, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, 
            padding: '20px 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div className="card-title" style={{ margin: 0, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
              <Video size={16} /> {t('streamMatrix')}
            </div>
            <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>
              <button 
                onClick={() => setIsConfiguring(!isConfiguring)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Settings2 size={12} /> {isConfiguring ? t('cancel') : t('configure')}
              </button>
              {allOffline && (
                <button 
                  onClick={handleReconnect}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={12} /> {t('refresh')}
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isConfiguring && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ 
                  overflow: 'hidden', 
                  zIndex: 20, 
                  position: 'absolute', 
                  top: 70, left: 24, right: 24,
                  background: 'rgba(10,10,10,0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('configTitle')}</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder={t('placeholder')}
                      style={{ 
                        flex: 1, 
                        background: 'var(--bg-page)', 
                        border: '1px solid var(--border-color)', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        color: 'var(--text-main)',
                        fontSize: 13
                      }}
                    />
                    <button onClick={handleSaveConfig} className="btn-primary" style={{ padding: '8px 20px' }}>{t('apply')}</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    {t('tip')}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="live-feed-grid" style={{ flex: 1, marginTop: 0, gap: 0, gridTemplateColumns: '1fr', height: '100%' }}>
            <AnimatePresence>
              {allOffline ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ gridColumn: '1 / -1', padding: '40px 0' }}
                >
                  <EmptyState 
                    icon={VideoOff}
                    title={t('emptyTitle')}
                    description={t('emptyDesc')}
                    action={t('reconnect')}
                    onAction={handleReconnect}
                  />
                </motion.div>
              ) : (
                streams.map(s => (
                  <motion.div 
                    key={s.id} 
                    className="live-feed-tile"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ flex: 1, height: '100%', position: 'relative', border: 'none', borderRadius: 0 }}
                  >
                      <div
                        className="live-feed-preview"
                        style={{
                          backgroundColor: s.status === 'offline' ? 'rgba(0,0,0,0.4)' : '#000',
                          position: 'absolute',
                          inset: 0,
                          height: '100%',
                          borderBottom: 'none'
                        }}
                      >
                        {s.status !== 'offline' && (
                          <>
                            <video 
                              key={streamUrl}
                              autoPlay 
                              muted 
                              loop 
                              playsInline
                              style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 1,
                                filter: 'contrast(1.05) brightness(1)'
                              }}
                            >
                              <source src={streamUrl} type="video/mp4" />
                            </video>
                            
                            <div className="live-feed-scan" style={{ opacity: 0.3 }} />
                            
                            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 5 }}>
                              <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', letterSpacing: '1px' }}>REC</span>
                            </div>
                            
                            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, color: '#fff', fontFamily: 'monospace', textShadow: '0 1px 4px rgba(0,0,0,0.8)', zIndex: 5 }}>
                              {new Date().toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US')}
                            </div>
                            
                            <div style={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              left: 0, 
                              right: 0, 
                              padding: '40px 16px 16px',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                              zIndex: 5
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                  <div style={{ fontSize: 10, color: 'var(--brand-organic)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{s.id}</div>
                                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{s.zone}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                                    <Activity size={12} color="var(--brand-organic)" />
                                    <span className="mono">{(2.4 + Math.random()).toFixed(1)} Mbps</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.latency} latency</div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {s.status === 'offline' && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                            <VideoOff size={40} color="rgba(255,255,255,0.2)" />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{t('signalLost')}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="card" style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><Clock3 size={16} /> {t('eventQueue')}</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {liveEventQueue.length > 0 ? (
              liveEventQueue.map(ev => (
                <motion.div 
                  key={ev.id} 
                  className="event-item"
                  whileHover={{ x: 4, background: 'var(--bg-hover)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.type}</div>
                    <span className={`severity-chip ${ev.severity.toLowerCase()}`}>{ev.severity}</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{ev.source}</span>
                    <span className="mono">{ev.age}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState 
                title={t('noEvents')} 
                description={t('allNormal')}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}