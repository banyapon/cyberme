const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore(); // Firestore Database
const bucket = admin.storage().bucket(); // Firebase Storage
const path = require('path'); // ใช้สำหรับแปลง path ของไฟล์
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// ใช้ multer memory storage สำหรับเก็บไฟล์ในหน่วยความจำ
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', (req, res) => {
  res.send("This is the FaceSwap API. Use POST to upload images.");
});

router.post('/', upload.single('file'), async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.status(401).send("Unauthorized: No session cookie found.");
  }

  try {
    // ตรวจสอบ session cookie ด้วย Firebase Admin
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);

    // ตรวจสอบว่ามีไฟล์ถูกอัปโหลดมาหรือไม่
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // รับ cameraId จาก req.body
    const cameraId = req.body.cameraId || 'default';
    const fileName = `avatars/avatar_${cameraId}_${Date.now()}.jpg`;

    // ดึง bucket ที่กำหนดใน Firebase Admin SDK
    const file = bucket.file(fileName);

    // อัปโหลดไฟล์ไปยัง Firebase Storage
    console.log("Uploading file to Firebase Storage...");
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true
    });

    // สร้าง URL สำหรับเข้าถึงไฟล์ที่อัปโหลด
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("File uploaded successfully:", publicUrl);

    // กำหนด TargetImageUrl โดยใช้ cameraId
    const targetImageUrl = `https://cyberme.vercel.app/avatar/${cameraId}.jpg`;
    const sourceImageUrl = publicUrl;

    // กำหนด Timeout เพื่อป้องกัน API ค้าง
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    console.log("Sending Request to FaceSwap API...");
    console.log("Target Image:", targetImageUrl);
    console.log("Source Image:", sourceImageUrl);

    const faceswapResponse = await fetch("https://faceswap-image-transformation-api.p.rapidapi.com/faceswap", {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.FACESWAP_API_KEY,
        "x-rapidapi-host": "faceswap-image-transformation-api.p.rapidapi.com",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        TargetImageUrl: targetImageUrl,
        SourceImageUrl: sourceImageUrl
      }),
      signal: controller.signal
    });

    clearTimeout(timeout); // ยกเลิก timeout ถ้า API ตอบกลับเร็ว

    // ตรวจสอบว่า API ตอบกลับเป็น JSON หรือไม่
    const textResponse = await faceswapResponse.text();
    console.log("FaceSwap API Response:", textResponse);

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
    console.log("Swapped Image URL:", swappedImageUrl);

    if (swappedImageUrl) {
      console.log("✅ Swapped Image URL:", swappedImageUrl);

      // คัดลอกไปยัง Firebase Storage
      const copiedUrl = await saveSwappedImageToStorage(swappedImageUrl, cameraId);

      if (!copiedUrl) {
        console.error("❌ Error: copiedUrl is null, skipping database save.");
        return res.status(500).json({ error: "Failed to save swapped image to storage." });
      }

      console.log("✅ Image successfully saved to Firebase Storage:", copiedUrl);

      // บันทึกไปยัง Realtime Database
      await saveToRealtimeDatabase(copiedUrl, cameraId);

      // บันทึกไปยัง Firestore
      await saveToFirestore(copiedUrl, cameraId);

      console.log("✅ Successfully saved swapped image to Firestore & Realtime Database!");

      return res.json({ swappedImageUrl: copiedUrl });
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("FaceSwap API request took too long and was aborted.");
      return res.status(504).json({ error: "FaceSwap API Timeout", details: "Request took longer than 25 seconds." });
    }
    console.error("Error in play route:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// ฟังก์ชันคัดลอกไฟล์ไปยัง Firebase Storage
async function saveSwappedImageToStorage(swappedImageUrl, cameraId) {
  try {
    console.log("🔄 Fetching swapped image from URL:", swappedImageUrl);
    const response = await fetch(swappedImageUrl);

    if (!response.ok) {
      console.error("❌ Failed to fetch swapped image. Status:", response.status);
      return null;
    }

    const buffer = await response.buffer();
    const fileName = `results/swapped_${cameraId}_${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    console.log("🔄 Uploading swapped image to Firebase Storage...");
    await file.save(buffer, {
      metadata: { contentType: 'image/jpeg' },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("✅ Image copied to Firebase Storage:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error saving swapped image to Firebase Storage:", error);
    return null;
  }
}

// ฟังก์ชันบันทึกข้อมูลลง Realtime Database
async function saveToRealtimeDatabase(imageUrl, cameraId) {
  const dbRef = admin.database().ref('avatars');
  try {
    console.log(`📝 Saving to Realtime Database: cameraId=${cameraId}, URL=${imageUrl}`);
    const newRef = dbRef.push();
    await newRef.set({
      cameraId: cameraId,
      swappedImageUrl: imageUrl,
      timestamp: Date.now()
    });
    console.log("✅ Swapped image URL saved to Realtime Database!");
  } catch (error) {
    console.error("❌ Error saving to Realtime Database:", error);
  }
}

// ฟังก์ชันบันทึกข้อมูลลง Firestore
async function saveToFirestore(imageUrl, cameraId) {
  try {
    console.log(`📝 Saving to Firestore: cameraId=${cameraId}, URL=${imageUrl}`);
    await db.collection('results').add({
      cameraId: cameraId,
      swappedImageUrl: imageUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Swapped image URL saved to Firestore!");
  } catch (error) {
    console.error("❌ Error saving to Firestore:", error);
  }
}

module.exports = router;
