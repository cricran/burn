import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from "react-router-dom"
import { CircleX, Info } from 'lucide-react';
import PopUp from '../../components/PopUp/PopUp';
import apiRequest from '../../utils/apiRequest';
import useAuthStore from '../../utils/authStore';

import './auth.css'

const Auth = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPopUp, setShowPopUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { setCurrentUser, currentUser } = useAuthStore();

    // Vérification de la présence du token JWT
    useEffect(() => {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const jwtCookie = cookies.find(c => c.startsWith('jwt='));
        if (!jwtCookie) {
            setCurrentUser(null); // Supprime le currentUser si pas de token
        }
    }, []);

    if (currentUser) {
        return <Navigate to="/my" replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        if (!username || !password) {
            setError('Veuillez remplir tous les champs.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const data = Object.fromEntries(formData);

        try {
            const res = await apiRequest.post("/user/auth/login", data)
            setCurrentUser(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de connexion");
            setLoading(false);
            navigate('/my');
            return;
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {showPopUp && (
                <PopUp
                    title="Comment ça fonctionne ?"
                    text={
                        <>
                            <b>Principe :</b><br />
                            Lorsque tu te connectes, le backend simule la navigation sur Moodle et CAS :<br />
                            <ul style={{ textAlign: "left", margin: "10px 0 0 20px" }}>
                                <li>1. Il ouvre la page de login Moodle et suit la redirection vers CAS.</li>
                                <li>2. Il soumet tes identifiants au CAS.</li>
                                <li>3. Il suit toutes les redirections nécessaires pour valider la session.</li>
                                <li>4. Il vérifie la connexion en appelant l’API mobile Moodle.</li>
                            </ul>
                            <br />
                            Si tout est bon, tu es connecté comme si tu étais passé par le navigateur !
                        </>
                    }
                    onClose={() => setShowPopUp(false)}
                />
            )}
            <div className='auth'>
                <img className='imgLogin' src={'/general/backloginblur.webp'} alt="" />
                <div className='whiteBackground'></div>
                <div className='loginPanel'>
                    <form onSubmit={handleSubmit}>
                        <Link to={'/'} className='close' viewTransition>
                            <CircleX />
                        </Link>
                        <div className='logo'>
                            BURN
                            <span>ID</span>
                        </div>
                        <div className='form-floating'>
                            <input
                                className='start'
                                type="text"
                                name="user_login"
                                id="user_login"
                                placeholder="Identifiant universitaire"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            ></input>
                        </div>
                        <div className='form-floating end'>
                            <input
                                className='end'
                                type="password"
                                name="user_password"
                                id="user_password"
                                placeholder="Mot de passe universitaire"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            ></input>
                        </div>
                        {error && <div className="auth-error">{error}</div>}
                        <button className="button" type="submit" name="login" disabled={loading}>
                            {loading
                                ? <span className="button-loader"></span>
                                : "Se connecter"}
                        </button>
                        <span onClick={() => setShowPopUp(true)} style={{ cursor: "pointer" }}><Info size={20}/> comment ça foncitonne ?</span>
                    </form>
                </div>
            </div >
        </div >
    )
}

export default Auth;