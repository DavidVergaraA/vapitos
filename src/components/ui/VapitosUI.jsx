import { X } from 'lucide-react'

export function Card({ children, className = '' }) {
  return <section className={`rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,.35)] ${className}`}>{children}</section>
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.slate}`}>{children}</span>
}

export function Modal({ title, onClose, children, wide = false }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center">
    <div className={`max-h-[94vh] w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:p-7`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"><X size={20}/></button>
      </div>
      {children}
    </div>
  </div>
}

export function Field({ label, hint, children }) {
  return <label className="block space-y-2 text-sm font-bold text-slate-700"><span>{label}</span>{children}{hint && <span className="block text-xs font-medium text-slate-400">{hint}</span>}</label>
}

export const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'
