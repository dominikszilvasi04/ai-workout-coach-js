import React from 'react';
import './Modal.css'; // We will create this file next

const Modal = ({ isOpen, onClose, title, options, onSelect }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          {options.map((option) => (
            <button key={option} onClick={() => onSelect(option)} className="option-button">
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Modal;