import { Link, useLocation } from 'react-router-dom'
import './navBar.css'
import { BookMarked, CalendarDaysIcon, Home, User } from 'lucide-react'

const NavBar = () => {
    const location = useLocation();
    const path = location.pathname.toLowerCase();

    return (
        <div className='navBar'>
            <div className='butonList'>
                <Link
                    className={`buton${path === '/my' ? ' selected' : ''}`}
                    to={'/my'}
                >
                    <div className='icon'>
                        <Home />
                    </div>
                    <div className='text'>Aceuile</div>
                </Link>
                <Link
                    className={`buton${path === '/universitice' ? ' selected' : ''}`}
                    to={'/universitice'}
                >
                    <div className='icon'>
                        <BookMarked />
                    </div>
                    <div className='text'>UniversiTice</div>
                </Link>
                <Link
                    className={`buton${path === '/edt' ? ' selected' : ''}`}
                    to={'/edt'}
                >
                    <div className='icon'>
                        <CalendarDaysIcon />
                    </div>
                    <div className='text'>EDT</div>
                </Link>
            </div>
            <div>
                <Link
                    className={`buton${path === '/profile' ? ' selected' : ''}`}
                    to={'/profile'}
                >
                    <div className='icon'>
                        <User />
                    </div>
                    <div className='text'>Profile</div>
                </Link>
            </div>
        </div>
    )
}

export default NavBar