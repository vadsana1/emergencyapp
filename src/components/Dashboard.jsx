import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const Dashboard = ({ showPopup }) => {
  // ==== Incident Types
  const [incidentTypes, setIncidentTypes] = useState([]);
  useEffect(() => {
    const fetchIncidentTypes = async () => {
      const snapshot = await getDocs(collection(db, 'incident_types'));
      setIncidentTypes(snapshot.docs.map(doc => doc.data()));
    };
    fetchIncidentTypes();
  }, []);
  const getIncidentTypeLabel = useCallback(
    (typeValue) => {
      const found = incidentTypes.find(t => t.type === typeValue);
      return found ? found.name : typeValue || '-';
    }, [incidentTypes]);
  const getIncidentTypeColor = useCallback(
    (typeValue, idx) => {
      const found = incidentTypes.find(t => t.type === typeValue);
      return found && found.color
        ? found.color
        : ['#EF4444', '#00C49F', '#818CF8', '#F59E42', '#64748B'][idx % 5];
    }, [incidentTypes]
  );

  // ==== Date Picker
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // ==== Incident State
  const [incidentCounts, setIncidentCounts] = useState({});
  const [incidentData, setIncidentData] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [showCount, setShowCount] = useState(10);
  const lastIncidentIdRef = useRef(null);

  // ==== Victim Status ตามช่วงวัน
  const [victimStatusCounts, setVictimStatusCounts] = useState({
    dead: 0,
    injured: 0,
    other: 0,
  });

  // ===== Incident fetching & filter =====
  useEffect(() => {
    lastIncidentIdRef.current = null;
  }, [startDate, endDate]);

  useEffect(() => {
    const incidentsRef = collection(db, 'incidents');
    const unsubscribe = onSnapshot(incidentsRef, (snapshot) => {
      let allData = snapshot.docs.map(doc => {
        const d = doc.data();
        let ts = d.timestamp;
        let dateObj;
        if (ts?.seconds) dateObj = new Date(ts.seconds * 1000);
        else if (typeof ts === 'number') dateObj = new Date(ts);
        else dateObj = null;
        const type = (d.type || '').toLowerCase();
        return {
          id: d.reportId || doc.id,
          type,
          status: d.status || '-',
          reporterName: d.userName || '-',
          assignedName: d.assignedTeam?.userName || '-',
          timestamp: dateObj,
        };
      });

      // ==== Filter by date range (ถ้าเลือก)
      if (startDate) {
        const s = dayjs(startDate).startOf('day').toDate();
        allData = allData.filter(i => i.timestamp && i.timestamp >= s);
      }
      if (endDate) {
        const e = dayjs(endDate).endOf('day').toDate();
        allData = allData.filter(i => i.timestamp && i.timestamp <= e);
      }

      // ===== Popup แจ้งเตือนเหตุใหม่ (ไม่เปลี่ยน)
      const sorted = [...allData].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (
        sorted.length > 0 &&
        lastIncidentIdRef.current &&
        sorted[0].id !== lastIncidentIdRef.current
      ) {
        if (showPopup) showPopup("🚨 ມີເຫດການໃໝ່ເຂົ້າລະບົບ!");
      }
      if (sorted.length > 0) {
        lastIncidentIdRef.current = sorted[0].id;
      }

      // ===== Count per incident type =====
      const counts = {};
      incidentTypes.forEach(t => {
        counts[t.type] = allData.filter(i => i.type === t.type).length;
      });
      counts.total = allData.length;
      setIncidentCounts(counts);

      // ===== Line Chart Group by date =====
      const group = {};
      allData.forEach(i => {
        if (!i.timestamp) return;
        const date = i.timestamp.toLocaleDateString();
        if (!group[date]) {
          group[date] = { date };
          incidentTypes.forEach(t => { group[date][t.name] = 0; });
        }
        const typeLabel = getIncidentTypeLabel(i.type);
        if (group[date][typeLabel] !== undefined) group[date][typeLabel] += 1;
      });
      const chartData = Object.values(group).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setIncidentData(chartData);

      // ===== Recent incidents table =====
      const recent = sorted
        .filter(i => i.timestamp)
        .map(i => ({
          id: i.id,
          time: i.timestamp ? i.timestamp.toLocaleString() : '-',
          reporterName: i.reporterName,
          assignedName: i.assignedName,
          type: getIncidentTypeLabel(i.type),
          status: i.status,
        }));
      setRecentIncidents(recent);
    });
    return unsubscribe;
  }, [showPopup, incidentTypes, getIncidentTypeLabel, startDate, endDate]);

  // ====== Victim Status ที่ filter ตาม incidentIds ช่วงวันที่ =====
  useEffect(() => {
    const incidentIdsInRange = new Set(recentIncidents.map(i => i.id));
    if (!incidentIdsInRange.size) {
      setVictimStatusCounts({ dead: 0, injured: 0, other: 0 });
      return;
    }

    const unsub = onSnapshot(collection(db, 'incident_victims'), (snapshot) => {
      let dead = 0, injured = 0, other = 0;
      snapshot.forEach(doc => {
        const v = doc.data();
        if (incidentIdsInRange.has(v.incidentId)) {
          const s = v.victimStatus?.trim();
          if (s === 'ເສຍຊີວິດ') dead++;
          else if (s === 'ບາດເຈັບ') injured++;
          else other++;
        }
      });
      setVictimStatusCounts({ dead, injured, other });
    });
    return unsub;
  }, [recentIncidents]);

  // =============== PIE CHART DUMMY DATA LOGIC ===============

  // Pie Data เหตุการณ์
  const pieIncidentData =
    incidentTypes.length > 0
      ? incidentTypes.map((t, idx) => ({
          name: t.name,
          value: incidentCounts[t.type] || 0,
        }))
      : [];
  const isNoIncidentData =
    pieIncidentData.length === 0 || pieIncidentData.every(d => d.value === 0);
  if (isNoIncidentData) {
    pieIncidentData.length = 0;
    pieIncidentData.push({ name: 'ບໍ່ມີຂໍ້ມູນ', value: 1, isDummy: true });
  }

  // Pie Data ผู้บาดเจ็บ
  const isNoVictimData =
    (victimStatusCounts.dead || 0) === 0 &&
    (victimStatusCounts.injured || 0) === 0;
  const pieVictimData = [];
  if (isNoVictimData) {
    pieVictimData.push(
      { name: 'ບໍ່ມີຂໍ້ມູນ', value: 1, isDummy: true }
    );
  } else {
    pieVictimData.push(
      { name: 'ເສຍຊີວິດ', value: victimStatusCounts.dead || 0 },
      { name: 'ບາດເຈັບ', value: victimStatusCounts.injured || 0 }
    );
  }

  // ============================== UI ==========================
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* ==== Date Picker ==== */}
      <div className="flex justify-end mb-6">
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => setDateRange(update)}
          dateFormat="dd/MM/yyyy"
          isClearable
          placeholderText="ເລືອກວັນເວລາ"
          className="rounded px-3 py-2 text-gray-900 text-lg font-semibold"
          calendarClassName="custom-calendar-size"
        />
        {(startDate || endDate) && (
          <button
            className="ml-2 px-3 py-2 rounded bg-gray-600 text-white text-lg"
            onClick={() => setDateRange([null, null])}
          >
            ล้างวันที่
          </button>
        )}
      </div>
      <div className="flex flex-col gap-6 mb-10 justify-center">
        <div className="flex flex-col md:flex-row gap-6 mb-10 justify-center">
          {/* Pie Chart Incident Type */}
          <div className="bg-gray-700 p-6 rounded-2xl shadow-lg flex-1 min-w-[320px]">
            <h3 className="text-xl font-semibold text-white mb-4">
              ຂໍ້ມູນການແຈ້ງເຫດ
            </h3>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={pieIncidentData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={isNoIncidentData ? () => 'ບໍ່ມີຂໍ້ມູນ' : undefined}
                >
                  {pieIncidentData.map((entry, idx) =>
                    entry.isDummy
                      ? <Cell key={idx} fill="#e5e7eb" />
                      : <Cell key={idx} fill={getIncidentTypeColor(incidentTypes[idx]?.type, idx)} />
                  )}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 text-lg text-center text-white">
              <span className="font-bold">ທັງໝົດ: </span>
              <span>{incidentCounts.total || 0}</span>
            </div>
          </div>
          {/* Pie Chart Victim Status */}
          <div className="bg-gray-700 p-6 rounded-2xl shadow-lg flex-1 min-w-[320px]">
            <h3 className="text-xl font-semibold text-white mb-4">
              ຂໍ້ມູນຜູ້ບາດເຈັບ
            </h3>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={pieVictimData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={isNoVictimData ? () => 'ບໍ່ມີຂໍ້ມູນ' : undefined}
                >
                  {pieVictimData.map((entry, idx) =>
                    entry.isDummy
                      ? <Cell key={idx} fill="#e5e7eb" />
                      : <Cell key={idx} fill={['#EF4444', '#F59E42'][idx]} />
                  )}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 mt-6 text-white">
              <span>ເສຍຊີວິດ: {victimStatusCounts.dead || 0}</span>
              <span>ບາດເຈັບ: {victimStatusCounts.injured || 0}</span>
            </div>
          </div>
          {/* Incident Statistics Cards */}
          <div className="bg-gray-700 p-6 rounded-2xl shadow-lg flex-1 min-w-[320px] flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-6">
              {incidentTypes.map((t, idx) => (
                <div key={t.type} className="bg-gray-800 rounded-2xl shadow-lg p-4 text-white">
                  <h3 className="text-lg font-semibold mb-4">{t.name}</h3>
                  <p className="text-4xl font-bold">{incidentCounts[t.type] || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Line Chart */}
        <div className="bg-gray-700 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-4">
            ສະຖິຕິ
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#ccc" fontSize={12} />
              <YAxis stroke="#ccc" fontSize={12} />
              {incidentTypes.map((t, idx) => (
                <Line
                  key={t.type}
                  type="monotone"
                  dataKey={t.name}
                  stroke={getIncidentTypeColor(t.type, idx)}
                  strokeWidth={3}
                  name={t.name}
                />
              ))}
              <RechartsTooltip />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Recent Table */}
        <div className="bg-gray-700 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl text-white mb-6">ເຫດການລ່າສຸດ</h2>
          <table className="w-full text-sm text-left text-gray-300">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="py-2 px-4">ID</th>
                <th className="py-2 px-4">ເວລາ</th>
                <th className="py-2 px-4">ຜູ້ແຈ້ງ</th>
                <th className="py-2 px-4">ຜູ້ຖືກມອບໝາຍ</th>
                <th className="py-2 px-4">ປະເພດ</th>
                <th className="py-2 px-4">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.slice(0, showCount).map((incident, idx) => (
                <tr key={idx} className="border-t border-gray-700">
                  <td className="py-2 px-4">{incident.id}</td>
                  <td className="py-2 px-4">{incident.time}</td>
                  <td className="py-2 px-4">{incident.reporterName}</td>
                  <td className="py-2 px-4">{incident.assignedName}</td>
                  <td className="py-2 px-4">{incident.type}</td>
                  <td className="py-2 px-4">{incident.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {showCount < recentIncidents.length && (
            <div className="flex justify-center mt-4">
              <button
                className="bg-gray-800 text-white px-6 py-2 rounded-xl shadow"
                onClick={() => setShowCount(showCount + 10)}
              >
                ສະແດງເພີ່ມເຕີມ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;