// routes/session.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.post('/', async (req, res) => {
  const idToken = req.body.idToken;
  // กำหนดระยะเวลา session cookie (เช่น 5 วัน)
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 วันในหน่วยมิลลิวินาที
  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    // กำหนด options สำหรับ cookie (httpOnly, secure ตาม environment)
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    res.cookie('session', sessionCookie, options);
    res.status(200).send({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    res.status(401).send('UNAUTHORIZED REQUEST!');
  }
});

module.exports = router;
