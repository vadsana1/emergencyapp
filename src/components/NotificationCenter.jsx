import React from 'react';

const NotificationCenter = ({ notifications = [], markAsRead, onClose }) => (
  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 border border-gray-200">
    <div className="flex items-center justify-between p-4 border-b">
      <span className="font-bold text-gray-800 text-lg">ແຈ້ງເຕືອນ</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg px-2">&times;</button>
    </div>
    <div className="max-h-80 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="text-gray-500 text-center py-6">ບໍ່ມີແຈ້ງເຕືອນ</div>
      ) : (
        <ul className="divide-y">
          {notifications.map((n, idx) => (
            <li
              key={n.id}
              className={`flex items-start px-4 py-3 ${n.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-gray-900'}`}
            >
              <div className="flex-1">
              <div>{n.message}</div>
                      {n.incidentId && (
                          <div className="text-xs text-gray-500">
                              <span className="font-semibold">ID:</span> {n.incidentId}
                          </div>
                      )}
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
              </div>
              {!n.read && (
                <button
                  onClick={() => markAsRead(idx)}
                  className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                >
                  ອ່ານແລ້ວ
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
export default NotificationCenter;
