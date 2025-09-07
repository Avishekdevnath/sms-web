'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type AttendanceForm = {
  _id: string;
  missionId: string;
  title: string;
  active: boolean;
  questions: Array<{ key: string; label: string; type: string; required?: boolean; options?: string[] }>;
};

type LogItem = {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
};

export default function MissionAttendancePage() {
  const params = useParams();
  const missionId = String(params?.missionId || '');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<AttendanceForm | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [todayStatus, setTodayStatus] = useState<'present' | 'absent' | 'excused' | ''>('');
  const [notes, setNotes] = useState('');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const isPrivileged = useMemo(() => {
    const role = user?.role || '';
    return ['admin', 'sre', 'mentor', 'developer'].includes(role);
  }, [user]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load active form
        const formRes = await fetch(`/api/v2/attendance/forms?missionId=${missionId}&active=true`, { cache: 'no-store' });
        if (formRes.ok) {
          const json = await formRes.json();
          setActiveForm(json.data?.[0] || null);
        }
        // Load recent logs (for current user)
        if (user?._id) {
          const logsRes = await fetch(`/api/v2/attendance/logs?missionId=${missionId}&studentId=${user._id}&limit=7`, { cache: 'no-store' });
          if (logsRes.ok) {
            const json = await logsRes.json();
            setLogs(json.data || []);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    if (missionId) init();
  }, [missionId, user?._id]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const gr = await fetch(`/api/v2/mentorship-groups?missionId=${missionId}&limit=100`, { cache: 'no-store' });
        if (gr.ok) {
          const gj = await gr.json();
          setGroups((gj.data || []).map((g: any) => ({ _id: g._id, name: g.name })));
        }
        const sr = await fetch(`/api/v2/missions/${missionId}/students?limit=100`, { cache: 'no-store' });
        if (sr.ok) {
          const sj = await sr.json();
          setStudents((sj.data || []).map((s: any) => ({ _id: s.studentId?._id || s.studentId, name: s.studentId?.name || s.name || 'Student' })));
        }
      } catch {}
    };
    if (isPrivileged && missionId) loadRefs();
  }, [isPrivileged, missionId]);

  const submitStudentAttendance = async (status: 'present' | 'absent' | 'excused') => {
    if (!user?._id) return;
    setTodayStatus(status);
    const body: any = { missionId, studentId: user._id, status, notes };
    if (activeForm) body.answers = answers;
    const res = await fetch('/api/v2/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const logsRes = await fetch(`/api/v2/attendance/logs?missionId=${missionId}&studentId=${user._id}&limit=7`, { cache: 'no-store' });
      if (logsRes.ok) {
        const json = await logsRes.json();
        setLogs(json.data || []);
      }
      setNotes('');
    }
  };

  // Bulk mark state (for mentors/admin)
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'excused'>('present');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkStudentIds, setBulkStudentIds] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [groups, setGroups] = useState<Array<{ _id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ _id: string; name: string }>>([]);
  const submitBulk = async () => {
    setBulkSubmitting(true);
    try {
      const payload: any = { missionId, status: bulkStatus, notes: bulkNotes };
      if (bulkGroupId) payload.mentorshipGroupId = bulkGroupId;
      const ids = bulkStudentIds.split(/[,\s]+/).filter(Boolean);
      if (ids.length) payload.studentIds = ids;
      await fetch('/api/v2/attendance/bulk-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading attendance...</div>;

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-xl font-semibold">Mission Attendance</h1>

      {user && !isPrivileged && (
        <div className="space-y-4 border rounded p-4">
          <h2 className="font-medium">Your Daily Check-in</h2>
          {activeForm && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">{activeForm.title}</div>
              {activeForm.questions.map((q) => (
                <div key={q.key} className="space-y-1">
                  <label className="text-sm font-medium">{q.label}</label>
                  {q.type === 'text' && (
                    <input 
                      className="border rounded px-2 py-1 w-full" 
                      placeholder={q.placeholder}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'paragraph' && (
                    <textarea 
                      className="border rounded px-2 py-1 w-full" 
                      rows={4}
                      placeholder={q.placeholder}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'email' && (
                    <input 
                      type="email" 
                      className="border rounded px-2 py-1 w-full" 
                      placeholder={q.placeholder || "example@email.com"}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'number' && (
                    <input 
                      type="number" 
                      className="border rounded px-2 py-1 w-full" 
                      placeholder={q.placeholder}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: Number(e.target.value) }))} 
                    />
                  )}
                  {q.type === 'date' && (
                    <input 
                      type="date" 
                      className="border rounded px-2 py-1 w-full" 
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'time' && (
                    <input 
                      type="time" 
                      className="border rounded px-2 py-1 w-full" 
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'datetime' && (
                    <input 
                      type="datetime-local" 
                      className="border rounded px-2 py-1 w-full" 
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'url' && (
                    <input 
                      type="url" 
                      className="border rounded px-2 py-1 w-full" 
                      placeholder={q.placeholder || "https://example.com"}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'phone' && (
                    <input 
                      type="tel" 
                      className="border rounded px-2 py-1 w-full" 
                      placeholder={q.placeholder || "+8801234567890"}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} 
                    />
                  )}
                  {q.type === 'boolean' && (
                    <select className="border rounded px-2 py-1 w-full" onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value === 'true' }))}>
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}
                  {q.type === 'single-select' && (
                    <select className="border rounded px-2 py-1 w-full" onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}>
                      <option value="">Select...</option>
                      {(q.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {q.type === 'multi-select' && (
                    <select multiple className="border rounded px-2 py-1 w-full" onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(o => o.value);
                      setAnswers((a) => ({ ...a, [q.key]: values }));
                    }}>
                      {(q.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="text-2xl"
                          onClick={() => setAnswers((a) => ({ ...a, [q.key]: star }))}
                        >
                          {answers[q.key] >= star ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'scale' && (
                    <div className="space-y-2">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        className="w-full" 
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: Number(e.target.value) }))} 
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>1</span>
                        <span>{answers[q.key] || 5}</span>
                        <span>10</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea className="border rounded px-2 py-1 w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => submitStudentAttendance('present')}>Mark Present</button>
            <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={() => submitStudentAttendance('excused')}>Excused</button>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => submitStudentAttendance('absent')}>Mark Absent</button>
          </div>
          <div>
            <h3 className="font-medium mt-4">Recent</h3>
            <ul className="list-disc pl-5 text-sm">
              {logs.map((l) => (
                <li key={l._id}>{new Date(l.date).toLocaleDateString()} — {l.status}{l.notes ? ` (${l.notes})` : ''}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isPrivileged && (
        <div className="space-y-4 border rounded p-4">
          <h2 className="font-medium">Bulk Mark (Mentor/Admin/SRE)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Status</label>
              <select className="border rounded px-2 py-1 w-full" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)}>
                <option value="present">Present</option>
                <option value="excused">Excused</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Group (optional)</label>
              <select className="border rounded px-2 py-1 w-full" value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)}>
                <option value="">Select group...</option>
                {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Students (optional)</label>
              <select multiple className="border rounded px-2 py-1 w-full" onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map(o => o.value);
                setBulkStudentIds(values.join(','));
              }}>
                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Notes</label>
              <textarea className="border rounded px-2 py-1 w-full" value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} />
            </div>
          </div>
          <button disabled={bulkSubmitting} className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submitBulk}>
            {bulkSubmitting ? 'Submitting...' : 'Submit Bulk'}
          </button>
        </div>
      )}
    </div>
  );
}


