const express = require('express');
const router = express.Router();

module.exports = (admin) => {
  router.post('/api/delete-user-account', async (req, res) => {
    const { uid, userId } = req.body;
    if (!uid || !userId) {
      return res.status(400).json({ error: 'Missing uid or userId' });
    }
    try {
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection('users').doc(userId).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  return router;
};
