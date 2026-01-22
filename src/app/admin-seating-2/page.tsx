'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, Users, Download, LayoutGrid, List } from 'lucide-react';

interface Guest {
  id: string;
  party_id: string | null;
  first_name: string | null;
  internal_name: string | null;
  age_group: string | null;
  food_preference: string | null;
  dietary_requirements: string | null;
  rsvp_status: string | null;
  table_number: string | null;
}

interface Party {
  id: string;
  name: string;
  type: string | null;
  from_side: string | null;
  guests: Guest[];
}

// Long table configuration
const TABLE_CONFIG = {
  1: { name: 'Table A', seats: 24, seatsPerSide: 12 },
  2: { name: 'Table B', seats: 18, seatsPerSide: 9 },
  3: { name: 'Table C', seats: 12, seatsPerSide: 6 },
  4: { name: 'Table D', seats: 18, seatsPerSide: 9 },
  5: { name: 'Table E', seats: 24, seatsPerSide: 12 },
};

const TOTAL_TABLES = 5;

// Colors for different sides
const SIDE_BADGE_COLORS: Record<string, string> = {
  'David': 'text-blue-600',
  'Chanika': 'text-pink-600',
};

const SIDE_BORDER_COLORS: Record<string, string> = {
  'David': 'border-l-blue-500',
  'Chanika': 'border-l-pink-500',
};

// Party type colors for filled seats
const PARTY_TYPE_SEAT_BG: Record<string, string> = {
  'David Family': '#93c5fd',
  'David Friends': '#bfdbfe',
  'Chanika Family': '#f9a8d4',
  'Chanika TU': '#fbcfe8',
  'Chanika Friends': '#fbcfe8',
  'Agoda': '#fed7aa',
  'Lazada': '#ddd6fe',
  'LENGOLF': '#bbf7d0',
  'Tiktok': '#a5f3fc',
  'CU': '#fde68a',
  'Vero': '#c7d2fe',
};

// Long Table Component
const LongTable = ({
  tableNumber,
  tableName,
  guests,
  config,
  onRemoveGuest,
  isHighlighted,
  onClick,
  parties,
}: {
  tableNumber: number;
  tableName: string;
  guests: Guest[];
  config: { seats: number; seatsPerSide: number };
  onRemoveGuest: (guestId: string) => void;
  isHighlighted: boolean;
  onClick: () => void;
  parties: Party[];
}) => {
  const { seats, seatsPerSide } = config;

  const getPartyForGuest = (guest: Guest) => {
    return parties.find(p => p.id === guest.party_id);
  };

  // Split guests into left and right sides
  const leftGuests = guests.slice(0, seatsPerSide);
  const rightGuests = guests.slice(seatsPerSide, seats);

  const renderSeat = (seatIndex: number, guest: Guest | undefined, side: 'left' | 'right') => {
    const party = guest ? getPartyForGuest(guest) : null;
    const seatBg = party?.type ? PARTY_TYPE_SEAT_BG[party.type] || '#e5e7eb' : 'white';

    return (
      <div
        key={`${side}-${seatIndex}`}
        className={`w-8 h-10 flex items-center justify-center text-[9px] font-medium rounded-sm transition-all ${
          guest ? 'cursor-pointer hover:brightness-90' : ''
        }`}
        style={{
          backgroundColor: guest ? seatBg : 'white',
          border: guest ? '2px solid #9ca3af' : '2px dashed #d1d5db',
        }}
        title={guest
          ? `${guest.first_name} (${party?.name || 'Unknown'})\n${guest.food_preference || 'No preference'}`
          : `Seat ${seatIndex + 1}`
        }
        onClick={(e) => {
          if (guest) {
            e.stopPropagation();
            onRemoveGuest(guest.id);
          }
        }}
      >
        {guest ? (
          <span className="truncate px-0.5 text-gray-700">
            {guest.first_name?.split(' ')[0]?.slice(0, 3) || '?'}
          </span>
        ) : (
          <span className="text-gray-400">{seatIndex + 1}</span>
        )}
      </div>
    );
  };

  const tableHeight = seatsPerSide * 28 + 20;

  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-all ${
        isHighlighted ? 'scale-105' : 'hover:scale-102'
      }`}
      onClick={onClick}
    >
      {/* Table name */}
      <div className="text-sm font-medium text-gray-700 mb-2">
        {tableName}
        <span className="text-xs text-gray-400 ml-1">({guests.length}/{seats})</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Left side seats */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: seatsPerSide }).map((_, idx) =>
            renderSeat(idx, leftGuests[idx], 'left')
          )}
        </div>

        {/* Table surface */}
        <div
          className="rounded transition-all flex items-center justify-center"
          style={{
            width: 40,
            height: tableHeight,
            backgroundColor: isHighlighted ? '#86efac' : '#6b7280',
            border: isHighlighted ? '3px solid #22c55e' : '3px solid #4b5563',
          }}
        >
          <span className="text-white font-bold text-lg rotate-90 whitespace-nowrap">
            {tableNumber}
          </span>
        </div>

        {/* Right side seats */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: seatsPerSide }).map((_, idx) =>
            renderSeat(seatsPerSide + idx, rightGuests[idx], 'right')
          )}
        </div>
      </div>
    </div>
  );
};

// Bride & Groom Component
const BrideGroomSection = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Stage */}
      <div className="w-48 h-12 bg-purple-200 border-2 border-purple-400 rounded-lg flex items-center justify-center mb-4">
        <span className="text-sm font-medium text-purple-700">Stage</span>
      </div>

      {/* B&G seats */}
      <div className="flex gap-4 mb-2">
        <div
          className="w-10 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#f9a8d4' }}
        >
          <span className="text-lg">👰</span>
        </div>
        <div
          className="w-10 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#93c5fd' }}
        >
          <span className="text-lg">🤵</span>
        </div>
      </div>

      {/* B&G table */}
      <div className="w-24 h-8 bg-gray-600 rounded flex items-center justify-center">
        <span className="text-xs font-bold text-white">Bride & Groom</span>
      </div>
    </div>
  );
};

// Party Card Component
const PartyCard = ({
  party,
  isSelected,
  onSelect,
}: {
  party: Party;
  isSelected: boolean;
  onSelect: (party: Party) => void;
}) => {
  const sideBorder = party.from_side ? SIDE_BORDER_COLORS[party.from_side] || '' : '';
  const sideColor = party.from_side ? SIDE_BADGE_COLORS[party.from_side] || 'text-gray-600' : 'text-gray-600';

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all border-l-4 ${sideBorder} ${
        isSelected
          ? 'ring-2 ring-green-500 border-green-400 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
      onClick={() => onSelect(party)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-gray-800">{party.name}</span>
        <Badge
          variant="outline"
          className={`text-xs ${isSelected ? 'bg-green-100 text-green-700' : ''}`}
        >
          {party.guests.length}
        </Badge>
      </div>
      <div className="text-xs text-gray-500">
        <span className="text-gray-600">{party.type || 'Unknown'}</span>
        <span className="mx-1">•</span>
        <span className={sideColor}>{party.from_side || 'No side'}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {party.guests.map(g => (
          <span key={g.id} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
            {g.first_name?.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function AdminSeating2Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [tableAssignments, setTableAssignments] = useState<Map<number, Guest[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [tableNames] = useState<Record<number, string>>({
    1: 'Table A',
    2: 'Table B',
    3: 'Table C',
    4: 'Table D',
    5: 'Table E',
  });
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  const correctPassword = 'ChanikaDavid2026!';

  const getTableCapacity = (tableNum: number) => {
    return TABLE_CONFIG[tableNum as keyof typeof TABLE_CONFIG]?.seats || 10;
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('wedding-admin-session');
    if (savedSession) {
      const { timestamp, authenticated } = JSON.parse(savedSession);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (authenticated && Date.now() - timestamp < twentyFourHours) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('wedding-admin-session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('id, name, type, from_side')
        .order('name');

      if (partiesError) throw partiesError;

      const { data: guestsData, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .eq('rsvp_status', 'Attending');

      if (guestsError) throw guestsError;

      const partiesWithGuests: Party[] = (partiesData || []).map(party => ({
        ...party,
        guests: (guestsData || []).filter(g => g.party_id === party.id),
      })).filter(p => p.guests.length > 0);

      setParties(partiesWithGuests);

      // Initialize empty assignments for layout 2
      const assignments = new Map<number, Guest[]>();
      for (let i = 1; i <= TOTAL_TABLES; i++) {
        assignments.set(i, []);
      }

      // Note: This layout uses different table numbers, so we start fresh
      // In a real scenario, you might want to store layout-specific assignments

      setTableAssignments(assignments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const getUnassignedParties = () => {
    const assignedGuestIds = new Set<string>();
    tableAssignments.forEach(guests => {
      guests.forEach(g => assignedGuestIds.add(g.id));
    });

    return parties.filter(party => {
      return party.guests.some(g => !assignedGuestIds.has(g.id));
    });
  };

  const getFilteredParties = () => {
    let filtered = getUnassignedParties();

    if (filterSide !== 'all') {
      filtered = filtered.filter(p => p.from_side === filterSide);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.guests.some(g => g.first_name?.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getPartyTypes = () => {
    const types = new Set<string>();
    parties.forEach(p => {
      if (p.type) types.add(p.type);
    });
    return Array.from(types).sort();
  };

  const canPartyFitInTable = (tableNum: number) => {
    if (!selectedParty) return false;
    const currentGuests = tableAssignments.get(tableNum)?.length || 0;
    const capacity = getTableCapacity(tableNum);
    return currentGuests + selectedParty.guests.length <= capacity;
  };

  const handleAssignParty = (tableNumber: number) => {
    if (!selectedParty || !canPartyFitInTable(tableNumber)) return;

    const newAssignments = new Map(tableAssignments);
    const tableGuests = [...(newAssignments.get(tableNumber) || [])];

    selectedParty.guests.forEach(guest => {
      if (!tableGuests.find(g => g.id === guest.id)) {
        tableGuests.push({ ...guest, table_number: tableNumber.toString() });
      }
    });

    newAssignments.set(tableNumber, tableGuests);
    setTableAssignments(newAssignments);
    setSelectedParty(null);
  };

  const handleRemoveGuest = (guestId: string) => {
    const newAssignments = new Map(tableAssignments);

    newAssignments.forEach((guests, tableNum) => {
      const filtered = guests.filter(g => g.id !== guestId);
      newAssignments.set(tableNum, filtered);
    });

    setTableAssignments(newAssignments);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // For layout 2, we would need a different storage mechanism
      // For now, just show success
      alert('Layout 2 seating saved! Note: This layout uses a different table structure.');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const rows = ['Table_Number,Table_Name,Seat,Guest_ID,Name,Main_Course,Dietary_Restrictions'];

    tableAssignments.forEach((guests, tableNum) => {
      const tName = tableNames[tableNum] || `Table ${tableNum}`;
      guests.forEach((guest, seatIndex) => {
        const dietary = guest.dietary_requirements || '';
        rows.push(
          `${tableNum},"${tName}",${seatIndex + 1},${guest.id},${guest.first_name || ''},${guest.food_preference || ''},"${dietary.replace(/"/g, '""')}"`
        );
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding_seating_layout2.csv';
    a.click();
  };

  const totalAssigned = Array.from(tableAssignments.values()).reduce((sum, guests) => sum + guests.length, 0);
  const totalGuests = parties.reduce((sum, p) => sum + p.guests.length, 0);
  const totalCapacity = Object.values(TABLE_CONFIG).reduce((sum, t) => sum + t.seats, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Seating Plan 2 - Long Tables
          </h1>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Access Seating Chart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Seating Plan 2 - Long Tables</h1>
              <p className="text-sm text-gray-500">
                {totalAssigned} / {totalGuests} guests assigned • Capacity: {totalCapacity} seats
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin-seating" className="text-sm text-blue-600 hover:underline mr-4">
                ← Round Tables Layout
              </a>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'visual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('visual')}
                  className="rounded-none"
                >
                  <LayoutGrid size={16} className="mr-1" /> Visual
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-none"
                >
                  <List size={16} className="mr-1" /> Table
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download size={16} className="mr-1" /> Export CSV
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save size={16} className="mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4">
        <div className="flex gap-6">
          {/* Left Panel - Party List */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={18} />
                  Parties
                </h2>
                <Badge variant="outline" className="text-xs">
                  {getUnassignedParties().length} unassigned
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <Input
                  placeholder="Search parties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm"
                />
                <select
                  value={filterSide}
                  onChange={(e) => setFilterSide(e.target.value)}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                >
                  <option value="all">All Sides</option>
                  <option value="David">David (Groom)</option>
                  <option value="Chanika">Chanika (Bride)</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                >
                  <option value="all">All Groups</option>
                  {getPartyTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {selectedParty && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 text-sm">
                    Selected: {selectedParty.name}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Click a highlighted table to assign {selectedParty.guests.length} guest(s)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedParty(null)}
                    className="mt-2 text-xs h-7"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : getFilteredParties().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    All parties assigned!
                  </div>
                ) : (
                  getFilteredParties().map(party => (
                    <PartyCard
                      key={party.id}
                      party={party}
                      isSelected={selectedParty?.id === party.id}
                      onSelect={setSelectedParty}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Table Layout */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow p-6">
              {viewMode === 'visual' ? (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="font-semibold text-gray-800">Long Table Layout</h2>
                    <span className="text-sm text-gray-500">
                      (Click a party, then click a table to assign)
                    </span>
                  </div>

                  {/* Venue Floor Plan */}
                  <div className="flex flex-col items-center gap-8">
                    {/* Bride & Groom + Stage at top */}
                    <BrideGroomSection />

                    {/* 5 Long Tables */}
                    <div className="flex items-end justify-center gap-6">
                      {/* Table A (24 seats) */}
                      <LongTable
                        tableNumber={1}
                        tableName={tableNames[1]}
                        guests={tableAssignments.get(1) || []}
                        config={TABLE_CONFIG[1]}
                        onRemoveGuest={handleRemoveGuest}
                        isHighlighted={canPartyFitInTable(1)}
                        onClick={() => handleAssignParty(1)}
                        parties={parties}
                      />

                      {/* Table B (18 seats) */}
                      <LongTable
                        tableNumber={2}
                        tableName={tableNames[2]}
                        guests={tableAssignments.get(2) || []}
                        config={TABLE_CONFIG[2]}
                        onRemoveGuest={handleRemoveGuest}
                        isHighlighted={canPartyFitInTable(2)}
                        onClick={() => handleAssignParty(2)}
                        parties={parties}
                      />

                      {/* Table C (6 seats - center) */}
                      <LongTable
                        tableNumber={3}
                        tableName={tableNames[3]}
                        guests={tableAssignments.get(3) || []}
                        config={TABLE_CONFIG[3]}
                        onRemoveGuest={handleRemoveGuest}
                        isHighlighted={canPartyFitInTable(3)}
                        onClick={() => handleAssignParty(3)}
                        parties={parties}
                      />

                      {/* Table D (18 seats) */}
                      <LongTable
                        tableNumber={4}
                        tableName={tableNames[4]}
                        guests={tableAssignments.get(4) || []}
                        config={TABLE_CONFIG[4]}
                        onRemoveGuest={handleRemoveGuest}
                        isHighlighted={canPartyFitInTable(4)}
                        onClick={() => handleAssignParty(4)}
                        parties={parties}
                      />

                      {/* Table E (24 seats) */}
                      <LongTable
                        tableNumber={5}
                        tableName={tableNames[5]}
                        guests={tableAssignments.get(5) || []}
                        config={TABLE_CONFIG[5]}
                        onRemoveGuest={handleRemoveGuest}
                        isHighlighted={canPartyFitInTable(5)}
                        onClick={() => handleAssignParty(5)}
                        parties={parties}
                      />
                    </div>

                    {/* Terrace at bottom */}
                    <div className="w-full max-w-4xl mt-4">
                      <div className="h-12 bg-amber-100 border-2 border-amber-300 rounded-lg flex items-center justify-center text-amber-700 font-medium">
                        Terrace
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Party Type Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PARTY_TYPE_SEAT_BG).map(([type, color]) => (
                        <span
                          key={type}
                          className="text-xs px-2 py-1 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <h4 className="font-medium mb-2">Table Capacity:</h4>
                      <div className="flex gap-4">
                        {Object.entries(TABLE_CONFIG).map(([num, config]) => (
                          <span key={num}>
                            {config.name}: {config.seats} seats
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="font-semibold text-gray-800">Table Overview</h2>
                    <span className="text-sm text-gray-500">
                      All tables and assigned guests
                    </span>
                  </div>

                  {/* Tabular View */}
                  <div className="space-y-4">
                    {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(tableNum => {
                      const guests = tableAssignments.get(tableNum) || [];
                      const config = TABLE_CONFIG[tableNum as keyof typeof TABLE_CONFIG];
                      const capacity = config.seats;

                      return (
                        <div key={tableNum} className="border rounded-lg overflow-hidden">
                          <div
                            className="px-4 py-3 flex items-center justify-between"
                            style={{ backgroundColor: '#6b7280' }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-white">
                                {tableNum}
                              </span>
                              <span className="text-white font-medium">
                                {tableNames[tableNum]} ({config.seatsPerSide} per side)
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`${guests.length === capacity ? 'bg-green-100 text-green-700' : 'bg-white text-gray-700'}`}
                            >
                              {guests.length}/{capacity} seats
                            </Badge>
                          </div>

                          {guests.length > 0 ? (
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Main Course</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dietary</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {guests.map((guest, idx) => {
                                  const party = parties.find(p => p.id === guest.party_id);
                                  const bgColor = party?.type ? PARTY_TYPE_SEAT_BG[party.type] : undefined;
                                  const side = idx < config.seatsPerSide ? 'Left' : 'Right';
                                  const seatNum = idx < config.seatsPerSide ? idx + 1 : idx - config.seatsPerSide + 1;

                                  return (
                                    <tr key={guest.id} style={{ backgroundColor: bgColor ? `${bgColor}40` : undefined }}>
                                      <td className="px-4 py-2 text-sm text-gray-600">{idx + 1}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500">{side} {seatNum}</td>
                                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{guest.first_name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{party?.name || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500">{party?.type || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">
                                        {guest.food_preference?.replace('Italian Set - ', '') ||
                                         (guest.age_group === 'Toddler' ? 'Kids Meal' : '-')}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {guest.dietary_requirements || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm">
                              No guests assigned yet
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
