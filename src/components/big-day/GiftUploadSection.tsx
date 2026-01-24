'use client'

import React, { useState, useRef } from 'react'
import { Upload, Check, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { compressImage, validateImageFile } from '@/lib/utils/imageCompression'

interface GiftUploadSectionProps {
  partyId: string | null
  partyName?: string
}

export default function GiftUploadSection({ partyId, partyName }: GiftUploadSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a screenshot to upload')
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Compress image before upload
      console.log('🗜️ Compressing image...')
      const compressedFile = await compressImage(selectedFile)

      // Create unique filename
      const fileName = `${partyId || 'anonymous'}_${Date.now()}.jpg`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('gift-transfers')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gift-transfers')
        .getPublicUrl(fileName)

      // Save to database
      const { error: insertError } = await supabase
        .from('gift_submissions')
        .insert({
          party_id: partyId,
          party_name: partyName || 'Anonymous Guest',
          screenshot_url: publicUrl,
          message: message.trim() || null
        })

      if (insertError) {
        throw insertError
      }

      // Success
      setSuccess(true)
      setUploading(false)

    } catch (err: any) {
      console.error('Error uploading gift confirmation:', err)
      setError(err.message || 'Failed to upload. Please try again.')
      setUploading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Reset state after modal closes
    setTimeout(() => {
      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('')
      setError(null)
      setSuccess(false)
    }, 300)
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setMessage('')
    setError(null)
    setSuccess(false)
  }

  return (
    <>
      {/* Bank transfer link */}
      <div className="mt-8 mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white/60 hover:bg-white/80 border border-sky-blue/30 rounded-xl p-5 transition-all group"
        >
          <p className="text-ocean-blue font-medium mb-1">
            Made a bank transfer via QR?
          </p>
          <p className="text-deep-blue/60 text-sm group-hover:text-ocean-blue transition-colors">
            Upload your screenshot to let us know →
          </p>
        </button>
      </div>

      {/* Upload Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4" style={{ backgroundColor: '#FDFBF7' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-crimson text-ocean-blue text-center">
              {success ? 'Thank You!' : 'Bank Transfer Confirmation'}
            </DialogTitle>
          </DialogHeader>

          {success ? (
            // Success State
            <div className="text-center py-6">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-deep-blue/70 mb-6">
                We received your confirmation. Thank you for your generous gift!
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 border-ocean-blue text-ocean-blue hover:bg-ocean-blue/10"
                >
                  Submit Another
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-ocean-blue hover:bg-navy-blue text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            // Upload Form
            <div className="space-y-4">
              {/* Upload Area */}
              <div>
                <Label className="text-sm font-medium text-deep-blue mb-2 block">
                  Upload Screenshot
                </Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-blue rounded-lg p-6 text-center hover:border-ocean-blue transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-40 object-contain rounded-lg mb-2"
                      />
                      <p className="text-ocean-blue text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-sky-blue mx-auto mb-2" />
                      <p className="text-deep-blue/70 text-sm mb-1">
                        Drag & drop or click to select
                      </p>
                      <p className="text-deep-blue/50 text-xs">
                        JPEG, PNG, or WebP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Field (Optional) */}
              <div>
                <Label htmlFor="message" className="text-sm font-medium text-deep-blue mb-2 block">
                  Message <span className="text-deep-blue/50">(optional)</span>
                </Label>
                <Input
                  id="message"
                  type="text"
                  placeholder="Any message for us..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-white border-gray-200"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || uploading}
                className="w-full bg-ocean-blue hover:bg-navy-blue text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
