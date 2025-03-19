const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/', async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.redirect('/signin');
  }
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    console.log(`User Email: ${decodedClaims.email}, Display Name: ${decodedClaims.displayName}`);
    res.render('avatar', { user: decodedClaims });
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    res.redirect('/signin');
  }
});

module.exports = router;
