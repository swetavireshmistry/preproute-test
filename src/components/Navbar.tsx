import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-150 sticky top-0 z-50 shadow-sm shadow-slate-100/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <svg className="h-8 w-auto" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 12C38 3 45 4 58 13"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M58 13L53 8M58 13L56 7"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x="5"
                  y="34"
                  fill="#1e3a8a"
                  fontSize="30"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  P
                </text>
                <text
                  x="25"
                  y="34"
                  fill="#3b82f6"
                  fontSize="28"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  rep
                </text>
                <text
                  x="68"
                  y="34"
                  fill="#3b82f6"
                  fontSize="28"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  Route
                </text>
              </svg>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="bg-blue-100 p-1 rounded-full text-blue-600">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                  <p className="text-xs font-bold text-slate-700">{user.userId}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-red-600 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
