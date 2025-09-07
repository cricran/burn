import './landingPage.css'
import { 
    LogIn, 
    Calendar, 
    BookOpen, 
    Mail, 
    StickyNote, 
    Palette, 
    Eye,
    EyeOff,
    Clock,
    RefreshCw,
    Shield,
    ChevronDown,
    ExternalLink,
    FileText,
    Settings
} from 'lucide-react';
import { Link } from "react-router"


const LandingPage = () => {
    

    return (
        <>
        <div>
            <div className='shadow'>
                <div className='img'></div>
            </div>
            <div className='landingPage'>
                {/* Hero Section */}
                <div className='hero-section'>
                    <div className='hero-content'>
                        <h1 className='hero-title'>
                            <span className='burn-logo'>BURN</span>
                            <span className='subtitle'>Better URN</span>
                        </h1>
                        <p className='hero-description'>
                            Une interface moderne et unifiée pour vos outils universitaires : ADE Campus, UniversiTice et votre messagerie étudiante, le tout dans une seule application.
                        </p>
                        <div className='hero-cta'>
                            <Link to={'/auth/'} viewTransition className='cta-button primary'>
                                <LogIn size={20} />
                                <span>Se connecter</span>
                            </Link>
                            <a href="#features" className='cta-button secondary'>
                                <span>Découvrir</span>
                                <ChevronDown size={20} />
                            </a>
                        </div>
                    </div>
                    <div className='hero-visual'>
                        <div className='hero-dashboard-preview'>
                            <div className='preview-header'>
                                <div className='preview-nav'>
                                    <div className='nav-item active'>Accueil</div>
                                    <div className='nav-item'>EDT</div>
                                    <div className='nav-item'>UniversiTice</div>
                                    <div className='nav-item'>Mail</div>
                                </div>
                            </div>
                            <div className='preview-content'>
                                <div className='preview-module'>
                                    <div className='module-title'>Cours aujourd'hui</div>
                                    <div className='preview-event'>
                                        <div className='event-time'>14h-16h</div>
                                        <div className='event-details'>
                                            <div className='event-name'>Mathématiques</div>
                                            <div className='event-location'>Amphi 3</div>
                                        </div>
                                    </div>
                                </div>
                                <div className='preview-module'>
                                    <div className='module-title'>Notes récentes</div>
                                    <div className='preview-note'>
                                        <div className='note-title'>Réviser chapitre 5</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section id="features" className='features-section'>
                    <div className='section-header'>
                        <h2>Simplifiez votre vie étudiante</h2>
                        <p>BURN centralise et améliore l'accès à vos outils universitaires de l'URN</p>
                    </div>

                    <div className='features-grid'>
                        {/* Emploi du temps ADE */}
                        <div className='feature-card'>
                            <div className='feature-icon'>
                                <Calendar size={32} />
                            </div>
                            <h3>Emploi du temps ADE Campus</h3>
                            <p>Synchronisation automatique avec ADE Campus. Visualisez votre planning dans une interface moderne avec codes couleur personnalisables.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><RefreshCw size={16} /> Sync automatique</span>
                                <span className='highlight'><Palette size={16} /> Codes couleur</span>
                                <span className='highlight'><Eye size={16} /> Masquage d'événements</span>
                            </div>
                        </div>

                        {/* UniversiTice/Moodle */}
                        <div className='feature-card'>
                            <div className='feature-icon'>
                                <BookOpen size={32} />
                            </div>
                            <h3>Intégration UniversiTice</h3>
                            <p>Accédez à vos cours Moodle avec une interface repensée. Navigation simplifiée dans vos ressources et devoirs.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><FileText size={16} /> Ressources de cours</span>
                                <span className='highlight'><ExternalLink size={16} /> Liens directs</span>
                                <span className='highlight'><EyeOff size={16} /> Masquage de cours</span>
                            </div>
                        </div>

                        {/* Messagerie */}
                        <div className='feature-card'>
                            <div className='feature-icon'>
                                <Mail size={32} />
                            </div>
                            <h3>Messagerie étudiante</h3>
                            <p>Interface moderne pour votre messagerie universitaire. Consultation et gestion simplifiées de vos emails URN.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><Shield size={16} /> Connexion sécurisée</span>
                                <span className='highlight'><Mail size={16} /> Interface épurée</span>
                                <span className='highlight'><ExternalLink size={16} /> Lien SOGo</span>
                            </div>
                        </div>

                        {/* Notes et tâches */}
                        <div className='feature-card'>
                            <div className='feature-icon'>
                                <StickyNote size={32} />
                            </div>
                            <h3>Notes sur événements</h3>
                            <p>Ajoutez des notes et des tâches directement sur vos cours. Gardez trace de vos devoirs et révisions à faire.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><Clock size={16} /> Suivi des tâches</span>
                                <span className='highlight'><FileText size={16} /> Notes par cours</span>
                                <span className='highlight'><Calendar size={16} /> Lié au planning</span>
                            </div>
                        </div>

                        {/* Personnalisation */}
                        <div className='feature-card'>
                            <div className='feature-icon'>
                                <Settings size={32} />
                            </div>
                            <h3>Personnalisation</h3>
                            <p>Adaptez BURN à vos préférences : thèmes sombre/clair, couleurs par matière, masquage d'éléments non pertinents.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><Palette size={16} /> Thèmes multiples</span>
                                <span className='highlight'><Eye size={16} /> Contrôle d'affichage</span>
                                <span className='highlight'><Settings size={16} /> Préférences</span>
                            </div>
                        </div>

                        {/* Dashboard unifié */}
                        <div className='feature-card feature-highlight'>
                            <div className='feature-icon'>
                                <Calendar size={32} />
                            </div>
                            <h3>Dashboard unifié</h3>
                            <p>Vue d'ensemble quotidienne : cours du jour, notes à consulter, mails récents et accès rapide à UniversiTice.</p>
                            <div className='feature-highlights'>
                                <span className='highlight'><Clock size={16} /> Vue journalière</span>
                                <span className='highlight'><BookOpen size={16} /> Accès rapide</span>
                                <span className='highlight'><Mail size={16} /> Notifications mail</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technical Section */}
                <section className='tech-section'>
                    <div className='tech-content'>
                        <h2>Comment ça fonctionne</h2>
                        <div className='tech-grid'>
                            <div className='tech-item'>
                                <div className='tech-number'>1</div>
                                <h3>Connectez votre compte</h3>
                                <p>Utilisez vos identifiants URN (multipass) pour connecter ADE Campus, UniversiTice et votre mail de manière sécurisée</p>
                            </div>
                            <div className='tech-item'>
                                <div className='tech-number'>2</div>
                                <h3>Synchronisation automatique</h3>
                                <p>BURN récupère vos données depuis les URLs iCal d'ADE, les APIs de UniversiTice (Moodle) et le server mail de l'université</p>
                            </div>
                            <div className='tech-item'>
                                <div className='tech-number'>3</div>
                                <h3>Interface unifiée</h3>
                                <p>Accédez à tout depuis une seule interface moderne et responsive</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className='cta-section'>
                    <div className='cta-content'>
                        <h2>Prêt à simplifier votre quotidien étudiant ?</h2>
                        <p>Connectez-vous avec vos identifiants URN et découvrez une nouvelle façon d'organiser vos études.</p>
                        <Link to={'/auth/'} viewTransition className='cta-button primary large'>
                            <LogIn size={24} />
                            <span>Se connecter avec URN</span>
                        </Link>
                    </div>
                </section>

                {/* Legal Disclaimer */}
                <section className='disclaimer-section'>
                    <div className='disclaimer-content'>
                        <h3>Avertissement légal</h3>
                        <div className='disclaimer-text'>
                            <p>
                                <strong>BURN (Better URN)</strong> est un projet étudiant indépendant développé pour améliorer l'expérience des étudiants de l'Université de Rouen Normandie.
                            </p>
                            <p>
                                Cette application n'est <strong>pas officiellement affiliée, endorsée ou sponsorisée</strong> par l'Université de Rouen Normandie (URN). 
                                BURN est un projet open-source créé par des étudiants pour des étudiants.
                            </p>
                            <p>
                                BURN se connecte aux services existants (ADE Campus, UniversiTice/Moodle, messagerie SOGo) en utilisant vos identifiants personnels. 
                                Vos données restent privées et ne sont pas partagées avec des tiers.
                            </p>
                            <p>
                                L'utilisation se fait sous votre responsabilité. En cas de problème avec les services officiels, 
                                référez-vous toujours aux plateformes d'origine : <strong>ADE Campus</strong> pour l'emploi du temps, 
                                <strong>UniversiTice</strong> pour les cours Moodle, et <strong>SOGo</strong> pour la messagerie.
                            </p>
                            <div className='disclaimer-footer'>
                                <p><em>Développé avec ❤️ par la communauté étudiante pour la communauté étudiante.</em></p>
                                <div className='github-link'>
                                    <a href="https://github.com/cricran/burn" target="_blank" rel="noopener noreferrer" className='github-button'>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <span>Voir le code source sur GitHub</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        
        </>
    )
}

export default LandingPage