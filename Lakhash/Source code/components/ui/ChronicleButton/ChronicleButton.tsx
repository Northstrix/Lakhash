"use client"
import React from 'react';
import styles from './ChronicleButton.module.css';

interface ChronicleButtonProps {
  text: string;
  isDelete?: boolean;
  onClick?: () => void;  // Add this line
}

const ChronicleButton: React.FC<ChronicleButtonProps> = ({ text, isDelete = false, onClick }) => {
  return (
    <button 
      className={`${styles.chronicleButton} ${isDelete ? styles.deleteButton : ''}`}
      onClick={onClick}  // Add this line
    >
      <span><em>{text}</em></span>
      <span><em>{text}</em></span>
    </button>
  );
};

export default ChronicleButton;