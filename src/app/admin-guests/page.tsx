'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import {
  Eye, EyeOff, Download, Users, UserCheck, Clock,
  QrCode, Search, ChevronDown, ChevronUp, ExternalLink,
  Heart, Copy, Check, Wine, AlertCircle
} from 'lucide-react';

interface Party {
  id: string;
  code: string;
  name: string;
  type: string | null;
  from_side: string | null;
  status: string;
  google_user_id: string | null;
  google_email: string | null;
  created_at: string;
  // Derived
  guests: Guest[];
  logistics?: Logistics;
}

interface Guest {
  id: string;
  party_id: string;
  first_name: string | null;
  internal_name: string | null;
  age_group: string | null;
  food_preference: string | null;
  dietary_requirements: string | null;
  drinks_alcohol: boolean | null;
  rsvp_status: string | null;
}

interface Logistics {
  party_id: string;
  has_own_transport: boolean | null;
  pickup_type: string | null;
  pickup_location: string | null;
  pickup_time: string | null;
  flight_number: string | null;
  accommodation_name: string | null;
  notes: string | null;
}

interface ErrorLog {
  id: string;
  created_at: string;
  party_code: string | null;
  error_message: string | null;
  error_step: string | null;
  user_agent: string | null;
  guest_count: number | null;
}

const GuestAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedSession = localStorage.getItem('wedding-admin-session');
    if (savedSession) {
      const { timestamp, authenticated } = JSON.parse(savedSession);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (authenticated && Date.now() - timestamp < twentyFourHours) {
        return true;
      }
    }
    return false;
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedParty, setExpandedParty] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const correctPassword = 'ChanikaDavid2026!';
  const baseUrl = window.location.origin;

  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('wedding-admin-session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }));
      fetchData();
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch parties
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('*')
        .order('name');

      if (partiesError) throw partiesError;

      // Fetch guests
      const { data: guestsData, error: guestsError } = await supabase
        .from('guests')
        .select('*');

      if (guestsError) throw guestsError;

      // Fetch logistics
      const { data: logisticsData, error: logisticsError } = await supabase
        .from('logistics')
        .select('*');

      if (logisticsError) throw logisticsError;

      // Fetch error logs (last 50)
      const { data: errorLogsData, error: errorLogsError } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!errorLogsError && errorLogsData) {
        setErrorLogs(errorLogsData);
      }

      // Assemble data
      const assembledParties: Party[] = partiesData.map(p => {
        const pGuests = guestsData.filter(g => g.party_id === p.id);
        const pLogistics = logisticsData.find(l => l.party_id === p.id);
        
        return {
          ...p,
          code: p.code || 'NO_CODE', // Should not happen
          status: p.status || 'pending',
          guests: pGuests,
          logistics: pLogistics
        };
      });

      setParties(assembledParties);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/guest/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyMessage = (party: Party) => {
    const firstName = party.guests[0]?.first_name || party.guests[0]?.internal_name || party.name;
    const message = `Hi ${firstName},

Our wedding is coming up! Please help us finalize guest details by opening this link in a browser (not LINE browser) and signing in with Google: ${baseUrl}/guest/${party.code}

Thanks!
C&D`;

    navigator.clipboard.writeText(message);
    setCopiedMessage(party.code);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const downloadAllQRCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Guest QR Codes - Chanika & David Wedding</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
          .card { border: 1px solid #ccc; padding: 15px; text-align: center; page-break-inside: avoid; }
          .name { font-weight: bold; margin-bottom: 10px; }
          .code { font-family: monospace; color: #666; font-size: 12px; }
          .qr { margin: 10px 0; }
          @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
        </style>
      </head>
      <body>
        <h1 style="text-align: center;">Guest QR Codes</h1>
        <p style="text-align: center;">Chanika & David Wedding • January 31, 2026</p>
        <div class="grid">
          ${parties.map(p => `
            <div class="card">
              <div class="name">${p.name}</div>
              <div class="qr">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/guest/${p.code}`)}" />
              </div>
              <div class="code">${p.code}</div>
              <div style="font-size: 10px; color: #999;">Party of ${p.guests.length}</div>
            </div>
          `).join('')}
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportGuestCSV = () => {
    const headers = ['Code', 'Party Name', 'Party Size', 'Status', 'Guest Names', 'Food Preferences', 'Drinks Alcohol', 'Logistics: Transport', 'Logistics: Accommodation'];
    const rows = parties.map(p => {
      const guestNames = p.guests.map(g => g.first_name || g.internal_name).join(', ');
      const foodPrefs = p.guests.map(g => `${g.first_name || g.internal_name}: ${g.food_preference || 'None'}`).join('; ');
      const alcohol = p.guests.map(g => `${g.first_name || g.internal_name}: ${g.drinks_alcohol ? 'Yes' : 'No'}`).join('; ');
      const transport = p.logistics?.has_own_transport ? 'Own' : 'Need';
      const accomm = p.logistics?.accommodation_name || '';

      return [
        p.code,
        `"${p.name}"`, // Corrected: escaped double quotes within template literal
        p.guests.length,
        p.status,
        `"${guestNames}"`, // Corrected: escaped double quotes within template literal
        `"${foodPrefs}"`, // Corrected: escaped double quotes within template literal
        `"${alcohol}"`, // Corrected: escaped double quotes within template literal
        transport,
        `"${accomm}"` // Corrected: escaped double quotes within template literal
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-parties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const partyTypes = ['all', ...new Set(parties.map(p => p.type).filter(Boolean))];

  const completedParties = parties.filter(p => p.status === 'completed');
  const pendingParties = parties.filter(p => p.status === 'pending');

  const stats = {
    total: parties.length,
    completed: completedParties.length,
    pending: pendingParties.length,
    linked: parties.filter(p => p.google_user_id).length,
    totalGuests: parties.reduce((sum, p) => sum + p.guests.length, 0),
    // Age group breakdown for completed parties
    completedAdults: completedParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Adult' && g.rsvp_status === 'Attending').length, 0),
    completedChildren: completedParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Child' && g.rsvp_status === 'Attending').length, 0),
    completedToddlers: completedParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Toddler' && g.rsvp_status === 'Attending').length, 0),
    // Age group breakdown for pending parties
    pendingAdults: pendingParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Adult' && g.rsvp_status === 'Attending').length, 0),
    pendingChildren: pendingParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Child' && g.rsvp_status === 'Attending').length, 0),
    pendingToddlers: pendingParties.reduce((sum, p) =>
      sum + p.guests.filter(g => g.age_group === 'Toddler' && g.rsvp_status === 'Attending').length, 0)
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/20 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-blue to-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-dancing text-4xl text-ocean-blue mb-2">Guest Management</h1>
            <p className="text-deep-blue/70">Enter password to access</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-12 border-2 border-sky-blue/30 rounded-xl focus:outline-none focus:ring-0 focus:border-ocean-blue bg-white text-deep-blue"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sky-blue hover:text-ocean-blue"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white py-3 rounded-xl">
              Access Guest Management
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-dancing text-4xl text-ocean-blue mb-1">Guest Management</h1>
              <p className="text-deep-blue/70">Manage guest invitations</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={fetchData} disabled={loading} variant="outline" className="bg-white border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-white">
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button onClick={downloadAllQRCodes} className="bg-pacific-cyan hover:bg-ocean-blue text-white">
                <QrCode className="w-4 h-4 mr-2" />
                Print QR Codes
              </Button>
              <Button onClick={exportGuestCSV} className="bg-gradient-to-r from-sky-blue to-ocean-blue text-white">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Users className="w-8 h-8 text-ocean-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-deep-blue">{stats.total}</div>
            <div className="text-sm text-deep-blue/60">Parties</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Heart className="w-8 h-8 text-pacific-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold text-pacific-cyan">{stats.totalGuests}</div>
            <div className="text-sm text-deep-blue/60">Total Guests</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-deep-blue/60 mb-2">Completed</div>
            <div className="text-xs text-deep-blue/50 space-y-0.5">
              <div>Adults: {stats.completedAdults}</div>
              <div>Children: {stats.completedChildren}</div>
              <div>Toddlers: {stats.completedToddlers}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-sm text-deep-blue/60 mb-2">Pending</div>
            <div className="text-xs text-deep-blue/50 space-y-0.5">
              <div>Adults: {stats.pendingAdults}</div>
              <div>Children: {stats.pendingChildren}</div>
              <div>Toddlers: {stats.pendingToddlers}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center text-blue-500">
              G
            </div>
            <div className="text-2xl font-bold text-deep-blue">{stats.linked}</div>
            <div className="text-sm text-deep-blue/60">Google Linked</div>
          </div>
        </div>

        {/* Error Logs */}
        {errorLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-deep-blue flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Recent Errors ({errorLogs.length})
              </h2>
              <Button
                onClick={() => setShowErrors(!showErrors)}
                variant="outline"
                className="bg-white border-red-300 text-red-600 hover:bg-red-50"
              >
                {showErrors ? 'Hide' : 'Show'} Errors
              </Button>
            </div>
            {showErrors && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errorLogs.map(log => (
                  <div key={log.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-red-900">{log.error_message}</div>
                        <div className="text-xs text-red-700 mt-1 space-x-3">
                          {log.party_code && <span>Party: {log.party_code}</span>}
                          {log.guest_count !== null && <span>Guests: {log.guest_count}</span>}
                          {log.error_step && <span>Step: {log.error_step}</span>}
                        </div>
                        {log.user_agent && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {log.user_agent}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-red-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-sky-blue"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm font-medium text-deep-blue">Status:</span>
                {(['all', 'pending', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      backgroundColor: filterStatus === status ? 'rgb(0, 119, 182)' : 'white',
                      color: filterStatus === status ? 'white' : 'rgb(0, 119, 182)',
                      border: '1px solid rgb(125, 211, 252)',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <label htmlFor="type-filter" className="text-sm font-medium text-deep-blue">Type:</label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-8 rounded-md border border-sky-blue bg-white px-3 text-sm text-deep-blue focus:outline-none focus:ring-2 focus:ring-ocean-blue"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {partyTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center p-8">Loading...</div>
          ) : filteredParties.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No parties found.</div>
          ) : (
            filteredParties.map(party => (
              <div key={party.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedParty(expandedParty === party.id ? null : party.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QRCodeSVG value={`${baseUrl}/guest/${party.code}`} size={40} />
                      </div>
                      <div>
                        <div className="font-semibold text-deep-blue">{party.name}</div>
                        <div className="text-sm text-deep-blue/60 flex items-center gap-2 flex-wrap">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{party.code}</span>
                          <span>•</span>
                          <span>{party.guests.length} Guest{party.guests.length !== 1 ? 's' : ''}</span>
                          {party.type && (
                            <>
                              <span>•</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{party.type}</span>
                            </>
                          )}
                          {party.from_side && (
                            <>
                              <span>•</span>
                              <span className="text-xs">{party.from_side === 'David' ? '🤵 Groom' : '👰 Bride'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${party.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {party.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                      {expandedParty === party.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {expandedParty === party.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-lg inline-block mb-3">
                          <QRCodeSVG value={`${baseUrl}/guest/${party.code}`} size={120} />
                        </div>
                        {party.google_email && (
                          <div className="mb-3 text-xs text-deep-blue/60 bg-white px-3 py-2 rounded-lg">
                            <div className="font-medium text-deep-blue/80 mb-1">Google Account:</div>
                            <div className="break-all">{party.google_email}</div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(party.code)} className="w-full bg-white border-sky-blue text-sky-blue">
                            {copiedCode === party.code ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => copyMessage(party)} className="w-full bg-white border-ocean-blue text-ocean-blue">
                            {copiedMessage === party.code ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Message</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(`/guest/${party.code}`, '_blank')} className="w-full bg-white border-sky-blue text-sky-blue">
                            <ExternalLink className="w-4 h-4 mr-2" /> Open Form
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-deep-blue mb-3">Guests</h4>
                        {party.guests.length > 0 ? (
                          <div className="space-y-2">
                            {party.guests.map(guest => {
                              const isNotAttending = guest.rsvp_status === 'Not Attending';
                              return (
                                <div key={guest.id} className={`p-3 rounded-lg ${isNotAttending ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-deep-blue">{guest.first_name || guest.internal_name}</div>
                                    {isNotAttending && (
                                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">Not Attending</span>
                                    )}
                                  </div>
                                  {!isNotAttending && (
                                    <div className="text-sm text-deep-blue/60 flex flex-wrap gap-2 mt-1">
                                      <span className="bg-gray-100 px-2 py-0.5 rounded">{guest.age_group}</span>
                                      {guest.age_group === 'Adult' && <span className="bg-gray-100 px-2 py-0.5 rounded">{guest.food_preference || 'No Pref'}</span>}
                                      {guest.age_group === 'Adult' && guest.drinks_alcohol !== null && (
                                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${guest.drinks_alcohol ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                          <Wine className="w-3 h-3" />
                                          {guest.drinks_alcohol ? 'Alcohol' : 'No Alcohol'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {!isNotAttending && guest.dietary_requirements && (
                                    <div className="text-xs text-deep-blue/50 mt-1">Note: {guest.dietary_requirements}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="text-sm text-gray-500">No guests.</p>}
                      </div>

                      <div>
                        <h4 className="font-semibold text-deep-blue mb-3">Logistics</h4>
                        {party.logistics ? (
                          <div className="bg-white p-3 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-deep-blue/60">Transport:</span>
                              <span className={party.logistics.has_own_transport ? 'text-green-600' : 'text-amber-600'}>{party.logistics.has_own_transport ? 'Own' : 'Needs Help'}</span>
                            </div>
                            {party.logistics.pickup_type && (
                              <div className="flex justify-between">
                                <span className="text-deep-blue/60">Arriving by:</span>
                                <span className="capitalize">{party.logistics.pickup_type === 'airport' ? 'Flight to Phuket' : party.logistics.pickup_type === 'hotel' ? 'Already in Phuket' : 'Other'}</span>
                              </div>
                            )}
                            {party.logistics.flight_number && (
                              <div className="flex justify-between">
                                <span className="text-deep-blue/60">Flight:</span>
                                <span>{party.logistics.flight_number}</span>
                              </div>
                            )}
                            {party.logistics.pickup_time && (
                              <div className="flex justify-between">
                                <span className="text-deep-blue/60">Arrival Time:</span>
                                <span>{party.logistics.pickup_time}</span>
                              </div>
                            )}
                            {party.logistics.accommodation_name && (
                              <div className="flex justify-between">
                                <span className="text-deep-blue/60">Hotel:</span>
                                <span>{party.logistics.accommodation_name}</span>
                              </div>
                            )}
                            {party.logistics.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-deep-blue/60">
                                <strong>Notes:</strong> {party.logistics.notes}
                              </div>
                            )}
                          </div>
                        ) : <p className="text-sm text-gray-500">No logistics info.</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestAdmin;
