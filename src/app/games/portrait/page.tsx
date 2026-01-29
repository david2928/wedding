'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Check, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'
import { compressImage, validateImageFile } from '@/lib/utils/imageCompression'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'

type Party = Tables<'parties'>

export default function PortraitUploadPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // Dev mode bypass
  const handleDevBypass = async () => {
    enableDevMode() // Persist in sessionStorage
    setDevMode(true)
    await loadData(null as any)
  }

  useEffect(() => {
    // Check if dev mode was previously enabled in this session
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
      loadData(null as any)
      return
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false) // Stop loading after auth check

      if (session?.user) {
        await loadData(session.user)
      }
    }
    checkAuth()
  }, [])

  const loadData = async (currentUser: User | null) => {
    try {
      setLoading(true)

      // Get party for this user
      let partyData: Party | null = null

      if (devMode || process.env.NODE_ENV === 'development') {
        // Dev mode: Use first party for testing
        const { data: anyParty } = await supabase
          .from('parties')
          .select('*')
          .limit(1)
          .single()

        if (anyParty) {
          partyData = anyParty
          setParty(anyParty)
        } else {
          setError('No parties found in database.')
          setLoading(false)
          return
        }
      } else if (currentUser) {
        // Production: Get party for authenticated user
        const { data: userParty, error: partyError } = await supabase
          .from('parties')
          .select('*')
          .eq('google_user_id', currentUser.id)
          .single()

        if (partyError || !userParty) {
          setError('Could not find your party. Please contact support.')
          setLoading(false)
          return
        }

        partyData = userParty
        setParty(userParty)
      }

      if (!partyData) {
        setError('Could not load party data.')
        setLoading(false)
        return
      }

      // Check if already completed
      const { data: existingCompletion } = await supabase
        .from('game_completions')
        .select('*')
        .eq('party_id', partyData.id)
        .eq('station_id', 'portrait')
        .maybeSingle()

      if (existingCompletion) {
        setAlreadyCompleted(true)
        setUploadedPhotoUrl(existingCompletion.photo_url)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file using utility
    const validationError = validateImageFile(file, 10)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !party) return

    try {
      setUploading(true)
      setError(null)

      // Compress image before upload (saves ~80% storage!)
      console.log('🗜️ Compressing image...')
      const compressedFile = await compressImage(selectedFile)

      // Create unique filename (always .jpg after compression)
      const fileName = `${party.id}_${Date.now()}.jpg`
      const filePath = `${fileName}`

      // Upload compressed file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('portrait-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portrait-photos')
        .getPublicUrl(filePath)

      // Mark game as complete with photo URL
      const { error: insertError } = await supabase
        .from('game_completions')
        .insert({
          party_id: party.id,
          station_id: 'portrait',
          completed_by_google_id: user?.id || 'dev-mode-user',
          photo_url: publicUrl
        })

      if (insertError) {
        // If already exists, update it
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('game_completions')
            .update({ photo_url: publicUrl })
            .eq('party_id', party.id)
            .eq('station_id', 'portrait')

          if (updateError) throw updateError
        } else {
          throw insertError
        }
      }

      // Success!
      setAlreadyCompleted(true)
      setUploadedPhotoUrl(publicUrl)
      setUploading(false)

    } catch (err: any) {
      console.error('Error uploading photo:', err)
      setError(err.message || 'Failed to upload photo. Please try again.')
      setUploading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/games/portrait`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setSigningIn(false)
    }
  }

  const handleMarkInProgress = async () => {
    if (!party) return

    try {
      setUploading(true)
      setError(null)

      // Mark game as complete without photo (notes indicate pictures coming later)
      const { error: insertError } = await supabase
        .from('game_completions')
        .insert({
          party_id: party.id,
          station_id: 'portrait',
          completed_by_google_id: user?.id || 'dev-mode-user',
          notes: 'Pictures still in progress - to be received later'
        })

      if (insertError) {
        if (insertError.code === '23505') {
          // Already completed
          setAlreadyCompleted(true)
        } else {
          throw insertError
        }
      } else {
        setAlreadyCompleted(true)
        setUploadedPhotoUrl(null) // No photo uploaded
      }

      setUploading(false)
    } catch (err: any) {
      console.error('Error marking as in progress:', err)
      setError(err.message || 'Failed to mark as complete. Please try again.')
      setUploading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user && !devMode) {
    const isDev = process.env.NODE_ENV === 'development'

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-crimson text-4xl italic mb-2">Portrait Photo</h1>
            <p className="text-white/90">Sign in to upload</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Authentication Required
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Please sign in with Google to upload your portrait photo.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg"
              >
                {signingIn ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : 'Sign in with Google'}
              </Button>

              {isDev && (
                <Button
                  onClick={handleDevBypass}
                  variant="outline"
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  🔧 Dev Mode Bypass
                </Button>
              )}
            </div>
            {isDev && (
              <p className="text-xs text-orange-600 mt-4">
                Development mode active - bypass available
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Already completed
  if (alreadyCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center" style={{ border: '2px solid #86efac' }}>
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-deep-blue mb-2">
            {uploadedPhotoUrl ? 'Photo Uploaded!' : 'Game Completed!'}
          </h1>
          <p className="text-deep-blue/70 mb-6">
            {uploadedPhotoUrl
              ? 'Your beautiful portrait photo has been saved.'
              : 'You can upload your portrait photo later when you receive it.'}
          </p>

          {/* Show uploaded photo if available */}
          {uploadedPhotoUrl && (
            <div className="mb-6">
              <img
                src={uploadedPhotoUrl}
                alt="Uploaded portrait"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              <Check className="w-4 h-4 inline mr-1" />
              Game completed! Your progress has been saved.
            </p>
          </div>

          <Button
            onClick={() => router.push('/games')}
            className="bg-ocean-blue hover:bg-navy-blue"
          >
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  // Upload form
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Icon in container matching game cards */}
          <div className="rounded-2xl shadow-lg p-6 max-w-xs mx-auto mb-6" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src="/games/portrait-icon.png?v=6"
                alt="Portrait Time"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
          <h1 className="font-crimson text-4xl md:text-5xl italic text-ocean-blue mb-2">
            Portrait Time
          </h1>
          <p className="text-deep-blue/70">
            Upload the artist's portrait drawing of you
          </p>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl shadow-2xl p-6 md:p-8" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
          <div className="space-y-6">
            {/* File input */}
            <div>
              <Label htmlFor="photo-upload" className="text-base font-semibold text-deep-blue mb-2 block">
                Select Photo
              </Label>
              <div className="border-2 border-dashed border-sky-blue rounded-lg p-8 text-center hover:border-ocean-blue transition-colors cursor-pointer">
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {previewUrl ? (
                    <div>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg mb-4"
                      />
                      <p className="text-ocean-blue font-medium">Click to change photo</p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-16 h-16 text-sky-blue mx-auto mb-4" />
                      <p className="text-deep-blue font-medium mb-2">Click to select a photo</p>
                      <p className="text-sm text-deep-blue/60">
                        JPEG, PNG, or WebP • Max 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Upload button */}
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/games')}
                variant="outline"
                className="flex-1 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 bg-ocean-blue hover:bg-navy-blue text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>

            {/* Pictures in progress option */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm text-deep-blue/60 text-center mb-3">
                Don't have the picture yet?
              </p>
              <Button
                onClick={handleMarkInProgress}
                variant="outline"
                disabled={uploading}
                className="w-full border-gray-300 text-deep-blue/70 hover:bg-gray-50"
              >
                Mark as Complete (Pictures Coming Later)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
