import { Link, useLocation } from 'react-router-dom'
import BigExternalLink from '../../components/bigExternalLink/bigExternalLink'
import './home.css'
import { User } from 'lucide-react';

import useAuthStore from '../../utils/authStore';


const Home = () => {
    const location = useLocation();
    const path = location.pathname.toLowerCase();

    const { currentUser, clearCurrentUser } = useAuthStore();

    return (
        <div className='content'>
            <div className='home'>
                <h1>Bonjour {currentUser.username}</h1>
                <div className='link'>
                    <h2>Liens utilies</h2>
                    <div className='linkListWrapper'>
                        <div className='linkList'>
                            <BigExternalLink text={'ENT'} to={'https://ent.univ-rouen.fr'} />
                            <BigExternalLink text={'UniversiTice'} to={'https://ent.univ-rouen.fr'} />
                            <BigExternalLink text={'SogoMail'} to={'https://ent.univ-rouen.fr'} />
                            <BigExternalLink text={'Izly'} to={'https://ent.univ-rouen.fr'} />
                            <BigExternalLink text={'ADE'} to={'https://ent.univ-rouen.fr'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home