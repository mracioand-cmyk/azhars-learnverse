const express = require('express');
const router = express.Router();
const db = require('../database'); // Assume existing database connection

// POST /api/updateSubscriptionSettings
router.post('/updateSubscriptionSettings', async (req, res) => {
    const { message, price, whatsapp } = req.body;

    try {
        // Logic to save data to the database
        await db.query('INSERT INTO subscriptions (message, price, whatsapp) VALUES (?, ?, ?)', [message, price, whatsapp]);
        res.status(201).send({ success: true, message: 'Subscription settings updated' });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Error updating subscription settings' });
    }
});

// Additional logic to retrieve settings if needed
router.get('/updateSubscriptionSettings', async (req, res) => {
    try {
        const settings = await db.query('SELECT * FROM subscriptions'); // Retrieve all subscription settings
        res.status(200).send(settings);
    } catch (error) {
        res.status(500).send({ success: false, message: 'Error retrieving subscription settings' });
    }
});

module.exports = router;