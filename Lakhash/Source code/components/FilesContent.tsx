"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import FileContainer from '@/components/ui/FileContainer';
import FishyFileDrop from "@/components/ui/FishyFileDrop";
import PopupForm from "@/components/ui/PopupForm";
import { encryptSerpent256ECB, decryptSerpent256ECB } from '@/app/cryptographicPrimitives/serpent';
import { createSHA512, createHMAC, whirlpool, argon2id } from 'hash-wasm';
import { ChaCha20 } from 'mipher';
import CryptoJS from 'crypto-js';
import { toast, ToastContainer } from 'react-toastify';
import useStore from '@/store/store';
import { db, auth} from '@/app/lib/firebase';
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, getFirestore, writeBatch } from "firebase/firestore"; 

const fileTypeClassification : FileType[] = [
    { color:'#2B579A', type:'Word Processing Document', extensions:['.doc', '.docx', '.docm', '.dot', '.dotx', '.dotm']},
    { color:'#2196F3', type:'Image', extensions:['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.heif', '.heic', '.avif', '.eps']},
    { color:'#227447', type:'Spreadsheet', extensions:['.xls', '.xlsx', '.xlsm', '.xlsb', '.xlt', '.xltx', '.xltm', '.xla', '.xlam', '.xlw']},
    { color:'#A031EB', type:'Archive', extensions:['.zip','.rar','.7z','.tar','.gz','.bz2','.xz','.tar.gz','.tar.bz2','.tar.xz','.arc','.arj','.ace','.cab','.lz','.lzh']},
    { color:'#4332A2', type:'Binary File', extensions:['.bin']},
    { color:'#9525A5', type:'Java File', extensions:['.java','.class','.jar']},
    { color:'#FF5613', type:'Plaintext/Rich Text File ', extensions:['.txt','.rtf']},
    { color:'#D71064', type:'Presentation File ', extensions:['.ppt','.pptx','.pptm','.pps','.ppsx','.pot','.potx','.potm','.odp']},
    { color:'#D31A35', type:'PDF File ', extensions:['.pdf']},
    { color:'#E7013F', type:'Hypertext File ', extensions:['.html','.htm','.xhtml']},
    { color:'#FEEA00', type:'JavaScript File ', extensions:['.js','.mjs','.cjs','.jsx','.es6','.es']},
    { color:'#FF8C01', type:'TypeScript File ', extensions:['.ts','.tsx','.d.ts','.mts','.cts']},
    { color:'#29BF12', type:'Cascading Style Sheets ', extensions:['.css']},
    { color:'#06BE66', type:'Video File ', extensions:['.mp4','.mov','.wmv','.avi','.flv','.f4v','.mkv','.webm','.ogv','.ogg','.3gp','.m4v']},
    { color:'#41C3AA', type:'Audio File ', extensions:['.mp3','.wav','.aiff','.aac','.flac','.ogg','.m4a','.wma','.amr','.ape','.au','.ra','.rm']},
    { color:'#3D4785', type:'Unknown/Other', extensions:['']}
 ];

 const generateFileSizeString = (sizeInBytes: number): string => {
    if (sizeInBytes >= 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (sizeInBytes >= 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${sizeInBytes.toFixed(0)} Bytes`;
    }
  };

// File type classification
interface FileType {
   color:string;
   type:string;
   extensions:string[];
}

interface Container {
   id:string;
   title:string;
   color:string;
   fileSize:string;
   description:string;
   metadataIntegrity: boolean;
}

interface ContainerHelper {
  id: string;
  titleIntegrity: boolean;
  titlePaddingValidity: boolean;
  decryptedDescriptionIntegrity: boolean;
  decryptedDescriptionPaddingValidity: boolean;
  encryptedTag: string;
  encryptedLength: number;
}

class SingletonEffect {
  private static instance: SingletonEffect | null = null;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): SingletonEffect {
    if (this.instance === null) {
      this.instance = new SingletonEffect();
    }
    return this.instance;
  }

  public runEffect(effect: () => void) {
    if (!this.initialized) {
      effect();
      this.initialized = true;
    }
  }

  // New method to reset the singleton instance
  public static resetInstance() {
    this.instance = null;
  }
}

type RecordId = string;

export default function FilesContent() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [containerHelpers, setContainerHelpers] = useState<ContainerHelper[]>([]);
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [processingStep, setProcessingStep] = useState('');
  const [processingStepDescription, setProcessingStepDescription] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [descriptionPopup, setDescriptionPopup] = useState<React.ReactNode | null>(null);
  const {masterKey, username, iterations} = useStore();
  const [selectedRecordId, setSelectedRecordId] = useState<RecordId | null>(null);
  const [showConfirmPopUp, setShowConfirmPopUp] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 769);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<{
    messages: string[];
    fileName: string;
    fileUrl: string | null;
    onSave: (() => void) | null;
  } | null>(null);
  let fileIndex = 0;
  interface FileData {
    id: string;
    encryptedFilename: string;
    encryptedDescription: string;
    encryptedTag: string;
    fileSize: number;
    fileUrl: string;
    encryptedLength: number;
  }

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

  useEffect(() => {
    setShowProcessingPopup(true);
    setCurrentFileName(username +"'s files");
    setProcessingStep('Fetching the metadata of your files');
    setProcessingStepDescription('Please wait for a while');
    toggleProgressAnimation(true);
    const new_iterations: number = Math.round(100 + (iterations/11));
    const singleton = SingletonEffect.getInstance();
    singleton.runEffect(async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setCurrentFileName('Authentication Error');
          setProcessingStep('Please refresh the page and try logging in again.');
          setProcessingStepDescription('');
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('User not authenticated');
        }
        const filesRef = collection(db, `${user.email}/files/metadata`);
        const querySnapshot = await getDocs(filesRef);

        // Clear existing containers
        setContainers([]);

        for (const doc of querySnapshot.docs) {
          fileIndex++;
          setCurrentFileName(`Processing File N${fileIndex}/${querySnapshot.docs.length}`);
          setProcessingStep('Decrypting the file metadata');
          setProcessingStepDescription('Please wait for a while');
          setShowProcessingPopup(true);
          toggleProgressAnimation(true);
          const data = doc.data() as FileData;
          // Check if encryptedFilename is a valid hex string and multiple of 32 characters
          let decryptedFilename = 'Broken Metadata';
          let titleIntegrity = false;
          let titlePaddingValidity = false;

          if (/^[0-9a-fA-F]+$/.test(data.encryptedFilename) && data.encryptedFilename.length % 32 === 0) {
            const [decryptedFileNameArray, integrity, paddingValidity] = await decryptStringWithTwoCiphersCBC(data.encryptedFilename, masterKey, new_iterations);
            decryptedFilename = new TextDecoder().decode(decryptedFileNameArray);
            titleIntegrity = integrity;
            titlePaddingValidity = paddingValidity;
          }

          let decryptedDescription = 'Broken Metadata';
          let decryptedDescriptionIntegrity = false;
          let decryptedDescriptionPaddingValidity = false;

          if (data.encryptedDescription !== "4e6f206465736372697074696f6e2e") {
            if (/^[0-9a-fA-F]+$/.test(data.encryptedDescription) && data.encryptedDescription.length % 32 === 0) {
              const [decryptedFileDescriptionArray, descrIntegrity, descrPaddingValidity] = await decryptStringWithTwoCiphersCBC(data.encryptedDescription, masterKey, new_iterations);
              decryptedDescription = new TextDecoder().decode(decryptedFileDescriptionArray);
              decryptedDescriptionIntegrity = descrIntegrity;
              decryptedDescriptionPaddingValidity = descrPaddingValidity;
            }
          } else {
            decryptedDescription = 'No description.';
            decryptedDescriptionIntegrity = true; // Treat as valid since it's an exception
            decryptedDescriptionPaddingValidity = true;
          }

          let fileSizeString = 'Unknown'; // Default value
          if (typeof data.fileSize === 'number' && data.fileSize > 0) {
            fileSizeString = generateFileSizeString(data.fileSize);
          }
          const extension = decryptedFilename.split('.').pop() || '';
          const fileType = fileTypeClassification.find(type => type.extensions.includes(`.${extension}`));

          const metadataIntegrity: boolean = 
          (titleIntegrity && titlePaddingValidity) && 
          decryptedDescriptionIntegrity && 
          decryptedDescriptionPaddingValidity;
          const newContainer: Container = {
            id: doc.id,
            title: decryptedFilename,
            color: fileType ? fileType.color : '#3D4785',
            fileSize: `SIZE: ${fileSizeString}`,
            description: decryptedDescription,
            metadataIntegrity
          };

          const newContainerHelper: ContainerHelper = {
            id: doc.id,
            titleIntegrity,
            titlePaddingValidity,
            decryptedDescriptionIntegrity,
            decryptedDescriptionPaddingValidity,
            encryptedTag: data.encryptedTag,
            encryptedLength: data.encryptedLength
          };

          // Update state with the new containers immediately
          setContainers(prevContainers => [...prevContainers, newContainer]);
          setContainerHelpers(prevHelpers => [...prevHelpers, newContainerHelper]);
          setShowProcessingPopup(false);
        }
        SingletonEffect.resetInstance();
      } catch (error) {
        console.error('Error fetching file data:', error);
        toast.error(`Error fetching file data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setShowProcessingPopup(false); // Ensure popup is hidden after processing
      }
      try{
        if (!auth.currentUser) {
          setShowProcessingPopup(true);
          toggleProgressAnimation(true);
          setCurrentFileName('Authentication Error');
          setProcessingStep('Please refresh the page and try logging in again.');
          setProcessingStepDescription('');
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('User not authenticated');
        }
      }
      catch{

      }
    });
    return () => {
      // Cleanup logic here if necessary
    };

  }, []); // Empty dependency array to run only on mount

  const onDownload = async (containerId: string) => {
    const db = getFirestore();
  
    try {
      const user = auth.currentUser;
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('User not authenticated');
      }
  
      console.log(`Starting download for container: ${containerId}`);
      
      const containerHelper = containerHelpers.find(helper => helper.id === containerId);
      if (!containerHelper) {
        console.error('ContainerHelper not found for the given container ID');
        return null;
      }
  
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        console.error('Container not found');
        return null;
      }
  
      setShowProcessingPopup(true);
      setCurrentFileName(container.title);
      setProcessingStep('Downloading file');
      setProcessingStepDescription('Please wait for a while');
  
      const encryptedLength = containerHelper.encryptedLength;
      if (typeof encryptedLength !== 'number' || encryptedLength <= 0) {
        console.error('Invalid encryptedLength value');
        const db = getFirestore();
        toggleProgressAnimation(true);
        setProcessingStep('Broken metadata! Attempting to download all chunks at once as a collection.');
        setProcessingStepDescription('Please be patient, this may take a while. Ignore the progress bar.');
      
        // Reference to the collection
        const collectionRef = collection(db, `${user.email}/files/${containerId}`);
        
        // Fetch all documents in the collection
        const querySnapshot = await getDocs(collectionRef);
        
        const chunks: Uint8Array[] = [];
        
        // Process each document in the collection
        querySnapshot.forEach(doc => {
          const chunkData = doc.data();
          if (chunkData && 'data' in chunkData) {
            const hexString = chunkData.data as string;
            const uint8Array = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
            chunks.push(uint8Array);
          } else {
            console.error(`Chunk ${doc.id} is missing data`);
          }
        });
      
        // Combine all chunks into a single array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
      
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }
      
        // Proceed to decryption
        setProcessingStep('Decrypting file');
        setProcessingStepDescription('Please wait for a while');
        const new_iterations: number = Math.round(100 + (iterations / 11));
        await decryptFileWithTwoCiphersCBC(combinedArray, masterKey, new_iterations, containerId);
      }
      else{
        console.log(`Encrypted length retrieved: ${encryptedLength}`);
        const chunkSize = 16 * 1024;
        const totalChunks = Math.ceil(encryptedLength / chunkSize);
        console.log(`Calculated number of chunks: ${totalChunks}`);
    
        const chunks: Uint8Array[] = [];
        let downloadedChunks = 0;
        let chunkNumber = 0;
    
        while (chunkNumber < totalChunks) {
          const chunkRef = doc(db, `${user.email}/files/${containerId}`, `${chunkNumber}`);
          const chunkDoc = await getDoc(chunkRef);
    
          if (!chunkDoc.exists()) {
            //console.log(`No more chunks found after ${downloadedChunks} chunks.`);
            break;
          }
    
          const chunkData = chunkDoc.data();
          if (chunkData && 'data' in chunkData) {
            const hexString = chunkData.data as string;
            //console.log(`Processing chunk ${chunkNumber} (Firebase doc: ${chunkDoc.ref.path})`);
    
            const uint8Array = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
            chunks.push(uint8Array);
            downloadedChunks++;
    
            const progress = (downloadedChunks / totalChunks) * 100;
            setProcessingProgress(progress);
            setProcessingStep(`Downloading file chunk N${downloadedChunks}/${totalChunks}`);
    
            //console.log(`Downloaded chunk ${chunkNumber}: ${uint8Array.length} bytes`);
            //console.log(`Download progress: ${progress.toFixed(2)}% (${downloadedChunks} chunks retrieved)`);
          } else {
            //console.error(`Chunk ${chunkNumber} is missing data`);
          }
          chunkNumber++;
        }
    
        //console.log('Combining chunks...');
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          combinedArray.set(chunk, offset);
          offset += chunk.length;
          //console.log(`Set chunk ${i} at offset ${offset - chunk.length}, length: ${chunk.length}`);
        }
    
        //console.log(`Download completed. Total size: ${combinedArray.length} bytes`);
    
        setProcessingStep('Decrypting file');
        setProcessingStepDescription('Please wait for a while');
    
        const new_iterations: number = Math.round(100 + (iterations/11));
        await decryptFileWithTwoCiphersCBC(combinedArray, masterKey, new_iterations, containerId);
    }
    } catch (error) {
      
      if (error instanceof Error && error.message === 'User not authenticated') {
        setShowProcessingPopup(true);
        setCurrentFileName('Authentication Error');
        setProcessingStep('Please refresh the page and try logging in again.');
        setProcessingStepDescription('');
        toggleProgressAnimation(true);
        
        // Create a promise that never resolves
        await new Promise(() => {});
      } else {
        console.error('Download failed:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
          setProcessingStep('Download failed');
          setProcessingStepDescription(error.message);
        }
        return null;
      }
    }
  };

  const decryptFileWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    password: Uint8Array,
    iterations: number,
    containerId: string
  ): Promise<void> => {
    setShowProcessingPopup(true);
    const chunkSize = 16;
    const salt = bytes.slice(0, 32);
    toggleProgressAnimation(true);
    setProcessingStep('Deriving file decryption key using Argon2id');
    setProcessingStepDescription('The page might freeze or become unresponsive during the process');
    const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96, 224);
    toggleProgressAnimation(false);
  
    const extractedIV = bytes.slice(32, 48);
    const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
    setProcessingStep('Step 1/2 - Decrypting file with Serpent-256 CBC');
    setProcessingStepDescription('Please wait for a while');
    let previousCiphertext = decryptedIV;
  
    const updateProgressWithDelay = async (progress: number): Promise<void> => {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    };
  
    const decryptedData: number[] = [];
    const dataLengthNoLC = bytes.length - chunkSize;
    for (let i = 48; i < dataLengthNoLC; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
      const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
      xorChunk.forEach(byte => decryptedData.push(byte));
      previousCiphertext = chunk;
  
      if ((i - 112) % 16000 === 0) {
        await updateProgressWithDelay(((i - 112) / (dataLengthNoLC - 112)) * 100);
      }
    }
  
    // Handle padding in the last block
    const encryptedLastBlock = bytes.slice(bytes.length - chunkSize);
    const decryptedLastBlock = await decryptSerpent256ECB(encryptedLastBlock, blockCipherKey);
    const decryptedLastBlockXORed = decryptedLastBlock.map((byte, index) => byte ^ previousCiphertext[index]);
    const paddingLength = pkcs7PaddingConsumed(decryptedLastBlockXORed);
    await updateProgressWithDelay(100);
    let invalidPadding = false;
    if (paddingLength === 0) {
      invalidPadding = true;
    } else if (paddingLength === 16) {
      // Do nothing
    } else {
      const unpaddedLastBlock = decryptedLastBlockXORed.slice(0, 16 - paddingLength);
      unpaddedLastBlock.forEach(byte => decryptedData.push(byte));
    }
  
    const decryptedDataUint8Array = new Uint8Array(decryptedData);
  
    toggleProgressAnimation(false);
    setProcessingStep('Step 2/2 - Decrypting file with ChaCha20');
    const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
    let streamCipherOffset = 0;
    const decryptedTag = new Uint8Array(64);
    const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
    let decryptedOffset = 0;
    
    let isFirstChunk = true;
    
    while (streamCipherOffset < decryptedDataUint8Array.length) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
    
      const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    
      if (isFirstChunk) {
        decryptedTag.set(decryptedChunk.slice(0, 64));
        decryptedChunks.set(decryptedChunk.slice(64), 0);
        decryptedOffset = decryptedChunk.length - 64;
        isFirstChunk = false;
      } else {
        decryptedChunks.set(decryptedChunk, decryptedOffset);
        decryptedOffset += decryptedChunk.length;
      }
    
      streamCipherOffset += chunk.length;
      const progress = (streamCipherOffset / decryptedDataUint8Array.length) * 100;
      await updateProgressWithDelay(progress);
    }
    const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
    setProcessingStep('Verifying file integrity');
    const newTag = await computeTagForFileUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
    let integrityFailed = false;
    for (let i = 0; i < 64; i++) {
      if (decryptedTag[i] !== newTag[i]) {
        integrityFailed = true;
        break;
      }
    }
    setShowProcessingPopup(false);
    const containerHelper = containerHelpers.find(helper => helper.id === containerId);
    if (!containerHelper) {
      throw new Error('ContainerHelper not found for the given container ID');
    }
  
    const container = containers.find(c => c.id === containerId);
    if (!container) {
      throw new Error('Container not found');
    }
  
    // Prepare decrypted data in 16-byte chunks
    const finalChunkSize = 16;
    const finalDecryptedChunks: Uint8Array[] = [];
    for (let i = 0; i < decryptedWithStreamCipher.length; i += finalChunkSize) {
      finalDecryptedChunks.push(decryptedWithStreamCipher.slice(i, i + finalChunkSize));
    }
    const decryptedFile = new Blob(finalDecryptedChunks, { type: 'application/octet-stream' });
    const url = URL.createObjectURL(decryptedFile);
  
    let messages: string[] = [];
  
    if (invalidPadding && integrityFailed) {
      messages = ['Decryption errors: invalid padding, integrity/authenticity verification failed'];
    } else if (invalidPadding) {
      messages = ['Decryption error: invalid padding'];
    } else if (integrityFailed) {
      messages = ['File integrity verification failed. The file may be corrupted or tampered with.'];
    } else {
      messages = ['File decrypted successfully', 'File integrity verified successfully'];
  
      const recordVerificationKey = derivedKey.slice(224);
      const filenameBytes = new TextEncoder().encode(container.title);
      const descriptionBytes = new TextEncoder().encode(container.description);
      const combinedData = new Uint8Array(filenameBytes.length + descriptionBytes.length + decryptedTag.length);
      combinedData.set(filenameBytes, 0);
      combinedData.set(descriptionBytes, filenameBytes.length);
      combinedData.set(decryptedTag, filenameBytes.length + descriptionBytes.length);
      
      const calculatedRecordTag = await computeTagForRecordUsingHMACSHA512(recordVerificationKey.slice(96), combinedData);
      let decryptedRecordTag;

      if (typeof containerHelper.encryptedTag === 'string' && 
          containerHelper.encryptedTag.length === 160 && 
          /^[0-9A-Fa-f]+$/.test(containerHelper.encryptedTag)) {
        
        // Decrypt the tag since it is a valid hex string with exactly 160 characters
        decryptedRecordTag = await decryptRecordTagWithTwoCiphersCBC(containerHelper.encryptedTag, recordVerificationKey);
      } else {
        // Set to a Uint8Array with one element (0) if the conditions are not met
        decryptedRecordTag = new Uint8Array(1);
        decryptedRecordTag[0] = 0; // Set the first element to 0
      }
      const recordIntegrity = compareUint8Arrays(calculatedRecordTag, decryptedRecordTag);
  
      const metadataIssues: string[] = [];
  
      if (!recordIntegrity) {
        metadataIssues.push('Record integrity verification failed');
      }
      if (!containerHelper.titleIntegrity) {
        metadataIssues.push('Title integrity verification failed');
      }
      if (!containerHelper.titlePaddingValidity) {
        metadataIssues.push('Title padding is invalid');
      }
      if (!containerHelper.decryptedDescriptionIntegrity) {
        metadataIssues.push('Description integrity verification failed');
      }
      if (!containerHelper.decryptedDescriptionPaddingValidity) {
        metadataIssues.push('Description padding is invalid');
      }
  
      if (metadataIssues.length === 0) {
        messages.push('Metadata integrity verified successfully');
      } else {
        messages.push('There are issues with the file metadata:');
        messages = messages.concat(metadataIssues);
      }
    }
  
    // Show the pop-up form
    showPopupForm({
      messages: messages,
      fileName: container.title,
      fileUrl: url,
      onSave: () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = container.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      onClose: () => {
        URL.revokeObjectURL(url);
        closePopupForm();
      }
    });
  };

  const showPopupForm = (data: {
    messages: string[];
    fileName: string;
    fileUrl: string | null;
    onSave: (() => void) | null;
    onClose: () => void;
  }) => {
    setPopupData(data);
    setShowPopup(true);
  };

  const closePopupForm = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  const decryptRecordTagWithTwoCiphersCBC = async (
    input: string, 
    derivedKey: Uint8Array, 
  ): Promise<Uint8Array> => {
    const chunkSize = 16;
  
    const bytes = new Uint8Array(input.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
  
    const extractedIV = bytes.slice(0, 16);
    const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
    let previousCiphertext = decryptedIV;
  
    const decryptedData: number[] = [];
    const dataLength = bytes.length;
    for (let i = 16; i < dataLength; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
      const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
      for (let j = 0; j < xorChunk.length; j++) {
        decryptedData.push(xorChunk[j]);
      }
      previousCiphertext = chunk;
    }
  
    const decryptedDataUint8Array = new Uint8Array(decryptedData);
  
    const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
    let streamCipherOffset = 0;
    const decryptedChunks = new Uint8Array(decryptedDataUint8Array);
    let decryptedOffset = 0;
    
    while (streamCipherOffset < decryptedDataUint8Array.length) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
    
      const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
      decryptedChunks.set(decryptedChunk, decryptedOffset);
      decryptedOffset += decryptedChunk.length;
    
      streamCipherOffset += chunk.length;
    }
  
    return decryptedChunks;
  };

  function compareUint8Arrays(array1: Uint8Array, array2: Uint8Array): boolean {
    // Check if the lengths are equal
    if (array1.length !== array2.length) {
      return false;
    }
  
    // Compare each element in the arrays
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false; // Return false if any element is different
      }
    }
  
    return true; // Return true if all elements are equal
  }

  const deleteCollection = async (containerId: string, totalChunks: number) => {
    toggleProgressAnimation(false);
    const batchSize = 10; // Number of deletes per batch
    let batch = writeBatch(db);
    let deletedChunks = 0;
  
    async function updateProgressWithDelay(progress: number) {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  
    for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
      const chunkRef = doc(db, `${auth.currentUser?.email}/files/${containerId}`, `${chunkNumber}`);
      //console.log(`Preparing to delete chunk document: ${chunkRef.path}`);
      batch.delete(chunkRef);
  
      if ((chunkNumber + 1) % batchSize === 0) {
        try {
          await batch.commit();
          deletedChunks += batchSize;
          const progress = (deletedChunks / totalChunks) * 100;
          //console.log(`Batch deletion committed successfully for ${batchSize} chunks. Progress: ${progress.toFixed(2)}%`);
          await updateProgressWithDelay(parseFloat(progress.toFixed(2)));
        } catch (error) {
          console.error('Error committing batch deletion:', error);
        }
        batch = writeBatch(db);
      }
    }
  
    if (totalChunks % batchSize !== 0) {
      try {
        await batch.commit();
        deletedChunks += totalChunks % batchSize;
        const progress = (deletedChunks / totalChunks) * 100;
        //console.log(`Final batch deletion committed successfully for remaining chunks. Progress: ${progress.toFixed(2)}%`);
        await updateProgressWithDelay(parseFloat(progress.toFixed(2)));
      } catch (error) {
        console.error('Error committing final batch deletion:', error);
      }
    }
    //console.log('All chunks deleted successfully.');
  };
  
  const deleteRecord = useCallback(async () => {
    setShowConfirmPopUp(false);
    if (selectedRecordId) {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
  
        const containerId = selectedRecordId;
        const containerHelper = containerHelpers.find(helper => helper.id === containerId);
        
        if (!containerHelper) {
          throw new Error('ContainerHelper not found for the given container ID');
        }
    
        const encryptedLength = containerHelper.encryptedLength;
    
        if (typeof encryptedLength !== 'number') {
          console.warn('Invalid or unknown encryptedLength value. Deleting all elements in the collection.');
        
          // Update the processing popup with a message
          setShowProcessingPopup(true);
          setProcessingStep('Broken metadata detected. Deleting file using the collection reference.');
          setProcessingStepDescription('This may take a while, please be patient, and ignore the progress bar.');
        
          // Reference to the collection
          const collectionRef = collection(db, `${user.email}/files/${containerId}`);
          
          // Fetch all documents in the collection
          const querySnapshot = await getDocs(collectionRef);
          
          // Delete each document in the collection
          const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        
          // Now delete the metadata document
          await deleteDoc(doc(db, `${user.email}/files/metadata`, containerId));
          
          setContainers(prevContainers => prevContainers.filter(c => c.id !== containerId));
          setContainerHelpers(prevContainers => prevContainers.filter(c => c.id !== containerId));
          setShowProcessingPopup(false);
          setShowProcessingPopup(false);
          toast.success('File with broken metadata deleted successfully!');
          
          return; // Exit early after deletion
        }
    
        const container = containers.find(c => c.id === containerId);
        if (!container) {
          throw new Error('Container not found');
        }
    
        setShowProcessingPopup(true);
        const fileName = container.title;
        setCurrentFileName(fileName);
        setProcessingStep('Deleting file');
        setProcessingStepDescription('Please wait for a while.');
        toggleProgressAnimation(true);
    
        const chunkSize = 16 * 1024;
        const totalChunks = Math.ceil(encryptedLength / chunkSize);
        
        //console.log(`Total chunks to delete: ${totalChunks}`);
    
        await deleteCollection(containerId, totalChunks);
    
        setProcessingStep('Deleting metadata');
        toggleProgressAnimation(true);
        setProcessingStepDescription("This shouldn't take long");
    
        await deleteDoc(doc(db, `${user.email}/files/metadata`, containerId));
    
        setContainers(prevContainers => prevContainers.filter(c => c.id !== containerId));
        setContainerHelpers(prevContainers => prevContainers.filter(c => c.id !== containerId));
        setShowProcessingPopup(false);
        toast.success('File deleted successfully!');
      } catch (error) {
        if (error instanceof Error && error.message === 'User not authenticated') {
          setShowProcessingPopup(true);
          setCurrentFileName('Authentication Error');
          setProcessingStep('Please refresh the page and try logging in again.');
          setProcessingStepDescription('');
          toggleProgressAnimation(true);
          await new Promise(() => {});
        } else {
          toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
          setShowProcessingPopup(false);
        }
      }
    }
  }, [selectedRecordId]);

  const showFileInfo = useCallback((containerId: RecordId) => {
    // Find the container and containerHelper with the given ID
    const container = containers.find(c => c.id === containerId);
    const containerHelper = containerHelpers.find(ch => ch.id === containerId);
    if (!container || !containerHelper) return;
  
    // Check for metadata issues
    const metadataIssues = [
      { name: 'Broken title integrity', value: containerHelper.titleIntegrity },
      { name: 'Invalid title padding', value: containerHelper.titlePaddingValidity },
      { name: 'Broken description integrity', value: containerHelper.decryptedDescriptionIntegrity },
      { name: 'Invalid description padding', value: containerHelper.decryptedDescriptionPaddingValidity }
    ].filter(issue => !issue.value);
  
    // Create the pop-up element
    const popup = document.createElement('div');
    popup.id = 'file-info-popup';
    popup.className = 'file-info-popup';
    
    // Set the content of the pop-up
    popup.innerHTML = `
      <div class="popup-content" id="popup-card">
        <h2>${container.title}</h2>
        <p><strong>Size:</strong> ${container.fileSize} bytes</p>
        <p><strong>Encrypted size:</strong> ${generateFileSizeString(containerHelper.encryptedLength)} bytes</p>
        <p><strong>Description:</strong> ${container.description}</p>
        ${metadataIssues.length > 0 ? `
          <h3>Metadata Issues:</h3>
          <ul>
            ${metadataIssues.map(issue => `<li>${issue.name}</li>`).join('')}
          </ul>
        ` : ''}
        <button id="closePopup">OK</button>
      </div>
    `;
  
    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --rotation: 2.5rad;
      }
      .file-info-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Inter', sans-serif;
      }
      .popup-content {
        background-color: #050505;
        padding: 40px;
        border-radius: 20px;
        width: 600px;
        max-width: 90%;
        color: white;
        font-size: 18px;
        background-image: linear-gradient(black, black), linear-gradient(calc(var(--rotation)), #888 0, #444 20%, transparent 80%);
        background-origin: border-box;
        background-clip: padding-box, border-box;
        border: 1px solid transparent;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 15px rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        position: fixed;
        left: ${isMobile ? '50%' : 'calc(50% + 30px)'};
        top: 50%;
        transform: translate(-50%, -50%);
      }
      .popup-content h2 {
        color: ${container.color};
        margin-bottom: 20px;
        font-weight: bold;
        text-align: center;
        width: 100%;
      }
      .popup-content h3 {
        margin-top: 20px;
        margin-bottom: 10px;
      }
      .popup-content p, .popup-content li {
        margin-bottom: 10px;
      }
      .popup-content ul {
        list-style-type: none;
        padding-left: 0;
      }
      #closePopup {
        height: 50px;
        width: 100%;
        border-radius: 10px;
        border: 1px solid #888;
        color: black;
        background-color: white;
        box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.25);
        transition: all 0.2s ease;
        cursor: pointer;
        margin-top: 20px;
      }
      #closePopup:hover {
        color: white;
        background-color: black;
      }
    `;
  
    // Add the style to the document
    document.head.appendChild(style);
  
    // Add the pop-up to the document
    document.body.appendChild(popup);
  
    // Add event listener to close the pop-up
    const closeButton = popup.querySelector('#closePopup');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.body.removeChild(popup);
        document.head.removeChild(style);
      });
    }
  
    // Add mousemove event listener for the gradient effect
    const card = popup.querySelector('#popup-card');
    if (card instanceof HTMLElement) {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const angle = Math.atan2(-x, y);
        card.style.setProperty('--rotation', `${angle}rad`);
      });
    }
  
  }, [containers, containerHelpers, isMobile]);
  
  const onDelete = useCallback((containerId: RecordId) => {
    setShowConfirmPopUp(true);
    setSelectedRecordId(containerId);
  }, []);

  const handleCancelDelete = () => {
    setShowConfirmPopUp(false);
  };

  const computeTagForFileUsingHMACSHA512 = useCallback(async (key: Uint8Array, data: Uint8Array) => {
    toggleProgressAnimation(false);
    setProcessingStep('Computing tag for file using HMAC-SHA512');
    setProcessingStepDescription('Please wait for a while');
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    const hmac = await createHMAC(createSHA512(), key);
    hmac.init();
  
    async function updateProgressWithDelay(progress: number) {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  
    while (offset < data.length) {
      const chunk = data.slice(offset, Math.min(offset + chunkSize, data.length));
      hmac.update(chunk);
      offset += chunk.length;
  
      const progress = (offset / data.length) * 100;
      await updateProgressWithDelay(progress);
    }
    setProcessingProgress(100);
    setProcessingStep('Finalizing tag computation');
    await new Promise(resolve => setTimeout(resolve, 50));
    toggleProgressAnimation(true);
  
    const signature = hmac.digest('binary');
    return new Uint8Array(signature);
  }, []);

  const computeTagForRecordUsingHMACSHA512 = useCallback(async (key: Uint8Array, data: Uint8Array) => {
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    const hmac = await createHMAC(createSHA512(), key);
    hmac.init();
  
    while (offset < data.length) {
      const chunk = data.slice(offset, Math.min(offset + chunkSize, data.length));
      hmac.update(chunk);
      offset += chunk.length;
  
    }
  
    const signature = hmac.digest('binary');
    return new Uint8Array(signature);
  }, []);

const showDescriptionPopup = useCallback((fileName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setDescriptionPopup(
      <DescriptionPopup
        message={`The file "${fileName}" has been encrypted successfully. Would you like to add a description to the file?`}
        onYes={() => {
          setDescriptionPopup(null);
          resolve(true);
        }}
        onNo={() => {
          setDescriptionPopup(null);
          resolve(false);
        }}
      />
    );
  });
}, []);

const getUserDescription = useCallback((fileName: string): Promise<string> => {
  return new Promise((resolve) => {
    setDescriptionPopup(
      <DescriptionInputPopup
      message={`Enter description for the "${fileName}" file:`}
        onSubmit={(description: string) => {
          setDescriptionPopup(null);
          resolve(description);
        }}
        onCancel={() => {
          setDescriptionPopup(null);
          resolve("");
        }}
      />
    );
  });
}, []);

const handleFiles = async (files: FileList) => {
  const nonEmptyFiles = Array.from(files).filter(file => {
    if (file.size === 0) {
      toast.error(`The "${file.name}" file was excluded from the encryption queue. The file can't be empty.`);
      return false;
    }
    if (file.size > 5 * 1024 * 1024) { // 5 MB in bytes
      toast.error(`The "${file.name}" file was excluded from the encryption queue. The file size can't exceed 5 MB.`);
      return false;
    }
    return true;
  });

  const new_iterations: number = Math.round(100 + (iterations/11));
  for (let i = 0; i < nonEmptyFiles.length; i++) {
    setShowProcessingPopup(true);
    const file = nonEmptyFiles[i];
    setCurrentFileName(file.name);
    setProcessingProgress(0);
    setProcessingStep('Reading file');
    setProcessingStepDescription('Please wait for a while');

    try {
      const fileBytes = await readFileByChunks(file);
      
      const [encryptedData, tag, recordKey] = await encryptFileWithTwoCiphersCBC(fileBytes, masterKey, new_iterations);
      
      const userWantsDescription = await showDescriptionPopup(file.name);
      let description: Uint8Array;

      if (userWantsDescription) {
        const userDescription = await getUserDescription(file.name);
        description = new TextEncoder().encode(userDescription.trim() === "" ? 'No description.' : userDescription);
      } else {
        description = new TextEncoder().encode('No description.');
      }

      // Encode filename
      const filenameBytes = new TextEncoder().encode(file.name);
      
      toggleProgressAnimation(true);
      setProcessingStep('Encrypting Filename');
      setProcessingStepDescription('Please wait for a while');
      const encryptedFilename = await encryptDataWithTwoCiphersCBC(filenameBytes, masterKey, new_iterations);
      let encryptedDescription;
      if (new TextDecoder().decode(description) !== 'No description.') {
          toggleProgressAnimation(true);
          setProcessingStep('Encrypting Description');
          encryptedDescription = await encryptDataWithTwoCiphersCBC(description, masterKey, new_iterations);
      } else {
          encryptedDescription = new TextEncoder().encode('No description.');
      }

      const combinedData = new Uint8Array(filenameBytes.length + description.length + tag.length);
      combinedData.set(filenameBytes, 0);
      combinedData.set(description, filenameBytes.length);
      combinedData.set(tag, filenameBytes.length + description.length);
      const encryptedTag = await encryptRecordTagWithTwoCiphersCBC(combinedData, recordKey);
      /*
      console.log("Encrypted File Content:", encryptedData);
      console.log("Encrypted Filename:", encryptedFilename);
      console.log("Encrypted Description:", encryptedDescription);
      console.log("Encrypted Record Tag:", encryptedTag);
      console.log("File size:", file.size);
      */
      await uploadFile(encryptedData, encryptedFilename, encryptedDescription, encryptedTag, file.size, file.name, new TextDecoder().decode(description));
    } catch (error) {
      toast.error(`Error processing the "${file.name}" file. Check the console for more information.`);
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  setShowProcessingPopup(false);
};

const generateUniqueId = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = window.crypto.getRandomValues(new Uint8Array(10));
  return Array.from(randomValues, (byte) => charset[byte % charset.length]).join('');
};
const uploadFile = async (
  encryptedData: Uint8Array,
  encryptedFilename: Uint8Array,
  encryptedDescription: Uint8Array,
  encryptedTag: Uint8Array,
  fileSize: number,
  unencryptedFilename: string,
  unencryptedDescription: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    setProcessingStep("Preparing for file upload");
    setProcessingStepDescription('Please wait for a while');
    toggleProgressAnimation(true);

    let uniqueId: string = '';
    let isUnique = false;
    while (!isUnique) {
      uniqueId = generateUniqueId();
      const docRef = doc(db, `${user.email}/files/metadata`, uniqueId);
      const docSnap = await getDoc(docRef);
      isUnique = !docSnap.exists();
    }

    const updateProgressWithDelay = async (progress: number) => {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    };

    const chunkSize = 16 * 1024;
    const totalChunks = Math.ceil(encryptedData.length / chunkSize);

    setProcessingStep("Uploading the file to the cloud");
    setProcessingStepDescription('Please be patient. This can take a while!');
    setShowProcessingPopup(true);
    toggleProgressAnimation(false);
    await updateProgressWithDelay(0);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, encryptedData.length);
      const chunk = encryptedData.slice(start, end);
      
      const chunkHex = Array.from(chunk).map(byte => byte.toString(16).padStart(2, '0')).join('');
      
      await setDoc(doc(db, `${user.email}/files/${uniqueId}`, `${i}`), {
        data: chunkHex
      });

      const progress = parseFloat(((i + 1) / totalChunks * 100).toFixed(2));
      
      if (progress === 100) {
        setProcessingStep("Wrapping up the upload");
        setProcessingStepDescription("That shouldn't take long");
      } else {
        setProcessingStep("Uploading the file to the cloud");
        setProcessingStepDescription('Please be patient. This can take a while!');
      }

      await updateProgressWithDelay(progress);
    }

    // Create record data with encryptedLength
    const recordData = {
      encryptedFilename: Array.from(encryptedFilename).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      encryptedDescription: Array.from(encryptedDescription).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      encryptedTag: Array.from(encryptedTag).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      fileSize: fileSize,
      encryptedLength: encryptedData.length // Add the encrypted length here
    };

    await setDoc(doc(db, `${user.email}/files/metadata`, uniqueId), recordData);

    // File size and type logic
    const fileSizeString = generateFileSizeString(fileSize);
    const extension = unencryptedFilename.split('.').pop() || '';
    const fileType = fileTypeClassification.find(type => type.extensions.includes(`.${extension}`));

    // Create new container for UI
    const newContainer: Container = {
      id: uniqueId,
      title: unencryptedFilename,
      color: fileType ? fileType.color : '#3D4785',
      fileSize: `SIZE: ${fileSizeString}`,
      description: unencryptedDescription,
      metadataIntegrity: true
    };

    // Update UI with new container
    setContainers(prevContainers => [...prevContainers, newContainer]);

    const newContainerHelper: ContainerHelper = {
      id: uniqueId,
      titleIntegrity: true,
      titlePaddingValidity: true,
      decryptedDescriptionIntegrity: true,
      decryptedDescriptionPaddingValidity: true,
      encryptedTag: Array.from(encryptedTag).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      encryptedLength: encryptedData.length
    };

    setContainerHelpers(prevHelpers => [...prevHelpers, newContainerHelper]);

    setShowProcessingPopup(false);
    toast.success('File uploaded successfully!');

  } catch (error) {

    if (error instanceof Error && error.message === 'User not authenticated') {
      setShowProcessingPopup(true);
      setCurrentFileName('Authentication Error');
      setProcessingStep('Please refresh the page and try logging in again.');
      setProcessingStepDescription('');
      toggleProgressAnimation(true);
      
      // Create a promise that never resolves
      await new Promise(() => {});
    } else {
      // For other errors, show the error message and close the processing popup
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setShowProcessingPopup(false);
    }
  }
};

  const readFileByChunks = async (file: File): Promise<Uint8Array> => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const reader = new FileReader();
    let offset = 0;
    const totalSize = file.size;
    const fileBytes = new Uint8Array(totalSize);
  
    const readChunk = (blob: Blob): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(e.target?.error);
        reader.readAsArrayBuffer(blob);
      });
    };
  
    const updateProgressWithDelay = async (progress: number) => {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    };
  
    while (offset < totalSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await readChunk(chunk);
      const uint8Array = new Uint8Array(arrayBuffer);
      fileBytes.set(uint8Array, offset);
      offset += uint8Array.length;
      const progress = ((offset / totalSize) * 100).toFixed(2);
      await updateProgressWithDelay(parseFloat(progress));
    }
  
    return fileBytes;
  };
  

  const encryptFileWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    password: Uint8Array,
    iterations: number
  ): Promise<[Uint8Array, Uint8Array, Uint8Array]> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    const encryptedChunks: Uint8Array[] = [];
    encryptedChunks.push(salt);
    toggleProgressAnimation(true);
    setProcessingStep('Deriving file encryption key using Argon2id');
    setProcessingStepDescription('The page might freeze or become unresponsive during the process');
    const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96, 224);
    toggleProgressAnimation(false);
    setProcessingStep('Computing tag for file');
    setProcessingStepDescription('Please wait for a while');
    const tag = await computeTagForFileUsingHMACSHA512(hmacKey, bytes);

    setProcessingStep('Preparing file for encryption');
    const tag_and_data = new Uint8Array(tag.length + bytes.length);
    tag_and_data.set(tag, 0);
    tag_and_data.set(bytes, tag.length);


    const encryptedData = new Uint8Array(tag_and_data.length);
    toggleProgressAnimation(false);
    setProcessingStep('Step 1/2 - Encrypting file with ChaCha20');
    const updateProgressWithDelay = async (progress: number) => {
      setProcessingProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    };
  
    const totalSize = tag_and_data.length;
    while (offset < totalSize) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
      const chunk = tag_and_data.slice(offset, Math.min(offset + chunkSize, totalSize));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);
  
      for (let i = 0; i < encryptedChunk.length; i++) {
        encryptedData[offset + i] = encryptedChunk[i];
      }
      offset += chunk.length;
      const progress = (offset / totalSize) * 100;
      await updateProgressWithDelay(progress);
    }

    const blockcipher_chunk_size = 16;
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
    encryptedChunks.push(encryptedIV);
    toggleProgressAnimation(false);
    setProcessingStep('Step 2/2 - Encrypting file with Serpent-256 CBC');
    let previousCiphertext = iv;
    for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
      let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);
      if (chunk.length < blockcipher_chunk_size) {
        const padding = blockcipher_chunk_size - chunk.length;
        const paddedChunk = new Uint8Array(blockcipher_chunk_size);
        paddedChunk.set(chunk);
        paddedChunk.fill(padding, chunk.length);
        chunk = paddedChunk;
      }
      const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
      const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
      encryptedChunks.push(encryptedChunk);
      previousCiphertext = encryptedChunk;
      if (i % 16000 === 0) {
        await updateProgressWithDelay((i / encryptedData.length) * 100);
      }
    }
  
    await updateProgressWithDelay(100);
    setProcessingStep('Encryption done!');
    setProcessingStepDescription('');
    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let soffset = 0;
    for (const chunk of encryptedChunks) {
      result.set(chunk, soffset);
      soffset += chunk.length;
    }
  
    return [result, tag, derivedKey.slice(224)];
  }

  const encryptRecordTagWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    derivedKey: Uint8Array
  ): Promise<Uint8Array> => {
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    const encryptedChunks: Uint8Array[] = [];
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
    const tag = await computeTagForRecordUsingHMACSHA512(hmacKey, bytes);

    const encryptedData = new Uint8Array(tag.length);
  
    const totalSize = tag.length;
    while (offset < totalSize) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
      const chunk = tag.slice(offset, Math.min(offset + chunkSize, totalSize));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);
  
      for (let i = 0; i < encryptedChunk.length; i++) {
        encryptedData[offset + i] = encryptedChunk[i];
      }
      offset += chunk.length;
    }

    const blockcipher_chunk_size = 16;
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
    encryptedChunks.push(encryptedIV);
    let previousCiphertext = iv;
    for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
      let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);
      if (chunk.length < blockcipher_chunk_size) {
        const padding = blockcipher_chunk_size - chunk.length;
        const paddedChunk = new Uint8Array(blockcipher_chunk_size);
        paddedChunk.set(chunk);
        paddedChunk.fill(padding, chunk.length);
        chunk = paddedChunk;
      }
      const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
      const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
      encryptedChunks.push(encryptedChunk);
      previousCiphertext = encryptedChunk;
    }

    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let soffset = 0;
    for (const chunk of encryptedChunks) {
      result.set(chunk, soffset);
      soffset += chunk.length;
    }
  
    return result;
  }

  const decryptStringWithTwoCiphersCBC = async (
    input: string, 
    password: Uint8Array, 
    iterations: number
  ): Promise<[Uint8Array, boolean, boolean]> => {
    const chunkSize = 16;
  
    const bytes = new Uint8Array(input.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
    const salt = bytes.slice(0, 32);
    const derivedKey = await derive224BytesUsingArgon2id(password, salt, iterations);
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
  
    const extractedIV = bytes.slice(32, 48);
    const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
    let previousCiphertext = decryptedIV;
  
    const decryptedData: number[] = [];
    const dataLengthNoLC = bytes.length - chunkSize;
    for (let i = 48; i < dataLengthNoLC; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
      const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
      for (let j = 0; j < xorChunk.length; j++) {
        decryptedData.push(xorChunk[j]);
      }
      previousCiphertext = chunk;
    }
  
    // Handle padding in the last block
    const encryptedLastBlock = bytes.slice(bytes.length - chunkSize);
    const decryptedLastBlock = await decryptSerpent256ECB(encryptedLastBlock, blockCipherKey);
    const decryptedLastBlockXORed = decryptedLastBlock.map((byte, index) => byte ^ previousCiphertext[index]);
    const paddingLength = pkcs7PaddingConsumed(decryptedLastBlockXORed);
    let paddingValid = true;
    if (paddingLength === 0) {
      paddingValid = false;
    } else if (paddingLength === 16) {
      // Do nothing
    } else {
      const unpaddedLastBlock = decryptedLastBlockXORed.slice(0, 16 - paddingLength);
      for (let j = 0; j < unpaddedLastBlock .length; j++) {
        decryptedData.push(unpaddedLastBlock[j]);
      }
    }
  
    const decryptedDataUint8Array = new Uint8Array(decryptedData);
  
    const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
    let streamCipherOffset = 0;
    const decryptedTag = new Uint8Array(64);
    const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
    let decryptedOffset = 0;
    
    let isFirstChunk = true;
    
    while (streamCipherOffset < decryptedDataUint8Array.length) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
    
      const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    
      if (isFirstChunk) {
        decryptedTag.set(decryptedChunk.slice(0, 64));
        decryptedChunks.set(decryptedChunk.slice(64), 0);
        decryptedOffset = decryptedChunk.length - 64;
        isFirstChunk = false;
      } else {
        decryptedChunks.set(decryptedChunk, decryptedOffset);
        decryptedOffset += decryptedChunk.length;
      }
    
      streamCipherOffset += chunk.length;
    }
    
    const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
    const newTag = await computeTagForRecordUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
    let integrityPassed = true;
    for (let i = 0; i < 64; i++) {
      if (decryptedTag[i] !== newTag[i]) {
        integrityPassed = false;
        break;
      }
    }
    
    return [decryptedWithStreamCipher, integrityPassed, paddingValid];
  };

  function pkcs7PaddingConsumed(data: Uint8Array) {
    let allTen = true;
    for (let i = 0; i < 16; i++) {
      if (data[i] !== 0x10) {
        allTen = false;
        break;
      }
    }
    if (allTen) {
      return 16;
    }
    const paddingValue = data[15];
    if (paddingValue < 1 || paddingValue > 16) {
      return 0;
    }
    for (let i = 1; i <= paddingValue; i++) {
      if (data[16 - i] !== paddingValue) {
        return 0;
      }
    }
    return paddingValue;
  }

  const encryptDataWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    password: Uint8Array,
    iterations: number,
  ): Promise<Uint8Array> => {
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    const encryptedChunks: Uint8Array[] = [];
    encryptedChunks.push(salt);
    const derivedKey = await derive224BytesUsingArgon2id(password, salt, iterations);
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
    const tag = await computeTagForFileUsingHMACSHA512(hmacKey, bytes);
    const tag_and_data = new Uint8Array(tag.length + bytes.length);
    tag_and_data.set(tag, 0);
    tag_and_data.set(bytes, tag.length);


    const encryptedData = new Uint8Array(tag_and_data.length);
  
    const totalSize = tag_and_data.length;
    while (offset < totalSize) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = CryptoJS.SHA512(input).toString();
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
      const chunk = tag_and_data.slice(offset, Math.min(offset + chunkSize, totalSize));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);
  
      for (let i = 0; i < encryptedChunk.length; i++) {
        encryptedData[offset + i] = encryptedChunk[i];
      }
      offset += chunk.length;
    }

    const blockcipher_chunk_size = 16;
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
    encryptedChunks.push(encryptedIV);
    let previousCiphertext = iv;
    for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
      let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);
      if (chunk.length < blockcipher_chunk_size) {
        const padding = blockcipher_chunk_size - chunk.length;
        const paddedChunk = new Uint8Array(blockcipher_chunk_size);
        paddedChunk.set(chunk);
        paddedChunk.fill(padding, chunk.length);
        chunk = paddedChunk;
      }
      const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
      const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
      encryptedChunks.push(encryptedChunk);
      previousCiphertext = encryptedChunk;

    }
  
    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let soffset = 0;
    for (const chunk of encryptedChunks) {
      result.set(chunk, soffset);
      soffset += chunk.length;
    }
  
    return result;
  }

  const hexStringToArray = (hexString: string): number[] => {
    // Check if the input is a valid hex string
    if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
        throw new Error("Invalid hex string");
    }

    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }

    const resultArray: number[] = [];
    for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.substring(i, i + 2);
        resultArray.push(parseInt(hexPair, 16)); // Convert hex pair to integer
    }

    return resultArray;
};
/*
const hexStringToUint8Array = (hexString: string): Uint8Array => {
    // Check if the input is a valid hex string
    if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
        throw new Error("Invalid hex string");
    }

    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }

    const resultArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.substring(i, i + 2);
        resultArray[i / 2] = parseInt(hexPair, 16); // Convert hex pair to integer
    }

    return resultArray;
};
*/
  
  const derive224BytesUsingArgon2id = useCallback(async (password: Uint8Array, salt: Uint8Array, iterations: number) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const derivedKey = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations,
      memorySize: 512,
      hashLength: 224,
      outputType: 'binary',
    });
    return new Uint8Array(derivedKey);
  }, []);

  const derive416BytesUsingArgon2id = useCallback(async (password: Uint8Array, salt: Uint8Array, iterations: number) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const derivedKey = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations,
      memorySize: 512,
      hashLength: 416,
      outputType: 'binary',
    });
    return new Uint8Array(derivedKey);
  }, []);
  const toggleProgressAnimation = (isAnimating: boolean) => {
    const container = progressContainerRef.current;
    if (!container) return;
  
    if (isAnimating) {
      container.innerHTML = `
        <style>
          @keyframes moveBar {
            0%, 100% { left: 0; }
            50% { left: 80%; }
          }
          @keyframes shiftColor {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
         .animated-bar {
            width: 20%;
            height: 100%;
            background: linear-gradient(90deg, rgba(121, 69, 197, 0.7), rgba(0, 123, 255, 0.7), rgba(121, 69, 197, 0.7), rgba(0, 123, 255, 0.7));
            background-size: 300% 100%;
            box-shadow: 0 3px 3px -5px rgba(121, 69, 197, 0.7), 0 2px 5px rgba(0, 123, 255, 0.7);
            position: absolute;
            top: 0;
            left: 0;
            border-radius: 15px;
            animation: moveBar 2s linear infinite, shiftColor 4s linear infinite;
          }
        </style>
        <div class="animated-bar"></div>
      `;
    } else {
      container.innerHTML = `
        <style>
         .file-processing-popup-progress-done {
            background: linear-gradient(to left, rgba(121, 69, 197, 0.7), rgba(0, 123, 255, 0.7));
            box-shadow: 0 3px 3px -5px rgba(121, 69, 197, 0.7), 0 2px 5px rgba(0, 123, 255, 0.7);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: ${processingProgress}%; /* Ensure width is based on progress */
            opacity: 1;
            border-radius: 15px;
          }
        </style>
        <div class="file-processing-popup-progress-done"> ${processingProgress.toFixed(2)}% </div>
      `;
    }
  };
  
  useEffect(() => {
    if (showProcessingPopup) {
      toggleProgressAnimation(false);
    }
  }, [showProcessingPopup]);
  
  useEffect(() => {
    if (!showProcessingPopup) return;
    const container = progressContainerRef.current;
    if (!container) return;
    const progressDoneElement = container.querySelector('.file-processing-popup-progress-done') as HTMLElement;
    if (progressDoneElement) {
      progressDoneElement.style.width = `${processingProgress}%`;
      progressDoneElement.textContent = `${processingProgress.toFixed(2)}%`;
    }
  }, [processingProgress, showProcessingPopup]);

  const DescriptionPopup: React.FC<{ message: string; onYes: () => void; onNo: () => void; }> = ({ message, onYes, onNo }) => {
    return (
      <>
        <canvas style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "-1" }}></canvas>
        <div className="add-description-popup-overlay">
          <div className="add-description-popup-main">
            <div className="add-description-popup-content">
              <p className="add-description-popup-message">{message}</p>
              <div className="add-description-popup-options">
                <button className="add-description-popup-button" onClick={onYes}>Yes</button>
                <button className="add-description-popup-button" onClick={onNo}>No</button>
              </div>
            </div>
          </div>
          <style jsx>{`
            .add-description-popup-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.1); /* Darkened overlay */
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1100;
            }
            .add-description-popup-main {
              position: relative; /* Ensure positioning context for absolute children */
              background: rgba(255, 255, 255, 0.2); /* Slightly more transparent background */
              backdrop-filter: blur(10px); /* Blur effect */
              border-radius: 10px;
              padding: 30px; /* Internal padding */
              width: 75%; /* Fixed width */
              max-width: 540px; /* Maximum width */
              box-shadow: 0 8px 32px rgba(31,38,135,0.37);
              border: 1px solid rgba(255, 255, 255, 0.18); /* White outline */
              background-image: repeating-linear-gradient(
                45deg,
                #404c7a, /* Darker blue shade */
                #404c7a 5%,
                #2d3b6d 5%, /* Darker shade for contrast */
                #2d3b6d 10% /* Darker shade for contrast */
              );
              background-size: 100px 100px;
              animation: move-it 2s linear infinite; /* Apply the moving background animation */
            }
            .add-description-popup-content {
              position: relative;
              z-index:1;
              text-align: center;
              padding:.6rem; /* Padding inside modal content */
            }
            .add-description-popup-message {
              margin: 10px 0;
              font-size: 18px; /* Font size adjustment */
              color: white; /* White text color */
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              word-wrap: break-word; /* Ensure text wraps within container */
              overflow-wrap: break-word; /* Prevent overflow beyond container */
            }
            .add-description-popup-options {
              display: flex; /* Use flexbox for button alignment */
            }
            .add-description-popup-button {
              flex-grow: 1; /* Make buttons take equal space */
              margin-right: .5rem; /* Increased margin between buttons */
              color: white; /* White text color for buttons */
              font-family: inherit;
              font-size: inherit;
              padding: .7rem; /* Increased padding within buttons */
              border-radius:.3rem;
              border:none;
              background-color: #202020; /* Set default button color to #202020 */
              transition: all .3s ease; /* Smooth transition for hover effects */
            }
            .add-description-popup-button:last-child {
             margin-right: 0; /* Remove margin from the last button */
            }
            .add-description-popup-button:hover {
             background-color: #333333; /* Darker shade on hover */
             transform: translateY(-2px); /* Slight lift effect on hover */
            }
            @keyframes move-it {
             0% {
               background-position: initial;
             }
             100% {
               background-position: 100px 0px;
             }
           }
          `}</style>
        </div>
      </>
    );
  }
  
  interface DescriptionInputPopupProps {
    message: string;
    onSubmit: (description: string) => void;
    onCancel: () => void;
  }
  
 
interface DescriptionInputPopupProps {
  message: string;
  onSubmit: (description: string) => void;
  onCancel: () => void;
}

const DescriptionInputPopup: React.FC<DescriptionInputPopupProps> = ({ message, onSubmit, onCancel }) => {
  const [description, setDescription] = useState<string>("");

  return (
    <>
      <canvas style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "-1" }}></canvas>
      <div className="add-description-popup-overlay">
        <div className="add-description-popup-main">
          <div className="add-description-popup-content">
            <p className="add-description-popup-message">{message}</p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="add-description-popup-input"
            />
            <div className="add-description-popup-options">
              <button className="add-description-popup-button" onClick={() => onSubmit(description)}>Submit</button>
              <button className="add-description-popup-button" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .add-description-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1100;
          }
          .add-description-popup-main {
            position: relative;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 30px;
            width: 75%;
            max-width: 540px;
            box-shadow: 0 8px 32px rgba(31,38,135,0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            background-image: repeating-linear-gradient(
              45deg,
              #404c7a,
              #404c7a 5%,
              #2d3b6d 5%,
              #2d3b6d 10%
            );
            background-size: 100px 100px;
            animation: move-it 2s linear infinite;
          }
          .add-description-popup-content {
            position: relative;
            z-index:1;
            text-align: center;
            padding:.6rem;
          }
          .add-description-popup-message {
            margin: 10px 0;
            font-size: 18px;
            color: white;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .add-description-popup-input {
            width :100%;
            padding:.5rem;
            margin-bottom:.8rem;
            border-radius:.3rem;
            border:none;
            resize:none; 
            background-color: rgba(255,255,255,.1);
            color: white; 
            caret-color: white; 
          }
          .add-description-popup-options {
            display: flex; 
          }
          .add-description-popup-button {
            flex-grow: 1; 
            margin-right:.5rem; 
            color:white; 
            font-family: inherit; 
            font-size: inherit; 
            padding:.7rem; 
            border-radius:.3rem; 
            border:none; 
            background-color:#202020; 
            transition:.3s ease; 
          }
          .add-description-popup-button:last-child {
              margin-right:0; 
          }
          .add-description-popup-button:hover {
              background-color:#333333; 
              transform:translateY(-2px); 
          }
          @keyframes move-it {
              0% { background-position: initial; }
              100% { background-position: 100px 0px; }
          }
        `}</style>
      </div>
    </>
  );
}

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <BentoGrid>
        <BentoGridItem metadataIntegrity={true}>
          <div className="w-[320px] h-[320px] mx-auto rounded-lg repeating-backgr-for-drag-and-drop flex items-center justify-center bg-[#005482]">
            <FishyFileDrop onFilesSelected={handleFiles} />
          </div>
        </BentoGridItem>
        {containers.map((container) => (
    <BentoGridItem key={container.id} metadataIntegrity={container.metadataIntegrity}>
      <div>
        <FileContainer
          id={container.id}
          title={container.title}
          color={container.color}
          fileSize={container.fileSize}
          description={container.description}
          onDownload={() => onDownload(container.id)}
          onDelete={() => onDelete(container.id)}
          onTitleClick={() => showFileInfo(container.id)}
          onDescriptionClick={() => showFileInfo(container.id)}
        />
      </div>
    </BentoGridItem>
  ))}
      </BentoGrid>
      {showPopup && popupData && (
        <PopupForm
          messages={popupData.messages}
          fileName={popupData.fileName}
          fileUrl={popupData.fileUrl}
          onSave={popupData.onSave}
          onClose={closePopupForm}
        />
      )}
      {descriptionPopup}
      {showProcessingPopup && (
        <div className="file-processing-popup">
            <div className="file-processing-popup-main">
                <div className="file-processing-popup-content">
                    <p className="file-processing-popup-message-text">
                        <span className="filename-span" dir="auto">{currentFileName}</span>
                    </p>
                    <p className="file-processing-popup-message-text">
                        {processingStep}
                    </p>
                    <p className="file-processing-popup-message-text">
                        {processingStepDescription}
                    </p>
                    <div ref={progressContainerRef} className="file-processing-popup-progress">
                        {/* Progress bar or animation will be inserted here */}
                    </div>
                </div>
            </div>
        </div>
    )}

          {/* Confirmation Pop-Up */}
          {showConfirmPopUp && (
            <div className="file-processing-popup">
              <div 
                style={{
                  position: 'fixed',
                  left: isMobile ? '50%' : 'calc(50% + 30px)',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'auto',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.6rem 3rem',
                  border: '3px solid var(--background-color)',
                  color: 'black',
                  zIndex: 1101,
                  fontFamily: '"Questrial", sans-serif',
                  backgroundColor: '#ffec63',
                  backgroundImage: `
                    linear-gradient(45deg, #ffd966 25%, transparent 25%, transparent 75%, #ffd966 75%, #ffd966),
                    linear-gradient(-45deg, #ffd966 25%, transparent 25%, transparent 75%, #ffd966 75%, #ffd966)
                  `,
                  backgroundSize: '60px 60px',
                  backgroundPosition: '0 0',
                  animation: 'slide 4s infinite linear',
                  textAlign: 'center',
                }}
              >
              <div className="encrypted-space-confirm-pop-up-background"></div>
              <p className="encrypted-space-confirm-pop-up-message">Are you sure you want to delete this file?</p>
              <div className="encrypted-space-confirm-pop-up-options">
                <button className="encrypted-space-confirm-pop-up-btn" onClick={deleteRecord}>
                  Yes
                </button>
                <button className="encrypted-space-confirm-pop-up-btn" onClick={handleCancelDelete}>
                  No
                </button>
              </div>
            </div>
            </div>
          )}

    <style jsx>{`
          .encrypted-space-confirm-pop-up-message {
            font-size: 19px;
            margin-bottom: 20px;
          }

          .encrypted-space-confirm-pop-up-btn {
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            background-color:white;
            width: 70px;
            padding: 10px; /* Adjusted padding */
            border-radius: 4px; /* Rounded corners */
            border:none; /* No border */
            margin-right:.5rem; /* Space between buttons */
            box-shadow:.2rem .2rem .5rem rgba(0,0,0,.2); /* Shadow effect */
            transition:.2s; /* Smooth transition */
          }

          .encrypted-space-confirm-pop-up-btn:hover {
            box-shadow:.4rem .4rem .5rem rgba(0,0,0,.3); /* Darker shadow on hover */
            transform:translate(-.2rem,-.2rem); /* Move slightly up */
          }

          .encrypted-space-confirm-pop-up-options {
            display:flex; /* Flexbox for button alignment */
            flex-direction:row; /* Horizontal layout */
            justify-content:center; /* Center buttons */
          }

        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: -120px 60px; }
        }

        .file-processing-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .file-processing-popup-main {
          max-width: 544px;
          width: 90%;
          padding: 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(25, 26, 26, 0.5);
          backdrop-filter: blur(10px) saturate(90%);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .file-processing-popup-content {
          text-align: center;
          overflow-wrap: break-word; /* Prevent overflow beyond container */
          word-wrap: break-word;
          width: 90%;
        }

        .file-processing-popup-message-text {
          margin: 10px 0;
          font-size: 18px;
          color: white;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .filename-span {
          font-weight: bold;
          color: #4DABF5;
          display: inline-block;
          overflow-wrap: break-word; /* Prevent overflow beyond container */
          width: 94%;
          max-width: 480px; /* Optional, to limit the maximum width */
          word-wrap: break-word;
        }

        .file-processing-popup-progress {
          background-color: rgba(216, 216, 216, 0.5);
          border-radius: 20px;
          position: relative;
          margin: 15px 0;
          height: 30px;
          width: 100%; /* Ensure progress bar width is consistent */
          max-width: 480px; /* Optional, to limit the maximum width */
          overflow: hidden;
        }
    `}</style>
    </>
  );
}