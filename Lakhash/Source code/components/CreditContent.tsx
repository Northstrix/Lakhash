"use client";

import React, { useEffect, useState, useRef } from 'react';

export default function CreditContent() {
    const [isMobile, setIsMobile] = useState(false);
    const cardRef = useRef(null);

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

    return (
        <div id="card" ref={cardRef} className="popup-content">
            <div className="popup-inner">
                <h2 className="title">Credit</h2>
                <p className="popup-message">The existence of this project (at least in its current form) wouldn&apos;t&apos;ve been possible without the following:</p>
                
                <span className="text"><a id="linkanimation" href="https://www.pexels.com/@kelly-1179532/" target="_blank">Photo by Kelly</a> from <a id="linkanimation" href="https://www.pexels.com/photo/bird-s-eye-view-of-city-during-daytime-2815170/" target="_blank">Pexels</a></span>
                
                <span className="text"><a id="linkanimation" href="https://www.youtube.com/watch?v=FdEY-ZnEikg" target="_blank">Let&apos;s build Dropbox Clone with NEXT.JS 14! (React, Clerk, Shadcn, Firebase, Drag/Drop, CRUD, TS)</a> by <a id="linkanimation" href="https://www.youtube.com/@SonnySangha" target="_blank">Sonny Sangha</a></span>
                
                <span className="text"><a id="linkanimation" href="https://ui.aceternity.com/components/evervault-card" target="_blank">evervault-card</a> by <a id="linkanimation" href="https://ui.aceternity.com/" target="_blank">Aceternity</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/ash_creator/pen/GRGZYyV" target="_blank">深海なボタン</a> by <a id="linkanimation" href="https://codepen.io/ash_creator" target="_blank">あしざわ - Webクリエイター</a></span>
                
                <span className="text"><a id="linkanimation" href="https://ui.aceternity.com/components/bento-grid" target="_blank">Bento Grid</a> by <a id="linkanimation" href="https://ui.aceternity.com/" target="_blank">Aceternity</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/Haaguitos/pen/OJrVZdJ" target="_blank">Chronicle Button</a> by <a id="linkanimation" href="https://codepen.io/Haaguitos" target="_blank">Haaguitos</a></span>
                
                <span className="text">Photo by <a id="linkanimation" href="https://www.pexels.com/@ekaterina-bolovtsova/" target="_blank">KATRIN BOLOVTSOVA</a> from <a id="linkanimation" href="https://www.pexels.com/photo/different-sizes-of-christmas-tree-shaped-and-star-shaped-gingerbread-cookies-on-white-background-5702703/" target="_blank">Pexels</a></span>
                
                <span className="text"><a id="linkanimation" href="https://ui.aceternity.com/components/sidebar" target="_blank">Sidebar</a> by <a id="linkanimation" href="https://ui.aceternity.com/" target="_blank">Aceternity</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/jurbank/pen/DqByKy" target="_blank">Simple, CSS only, responsive menu</a> by <a id="linkanimation" href="https://codepen.io/jurbank" target="_blank">John Urbank</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/Juxtopposed/pen/mdQaNbG" target="_blank">Text scroll and hover effect with GSAP and clip</a> by <a id="linkanimation" href="https://codepen.io/Juxtopposed" target="_blank">Juxtopposed</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/Juxtopposed/pen/xxQNozB" target="_blank">Vercel app border hover effect</a> by <a id="linkanimation" href="https://codepen.io/Juxtopposed" target="_blank">Juxtopposed</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/Gthibaud/pen/MqpmXE" target="_blank">rémi&apos;s pop-up</a> by <a id="linkanimation" href="https://codepen.io/Gthibaud" target="_blank">Tibo</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/brix/crypto-js" target="_blank">crypto-js</a> by <a id="linkanimation" href="https://github.com/brix" target="_blank">brix</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/mpaland/mipher" target="_blank">mipher</a> by <a id="linkanimation" href="https://github.com/mpaland" target="_blank">mpaland</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/Daninet/hash-wasm" target="_blank">hash-wasm</a> by <a id="linkanimation" href="https://github.com/Daninet" target="_blank">Daninet</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/firebase/firebase-js-sdk" target="_blank">firebase-js-sdk</a> by <a id="linkanimation" href="https://github.com/firebase/firebase-js-sdk" target="_blank">firebase</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/fkhadra/react-toastify" target="_blank">react-toastify</a> by <a id="linkanimation" href="https://github.com/fkhadra" target="_blank">fkhadra</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/juliepark/pen/vjMOKQ" target="_blank">Daily UI#011 | Flash Message (Error/Success)</a> by <a id="linkanimation" href="https://codepen.io/juliepark" target="_blank">Julie Park</a></span>
                
                <span className="text"><a id="linkanimation" href="https://www.youtube.com/watch?v=domt_Sx-wTY" target="_blank">React Chat App Full Tutorial 2024 | Realtime Chat Application Project with Firebase</a> by <a id="linkanimation" href="https://www.youtube.com/@LamaDev" target="_blank">Lama Dev</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/FlorinPop17/pen/yLyzmLZ" target="_blank">Custom Progress Bar</a> by <a id="linkanimation" href="https://codepen.io/FlorinPop17" target="_blank">Florin Pop</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/alvarotrigo/pen/yLxxxJZ" target="_blank">Diagonal Lines Background Animation Pure CSS</a> by <a id="linkanimation" href="https://codepen.io/alvarotrigo" target="_blank">Álvaro</a></span>
                
                <span className="text"><a id="linkanimation" href="https://www.npmjs.com/package/@fontsource/roboto-mono" target="_blank">Fontsource Roboto Mono</a> by <a id="linkanimation" href="https://github.com/fontsource" target="_blank">fontsource</a></span>
                
                <span className="text"><a id="linkanimation" href="https://github.com/googlefonts/robotomono" target="_blank">Copyright 2015 The Roboto Mono Project Authors</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/ash_creator/pen/zYaPZLB" target="_blank">すりガラスなプロフィールカード</a> by <a id="linkanimation" href="https://codepen.io/ash_creator" target="_blank">あしざわ - Webクリエイター</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/IanWoodard/pen/eYyVzzq" target="_blank">Interactive Loose-Leaf Todo List</a> by <a id="linkanimation" href="https://codepen.io/IanWoodard" target="_blank">Ian</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/utilitybend/pen/VwBRNwm" target="_blank">Named scroll-timeline vertical</a> by <a id="linkanimation" href="https://codepen.io/utilitybend" target="_blank">utilitybend</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/nourabusoud/pen/BxJbjJ" target="_blank">The prismatic forms</a> by <a id="linkanimation" href="https://codepen.io/nourabusoud" target="_blank">Nour Saud</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/zzznicob/pen/GRPgKLM" target="_blank">JTB studios - Link</a> by <a id="linkanimation" href="https://codepen.io/zzznicob" target="_blank">Nico</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/kalisnetwork/pen/yLQQEyj" target="_blank">Poppr-Link</a> by <a id="linkanimation" href="https://codepen.io/kalisnetwork" target="_blank">Kalis Network</a></span>
                
                <span className="text"><a id="linkanimation" href="https://codepen.io/ash_creator/pen/JjZReNm" target="_blank">チェックしないと押せないボタン</a> by <a id="linkanimation" href="https://codepen.io/ash_creator" target="_blank">あしざわ - Webクリエイター</a></span>
            </div>
            <style jsx>{`
                #card {
                    width: 1200px;
                    max-width: 90%;
                    background-color: rgba(25, 26, 26, 0.5);
                    backdrop-filter: blur(10px) saturate(90%);
                    border-radius: 6px;
                    padding: 36px;
                    position: fixed;
                    top: 134px;
                    left: ${isMobile ? '50%' : 'calc(50% + 30px)'};
                    transform: translateX(-50%);
                    border: 2px solid white;
                    z-index: 1;
                    box-sizing: border-box;
                    max-height: 71.7vh;
                    overflow-y: auto;
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
                    width: 100%;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                .text {
                    font-size: 16px;
                    margin-bottom: 10px;
                    display: block;
                    text-align: left;
                }
                #linkanimation {
                    text-decoration: none;
                    text-decoration-color: none;
                    color: white;
                    position: relative;
                }
                #linkanimation::before {
                    position: absolute;
                    content: "";
                    width: 100%;
                    height: 1px;
                    background-color: #FEFEFE;
                    transform: scale(1,1);
                    transition: background-color .5s ease-in-out;
                    bottom: 0px;
                }
                #linkanimation:hover::before {
                    animation: link ease 1s 1 300ms;
                    transform-origin: right;
                }
                @keyframes link {
                    50% {
                        transform: scaleX(0);
                    }
                    50.1% {
                        transform: translateX(-100%) scalex(-0.01);
                    }
                    100% {
                        transform: translateX(-100%) scalex(-1);
                    }
                }
                ::-webkit-scrollbar {
                  width: 10px;
                }

                /* Track */
                ::-webkit-scrollbar-track {
                  background: #ffffff;

                }

                /* Handle */
                ::-webkit-scrollbar-thumb {
                  background: #28afb0;
                  border-radius: 10px;
                }

                /* Handle on hover */
                ::-webkit-scrollbar-thumb:hover {
                  background: #3a62be;
                }


            `}</style>
        </div>
    );
}