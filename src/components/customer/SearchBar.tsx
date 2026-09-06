'use client'

import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  primaryColor: string
}

export default function SearchBar({ value, onChange, primaryColor }: Props) {
  return (
    <div className="px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
      <div className="relative flex items-center">
        <span
          className="absolute left-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: primaryColor }}
        >
          <Search size={16} className="text-white" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar...."
          className="w-full pl-12 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
