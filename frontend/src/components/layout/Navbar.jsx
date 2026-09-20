import { Link, useLocation } from 'react-router-dom';
import { useUserLevel, USER_LEVELS } from '../../context/UserLevelContext.jsx';
import { Sparkles, Compass, Box, SlidersHorizontal, GraduationCap, Binary } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const { userLevel, setShowLevelModal } = useUserLevel();

  const isAdvanced = userLevel === USER_LEVELS.ADVANCED;

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
            <span>ML</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                MathLens
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Conference v1.0
              </span>
            </div>
            <span className="hidden md:block text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              Visual Linear Algebra for Digital Images
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>

          <Link
            to="/learn/pixels-to-matrices"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname.startsWith('/learn')
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum</span>
          </Link>

          <Link
            to="/sandbox"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/sandbox'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Sandbox</span>
          </Link>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          {/* User Level Switcher */}
          <button
            onClick={() => setShowLevelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer"
            title="Click to switch between Basic and Advanced learning tracks"
          >
            {isAdvanced ? (
              <Binary className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="text-gray-500 dark:text-gray-400">Track:</span>
            <span className={`font-bold capitalize ${isAdvanced ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {userLevel || 'Select'}
            </span>
            <SlidersHorizontal className="w-3 h-3 text-gray-400 ml-0.5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
