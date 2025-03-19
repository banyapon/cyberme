# 🚀 Openhouse DPU 2025 - Cyberpunk Avatar Faceswap  

**Dhurakij Pundit University (DPU) | College of Creative Design and Entertainment Technology (ANT DPU)**  
**Project Lead:** *Asst. Prof. Banyapon Poolsawas, Deputy Dean*  

## 🎭 Cyberpunk Avatar Faceswap  

This project utilizes **Faceswap API** to transform users’ faces into **Cyberpunk-style avatars**.  
It's an interactive and fun activity developed for **DPU Openhouse 2025**.

Developed by **College of Creative Design and Entertainment Technology (ANT DPU)**, this system allows users to swap their faces with **Cyberpunk-themed avatars** in real-time.

---

## 🖼️ **Screenshots**
| Avatar Example 1 | Avatar Example 2 |
|------------------|------------------|
| ![Avatar 1](https://github.com/banyapon/cyberme/blob/main/photo/1.png?raw=true) | ![Avatar 2](https://github.com/banyapon/cyberme/blob/main/photo/2.png?raw=true) |
| ![Avatar 3](https://github.com/banyapon/cyberme/blob/main/photo/3.png?raw=true) | ![Avatar 4](https://github.com/banyapon/cyberme/blob/main/photo/4.png?raw=true) |

---

## 🛠 **Tech Stack**
- **Node.js** + **Express.js** - Backend Server
- **Firebase Firestore & Storage** - User Data & Avatar Image Storage
- **Vercel** - Cloud Deployment
- **Bootstrap 5** - UI Styling
- **Faceswap API** - AI Face Swapping

---

## 🔧 **Installation & Running Locally**

### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/banyapon/cyberme.git
cd cyberme
```
Create a .env file in the project root and add the following variables:
```bash
PORT=5000
FIREBASE_STORAGE_BUCKET=YOU_VALUE
FIREBASE_DATABASE_URL=YOU_VALUE
FACESWAP_API_KEY=YOU_VALUE
FIREBASE_AUTH_DOMAIN=YOU_VALUE
FIREBASE_PROJECT_ID=YOU_VALUE
FIREBASE_MESSAGING_SENDER_ID=YOU_VALUE
FIREBASE_APP_ID=YOU_VALUE
FIREBASE_MEASUREMENT_ID=YOU_VALUE
```

### 2️⃣ **Set Up Firebase Credentials**
Before running the project, **create a Firebase service account key**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Project Settings** → **Service Accounts**
3. Click **Generate new private key**
4. Download `serviceAccountKey.json`
5. Place it inside the project root.

---

### 3️⃣ **Install Dependencies**
```bash
npm install
```

### 4️⃣ **Run the Server (Express.js)**
```bash
node index.js
```
Your server should now be running on `http://localhost:3000`

---

## 🚀 **Running on Vercel**
To run this project using **Vercel**, follow these steps:

### 1️⃣ **Install Vercel CLI**
```bash
npm install -g vercel
```

### 2️⃣ **Login to Vercel**
```bash
vercel login
```

### 3️⃣ **Run Locally with Vercel**
```bash
vercel dev
```

### 4️⃣ **Deploy to Vercel**
```bash
vercel --prod
```

---

## 📄 **License**
This project is for **educational and research purposes** under **Dhurakij Pundit University (DPU)**.

**© 2025 College of Creative Design and Entertainment Technology (ANT DPU)**  

---

## 🤝 **Contributors**
- **Asst. Prof. Banyapon Poolsawas** *(Project Lead)*
- **College of Creative Design and Entertainment Technology, DPU**

💡 **Feel free to contribute, fork, and modify this project!**

---

🚀 **Enjoy the Cyberpunk Avatar Experience!** 🕶️✨
