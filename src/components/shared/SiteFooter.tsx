import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black text-lg font-bold">S</span>
              </div>
              <span className="text-xl font-bold">SMS Dashboard</span>
            </div>
            <p className="text-gray-400">
              Empowering educational institutions with comprehensive student management solutions.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/mission-hub" className="hover:text-white transition-colors">Mission Hub</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Student Management</li>
              <li>Mission System</li>
              <li>Course Management</li>
              <li>Analytics</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>API Reference</li>
              <li>Contact Support</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 SMS Dashboard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


