import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import HelperApproval from './components/helperApproval_temp';
import IncidentPage from './components/Incidents.jsx';
import UserList from './components/userlist.jsx';
import VictimsList from './components/VictimsList.jsx';
import NotificationPopup from './components/notipopup.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/footer.jsx'; 
import Logout from './components/Logout.jsx';
import "react-datepicker/dist/react-datepicker.css";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // popup กลางจอ
  const [popup, setPopup] = useState({ open: false, message: "" });
  const showPopup = (msg) => setPopup({ open: true, message: msg });
  const closePopup = () => setPopup({ ...popup, open: false });

  // notification dropdown (Navbar)
  const [notifications, setNotifications] = useState([]);
  const addNotification = (msg, incidentId) => {
    setNotifications(prev => [
      { id: Date.now(), message: msg, incidentId: incidentId, read: false, time: new Date().toLocaleString() },
      ...prev
    ]);
  };
  const markAsRead = (idx) => {
    setNotifications(arr =>
      arr.map((n, i) => i === idx ? { ...n, read: true } : n)
    );
  };

  const handleLogin = (status, role) => {
    setIsLoggedIn(status);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    // เพิ่มเติม: เคลียร์ notification ถ้าต้องการ
    setNotifications([]);
  };
  
  // ไม่แสดง Navbar/Footer ถ้าอยู่หน้า /login หรือ /register-admin
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register-admin'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);
  const hideFooterPaths = ['/login', '/register-admin'];
  const showFooter = !hideFooterPaths.includes(location.pathname);
 

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {showNavbar && <Navbar notifications={notifications} markAsRead={markAsRead} />}
      <NotificationPopup open={popup.open} message={popup.message} onClose={closePopup} />

      <main className={`flex-1 bg-gray-800 ${showNavbar ? "pt-20" : ""}`}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/logout"
            element={
              isLoggedIn ? (
                <Logout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/dashboard"
            element={
              isLoggedIn && userRole === "admin"
                ? <Dashboard showPopup={showPopup} addNotification={addNotification} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/incidents"
            element={
              isLoggedIn && userRole === "admin"
                ? <IncidentPage showPopup={showPopup} addNotification={addNotification} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/responders"
            element={
              isLoggedIn && userRole === "admin"
                ? <UserList showPopup={showPopup} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/reports"
            element={
              isLoggedIn && userRole === "admin"
                ? <VictimsList showPopup={showPopup} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/helper-approval"
            element={
              isLoggedIn && userRole === "admin"
                ? <HelperApproval showPopup={showPopup} />
                : <Navigate to="/login" />
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

export default AppWrapper;
