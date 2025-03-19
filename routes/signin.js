// routes/signin.js
const express = require('express');
const router = express.Router();

// GET หน้า Sign In
router.get('/', (req, res) => {
  res.render('signin');
});

module.exports = router;
