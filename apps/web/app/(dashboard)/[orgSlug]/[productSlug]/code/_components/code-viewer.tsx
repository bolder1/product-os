'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Download, Sparkles, X, Check, ChevronRight } from 'lucide-react'
import { type FileNode, languageConfig } from '../_data/mock-files'

interface CodeViewerProps {
  openFiles: FileNode[]
  activeFile: FileNode | null
  onSelectFile: (path: string) => void
  onCloseFile: (path: string) => void
}

// Basic syntax highlighting - tokenizes code into colored spans
function highlightCode(code: string): { text: string; color: string }[][] {
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'from',
    'default', 'if', 'else', 'for', 'while', 'class', 'extends', 'new',
    'typeof', 'interface', 'type', 'as', 'async', 'await',
  ])

  const typeKeywords = new Set([
    'string', 'number', 'boolean', 'void', 'null', 'undefined', 'React',
    'ReactNode', 'Metadata', 'ClassValue', 'Record',
  ])

  return code.split('\n').map((line) => {
    const tokens: { text: string; color: string }[] = []

    // Comment line
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('/*') || line.trimStart().startsWith('*')) {
      tokens.push({ text: line, color: '#64748B' })
      return tokens
    }

    // Simple tokenization with regex
    const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*$|[a-zA-Z_$][\w$]*|[{}()\[\];,.:=<>+\-*/!?&|@#]+|\s+|\d+)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      const token = match[0]

      if (/^["'`]/.test(token)) {
        tokens.push({ text: token, color: '#10B981' })
      } else if (keywords.has(token)) {
        tokens.push({ text: token, color: '#8B5CF6' })
      } else if (typeKeywords.has(token)) {
        tokens.push({ text: token, color: '#06B6D4' })
      } else if (/^\d+$/.test(token)) {
        tokens.push({ text: token, color: '#F59E0B' })
      } else if (/^[{}()\[\];,.:=<>+\-*/!?&|@#]+$/.test(token)) {
        tokens.push({ text: token, color: '#64748B' })
      } else {
        tokens.push({ text: token, color: '#F1F5F9' })
      }
    }

    if (tokens.length === 0) {
      tokens.push({ text: line, color: '#F1F5F9' })
    }

    return tokens
  })
}

export function CodeViewer({ openFiles, activeFile, onSelectFile, onCloseFile }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const highlighted = useMemo(() => {
    if (!activeFile) return []
    return highlightCode(activeFile.content)
  }, [activeFile])

  const handleCopy = () => {
    if (!activeFile) return
    navigator.clipboard.writeText(activeFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!activeFile) return
    const blob = new Blob([activeFile.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeFile.name
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-2xl bg-[var(--bg-base)] border border-white/[0.08]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--accent)] text-xl font-mono">{'{}'}</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Select a file to view its code</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1">Click any file in the tree</p>
        </div>
      </div>
    )
  }

  const pathParts = activeFile.path.split('/')
  const lang = languageConfig[activeFile.language]

  return (
    <div className="flex-1 flex flex-col rounded-2xl bg-[var(--bg-base)] border border-white/[0.08] overflow-hidden">
      {/* Tab bar */}
      {openFiles.length > 0 && (
        <div className="flex items-center border-b border-white/[0.06] bg-white/[0.02] overflow-x-auto">
          {openFiles.map((file) => {
            const fileLang = languageConfig[file.language]
            const isActive = file.path === activeFile.path
            return (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-white/[0.06] cursor-pointer transition-colors min-w-0 ${
                  isActive
                    ? 'bg-[var(--bg-base)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]'
                }`}
              >
                <button
                  onClick={() => onSelectFile(file.path)}
                  className="flex items-center gap-2 min-w-0"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: fileLang?.color ?? '#64748B' }}
                  />
                  <span className="truncate">{file.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseFile(file.path)
                  }}
                  className="flex-shrink-0 hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1 text-xs">
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />}
              <span
                className={
                  i === pathParts.length - 1
                    ? 'text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-tertiary)]'
                }
              >
                {part}
              </span>
            </span>
          ))}
          <span
            className="ml-2 text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: lang?.color ?? '#64748B',
              backgroundColor: `${lang?.color ?? '#64748B'}15`,
            }}
          >
            {lang?.label ?? activeFile.language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Improve
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFile.path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-w-0"
          >
            {/* Line numbers */}
            <div className="flex-shrink-0 py-4 pr-4 pl-4 text-right select-none border-r border-white/[0.04]">
              {highlighted.map((_, i) => (
                <div
                  key={i}
                  className="text-xs leading-6 text-[var(--text-tertiary)]/50 font-mono"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code */}
            <pre className="flex-1 py-4 px-4 overflow-x-auto">
              <code>
                {highlighted.map((tokens, lineIdx) => (
                  <div key={lineIdx} className="text-xs leading-6 font-mono whitespace-pre">
                    {tokens.map((token, tokenIdx) => (
                      <span key={tokenIdx} style={{ color: token.color }}>
                        {token.text}
                      </span>
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
