'use client';
import React, { useEffect } from 'react';

type AlertType = 'success' | 'error' | 'warning';

interface Props {
  message: string;
  type?: AlertType;
  onClose: () => void;
}

const config: Record<AlertType, { iconBg: string; iconColor: string; title: string; icon: React.ReactNode }> = {
  success: {
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    title: 'Sucesso!',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    title: 'Erro',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  warning: {
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    title: 'Atenção',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

export default function AdminAlertModal({ message, type = 'success', onClose }: Props) {
  const { iconBg, iconColor, title, icon } = config[type];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="admin-modal-overlay"
      style={{ zIndex: 60 }}
      onClick={onClose}
    >
      <div
        className="admin-modal"
        style={{ maxWidth: 380, textAlign: 'center', padding: '36px 32px' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {icon}
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: iconColor, marginBottom: 8 }}>
          {title}
        </h3>

        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-wrap' }}>
          {message}
        </p>

        <button
          className="admin-btn-primary"
          onClick={onClose}
          style={{ minWidth: 100 }}
          autoFocus
        >
          OK
        </button>
      </div>
    </div>
  );
}
