// page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { LoginForm } from "@/components/ui/evervault-card";
import { AppSidebar } from "@/components/ui/AppSidebar";
import FilesContent from '@/components/FilesContent';
import ProfileContent from '@/components/ProfileContent';
import PasswordVaultContent from '@/components/PasswordVaultContent';
import CreditContent from '@/components/CreditContent';
import LogoutModal from '@/components/LogoutModal';
import Footer from '@/components/Footer';
import Disclaimer from '@/components/Disclaimer';
import useStore from '@/store/store';

export default function Home() {
  const [paddingStyle, setPad] = useState<{ padding: string }>({ padding: '0' });
  const [currentContent, setCurrentContent] = useState<string>('files');
  const { isLoggedIn, setMasterKey, setUsername, setIterations, setIsLoggedIn } = useStore();
  const [footerPaddingLeft, setFooterPaddingLeft] = useState<string>('0');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const PaddingForDesktopMode = () => {
      if (window.innerWidth > 767) {
        setPad({ padding: '0 0 0 60px' });
        setFooterPaddingLeft('60px');
      } else {
        setPad({ padding: '0' });
        setFooterPaddingLeft('0');
      }
    };

    PaddingForDesktopMode();
    window.addEventListener('resize', PaddingForDesktopMode);

    const hasAcceptedDisclaimer = localStorage.getItem('acceptedDisclaimer');
    if (hasAcceptedDisclaimer) {
      setShowDisclaimer(false);
    }

    // Simulate app loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Adjust this time as needed

    return () => window.removeEventListener('resize', PaddingForDesktopMode);
  }, [isLoggedIn]);

  const handleLoginSuccess = (masterKey: Uint8Array, username: string, iterations: number) => {
    setMasterKey(masterKey);
    setUsername(username);
    setIterations(iterations);
    setIsLoggedIn(true);
  };

  const renderContent = () => {
    switch (currentContent) {
      case 'files': return <FilesContent />;
      case 'profile': return <ProfileContent />;
      case 'vault': return <PasswordVaultContent />;
      case 'credit': return <CreditContent />;
      case 'logout': return <LogoutModal onClose={() => setCurrentContent('files')} />;
      default: return <div>Select an option from the menu</div>;
    }
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    localStorage.setItem('acceptedDisclaimer', 'true');
  };

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <p>Loading the web app...</p>
        <p>Reload the page if it takes too long.</p>
      </div>
    );
  }

  if (showDisclaimer) {
    return <Disclaimer onAccept={handleDisclaimerAccept} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
        <Footer paddingLeft={'0'} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen repeating-backgr">
      <div className="flex flex-grow">
        <div className="hidden md:block">
          <AppSidebar onMenuItemClick={setCurrentContent} />
        </div>
        <main className="flex-1 overflow-auto relative" style={{ paddingBottom: '40px' }}>
          <div className="md:hidden z-10">
            <AppSidebar onMenuItemClick={setCurrentContent} />
          </div>
          <div className="md:p-6 pt-4 md:pt-6">
            <div style={paddingStyle}>
              <div className="flex justify-center">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer paddingLeft={footerPaddingLeft} />
    </div>
  );
}