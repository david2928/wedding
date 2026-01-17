'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Eye, EyeOff, QrCode, Users, Trophy, Download } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

type GameStation = Tables<'game_stations'>
type GameCompletion = Tables<'game_completions'>
type QuizSubmission = Tables<'quiz_submissions'>
type Party = Tables<'parties'>

export default function AdminGamesPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stations, setStations] = useState<GameStation[]>([])
  const [completions, setCompletions] = useState<GameCompletion[]>([])
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([])
  const [parties, setParties] = useState<Party[]>([])

  const qrCodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    // Simple password check (you can use environment variable for production)
    // For now, using a simple password - change this!
    if (password === 'wedding2026') {
      setIsAuthenticated(true)
    } else {
      setError('Incorrect password')
    }

    setLoading(false)
  }

  const loadData = async () => {
    try {
      const [stationsRes, completionsRes, submissionsRes, partiesRes] = await Promise.all([
        supabase.from('game_stations').select('*').order('display_order'),
        supabase.from('game_completions').select('*'),
        supabase.from('quiz_submissions').select('*').order('total_score', { ascending: false }),
        supabase.from('parties').select('*')
      ])

      if (stationsRes.data) setStations(stationsRes.data)
      if (completionsRes.data) setCompletions(completionsRes.data)
      if (submissionsRes.data) setQuizSubmissions(submissionsRes.data)
      if (partiesRes.data) setParties(partiesRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const getCompletionRate = (stationId: string) => {
    const totalParties = parties.length
    const completedCount = completions.filter(c => c.station_id === stationId).length
    return totalParties > 0 ? Math.round((completedCount / totalParties) * 100) : 0
  }

  const getPartyName = (partyId: string) => {
    const party = parties.find(p => p.id === partyId)
    return party ? party.name : 'Unknown'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const generateQRCodeUrl = (stationId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chanikadavidwedding.com'
    return `${baseUrl}/games/complete/${stationId}`
  }

  const handlePrintQRCodes = () => {
    window.print()
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <h1 className="font-dancing text-3xl text-ocean-blue mb-2">Admin Panel</h1>
              <p className="text-sm text-deep-blue/60 font-normal">Wedding Games Management</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter admin password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-blue/50 hover:text-deep-blue"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading || !password}
                className="w-full bg-ocean-blue hover:bg-navy-blue"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4 print:bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="font-dancing text-4xl text-ocean-blue mb-2">Games Admin</h1>
            <p className="text-deep-blue/60">Manage games, view stats, and generate QR codes</p>
          </div>
          <Button
            onClick={() => setIsAuthenticated(false)}
            variant="outline"
            className="border-ocean-blue text-ocean-blue"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 print:hidden">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Results</TabsTrigger>
            <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-ocean-blue" />
                      <div>
                        <div className="text-2xl font-bold text-deep-blue">{parties.length}</div>
                        <div className="text-sm text-deep-blue/60">Total Parties</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-ocean-blue" />
                      <div>
                        <div className="text-2xl font-bold text-deep-blue">{quizSubmissions.length}</div>
                        <div className="text-sm text-deep-blue/60">Quiz Submissions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-8 h-8 text-ocean-blue" />
                      <div>
                        <div className="text-2xl font-bold text-deep-blue">{completions.length}</div>
                        <div className="text-sm text-deep-blue/60">Game Completions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Game Completion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stations.map(station => {
                      const completionRate = getCompletionRate(station.station_id)
                      const completedCount = completions.filter(c => c.station_id === station.station_id).length

                      return (
                        <div key={station.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-deep-blue">{station.name}</span>
                            <span className="text-sm text-deep-blue/60">
                              {completedCount} / {parties.length} ({completionRate}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-ocean-blue h-2 rounded-full transition-all"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quiz Results Tab */}
          <TabsContent value="quiz">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {quizSubmissions.length === 0 ? (
                  <p className="text-center text-deep-blue/60 py-8">No quiz submissions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Rank</th>
                          <th className="text-left p-3">Party</th>
                          <th className="text-right p-3">Score</th>
                          <th className="text-right p-3">Time</th>
                          <th className="text-left p-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizSubmissions.map((submission, index) => (
                          <tr key={submission.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">#{index + 1}</td>
                            <td className="p-3">{getPartyName(submission.party_id)}</td>
                            <td className="p-3 text-right font-semibold text-ocean-blue">
                              {submission.total_score} pts
                            </td>
                            <td className="p-3 text-right text-sm">
                              {formatTime(submission.time_taken_seconds || 0)}
                            </td>
                            <td className="p-3 text-sm text-deep-blue/60">
                              {submission.completed_at
                                ? new Date(submission.completed_at).toLocaleString()
                                : 'In progress'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Codes Tab */}
          <TabsContent value="qrcodes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Station QR Codes</CardTitle>
                <Button
                  onClick={handlePrintQRCodes}
                  className="bg-ocean-blue hover:bg-navy-blue print:hidden"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print QR Codes
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stations.filter(s => s.is_active).map(station => (
                    <div
                      key={station.id}
                      className="border-2 border-gray-200 rounded-lg p-6 text-center break-inside-avoid"
                    >
                      <h3 className="font-dancing text-2xl text-ocean-blue mb-2">
                        {station.name}
                      </h3>
                      <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="w-32 h-32 text-ocean-blue" />
                        </div>
                      </div>
                      <p className="text-sm text-deep-blue/60 mb-2">Scan to complete</p>
                      <p className="text-xs text-deep-blue/40 font-mono break-all">
                        {generateQRCodeUrl(station.station_id)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> To generate actual QR codes, you'll need to use an online QR code generator
                    (like qrcode.com) or install a QR code library like `react-qr-code`. Copy the URLs above to generate
                    the QR codes for each station.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qrcodes, #qrcodes * {
            visibility: visible;
          }
          #qrcodes {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
