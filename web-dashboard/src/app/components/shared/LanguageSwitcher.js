'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setUserLocale } from '@/services/locale';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTransition, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' }
  ];

  const handleSelect = (nextLocale) => {
    setIsOpen(false);
    if (nextLocale === locale) return;
    
    startTransition(async () => {
      await setUserLocale(nextLocale);
      router.refresh();
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={containerRef}>



      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="lang-pill"
      >
        <div className="lang-pill-icon">
          <Globe size={16} />
        </div>
        <div style={{ width: '1px', height: '12px', background: 'var(--border-color)', margin: '0 2px' }} />
        <span className="lang-pill-text">
          {locale}
        </span>
        <ChevronDown 
          size={12} 
          style={{ 
            color: 'var(--text-muted)',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="lang-dropdown"
            style={{ right: 0 }}
          >

            <div style={{ padding: '6px' }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`lang-option ${locale === lang.code ? 'active' : ''}`}
                >
                  <div className="lang-option-content">
                    <span className="lang-option-flag">{lang.flag}</span>
                    <span className="lang-option-label">{lang.label}</span>
                  </div>
                  {locale === lang.code && (
                    <div className="lang-check">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div style={{ 
              padding: '10px 16px', 
              background: 'rgba(255,255,255,0.02)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                SELECT LANGUAGE
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--brand-inorganic)', opacity: 0.5 }} />
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--brand-inorganic)', opacity: 0.3 }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



