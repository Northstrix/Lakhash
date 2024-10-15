"use client"; 
import { cn } from "@/lib/utils"; 
import Link from "next/link"; 
import React, { useState, createContext, useContext, useEffect } from "react"; 
import { AnimatePresence, motion } from "framer-motion"; 
import Image from 'next/image'; 
import { IconMenu2, IconX, IconUser, IconFolder, IconLock, IconInfoCircle, IconLogout } from "@tabler/icons-react"; 

interface SidebarContextProps { 
  open: boolean; 
  setOpen: React.Dispatch<React.SetStateAction<boolean>>; 
  animate: boolean; 
} 

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined); 

export const useSidebar = () => { 
  const context = useContext(SidebarContext); 
  if (!context) { 
    throw new Error("useSidebar must be used within a SidebarProvider"); 
  } 
  return context; 
}; 

export const SidebarProvider = ({ children, open: openProp, setOpen: setOpenProp, animate = true }: { children: React.ReactNode; open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }) => { 
  const [openState, setOpenState] = useState(false); 
  const open = openProp !== undefined ? openProp : openState; 
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState; 

  return ( 
    <SidebarContext.Provider value={{ open, setOpen, animate }}> 
      {children} 
    </SidebarContext.Provider> 
  ); 
}; 

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => { 
  const [isMobile, setIsMobile] = useState(false); 

  useEffect(() => { 
    const checkMobile = () => setIsMobile(window.innerWidth <= 768); 
    checkMobile(); 
    window.addEventListener('resize', checkMobile); 
    return () => window.removeEventListener('resize', checkMobile); 
  }, []); 

  return ( 
    <> 
      {isMobile ? <MobileSidebar {...(props as React.ComponentProps<"div">)} /> : <DesktopSidebar {...props} />} 
    </> 
  ); 
}; 

export const MobileSidebar = ({}: React.ComponentProps<"div">) => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  
  const icons = [ 
    { icon: <IconUser size={24} />, label: "Profile Info", href: "/profile" }, 
    { icon: <IconFolder size={24} />, label: "My Files", href: "/files" }, 
    { icon: <IconLock size={24} />, label: "Password Vault", href: "/vault" }, 
    { icon: <IconInfoCircle size={24} />, label: "Credit", href: "/credit" }, 
    { icon: <IconLogout size={24} />, label: "Log Out", href: "/logout" }, 
  ]; 

  return (  
    <>  
      <div className="wrap md:hidden">  
        <span className="decor"></span>  
        <nav>  
          <ul className="primary">  
            {icons.map((item, index) => (  
              <li key={index}>  
                <Link href={item.href}>{item.icon}</Link>  
              </li>  
            ))}  
            <li>  
              <a href="#" onClick={() => setIsMenuOpen(true)}>  
                <IconMenu2 size={24} />  
              </a>  
            </li>  
          </ul>  
        </nav>  
      </div>  

      {/* Full-page Mobile Menu */}  
      <AnimatePresence>  
        {isMenuOpen && (  
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-[#2B2B2B] z-50 flex flex-col">  
            <div className="h-16 px-4 flex items-center justify-between">  
              <Image src="/path-to-your-app-icon.png" width={32} height={32} alt="App Icon" />  
              <IconX className="text-white cursor-pointer" onClick={() => setIsMenuOpen(false)} />  
            </div>  

            <nav>  
              <ul className="primary">  
                {icons.map((item, index) => (  
                  <li key={index}>  
                    <Link href={item.href} className="flex items-center py-4 px-6 text-white" onClick={() => setIsMenuOpen(false)}>  
                      {item.icon}  
                      <span className="ml-2">{item.label}</span>  
                    </Link>  
                  </li>  
                ))}  
              </ul>  
            </nav>  
          </motion.div>  
        )}  
      </AnimatePresence>

      {/* CSS for the decorative stripe */}   
      <style jsx>{`   
        @media only screen and (max-width: 768px) {   
          .wrap { display: inline-block; box-shadow: 0 0 70px #fff; margin-top: 40px; width: 100%; }   
          .decor { background: #6EAF8D; background-size: 50px 25%; padding: 2px; display: block; }   
          nav { position: relative; background-image: linear-gradient(to top, #2B2B2B 7%, #333333 100%); text-align: center; letter-spacing: 1px; text-shadow: 1px 1px 1px #0E0E0E; box-shadow: 2px 2px 3px #888; border-bottom-right-radius: 8px; border-bottom-left-radius: 8px; }   
          ul.primary { list-style: none; padding: 0; margin: 0; display: flex; justify-content: space-around; }   
          ul.primary li a { display: block; padding:20px; color:#fff; text-decoration:none; }   
        }   
      `}</style>   
    </>
   );   
}; 

export const DesktopSidebar = ({ className }: React.ComponentProps<typeof motion.div>) => {
   const icons = [
     { icon:<IconUser size={24}/>, label:"Profile Info", href:"/profile"},
     { icon:<IconFolder size={24}/>, label:"My Files", href:"/files"},
     { icon:<IconLock size={24}/>, label:"Password Vault", href:"/vault"},
     { icon:<IconInfoCircle size={24}/>, label:"Credit", href:"/credit"},
     { icon:<IconLogout size={24}/>, label:"Log Out", href:"/logout"}
   ];
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   return (
     <>
       {/* Thin Desktop Sidebar */}
       <motion.div className={cn("flex flex-col h-full bg-neutral-100 dark:bg-neutral-800 transition-all duration-300 w-[60px] fixed top-0 left-0 z-10", className)}>
         {/* Icons for Desktop Sidebar */}
         <nav className="flex flex-col items-center mt-4">
           {/* Each link opens the corresponding page */}
           {icons.map((item, index) => (
             <Link key={index} href={item.href} className="flex items-center justify-center h-16 w-full hover:bg-gray-200 dark:hover:bg-gray-700">
               {item.icon}
             </Link>
           ))}
           {/* Button to open full-page menu */}
           <button onClick={() => setIsMenuOpen(true)} className="flex items-center justify-center h-16 w-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <IconMenu2 size={24} />
           </button>
         </nav>
       </motion.div>

       {/* Full-page Menu for Desktop */}
       <AnimatePresence>
         {isMenuOpen && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-[#2B2B2B] z-50 flex flex-col">
             <div className="h-16 px-4 flex items-center justify-between">
               <Image src="/path-to-your-app-icon.png" width={32} height={32} alt="App Icon" />
               <IconX className="text-white cursor-pointer" onClick={() => setIsMenuOpen(false)} />
             </div>
             {/* Menu Items */}
             <nav>
               <ul className="primary">
                 {icons.map((item, index) => (
                   <li key={index}>
                     <Link href={item.href} className="flex items-center py-4 px-6 text-white" onClick={() => setIsMenuOpen(false)}>
                       {item.icon}
                       <span className="ml-2">{item.label}</span>
                     </Link>
                   </li>
                 ))}
               </ul>
             </nav>
           </motion.div>
         )}
       </AnimatePresence>
     </>
   );
}; 