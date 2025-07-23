import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './colorPicker.css';

const ColorPicker = ({ currentColor, onColorChange, onClose, eventTitle }) => {
    const [selectedColor, setSelectedColor] = useState(currentColor || '#3B82F6');
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(50);
    const [lightness, setLightness] = useState(60);
    
    const canvasRef = useRef(null);
    const hueSliderRef = useRef(null);

    // Contraintes pour le style du site
    const MIN_SATURATION = 35;
    const MAX_SATURATION = 80;
    const MIN_LIGHTNESS = 45;
    const MAX_LIGHTNESS = 75;

    // Convertir HSL en couleur utilisable
    const hslToColor = (h, s, l) => {
        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    // Convertir une couleur en HSL
    const colorToHSL = (color) => {
        if (!color || typeof color !== 'string') {
            return { h: 200, s: 60, l: 60 };
        }
        
        // Si c'est déjà en format HSL
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%/);
        if (hslMatch) {
            return {
                h: parseInt(hslMatch[1]),
                s: parseInt(hslMatch[2]),
                l: parseInt(hslMatch[3])
            };
        }
        
        // Si c'est en hex, conversion basique vers des valeurs par défaut
        return { h: 200, s: 60, l: 60 };
    };

    // Initialiser les valeurs HSL depuis la couleur actuelle
    useEffect(() => {
        const safeColor = currentColor || '#3B82F6';
        const hsl = colorToHSL(safeColor);
        setHue(hsl.h);
        setSaturation(Math.max(MIN_SATURATION, Math.min(MAX_SATURATION, hsl.s)));
        setLightness(Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, hsl.l)));
    }, [currentColor]);

    // Mettre à jour la couleur sélectionnée quand HSL change
    useEffect(() => {
        const color = hslToColor(hue, saturation, lightness);
        setSelectedColor(color);
    }, [hue, saturation, lightness]);

    // Dessiner le sélecteur de couleur
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Effacer le canvas
        ctx.clearRect(0, 0, width, height);
        
        // Dessiner le gradient de saturation/luminosité pour la teinte actuelle
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const s = MIN_SATURATION + (x / width) * (MAX_SATURATION - MIN_SATURATION);
                const l = MIN_LIGHTNESS + ((height - y) / height) * (MAX_LIGHTNESS - MIN_LIGHTNESS);
                
                ctx.fillStyle = hslToColor(hue, s, l);
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }, [hue]);

    // Fonction générique pour gérer les événements (souris + tactile)
    const getEventCoordinates = (e) => {
        // Pour les événements tactiles
        if (e.touches && e.touches.length > 0) {
            return {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            };
        }
        // Pour les événements souris
        return {
            clientX: e.clientX,
            clientY: e.clientY
        };
    };

    // Gérer les interactions sur le canvas (souris + tactile)
    const handleCanvasInteraction = (e) => {
        e.preventDefault(); // Empêcher le scroll sur mobile
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        
        // Calcul précis des coordonnées avec la taille réelle du canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (coords.clientX - rect.left) * scaleX;
        const y = (coords.clientY - rect.top) * scaleY;
        
        // S'assurer que les coordonnées sont dans les limites
        const clampedX = Math.max(0, Math.min(canvas.width - 1, x));
        const clampedY = Math.max(0, Math.min(canvas.height - 1, y));
        
        const newSaturation = MIN_SATURATION + (clampedX / canvas.width) * (MAX_SATURATION - MIN_SATURATION);
        const newLightness = MIN_LIGHTNESS + ((canvas.height - clampedY) / canvas.height) * (MAX_LIGHTNESS - MIN_LIGHTNESS);
        
        setSaturation(Math.round(newSaturation));
        setLightness(Math.round(newLightness));
    };

    // Gérer les interactions sur le slider de teinte
    const handleHueInteraction = (e) => {
        e.preventDefault();
        
        const slider = hueSliderRef.current;
        if (!slider) return;
        
        const rect = slider.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        
        const x = coords.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newHue = Math.round(percentage * 360);
        
        setHue(newHue);
    };

    // Gérer le début de l'interaction (souris) sur le canvas
    const handleCanvasMouseDown = (e) => {
        handleCanvasInteraction(e);
        
        const handleMouseMove = (e) => {
            handleCanvasInteraction(e);
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Gérer le début de l'interaction (tactile) sur le canvas
    const handleCanvasTouchStart = (e) => {
        handleCanvasInteraction(e);
        
        const handleTouchMove = (e) => {
            handleCanvasInteraction(e);
        };
        
        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Gérer le début de l'interaction (souris) sur le slider de teinte
    const handleHueMouseDown = (e) => {
        handleHueInteraction(e);
        
        const handleMouseMove = (e) => {
            handleHueInteraction(e);
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Gérer le début de l'interaction (tactile) sur le slider de teinte
    const handleHueTouchStart = (e) => {
        handleHueInteraction(e);
        
        const handleTouchMove = (e) => {
            handleHueInteraction(e);
        };
        
        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Gérer le changement de teinte (fallback pour navigateurs qui ne supportent pas les événements personnalisés)
    const handleHueChange = (e) => {
        setHue(parseInt(e.target.value));
    };

    const handleSave = () => {
        onColorChange(selectedColor);
        onClose();
    };

    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    // Couleurs rapides prédéfinies
    const quickColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
        '#EC4899', '#6B7280', '#14B8A6', '#A855F7'
    ];

    return (
        <div className="color-picker-overlay" onClick={onClose}>
            <div className="color-picker-content" onClick={stopPropagation}>
                <div className="color-picker-header">
                    <h3>Choisir une couleur</h3>
                    <p>pour "{eventTitle}"</p>
                </div>

                <div className="color-picker-main">
                    {/* Canvas principal pour saturation/luminosité */}
                    <div className="color-canvas-container">
                        <canvas
                            ref={canvasRef}
                            width={200}
                            height={150}
                            className="color-canvas"
                            onMouseDown={handleCanvasMouseDown}
                            onTouchStart={handleCanvasTouchStart}
                        />
                        {/* Curseur de position */}
                        <div 
                            className="color-cursor"
                            style={{
                                left: `${((saturation - MIN_SATURATION) / (MAX_SATURATION - MIN_SATURATION)) * 100}%`,
                                top: `${(1 - (lightness - MIN_LIGHTNESS) / (MAX_LIGHTNESS - MIN_LIGHTNESS)) * 100}%`
                            }}
                        />
                    </div>

                    {/* Slider de teinte optimisé */}
                    <div className="hue-slider-container">
                        <div 
                            className="hue-slider-track"
                            onMouseDown={handleHueMouseDown}
                            onTouchStart={handleHueTouchStart}
                        >
                            <div 
                                className="hue-slider-thumb"
                                style={{ left: `${(hue / 360) * 100}%` }}
                            />
                        </div>
                        {/* Slider natif caché pour l'accessibilité */}
                        <input
                            ref={hueSliderRef}
                            type="range"
                            min="0"
                            max="360"
                            value={hue}
                            onChange={handleHueChange}
                            className="hue-slider-hidden"
                            aria-label="Teinte"
                        />
                    </div>

                    {/* Aperçu de la couleur */}
                    <div className="color-preview">
                        <div 
                            className="color-preview-box"
                            style={{ backgroundColor: selectedColor }}
                        />
                        <span className="color-preview-text">{selectedColor}</span>
                    </div>
                </div>

                {/* Couleurs rapides */}
                <div className="quick-colors">
                    <h4>Couleurs rapides</h4>
                    <div className="quick-colors-grid">
                        {quickColors.map((color) => (
                            <button
                                key={color}
                                className={`quick-color ${selectedColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            >
                                {selectedColor === color && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="color-picker-actions">
                    <button className="color-picker-cancel" onClick={onClose}>
                        <X size={16} />
                        Annuler
                    </button>
                    <button className="color-picker-save" onClick={handleSave}>
                        <Check size={16} />
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColorPicker;