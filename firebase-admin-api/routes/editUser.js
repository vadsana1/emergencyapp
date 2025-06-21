const express = require('express');
const router = express.Router();

module.exports = (admin) => {
    router.post('/api/admin-edit-user', async (req, res) => {
        const { uid, userId, email, password, name, phone, helperType } = req.body;
        if (!uid || !userId) {
            return res.status(400).json({ error: 'Missing uid or userId' });
        }
        try {
            const updateAuth = {};
            
            if (password) updateAuth.password = password;
            if (Object.keys(updateAuth).length > 0) {
                await admin.auth().updateUser(uid, updateAuth);
            }
            const updateData = {};
            if (email) updateData.email = email;
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            if (helperType) updateData.helperType = helperType;
            // ตรงนี้ควรใช้ userId ไม่ใช่ uid ถ้า doc id ใน Firestore คือ userId
            await admin.firestore().collection('users').doc(userId).update(updateData);

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    return router;
};
