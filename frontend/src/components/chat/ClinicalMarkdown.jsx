import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Activity, FileText, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

export function ClinicalMarkdown({ content, isPatient = false, className = '' }) {
  if (!content) return null;

  return (
    <div className={`clinical-markdown-renderer text-xs sm:text-[13px] text-slate-800 leading-relaxed space-y-2.5 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // H1, H2, H3 Headings
          h1: ({ node, ...props }) => (
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 mt-2 mb-2 pb-1.5 border-b border-blue-100">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <h1 {...props} />
            </div>
          ),
          h2: ({ node, ...props }) => (
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 mt-2.5 mb-1 pb-1 border-b border-blue-100">
              <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <h2 {...props} />
            </div>
          ),
          h3: ({ node, ...props }) => (
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-[13px] text-slate-900 mt-2 mb-1">
              <span className="w-1.5 h-3.5 rounded-full bg-blue-600 shrink-0" />
              <h3 className="tracking-tight" {...props} />
            </div>
          ),
          h4: ({ node, ...props }) => (
            <h4 className="font-semibold text-xs text-slate-900 mt-2 mb-0.5" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed text-slate-700 last:mb-0" {...props} />
          ),

          // Strong / Bold text
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-slate-900" {...props} />
          ),

          // Unordered list
          ul: ({ node, ...props }) => (
            <ul className="space-y-1.5 my-2 pl-1.5" {...props} />
          ),

          // Ordered list
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-2 pl-1 text-slate-700" {...props} />
          ),

          // List item
          li: ({ node, ...props }) => (
            <li className="flex items-start gap-2 text-slate-700" {...props}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1 leading-snug">{props.children}</div>
            </li>
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-2xl border border-blue-100 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-blue-50/70 border-b border-blue-100 text-blue-900 font-semibold" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-100 bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-blue-50/40 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2 text-[11px] uppercase tracking-wider font-semibold text-blue-800" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2 text-slate-700 font-medium whitespace-nowrap" {...props} />
          ),

          // Blockquote / Clinical callout
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-2 p-3 rounded-2xl border-l-4 border-blue-600 bg-blue-50/60 text-blue-950 text-xs leading-relaxed"
              {...props}
            />
          ),

          // Code blocks & inline code
          code: ({ node, inline, ...props }) => (
            <code
              className="px-2 py-0.5 rounded-md bg-blue-50 font-mono text-[11px] text-blue-800 font-medium border border-blue-100"
              {...props}
            />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-blue-600 hover:text-blue-800"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
