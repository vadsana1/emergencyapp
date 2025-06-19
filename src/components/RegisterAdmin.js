import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Firebase Configuration
import { doc, setDoc } from "firebase/firestore";
// Firestore Functions
import '../stylecss/register.css';  // อย่าลืม import สไตล์นี้


export default function RegisterAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      // สร้างผู้ใช้งานใหม่ด้วย Email และ Password
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // เพิ่มข้อมูลแอดมินใน Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: "admin", // ระบุว่าเป็น admin
        status: "active", // ระบุสถานะผู้ใช้งาน
      });

      alert("ลงทะเบียนแอดมินสำเร็จ");
    } catch (err) {
        console.error("Error during registration:", err);
        alert("เกิดข้อผิดพลาด: " + err.message); // เพิ่มบรรทัดนี้เพื่อแสดงข้อความจริง
        setError("เกิดข้อผิดพลาดในการลงทะเบียน");
      }
      
    };
    

  return (
    <div className="register-container">
      <h2 className="register-title">ลงทะเบียนแอดมิน</h2>
      <div className="register-form">
        {error && <p className="error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="register-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="register-input"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="register-input"
        />
        <button onClick={handleRegister} className="register-btn">
          ลงทะเบียน
        </button>
      </div>
    </div>
  );
}
