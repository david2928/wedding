import imageCompression from 'browser-image-compression'

/**
 * Compression options for wedding photo uploads
 *
 * Storage considerations for wedding app:
 * - ~100 guests potentially uploading photos
 * - Supabase free tier: 1GB storage (paid: 100GB for $25/mo)
 * - Target: Max 1MB per photo (1000 photos = 1GB)
 * - Quality: 0.8 maintains good visual quality
 */
export interface CompressionOptions {
  /**
   * Maximum file size in MB
   * @default 1 (1MB per image)
   */
  maxSizeMB?: number

  /**
   * Maximum width/height in pixels
   * Images larger than this will be resized
   * @default 1920 (Full HD)
   */
  maxWidthOrHeight?: number

  /**
   * Use WebWorker for compression (non-blocking)
   * @default true
   */
  useWebWorker?: boolean

  /**
   * Image quality (0-1)
   * 0.8 = good balance between quality and size
   * @default 0.8
   */
  initialQuality?: number
}

/**
 * Compresses an image file to reduce storage usage
 *
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file)
 * // Upload compressed file to Supabase
 * await supabase.storage.from('photos').upload('path', compressed)
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // Max 1MB per image
    maxWidthOrHeight = 1920, // Full HD max resolution
    useWebWorker = true,
    initialQuality = 0.8, // Good quality, reasonable size
  } = options

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      initialQuality,
      fileType: 'image/jpeg', // Always convert to JPEG for better compression
    })

    // Log compression results for debugging
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2)
    const reductionPercent = (
      ((file.size - compressedFile.size) / file.size) *
      100
    ).toFixed(1)

    console.log(`📸 Image compressed:`)
    console.log(`   Original: ${originalSizeMB}MB`)
    console.log(`   Compressed: ${compressedSizeMB}MB`)
    console.log(`   Reduction: ${reductionPercent}%`)

    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    // If compression fails, return original file as fallback
    return file
  }
}

/**
 * Validates image file before upload
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum allowed size in MB (before compression)
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): string | null {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (JPEG, PNG, or WebP)'
  }

  // Check file size (before compression)
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB`
  }

  return null
}

/**
 * Storage estimates for wedding app
 *
 * Assumptions:
 * - 100 guests
 * - Average 2 photos per guest (sunset + selfie)
 * - 1MB per compressed photo
 *
 * Total: ~200MB (well within 1GB free tier)
 *
 * If uncompressed (avg 5MB per photo):
 * Total: ~1000MB (1GB - hitting limit!)
 *
 * Compression saves: ~80% storage (800MB saved)
 */
