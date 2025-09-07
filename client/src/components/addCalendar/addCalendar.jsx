import { Info, Link, Plus, X, QrCode, Keyboard } from 'lucide-react';
import './addCalendar.css'
import apiRequest from '../../utils/apiRequest';
import PopUp from '../PopUp/PopUp';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useNotificationStore from '../../utils/notificationStore';
import { openLayer, discard, closeTop } from '../../utils/uiHistory';
import { BrowserQRCodeReader } from '@zxing/browser';


function AddCalendar({ onClose }) {
    const [showPopUp, setShowPopUp] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [inputMode, setInputMode] = useState('url'); // 'url' or 'qr'
    const [isScanning, setIsScanning] = useState(false);
    const [urlValue, setUrlValue] = useState('');
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const streamRef = useRef(null);
    const notify = useNotificationStore.getState().notify;
    
    // Empêcher la propagation du clic
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    const handleAdd = async (event) => {
        event.preventDefault();

        // Get the URL from either the input field or the state (QR scan result)
        const url = event.target.url?.value || urlValue;

        if (!url) {
            notify({
                type: "error",
                title: "Erreur",
                message: "Veuillez renseigner une URL valide",
                duration: 6000
            });
            return;
        }

        try {
            await apiRequest.post("user/calendar", { calendarUrl: url });
            onClose();
        } catch (err) {
            notify({
                type: "error",
                title: "Erreur",
                message: err.response?.data?.message || err.message || "Erreur inconnue",
                duration: 6000
            });
            console.log(err);
        }
    }

    const startQRScanning = async () => {
        setInputMode('qr');
        setIsScanning(true);
        
        try {
            const codeReader = new BrowserQRCodeReader();
            codeReaderRef.current = codeReader;
            
            // Get video input devices
            const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                throw new Error("Aucune caméra détectée");
            }

            // Use the first available camera (usually back camera on mobile)
            const selectedDeviceId = videoInputDevices[0].deviceId;
            
            // Start continuous decoding and store the controls
            const controls = await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
                if (result) {
                    setUrlValue(result.getText());
                    setInputMode('url');
                    setIsScanning(false);
                    
                    // Stop the scanning
                    if (controls) {
                        controls.stop();
                    }
                    
                    notify({
                        type: "success",
                        title: "QR Code scanné",
                        message: "L'URL a été extraite du QR code",
                        duration: 3000
                    });
                }
                // Only log errors that are not "NotFoundException" (which happens when no QR code is found)
                if (err && err.name !== 'NotFoundException') {
                    console.error('Scanning error:', err);
                }
            });
            
            // Store the controls for cleanup
            if (controls && controls.stop) {
                codeReaderRef.current.controls = controls;
            }
            
        } catch (error) {
            console.error('Erreur lors du scan QR:', error);
            notify({
                type: "error",
                title: "Erreur de scan",
                message: error.message || "Impossible d'accéder à la caméra",
                duration: 6000
            });
            setInputMode('url');
            setIsScanning(false);
        }
    };

    const stopQRScanning = () => {
        if (codeReaderRef.current) {
            try {
                // Try to stop using controls if available
                if (codeReaderRef.current.controls && codeReaderRef.current.controls.stop) {
                    codeReaderRef.current.controls.stop();
                }
                // Also try the reset method if it exists
                if (typeof codeReaderRef.current.reset === 'function') {
                    codeReaderRef.current.reset();
                }
            } catch (error) {
                console.log('Error stopping scanner:', error);
            }
        }
        
        // Also manually stop video stream if accessible
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            if (stream && stream.getTracks) {
                stream.getTracks().forEach(track => track.stop());
            }
            videoRef.current.srcObject = null;
        }
        
        setIsScanning(false);
        setInputMode('url');
    };

    const toggleInputMode = () => {
        if (inputMode === 'url') {
            startQRScanning();
        } else {
            stopQRScanning();
        }
    };

    // Cleanup QR scanner on unmount
    useEffect(() => {
        return () => {
            if (codeReaderRef.current) {
                try {
                    if (codeReaderRef.current.controls && codeReaderRef.current.controls.stop) {
                        codeReaderRef.current.controls.stop();
                    }
                    if (typeof codeReaderRef.current.reset === 'function') {
                        codeReaderRef.current.reset();
                    }
                } catch (error) {
                    // Silently handle cleanup errors
                }
            }
            
            // Clean up video stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                if (stream && stream.getTracks) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        };
    }, []);

    // ouverture animée (useEffect pour éviter l'exécution à chaque rendu)
    useEffect(() => {
        const t = setTimeout(() => setIsOpen(true), 0);
        return () => clearTimeout(t);
    }, []);

    // Back button closes this modal first
    useEffect(() => {
        const token = openLayer(() => {
            requestClose();
        });
        return () => discard(token);
    }, []);

    const requestClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => onClose && onClose(), 220);
    };

    const requestCloseViaHistory = () => {
        closeTop();
    };

    return createPortal(
        <div>
            {showPopUp && (
                <PopUp
                    title="Comment ça fonctionne ?"
                    text={
                        <>
                            <b>Principe :</b><br />
                            Lorsque tu te connectes, le backend simule la navigation sur Moodle et CAS :<br />
                            <ul style={{ textAlign: "left", margin: "10px 0 0 20px" }}>
                                <li>1. Il ouvre la page de login Moodle et suit la redirection vers CAS.</li>
                                <li>2. Il soumet tes identifiants au CAS.</li>
                                <li>3. Il suit toutes les redirections nécessaires pour valider la session.</li>
                                <li>4. Il vérifie la connexion en appelant l'API mobile Moodle.</li>
                            </ul>
                            <br />
                            Si tout est bon, tu es connecté comme si tu étais passé par le navigateur !
                        </>
                    }
                    onClose={() => setShowPopUp(false)}
                />
            )}
        <div className={`addCalendar ${isOpen ? 'open' : ''} ${isClosing ? 'closing' : ''}`} onClick={requestCloseViaHistory}>
                <div className='addCalendar-content' onClick={stopPropagation}>
            <button className="addCalendar-close" onClick={requestCloseViaHistory}>
                        <X size={20} />
                    </button>
                    <h2>Ajouter un Emploi du Temps</h2>
                    
                    {/* Mode Toggle Buttons */}
                    <div className='addCalendar-mode-toggle'>
                        <button 
                            type="button"
                            className={`addCalendar-mode-btn ${inputMode === 'url' ? 'active' : ''}`}
                            onClick={() => inputMode !== 'url' && toggleInputMode()}
                        >
                            <Keyboard size={18} />
                            Saisir l'URL
                        </button>
                        <button 
                            type="button"
                            className={`addCalendar-mode-btn ${inputMode === 'qr' ? 'active' : ''}`}
                            onClick={() => inputMode !== 'qr' && toggleInputMode()}
                        >
                            <QrCode size={18} />
                            Scanner QR Code
                        </button>
                    </div>

                    <form className='addCalendar-form' onSubmit={handleAdd}>
                        {inputMode === 'url' ? (
                            <div className='addCalendar-form-input'>
                                <Link size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Lien vers l'Emploi du Temps" 
                                    name='url'
                                    value={urlValue}
                                    onChange={(e) => setUrlValue(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className='addCalendar-qr-scanner'>
                                {isScanning ? (
                                    <div className='qr-video-container'>
                                        <video 
                                            ref={videoRef}
                                            style={{ width: '100%', height: '250px', borderRadius: '8px' }}
                                        />
                                        <div className='qr-scanner-overlay'>
                                            <div className='qr-scanner-frame'></div>
                                            <p>Pointez votre caméra vers le QR code</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='qr-scanner-placeholder'>
                                        <QrCode size={48} />
                                        <p>Scanner en cours de préparation...</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <button className='addCalendar-form-button' type="submit">
                            <Plus size={20} />
                        </button>
                    </form>
                    <span onClick={() => setShowPopUp(true)}>
                        <Info size={18} />
                        Comment trouver le lien de son Emploi du Temps ?
                    </span>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default AddCalendar;