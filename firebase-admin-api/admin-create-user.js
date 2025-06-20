// server.js หรือ index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // path ของ serviceAccount
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/admin-create-user', async (req, res) => {
  console.log('BODY:', req.body); 
  const { userId, email, password, name, phone, helperType } = req.body;
  if (!userId || !email || !password) {
    return res.status(400).json({ error: 'Missing userId, email, or password' });
  }

  try {
    
    // 1. สร้าง user ใน Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    
    // 2. เพิ่ม Firestore ด้วย doc id = userId ที่ frontend ส่งมา (u001, u002, ...)
    await admin.firestore().collection('users').doc(userId).set({
      userId,                // จะเป็น u001, u002, ... 
      email,
      name,
      phone,
      helperType,
      password,              // ไม่ควรเก็บ plain-text password ใน production
      role: 'helper',
      profileImage: '',
      uid: userRecord.uid,    // uid ที่แท้จริงใน Firebase Auth
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, uid: userId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post('/api/admin-update-password', async (req, res) => {
  const { uid, password,email, userId } = req.body;
  console.log('API admin-update-password:', req.body);
  if (!uid || !password ||!email ) {
    return res.status(400).json({ error: 'Missing authUid or password' });
  }
  try {
    await admin.auth().updateUser(uid, { password });
    if (userId) {
      await admin.firestore().collection('users').doc(userId).update({ password,email });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post('/api/delete-user-account', async (req, res) => {
  const { uid, userId } = req.body;
  if (!uid || !userId) {
    return res.status(400).json({ error: 'Missing uid or userId' });
  }
  try {
    // 1. ลบออกจาก Firebase Auth
    await admin.auth().deleteUser(uid);
    // 2. ลบออกจาก Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API running on http://localhost:${PORT}`);
});
