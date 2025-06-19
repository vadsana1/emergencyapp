import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase.js';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const STATUS_OPTIONS = [
  { value: '', label: 'ທຸກສະຖານະ' },
  { value: 'received', label: 'ໄດ້ຮັບເຫດແລ້ວ' },
  { value: 'assigned', label: 'ມອບໝາຍທີມຊ່ວຍເຫຼືອ' },
  { value: 'en_route', label: 'ກຳລັງເດີນທາງ' },
  { value: 'in_progress', label: 'ກຳລັງດຳເນີນງານ' },
  { value: 'completed', label: 'ສິ້ນສຸດ' },
];

const ITEMS_PER_PAGE = 10;

const IncidentPage = ({ showPopup, addNotification }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [incidents, setIncidents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailIncident, setDetailIncident] = useState(null);
  const [assignedTeamInfo, setAssignedTeamInfo] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const lastIncidentIdRef = useRef(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null); 

  // โหลด incident_types (ดึงจาก Firestore)
  useEffect(() => {
    const fetchIncidentTypes = async () => {
      const q = collection(db, 'incident_types');
      const snapshot = await getDocs(q);
      setIncidentTypes(snapshot.docs.map(doc => doc.data()));
    };
    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    const unsubIncidents = onSnapshot(collection(db, 'incidents'), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      if (
        items.length > 0 &&
        lastIncidentIdRef.current &&
        items[0].id !== lastIncidentIdRef.current
      ) {
        showPopup("🚨 ມີເຫດການໃໝ່ເຂົ້າລະບົບ!");
        if (typeof addNotification === "function") {
          addNotification("🚨 ມີເຫດການໃໝ່ເຂົ້າລະບົບ!", items[0].id);
        }
      }
      setIncidents(items);
      if (items.length > 0) {
        lastIncidentIdRef.current = items[0].id;
      }
    });

    const unsubAssignments = onSnapshot(collection(db, 'incident_assignments'), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setAssignments(items);
    });

    return () => {
      unsubIncidents();
      unsubAssignments();
    };
  }, [showPopup, addNotification]);

  const getStatusLabel = (statusValue) => {
    const found = STATUS_OPTIONS.find(opt => opt.value === statusValue);
    return found ? found.label : statusValue || "-";
  };

  const getIncidentTypeLabel = (typeValue) => {
    const found = incidentTypes.find(t => t.type === typeValue);
    return found ? found.name : typeValue || "-";
  };

  const typeFilterOptions = [
    { value: '', label: 'ທຸກປະເພດ' },
    ...incidentTypes.map(t => ({
      value: t.type,
      label: t.name,
    })),
  ];

  // ฟิลเตอร์
  const filteredIncidents = incidents.filter(i => {
    const matchType = !filterType || i.type === filterType;
    const matchSearch =
      !search ||
      (i.userName && i.userName.toLowerCase().includes(search.toLowerCase())) ||
      (i.id && i.id.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || i.status === filterStatus;

    let matchDate = true;
    if (startDate) {
      const s = dayjs(startDate).startOf('day').toDate();
      const incidentDate = i.timestamp?.seconds
        ? new Date(i.timestamp.seconds * 1000)
        : (i.timestamp ? new Date(i.timestamp) : null);
      matchDate = incidentDate && incidentDate >= s;
    }
    if (endDate) {
      const e = dayjs(endDate).endOf('day').toDate();
      const incidentDate = i.timestamp?.seconds
        ? new Date(i.timestamp.seconds * 1000)
        : (i.timestamp ? new Date(i.timestamp) : null);
      matchDate = matchDate && incidentDate && incidentDate <= e;
    }

    return matchType && matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIncidents = filteredIncidents.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = ts.seconds
      ? new Date(ts.seconds * 1000)
      : new Date(ts);
    return date.toLocaleString();
  };

  const openDetail = async (incident) => {
    setDetailIncident(incident);
    setShowDetailModal(true);
    setAssignedTeamInfo(null);
    setLoadingTeam(true);
    setSelectedAssignment(null); 

    try {
      const q = query(
        collection(db, 'incident_assignments'),
        where('incidentId', '==', incident.id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const teamDoc = snapshot.docs[0].data();
        setSelectedAssignment(teamDoc); 
        if (teamDoc && teamDoc.assignedTeam) {
          setAssignedTeamInfo(teamDoc.assignedTeam);
        }
      }
    } catch (err) {
      setAssignedTeamInfo(null);
      setSelectedAssignment(null);
    }
    setLoadingTeam(false);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetailIncident(null);
    setAssignedTeamInfo(null);
    setLoadingTeam(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const startEdit = (incident) => {
    setEditingId(incident.id);
    setEditForm({
      userName: incident.userName || '',
      type: incident.type || '',
      status: incident.status || '',
    });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    await deleteDoc(doc(db, 'incidents', deleteId));
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 3) end = Math.min(totalPages, 5);
    if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`mx-1 px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center mt-4 items-center">
        <button
          className="mx-1 px-2 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >«</button>
        {pages}
        <button
          className="mx-1 px-2 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >»</button>
      </div>
    );
  };

  const getLatLng = (incident) => {
    if (!incident || !incident.location) return null;
    if (incident.location.lat && incident.location.lng) {
      return { lat: incident.location.lat, lng: incident.location.lng };
    }
    if (Array.isArray(incident.location) && incident.location.length === 2) {
      return { lat: incident.location[0], lng: incident.location[1] };
    }
    return null;
  };
  const handleEditSubmit = async (e, incidentId) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'incidents', incidentId), {
        status: editForm.status,
      });
      const q = query(collection(db, 'incident_assignments'), where('incidentId', '==', incidentId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const assignmentDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'incident_assignments', assignmentDoc.id), {
          status: editForm.status,
        });
      }
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 pt-16 sm:p-6">

      <h1 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 text-center sm:text-left">
        ເຫດການທີ່ຜ່ານມາ
      </h1>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
          <input
            type="text"
            placeholder="🔎 ຄົ້ນຫາຊື່ຜູ້ແຈ້ງ ຫຼື ID"
            className="rounded px-3 py-2 bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring w-full sm:w-52"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="rounded px-3 py-2 bg-gray-800 text-white border border-gray-600 w-full sm:w-40"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            {typeFilterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="rounded px-3 py-2 bg-gray-800 text-white border border-gray-600 w-full sm:w-40"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center mt-1 sm:mt-0">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={update => setDateRange(update)}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="ເລືອກຊ່ວງວັນທີ"
            className="rounded px-3 py-2 text-gray-900 text-base font-semibold w-full sm:w-44"
          />
          {(startDate || endDate) && (
            <button
              className="ml-2 px-2 py-2 rounded bg-gray-600 text-white text-xs sm:text-base"
              onClick={() => setDateRange([null, null])}
            >
              ລ້າງວັນທີ
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl p-2 sm:p-6 shadow-lg overflow-x-auto">
        <table className="min-w-[700px] w-full text-xs sm:text-sm text-gray-300">
          <thead>
            <tr>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ລຳດັບ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ID</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ເວລາ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ຜູ້ແຈ້ງ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ທີມຮັບຜິດຊອບ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ປະເພດ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ສະຖານະ</th>
              <th className="px-2 sm:px-4 py-2 whitespace-nowrap">ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIncidents.map((incident, index) => {
              const assignment = assignments.find(a => a.incidentId === incident.id);
              const assignedName = assignment?.assignedTeam?.userName || '-';
              const teamStatus =
                assignment?.assignedTeam?.status ||
                assignment?.status ||
                '-';
              return (
                editingId === incident.id ? (
                  <tr key={incident.id} className="bg-gray-700">
                    <td className="px-2 sm:px-4 py-2">{startIdx + index + 1}</td>
                    <td className="px-2 sm:px-4 py-2">{incident.id}</td>
                    <td className="px-2 sm:px-4 py-2">{formatTimestamp(incident.timestamp)}</td>
                    <td className="px-2 sm:px-4 py-2">{incident.userName}</td>
                    <td className="px-2 sm:px-4 py-2">{assignedName}</td>
                    <td className="px-2 sm:px-4 py-2">{incident.type}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <select
                        className="bg-gray-900 border rounded px-2 text-white"
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                      >
                        <option value="">-</option>
                        {STATUS_OPTIONS.filter(s => s.value !== '').map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2 space-x-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded mb-1 sm:mb-0"
                        onClick={(e) => handleEditSubmit(e, incident.id)}
                      >
                        ບັນທຶກ
                      </button>
                      <button
                        className="bg-gray-500 text-white px-3 py-1 rounded"
                        onClick={cancelEdit}
                      >
                        ຍົກເລີກ
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={incident.id} className="hover:bg-gray-700">
                    <td className="px-2 sm:px-4 py-2">{startIdx + index + 1}</td>
                    <td className="px-2 sm:px-4 py-2">{incident.id}</td>
                    <td className="px-2 sm:px-4 py-2">{formatTimestamp(incident.timestamp)}</td>
                    <td className="px-2 sm:px-4 py-2">{incident.userName || '-'}</td>
                    <td className="px-2 sm:px-4 py-2">{assignedName}</td>
                    <td className="px-2 sm:px-4 py-2">{getIncidentTypeLabel(incident.type)}</td>
                    <td className="px-2 sm:px-4 py-2">{getStatusLabel(teamStatus)}</td>
                    <td className="px-2 sm:px-4 py-2 space-x-1">
                      <button
                        className="bg-blue-600 text-white px-2 py-1 rounded mb-1 sm:mb-0"
                        onClick={async () => await openDetail(incident)}
                      >
                        ເບິ່ງ
                      </button>
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded mb-1 sm:mb-0"
                        onClick={() => startEdit(incident)}
                      >
                        ແກ້ໄຂ
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDelete(incident.id)}
                      >
                        ລຶບ
                      </button>
                    </td>
                  </tr>
                )
              );
            })}
            {paginatedIncidents.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">ບໍ່ພົບຂໍ້ມູນ</td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination()}
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-8 text-center w-[95vw] max-w-xs sm:max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">ຢືນຢັນການລຶບ</h2>
            <p className="mb-6 text-gray-700">ທ່ານຕ້ອງການລຶບເຫດການນີ້ຫຼືບໍ?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
              >
                ລຶບ
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
              >
                ຍົກເລີກ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailIncident && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-3 sm:p-8 w-[95vw] max-w-xs sm:max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">ລາຍລະອຽດເຫດການ</h2>
            <table className="w-full mb-6 text-gray-800 text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold">ID</td>
                  <td className="py-1">{detailIncident.id}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">ຊື່ຜູ້ແຈ້ງ</td>
                  <td className="py-1">{detailIncident.userName || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">ປະເພດ</td>
                  <td className="py-1">{getIncidentTypeLabel(detailIncident.type)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">ລາຍລະອຽດ</td>
                  <td className="py-1">{detailIncident.detail || '-'}</td>
                </tr>
                {detailIncident.imageUrl && (
                  <tr>
                    <td className="py-1 font-semibold">ຮູບເຫດການ</td>
                    <td className="py-1">
                      <img
                        src={detailIncident.imageUrl}
                        alt="Incident"
                        className="max-w-xs max-h-40 rounded shadow"
                      />
                    </td>
                  </tr>
                )}
                {getLatLng(detailIncident) && (
                  <tr>
                    <td className="py-1 font-semibold">ແຜນທີ່</td>
                    <td className="py-1">
                      <iframe
                        width="260"
                        height="170"
                        className="rounded shadow"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${getLatLng(detailIncident).lat},${getLatLng(detailIncident).lng}&z=16&output=embed`}
                        title="Google Map"
                      ></iframe>
                      <div className="text-xs text-gray-500 mt-1">
                        {getLatLng(detailIncident).lat}, {getLatLng(detailIncident).lng}
                      </div>
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 font-semibold align-top">ທີມຊ່ວຍເຫຼືອ</td>
                  <td className="py-1">
                    {loadingTeam ? (
                      <div className="text-gray-500">ກຳລັງຄົ້ນຫາຂໍ້ມູນ...</div>
                    ) : assignedTeamInfo ? (
                      <div>
                        <div>ປະເພດທີມ: {assignedTeamInfo.helperType || '-'}</div>
                        <div>ຊື່ຜູ້ຮັບງານ: {assignedTeamInfo.userName || '-'}</div>
                        <div>
                          ສະຖານະປະຈຸບັນ:&nbsp;
                          <span className="font-semibold text-blue-700">
                            {getStatusLabel(
                              selectedAssignment?.assignedTeam?.status ||
                              selectedAssignment?.status ||
                              null
                            ) || '-'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">ບໍ່ມີທີມຮັບງານ</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={closeDetail}
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentPage;
