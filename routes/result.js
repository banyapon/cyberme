const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // รับค่า storageUrl และ cameraId จาก query string
  const storageUrl = req.query.storageUrl;
  const cameraId = req.query.cameraId;
  if (!storageUrl || !cameraId) {
    return res.status(400).send('Missing parameters.');
  }
  // Render หน้า result.ejs พร้อมส่งค่าที่จำเป็นให้กับ view
  res.render('result', { storageUrl, cameraId });
});

module.exports = router;
