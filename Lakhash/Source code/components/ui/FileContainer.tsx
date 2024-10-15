"use client";
import React, { useEffect } from 'react';
import ChronicleButton from './ChronicleButton/ChronicleButton';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "@fontsource/roboto-mono/400.css";

interface FileContainerProps {
  id: string;
  title: string;
  color: string;
  fileSize: string;
  description: string;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onTitleClick: (id: string) => void;
  onDescriptionClick: (id: string) => void;
}

const FileContainer: React.FC<FileContainerProps> = ({
  id,
  title,
  color,
  fileSize,
  description,
  onDownload,
  onDelete,
  onTitleClick,
  onDescriptionClick
}) => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const textElement = document.querySelector('.text');
    if (textElement) {
      gsap.to(textElement, {
        backgroundSize: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: textElement,
          start: 'top center',
          end: 'top 20%',
          scrub: true,
        },
      });
    }
  }, []);

  const isJavaScriptFile = /\.(js|mjs|cjs|jsx|es6|es)$/i.test(title);
  const hoverColor = isJavaScriptFile ? '#242424' : 'white';

  // Truncate the displayed title if it's longer than 27 characters
  const displayedTitle = title.length > 27 ? title.slice(0, 24) + '...' : title;

  return (
    <div 
      className="relative w-[320px] h-[320px] overflow-hidden rounded-lg bg-black"
      style={{ fontFamily: "'Roboto Mono', monospace" }}
    >
      {/* Triangular Moving Background */}
      <div className="absolute inset-0 z-0" style={{
        background: `linear-gradient(45deg, rgba(230, 230, 230, 0.3) 25%, transparent 25%, transparent 75%, rgba(240, 240, 240, 0.3) 75%), linear-gradient(-45deg, rgba(240, 240, 240, 0.3) 25%, transparent 25%, transparent 75%, rgba(230, 230, 230, 0.3) 75%)`,
        backgroundSize: '20px 20px',
        opacity: 0.5
      }} />
      {/* Content Area */}
      <div className="relative z-20 flex flex-col justify-between h-full mx-4 pt-5 pb-3">
        {/* Title with Text Effect */}
        <h1 className="text relative inline-block cursor-pointer" style={{ color }} onClick={() => onTitleClick(id)}>
          <span className="relative text-[17.6px] z-10 px-1 py-0.5" title={title}>{displayedTitle}</span>
          <span className="text-effect absolute inset-0 z-0" style={{ backgroundColor: color }}></span>
        </h1>
        {/* Filesize */}
        <p className="text-[16px] text-white pt-4">{fileSize}</p>
        {/* Description */}
        <p className="text-[17px] text-white line-clamp-4 pt-2 cursor-pointer" onClick={() => onDescriptionClick(id)}>{description}</p>
        {/* Button Container with fixed padding */}
        <div className="flex justify-center gap-2 pb-3 pt-4">
          <ChronicleButton text="Download" onClick={() => onDownload(id)} />
          <ChronicleButton text="Delete" isDelete={true} onClick={() => onDelete(id)} />
        </div>
      </div>
      {/* Inline Styles for Animation */}
      <style jsx>{`
        .text {
          font-size: 20px;
          font-weight: bold;
          letter-spacing: -.01em;
          line-height: normal;
          margin-bottom: -1px;
          width: auto;
          color: rgb(182, 182, 182);
          transition: color 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .text:hover {
          color: ${hoverColor} !important;
        }
        .text-effect {
          clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
          transform-origin: center;
          transition: all cubic-bezier(.1,.5,.5,1) 0.4s;
          left: -4px;
          right: -4px;
          top: -4px;
          bottom: -4px;
        }
        .text:hover > .text-effect {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
};

export default FileContainer;