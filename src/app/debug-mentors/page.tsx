"use client";

import { useState, useEffect } from 'react';
import { Database, Copy, CheckCircle } from 'lucide-react';

interface MentorDebugInfo {
  _id: string;
  mentorName: string;
  mentorEmail: string;
  missionCode: string;
  status: string;
  role: string;
}

export default function DebugMentorsPage() {
  const [mentors, setMentors] = useState<MentorDebugInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllMentors();
  }, []);

  const fetchAllMentors = async () => {
    try {
      setLoading(true);
      
      // Get missions first
      const missionsResponse = await fetch('/api/v2/missions');
      if (!missionsResponse.ok) {
        throw new Error('Failed to fetch missions');
      }
      
      const missionsData = await missionsResponse.json();
      if (!missionsData.success || !missionsData.data?.length) {
        setError('No missions found');
        return;
      }

      const mission = missionsData.data[0]; // Get first mission

      // Get mentors for this mission
      const mentorsResponse = await fetch(`/api/v2/mission-mentors?missionId=${mission._id}`);
      if (!mentorsResponse.ok) {
        throw new Error('Failed to fetch mentors');
      }

      const mentorsData = await mentorsResponse.json();
      if (mentorsData.success && mentorsData.data) {
        const debugMentors = mentorsData.data.map((mentor: any) => ({
          _id: mentor._id,
          mentorName: mentor.mentorId?.name || 'Unknown',
          mentorEmail: mentor.mentorId?.email || 'Unknown',
          missionCode: mentor.missionId?.code || 'Unknown',
          status: mentor.status,
          role: mentor.role
        }));
        setMentors(debugMentors);
      } else {
        setError('No mentors found in V2 system');
      }
    } catch (error) {
      console.error('Debug fetch error:', error);
      setError('Failed to fetch mentor data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateUrls = (mentorId: string) => ({
    view: `http://localhost:3000/mission-hub/mentors/mission-mentors/${mentorId}`,
    edit: `http://localhost:3000/mission-hub/mentors/mission-mentors/${mentorId}/edit`
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor debug info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">🐛 Mentor Debug Tool</h1>
            <p className="text-gray-600 mt-1">
              Real V2 mentor IDs and working URLs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Problem Explanation */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">🚨 The Problem</h2>
          <div className="space-y-2 text-sm text-yellow-800">
            <p><strong>❌ You're using invalid ID:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">68b5c55127ca808ba3ad26ea</code></p>
            <p><strong>✅ V2 system created new IDs:</strong> See real IDs below</p>
            <p><strong>🔧 Solution:</strong> Use the correct URLs generated below</p>
          </div>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No V2 Mentors Found</h3>
            <p className="text-gray-600 mb-6">The V2 system doesn't have any mentors yet.</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">To fix this:</p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to <code className="bg-gray-100 px-2 py-1 rounded">/seed-demo-data</code></li>
                <li>Clear database</li>
                <li>Seed demo data (this will create V2 mentors)</li>
                <li>Come back to this page</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">✅ Real V2 Mentor IDs</h2>
              <p className="text-sm text-gray-600 mt-1">
                {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found in V2 system
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Real ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working URLs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mentors.map((mentor) => {
                    const urls = generateUrls(mentor._id);
                    return (
                      <tr key={mentor._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{mentor.mentorName}</div>
                            <div className="text-sm text-gray-500">{mentor.mentorEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                              {mentor._id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(mentor._id, mentor._id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy ID"
                            >
                              {copiedId === mentor._id ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {mentor.missionCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <a
                                href={urls.view}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                              >
                                👁️ View Page
                              </a>
                              <button
                                onClick={() => copyToClipboard(urls.view, `view-${mentor._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Copy URL"
                              >
                                {copiedId === `view-${mentor._id}` ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href={urls.edit}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                              >
                                ✏️ Edit Page
                              </a>
                              <button
                                onClick={() => copyToClipboard(urls.edit, `edit-${mentor._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Copy URL"
                              >
                                {copiedId === `edit-${mentor._id}` ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 How to Fix Your Issue</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>🚫 <strong>Stop using</strong> <code className="bg-blue-100 px-2 py-1 rounded">68b5c55127ca808ba3ad26ea</code></li>
            <li>✅ <strong>Click any "View Page" or "Edit Page" button above</strong></li>
            <li>📋 <strong>Or copy the working URLs</strong> using the copy buttons</li>
            <li>🔖 <strong>Bookmark the correct URLs</strong> for future use</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
