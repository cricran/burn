import './landingPage.css'
import { LogIn, SquareArrowOutUpRight } from 'lucide-react';
import { Link } from "react-router"


const LandingPage = () => {
    

    return (
        <>
        <div>
            <div className='shadow'>
                <div className='img'></div>
            </div>
            <div className='landingPage'>
                {/* Bouton paramètres retiré (visible seulement sur la page d'accueil) */}
                
                <h1>BURN</h1>
                <div>
                    <div className='lpHeader'>
                        <div className='left'>
                            <h1>Better URN, <span>BURN</span></h1>
                            <p>
                                <span>
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse minima quasi exercitationem deleniti, autem a repellendus placeat libero quas laudantium quia vero error rerum dolores neque sint delectus sunt architecto.
                                </span>
                                <br />
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut cupiditate pariatur dicta, exercitationem qui accusamus ipsam voluptates dolor quae corporis, quas est eaque mollitia temporibus aspernatur suscipit vel, recusandae nesciunt!
                            </p>
                            <div className='small'>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nisi, nihil! Quas, hic nam. Reiciendis dolor corrupti nulla quaerat nobis nostrum, repellendus numquam rem culpa expedita totam, perferendis odio ratione nesciunt!</div>
                        </div>
                        <div className='right'>
                        </div>
                    </div>
                    <div>
                        <div className='lpLogin'>
                            <Link to={'/auth/'} viewTransition>
                                <div className='button'>
                                    <LogIn size={110} />
                                    <div className='text'>Se connecter</div>
                                </div>
                            </Link>
                            <div className='text'>
                                <p>
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero commodi aliquid excepturi? Quisquam consequatur similique, facilis laudantium beatae adipisci, eius ipsam ratione molestiae incidunt autem minima quidem, consequuntur maiores libero?
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        
        </>
    )
}

export default LandingPage