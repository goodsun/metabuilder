import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, subMessage }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'rgba(5, 6, 10, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        minWidth: '300px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.15)',
          borderTop: '4px solid rgba(255, 255, 255, 0.7)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        {message && (
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '500',
            color: '#f6f6f6',
            textAlign: 'center',
          }}>
            {message}
          </div>
        )}

        {subMessage && (
          <div style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            {subMessage}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
