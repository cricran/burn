import User from '../models/user.model.js';

export const getColorSettings = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('colorSettings');
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            mode: user.colorSettings?.mode || 'type',
            customColors: user.colorSettings?.customColors || {},
            showCancelledEvents: user.colorSettings?.showCancelledEvents ?? true,
            theme: user.colorSettings?.theme || 'auto'
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des paramètres', error: error.message });
    }
};

export const updateColorSettings = async (req, res) => {
    try {
        const { mode, customColors, showCancelledEvents, theme } = req.body;
        
        // Validation
        if (mode && !['type', 'individual'].includes(mode)) {
            return res.status(400).json({ message: 'Mode de couleur invalide' });
        }
        if (theme && !['light', 'dark', 'auto'].includes(theme)) {
            return res.status(400).json({ message: 'Thème invalide' });
        }

        const updateData = {};
        if (mode !== undefined) updateData['colorSettings.mode'] = mode;
        if (customColors !== undefined) updateData['colorSettings.customColors'] = customColors;
        if (showCancelledEvents !== undefined) updateData['colorSettings.showCancelledEvents'] = showCancelledEvents;
        if (theme !== undefined) updateData['colorSettings.theme'] = theme;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('colorSettings');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            mode: user.colorSettings?.mode || 'type',
            customColors: user.colorSettings?.customColors || {},
            showCancelledEvents: user.colorSettings?.showCancelledEvents ?? true,
            theme: user.colorSettings?.theme || 'auto'
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres', error: error.message });
    }
};