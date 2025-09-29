import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom"
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
    const location = useLocation();
    const { setCurrentUser, currentUser } = useAuthStore();

    const params = new URLSearchParams(location.search);
    const redirectParam = params.get('redirect') ? decodeURIComponent(params.get('redirect')) : '/my';

    if (currentUser) {
        return <Navigate to={redirectParam} replace />;
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
            // clear guard flag
            try { sessionStorage.removeItem('authRedirect'); } catch (e) {}
            // rediriger vers la page demandée si présente
            navigate(redirectParam, { replace: true });
            return;
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de connexion");
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
                            Lorsque vous vous connecter, BURN utilise votre identifiant et votre mot de passe universitaire (multipass) pour créer un compte et vous connecter au different services de l'université supporté par BURN. <br /> <br />
                            Si tout est bon, vous êtes connecté comme si vous étiez passé par votre navigateur !
                        </>
                    }
                    onClose={() => setShowPopUp(false)}
                />
            )}
            <div className='auth'>
                <img className='imgLogin' src={'/general/backloginblur.webp'} alt="" />
                <div className='whiteBackground'></div>
                
                {/* Bouton paramètres retiré (visible seulement sur la page d'accueil) */}
                
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
            </div>
            
        </div >
    )
}

export default Auth;