"use client";

import React, { useEffect, useState, useRef } from 'react';
import { auth } from '@/app/lib/firebase';
import useStore from '@/store/store';

export default function UserInfoContainer() {
    const {username, masterKeyFingerprint} = useStore();
    const [userId, setUserId] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [signUpDate, setSignUpDate] = useState('');
    const [lastLogin, setLastLogin] = useState('');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const adjustPopupPosition = () => {
        setIsMobile(window.innerWidth < 768);
    };

    useEffect(() => {
        adjustPopupPosition();
        window.addEventListener('resize', adjustPopupPosition);
        return () => {
            window.removeEventListener('resize', adjustPopupPosition);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
                setUserEmail(user.email || '');
                setSignUpDate(user.metadata.creationTime || '');
                setLastLogin(user.metadata.lastSignInTime || '');
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div id="card" ref={cardRef} className="popup-content">
            <div className="popup-inner">
                <h2 className="title">Profile Info</h2>
                <p className="popup-message"><strong>User ID:</strong> {userId || 'Loading...'}</p>
                <p className="popup-message"><strong>Username:</strong> {username || 'Loading...'}</p>
                <p className="popup-message"><strong>Master Key Fingerprint:</strong> {masterKeyFingerprint || 'Loading...'}</p>
                <p className="popup-message"><strong>Backend &quot;Email&quot;:</strong> {userEmail || 'Loading...'}</p>
                <p className="popup-message"><strong>Signed Up At:</strong> {signUpDate ? new Date(signUpDate).toLocaleString() : 'Loading...'}</p>
                <p className="popup-message"><strong>Last Login:</strong> {lastLogin ? new Date(lastLogin).toLocaleString() : 'Loading...'}</p>
            </div>
            <style jsx>{`
                #card {
                    width: 600px;
                    max-width: 90%;
                    background-color: rgba(25, 26, 26, 0.5);
                    backdrop-filter: blur(10px) saturate(90%);
                    border-radius: 20px;
                    padding: 36px;
                    position: fixed;
                    top: 134px;
                    left: ${isMobile ? '50%' : 'calc(50% + 30px)'};
                    transform: translateX(-50%);
                    border: 2px solid white;
                    z-index: 1;
                    box-sizing: border-box;
                }
                .popup-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    width: 100%;
                }
                .title {
                    color: white;
                    font-size: 24px;
                    margin-bottom: 20px;
                    font-family: "Questrial", sans-serif;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .popup-message {
                    color: white;
                    font-size: 18px;
                    margin-bottom: 15px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    text-align: left;
                    width: 100%;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
            `}</style>
        </div>
    );
}