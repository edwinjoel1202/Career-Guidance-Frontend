import React from 'react';

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={() => onClose && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost small" onClick={onClose}>Close</button>
          </div>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
