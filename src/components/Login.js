import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom"; // **เอา Link ออก**
import './login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // ✅ ดึงข้อมูลผู้ใช้จาก Firestore
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      const userData = snapshot.data();
      const role = userData?.role;

      if (role === 'admin') {
        onLogin(true, role);
        navigate("/dashboard");
      } else {
        setError("คุณไม่มีสิทธิ์เข้าสู่ระบบส่วนผู้ดูแล");
      }
    } catch (err) {
      console.error("Login error", err);
      setError("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">ເຂົ້າສູ່ລະບົບ</h2>
      <div className="login-form">
        {error && <p className="error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="login-input"
        />
        <button onClick={handleLogin} className="login-btn">
          ເຂົ້າສູ່ລະບົບ
        </button>
        {/* <div className="register-link">
          <p>ຍັງບໍ່ມີບັນຊີ? <Link to="/register-admin">ລົງທະບຽນ</Link></p>
        </div> */}
      </div>
    </div>
  );
}
