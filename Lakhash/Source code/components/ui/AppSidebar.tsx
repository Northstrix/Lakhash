"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { IconUser, IconFolder, IconLock, IconInfoCircle, IconLogout, IconMenu2, IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";
import useStore from '@/store/store';

interface AppSidebarProps {
  onMenuItemClick: (content: string) => void;
}

const menuItems = [
  { icon: <IconUser />, label: "Profile Info", content: "profile" },
  { icon: <IconFolder />, label: "My Files", content: "files" },
  { icon: <IconLock />, label: "Password Vault", content: "vault" },
  { icon: <IconInfoCircle />, label: "Credit", content: "credit" },
  { icon: <IconLogout />, label: "Log Out", content: "logout" },
];

export function AppSidebar({ onMenuItemClick }: AppSidebarProps) {
  const {username} = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

  const handleMenuItemClick = (content: string) => {
    onMenuItemClick(content);
    setIsMobileMenuOpen(false);
    setIsDesktopMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar as a thin strip */}
      <div className="hidden md:flex flex-col h-full bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 w-[60px] fixed top-0 left-0 z-50">
        {/* Icons for Desktop Sidebar */}
        <nav className="flex flex-col items-center mt-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuItemClick(item.content)}
              className="flex items-center justify-center h-16 w-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {item.icon}
            </button>
          ))}
          {/* Button to open full-page menu for desktop */}
          <button
            onClick={() => setIsDesktopMenuOpen(true)}
            className="flex items-center justify-center h-16 w-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <IconMenu2 size={24} />
          </button>
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <nav className="flex justify-center items-center space-x-6 p-4 bg-neutral-100 dark:bg-neutral-800 shadow-md mx-auto my-4 w-[354px] relative">
          <div className="decor absolute top-0 left-0 right-0"></div>
          {menuItems.map((item) => (
            <button
              key={item.content}
              onClick={() => handleMenuItemClick(item.content)}
              className="text-neutral-600 dark:text-neutral-400 hover:dark:text-neutral-100 flex flex-col items-center"
            >
              {React.cloneElement(item.icon, { size: 28 })}
            </button>
          ))}
          {/* Button to open full-page menu for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-neutral-600 dark:text-neutral-400 hover:dark:text-neutral-100"
          >
            <IconMenu2 size={28} />
          </button>
        </nav>

        {/* Full-page Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white dark:bg-neutral-800 z-50 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center">
                <Image src="/light_logo.png" alt="Logo" width={72} height={64} style={{ borderRadius: '9px' }} />
                <span className="ml-2 font-semibold">Lakhash | לחש</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-600 dark:text-neutral-300">
                <IconX size={24} />
              </button>
            </div>
            {/* Menu Items for Full-page Mobile Menu */}
            <nav className="flex-grow flex flex-col items-center justify-center space-y-6">
              {menuItems.map((item) => (
                <button
                  key={item.content}
                  onClick={() => handleMenuItemClick(item.content)}
                  className="flex items-center space-x-4 text-neutral-800 dark:text-neutral-200 text-lg hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-200"
                >
                  {React.cloneElement(item.icon, { size: 24 })}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Logged in as: {username}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Full-page Menu for Desktop */}
      {isDesktopMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white dark:bg-neutral-800 z-50 flex flex-col"
        >
          <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <Image src="/light_logo.png" alt="Logo" width={144} height={128} style={{ borderRadius: '18px' }} />
              <span className="ml-5 font-semibold text-5xl">Lakhash | לחש</span>
            </div>
            <button onClick={() => setIsDesktopMenuOpen(false)} className="text-neutral-600 dark:text-neutral-300">
              <IconX size={48} />
            </button>
          </div>
          {/* Menu Items for Full-page Desktop Menu */}
          <nav className="flex-grow flex flex-col items-center justify-center space-y-6">
            {menuItems.map((item) => (
              <button
                key={item.content}
                onClick={() => handleMenuItemClick(item.content)}
                className="flex items-center space-x-4 text-white text-lg hover:bg-gray-700 p-2 rounded transition-colors duration-200"
              >
                {React.cloneElement(item.icon, { size: 24 })}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white">
            <p className="text-sm text-white">Logged in as: {username}</p>
          </div>
        </motion.div>
      )}

      {/* CSS for the decorative stripe */}
      <style jsx>{`
        .decor {
          background: #6EAF8D;
          background: -webkit-linear-gradient(left, #CDEBDB 50%, #6EAF8D 50%);
          background: -moz-linear-gradient(left, #CDEBDB 50%, #6EAF8D 50%);
          background: -o-linear-gradient(left, #CDEBDB 50%, #6EAF8D 50%);
          background: linear-gradient(left, white 50%, #6EAF8D 50%);
          background-size: 54.462px 25%;
          padding: 3px;
          display: block;
        }
      `}</style>
    </>
  );
}