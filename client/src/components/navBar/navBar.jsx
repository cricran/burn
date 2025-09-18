import { Link, useLocation } from 'react-router-dom'
import './navBar.css'
import { BookMarked, CalendarDaysIcon, Home, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

const NavBar = () => {
    const location = useLocation();
    const path = location.pathname.toLowerCase();
    
    const [isMobile, setIsMobile] = useState(false);
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    // Detect mobile and handle keyboard appearance
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 620);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle virtual keyboard on mobile
    useEffect(() => {
        if (!isMobile) return;
        
        let initialHeight = window.innerHeight;
        
        const handleResize = () => {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            
            // If height decreased significantly, keyboard likely appeared
            if (heightDiff > 150) {
                setKeyboardOffset(heightDiff);
            } else if (heightDiff < 50) {
                // Height restored, keyboard likely hidden
                setKeyboardOffset(0);
                initialHeight = currentHeight;
            }
        };
        
        const handleFocus = () => {
            // Reset initial height when focusing an input
            initialHeight = window.innerHeight;
        };
        
        window.addEventListener('resize', handleResize);
        document.addEventListener('focusin', handleFocus);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('focusin', handleFocus);
        };
    }, [isMobile]);

    return (
        <div 
            className='navBar' 
            style={isMobile ? { 
                '--keyboard-offset': `${keyboardOffset}px`,
                transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : 'translateY(0px)'
            } : {}}
        >
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
                    className={`buton${path === '/mail' ? ' selected' : ''}`}
                    to={'/mail'}
                >
                    <div className='icon'>
                        <Mail />
                    </div>
                    <div className='text'>Mail</div>
                </Link>
            </div>
        </div>
    )
}

export default NavBar