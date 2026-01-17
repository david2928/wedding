'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Download, Users, UserCheck, UserX, Calendar, Mail, Phone, Heart, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface RSVPSubmission {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  phone: string | null;
  guests: number | null;
  attendance: string;
  dietary: string | null;
  love_song: string | null;
  first_thought: string | null;
  message: string | null;
  accommodation: boolean | null;
  transportation: boolean | null;
  line: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

const AdminReport = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check localStorage for existing session (valid for 24 hours)
    const savedSession = localStorage.getItem('wedding-admin-session');
    if (savedSession) {
      const { timestamp, authenticated } = JSON.parse(savedSession);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (authenticated && Date.now() - timestamp < twentyFourHours) {
        setIsAuthenticated(true);
      }
    }
  }, []);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submissions, setSubmissions] = useState<RSVPSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<RSVPSubmission[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
    accommodationNeeded: 0,
    transportationNeeded: 0
  });

  const correctPassword = 'ChanikaDavid2026!';

  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      // Save session to localStorage
      localStorage.setItem('wedding-admin-session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }));
      fetchSubmissions();
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  // Auto-fetch data if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      console.log('Fetching RSVP submissions...');
      const { data, error } = await supabase
        .from('rsvp_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const submissions = data || [];
      setSubmissions(submissions);
      // Apply initial sort (newest first by default)
      applyFilterAndSort('all', sortOrder);
      
      // Calculate stats
      const attending = submissions.filter(s => s.attendance === 'yes').length;
      const notAttending = submissions.filter(s => s.attendance === 'no').length;
      const totalGuests = submissions.reduce((sum, s) => sum + (s.attendance === 'yes' ? (s.guests || 0) : 0), 0);
      const accommodationNeeded = submissions.filter(s => s.accommodation).length;
      const transportationNeeded = submissions.filter(s => s.transportation).length;

      setStats({
        total: submissions.length,
        attending,
        notAttending,
        totalGuests,
        accommodationNeeded,
        transportationNeeded
      });

      console.log('Stats calculated:', {
        total: submissions.length,
        attending,
        notAttending,
        totalGuests,
        accommodationNeeded,
        transportationNeeded
      });
      
    } catch (error) {
      console.error('Error fetching submissions:', error);
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const applyFilterAndSort = (filterType?: string, newSortOrder?: 'newest' | 'oldest') => {
    const currentFilter = filterType ?? activeFilter;
    const currentSort = newSortOrder ?? sortOrder;
    
    let filtered = [...submissions];

    // Apply filter
    switch (currentFilter) {
      case 'attending':
        filtered = submissions.filter(s => s.attendance === 'yes');
        break;
      case 'not-attending':
        filtered = submissions.filter(s => s.attendance === 'no');
        break;
      case 'accommodation':
        filtered = submissions.filter(s => s.accommodation);
        break;
      case 'transportation':
        filtered = submissions.filter(s => s.transportation);
        break;
      case 'all':
      default:
        filtered = submissions;
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredSubmissions(filtered);
  };

  const handleFilter = (filterType: string) => {
    setActiveFilter(filterType);
    applyFilterAndSort(filterType);
  };

  const toggleSort = () => {
    const newSortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    setSortOrder(newSortOrder);
    applyFilterAndSort(undefined, newSortOrder);
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Nickname', 'Email', 'Phone', 'Guests', 'Attendance', 
      'Dietary', 'Love Song', 'First Thought', 'Message', 
      'Accommodation', 'Transportation', 'Line', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...submissions.map(row => [
        `"${row.name || ''}"`,
        `"${row.nickname || ''}"`,
        `"${row.email || ''}"`,
        `"${row.phone || ''}"`,
        row.guests,
        `"${row.attendance}"`,
        `"${row.dietary || ''}"`,
        `"${row.love_song || ''}"`,
        `"${row.first_thought || ''}"`,
        `"${(row.message || '').replace(/"/g, '""')}"`,
        row.accommodation,
        row.transportation,
        `"${row.line || ''}"`,
        `"${row.created_at}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `rsvp-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/20 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-blue to-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-dancing text-3xl sm:text-4xl text-ocean-blue mb-2">Wedding Admin</h1>
            <p className="text-deep-blue/70 text-sm sm:text-base">Enter password to access reports</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-12 border-2 border-sky-blue/30 rounded-xl focus:outline-none focus:ring-0 focus:border-ocean-blue bg-white text-deep-blue placeholder-deep-blue/50 transition-colors duration-200 [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_white] [&:-webkit-autofill:hover]:!bg-white [&:-webkit-autofill:focus]:!bg-white [&:-webkit-autofill:active]:!bg-white"
                style={{ 
                  backgroundColor: 'white !important', 
                  WebkitBoxShadow: '0 0 0 1000px white inset !important',
                  boxShadow: '0 0 0 1000px white inset !important'
                }}
                autoComplete="current-password"
                name="password"
                id="admin-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sky-blue hover:text-ocean-blue transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Access Reports
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-deep-blue/50">
              Session will remain active for 24 hours
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/20 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <h1 className="font-dancing text-2xl sm:text-4xl lg:text-5xl text-ocean-blue mb-1 sm:mb-2">Wedding RSVP Report</h1>
              <p className="text-xs sm:text-base text-deep-blue/70">Chanika & David's Wedding • February 1, 2026</p>
            </div>
            
            {/* Filter Status */}
            {activeFilter !== 'all' && (
              <div className="flex items-center justify-center sm:justify-start">
                <div className="bg-pacific-cyan/10 border border-pacific-cyan/20 rounded-full px-3 py-1 flex items-center">
                  <span className="text-xs font-medium text-pacific-cyan mr-2">
                    Filtered: {activeFilter === 'not-attending' ? 'Not Attending' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                  </span>
                  <button 
                    onClick={() => handleFilter('all')}
                    className="text-pacific-cyan hover:text-ocean-blue"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                onClick={() => fetchSubmissions()} 
                disabled={loading} 
                className="bg-white border-2 border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-white focus:ring-0 text-xs sm:text-base px-3 py-2 sm:px-4"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              
              <Button 
                onClick={toggleSort}
                className="bg-white border-2 border-pacific-cyan text-pacific-cyan hover:bg-pacific-cyan hover:text-white focus:ring-0 text-xs sm:text-base px-3 py-2 sm:px-4 flex items-center"
              >
                {sortOrder === 'newest' ? (
                  <>
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Newest First
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Oldest First
                  </>
                )}
              </Button>
              
              <Button onClick={exportToCSV} className="bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white focus:ring-0 text-xs sm:text-base px-3 py-2 sm:px-4">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={() => handleFilter('all')}
            className={`bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${
              activeFilter === 'all' ? 'ring-2 ring-ocean-blue shadow-lg' : ''
            }`}
          >
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-ocean-blue mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-deep-blue">{stats.total}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Total RSVPs</div>
          </button>
          
          <button 
            onClick={() => handleFilter('attending')}
            className={`bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${
              activeFilter === 'attending' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
          >
            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.attending}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Attending</div>
          </button>
          
          <button 
            onClick={() => handleFilter('not-attending')}
            className={`bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${
              activeFilter === 'not-attending' ? 'ring-2 ring-red-500 shadow-lg' : ''
            }`}
          >
            <UserX className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-red-500">{stats.notAttending}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Not Attending</div>
          </button>
          
          <button 
            onClick={() => handleFilter('all')}
            className="bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default"
          >
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pacific-cyan mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-pacific-cyan">{stats.totalGuests}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Total Guests</div>
          </button>
          
          <button 
            onClick={() => handleFilter('accommodation')}
            className={`bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${
              activeFilter === 'accommodation' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 text-sm sm:text-base">
              🏨
            </div>
            <div className="text-lg sm:text-2xl font-bold text-deep-blue">{stats.accommodationNeeded}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Need Hotel</div>
          </button>
          
          <button 
            onClick={() => handleFilter('transportation')}
            className={`bg-white rounded-xl shadow-md p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${
              activeFilter === 'transportation' ? 'ring-2 ring-purple-500 shadow-lg' : ''
            }`}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 text-sm sm:text-base">
              🚗
            </div>
            <div className="text-lg sm:text-2xl font-bold text-deep-blue">{stats.transportationNeeded}</div>
            <div className="text-xs sm:text-sm text-deep-blue/60">Need Transport</div>
          </button>
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-ocean-blue/20 rounded-full mx-auto mb-4"></div>
                <div className="text-ocean-blue font-poppins text-lg">Loading RSVP data...</div>
              </div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-deep-blue/60 font-poppins text-lg mb-4">No RSVP submissions found</div>
              <Button 
                onClick={() => fetchSubmissions()} 
                className="bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-sky-blue to-ocean-blue text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Guest</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Guests</th>
                        <th className="px-4 py-3 text-left">Special Requests</th>
                        <th className="px-4 py-3 text-left">Message</th>
                        <th className="px-4 py-3 text-center">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission, index) => (
                        <tr key={submission.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-semibold text-deep-blue">{submission.name}</div>
                            {submission.nickname && (
                              <div className="text-sm text-deep-blue/60">"{submission.nickname}"</div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 text-sky-blue mr-1" />
                              <span className="text-xs">{submission.email}</span>
                            </div>
                            {submission.phone && (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 text-sky-blue mr-1" />
                                <span className="text-xs">{submission.phone}</span>
                              </div>
                            )}
                            {submission.line && (
                              <div className="text-xs text-green-600">LINE: {submission.line}</div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.attendance === 'yes' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {submission.attendance === 'yes' ? '✓ Attending' : '✗ Not Attending'}
                          </span>
                          <div className="flex justify-center mt-1 space-x-1 text-xs">
                            {submission.accommodation && <span className="bg-blue-100 text-blue-800 px-1 rounded">🏨</span>}
                            {submission.transportation && <span className="bg-purple-100 text-purple-800 px-1 rounded">🚗</span>}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-bold text-pacific-cyan">{submission.guests}</span>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="text-xs space-y-1 max-w-xs">
                            {submission.dietary && (
                              <div><strong>Dietary:</strong> {submission.dietary}</div>
                            )}
                            {submission.love_song && (
                              <div><strong>Song:</strong> {submission.love_song}</div>
                            )}
                            {submission.first_thought && (
                              <div><strong>First thought:</strong> {submission.first_thought}</div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          {submission.message && (
                            <div className="text-xs max-w-xs">
                              <MessageSquare className="w-3 h-3 text-sky-blue inline mr-1" />
                              {submission.message}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs text-deep-blue/60">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'N/A'}
                            <br />
                            {submission.created_at ? new Date(submission.created_at).toLocaleTimeString() : ''}
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredSubmissions.map((submission, index) => (
                  <div 
                    key={submission.id} 
                    className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-deep-blue text-lg">{submission.name}</h3>
                        {submission.nickname && (
                          <p className="text-deep-blue/60 text-sm">"{submission.nickname}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          submission.attendance === 'yes' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {submission.attendance === 'yes' ? '✓ Yes' : '✗ No'}
                        </span>
                        <div className="text-lg font-bold text-pacific-cyan">{submission.guests ?? 0} guest{(submission.guests ?? 0) > 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-sky-blue mr-2 flex-shrink-0" />
                        <span className="text-deep-blue/80 break-all">{submission.email}</span>
                      </div>
                      {submission.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-sky-blue mr-2 flex-shrink-0" />
                          <span className="text-deep-blue/80">{submission.phone}</span>
                        </div>
                      )}
                      {submission.line && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-2 flex items-center justify-center text-white text-xs font-bold">L</div>
                          <span className="text-green-600 text-sm">{submission.line}</span>
                        </div>
                      )}
                    </div>

                    {/* Special Needs */}
                    {(submission.accommodation || submission.transportation) && (
                      <div className="flex space-x-2 mb-3">
                        {submission.accommodation && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                            🏨 Hotel needed
                          </span>
                        )}
                        {submission.transportation && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                            🚗 Transport needed
                          </span>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    {(submission.dietary || submission.love_song || submission.first_thought) && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2 text-sm">
                        {submission.dietary && (
                          <div>
                            <span className="font-medium text-deep-blue">Dietary:</span> 
                            <span className="text-deep-blue/70 ml-1">{submission.dietary}</span>
                          </div>
                        )}
                        {submission.love_song && (
                          <div>
                            <span className="font-medium text-deep-blue">Song request:</span> 
                            <span className="text-deep-blue/70 ml-1">{submission.love_song}</span>
                          </div>
                        )}
                        {submission.first_thought && (
                          <div>
                            <span className="font-medium text-deep-blue">First thought:</span> 
                            <span className="text-deep-blue/70 ml-1">{submission.first_thought}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message */}
                    {submission.message && (
                      <div className="bg-pacific-cyan/5 border-l-4 border-pacific-cyan rounded p-3 mb-3">
                        <div className="flex items-start">
                          <MessageSquare className="w-4 h-4 text-pacific-cyan mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-deep-blue/80 italic">{submission.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center text-xs text-deep-blue/60">
                        <Calendar className="w-3 h-3 mr-1" />
                        {submission.created_at ? `${new Date(submission.created_at).toLocaleDateString()} at ${new Date(submission.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReport;