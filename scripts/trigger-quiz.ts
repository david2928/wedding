/**
 * Trigger quiz events for stress testing
 * Usage: npx tsx scripts/trigger-quiz.ts <session-id>
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const sessionId = process.argv[2]

if (!sessionId) {
  console.error('Usage: npx tsx scripts/trigger-quiz.ts <session-id>')
  process.exit(1)
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Get quiz questions
  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .order('id')
    .limit(10) // Use 10 questions for the test

  if (error || !questions?.length) {
    console.error('Failed to fetch questions:', error?.message || 'No questions found')
    process.exit(1)
  }

  console.log(`Found ${questions.length} questions`)
  console.log(`Session: ${sessionId}`)
  console.log('')

  // Create channel
  const channel = supabase.channel(`live-quiz:${sessionId}`)
  await channel.subscribe()

  console.log('Channel subscribed. Starting quiz in 3 seconds...\n')
  await sleep(3000)

  // Broadcast quiz started
  console.log('Broadcasting: quiz:started')
  await channel.send({
    type: 'broadcast',
    event: 'quiz:started',
    payload: { totalQuestions: questions.length }
  })

  await sleep(1000)

  // Send each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const startedAt = new Date().toISOString()

    console.log(`\nBroadcasting: quiz:question ${i + 1}/${questions.length}`)
    console.log(`  Question: ${q.question.substring(0, 50)}...`)

    await channel.send({
      type: 'broadcast',
      event: 'quiz:question',
      payload: {
        index: i,
        questionId: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        startedAt,
      }
    })

    // Wait for answers (simulate 10 second question time)
    console.log('  Waiting 10 seconds for answers...')
    await sleep(10000)

    // Reveal answer
    console.log(`  Broadcasting: quiz:reveal (correct: ${q.correct_answer})`)
    await channel.send({
      type: 'broadcast',
      event: 'quiz:reveal',
      payload: {
        correctAnswer: q.correct_answer,
        stats: { A: 25, B: 25, C: 25, D: 25 } // Fake stats
      }
    })

    await sleep(3000)
  }

  // End quiz
  console.log('\nBroadcasting: quiz:ended')
  await channel.send({
    type: 'broadcast',
    event: 'quiz:ended',
    payload: { winners: [] }
  })

  console.log('\nQuiz complete!')
  await supabase.removeChannel(channel)
  process.exit(0)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
