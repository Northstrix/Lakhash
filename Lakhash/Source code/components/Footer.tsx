import React from 'react';

// Define the props type for the Footer component
interface FooterProps {
  paddingLeft: string; // Specify that paddingLeft is a string
}

const Footer: React.FC<FooterProps> = ({ paddingLeft }) => {
  return (
    <footer className="footer">
      <div className="footer-content" style={{ paddingLeft }}>
        <span className="text">
          Made by <a id="linkanimation" href="https://github.com/Northstrix" target="_blank" rel="noopener noreferrer">Maxim Bortnikov</a> with the help of <a id="linkanimation" href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer">Perplexity</a>
        </span>
      </div>
      <style jsx>{`
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          z-index: 40;
          right: 0;
          height: 40px;
          background-color: #191A1A;
          display: flex;
          justify-content: center; /* Center horizontally */
          color: white;
        }
        .footer-content {
          display: flex; /* Use flexbox for centering */
          align-items: center; /* Center vertically */
          width: 100%; /* Ensure it takes full width */
        }
        .text {
          font-size: 14px;
          text-align: center; /* Center text within its container */
          flex-grow: 1; /* Allow text to grow and take available space */
        }
        #linkanimation {
          text-decoration: none;
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
          50% { transform: scaleX(0); }
          50.1% { transform: translateX(-100%) scaleX(-0.01); }
          100% { transform: translateX(-100%) scaleX(-1); }
        }
      `}</style>
    </footer>
  );
};

export default Footer;