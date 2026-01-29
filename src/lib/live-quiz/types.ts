import type { Tables } from '@/lib/supabase/types'

export type LiveQuizSession = Tables<'live_quiz_sessions'>
export type LiveQuizAnswer = Tables<'live_quiz_answers'>
export type LiveQuizParticipant = Tables<'live_quiz_participants'>
export type QuizQuestion = Tables<'quiz_questions'>

export type SessionStatus = 'waiting' | 'active' | 'showing_answer' | 'completed'

export interface QuestionWithOptions {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string
  displayOrder: number
  imageUrl?: string
}

export interface ParticipantRanking {
  partyId: string
  partyName: string
  totalScore: number
  correctAnswers: number
  hasGamesBonus: boolean
  rank: number
}

export interface AnswerStats {
  total: number
  A: number
  B: number
  C: number
  D: number
  correctCount: number
  averageTimeMs: number
}

// Broadcast event types
export type LiveQuizEvent =
  | { type: 'quiz:started'; payload: QuizStartedPayload }
  | { type: 'quiz:question'; payload: QuizQuestionPayload }
  | { type: 'quiz:reveal'; payload: QuizRevealPayload }
  | { type: 'quiz:leaderboard'; payload: QuizLeaderboardPayload }
  | { type: 'quiz:ended'; payload: QuizEndedPayload }
  | { type: 'quiz:participant_joined'; payload: ParticipantJoinedPayload }
  | { type: 'quiz:answer_count'; payload: AnswerCountPayload }

export interface QuizStartedPayload {
  sessionId: string
  totalQuestions: number
}

export interface QuizQuestionPayload {
  index: number
  questionId: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  startedAt: string
  timeLimitSeconds: number
  imageUrl?: string
}

export interface QuizRevealPayload {
  questionId: string
  question: string
  index: number
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string
  stats: AnswerStats
}

export interface QuizLeaderboardPayload {
  rankings: ParticipantRanking[]
}

export interface QuizEndedPayload {
  winners: ParticipantRanking[]
  totalParticipants: number
}

export interface ParticipantJoinedPayload {
  participantCount: number
  partyName: string
}

export interface AnswerCountPayload {
  questionId: string
  answerCount: number
}

export interface GuestQuizState {
  status: 'connecting' | 'waiting' | 'question' | 'answered' | 'reveal' | 'leaderboard' | 'ended'
  sessionId: string | null
  currentQuestion: QuizQuestionPayload | null
  selectedAnswer: string | null
  isCorrect: boolean | null
  pointsEarned: number
  totalScore: number
  rankings: ParticipantRanking[]
  revealData: QuizRevealPayload | null
  participantCount: number
  hasGamesBonus: boolean
}

export interface AdminQuizState {
  status: 'idle' | 'waiting' | 'question' | 'revealing' | 'leaderboard' | 'ended'
  session: LiveQuizSession | null
  questions: QuestionWithOptions[]
  currentQuestionIndex: number
  participants: LiveQuizParticipant[]
  answerCount: number
  stats: AnswerStats | null
  rankings: ParticipantRanking[]
}
