const express = require('express');
const router = express.Router();

// GET Home Page (Static)
router.get('/', (req, res) => {
  // ไม่ดึงข้อมูลใด ๆ แค่ render หน้า index.ejs
  res.render('index');
});

module.exports = router;
