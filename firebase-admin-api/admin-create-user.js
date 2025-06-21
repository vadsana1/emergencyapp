// // server.js หรือ index.js
// const express = require('express');
// const cors = require('cors');
// const admin = require('firebase-admin');
// const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const app = express();
// app.use(cors());
// app.use(express.json());

// /**
//  * CREATE USER (Admin)
//  * รับ: { userId, email, password, name, phone, helperType }
//  * ตอบกลับ: { success, uid, userId }
//  */
// app.post('/api/admin-create-user', async (req, res) => {
//   const { userId, email, password, name, phone, helperType } = req.body;
//   if (!userId || !email || !password) {
//     return res.status(400).json({ error: 'Missing userId, email, or password' });
//   }

//   try {
//     // 1. สร้าง user ใน Firebase Auth
//     const userRecord = await admin.auth().createUser({
//       email,
//       password,
//       displayName: name,
//     });

//     // 2. สร้างเอกสาร Firestore (ใช้ userId เป็น doc id)
//     await admin.firestore().collection('users').doc(userId).set({
//       userId,                
//       email,
//       name,
//       phone,
//       helperType,
//       password,          // (ห้ามเก็บ plain-text password ใน production)
//       role: 'helper',
//       profileImage: '',
//       uid: userRecord.uid,   // uid ของจริง
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     res.json({ success: true, uid: userRecord.uid, userId });
//   } catch (err) {
//     console.error('admin-create-user error:', err);
//     console.log('[admin-edit-user] payload:', req.body);

//     res.status(400).json({ error: err.message });
//   }
// });

// /**
//  * EDIT USER INFO (Admin)
//  * เปลี่ยนข้อมูล (รวมถึงรหัสผ่านได้)
//  * รับ: { uid, userId, email?, password?, name?, phone?, helperType? }
//  * ตอบกลับ: { success }
//  */
// app.post('/api/admin-edit-user', async (req, res) => {
//   const { uid, userId, email, password, name, phone, helperType } = req.body;
//   if (!uid || !userId) {
//     return res.status(400).json({ error: 'Missing uid or userId' });
//   }
//   try {
//     // อัปเดตใน Firebase Auth
//     const updateAuth = {};
//     if (email) updateAuth.email = email;
//     if (password) updateAuth.password = password;
//     if (Object.keys(updateAuth).length > 0) {
//       await admin.auth().updateUser(uid, updateAuth);
//     }
//     // อัปเดตใน Firestore
//     const updateData = {};
//     if (email) updateData.email = email;
//     if (name) updateData.name = name;
//     if (phone) updateData.phone = phone;
//     if (helperType) updateData.helperType = helperType;
//     await admin.firestore().collection('users').doc(uid).update(updateData);

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// /**
//  * DELETE USER (Admin)
//  * รับ: { uid, userId }
//  * ตอบกลับ: { success }
//  */
// app.post('/api/delete-user-account', async (req, res) => {
//   const { uid, userId } = req.body;
//   if (!uid || !userId) {
//     return res.status(400).json({ error: 'Missing uid or userId' });
//   }
//   try {
//     // ลบออกจาก Firebase Auth
//     await admin.auth().deleteUser(uid);
//     // ลบออกจาก Firestore
//     await admin.firestore().collection('users').doc(userId).delete();
//     res.json({ success: true });
//   } catch (err) {
//     console.error('delete-user-account error:', err);
//     res.status(400).json({ error: err.message });
//   }
// });


// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Admin API running on http://localhost:${PORT}`);
// });
