'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
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
    <p className="text-[12px] text-[var(--text-primary)] leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-[var(--accent-text)] font-medium">
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
    <div className={isReply ? 'ml-8 pl-3 border-l-2 border-[var(--accent)]/30' : ''}>
      <div className="group flex gap-3 py-2">
        {/* Avatar */}
        <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)]/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-[var(--accent-text)] leading-none">
            {comment.authorInitials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-medium text-[var(--text-primary)]">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
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
                className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Reply size={11} />
                Reply
              </button>
            )}
            {!comment.resolved && !comment.parentId && (
              <button
                onClick={() => onResolve(comment.id)}
                className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-emerald-400 transition-colors"
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
    </div>
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
    <div
      className="absolute bottom-full left-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-xl overflow-hidden z-50"
    >
      {filtered.map((user) => (
        <button
          key={user}
          onClick={() => onSelect(user)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <AtSign size={12} className="text-[var(--accent-text)]" />
          {user}
        </button>
      ))}
    </div>
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
        <MessageSquare size={13} className="text-[var(--accent-text)]" />
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
          Comments
          {sortedComments.length > 0 && (
            <span className="ml-1 text-[var(--text-tertiary)]">({sortedComments.length})</span>
          )}
        </span>
      </div>

      {/* Comment list */}
      {sortedComments.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <MessageSquare size={16} className="text-[var(--text-tertiary)] mb-2" />
          <p className="text-[11px] text-[var(--text-tertiary)]">No comments yet</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
            Start the conversation
          </p>
        </div>
      ) : (
        <div className="space-y-0.5 mb-2 max-h-80 overflow-y-auto pr-1">
          {sortedComments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyingTo(id)}
              onResolve={(id) => resolveComment(id, authorId)}
            />
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent-text)] mb-1">
          <CornerDownRight size={10} />
          <span>Replying to thread</span>
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-1 p-0.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)]"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Compose */}
      <div className="relative">
        {mentionQuery !== null && (
          <MentionPopup
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setMentionQuery(null)}
          />
        )}

        <div className="flex items-end gap-2 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... Use @ to mention"
            rows={1}
            className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none min-h-[1.5rem] max-h-24"
          />
          <button
            onClick={handleSubmit}
            disabled={!body.trim()}
            className="tool-btn-primary p-1.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
