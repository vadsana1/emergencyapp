const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.serviceAccountKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// import และใช้ route ที่แยกไว้
app.use(require('./routes/createUser')(admin));
app.use(require('./routes/editUser')(admin));
app.use(require('./routes/deleteUser')(admin));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API running on http://localhost:${PORT}`);
});
