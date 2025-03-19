const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database(); // Firebase Realtime Database

router.get('/', async (req, res) => {
    try {
        const snapshot = await db.ref('avatars').limitToFirst(12).once('value');
        const avatars = [];

        snapshot.forEach(childSnapshot => {
            avatars.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        res.render('people', { avatars }); // ✅ ส่ง JSON Object โดยตรง
    } catch (error) {
        console.error("Error fetching avatars:", error);
        res.status(500).send("Error fetching avatars");
    }
});

router.get('/load-more', async (req, res) => {
    try {
        const lastKey = req.query.lastKey;
        let query = db.ref('avatars').orderByKey().startAfter(lastKey).limitToFirst(12);
        
        const snapshot = await query.once('value');
        const avatars = [];

        snapshot.forEach(childSnapshot => {
            avatars.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        res.json(avatars);
    } catch (error) {
        console.error("Error fetching more avatars:", error);
        res.status(500).json({ error: "Error loading more avatars" });
    }
});


module.exports = router;
