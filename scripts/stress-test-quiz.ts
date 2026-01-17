/**
 * Live Quiz Stress Test Script
 *
 * Simulates multiple concurrent participants joining a live quiz session,
 * listening for events, and submitting answers.
 *
 * Usage:
 *   npm run stress-test -- --participants=50 --session=<session-id>
 *   npm run stress-test -- --realtime-only --participants=100 --create
 *
 * Or directly:
 *   npx tsx scripts/stress-test-quiz.ts --participants=50 --session=<session-id>
 *
 * Options:
 *   --participants=N    Number of virtual participants (default: 20)
 *   --session=ID        Live quiz session ID (optional, will find/create one)
 *   --create            Create a new test session automatically
 *   --realtime-only     Only test realtime subscriptions (no DB writes)
 *   --answer-delay=MS   Base delay before answering in ms (default: 2000)
 *   --answer-spread=MS  Random spread for answer timing (default: 5000)
 *
 * Modes:
 *   Default mode: Uses real parties from DB for realistic testing
 *   Realtime-only mode: Tests channel subscriptions without DB writes (for scale testing)
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Generate a deterministic UUID from a string (for consistent stress test IDs)
function generateUUID(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${['8', '9', 'a', 'b'][parseInt(hash[16], 16) % 4]}${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

// Load .env.local manually if environment variables aren't set
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (key && value && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

loadEnvFile()

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
  console.error('Make sure .env.local exists with these values')
  process.exit(1)
}

// Parse command line arguments
function parseArgs(): {
  participants: number
  sessionId: string | null
  createSession: boolean
  answerDelay: number
  answerSpread: number
  realtimeOnly: boolean
} {
  const args = process.argv.slice(2)
  const result = {
    participants: 20,
    sessionId: null as string | null,
    createSession: false,
    answerDelay: 2000,
    answerSpread: 5000,
    realtimeOnly: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--participants=')) {
      result.participants = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--session=')) {
      result.sessionId = arg.split('=')[1]
    } else if (arg === '--create') {
      result.createSession = true
    } else if (arg.startsWith('--answer-delay=')) {
      result.answerDelay = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--answer-spread=')) {
      result.answerSpread = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--realtime-only') {
      result.realtimeOnly = true
    }
  }

  return result
}

// Statistics tracking
interface Stats {
  connectionsAttempted: number
  connectionsSuccessful: number
  connectionsFailed: number
  messagesReceived: number
  answersSubmitted: number
  answersSuccessful: number
  answersFailed: number
  latencies: number[]
  errors: string[]
}

const stats: Stats = {
  connectionsAttempted: 0,
  connectionsSuccessful: 0,
  connectionsFailed: 0,
  messagesReceived: 0,
  answersSubmitted: 0,
  answersSuccessful: 0,
  answersFailed: 0,
  latencies: [],
  errors: [],
}

// Real party info for stress test
interface RealParty {
  id: string
  name: string
}

// Virtual participant
class VirtualParticipant {
  id: number
  name: string
  supabase: SupabaseClient
  channel: RealtimeChannel | null = null
  partyId: string
  partyName: string
  sessionId: string
  currentQuestionId: string | null = null
  questionStartTime: number = 0
  hasAnswered: boolean = false
  answerDelay: number
  answerSpread: number
  realtimeOnly: boolean

  constructor(
    id: number,
    sessionId: string,
    answerDelay: number,
    answerSpread: number,
    realtimeOnly: boolean,
    realParty?: RealParty
  ) {
    this.id = id
    this.realtimeOnly = realtimeOnly

    if (realParty) {
      // Use real party from database
      this.partyId = realParty.id
      this.partyName = realParty.name
      this.name = `[${id}] ${realParty.name}`
    } else {
      // Generate fake party for realtime-only mode
      this.partyId = generateUUID(`stress-test-party-${id}`)
      this.partyName = `StressTest-${id.toString().padStart(3, '0')}`
      this.name = this.partyName
    }

    this.sessionId = sessionId
    this.answerDelay = answerDelay
    this.answerSpread = answerSpread

    // Create a new Supabase client for each participant
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  async join(): Promise<boolean> {
    stats.connectionsAttempted++

    try {
      // Register as participant in the database (skip if realtime-only mode)
      if (!this.realtimeOnly) {
        const { error: participantError } = await this.supabase
          .from('live_quiz_participants')
          .upsert({
            session_id: this.sessionId,
            party_id: this.partyId,
            party_name: this.partyName,
            total_score: 0,
            correct_answers: 0,
          }, {
            onConflict: 'session_id,party_id',
          })

        if (participantError) {
          console.error(`[${this.name}] Failed to register:`, participantError.message)
          stats.connectionsFailed++
          stats.errors.push(`${this.name}: ${participantError.message}`)
          return false
        }
      }

      // Subscribe to the realtime channel
      this.channel = this.supabase.channel(`live-quiz:${this.sessionId}`, {
        config: {
          broadcast: { self: false },
        },
      })

      this.channel
        .on('broadcast', { event: 'quiz:question' }, (payload: any) => {
          this.handleQuestion(payload)
        })
        .on('broadcast', { event: 'quiz:reveal' }, (payload: any) => {
          this.handleReveal(payload)
        })
        .on('broadcast', { event: 'quiz:ended' }, () => {
          this.handleEnd()
        })

      await new Promise<void>((resolve, reject) => {
        this.channel!.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            stats.connectionsSuccessful++
            console.log(`[${this.name}] Connected successfully`)
            resolve()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            stats.connectionsFailed++
            stats.errors.push(`${this.name}: Subscription status ${status}`)
            reject(new Error(status))
          }
        })
      })

      return true
    } catch (error) {
      stats.connectionsFailed++
      const message = error instanceof Error ? error.message : 'Unknown error'
      stats.errors.push(`${this.name}: ${message}`)
      console.error(`[${this.name}] Connection error:`, message)
      return false
    }
  }

  handleQuestion(payload: any) {
    stats.messagesReceived++
    const receiveTime = Date.now()
    const serverTime = new Date(payload.payload.startedAt).getTime()
    const latency = receiveTime - serverTime
    stats.latencies.push(latency)

    this.currentQuestionId = payload.payload.questionId
    this.questionStartTime = serverTime
    this.hasAnswered = false

    console.log(`[${this.name}] Received question ${payload.payload.index + 1} (latency: ${latency}ms)`)

    // Schedule random answer
    const delay = this.answerDelay + Math.random() * this.answerSpread
    setTimeout(() => this.submitAnswer(), delay)
  }

  async submitAnswer() {
    if (this.hasAnswered || !this.currentQuestionId) return
    this.hasAnswered = true
    stats.answersSubmitted++

    const answers = ['A', 'B', 'C', 'D']
    const randomAnswer = answers[Math.floor(Math.random() * answers.length)]
    const timeTaken = Date.now() - this.questionStartTime

    // In realtime-only mode, just log the answer without DB submission
    if (this.realtimeOnly) {
      stats.answersSuccessful++
      console.log(`[${this.name}] Would answer ${randomAnswer} in ${timeTaken}ms (realtime-only mode)`)
      return
    }

    try {
      // Submit answer to database
      const { error } = await this.supabase
        .from('live_quiz_answers')
        .upsert({
          session_id: this.sessionId,
          question_id: this.currentQuestionId,
          party_id: this.partyId,
          answer: randomAnswer,
          is_correct: false, // Will be set correctly by actual logic
          time_taken_ms: timeTaken,
          points_earned: 0,
        }, {
          onConflict: 'session_id,question_id,party_id',
        })

      if (error) {
        stats.answersFailed++
        stats.errors.push(`${this.name} answer: ${error.message}`)
        console.error(`[${this.name}] Answer failed:`, error.message)
      } else {
        stats.answersSuccessful++
        console.log(`[${this.name}] Answered ${randomAnswer} in ${timeTaken}ms`)
      }
    } catch (error) {
      stats.answersFailed++
      const message = error instanceof Error ? error.message : 'Unknown error'
      stats.errors.push(`${this.name} answer: ${message}`)
    }
  }

  handleReveal(payload: any) {
    stats.messagesReceived++
    console.log(`[${this.name}] Answer revealed: ${payload.payload.correctAnswer}`)
  }

  handleEnd() {
    stats.messagesReceived++
    console.log(`[${this.name}] Quiz ended`)
  }

  async disconnect() {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
    }
  }
}

// Create a test session if needed
async function createTestSession(supabase: SupabaseClient): Promise<string> {
  console.log('Creating test session...')

  const { data, error } = await supabase
    .from('live_quiz_sessions')
    .insert({
      status: 'waiting',
      current_question_index: 0,
      time_limit_seconds: 30,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create session:', error.message)
    process.exit(1)
  }

  console.log(`Created session: ${data.id}`)
  return data.id
}

// Get existing waiting session
async function getWaitingSession(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from('live_quiz_sessions')
    .select('id')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.id || null
}

// Clean up stress test data
async function cleanup(supabase: SupabaseClient, sessionId: string, participantCount: number) {
  console.log('\nCleaning up stress test data...')

  // Generate the same UUIDs used during the test
  const stressTestPartyIds = Array.from({ length: participantCount }, (_, i) =>
    generateUUID(`stress-test-party-${i + 1}`)
  )

  // Remove stress test participants by party_name pattern
  const { error: partError } = await supabase
    .from('live_quiz_participants')
    .delete()
    .like('party_name', 'StressTest-%')
    .eq('session_id', sessionId)

  if (partError) {
    console.log('  Participants cleanup error:', partError.message)
  } else {
    console.log('  Participants cleaned up')
  }

  // Remove stress test answers by party_id (using the generated UUIDs)
  const { error: ansError } = await supabase
    .from('live_quiz_answers')
    .delete()
    .in('party_id', stressTestPartyIds)
    .eq('session_id', sessionId)

  if (ansError) {
    console.log('  Answers cleanup error:', ansError.message)
  } else {
    console.log('  Answers cleaned up')
  }

  console.log('Cleanup complete')
}

// Print final statistics
function printStats() {
  console.log('\n' + '='.repeat(60))
  console.log('STRESS TEST RESULTS')
  console.log('='.repeat(60))

  console.log('\nConnections:')
  console.log(`  Attempted:  ${stats.connectionsAttempted}`)
  console.log(`  Successful: ${stats.connectionsSuccessful}`)
  console.log(`  Failed:     ${stats.connectionsFailed}`)
  console.log(`  Success %:  ${((stats.connectionsSuccessful / stats.connectionsAttempted) * 100).toFixed(1)}%`)

  console.log('\nMessages:')
  console.log(`  Received: ${stats.messagesReceived}`)

  console.log('\nAnswers:')
  console.log(`  Submitted:  ${stats.answersSubmitted}`)
  console.log(`  Successful: ${stats.answersSuccessful}`)
  console.log(`  Failed:     ${stats.answersFailed}`)
  if (stats.answersSubmitted > 0) {
    console.log(`  Success %:  ${((stats.answersSuccessful / stats.answersSubmitted) * 100).toFixed(1)}%`)
  }

  if (stats.latencies.length > 0) {
    const sorted = [...stats.latencies].sort((a, b) => a - b)
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    console.log('\nLatency (ms):')
    console.log(`  Min:    ${min}`)
    console.log(`  Max:    ${max}`)
    console.log(`  Avg:    ${avg.toFixed(1)}`)
    console.log(`  Median: ${median}`)
    console.log(`  P95:    ${p95}`)
  }

  if (stats.errors.length > 0) {
    console.log('\nErrors (first 10):')
    stats.errors.slice(0, 10).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`)
    })
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

// Fetch real parties from database
async function fetchRealParties(supabase: SupabaseClient, limit: number): Promise<RealParty[]> {
  const { data, error } = await supabase
    .from('parties')
    .select('id, name')
    .limit(limit)

  if (error) {
    console.error('Failed to fetch parties:', error.message)
    return []
  }

  return data || []
}

// Main function
async function main() {
  const config = parseArgs()

  console.log('Live Quiz Stress Test')
  console.log('=====================')
  console.log(`Participants: ${config.participants}`)
  console.log(`Answer delay: ${config.answerDelay}ms + 0-${config.answerSpread}ms random`)
  console.log(`Mode: ${config.realtimeOnly ? 'Realtime-only (no DB writes)' : 'Full (with DB registration/answers)'}`)

  // Create admin client for session management
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Get or create session
  let sessionId = config.sessionId

  if (!sessionId && config.createSession) {
    sessionId = await createTestSession(adminClient)
  } else if (!sessionId) {
    sessionId = await getWaitingSession(adminClient)
  }

  if (!sessionId) {
    console.error('\nNo session ID provided and no waiting session found.')
    console.error('Use --session=<id> or --create to specify a session.')
    console.error('\nTo find an existing session, run the admin at /admin-live-quiz')
    process.exit(1)
  }

  console.log(`Session: ${sessionId}`)
  console.log('')

  // Fetch real parties if not in realtime-only mode
  let realParties: RealParty[] = []
  if (!config.realtimeOnly) {
    console.log('Fetching real parties from database...')
    realParties = await fetchRealParties(adminClient, config.participants)

    if (realParties.length === 0) {
      console.error('\nNo parties found in database.')
      console.error('Use --realtime-only to test without DB registration,')
      console.error('or ensure parties exist in the database.')
      process.exit(1)
    }

    if (realParties.length < config.participants) {
      console.log(`Note: Only ${realParties.length} parties available, will use all of them.`)
      config.participants = realParties.length
    }

    console.log(`Found ${realParties.length} parties\n`)
  }

  // Create virtual participants
  const participants: VirtualParticipant[] = []

  console.log('Creating participants...')
  for (let i = 0; i < config.participants; i++) {
    const realParty = realParties[i] // undefined if realtime-only
    participants.push(new VirtualParticipant(
      i + 1,
      sessionId,
      config.answerDelay,
      config.answerSpread,
      config.realtimeOnly,
      realParty
    ))
  }

  // Connect participants in batches to avoid overwhelming the server
  console.log('\nConnecting participants...')
  const batchSize = 10
  for (let i = 0; i < participants.length; i += batchSize) {
    const batch = participants.slice(i, i + batchSize)
    await Promise.all(batch.map(p => p.join()))
    console.log(`Connected ${Math.min(i + batchSize, participants.length)}/${participants.length}`)

    // Small delay between batches
    if (i + batchSize < participants.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('\n' + '-'.repeat(60))
  console.log('All participants connected. Waiting for quiz events...')
  console.log('Start the quiz from /admin-live-quiz')
  console.log('Press Ctrl+C to stop and see results')
  console.log('-'.repeat(60) + '\n')

  // Handle graceful shutdown
  let shuttingDown = false
  const shutdown = async () => {
    if (shuttingDown) return
    shuttingDown = true

    console.log('\n\nShutting down...')

    // Disconnect all participants
    await Promise.all(participants.map(p => p.disconnect()))

    // Print stats
    printStats()

    // Skip cleanup in realtime-only mode (nothing to clean)
    if (config.realtimeOnly) {
      console.log('\nRealtime-only mode: no cleanup needed.')
      process.exit(0)
    }

    // Ask about cleanup
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('\nClean up stress test data from database? (y/N) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await cleanup(adminClient, sessionId!, config.participants)
      }
      rl.close()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Keep the process running
  await new Promise(() => {})
}

main().catch(console.error)
