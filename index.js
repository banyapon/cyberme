require("dotenv").config();  
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const admin = require('firebase-admin');

const app = express();

//Firebase Initialization (Use `.env` first, fallback to local JSON)
if (!admin.apps.length) { 
  try {
      const firebaseConfig = process.env.FIREBASE_CREDENTIALS 
        ? JSON.parse(process.env.FIREBASE_CREDENTIALS) 
        : require(path.resolve(__dirname, "serviceAccountKey.json"));

      admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log("Firebase Initialized Successfully");
  } catch (error) {
      console.error("Firebase Initialization Error:", error);
      process.exit(1);
  }
} else {
  console.log("Firebase already initialized, using existing instance.");
}


app.get('/firebase-config', (req, res) => {
  res.json({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

//Express Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Routes
const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin');
const avatarRouter = require('./routes/avatar');
const sessionRouter = require('./routes/session');
const cameraRouter = require('./routes/camera');
const playRouter = require('./routes/play');
const peopleRouter = require('./routes/people');

app.use('/', indexRouter);
app.use('/signin', signinRouter);
app.use('/avatar', avatarRouter);
app.use('/sessionLogin', sessionRouter);
app.use('/camera', cameraRouter);
app.use('/play', playRouter);
app.use('/people', peopleRouter);


module.exports = app;
