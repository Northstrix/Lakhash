"use client";

import { useMotionValue, motion } from "framer-motion";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionTemplate, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { argon2id, whirlpool, sha512 } from 'hash-wasm';
import { encryptSerpent256ECB } from '@/app/cryptographicPrimitives/serpent';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from '@/app/lib/firebase';
import TwoLinePopUpModal from '@/components/ui/TwoLinePopUpModal';
import RectangleNotification from '@/components/ui/RectangleNotification';
import useStore from '@/store/store';
import { FirebaseError } from 'firebase/app';

interface EvervaultCardProps {
  text?: string;
  className?: string;
  onLoginSuccess: (masterKey: Uint8Array, username: string, iterations: number) => void;
}

export const LoginForm: React.FC<EvervaultCardProps> = ({ className }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isHoveringForm, setIsHoveringForm] = useState(false);
  const [isHoveringInput, setIsHoveringInput] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeNotification, setActiveNotification] = useState<{ type: 'success' | 'error'; message: string; message1?: string } | null>(null);

  const showModal = () => {
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
  };

  const showRectangleNotification = (type: 'success' | 'error', message: string, message1?: string) => {
    setActiveNotification({ type, message, message1 });
  };

  const closeRectangleNotification = () => {
      setActiveNotification(null);
  };

  useEffect(() => {
    const str = generateSecureRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    if (isHoveringForm && !isHoveringInput) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
      const newStr = generateSecureRandomString(1500);
      setRandomString(newStr);
    }
  }

  const handleFormMouseEnter = () => {
    setIsHoveringForm(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleFormMouseLeave = () => {
    if (!isHoveringInput) {
      setIsHoveringForm(false);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringForm(false);
      }, 2000);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] background-image`}>
        <main className="w-full max-w-4xl">
            <div className="h-[408px] w-[330px] mx-auto flex items-center justify-center bg-transparent rounded-[25px]">
                <div className={cn("bg-transparent aspect-square flex items-center justify-center w-full h-full relative backdrop-blur-lg rounded-[20.6px] border-[3px] border-opacity-100 border-gray-100", className)} style={{ padding: 0, margin: 0 }} onMouseEnter={handleFormMouseEnter} onMouseLeave={handleFormMouseLeave}>
                    <div onMouseMove={onMouseMove} className="group/card rounded-[20.6px] w-full h-full relative overflow-hidden bg-transparent">
                        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} isHoveringInput={isHoveringInput} isHoveringForm={isHoveringForm} />
                        <div className="absolute inset-0 flex flex-col justify-center p-6 text-white z-10">
                            {isSignUp ? (
                                <SignUpForm 
                                    setIsSignUp={setIsSignUp} 
                                    setIsHoveringInput={setIsHoveringInput} 
                                    showModal={showModal}   // Pass showModal 
                                    closeModal={closeModal} // Pass closeModal 
                                    showRectangleNotification={showRectangleNotification} // Pass notification function
                                />
                            ) : (
                                <SignInForm 
                                setIsSignUp={setIsSignUp} 
                                setIsHoveringInput={setIsHoveringInput} 
                                showModal={showModal}   // Pass showModal 
                                closeModal={closeModal} // Pass closeModal 
                                showRectangleNotification={showRectangleNotification} // Pass notification function
                                />
                            )}
                        </div>
                      {/* Rectangle Notification */}
                        {activeNotification && (
                          <RectangleNotification 
                              type={activeNotification.type}
                              message={activeNotification.message}
                              message1={activeNotification.message1}
                              isVisible={!!activeNotification}
                              onClose={closeRectangleNotification}
                          />
                        )}
                    </div>
                </div>
                {/* Modal for deriving keys */}
                <TwoLinePopUpModal 
                    isOpen={isModalOpen} 
                    onClose={closeModal} 
                    line1="Deriving Cryptographic Keys" 
                    line2="Please wait for a while" 
                />
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            </div>
        </main>
    </div>
  );
};

interface FormContainerProps {
  children: React.ReactNode;
  setIsHoveringInput: (isHovering: boolean) => void;
}

const FormContainer: React.FC<FormContainerProps> = ({ children, setIsHoveringInput }) => {
  return (
    <div 
      className="w-full"
      onMouseEnter={() => setIsHoveringInput(true)}
      onMouseLeave={() => setIsHoveringInput(false)}
    >
      {children}
    </div>
  );
};

interface GlassmorphicInputProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const GlassmorphicInput: React.FC<GlassmorphicInputProps> = ({ type, placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full p-2 mb-4 text-white bg-white bg-opacity-20 rounded-md backdrop-blur-sm border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 placeholder-white placeholder-opacity-70"
  />
);

interface GlassmorphicButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

const GlassmorphicButton: React.FC<GlassmorphicButtonProps> = ({ children, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.button
      className="w-full p-2 mb-4 text-white rounded-md backdrop-blur-sm border border-white border-opacity-30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.25 : 0 }}
        transition={{ duration: 0.4 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

interface SignInFormProps {
  setIsSignUp: (isSignUp: boolean) => void;
  setIsHoveringInput: (isHovering: boolean) => void;
}

interface SignInFormProps {
  setIsSignUp: (isSignUp: boolean) => void;
  setIsHoveringInput: (isHovering: boolean) => void;
  showModal: (line1: string, line2: string) => void; // For the second pop-up modal
  closeModal: () => void; // To close the second pop-up modal
  showRectangleNotification: (type: 'success' | 'error', message: string, message1?: string) => void; // For rectangle notification
}

const SignInForm: React.FC<SignInFormProps> = ({
  setIsSignUp,
  setIsHoveringInput,
  showModal,
  closeModal,
  showRectangleNotification
}) => {
  const {setLoginData, setIsLoggedIn } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const derive336BytesUsingArgon2id = useCallback(async (
    password: string, 
    salt: Uint8Array, 
    iterations: number,
  ): Promise<Uint8Array> => {
    const derivedKey = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations,
      memorySize: 512,
      hashLength: 336,
      outputType: 'binary',
    });
    return new Uint8Array(derivedKey);
  }, []);

  const handleSignIn = async () => {
      showModal("Deriving Cryptographic Keys", "Please wait for a while");
  };

  const handleSignInContinue = async () => {
    const sha512_output = await sha512(username);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    const hashedUsername = new Uint8Array(hexStringToArray(generatedHash));
    const salt = hashedUsername .slice(24, 48);
    const iterationBytes = hashedUsername.slice(16);
    const derIterations = iterationBytes.reduce((acc, val) => acc + val, 0);
    const iterations = 7000 + (3 * derIterations % 50001);
    const derivedKey = await derive336BytesUsingArgon2id(username + password, salt, iterations);
    const userID1 = derivedKey.slice(0, 16);
    const userID2 = derivedKey.slice(16, 32);
    const unencryptedPassword = userID1.map((byte, index) => byte ^ userID2[index]);
    const userCredentialEncryptionKey = derivedKey.slice(32, 64);
    const secondHash = await whirlpool(hashedUsername);
    const secondHashArray = new Uint8Array(hexStringToArray(secondHash));
    const secondHashArray1 = secondHashArray.slice(0, 16);
    const secondHashArray2 = secondHashArray.slice(16, 32);
    const unencryptedUsername = secondHashArray1.map((byte, index) => byte ^ secondHashArray2[index]);
    const encryptedUsername = encryptSerpent256ECB(unencryptedUsername, userCredentialEncryptionKey);
    const encryptedUserPassword = encryptSerpent256ECB(unencryptedPassword, userCredentialEncryptionKey);
    //console.log("Username:" + uint8ArrayToString(encryptedUsername));
    //console.log("Password:" + arrayToHexString(encryptedUserPassword));
    try {
      await signInWithEmailAndPassword(
          auth,
          uint8ArrayToString(encryptedUsername) + "@notanemail.com",
          arrayToHexString(encryptedUserPassword)
      );
      closeModal();
    const sha512HashOutput = await sha512(derivedKey.slice(64));
    const sha512ByteArray = hexStringToArray(sha512HashOutput);
    const sha512Uint8Array = new Uint8Array(sha512ByteArray);
    const whirlpoolHash = await whirlpool(sha512Uint8Array);
    let fingerprintSourceArray = new Uint8Array(hexStringToArray(whirlpoolHash));

    while (fingerprintSourceArray.length > 8) {
        fingerprintSourceArray = xorHalves(fingerprintSourceArray);
    }

    if (fingerprintSourceArray.length < 8) {
        const paddedArray = new Uint8Array(8);
        paddedArray.set(fingerprintSourceArray);
        fingerprintSourceArray = paddedArray;
    }
    const formattedFingerprint =
        `${byteToHex(fingerprintSourceArray.slice(0, 2))}-` +
        `${byteToHex(fingerprintSourceArray.slice(2, 4))}-` +
        `${byteToHex(fingerprintSourceArray.slice(4, 6))}-` +
        `${byteToHex(fingerprintSourceArray.slice(6, 8))}`;

    setLoginData(derivedKey.slice(64), username, iterations - 7000, formattedFingerprint);

      setLoginData(derivedKey.slice(64), username, iterations - 7000, formattedFingerprint);
      setIsLoggedIn(true);
  } catch (error) {
      closeModal();
      // Type guard to check if error is of type FirebaseError
      if (error instanceof Error) {
          if (error instanceof FirebaseError && error.code === 'auth/invalid-credential') {
              showRectangleNotification('error', 'Access denied', 'Check your credentials');
          } else {
              showRectangleNotification('error', 'Something went wrong', 'Check the console.');
              console.log("Sign-in error:", error.message);
          }
      } else {
          // Handle unexpected error types
          showRectangleNotification('error', 'Something went wrong', 'Check the console.');
          console.log("Unexpected error:", error);
      }
  }
  closeModal();
  };

  function byteToHex(byteArray: Uint8Array): string {
    return Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
  }

  // Function to XOR halves of an array
  function xorHalves(array: Uint8Array): Uint8Array {
      const halfLength = Math.floor(array.length / 2);
      const result = new Uint8Array(halfLength);
      for (let i = 0; i < halfLength; i++) {
          result[i] = array[i] ^ array[i + halfLength];
      }
      return result;
  }

  function uint8ArrayToString(uint8Array: Uint8Array): string {
    return Array.from(uint8Array).map(num => {
      // Map the number to a letter from 'a' to 'z'
      return String.fromCharCode((num % 26) + 97);
    }).join('');
  }

  const arrayToHexString = (byteArray: Uint8Array): string => {
    return Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <div className="text-left w-full">
      <h1 className="text-3xl font-bold mb-2">Shalom!</h1>
      <p className="mb-4">Sign in to your account</p>
      <FormContainer setIsHoveringInput={setIsHoveringInput}>
        <GlassmorphicInput
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <GlassmorphicInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <GlassmorphicButton
        onClick={() => {
          handleSignIn(); // Call the first function

          // Call the second function after a delay of 100ms
          setTimeout(() => {
            handleSignInContinue(); // Replace with the actual second function you want to call
          }, 100);
        }}
        >Sign In</GlassmorphicButton>
        <p>
          No account?{" "}
          <span className="underline cursor-pointer" onClick={() => setIsSignUp(true)}>
            Create one
          </span>
        </p>
      </FormContainer>
    </div>
  );
};

interface SignUpFormProps {
  setIsSignUp: (isSignUp: boolean) => void;
  setIsHoveringInput: (isHovering: boolean) => void;
}

const hexStringToArray = (hexString: string): Uint8Array => {
  const matches = hexString.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hexadecimal string');
  }
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
};

interface SignUpFormProps {
  setIsSignUp: (isSignUp: boolean) => void;
  setIsHoveringInput: (isHovering: boolean) => void;
  showModal: (line1: string, line2: string) => void; // For the second pop-up modal
  closeModal: () => void; // To close the second pop-up modal
  showRectangleNotification: (type: 'success' | 'error', message: string, message1?: string) => void; // For rectangle notification
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  setIsSignUp,
  setIsHoveringInput,
  showModal,
  closeModal,
  showRectangleNotification // Include this in destructuring
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const derive336BytesUsingArgon2id = useCallback(async (
    password: string, 
    salt: Uint8Array, 
    iterations: number,
  ): Promise<Uint8Array> => {
    const derivedKey = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations,
      memorySize: 512,
      hashLength: 336,
      outputType: 'binary',
    });
    return new Uint8Array(derivedKey);
  }, []);

  const handleSignUp = async () => {
      if (password !== confirmPassword) {
          toast.error("Passwords do not match!");
          return;
      }
      showModal("Deriving Cryptographic Keys", "Please wait for a while");
  };

  const handleSignUpContinue = async () => {
    if (password !== confirmPassword) {
      return;
    }
    const sha512_output = await sha512(username);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    const hashedUsername = new Uint8Array(hexStringToArray(generatedHash));
    const salt = hashedUsername .slice(24, 48);
    // test salt: const salt = new Uint8Array([97, 98, 99, 100, 101, 102, 103, 104]);
    const iterationBytes = hashedUsername.slice(16);
    const derIterations = iterationBytes.reduce((acc, val) => acc + val, 0);
    const iterations = 7000 + (3 * derIterations % 50001);
    const derivedKey = await derive336BytesUsingArgon2id(username + password, salt, iterations);
    const userID1 = derivedKey.slice(0, 16);
    const userID2 = derivedKey.slice(16, 32);
    const unencryptedPassword = userID1.map((byte, index) => byte ^ userID2[index]);
    const userCredentialEncryptionKey = derivedKey.slice(32, 64);
    const secondHash = await whirlpool(hashedUsername);
    const secondHashArray = new Uint8Array(hexStringToArray(secondHash));
    const secondHashArray1 = secondHashArray.slice(0, 16);
    const secondHashArray2 = secondHashArray.slice(16, 32);
    const unencryptedUsername = secondHashArray1.map((byte, index) => byte ^ secondHashArray2[index]);
    const encryptedUsername = encryptSerpent256ECB(unencryptedUsername, userCredentialEncryptionKey);
    const encryptedUserPassword = encryptSerpent256ECB(unencryptedPassword, userCredentialEncryptionKey);
    //console.log("Username:" + uint8ArrayToString(encryptedUsername));
    //console.log("Password:" + arrayToHexString(encryptedUserPassword));
    try {
      await createUserWithEmailAndPassword(
          auth,
          uint8ArrayToString(encryptedUsername) + "@notanemail.com",
          arrayToHexString(encryptedUserPassword)
      );
      closeModal();
      showRectangleNotification('success', 'Account created successfully', 'You can sign in now!');
  } catch (error) {
      closeModal();
      // Type guard to check if error is of type FirebaseError
      if (error instanceof Error) {
          if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
              showRectangleNotification('error', 'That username is taken', 'Try using a different one.');
          } else {
              showRectangleNotification('error', 'Something went wrong', 'Check the console.');
              console.log("User registration error:", error.message);
          }
      } else {
          // Handle unexpected error types
          showRectangleNotification('error', 'An unexpected error occurred', 'Check the console.');
          console.log("Unexpected error:", error);
      }
  }
  closeModal();
  };

  function uint8ArrayToString(uint8Array: Uint8Array): string {
    return Array.from(uint8Array).map(num => {
      // Map the number to a letter from 'a' to 'z'
      return String.fromCharCode((num % 26) + 97);
    }).join('');
  }

  const arrayToHexString = (byteArray: Uint8Array): string => {
    return Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <div className="text-left w-full">
      <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
      <p className="mb-4">Create an account</p>
      <FormContainer setIsHoveringInput={setIsHoveringInput}>
        <GlassmorphicInput
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <GlassmorphicInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <GlassmorphicInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <GlassmorphicButton 
        onClick={() => {
          handleSignUp(); // Call the first function

          // Call the second function after a delay of 100ms
          setTimeout(() => {
            handleSignUpContinue(); // Replace with the actual second function you want to call
          }, 100);
        }}
        >Sign Up</GlassmorphicButton>
        <p>
          Already have an account?{" "}
          <span className="underline cursor-pointer" onClick={() => setIsSignUp(false)}>
            Sign in
          </span>
        </p>
      </FormContainer>
    </div>
  );
};

interface CardPatternProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  randomString: string;
  isHoveringInput: boolean;
  isHoveringForm: boolean;
}

export function CardPattern({ 
  mouseX, 
  mouseY, 
  randomString, 
  isHoveringInput, 
  isHoveringForm 
}: CardPatternProps) {
  const maskImage = useMotionTemplate`radial-gradient(450px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-[20.6px] [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 rounded-[20.6px] opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={{
          background: 'linear-gradient(to right, #00a8e8, #00ee59)',
          ...style,
          opacity: (isHoveringInput || !isHoveringForm) ? 0 : 1,
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-[20.6px] opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={{
          ...style,
          opacity: (isHoveringInput || !isHoveringForm) ? 0 : 1,
        }}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateSecureRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ className, ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};