import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  TrendingUp,
  SquarePen,
  Bell,
  ChevronDown,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import prepRouteLogo from '../assets/images/preproute-logo.png';

const ClipboardSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    style={props.style}
  >
    {/* Clipboard base */}
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    {/* Search icon inside clipboard */}
    <circle cx="11.5" cy="13.5" r="3" />
    <path d="m13.7 15.7 3.3 3.3" />
  </svg>
);


interface MainLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
  headerActions?: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, breadcrumbs = [], headerActions, sidebarContent }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [secondarySidebarExpanded, setSecondarySidebarExpanded] = useState(true);

  const isCollapsed = location.pathname.includes('/questions') || location.pathname.includes('/preview');
  const LOGO_BAR_WIDTH = 272;

  const asideWidth = !isCollapsed
    ? LOGO_BAR_WIDTH
    : secondarySidebarExpanded && sidebarContent
      ? 240
      : sidebarContent
        ? 70
        : 46;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: TrendingUp,
      path: '/',
      active: location.pathname === '/',
    },
    {
      name: 'Test Creation',
      icon: SquarePen,
      path: '/tests/create',
      active: location.pathname.includes('/tests/'),
    },
    {
      name: 'Test Tracking',
      icon: ClipboardSearch,
      path: '#',
      active: false,
    },
  ];

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Sidebar Container */}
      <aside
        className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-visible border-r border-[#EEF2F7] bg-white shadow-sm transition-all duration-300"
        style={{ width: `${asideWidth}px` }}
      >
        {/* Logo — full size; absolute only when nav column is collapsed */}
        {isCollapsed ? (
          <div
            className="absolute left-0 top-0 z-40 flex h-16 items-center border-b border-[#EEF2F7] bg-white px-6"
            style={{ width: `${LOGO_BAR_WIDTH}px` }}
          >
            <Link to="/" className="flex shrink-0 items-center">
              <img
                src={prepRouteLogo}
                alt="PrepRoute Logo"
                className="h-9 w-auto shrink-0 object-contain"
              />
            </Link>
          </div>
        ) : (
          <div className="flex h-16 shrink-0 items-center border-b border-[#EEF2F7] px-6">
            <Link to="/" className="flex shrink-0 items-center">
              <img
                src={prepRouteLogo}
                alt="PrepRoute Logo"
                className="h-9 w-auto shrink-0 object-contain"
              />
            </Link>
          </div>
        )}

        {/* Content Wrapper */}
        <div
          className={`relative flex flex-1 ${isCollapsed ? 'mt-16' : ''} ${isCollapsed && !secondarySidebarExpanded && sidebarContent ? 'overflow-visible' : 'overflow-hidden'}`}
        >
          {/* Primary Sidebar */}
          <div
            className={`flex h-full shrink-0 flex-col ${isCollapsed ? 'w-[46px] border-r border-[#EEF2F7]' : 'w-full'}`}
          >
            {/* Navigation Items */}
            <nav className="flex-1 space-y-2 py-5">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.name} className={`relative ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <Link
                      to={item.path}
                      className={`relative flex items-center rounded-2xl transition-all duration-200 ${isCollapsed
                        ? "mx-1.5 h-10 w-10 justify-center"
                        : "mx-3 gap-3 px-5 py-3"
                        } ${item.active
                          ? "bg-[#F5F7FF] text-[#384EC7]"
                          : "text-[#6B7180] hover:bg-[#F8FAFC] hover:text-[#6B7180]"
                        }`}
                    >
                      {item.active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-[5px] rounded-l-full bg-[#384EC7]" />
                      )}

                      <Icon
                        className={`relative z-10 h-5 w-5 ${item.active
                          ? "text-[#384EC7]"
                          : "text-[#6B7180]"
                          }`}
                      />

                      {!isCollapsed && (
                        <span className="text-base font-medium leading-[150%] tracking-normal">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {isCollapsed && !secondarySidebarExpanded && sidebarContent && (
            <button
              type="button"
              onClick={() => setSecondarySidebarExpanded(true)}
              className="absolute left-[46px] top-[88px] z-30 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#9CA3AF] shadow-sm transition-colors hover:text-[#384EC7]"
              aria-label="Expand question sidebar"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Secondary Sidebar */}
          {isCollapsed &&
            secondarySidebarExpanded &&
            sidebarContent && (
              <div className="relative flex h-[865px] w-[194px] shrink-0 flex-col gap-[10px] self-start overflow-hidden border-r border-[#EEF2F7] bg-white pt-[30px] pr-[10px] pb-[10px] pl-[10px]">
                <div className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium leading-[150%] tracking-normal text-[#6B7180] select-none">
                      Question creation
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSecondarySidebarExpanded(false)}
                      className="shrink-0 text-[#9CA3AF] transition-colors hover:text-[#384EC7]"
                      aria-label="Collapse question sidebar"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                  </div>
                  {sidebarContent}
                </div>
              </div>
            )}
        </div>
      </aside>

      {/* Right Main Panel Container */}
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{ paddingLeft: `${asideWidth}px` }}
      >
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-end px-8 sticky top-0 z-20">
          {/* Right Header Menu controls */}
          <div className="flex items-center gap-5">
            {/* Notifications icon */}
            <button className="relative w-10 h-10 flex items-center justify-center text-slate-500 border border-slate-200 bg-white rounded-full hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Avatar & dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-200">
                  {user?.name?.charAt(0).toUpperCase() || user?.userId?.charAt(0).toUpperCase() || 'V'}
                </div>
                {/* Details */}
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-700 leading-tight">
                    {user?.name || user?.userId || 'Alex Wando'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-150 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 z-20">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <div className="flex-1 bg-white p-8">
          {/* Breadcrumbs below top navbar */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center justify-between mb-6 select-none">
              <div className="flex items-center gap-2 font-sans text-base font-medium leading-[150%] tracking-normal text-[#00000099]">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  const isSingleCrumb = breadcrumbs.length === 1;
                  // Map crumb name to link path if not the last item
                  let linkPath: string | null = null;
                  if (!isLast) {
                    const lower = crumb.toLowerCase().trim();
                    if (lower === 'dashboard') linkPath = '/';
                    else if (lower === 'test creation') linkPath = '/tests/create';
                    else if (lower === 'create test') linkPath = '/tests/create';
                  }

                  return (
                    <React.Fragment key={crumb}>
                      {idx > 0 && <span>/</span>}
                      {linkPath ? (
                        <Link to={linkPath} className="cursor-pointer transition-colors hover:text-[#384EC7]">
                          {crumb}
                        </Link>
                      ) : (
                        <span className={isLast && !isSingleCrumb ? 'text-[#384EC7]' : ''}>
                          {crumb}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {headerActions}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
export default MainLayout;
