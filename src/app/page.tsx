'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  summary: string;
  impacted_services: string[];
  created_at: string;
}

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Incident>>({});

  const fetchIncidents = async () => {
    const { data } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (data) setIncidents(data);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const startEdit = (inc: Incident) => {
    setEditingId(inc.id);
    setEditForm(inc);
  };

  const saveEdit = async (id: string) => {
    await supabase.from('incidents').update({
      title: editForm.title,
      status: editForm.status,
      severity: editForm.severity,
      summary: editForm.summary
    }).eq('id', id);

    setEditingId(null);
    fetchIncidents();
  };

  const hasActiveIncidents = incidents.some(i => i.status !== 'resolved');

  return (
    <main className="max-w-4xl mx-auto py-12 px-4 font-sans">
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">StatusPulse</h1>
          <p className="text-sm text-gray-500">Live Infrastructure & Outage Monitor</p>
        </div>
        <button
          onClick={fetchIncidents}
          className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded border"
        >
          Refresh
        </button>
      </div>

      {/* Global Status Banner */}
      <div className={`p-4 rounded-lg mb-8 text-white font-semibold flex items-center justify-between ${
        hasActiveIncidents ? 'bg-amber-600' : 'bg-emerald-600'
      }`}>
        <span>{hasActiveIncidents ? 'Active Incident Reported' : 'All Systems Operational'}</span>
        <span className="text-xs bg-black/20 px-2 py-1 rounded">Live</span>
      </div>

      {/* Incident List */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Incident History & Updates</h2>
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <p className="text-gray-500 italic">No incidents posted yet. Connect Claude via MCP to post an update.</p>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="border rounded-lg p-5 bg-white shadow-sm">
              {editingId === incident.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Title</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded text-sm mt-1"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Status</label>
                      <select
                        className="w-full border p-2 rounded text-sm mt-1"
                        value={editForm.status || 'investigating'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="investigating">Investigating</option>
                        <option value="identified">Identified</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Severity</label>
                      <select
                        className="w-full border p-2 rounded text-sm mt-1"
                        value={editForm.severity || 'minor'}
                        onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                      >
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Summary</label>
                    <textarea
                      rows={3}
                      className="w-full border p-2 rounded text-sm mt-1"
                      value={editForm.summary || ''}
                      onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(incident.id)}
                      className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{incident.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(incident.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs px-2 py-1 rounded font-medium uppercase ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {incident.status}
                      </span>
                      <button
                        onClick={() => startEdit(incident)}
                        className="text-xs text-blue-600 hover:underline border px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{incident.summary}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}