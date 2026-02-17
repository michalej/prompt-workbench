import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-navy-900/90 backdrop-blur-md border-b border-navy-700/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl">⚗️</span>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-purple-300 transition-all">
              Prompt Workbench
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/' 
                  ? 'bg-indigo-600/20 text-indigo-300' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
        {children}
      </main>
    </div>
  );
}
