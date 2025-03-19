// routes/camera.js
const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
  const id = req.params.id;
  const numericId = Number(id);
  if (isNaN(numericId) || numericId < 1 || numericId > 13) {
    return res.status(404).send("Invalid camera id");
  }
  res.render('camera', { cameraId: numericId }); // 🔹 ส่งค่า cameraId ไปยังไคลเอนต์
});


module.exports = router;