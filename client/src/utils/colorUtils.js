// Couleurs par type de cours (ajustées pour un bon contraste)
export const TYPE_COLORS = {
    CM: '#2563EB',    // Bleu plus foncé
    TD: '#059669',    // Vert plus foncé  
    TP: '#D97706',    // Orange plus foncé
    CC: '#DC2626',    // Rouge plus foncé
    DEFAULT: '#6366F1' // Indigo par défaut
};

// Nettoyer le titre pour extraire le nom du cours sans les préfixes
export const cleanCourseTitle = (title) => {
    if (!title) return '';
    
    // Supprimer les préfixes CM, TD, TP, CC (insensible à la casse, avec variations possibles)
    return title
        .replace(/^(cm|td|tp|cc)\s*[-:]?\s*/gi, '')
        .replace(/\s*(cm|td|tp|cc)\s*$/gi, '')
        .trim();
};

// Extraire le type de cours du titre
export const getCourseType = (title) => {
    if (!title) return 'DEFAULT';
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('cm')) return 'CM';
    if (lowerTitle.includes('td')) return 'TD';
    if (lowerTitle.includes('tp')) return 'TP';
    if (lowerTitle.includes('cc')) return 'CC';
    return 'DEFAULT';
};

// Générer une couleur basée sur un hash du titre
export const generateColorFromTitle = (title) => {
    const cleanTitle = cleanCourseTitle(title);
    
    // Créer un hash simple du titre nettoyé
    let hash = 0;
    for (let i = 0; i < cleanTitle.length; i++) {
        const char = cleanTitle.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en entier 32-bit
    }
    
    // Générer une couleur HSL avec des contraintes
    const hue = Math.abs(hash) % 360;
    const saturation = 45 + (Math.abs(hash) % 30); // 45-75%
    const lightness = 50 + (Math.abs(hash) % 20);  // 50-70%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
};

// Détecter si un événement est annulé
export const isEventCancelled = (event) => {
    return event.cancelled === true;
};

// Couleur pour les cours annulés
export const CANCELLED_EVENT_COLOR = '#888888'; // Gris

// Obtenir la couleur d'un événement selon le mode sélectionné
export const getEventColor = (event, colorSettings) => {
    // Vérifier si l'événement est annulé
    if (isEventCancelled(event)) {
        return CANCELLED_EVENT_COLOR;
    }

    const { mode, customColors } = colorSettings;
    
    switch (mode) {
        case 'type':
            const type = getCourseType(event.title);
            return TYPE_COLORS[type] || TYPE_COLORS.DEFAULT;
            
        case 'individual':
            const cleanTitle = cleanCourseTitle(event.title);
            
            // Vérifier si une couleur personnalisée existe
            if (customColors && customColors[cleanTitle]) {
                return customColors[cleanTitle];
            }
            
            // Sinon, générer une couleur
            return generateColorFromTitle(event.title);
            
        default:
            return TYPE_COLORS.DEFAULT;
    }
};

// Convertir une couleur HSL ou hex en RGB
export const colorToRGB = (color) => {
    if (!color) return { r: 0, g: 0, b: 0 };
    
    // Si c'est une couleur HSL
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1]) / 360;
        const s = parseInt(hslMatch[2]) / 100;
        const l = parseInt(hslMatch[3]) / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (h < 1/6) { r = c; g = x; b = 0; }
        else if (h < 2/6) { r = x; g = c; b = 0; }
        else if (h < 3/6) { r = 0; g = c; b = x; }
        else if (h < 4/6) { r = 0; g = x; b = c; }
        else if (h < 5/6) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    // Si c'est une couleur hex
    const hexMatch = color.match(/^#([A-Fa-f0-9]{6})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        };
    }
    
    // Valeur par défaut
    return { r: 59, g: 130, b: 246 }; // Bleu par défaut
};

// Calculer la luminosité relative d'une couleur (0-1)
export const getRelativeLuminance = (rgb) => {
    const { r, g, b } = rgb;
    
    // Normaliser les valeurs RGB
    const normalize = (value) => {
        const normalized = value / 255;
        return normalized <= 0.03928 
            ? normalized / 12.92 
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    
    const rNorm = normalize(r);
    const gNorm = normalize(g);
    const bNorm = normalize(b);
    
    // Calculer la luminosité relative selon WCAG
    return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
};

// Obtenir la couleur de texte optimale (noir ou blanc) selon la couleur de fond
export const getOptimalTextColor = (backgroundColor) => {
    const rgb = colorToRGB(backgroundColor);
    const luminance = getRelativeLuminance(rgb);
    
    // Si la luminosité est élevée, utiliser du texte noir, sinon blanc
    return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Valider qu'une couleur n'est pas trop claire ou trop foncée
// export const isValidColor = (color) => {
    // Cette fonction peut être étendue pour valider les couleurs
    // Pour l'instant, on fait confiance à notre générateur
    // return true;
// };