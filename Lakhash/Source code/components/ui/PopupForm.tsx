"use client"

import React, { useState, useEffect, useRef } from 'react';
import ChronicleButton from './ChronicleButton/ChronicleButton';

interface PopupFormProps {
  messages: string[];
  fileName: string;
  fileUrl: string | null;
  onSave: (() => void) | null;
  onClose: () => void;
}

const PopupForm: React.FC<PopupFormProps> = ({ messages, fileName, fileUrl, onSave, onClose }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const adjustPopupPosition = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  useEffect(() => {
    adjustPopupPosition();
    window.addEventListener('resize', adjustPopupPosition);
    return () => {
      window.removeEventListener('resize', adjustPopupPosition);
    };
  }, []);

  const renderFileName = (name: string) => {
    return name.split('').map((char, index) => (
      <span
        key={index}
        className={`nav-a-letter ${index % 2 === 0 ? 'odd' : 'even'}`}
        style={{ zIndex: index % 2 === 0 ? 3 : 1 }}
      >
        {char}
      </span>
    ));
  };

  return (
    <div className="popup-overlay">
      <div id="card" ref={cardRef} className="popup-content">
        <div className="popup-inner">
          <div className="container">
            <ul className="nav-ul">
              <li className="nav-li">
                <a href="#" className="nav-a">
                  <span className="nav-a-letters">
                    {renderFileName(fileName)}
                  </span>
                  <span className="nav-a-stripe nav-a-stripe--yellow"></span>
                  <span className="nav-a-stripe nav-a-stripe--turquoise"></span>
                  <span className="nav-a-stripe nav-a-stripe--purple"></span>
                  <span className="nav-a-letters-top">
                    {renderFileName(fileName)}
                  </span>
                </a>
              </li>
            </ul>
          </div>
          {messages.map((message, index) => (
            <p key={index} className="popup-message">{message}</p>
          ))}
          <div className="popup-buttons">
            {fileUrl && onSave && (
              <ChronicleButton text="Save as..." onClick={onSave} />
            )}
            <ChronicleButton text="Close" isDelete={true} onClick={onClose} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 1000;
        }
        #card {
          width: 500px;
          max-width: 90%;
          background-color: rgba(25, 26, 26, 0.5);
          backdrop-filter: blur(10px) saturate(90%);
          border-radius: 20px;
          padding: 36px;
          position: relative;
          left: ${isMobile ? '0' : '30px'};
          border: 2px solid white;
        }
        .popup-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .popup-message {
          color: white;
          font-size: 18px;
          margin-bottom: 15px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .popup-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
        }
        .container {
          margin-bottom: 25px;
          width: 100%;
        }
        .nav-ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .nav-li {
          position: relative;
          line-height: 0.76471;
        }
        .nav-a {
          display: inline-block;
          position: relative;
          transition: 0.4s linear color;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: white;
          text-decoration: none;
          word-wrap: break-word;
          word-break: break-all;
        }
        .nav-a-letters, .nav-a-letters-top {
          display: flex;
          position: relative;
          flex-wrap: wrap;
        }
        .nav-a-letter {
          display: inline-block;
          position: relative;
        }
        .nav-a-stripe {
          position: absolute;
          width: calc(100% + 0.075em);
          left: 0;
          top: 0.43em;
          height: 0.115em;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0, 1);
          z-index: 2;
        }
        .nav-a-stripe--yellow {
          background-color: rgba(255, 208, 116);
          transition-delay: 0.1s;
        }
        .nav-a-stripe--turquoise {
          background-color: rgba(23, 241, 209);
          transition-delay: 50ms;
        }
        .nav-a-stripe--purple {
          background-color: rgba(176, 135, 255);
        }
        .nav-a:hover .nav-a-stripe {
          transform-origin: left;
          transform: scaleX(1);
        }
        .nav-a:hover .nav-a-stripe--yellow {
          transition-delay: 0s;
        }
        .nav-a:hover .nav-a-stripe--turquoise {
          transition-delay: 50ms;
        }
        .nav-a:hover .nav-a-stripe--purple {
          transition-delay: 0.1s;
        }
        .nav-a-letters-top {
          position: absolute;
          top: 0;
          left: 0;
        }
        .nav-a-letters .nav-a-letter.even {
          opacity: 0;
        }
        .nav-a-letters-top .nav-a-letter.odd {
          opacity: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default PopupForm;