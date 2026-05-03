"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Bell, Settings, HardDrive, Search, Filter, Check,
  Trash2, Edit3, Plus, X, Save, Users, Activity, Package, List, Info, Database, ChevronLeft, ChevronRight, Download, RefreshCw,
  ArrowUp, ArrowDown
} from "lucide-react";
import { 
  listAllTelemetry, listClassifications, listBins, 
  listUsers, listAlerts, listMaintenanceLogs,
  createBin, updateBin, deleteBin,
  createMaintenanceLog, deleteMaintenanceLog, deleteUser
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatFullDateTime } from "../utils/formatters";
import { SkeletonTable } from "./shared/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

const TABLES = [
  { id: 'users', label: 'Users', icon: Users, api: listUsers, structure: [
    { name: 'id', type: 'UUID', extra: 'DEFAULT gen_random_uuid()', comment: 'PK' },
    { name: 'username', type: 'VARCHAR(50)', extra: 'UNIQUE, NOT NULL', comment: '' },
    { name: 'email', type: 'VARCHAR(100)', extra: 'UNIQUE, NOT NULL', comment: '' },
    { name: 'password_hash', type: 'TEXT', extra: 'NOT NULL', comment: '' },
    { name: 'full_name', type: 'VARCHAR(100)', extra: 'NULLABLE', comment: '' },
    { name: 'role', type: 'VARCHAR(20)', extra: "DEFAULT 'operator'", comment: '' },
    { name: 'fcm_token', type: 'TEXT', extra: 'NULLABLE', comment: '' },
    { name: 'created_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
    { name: 'updated_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
  { id: 'bins', label: 'Bins', icon: HardDrive, api: listBins, structure: [
    { name: 'id', type: 'UUID', extra: 'PRIMARY KEY', comment: '' },
    { name: 'name', type: 'VARCHAR(100)', extra: 'NOT NULL', comment: '' },
    { name: 'location', type: 'TEXT', extra: 'NULLABLE', comment: '' },
    { name: 'max_volume_cm', type: 'FLOAT', extra: 'DEFAULT 50.0', comment: '' },
    { name: 'max_weight_kg', type: 'FLOAT', extra: 'DEFAULT 20.0', comment: '' },
    { name: 'status', type: 'VARCHAR(20)', extra: "DEFAULT 'active'", comment: '' },
    { name: 'created_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
    { name: 'updated_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
  { id: 'sensor_readings', label: 'Telemetry', icon: Activity, api: listAllTelemetry, structure: [
    { name: 'id', type: 'BIGSERIAL', extra: 'PRIMARY KEY', comment: '' },
    { name: 'bin_id', type: 'UUID', extra: 'REFERENCES bins(id)', comment: '' },
    { name: 'distance_organic_cm', type: 'FLOAT', extra: '', comment: '' },
    { name: 'distance_inorganic_cm', type: 'FLOAT', extra: '', comment: '' },
    { name: 'weight_organic_kg', type: 'FLOAT', extra: '', comment: '' },
    { name: 'weight_inorganic_kg', type: 'FLOAT', extra: '', comment: '' },
    { name: 'gas_amonia_ppm', type: 'FLOAT', extra: '', comment: '' },
    { name: 'volume_organic_pct', type: 'FLOAT', extra: '', comment: '' },
    { name: 'volume_inorganic_pct', type: 'FLOAT', extra: '', comment: '' },
    { name: 'recorded_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
  { id: 'classification_logs', label: 'AI Logs', icon: Package, api: listClassifications, structure: [
    { name: 'id', type: 'BIGSERIAL', extra: 'PRIMARY KEY', comment: '' },
    { name: 'bin_id', type: 'UUID', extra: 'REFERENCES bins(id)', comment: '' },
    { name: 'predicted_class', type: 'VARCHAR(20)', extra: 'NOT NULL', comment: '' },
    { name: 'confidence', type: 'FLOAT', extra: '', comment: '' },
    { name: 'inference_time_ms', type: 'INT', extra: '', comment: '' },
    { name: 'classified_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
  { id: 'maintenance_logs', label: 'Maintenance', icon: Settings, api: listMaintenanceLogs, structure: [
    { name: 'id', type: 'BIGSERIAL', extra: 'PRIMARY KEY', comment: '' },
    { name: 'bin_id', type: 'UUID', extra: 'REFERENCES bins(id)', comment: '' },
    { name: 'action_type', type: 'VARCHAR(50)', extra: 'NOT NULL', comment: '' },
    { name: 'notes', type: 'TEXT', extra: '', comment: '' },
    { name: 'performed_by', type: 'UUID', extra: 'REFERENCES users(id)', comment: '' },
    { name: 'performed_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
  { id: 'alerts', label: 'Alerts', icon: Bell, api: listAlerts, structure: [
    { name: 'id', type: 'BIGSERIAL', extra: 'PRIMARY KEY', comment: '' },
    { name: 'bin_id', type: 'UUID', extra: 'REFERENCES bins(id)', comment: '' },
    { name: 'alert_type', type: 'VARCHAR(50)', extra: 'NOT NULL', comment: '' },
    { name: 'message', type: 'TEXT', extra: '', comment: '' },
    { name: 'severity', type: 'VARCHAR(20)', extra: "DEFAULT 'info'", comment: '' },
    { name: 'is_read', type: 'BOOLEAN', extra: 'DEFAULT FALSE', comment: '' },
    { name: 'created_at', type: 'TIMESTAMPTZ', extra: 'DEFAULT NOW()', comment: '' },
  ]},
];

export default function DataManagementView() {
  const { token } = useAuth();
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [activeTab, setActiveTab] = useState('browse'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [refData, setRefData] = useState({ bins: [], users: [] });

  const limit = 15;

  const fetchData = useCallback(async () => {
    if (!token || !activeTable) return;
    setLoading(true);
    try {
      const res = await activeTable.api(token, { page, limit });
      if (res.success) {
        setData(res.data || []);
        setTotal(res.total || (res.data ? res.data.length : 0));
      }
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeTable, page]);

  const fetchRefs = useCallback(async () => {
    if (!token) return;
    try {
      const [binsRes, usersRes] = await Promise.all([
        listBins(token, { limit: 100 }),
        listUsers(token)
      ]);
      setRefData({
        bins: binsRes.data || [],
        users: usersRes.data || []
      });
    } catch (e) {
      console.error("Failed to fetch reference data", e);
    }
  }, [token]);

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [activeTable]);

  useEffect(() => {
    if (activeTab === 'browse') fetchData();
  }, [page, fetchData, activeTab]);

  useEffect(() => {
    fetchRefs();
  }, [fetchRefs]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    
    let apiCall = null;
    const tableId = activeTable.id;
    if (tableId === 'bins') apiCall = deleteBin;
    else if (tableId === 'maintenance_logs') apiCall = deleteMaintenanceLog;
    else if (tableId === 'users') apiCall = deleteUser;

    if (!apiCall) {
        alert(`Delete operation is not implemented for ${activeTable.label}`);
        return;
    }

    try {
        const res = await apiCall(token, id);
        if (res.success) fetchData();
    } catch (e) {
        alert(e.message);
    }
  };

  const handleOpenModal = (row = null) => {
    setEditData(row);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    activeTable.structure.forEach(col => {
        if (col.type === 'FLOAT' || col.type === 'INT' || col.type === 'DOUBLE PRECISION') {
            if (payload[col.name]) payload[col.name] = Number(payload[col.name]);
        }
    });

    let apiCall = null;
    if (activeTable.id === 'bins') apiCall = editData ? updateBin : createBin;
    else if (activeTable.id === 'maintenance_logs' && !editData) apiCall = createMaintenanceLog;

    if (!apiCall) {
        alert("Operation not yet implemented for this table via UI.");
        return;
    }

    try {
        const res = editData 
            ? await apiCall(token, editData.id, payload)
            : await apiCall(token, payload);
            
        if (res.success) {
            setIsModalOpen(false);
            fetchData();
        }
    } catch (e) {
        alert(e.message);
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : (activeTable.structure ? activeTable.structure.map(s => s.name) : []);

  return (
    <div className="clean-explorer">
      {/* Top Header & Table Selector */}
      <div className="explorer-header">
        <div className="selector-bar">
          {TABLES.map(table => (
            <button 
              key={table.id}
              className={`selector-item ${activeTable.id === table.id ? 'active' : ''}`}
              onClick={() => setActiveTable(table)}
            >
              <table.icon size={14} />
              <span>{table.label}</span>
              {activeTable.id === table.id && <motion.div layoutId="active-pill" className="active-pill" />}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="tab-group">
          <button className={activeTab === 'browse' ? 'active' : ''} onClick={() => setActiveTab('browse')}>
            <List size={14} /> Browse
          </button>
          <button className={activeTab === 'structure' ? 'active' : ''} onClick={() => setActiveTab('structure')}>
            <Info size={14} /> Structure
          </button>
        </div>

        <div className="action-group">
          <button className="create-btn" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Add Row
          </button>
          <button className="icon-btn" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button className="export-btn">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="explorer-stage">
        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div key={`${activeTable.id}-browse`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stage-content">
              <div className="table-container">
                {loading ? <SkeletonTable rows={15} cols={columns.length} /> : (
                  <table className="pro-grid">
                    <thead>
                      <tr>
                        <th width="40">#</th>
                        {columns.map(col => (
                            <th key={col} className="sortable" onClick={() => handleSort(col)}>
                                <div className="th-content">
                                    {col.replace(/_/g, ' ')}
                                    {sortConfig.key === col && (
                                        sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                                    )}
                                </div>
                            </th>
                        ))}
                        <th width="80" style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((row, i) => (
                        <tr key={i}>
                          <td className="row-num">{(page - 1) * limit + i + 1}</td>
                          {columns.map(col => (
                            <td key={col} className={col === 'id' || col.includes('_id') ? 'mono' : ''}>
                              {col.includes('at') || col === 'recorded_at' || col === 'timestamp' ? (
                                <span className="time-val">{formatFullDateTime(row[col])}</span>
                              ) : row[col] === null ? (
                                <span className="null-val">NULL</span>
                              ) : (
                                <span>{String(row[col])}</span>
                              )}
                            </td>
                          ))}
                          <td className="actions-cell">
                             <div className="action-btns">
                                <button className="a-btn edit" onClick={() => handleOpenModal(row)}><Edit3 size={12} /></button>
                                <button className="a-btn delete" onClick={() => handleDelete(row.id)}><Trash2 size={12} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="stage-footer">
                <div className="footer-stats">
                  Showing <b>{data.length}</b> of <b>{total}</b> records
                </div>
                <div className="pagination">
                  <button 
                    className="p-btn" 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                    <span>Prev</span>
                  </button>
                  
                  <div className="page-info">
                    <span>Page</span>
                    <span className="current-page">{page}</span>
                    <span className="separator">/</span>
                    <span className="total-pages">{Math.ceil(total / limit) || 1}</span>
                  </div>

                  <button 
                    className="p-btn" 
                    disabled={page >= Math.ceil(total / limit)} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key={`${activeTable.id}-structure`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stage-content">
              <div className="table-container">
                <table className="pro-grid structure">
                  <thead>
                    <tr><th>Column</th><th>Type</th><th>Constraint</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    {activeTable.structure.map((col, i) => (
                      <tr key={i}>
                        <td className="bold">{col.name}</td>
                        <td className="type-col">{col.type}</td>
                        <td className="extra-col">{col.extra}</td>
                        <td className="comment-col">{col.comment || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="modal-box" 
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>{editData ? 'Edit Record' : 'Add New Record'}</h3>
                    <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="modal-form">
                    <div className="form-grid">
                        {activeTable.structure.filter(col => !['id', 'created_at', 'updated_at', 'recorded_at', 'classified_at', 'performed_at', 'timestamp'].includes(col.name)).map(col => (
                            <div key={col.name} className="form-group">
                                <label>{col.name.replace(/_/g, ' ')}</label>
                                
                                {col.name === 'bin_id' ? (
                                    <select name={col.name} defaultValue={editData ? editData[col.name] : ''}>
                                        <option value="">-- Select Bin --</option>
                                        {refData.bins.map(bin => (
                                            <option key={bin.id} value={bin.id}>{bin.name}</option>
                                        ))}
                                    </select>
                                ) : col.name === 'performed_by' ? (
                                    <select name={col.name} defaultValue={editData ? editData[col.name] : ''}>
                                        <option value="">-- Select User --</option>
                                        {refData.users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                                        ))}
                                    </select>
                                ) : col.type === 'TEXT' || col.name === 'notes' ? (
                                    <textarea name={col.name} defaultValue={editData ? editData[col.name] : ''} />
                                ) : (
                                    <input 
                                        name={col.name} 
                                        type={col.type === 'FLOAT' || col.type === 'INT' ? 'number' : 'text'}
                                        step="any"
                                        defaultValue={editData ? editData[col.name] : ''} 
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="form-footer">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save">
                            <Save size={16} /> {editData ? 'Update Record' : 'Insert Data'}
                        </button>
                    </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .clean-explorer { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #000; color: #fff; font-family: -apple-system, sans-serif; }
        .explorer-header { padding: 8px 0; border-bottom: 1px solid #1a1a1a; overflow-x: auto; }
        .selector-bar { display: flex; padding: 0 16px; gap: 4px; }
        .selector-item { position: relative; background: transparent; border: none; padding: 8px 16px; color: #666; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 8px; transition: all 0.2s; white-space: nowrap; }
        .selector-item:hover { color: #aaa; background: rgba(255,255,255,0.03); }
        .selector-item.active { color: #fff; }
        .active-pill { position: absolute; inset: 0; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; z-index: -1; }
        .control-bar { padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #050505; border-bottom: 1px solid #1a1a1a; }
        .tab-group { display: flex; gap: 4px; background: #111; padding: 3px; border-radius: 8px; border: 1px solid #222; }
        .tab-group button { padding: 6px 12px; border: none; background: transparent; color: #555; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 6px; display: flex; align-items: center; gap: 6px; }
        .tab-group button.active { background: #222; color: #fff; }
        .action-group { display: flex; align-items: center; gap: 12px; }
        .create-btn { background: #10B981; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .icon-btn { background: #000; border: 1px solid #222; border-radius: 8px; color: #666; padding: 8px; cursor: pointer; }
        .export-btn { background: #fff; color: #000; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .explorer-stage { flex: 1; overflow: hidden; position: relative; }
        .stage-content { height: 100%; display: flex; flex-direction: column; }
        .table-container { flex: 1; overflow: auto; padding: 0 16px; }
        .pro-grid { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
        .pro-grid th { position: sticky; top: 0; background: #000; padding: 16px 12px; font-size: 11px; font-weight: 700; color: #444; border-bottom: 1px solid #1a1a1a; z-index: 10; }
        .pro-grid th.sortable { cursor: pointer; transition: all 0.2s; }
        .pro-grid th.sortable:hover { background: #111; color: #fff; }
        .th-content { display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .pro-grid td { padding: 14px 12px; border-bottom: 1px solid #0d0d0d; color: #888; }
        .pro-grid tr:hover td { background: rgba(255,255,255,0.01); color: #fff; }
        .mono { font-family: monospace; font-size: 11px; color: #555; }
        .actions-cell { text-align: center; }
        .action-btns { display: flex; justify-content: center; gap: 6px; }
        .a-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #222; background: #000; color: #444; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .a-btn:hover { color: #fff; border-color: #444; }
        .a-btn.edit:hover { color: #3b82f6; border-color: #3b82f6; background: rgba(59,130,246,0.1); }
        .a-btn.delete:hover { color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,0.1); }
        .stage-footer {
          padding: 12px 20px;
          border-top: 1px solid #1a1a1a;
          background: #050505;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .footer-stats { font-size: 11px; color: #444; text-transform: uppercase; letter-spacing: 0.5px; }
        .footer-stats b { color: #888; }
        
        .pagination { display: flex; align-items: center; gap: 12px; }
        .p-btn {
          background: transparent;
          border: 1px solid #222;
          color: #888;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .p-btn:hover:not(:disabled) {
          background: #111;
          color: #fff;
          border-color: #444;
        }
        .p-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        
        .page-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #444;
          background: #0d0d0d;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #1a1a1a;
        }
        .current-page { color: #fff; font-weight: 700; }
        .separator { color: #222; }
        .total-pages { color: #666; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: #0a0a0a; border: 1px solid #222; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { font-size: 18px; font-weight: 700; color: #fff; }
        .close-btn { background: transparent; border: none; color: #444; cursor: pointer; }
        .modal-form { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 11px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 1px; }
        .form-group input, .form-group textarea, .form-group select { background: #000; border: 1px solid #222; padding: 10px 14px; border-radius: 10px; color: #fff; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group select:focus { border-color: #444; }
        .form-footer { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { background: transparent; border: 1px solid #222; color: #888; padding: 10px 20px; border-radius: 10px; cursor: pointer; }
        .btn-save { background: #fff; color: #000; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
