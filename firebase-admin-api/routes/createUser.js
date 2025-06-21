const express = require('express');
const router = express.Router();

module.exports = (admin) => {
  router.post('/api/admin-create-user', async (req, res) => {
    const { userId, email, password, name, phone, helperType } = req.body;
    if (!userId || !email || !password) {
      return res.status(400).json({ error: 'Missing userId, email, or password' });
    }
    try {
      const userRecord = await admin.auth().createUser({
        email, password, displayName: name,
      });
      await admin.firestore().collection('users').doc(userId).set({
        userId, email, name, phone, helperType,
        password, // ห้ามเก็บ plain-text ใน production!
        role: 'helper',
        profileImage: '',
        uid: userRecord.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ success: true, uid: userRecord.uid, userId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  return router;
};
