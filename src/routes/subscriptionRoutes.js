import express from 'express';
import { getSubscriptionSettings } from './subscriptionController';

const router = express.Router();

// GET endpoint for retrieving subscription settings
router.get('/api/getSubscriptionSettings', async (req, res) => {
    try {
        const settings = await getSubscriptionSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subscription settings' });
    }
});

export default router;