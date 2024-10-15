"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '@/app/lib/firebase';
import useStore from '@/store/store';

interface LogoutModalProps {
  onClose: () => void;
}

export default function LogoutModal({ onClose }: LogoutModalProps) {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  const adjustPopupPosition = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    // Set initial position
    adjustPopupPosition();

    // Add event listener for window resize
    window.addEventListener('resize', adjustPopupPosition);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', adjustPopupPosition);
    };
  }, []);

  const handleLogout = () => {
    const { setIsLoggedIn, setMasterKey, setUsername, setIterations } = useStore.getState(); // Access the store's state directly

    // Sign out the user
    auth.signOut().then(() => {
      // Clear the store and set random nonsense values
      setIsLoggedIn(false);
      setMasterKey(new Uint8Array(272).fill(Math.floor(Math.random() * 256))); // Fill with random bytes
      setUsername(`user_${Math.random().toString(36).substring(2, 15)}`); // Random username
      setIterations(Math.floor(Math.random() * 100)); // Random iterations

      // Reload the page to return to the home route
      window.location.reload();
    }).catch(error => {
      console.error('Error during logout:', error);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ 
        position: 'fixed', 
        left: isMobile ? '50%' : 'calc(50% + 30px)', // Shift left for desktop
        transform: isMobile ? 'translateX(-50%)' : 'translateX(-50%)' // Centering adjustment
      }}>
        <div className="modal-content">
          <p className="message">Are you sure you want to log out?</p>
          <div className="options">
            <button className="btn" onClick={handleLogout}>Yes</button>
            <button className="btn" onClick={onClose}>No</button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal {
          font-size: 18px;
          color: black;
          font-family: "Questrial", sans-serif;
          width: 354px;
          height: 180px;
          border: 3px solid black;
          border-radius: 5px;
          box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
          overflow: hidden;
          position: relative; /* Ensure relative positioning for child elements */
        }
        .modal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: white;
          background-image: linear-gradient(
            45deg,
            #ff0000 25%,
            transparent 25%,
            transparent 75%,
            #ff0000 75%,
            #ff0000
          ),
          linear-gradient(
            -45deg,
            #ff0000 25%,
            transparent 25%,
            transparent 75%,
            #ff0000 75%,
            #ff0000
          );
          background-size: 60px 60px;
          animation: slide 4s infinite linear;
          z-index: 0; /* Background layer */
        }
        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: -120px 60px; }
        }
        .modal-content {
          position: relative; /* Ensure content is above the background */
          z-index: 1; /* Bring content above the animated background */
          background-color: rgba(255, 255, 255, 0.6);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.6rem;
        }
        .message {
          font-size: 1.1rem;
          margin-bottom: 1.6rem;
          margin-top: 0;
          text-align: center;
          font-weight: bold; /* Make text bold */
        }
        .btn {
          color: inherit;
          font-family: inherit;
          font-size: inherit;
          background-color: white; /* Keep button background white */
          padding: 0.5rem; /* Adjust padding for uniformity */
          width: 100px; /* Set a fixed width for uniform button size */
          border-radius:5px; /* Rounded corners for buttons */
          border: none; /* Remove border for cleaner look */
          margin:.5rem; /* Add some margin between buttons */
          box-shadow:.2rem .2rem .2rem black; 
          transition:.2s; 
        }
        .btn:hover { 
           box-shadow:.4rem .4rem .4rem black; 
           transform:.translate(-.4rem - .4rem); 
        }
        .btn.active { 
           box-shadow:.2rem .2rem .2rem black; 
           transform:.translate(0,-1); 
        }
        .options { 
           display:flex; 
           flex-direction=row; 
           justify-content:center; 
        } 
      `}</style>
    </div>
   );
}