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

const TOTAL_TABLES = 10;

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

// Round Table Component - Flower petal style matching reference
const RoundTable = ({
  tableNumber,
  tableName,
  guests,
  maxSeats,
  onRemoveGuest,
  isHighlighted,
  onClick,
  parties,
  isEditing,
  onEditName,
  onSaveName,
}: {
  tableNumber: number;
  tableName?: string;
  guests: Guest[];
  maxSeats: number;
  onRemoveGuest: (guestId: string) => void;
  isHighlighted: boolean;
  onClick: () => void;
  parties: Party[];
  isEditing: boolean;
  onEditName: () => void;
  onSaveName: (name: string) => void;
}) => {
  const [editValue, setEditValue] = useState(tableName || '');
  const tableRadius = 40; // Table circle radius
  const seatWidth = 24;
  const seatHeight = 30;
  const seatDistance = 58; // Distance from center to seat center

  const getPartyForGuest = (guest: Guest) => {
    return parties.find(p => p.id === guest.party_id);
  };

  // Generate seat positions in a circle (flower petal arrangement)
  const getSeatStyle = (index: number, total: number) => {
    // Start from top and go clockwise
    const angle = ((index / total) * 360 - 90) * (Math.PI / 180);
    const x = Math.cos(angle) * seatDistance;
    const y = Math.sin(angle) * seatDistance;
    const rotation = (index / total) * 360;

    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    };
  };

  const containerSize = 160;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative cursor-pointer transition-all duration-200 ${
          isHighlighted ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{ width: containerSize, height: containerSize }}
        onClick={onClick}
      >
        {/* Seats around the table (flower petals) */}
        {Array.from({ length: maxSeats }).map((_, index) => {
          const guest = guests[index];
          const party = guest ? getPartyForGuest(guest) : null;
          const seatBg = party?.type ? PARTY_TYPE_SEAT_BG[party.type] || '#e5e7eb' : 'white';
          const style = getSeatStyle(index, maxSeats);

          return (
            <div
              key={index}
              className={`absolute flex items-center justify-center transition-all ${
                guest ? 'cursor-pointer hover:brightness-90' : ''
              }`}
              style={{
                ...style,
                width: seatWidth,
                height: seatHeight,
                borderRadius: '50%',
                backgroundColor: guest ? seatBg : 'white',
                border: guest ? '2px solid #9ca3af' : '2px dashed #d1d5db',
              }}
              title={guest
                ? `${guest.first_name} (${party?.name || 'Unknown'})\n${guest.food_preference || 'No preference'}`
                : `Seat ${index + 1}`
              }
              onClick={(e) => {
                if (guest) {
                  e.stopPropagation();
                  onRemoveGuest(guest.id);
                }
              }}
            >
              {guest ? (
                <span
                  className="text-[8px] font-medium text-gray-700 truncate px-0.5"
                  style={{ transform: `rotate(-${(index / maxSeats) * 360}deg)` }}
                >
                  {guest.first_name?.split(' ')[0]?.slice(0, 3) || '?'}
                </span>
              ) : (
                <span
                  className="text-[9px] text-gray-400"
                  style={{ transform: `rotate(-${(index / maxSeats) * 360}deg)` }}
                >
                  {index + 1}
                </span>
              )}
            </div>
          );
        })}

        {/* Table circle in center */}
        <div
          className="absolute rounded-full flex items-center justify-center transition-all"
          style={{
            width: tableRadius * 2,
            height: tableRadius * 2,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: isHighlighted ? '#86efac' : '#2dd4bf',
            border: isHighlighted ? '3px solid #22c55e' : '3px solid #14b8a6',
          }}
        >
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {tableNumber}
            </div>
            <div className="text-[10px] text-white/80">
              {guests.length}/{maxSeats}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onSaveName(editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveName(editValue);
              if (e.key === 'Escape') onSaveName(tableName || '');
            }}
            className="text-sm font-medium text-gray-700 w-28 text-center border-2 border-blue-400 rounded px-2 py-1 bg-white"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-300 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEditName();
            }}
            title="Click to rename table"
          >
            {tableName || `Table ${tableNumber}`}
          </button>
        )}
      </div>
    </div>
  );
};

// Bride & Groom Table Component (Rectangular with 2 seats behind)
const BrideGroomTable = () => {
  return (
    <div className="flex flex-col items-center">
      {/* 2 seats behind the table */}
      <div className="flex gap-3 mb-2">
        <div
          className="w-7 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#f9a8d4' }}
        >
          <span className="text-[10px]">👰</span>
        </div>
        <div
          className="w-7 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center"
          style={{ backgroundColor: '#93c5fd' }}
        >
          <span className="text-[10px]">🤵</span>
        </div>
      </div>
      {/* Rectangular table */}
      <div
        className="w-20 h-10 rounded flex items-center justify-center"
        style={{ backgroundColor: '#6b7280' }}
      >
        <span className="text-xs font-bold text-white">B & G</span>
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

export default function AdminSeatingPage() {
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
  const [tableNames, setTableNames] = useState<Record<number, string>>({});
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  // Load table names from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wedding-table-names');
    if (saved) {
      setTableNames(JSON.parse(saved));
    }
  }, []);

  // Save table names to localStorage when changed
  useEffect(() => {
    if (Object.keys(tableNames).length > 0) {
      localStorage.setItem('wedding-table-names', JSON.stringify(tableNames));
    }
  }, [tableNames]);

  const correctPassword = 'ChanikaDavid2026!';

  const getTableCapacity = (_tableNum?: number) => {
    return 10;
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

      const assignments = new Map<number, Guest[]>();
      for (let i = 1; i <= TOTAL_TABLES; i++) {
        assignments.set(i, []);
      }

      (guestsData || []).forEach(guest => {
        if (guest.table_number) {
          const tableNum = parseInt(guest.table_number);
          if (!isNaN(tableNum) && assignments.has(tableNum)) {
            assignments.get(tableNum)!.push(guest);
          }
        }
      });

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

  // Get unique party types for filter
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
      const updates: { id: string; table_number: string | null }[] = [];

      const { data: allGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('rsvp_status', 'Attending');

      (allGuests || []).forEach(g => {
        updates.push({ id: g.id, table_number: null });
      });

      tableAssignments.forEach((guests, tableNum) => {
        guests.forEach(guest => {
          const existingIndex = updates.findIndex(u => u.id === guest.id);
          if (existingIndex >= 0) {
            updates[existingIndex].table_number = tableNum.toString();
          } else {
            updates.push({ id: guest.id, table_number: tableNum.toString() });
          }
        });
      });

      for (const update of updates) {
        await supabase
          .from('guests')
          .update({ table_number: update.table_number })
          .eq('id', update.id);
      }

      alert('Seating assignments saved successfully!');
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
    a.download = 'wedding_seating_chart.csv';
    a.click();
  };

  const totalAssigned = Array.from(tableAssignments.values()).reduce((sum, guests) => sum + guests.length, 0);
  const totalGuests = parties.reduce((sum, p) => sum + p.guests.length, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Seating Chart Admin
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

  // Render a table component
  const renderTable = (tableNum: number) => (
    <RoundTable
      key={tableNum}
      tableNumber={tableNum}
      tableName={tableNames[tableNum]}
      guests={tableAssignments.get(tableNum) || []}
      maxSeats={getTableCapacity(tableNum)}
      onRemoveGuest={handleRemoveGuest}
      isHighlighted={canPartyFitInTable(tableNum)}
      onClick={() => handleAssignParty(tableNum)}
      parties={parties}
      isEditing={editingTable === tableNum}
      onEditName={() => setEditingTable(tableNum)}
      onSaveName={(name) => {
        setTableNames(prev => ({ ...prev, [tableNum]: name }));
        setEditingTable(null);
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Seating Chart</h1>
              <p className="text-sm text-gray-500">
                {totalAssigned} / {totalGuests} guests assigned
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                    <h2 className="font-semibold text-gray-800">Table Layout</h2>
                    <span className="text-sm text-gray-500">
                      (Click a party, then click a table to assign)
                    </span>
                  </div>

                  {/* Venue Floor Plan - 2 rows */}
                  <div className="flex flex-col items-center" style={{ gap: '24px' }}>

                    {/* Row 1: Tables 1, 2 | B&G | Tables 3, 4 */}
                    <div className="flex items-end justify-center" style={{ gap: '12px' }}>
                      {renderTable(1)}
                      {renderTable(2)}

                      <div style={{ margin: '0 16px' }}>
                        <BrideGroomTable />
                      </div>

                      {renderTable(3)}
                      {renderTable(4)}
                    </div>

                    {/* Row 2: Tables 5, 6, 7, 8, 9, 10 */}
                    <div className="flex justify-center" style={{ gap: '12px' }}>
                      {renderTable(5)}
                      {renderTable(6)}
                      {renderTable(7)}
                      {renderTable(8)}
                      {renderTable(9)}
                      {renderTable(10)}
                    </div>

                    {/* Counter indicator */}
                    <div className="w-full max-w-5xl mt-4">
                      <div className="h-10 bg-gray-500 rounded flex items-center justify-center text-white text-sm font-medium">
                        Counter
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
                      const capacity = getTableCapacity(tableNum);

                      return (
                        <div key={tableNum} className="border rounded-lg overflow-hidden">
                          <div
                            className="px-4 py-3 flex items-center justify-between"
                            style={{ backgroundColor: '#2dd4bf' }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-white">
                                {tableNum}
                              </span>
                              <span className="text-white font-medium">
                                {tableNames[tableNum] || `Table ${tableNum}`}
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

                                  return (
                                    <tr key={guest.id} style={{ backgroundColor: bgColor ? `${bgColor}40` : undefined }}>
                                      <td className="px-4 py-2 text-sm text-gray-600">{idx + 1}</td>
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
