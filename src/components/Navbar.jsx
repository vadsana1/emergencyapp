import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ notifications = [], markAsRead }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white shadow">
      <div className="flex items-center justify-between w-full px-4 py-2">
        {/* Brand */}
        <div className="text-2xl font-semibold flex-shrink-0">ADMIN</div>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Menu */}
        <div className={`
          ${menuOpen ? 'flex' : 'hidden'}
          md:flex flex-1 items-center justify-center
          md:static absolute top-full left-0 w-full md:w-auto bg-gray-800 md:bg-transparent
          flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0 py-2 md:py-0 z-40
        `}>
          <Link to="/dashboard" className="hover:text-blue-400 px-3 py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/incidents" className="hover:text-blue-400 px-3 py-2" onClick={() => setMenuOpen(false)}>ຂໍ້ມູນການແຈ້ງເຫດ</Link>
          <Link to="/responders" className="hover:text-blue-400 px-3 py-2" onClick={() => setMenuOpen(false)}>ຂໍ້ມູນຜູ້ແຈ້ງເຫດ</Link>
          <Link to="/reports" className="hover:text-blue-400 px-3 py-2" onClick={() => setMenuOpen(false)}>ຂໍ້ມູນຜູ້ເກີດອຸບັດເຫດ</Link>
          <Link to="/helper-approval" className="hover:text-blue-400 px-3 py-2" onClick={() => setMenuOpen(false)}>ຂໍ້ມູນທົ່ວໄປ</Link>
        </div>

        {/* Notification + User */}
        <div className="flex items-center space-x-3 ml-4 relative">
          {/* Notification */}
          <button
            className="relative"
            onClick={() => setShowDropdown(v => !v)}
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-14 mt-2 w-80 z-50">
              <NotificationCenter
                notifications={notifications}
                markAsRead={markAsRead}
                onClose={() => setShowDropdown(false)}
              />
            </div>
          )}
          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(v => !v)}
              className="flex items-center space-x-2"
            >
              <span>Admin</span>
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg z-50">
                <ul>
                  <li><Link to="/profile" className="block px-4 py-2" onClick={() => setUserDropdown(false)}>Profile</Link></li>
                  <li><Link to="/logout" className="block px-4 py-2" onClick={() => setUserDropdown(false)}>Logout</Link></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
