'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, Users, Download, LayoutGrid, List, User } from 'lucide-react';

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

// Long Table Component with individual seat assignment
const LongTable = ({
  tableNumber,
  tableName,
  seatAssignments,
  config,
  onSeatClick,
  onRemoveGuest,
  selectedGuest,
  parties,
}: {
  tableNumber: number;
  tableName: string;
  seatAssignments: (Guest | null)[];
  config: { seats: number; seatsPerSide: number };
  onSeatClick: (tableNum: number, seatIndex: number) => void;
  onRemoveGuest: (tableNum: number, seatIndex: number) => void;
  selectedGuest: Guest | null;
  parties: Party[];
}) => {
  const { seats, seatsPerSide } = config;

  const getPartyForGuest = (guest: Guest) => {
    return parties.find(p => p.id === guest.party_id);
  };

  const assignedCount = seatAssignments.filter(s => s !== null).length;

  const renderSeat = (seatIndex: number, side: 'left' | 'right', sideIndex: number) => {
    const guest = seatAssignments[seatIndex];
    const party = guest ? getPartyForGuest(guest) : null;
    const seatBg = party?.type ? PARTY_TYPE_SEAT_BG[party.type] || '#e5e7eb' : 'white';
    const isHighlighted = selectedGuest && !guest;
    // Add bottom border line after every 3rd seat (except the last)
    const isGroupEnd = (sideIndex + 1) % 3 === 0 && sideIndex < seatsPerSide - 1;

    return (
      <div
        key={`${side}-${seatIndex}`}
        className={`w-8 h-10 flex items-center justify-center text-[9px] font-medium rounded-sm transition-all cursor-pointer ${
          isHighlighted ? 'ring-2 ring-green-500 scale-110' : ''
        } ${guest ? 'hover:brightness-90' : 'hover:bg-green-100'}`}
        style={{
          backgroundColor: guest ? seatBg : isHighlighted ? '#dcfce7' : 'white',
          border: guest ? '2px solid #9ca3af' : isHighlighted ? '2px solid #22c55e' : '2px dashed #d1d5db',
          borderBottom: isGroupEnd ? '3px solid #374151' : undefined,
        }}
        title={guest
          ? `${guest.first_name} (${party?.name || 'Unknown'})\n${guest.food_preference || 'No preference'}\nClick to remove`
          : `Seat ${seatIndex + 1} - Click to assign`
        }
        onClick={(e) => {
          e.stopPropagation();
          if (guest) {
            onRemoveGuest(tableNumber, seatIndex);
          } else if (selectedGuest) {
            onSeatClick(tableNumber, seatIndex);
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

  // Calculate table height to match seats: h-10 (40px) + gap-1 (4px) per seat
  const tableHeight = seatsPerSide * 44 - 4;

  return (
    <div className="flex flex-col items-center">
      {/* Table name */}
      <div className="text-sm font-medium text-gray-700 mb-2">
        {tableName}
        <span className="text-xs text-gray-400 ml-1">({assignedCount}/{seats})</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Left side seats */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: seatsPerSide }).map((_, idx) =>
            renderSeat(idx, 'left', idx)
          )}
        </div>

        {/* Table surface with group divider lines */}
        <div
          className="rounded flex flex-col items-center justify-between relative"
          style={{
            width: 40,
            height: tableHeight,
            backgroundColor: '#6b7280',
            border: '3px solid #4b5563',
          }}
        >
          {/* Group divider lines on the table */}
          {Array.from({ length: Math.ceil(seatsPerSide / 3) - 1 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full h-[2px] bg-gray-400"
              style={{
                top: `${((idx + 1) * 3 / seatsPerSide) * 100}%`,
              }}
            />
          ))}
          <span className="text-white font-bold text-lg rotate-90 whitespace-nowrap">
            {tableNumber}
          </span>
        </div>

        {/* Right side seats */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: seatsPerSide }).map((_, idx) =>
            renderSeat(seatsPerSide + idx, 'right', idx)
          )}
        </div>
      </div>
    </div>
  );
};

// Stage Component (spans between Tables B and D)
const StageSection = () => {
  return (
    <div className="w-[420px]">
      <div className="h-10 bg-purple-200 border-2 border-purple-400 rounded-lg flex items-center justify-center">
        <span className="text-sm font-medium text-purple-700">Stage</span>
      </div>
    </div>
  );
};

// Bride & Groom Component (positioned closer to Table C)
const BrideGroomSection = () => {
  return (
    <div className="flex flex-col items-center">
      {/* B&G seats */}
      <div className="flex gap-3 mb-2">
        <div
          className="w-9 h-11 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#f9a8d4' }}
        >
          <span className="text-base">👰</span>
        </div>
        <div
          className="w-9 h-11 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#93c5fd' }}
        >
          <span className="text-base">🤵</span>
        </div>
      </div>

      {/* B&G table */}
      <div className="w-20 h-6 bg-gray-600 rounded flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">B & G</span>
      </div>
    </div>
  );
};

// Individual Guest Card Component
const GuestCard = ({
  guest,
  party,
  isSelected,
  onSelect,
}: {
  guest: Guest;
  party: Party | undefined;
  isSelected: boolean;
  onSelect: (guest: Guest) => void;
}) => {
  const sideBorder = party?.from_side ? SIDE_BORDER_COLORS[party.from_side] || '' : '';
  const sideColor = party?.from_side ? SIDE_BADGE_COLORS[party.from_side] || 'text-gray-600' : 'text-gray-600';
  const bgColor = party?.type ? PARTY_TYPE_SEAT_BG[party.type] : undefined;

  return (
    <div
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all border-l-4 ${sideBorder} ${
        isSelected
          ? 'ring-2 ring-green-500 border-green-400 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
      style={bgColor && !isSelected ? { backgroundColor: `${bgColor}30` } : undefined}
      onClick={() => onSelect(guest)}
    >
      <div className="flex items-center gap-2">
        <User size={14} className="text-gray-400" />
        <span className="font-medium text-sm text-gray-800">{guest.first_name}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1 ml-5">
        <span className="text-gray-600">{party?.name || 'Unknown'}</span>
        <span className="mx-1">•</span>
        <span className={sideColor}>{party?.from_side || '-'}</span>
      </div>
    </div>
  );
};

export default function AdminSeating2Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  // Seat assignments: Map<tableNumber, Array<Guest | null>> where index is seat position
  const [seatAssignments, setSeatAssignments] = useState<Map<number, (Guest | null)[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
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

  // Load saved assignments from localStorage
  const loadSavedAssignments = useCallback((guests: Guest[]) => {
    try {
      const saved = localStorage.getItem('wedding-seating-layout2');
      if (saved) {
        const savedAssignments: Record<number, (string | null)[]> = JSON.parse(saved);
        const guestMap = new Map(guests.map(g => [g.id, g]));

        const assignments = new Map<number, (Guest | null)[]>();
        for (let i = 1; i <= TOTAL_TABLES; i++) {
          const config = TABLE_CONFIG[i as keyof typeof TABLE_CONFIG];
          if (savedAssignments[i]) {
            assignments.set(i, savedAssignments[i].map(id => id ? guestMap.get(id) || null : null));
          } else {
            assignments.set(i, Array(config.seats).fill(null));
          }
        }
        return assignments;
      }
    } catch (error) {
      console.error('Error loading saved assignments:', error);
    }
    return null;
  }, []);

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
      setAllGuests(guestsData || []);

      // Try to load saved assignments, otherwise initialize empty
      const savedAssignments = loadSavedAssignments(guestsData || []);
      if (savedAssignments) {
        setSeatAssignments(savedAssignments);
      } else {
        // Initialize empty seat assignments
        const assignments = new Map<number, (Guest | null)[]>();
        for (let i = 1; i <= TOTAL_TABLES; i++) {
          const config = TABLE_CONFIG[i as keyof typeof TABLE_CONFIG];
          assignments.set(i, Array(config.seats).fill(null));
        }
        setSeatAssignments(assignments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadSavedAssignments]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Get all assigned guest IDs
  const getAssignedGuestIds = () => {
    const ids = new Set<string>();
    seatAssignments.forEach(seats => {
      seats.forEach(guest => {
        if (guest) ids.add(guest.id);
      });
    });
    return ids;
  };

  // Get unassigned guests
  const getUnassignedGuests = () => {
    const assignedIds = getAssignedGuestIds();
    return allGuests.filter(g => !assignedIds.has(g.id));
  };

  // Get filtered guests
  const getFilteredGuests = () => {
    let filtered = getUnassignedGuests();

    if (filterSide !== 'all') {
      filtered = filtered.filter(g => {
        const party = parties.find(p => p.id === g.party_id);
        return party?.from_side === filterSide;
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(g => {
        const party = parties.find(p => p.id === g.party_id);
        return party?.type === filterType;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g => {
        const party = parties.find(p => p.id === g.party_id);
        return (
          g.first_name?.toLowerCase().includes(term) ||
          party?.name.toLowerCase().includes(term)
        );
      });
    }

    return filtered.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
  };

  const getPartyTypes = () => {
    const types = new Set<string>();
    parties.forEach(p => {
      if (p.type) types.add(p.type);
    });
    return Array.from(types).sort();
  };

  const handleSeatClick = (tableNum: number, seatIndex: number) => {
    if (!selectedGuest) return;

    const newAssignments = new Map(seatAssignments);
    const tableSeats = [...(newAssignments.get(tableNum) || [])];

    // Check if seat is already occupied
    if (tableSeats[seatIndex]) return;

    tableSeats[seatIndex] = selectedGuest;
    newAssignments.set(tableNum, tableSeats);
    setSeatAssignments(newAssignments);
    setSelectedGuest(null);
  };

  const handleRemoveGuest = (tableNum: number, seatIndex: number) => {
    const newAssignments = new Map(seatAssignments);
    const tableSeats = [...(newAssignments.get(tableNum) || [])];
    tableSeats[seatIndex] = null;
    newAssignments.set(tableNum, tableSeats);
    setSeatAssignments(newAssignments);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert Map to array format for localStorage
      const assignmentsToSave: Record<number, (string | null)[]> = {};
      seatAssignments.forEach((seats, tableNum) => {
        assignmentsToSave[tableNum] = seats.map(guest => guest?.id || null);
      });
      localStorage.setItem('wedding-seating-layout2', JSON.stringify(assignmentsToSave));
      alert('Seating assignments saved!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const rows = ['Table_Number,Table_Name,Seat,Side,Guest_ID,Name,Party,Type,Main_Course,Dietary_Restrictions'];

    seatAssignments.forEach((seats, tableNum) => {
      const tName = tableNames[tableNum] || `Table ${tableNum}`;
      const config = TABLE_CONFIG[tableNum as keyof typeof TABLE_CONFIG];

      seats.forEach((guest, seatIndex) => {
        if (guest) {
          const party = parties.find(p => p.id === guest.party_id);
          const side = seatIndex < config.seatsPerSide ? 'Left' : 'Right';
          const seatNum = seatIndex < config.seatsPerSide ? seatIndex + 1 : seatIndex - config.seatsPerSide + 1;
          const dietary = guest.dietary_requirements || '';
          rows.push(
            `${tableNum},"${tName}",${side} ${seatNum},${seatIndex + 1},${guest.id},${guest.first_name || ''},"${party?.name || ''}","${party?.type || ''}",${guest.food_preference || ''},"${dietary.replace(/"/g, '""')}"`
          );
        }
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding_seating_layout2.csv';
    a.click();
  };

  const totalAssigned = getAssignedGuestIds().size;
  const totalGuests = allGuests.length;
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
          {/* Left Panel - Guest List */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={18} />
                  Guests
                </h2>
                <Badge variant="outline" className="text-xs">
                  {getUnassignedGuests().length} unassigned
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <Input
                  placeholder="Search guests..."
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

              {selectedGuest && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 text-sm">
                    Selected: {selectedGuest.first_name}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Click an empty seat to assign
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGuest(null)}
                    className="mt-2 text-xs h-7"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : getFilteredGuests().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    All guests assigned!
                  </div>
                ) : (
                  getFilteredGuests().map(guest => {
                    const party = parties.find(p => p.id === guest.party_id);
                    return (
                      <GuestCard
                        key={guest.id}
                        guest={guest}
                        party={party}
                        isSelected={selectedGuest?.id === guest.id}
                        onSelect={setSelectedGuest}
                      />
                    );
                  })
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
                      (Select a guest, then click an empty seat)
                    </span>
                  </div>

                  {/* Venue Floor Plan */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Stage at top */}
                    <StageSection />

                    {/* 5 Long Tables with B&G positioned at B/D height */}
                    <div className="relative">
                      {/* B&G absolutely positioned at the height of Tables B/D */}
                      {/* Top offset: ~135px from where B/D start (3 seats × 44px + label height) */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-[22px] z-10">
                        <BrideGroomSection />
                      </div>

                      <div className="flex items-end justify-center gap-12">
                        {/* All 5 tables */}
                        {[1, 2, 3, 4, 5].map(tableNum => (
                          <LongTable
                            key={tableNum}
                            tableNumber={tableNum}
                            tableName={tableNames[tableNum]}
                            seatAssignments={seatAssignments.get(tableNum) || []}
                            config={TABLE_CONFIG[tableNum as keyof typeof TABLE_CONFIG]}
                            onSeatClick={handleSeatClick}
                            onRemoveGuest={handleRemoveGuest}
                            selectedGuest={selectedGuest}
                            parties={parties}
                          />
                        ))}
                      </div>
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
                      const seats = seatAssignments.get(tableNum) || [];
                      const config = TABLE_CONFIG[tableNum as keyof typeof TABLE_CONFIG];
                      const assignedCount = seats.filter(s => s !== null).length;

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
                              className={`${assignedCount === config.seats ? 'bg-green-100 text-green-700' : 'bg-white text-gray-700'}`}
                            >
                              {assignedCount}/{config.seats} seats
                            </Badge>
                          </div>

                          {assignedCount > 0 ? (
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
                                {seats.map((guest, idx) => {
                                  if (!guest) return null;
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
