import { Info, Link, Plus, X } from 'lucide-react';
import './addCalendar.css'
import apiRequest from '../../utils/apiRequest';
import PopUp from '../PopUp/PopUp';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useNotificationStore from '../../utils/notificationStore';


function AddCalendar({ onClose }) {
    const [showPopUp, setShowPopUp] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const notify = useNotificationStore.getState().notify;
    
    // Empêcher la propagation du clic
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    const handleAdd = async (event) => {
        event.preventDefault();

        // Get the input by its name attribute
        const url = event.target.url.value;

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

    // ouverture animée (useEffect pour éviter l'exécution à chaque rendu)
    useEffect(() => {
        const t = setTimeout(() => setIsOpen(true), 0);
        return () => clearTimeout(t);
    }, []);

    const requestClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => onClose && onClose(), 220);
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
            <div className={`addCalendar ${isOpen ? 'open' : ''} ${isClosing ? 'closing' : ''}`} onClick={requestClose}>
                <div className='addCalendar-content' onClick={stopPropagation}>
                    <button className="addCalendar-close" onClick={requestClose}>
                        <X size={20} />
                    </button>
                    <h2>Ajouter un Emploi du Temps</h2>
                    <form className='addCalendar-form' onSubmit={handleAdd}>
                        <div className='addCalendar-form-input'>
                            <Link size={18} />
                            <input 
                                type="text" 
                                placeholder="Lien vers l'Emploi du Temps" 
                                name='url'
                                autoFocus
                            />
                        </div>
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