// TwoLinePopUpModal.tsx
"use client"
import React, { useEffect, useState } from 'react';

interface TwoLinePopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    line1: string;
    line2: string;
}

const TwoLinePopUpModal: React.FC<TwoLinePopUpModalProps> = ({ isOpen, line1, line2 }) => {
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300); // Match this duration with the CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`bg-white bg-opacity-20 backdrop-blur-md border border-gray-400 rounded-lg p-6 shadow-lg transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col items-center"> {/* Centering the text */}
                    <h2 className="text-xl">{line1}</h2>
                    <p className="text-lg">{line2}</p>
                </div>
            </div>
        </div>
    );
};

export default TwoLinePopUpModal;