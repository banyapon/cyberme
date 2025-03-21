const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const basicAuth = require("express-basic-auth");
const multer = require("multer");

const db = admin.database();
const bucket = admin.storage().bucket();
const ITEMS_PER_PAGE = 5;

// Basic Authentication Middleware
router.use(
    basicAuth({
        users: { admin: "2e3w4t5r" },
        challenge: true,
        unauthorizedResponse: "Unauthorized Access",
    })
);

// Multer Setup for File Uploads
const upload = multer({ storage: multer.memoryStorage() });

// Admin Panel with Pagination
router.get("/", async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let lastKey = req.query.lastKey || null;

        let query = db.ref("avatars").orderByKey().limitToFirst(ITEMS_PER_PAGE + 1);
        if (lastKey) query = query.startAfter(lastKey);

        const snapshot = await query.once("value");
        const avatars = [];
        let newLastKey = null;

        snapshot.forEach((childSnapshot) => {
            if (avatars.length < ITEMS_PER_PAGE) {
                avatars.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                });
            } else {
                newLastKey = childSnapshot.key;
            }
        });

        res.render("admin", {
            avatars: avatars.length > 0 ? avatars : [],
            currentPage: page,
            hasNextPage: !!newLastKey,
            hasPrevPage: page > 1,
            nextPageKey: newLastKey,
            prevPageKey: page > 1 ? avatars[0].id : null,
        });
    } catch (error) {
        console.error("Error fetching avatars:", error);
        res.status(500).send("Error fetching avatars");
    }
});

// ✅ Edit & Upload New Image
router.post("/update/:id", upload.single("newImage"), async (req, res) => {
    const { id } = req.params;
    try {
        const updates = {
            cameraId: req.body.cameraId,
        };

        if (req.file) {
            const fileName = `avatars/avatar_${id}_${Date.now()}.jpg`;
            const file = bucket.file(fileName);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype },
                public: true,
            });

            updates.swappedImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        }

        await db.ref(`avatars/${id}`).update(updates);
        res.redirect("/admin");
    } catch (error) {
        console.error("Error updating avatar:", error);
        res.status(500).send("Failed to update avatar.");
    }
});

// ✅ Delete Avatar
router.post("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.ref(`avatars/${id}`).remove();
        res.redirect("/admin");
    } catch (error) {
        console.error("Error deleting avatar:", error);
        res.status(500).send("Failed to delete avatar.");
    }
});

module.exports = router;
