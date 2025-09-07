import { useState, useEffect, useMemo, useCallback } from 'react';
import { Eye, EyeOff, X, Loader } from 'lucide-react';
import './hiddenEventsManager.css';
import useHiddenEventsStore from '../../utils/hiddenEventsStore';
import useNotificationStore from '../../utils/notificationStore';
import { cleanCourseTitle } from '../../utils/colorUtils';
import { openLayer, discard, closeTop } from '../../utils/uiHistory';

function HiddenEventsManager({ onClose }) {
    const [courseList, setCourseList] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [showingIndividual, setShowingIndividual] = useState(null);
    const [showingByName, setShowingByName] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [eventsLoaded, setEventsLoaded] = useState(false);

    const {
        hiddenEvents,
        loadHiddenEvents,
        hideEventsByName,
        showIndividualEvent,
        showEventsByName,
        isLoading
    } = useHiddenEventsStore();

    const notify = useNotificationStore(state => state.notify);

    // Empêcher la propagation du clic
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    useEffect(() => {
        loadHiddenEvents();
    }, [loadHiddenEvents]);

    // Back button closes this manager first
    useEffect(() => {
        const token = openLayer(() => {
            onClose?.();
        });
        return () => discard(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Charger les événements une seule fois au montage
    useEffect(() => {
        const loadEvents = async () => {
            if (eventsLoaded) return; // Ne recharger que si nécessaire
            
            try {
                const start = new Date();
                start.setMonth(start.getMonth() - 1);
                const end = new Date();
                end.setMonth(end.getMonth() + 3);
                
                const fetchedEvents = await useHiddenEventsStore.getState().fetchAllEventsForManager(start, end);
                setAllEvents(fetchedEvents);
                setEventsLoaded(true);
            } catch (error) {
                console.error('Erreur lors de la récupération des événements:', error);
                setAllEvents([]);
            }
        };
        
        loadEvents();
    }, [eventsLoaded]);

    // Générer la liste des cours à partir des événements chargés
    const availableCourses = useMemo(() => {
        if (!eventsLoaded || allEvents.length === 0) return [];
        
        const courses = new Map();
        
        allEvents.forEach(event => {
            const cleanTitle = cleanCourseTitle(event.title);
            if (!courses.has(cleanTitle)) {
                courses.set(cleanTitle, {
                    name: event.title,
                    cleanName: cleanTitle,
                    events: []
                });
            }
            courses.get(cleanTitle).events.push({
                id: event._id,
                title: event.title,
                start: event.start
            });
        });
        
        // Filtrer les cours qui ne sont pas déjà masqués
        return Array.from(courses.values()).filter(course => 
            !hiddenEvents.byName.includes(course.cleanName)
        );
    }, [allEvents, hiddenEvents.byName, eventsLoaded]);

    // Mettre à jour la liste des cours quand elle change
    useEffect(() => {
        setCourseList(availableCourses);
        setIsLoadingCourses(false);
    }, [availableCourses]);

    const handleShowIndividual = useCallback(async (eventId) => {
        if (showingIndividual) return;

        setShowingIndividual(eventId);
        try {
            await showIndividualEvent(eventId);
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'événement:', error);
        } finally {
            setShowingIndividual(null);
        }
    }, [showingIndividual, showIndividualEvent]);

    const handleShowByName = useCallback(async (courseName) => {
        if (showingByName) return;

        setShowingByName(courseName);
        try {
            const cleanName = cleanCourseTitle(courseName);
            await showEventsByName(cleanName);
        } catch (error) {
            console.error('Erreur lors de l\'affichage du cours:', error);
        } finally {
            setShowingByName(null);
        }
    }, [showingByName, showEventsByName]);

    const handleHideByName = useCallback(async (cleanName) => {
        if (isLoading) return;

        try {
            await hideEventsByName(cleanName);
        } catch (error) {
            console.error('Erreur lors du masquage du cours:', error);
        }
    }, [isLoading, hideEventsByName]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Événements individuels masqués - calcul optimisé
    const individualHiddenEvents = useMemo(() => {
        return hiddenEvents.individual.map(eventId => {
            const event = allEvents.find(e => e._id === eventId);
            return event ? {
                id: eventId,
                title: event.title,
                start: event.start
            } : null;
        }).filter(Boolean);
    }, [hiddenEvents.individual, allEvents]);

    // Cours masqués par nom - calcul optimisé
    const nameHiddenCourses = useMemo(() => {
        return hiddenEvents.byName.map(cleanName => {
            const found = allEvents.find(e => 
                cleanCourseTitle(e.title).toLowerCase() === cleanName.toLowerCase()
            );
            return found ? found.title : cleanName;
        });
    }, [hiddenEvents.byName, allEvents]);

    const requestCloseViaHistory = () => closeTop();

    return (
        <div className='hidden-events-overlay' onClick={requestCloseViaHistory}>
            <div className='hidden-events-content' onClick={stopPropagation}>
                <button className="hidden-events-close" onClick={requestCloseViaHistory}>
                    <X size={20} />
                </button>

                <h2>Événements masqués</h2>

                {/* Événements individuels masqués */}
                <div className="hidden-events-section">
                    <h3>Événements individuels masqués</h3>
                    <div className='hidden-events-list'>
                        {individualHiddenEvents.length === 0 ? (
                            <p className="empty-hidden">Aucun événement masqué individuellement.</p>
                        ) : (
                            individualHiddenEvents.map((event) => (
                                <div className='hidden-event-item' key={event.id}>
                                    <div className='hidden-event-info'>
                                        <span className='hidden-event-title'>{event.title}</span>
                                        <span className='hidden-event-date'>
                                            ({formatDate(event.start)})
                                        </span>
                                    </div>
                                    <button
                                        className="show-event-btn"
                                        onClick={() => handleShowIndividual(event.id)}
                                        disabled={showingIndividual === event.id || isLoading}
                                        title="Afficher cet événement"
                                    >
                                        {showingIndividual === event.id ? (
                                            <Loader size={16} className="animate-spin" />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cours masqués par nom */}
                <div className="hidden-events-section">
                    <h3>Cours masqués</h3>
                    <div className='hidden-events-list'>
                        {nameHiddenCourses.length === 0 ? (
                            <p className="empty-hidden">Aucun cours masqué.</p>
                        ) : (
                            nameHiddenCourses.map((courseName) => (
                                <div className='hidden-event-item' key={courseName}>
                                    <div className='hidden-event-info'>
                                        <span className='hidden-event-title'>{courseName}</span>
                                    </div>
                                    <button
                                        className="show-event-btn"
                                        onClick={() => handleShowByName(courseName)}
                                        disabled={showingByName === courseName || isLoading}
                                        title="Afficher ce cours"
                                    >
                                        {showingByName === courseName ? (
                                            <Loader size={16} className="animate-spin" />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Liste des cours disponibles pour masquage */}
                <div className="hidden-events-section">
                    <h3>Cours disponibles</h3>
                    {isLoadingCourses ? (
                        <div className="loading-courses">
                            <Loader size={20} className="animate-spin" />
                            <span>Chargement des cours...</span>
                        </div>
                    ) : (
                        <div className='available-courses-list'>
                            {courseList.map((course) => (
                                <div className='course-item' key={course.name}>
                                    <div className='course-info'>
                                        <span className='course-name'>{course.name}</span>
                                        <span className='course-count'>
                                            ({course.events.length} événement{course.events.length > 1 ? 's' : ''})
                                        </span>
                                    </div>
                                    <div className='course-actions'>
                                        <button
                                            className="hide-course-btn"
                                            onClick={() => handleHideByName(course.cleanName)}
                                            disabled={isLoading}
                                            title="Masquer ce cours"
                                        >
                                            {isLoading ? (
                                                <Loader size={14} className="animate-spin" />
                                            ) : (
                                                <EyeOff size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HiddenEventsManager;
