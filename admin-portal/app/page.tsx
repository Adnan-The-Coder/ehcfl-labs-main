"use client";
import React, { useState } from 'react';
import { LayoutDashboard, FileText, ClipboardList, Briefcase, Users, Gift, MapPin, PieChart, TrendingUp, Bell, Search, Menu, X, Edit, MoreVertical } from 'lucide-react';
import UsersTable from '../components/user';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'users'>('summary');

  return (
    <div className="flex h-screen bg-[#0f1729] text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1a2332] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <LayoutDashboard size={20} />
              </div>
              <span className="text-xl font-bold">DASHBOARD</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={24} />
            </button>
          </div>

          {/* Nav Section */}
          <div className="px-6 mb-6">
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Nav</div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded border-l-2 text-left transition-colors ${activeTab === 'summary' ? 'bg-blue-500/10 text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:bg-gray-800/30'}`}
              >
                <LayoutDashboard size={18} />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded border-l-2 text-left transition-colors ${activeTab === 'users' ? 'bg-blue-500/10 text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:bg-gray-800/30'}`}
              >
                <FileText size={18} />
                <span className="text-sm">Users</span>
              </button>
              <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <ClipboardList size={18} />
                <span className="text-sm">API Logs</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <Briefcase size={18} />
                <span className="text-sm">Worksheet</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <Users size={18} />
                <span className="text-sm">Accounts</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <Gift size={18} />
                <span className="text-sm">Offers</span>
              </a>
            </nav>
          </div>

          {/* Help Section */}
          <div className="px-6 mt-auto mb-6">
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Help</div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <div className="flex items-center space-x-3">
                  <MapPin size={18} />
                  <span className="text-sm">Locations</span>
                </div>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">10</span>
              </a>
              <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <div className="flex items-center space-x-3">
                  <PieChart size={18} />
                  <span className="text-sm">Claims</span>
                </div>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">5</span>
              </a>
              <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded text-gray-400 hover:bg-gray-800/30">
                <div className="flex items-center space-x-3">
                  <TrendingUp size={18} />
                  <span className="text-sm">Ratios</span>
                </div>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">15</span>
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#1a2332] px-4 lg:px-8 py-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold">SUMMARY</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-800 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">JS</span>
              </div>
              <span className="hidden md:block text-sm">James Smith</span>
            </div>
            <button className="p-2 hover:bg-gray-800 rounded">
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-full text-sm font-medium transition-colors">
                      Create New Offer
                    </button>
                    <button className="px-6 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-full text-sm font-medium transition-colors">
                      Create Re-Insurance
                    </button>
                    <button className="px-6 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-full text-sm font-medium transition-colors">
                      Ratio Allocation
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl font-bold">10</div>
                        <div className="p-2 bg-gray-800 rounded-lg">
                          <TrendingUp size={18} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">Offers to Review</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg shadow-blue-500/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl font-bold">03</div>
                        <div className="p-2 bg-white/20 rounded-lg">
                          <FileText size={18} />
                        </div>
                      </div>
                      <div className="text-sm">Offer At Loss</div>
                    </div>

                    <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl font-bold text-red-400">06</div>
                        <div className="p-2 bg-gray-800 rounded-lg">
                          <ClipboardList size={18} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">Pending Directs</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">ALERT CHART</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <TrendingUp size={16} />
                        <span>+5% than last week</span>
                      </div>
                    </div>
                    <div className="relative h-64">
                      <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 180 Q 100 160 200 140 T 400 80 T 600 120 T 800 100"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                        <path
                          d="M 0 180 Q 100 160 200 140 T 400 80 T 600 120 T 800 100 L 800 250 L 0 250 Z"
                          fill="url(#gradient)"
                        />
                        <circle cx="600" cy="80" r="6" fill="white" className="drop-shadow-lg" />
                        <rect x="590" y="50" width="70" height="25" rx="4" fill="#1a2332" />
                        <text x="625" y="68" fontSize="12" fill="white" textAnchor="middle">$1.3k - 192.00</text>
                      </svg>
                    </div>
                  </div>

                  {/* Combined Ratio & Ceded Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Combined Ratio */}
                    <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                      <h3 className="text-lg font-semibold mb-8">COMBINED RATIO</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32">
                              <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="8" fill="none" />
                              <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 56 * 0.64} ${2 * Math.PI * 56}`}
                                className="transition-all duration-1000" />
                              <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 56 * 0.36} ${2 * Math.PI * 56}`}
                                strokeDashoffset={`-${2 * Math.PI * 56 * 0.64}`}
                                className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-xs text-gray-400">Year</div>
                              <div className="text-2xl font-bold">1</div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-gray-400">64%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-gray-400">64%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32">
                              <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="8" fill="none" />
                              <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 56 * 0.52} ${2 * Math.PI * 56}`}
                                className="transition-all duration-1000" />
                              <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 56 * 0.48} ${2 * Math.PI * 56}`}
                                strokeDashoffset={`-${2 * Math.PI * 56 * 0.52}`}
                                className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-xs text-gray-400">Year</div>
                              <div className="text-2xl font-bold">2</div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-gray-400">48%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-gray-400">48%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ceded Distribution */}
                    <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                      <h3 className="text-lg font-semibold mb-8">CEDED DISTRIBUTION</h3>
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-40 h-40">
                          <svg className="transform -rotate-90 w-40 h-40">
                            <circle cx="80" cy="80" r="70" stroke="#1f2937" strokeWidth="12" fill="none" />
                            <circle cx="80" cy="80" r="70" stroke="#3b82f6" strokeWidth="12" fill="none"
                              strokeDasharray={`${2 * Math.PI * 70 * 0.8} ${2 * Math.PI * 70}`}
                              className="transition-all duration-1000" />
                            <circle cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="12" fill="none"
                              strokeDasharray={`${2 * Math.PI * 70 * 0.2} ${2 * Math.PI * 70}`}
                              strokeDashoffset={`-${2 * Math.PI * 70 * 0.8}`}
                              className="transition-all duration-1000" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-4xl font-bold">80%</div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-gray-400">80%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-400">20%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Deal Summary */}
                <div className="xl:col-span-1">
                  <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800 sticky top-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">DEAL NUMBER</div>
                        <div className="text-2xl font-bold">D189810</div>
                      </div>
                      <button className="p-2 hover:bg-gray-800 rounded">
                        <Edit size={18} className="text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Deal Name</div>
                        <div className="text-blue-400 font-medium">Dummy Deal</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Home State</div>
                          <div className="text-blue-400 font-medium">New Jersey</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Domicile</div>
                          <div className="text-blue-400 font-medium">United States</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Inception Date</div>
                          <div className="text-blue-400 font-medium">06-05-2017</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Expiry Date</div>
                          <div className="text-blue-400 font-medium">06-16-2017</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Deal Type</div>
                          <div className="text-blue-400 font-medium">Treaty</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Main LOB</div>
                          <div className="text-blue-400 font-medium">Property</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-800">
                        <div className="text-xs text-gray-400 mb-1">Insured Name</div>
                        <div className="text-blue-400 font-medium">ABC Corporation</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-1">Insured Address</div>
                        <div className="text-blue-400 font-medium">123, North Main St</div>
                      </div>

                      <div className="pt-3 border-t border-gray-800">
                        <div className="text-xs text-gray-400 mb-1">Broker Company</div>
                        <div className="text-blue-400 font-medium">AAA Risk Management</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-1">Broker Contact</div>
                        <div className="text-blue-400 font-medium">(408) 269 8221</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="grid grid-cols-1 gap-6">
                <UsersTable />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;