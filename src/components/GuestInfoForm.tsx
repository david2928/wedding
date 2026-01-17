'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Utensils, Car, Check, Loader2, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Party {
  id: string;
  code: string;
  name: string;
  status: string | null;
  from_side: string | null;
  google_user_id: string | null;
  google_email: string | null;
}

interface Guest {
  id: string;
  party_id: string;
  first_name: string | null;
  internal_name: string | null; // This now holds the original nickname from CSV
  age_group: 'Adult' | 'Child' | 'Toddler' | null;
  food_preference: string | null;
  dietary_requirements: string | null;
  drinks_alcohol: boolean | null;
  rsvp_status: string | null;
}

interface Logistics {
  id: string;
  party_id: string;
  has_own_transport: boolean | null;
  pickup_type: 'airport' | 'hotel' | 'other' | null;
  pickup_location: string | null;
  pickup_time: string | null;
  flight_number: string | null;
  accommodation_name: string | null;
  notes: string | null;
}

const GuestInfoForm = ({ code }: { code: string }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [party, setParty] = useState<Party | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [logistics, setLogistics] = useState<Logistics>({
    id: '',
    party_id: '',
    has_own_transport: true,
    pickup_type: 'hotel',
    pickup_location: '',
    pickup_time: '',
    flight_number: '',
    accommodation_name: '',
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user && party) {
        await linkGoogleAccount(session.user, party);
      }
    });

    return () => subscription.unsubscribe();
  }, [party]);

  useEffect(() => {
    if (code) {
      loadPartyData();
    }
  }, [code]);

  useEffect(() => {
    if (user && party) {
      if (party.google_user_id === user.id) {
        loadFormData();
      } else if (!party.google_user_id) {
        linkGoogleAccount(user, party);
      } else {
        setError('This invitation is linked to a different Google account.');
      }
    }
  }, [user, party]);

  const loadPartyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code?.toUpperCase())
        .single();

      if (partyError || !partyData) {
        setError('Invalid invitation code. Please check your link and try again.');
        setLoading(false);
        return;
      }

      setParty(partyData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading party:', err);
      setError('Something went wrong. Please try again later.');
      setLoading(false);
    }
  };

  const linkGoogleAccount = async (googleUser: User, partyData: Party) => {
    try {
      const { error } = await supabase
        .from('parties')
        .update({
          google_user_id: googleUser.id,
          google_email: googleUser.email,
        })
        .eq('id', partyData.id);

      if (error) throw error;

      setParty({
        ...partyData,
        google_user_id: googleUser.id,
        google_email: googleUser.email || null
      });

      loadFormData();
      toast({
        title: "Account Linked!",
        description: "Your Google account has been linked to your invitation.",
      });
    } catch (err) {
      console.error('Error linking account:', err);
      toast({
        title: "Error",
        description: "Failed to link your account.",
        variant: "destructive"
      });
    }
  };

  const loadFormData = async () => {
    if (!party) return;

    try {
      if (party.status === 'completed') {
        setIsCompleted(true);
      }

      const { data: guestsData } = await supabase
        .from('guests')
        .select('*')
        .eq('party_id', party.id)
        .order('created_at');

      if (guestsData) {
        setGuests(guestsData.map(g => ({
          ...g,
          age_group: g.age_group as Guest['age_group'],
          drinks_alcohol: g.drinks_alcohol ?? true, // Default to true if null
          rsvp_status: g.rsvp_status || 'Attending' // Default to Attending
        })));
      }

      const { data: logisticsData } = await supabase
        .from('logistics')
        .select('*')
        .eq('party_id', party.id)
        .maybeSingle();

      if (logisticsData) {
        setLogistics({
          id: logisticsData.id,
          party_id: logisticsData.party_id || party.id,
          has_own_transport: logisticsData.has_own_transport ?? true,
          pickup_type: logisticsData.pickup_type as Logistics['pickup_type'] || 'hotel',
          pickup_location: logisticsData.pickup_location || '',
          pickup_time: logisticsData.pickup_time || '',
          flight_number: logisticsData.flight_number || '',
          accommodation_name: logisticsData.accommodation_name || '',
          notes: logisticsData.notes || ''
        });
      } else {
        setLogistics(prev => ({ ...prev, party_id: party.id }));
      }

    } catch (err) {
      console.error('Error loading form data:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/guest/${code}`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error signing in:', err);
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getMenuSelection = (preference: string | null) => {
    if (!preference) return 'italian_set';
    if (preference === 'Vegetarian') return 'vegetarian';
    if (preference === 'Vegan') return 'vegan';
    if (preference.startsWith('Italian Set')) return 'italian_set';
    return 'italian_set';
  };

  const getMainCourse = (preference: string | null) => {
    if (!preference || !preference.startsWith('Italian Set')) return '';
    const parts = preference.split(' - ');
    if (parts.length > 1) return parts[1].toLowerCase();
    return '';
  };

  const updateGuest = (index: number, field: keyof Guest | 'menu_selection' | 'main_course', value: any) => {
    setGuests(prev => prev.map((g, i) => {
      if (i !== index) return g;

      if (field === 'menu_selection' || field === 'main_course') {
        const currentMenu = field === 'menu_selection' ? value : getMenuSelection(g.food_preference);
        const currentMain = field === 'main_course' ? value : getMainCourse(g.food_preference);
        
        let newPreference = '';
        if (currentMenu === 'italian_set') {
          newPreference = currentMain ? `Italian Set - ${currentMain.charAt(0).toUpperCase() + currentMain.slice(1)}` : 'Italian Set';
        } else if (currentMenu === 'vegetarian') {
          newPreference = 'Vegetarian';
        } else if (currentMenu === 'vegan') {
          newPreference = 'Vegan';
        }
        
        return { ...g, food_preference: newPreference };
      }

      return { ...g, [field]: value };
    }));
  };

  const handleSubmit = async () => {
    if (!party || !user) return;

    console.log('Starting submission for party:', party.code);

    const attendingGuests = guests.filter(g => g.rsvp_status === 'Attending');
    const emptyNames = attendingGuests.filter(g => !g.first_name?.trim());
    if (emptyNames.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please provide names for all attending guests.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Submission timed out after 30 seconds. Please check your internet connection and try again.')), 30000);
    });

    try {
      console.log('Updating guests...');

      // Race the submission against timeout
      await Promise.race([
        (async () => {
          // Use single RPC call to update all guests in one database transaction
          // This avoids multiple HTTP requests and connection issues
          const guestUpdates = guests.map(guest => ({
            id: guest.id,
            first_name: guest.first_name,
            internal_name: guest.internal_name,
            age_group: guest.age_group,
            food_preference: guest.food_preference,
            dietary_requirements: guest.dietary_requirements,
            drinks_alcohol: guest.drinks_alcohol,
            rsvp_status: guest.rsvp_status
          }));

          const { error } = await supabase.rpc('bulk_update_guests', {
            guest_updates: guestUpdates
          });

          if (error) throw error;

          console.log('Guests updated successfully, updating logistics...');

      const logisticsPayload = {
        party_id: party.id,
        has_own_transport: logistics.has_own_transport,
        pickup_type: logistics.pickup_type || null,
        pickup_location: logistics.pickup_location?.trim() || null,
        pickup_time: logistics.pickup_time || null,
        flight_number: logistics.flight_number?.trim() || null,
        accommodation_name: logistics.accommodation_name?.trim() || null,
        notes: logistics.notes?.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error: logisticsError } = await supabase
        .from('logistics')
        .upsert(logisticsPayload, { onConflict: 'party_id' });

      if (logisticsError) throw logisticsError;

      console.log('Logistics updated successfully, updating party status...');

      await supabase
        .from('parties')
        .update({ status: 'completed' })
        .eq('id', party.id);

      console.log('Submission completed successfully!');

          setIsCompleted(true);
          toast({
            title: "Information Saved!",
            description: "Thank you for providing your details. We look forward to celebrating with you!",
          });
        })(),
        timeoutPromise
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error saving submission:', err);
      console.error('Error details:', {
        message: errorMessage,
        party: party?.code,
        guestCount: guests.length,
        hasLogistics: !!logistics
      });

      // Log error to Supabase for centralized tracking
      try {
        await supabase.from('error_logs').insert({
          party_code: party?.code,
          party_id: party?.id,
          error_message: errorMessage,
          error_step: 'form_submission',
          user_agent: navigator.userAgent,
          guest_count: guests.length,
          url: window.location.href,
          stack_trace: err instanceof Error ? err.stack : null
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-deep-blue mb-2">Oops!</h1>
          <p className="text-deep-blue/70 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} className="bg-ocean-blue hover:bg-navy-blue">
            Go to Wedding Website
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <h1 className="font-dancing text-4xl italic mb-2">Chanika & David</h1>
            <p className="text-white/90">January 31, 2026 • Phuket</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Welcome, Guest of the {party?.from_side === 'David' ? 'Groom' : 'Bride'}!
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Please sign in with Google to access your invitation details.
            </p>
            <Button onClick={handleGoogleSignIn} disabled={signingIn} className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg">
              {signingIn ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : "Sign in with Google"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (party?.google_user_id && party.google_user_id !== user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-deep-blue mb-2">Different Account</h1>
          <p className="text-deep-blue/70 mb-4">This invitation is linked to a different Google account.</p>
          <Button onClick={handleSignOut} variant="outline" className="w-full">Sign Out & Try Again</Button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Guest Details', icon: Users },
    { num: 2, label: 'Food Preferences', icon: Utensils },
    { num: 3, label: 'Transportation', icon: Car }
  ];

  return (
    <div className="admin-page min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 sm:py-8 sm:px-4">
      <div className="sm:max-w-2xl sm:mx-auto">
        <div className="text-center py-4 sm:py-0 sm:mb-8">
          <h1 className="font-dancing text-3xl sm:text-4xl md:text-5xl italic text-ocean-blue mb-1 sm:mb-2">Chanika & David</h1>
          <p className="text-deep-blue/70 text-sm sm:text-base">January 31, 2026 • Phuket, Thailand</p>
        </div>

        <div className="bg-white sm:rounded-2xl sm:shadow-xl overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold mb-1">Welcome, Guest of the {party?.from_side === 'David' ? 'Groom' : 'Bride'}!</h2>
                <p className="text-white/80 text-xs">Please help us finalize our wedding arrangements by confirming your details below.</p>
              </div>
              <div className="text-left sm:text-right text-sm">
                <p className="text-white/70 text-xs sm:text-sm truncate">{user.email}</p>
                <button onClick={handleSignOut} className="text-white/90 hover:text-white underline text-xs">Sign out</button>
              </div>
            </div>
          </div>

          {isCompleted && (
            <div className="bg-green-50 border-b border-green-100 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-xs sm:text-sm">Your information has been saved.</p>
            </div>
          )}

          <div className="p-3 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      currentStep === step.num ? 'bg-ocean-blue text-white' : currentStep > step.num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.num ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-medium ${currentStep === step.num ? 'text-ocean-blue' : 'text-gray-500'}`}>{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-6 ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Step 1: Guest Details */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
                <h3 className="text-lg font-semibold text-deep-blue flex items-center gap-2">
                  <Users className="w-5 h-5 text-ocean-blue" /> Guest Details
                </h3>
                {guests.map((guest, index) => {
                  const isAttending = guest.rsvp_status !== 'Not Attending';
                  const isFirstGuest = index === 0;
                  return (
                    <div key={guest.id || index} className={`p-3 sm:p-4 rounded-xl space-y-3 sm:space-y-4 ${isAttending ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-ocean-blue text-white text-sm flex items-center justify-center flex-shrink-0">{index + 1}</span>
                          <span className="font-medium text-deep-blue text-sm sm:text-base">Guest {index + 1}</span>
                        </div>
                        {!isFirstGuest && (
                          <button
                            type="button"
                            onClick={() => updateGuest(index, 'rsvp_status', isAttending ? 'Not Attending' : 'Attending')}
                            style={{
                              backgroundColor: isAttending ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              outline: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation'
                            }}
                          >
                            {isAttending ? 'Remove Guest' : 'Add Back'}
                          </button>
                        )}
                      </div>
                      {!isAttending && (
                        <div className="text-xs text-gray-600 italic">
                          This guest is marked as not attending
                        </div>
                      )}
                      {isAttending && (
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor={`name-${index}`}>Guest Name (Nickname) *</Label>
                            <Input
                              id={`name-${index}`}
                              value={guest.first_name || ''}
                              onChange={(e) => updateGuest(index, 'first_name', e.target.value)}
                              placeholder="Enter name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`age-${index}`}>Age Category</Label>
                            <select
                              id={`age-${index}`}
                              value={guest.age_group || 'Adult'}
                              onChange={(e) => updateGuest(index, 'age_group', e.target.value as any)}
                              className="mt-1 w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                            >
                              <option value="Adult">Adult (12+)</option>
                              <option value="Child">Child (6-11)</option>
                              <option value="Toddler">Toddler (0-5)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="sticky-button-bar flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={guests.filter(g => g.rsvp_status !== 'Not Attending').some(g => !g.first_name?.trim())}
                    className="bg-ocean-blue hover:bg-navy-blue text-white"
                  >
                    Next: Food Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Food */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
                <h3 className="text-lg font-semibold text-deep-blue flex items-center gap-2"><Utensils className="w-5 h-5 text-ocean-blue" /> Food Preferences</h3>
                {guests.filter(g => g.rsvp_status !== 'Not Attending').map((guest, index) => (
                  <div key={guest.id || index} className="p-3 sm:p-4 bg-gray-50 rounded-xl space-y-3 sm:space-y-4">
                    <div className="font-medium text-deep-blue">{guest.first_name || `Guest ${index + 1}`}</div>
                    <div className="space-y-4">
                      {guest.age_group === 'Adult' ? (
                        <>
                          <div>
                            <Label htmlFor={`menu-${index}`}>Menu Selection</Label>
                            <select
                              id={`menu-${index}`}
                              value={getMenuSelection(guest.food_preference)}
                              onChange={(e) => updateGuest(index, 'menu_selection', e.target.value)}
                              className="mt-1 w-full h-10 rounded-md border border-sky-blue bg-white px-3 py-2 text-sm"
                            >
                              <option value="italian_set">Italian Set (Standard)</option>
                              <option value="vegetarian">Vegetarian</option>
                              <option value="vegan">Vegan</option>
                            </select>
                          </div>
                          {getMenuSelection(guest.food_preference) === 'italian_set' && (
                            <div>
                              <Label htmlFor={`main-${index}`}>Choice of Secondi *</Label>
                              <select
                                id={`main-${index}`}
                                value={getMainCourse(guest.food_preference)}
                                onChange={(e) => updateGuest(index, 'main_course', e.target.value)}
                                className="mt-1 w-full h-10 rounded-md bg-white px-3 py-2 text-sm border-sky-blue"
                              >
                                <option value="">Select your main course...</option>
                                <option value="tuna">Tuna - Caponata, shaved fennel</option>
                                <option value="chicken">Slow-Roasted Chicken</option>
                                <option value="lamb">Grilled Lamb Cutlets</option>
                              </select>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                          <p>Food selection is not required for children and toddlers. A kids menu will be provided.</p>
                        </div>
                      )}
                      {/* Alcohol Question */}
                      {guest.age_group === 'Adult' && (
                        <div className="flex items-center justify-between py-2">
                          <Label htmlFor={`alcohol-${index}`} className="text-sm font-medium text-gray-700">Do you drink alcohol?</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateGuest(index, 'drinks_alcohol', true)}
                              style={{
                                backgroundColor: guest.drinks_alcohol ? 'rgb(0, 119, 182)' : 'white',
                                color: guest.drinks_alcohol ? 'white' : 'rgb(0, 119, 182)',
                                border: '1px solid rgb(125, 211, 252)',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 1rem',
                                minWidth: '60px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'manipulation'
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateGuest(index, 'drinks_alcohol', false)}
                              style={{
                                backgroundColor: !guest.drinks_alcohol ? 'rgb(0, 119, 182)' : 'white',
                                color: !guest.drinks_alcohol ? 'white' : 'rgb(0, 119, 182)',
                                border: '1px solid rgb(125, 211, 252)',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 1rem',
                                minWidth: '60px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'manipulation'
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor={`notes-${index}`}>Dietary Notes (optional)</Label>
                        <Input
                          id={`notes-${index}`}
                          value={guest.dietary_requirements || ''}
                          onChange={(e) => updateGuest(index, 'dietary_requirements', e.target.value)}
                          placeholder="Allergies..."
                          className="mt-1 bg-white border-sky-blue"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="sticky-button-bar flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      backgroundColor: 'white',
                      color: 'rgb(0, 119, 182)',
                      border: '1px solid rgb(125, 211, 252)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    Back
                  </button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={guests.filter(g => g.rsvp_status !== 'Not Attending').some(g => g.age_group === 'Adult' && getMenuSelection(g.food_preference) === 'italian_set' && !getMainCourse(g.food_preference))}
                    className="bg-ocean-blue hover:bg-navy-blue text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    Next: Transportation
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Transport */}
            {currentStep === 3 && (
              <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
                <h3 className="text-lg font-semibold text-deep-blue flex items-center gap-2"><Car className="w-5 h-5 text-ocean-blue" /> Travel & Accommodation</h3>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Label className="text-base font-medium">Do you have your own transportation?</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLogistics(prev => ({ ...prev, has_own_transport: true }))}
                        style={{
                          backgroundColor: logistics.has_own_transport ? 'rgb(0, 119, 182)' : 'white',
                          color: logistics.has_own_transport ? 'white' : 'rgb(0, 119, 182)',
                          border: '1px solid rgb(125, 211, 252)',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 1rem',
                          minWidth: '60px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogistics(prev => ({ ...prev, has_own_transport: false }))}
                        style={{
                          backgroundColor: !logistics.has_own_transport ? 'rgb(0, 119, 182)' : 'white',
                          color: !logistics.has_own_transport ? 'white' : 'rgb(0, 119, 182)',
                          border: '1px solid rgb(125, 211, 252)',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 1rem',
                          minWidth: '60px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-deep-blue">Arrival Information (optional)</h4>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="arrival-type">Arriving by</Label>
                      <select
                        id="arrival-type"
                        value={logistics.pickup_type || 'hotel'}
                        onChange={(e) => setLogistics(prev => ({ ...prev, pickup_type: e.target.value as any }))}
                        className="mt-1 w-full h-10 rounded-md border border-sky-blue bg-white px-3 py-2 text-sm"
                      >
                        <option value="hotel">Already in Phuket</option>
                        <option value="airport">Flight to Phuket</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {logistics.pickup_type === 'airport' && (
                      <>
                        <div>
                          <Label htmlFor="flight">Flight Number</Label>
                          <Input id="flight" value={logistics.flight_number || ''} onChange={(e) => setLogistics(prev => ({ ...prev, flight_number: e.target.value }))} className="mt-1 bg-white border-sky-blue" />
                        </div>
                        <div>
                          <Label htmlFor="time">Arrival Time</Label>
                          <Input type="time" id="time" value={logistics.pickup_time || ''} onChange={(e) => setLogistics(prev => ({ ...prev, pickup_time: e.target.value }))} className="mt-1 bg-white border-sky-blue" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <Label htmlFor="accommodation">Where are you staying?</Label>
                  <Input id="accommodation" value={logistics.accommodation_name || ''} onChange={(e) => setLogistics(prev => ({ ...prev, accommodation_name: e.target.value }))} className="mt-1 bg-white border-sky-blue" />
                </div>

                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={logistics.notes || ''} onChange={(e) => setLogistics(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 bg-white border-sky-blue" />
                </div>

                <div className="sticky-button-bar flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      backgroundColor: 'white',
                      color: 'rgb(0, 119, 182)',
                      border: '1px solid rgb(125, 211, 252)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    Back
                  </button>
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-ocean-blue hover:bg-navy-blue text-white flex-1">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    {isCompleted ? 'Update Info' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestInfoForm;
