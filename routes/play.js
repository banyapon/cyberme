const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const bucket = admin.storage().bucket(); // Firebase Storage
const sharp = require('sharp');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL // ตรวจสอบให้แน่ใจว่าได้ตั้งค่า Realtime Database แล้ว
  });
}

const db = admin.database(); // ใช้ Realtime Database เท่านั้น

// Multer สำหรับจัดการ file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint หลักสำหรับรับไฟล์และอัปโหลดไป Storage แล้วยิง FaceSwap API (ใช้สำหรับกรณีที่อัปโหลดจากกล้องหรือเลือกไฟล์)
router.post('/', upload.single('file'), async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.status(401).send("Unauthorized: No session cookie found.");
  }
  try {
    // ตรวจสอบ session Firebase
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    // ปรับขนาดภาพโดยใช้ sharp (ความกว้าง 800px)
    const resizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .toBuffer();

    // รับ cameraId จาก request (ถ้าไม่มีให้ใช้ 'default')
    const cameraId = req.body.cameraId || 'default';
    const fileName = `avatars/avatar_${cameraId}_${Date.now()}.jpg`;

    console.log("Uploading file to Firebase Storage...");
    const file = bucket.file(fileName);
    await file.save(resizedBuffer, {
      metadata: { contentType: req.file.mimetype },
      public: true
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("File uploaded successfully:", publicUrl);

    // ส่งกลับ storage URL กับ cameraId เพื่อใช้ในหน้า result
    return res.json({ storageUrl: publicUrl, cameraId });
  } catch (error) {
    console.error("Error in main route:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Endpoint ใหม่สำหรับยิง FaceSwap API เมื่อกดปุ่ม CREATE AVATAR ในหน้า result
router.post('/createAvatar', async (req, res) => {
  try {
    const { storageUrl, cameraId } = req.body;
    if (!storageUrl || !cameraId) {
      return res.status(400).json({ error: "Missing storageUrl or cameraId" });
    }
    // สร้าง TargetImageUrl จาก cameraId
    const targetImageUrl = `https://cyberme.vercel.app/avatar/${cameraId}.jpg`;
    const sourceImageUrl = storageUrl;
    console.log("Sending Request to FaceSwap API (createAvatar)...");
    console.log("Target Image:", targetImageUrl);
    console.log("Source Image:", sourceImageUrl);
    // สร้าง payload เป็น string JSON
    const payload = `{"TargetImageUrl":"${targetImageUrl}","SourceImageUrl":"${sourceImageUrl}"}`;
    const faceswapResponse = await fetch("https://faceswap-image-transformation-api.p.rapidapi.com/faceswap", {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.FACESWAP_API_KEY,
        "x-rapidapi-host": "faceswap-image-transformation-api.p.rapidapi.com",
        "Content-Type": "application/json"
      },
      body: payload
    });
    const textResponse = await faceswapResponse.text();
    console.log("FaceSwap API Response (createAvatar):", textResponse);
    let faceswapData;
    try {
      faceswapData = JSON.parse(textResponse);
    } catch (error) {
      console.error("FaceSwap API returned non-JSON response:", textResponse);
      return res.status(500).json({ error: "FaceSwap API Error", details: textResponse });
    }
    if (!faceswapData.ResultImageUrl) {
      console.error("FaceSwap API error (missing ResultImageUrl):", faceswapData);
      return res.status(500).json({ error: "FaceSwap failed", details: faceswapData });
    }
    const swappedImageUrl = faceswapData.ResultImageUrl;
    console.log("Swapped Image URL (createAvatar):", swappedImageUrl);
    return res.json({ swappedImageUrl, cameraId });
  } catch (error) {
    console.error("Error in createAvatar route:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Endpoint สำหรับบันทึกภาพลง Firebase เมื่อกดปุ่ม Close (logic เดิม)
router.post('/save', async (req, res) => {
  const { swappedImageUrl, cameraId } = req.body;
  if (!swappedImageUrl || !cameraId) {
    return res.status(400).json({ error: "Missing swappedImageUrl or cameraId" });
  }
  try {
    const copiedUrl = await saveSwappedImageToStorage(swappedImageUrl, cameraId);
    if (!copiedUrl) {
      console.error("Error: copiedUrl is null, skipping database save.");
      return res.status(500).json({ error: "Failed to save swapped image to storage." });
    }
    console.log("Image successfully saved to Firebase Storage:", copiedUrl);
    await saveToRealtimeDatabase(copiedUrl, cameraId);
    console.log("Successfully saved swapped image to Realtime Database!");
    return res.json({ swappedImageUrl: copiedUrl });
  } catch (error) {
    console.error("Error in save route:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// ฟังก์ชันสำหรับบันทึกภาพที่ swap ลง Firebase Storage
async function saveSwappedImageToStorage(swappedImageUrl, cameraId) {
  try {
    console.log("Fetching swapped image from URL:", swappedImageUrl);
    const response = await fetch(swappedImageUrl);
    if (!response.ok) {
      console.error("Failed to fetch swapped image. Status:", response.status);
      return null;
    }
    const buffer = await response.buffer();
    const fileName = `results/swapped_${cameraId}_${Date.now()}.jpg`;
    const file = bucket.file(fileName);
    console.log("Uploading swapped image to Firebase Storage...");
    await file.save(buffer, {
      metadata: { contentType: 'image/jpeg' },
      public: true
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("Image copied to Firebase Storage:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error saving swapped image to Firebase Storage:", error);
    return null;
  }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลลง Firebase Realtime Database
async function saveToRealtimeDatabase(imageUrl, cameraId) {
  const dbRef = admin.database().ref('avatars');
  try {
    console.log(`Saving to Realtime Database: cameraId=${cameraId}, URL=${imageUrl}`);
    const newRef = dbRef.push();
    await newRef.set({
      cameraId: cameraId,
      swappedImageUrl: imageUrl,
      timestamp: Date.now()
    });
    console.log("Swapped image URL saved to Realtime Database!");
  } catch (error) {
    console.error("Error saving to Realtime Database:", error);
  }
}

module.exports = router;
