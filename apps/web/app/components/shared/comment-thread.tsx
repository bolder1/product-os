'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  AtSign,
  CheckCircle,
  Send,
  Reply,
  CornerDownRight,
  X,
} from 'lucide-react'
import { useCommentStore, parseMentions, type Comment } from '../../lib/comment-store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KNOWN_USERS = [
  'surajit', 'admin', 'alex', 'taylor', 'jordan', 'sam', 'casey', 'morgan',
]

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  )
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Render body text with @mentions highlighted */
function RichBody({ body }: { body: string }) {
  const parts = body.split(/(@\w+)/g)
  return (
    <p className="text-sm text-[#CBD5E1] leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-[#8B5CF6] font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Single Comment Row
// ---------------------------------------------------------------------------

interface CommentRowProps {
  comment: Comment
  isReply?: boolean
  onReply: (id: string) => void
  onResolve: (id: string) => void
}

function CommentRow({ comment, isReply, onReply, onResolve }: CommentRowProps) {
  const allComments = useCommentStore((s) => s.comments)
  const replies = useMemo(
    () => allComments.filter((c) => c.parentId === comment.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allComments, comment.id]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={isReply ? 'ml-8 pl-3 border-l-2 border-[#6366F1]/30' : ''}
    >
      <div className="group flex gap-3 py-2.5">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white leading-none">
            {comment.authorInitials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-[#F1F5F9]">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-[#64748B]">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#10B981] font-medium">
                <CheckCircle size={10} />
                Resolved
              </span>
            )}
          </div>

          {/* Body */}
          <RichBody body={comment.body} />

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                <Reply size={11} />
                Reply
              </button>
            )}
            {!comment.resolved && !comment.parentId && (
              <button
                onClick={() => onResolve(comment.id)}
                className="flex items-center gap-1 text-[10px] text-[#64748B] hover:text-[#10B981] transition-colors"
              >
                <CheckCircle size={11} />
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thread replies */}
      {!isReply && replies.length > 0 && (
        <div className="space-y-0">
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isReply
              onReply={onReply}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Mention Autocomplete
// ---------------------------------------------------------------------------

function MentionPopup({
  query,
  onSelect,
  onClose,
}: {
  query: string
  onSelect: (username: string) => void
  onClose: () => void
}) {
  const filtered = KNOWN_USERS.filter((u) =>
    u.toLowerCase().startsWith(query.toLowerCase())
  )

  if (filtered.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute bottom-full left-0 mb-1 bg-[#0A0F1E] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden z-50"
    >
      {filtered.map((user) => (
        <button
          key={user}
          onClick={() => onSelect(user)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-white/[0.06] transition-colors"
        >
          <AtSign size={12} className="text-[#8B5CF6]" />
          {user}
        </button>
      ))}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main CommentThread Component
// ---------------------------------------------------------------------------

interface CommentThreadProps {
  entityId: string
  entityType: string
  productId: string
  studio: string
  authorId?: string
  authorName?: string
  authorInitials?: string
}

export function CommentThread({
  entityId,
  entityType,
  productId,
  studio,
  authorId = 'user-1',
  authorName = 'You',
  authorInitials = 'Y',
}: CommentThreadProps) {
  const [body, setBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const allComments = useCommentStore((s) => s.comments)
  const comments = useMemo(
    () => allComments.filter((c) => c.entityId === entityId && !c.parentId),
    [allComments, entityId]
  )
  const addComment = useCommentStore((s) => s.addComment)
  const resolveComment = useCommentStore((s) => s.resolveComment)

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [comments]
  )

  const handleSubmit = useCallback(() => {
    const trimmed = body.trim()
    if (!trimmed) return

    addComment({
      entityId,
      entityType,
      productId,
      studio,
      body: trimmed,
      authorId,
      authorName,
      authorInitials,
      parentId: replyingTo ?? undefined,
    })

    setBody('')
    setReplyingTo(null)
    setMentionQuery(null)
  }, [body, entityId, entityType, productId, studio, authorId, authorName, authorInitials, replyingTo, addComment])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setBody(val)

      // Detect @mention in progress
      const cursorPos = e.target.selectionStart
      const textUpToCursor = val.slice(0, cursorPos)
      const mentionMatch = textUpToCursor.match(/@(\w*)$/)
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1])
      } else {
        setMentionQuery(null)
      }
    },
    []
  )

  const handleMentionSelect = useCallback(
    (username: string) => {
      const cursorPos = inputRef.current?.selectionStart ?? body.length
      const textUpToCursor = body.slice(0, cursorPos)
      const rest = body.slice(cursorPos)
      const replaced = textUpToCursor.replace(/@(\w*)$/, `@${username} `)
      setBody(replaced + rest)
      setMentionQuery(null)
      inputRef.current?.focus()
    },
    [body]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} className="text-[#6366F1]" />
        <span className="text-xs font-medium text-[#94A3B8]">
          Comments
          {sortedComments.length > 0 && (
            <span className="ml-1 text-[#64748B]">({sortedComments.length})</span>
          )}
        </span>
      </div>

      {/* Comment list */}
      {sortedComments.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-2">
            <MessageSquare size={18} className="text-[#6366F1]" />
          </div>
          <p className="text-xs text-[#64748B]">No comments yet</p>
          <p className="text-[10px] text-[#475569] mt-0.5">
            Start the conversation
          </p>
        </div>
      ) : (
        <div className="space-y-0.5 mb-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {sortedComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <CommentRow
                  comment={comment}
                  onReply={(id) => setReplyingTo(id)}
                  onResolve={(id) => resolveComment(id, authorId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-[#6366F1] mb-1"
          >
            <CornerDownRight size={10} />
            <span>Replying to thread</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-1 p-0.5 rounded hover:bg-white/[0.06]"
            >
              <X size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose */}
      <div className="relative">
        <AnimatePresence>
          {mentionQuery !== null && (
            <MentionPopup
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setMentionQuery(null)}
            />
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... Use @ to mention"
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder-[#475569] resize-none outline-none min-h-[1.5rem] max-h-24"
          />
          <button
            onClick={handleSubmit}
            disabled={!body.trim()}
            className="p-1.5 rounded-md bg-[#6366F1] text-white hover:bg-[#5558E6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
