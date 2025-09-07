"use client";

import { useState } from 'react';
import { Database, Users, BookOpen, Target, Loader } from 'lucide-react';

export default function SeedDemoDataPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedData = async () => {
    if (!confirm('Are you sure you want to seed demo data? This will create multiple users, batches, courses, and missions.')) {
      return;
    }

    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed/demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error?.message || 'Failed to seed demo data');
      }
    } catch (err) {
      setError('An error occurred while seeding data');
      console.error('Seeding error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL demo data including users, batches, courses, and missions. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('Are you absolutely certain? This will remove all demo data from the database.')) {
      return;
    }

    setIsClearing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed/clear-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error?.message || 'Failed to clear database');
      }
    } catch (err) {
      setError('An error occurred while clearing database');
      console.error('Clear database error:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Database className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Data Seeding</h1>
            <p className="text-lg text-gray-600">
              Populate your database with comprehensive demo data for testing and development
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">What will be created:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">4 Mentors with different capacities</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">12 Students across 3 batches</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">3 Batches with 3 semesters each</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">6 Courses with course offerings</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">3 Missions with proper relationships</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">3 Additional role users (Manager, SRE, Developer)</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• This will only work if the database is mostly empty (only admin user exists)</li>
              <li>• All demo users will have the password: <code className="bg-yellow-100 px-1 rounded">mentor123</code> (mentors) or <code className="bg-yellow-100 px-1 rounded">student123</code> (students)</li>
              <li>• Students are automatically assigned to mentors based on batch</li>
              <li>• Missions are created with proper course relationships and student assignments</li>
              <li>• All data follows the proper model relationships and constraints</li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={handleSeedData}
              disabled={isSeeding || isClearing}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isSeeding ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Seeding Data...</span>
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  <span>Seed Demo Data</span>
                </>
              )}
            </button>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleClearDatabase}
                disabled={isSeeding || isClearing}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto text-sm"
              >
                {isClearing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Clearing Database...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️ Clear Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Demo Data Seeded Successfully!</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.data.batches}</div>
                  <div className="text-sm text-green-700">Batches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.data.mentors}</div>
                  <div className="text-sm text-green-700">Mentors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.data.students}</div>
                  <div className="text-sm text-green-700">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.data.missions}</div>
                  <div className="text-sm text-green-700">Missions</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-green-700">
                  Total users created: <span className="font-semibold">{result.data.totalUsers}</span>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  You can now log in with any of the demo accounts to test the system!
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Account Credentials:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Mentor Accounts:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>sarah.mentor@example.com</strong> / mentor123</div>
                  <div><strong>mike.mentor@example.com</strong> / mentor123</div>
                  <div><strong>emma.mentor@example.com</strong> / mentor123</div>
                  <div><strong>david.mentor@example.com</strong> / mentor123</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Student Accounts:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>alice.student@example.com</strong> / student123</div>
                  <div><strong>bob.student@example.com</strong> / student123</div>
                  <div><strong>carol.student@example.com</strong> / student123</div>
                  <div><strong>dan.student@example.com</strong> / student123</div>
                  <div className="text-gray-500">... and 8 more students</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
