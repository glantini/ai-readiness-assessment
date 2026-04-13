'use client'

import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export type SortState<K extends string> = {
  key: K
  direction: SortDirection
}

export function useSort<K extends string>(initial: SortState<K>) {
  const [sort, setSort] = useState<SortState<K>>(initial)

  function toggle(key: K) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  return { sort, toggle }
}

export function useSortedRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  accessors: Record<K, (row: T) => string | number | null | undefined>
) {
  return useMemo(() => {
    const accessor = accessors[sort.key]
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = accessor(a)
      const vb = accessor(b)
      const aNull = va === null || va === undefined || va === ''
      const bNull = vb === null || vb === undefined || vb === ''
      if (aNull && bNull) return 0
      if (aNull) return 1
      if (bNull) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir
      }
      return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' }) * dir
    })
  }, [rows, sort, accessors])
}

export function SortableHeader<K extends string>({
  sortKey,
  activeSort,
  onToggle,
  align = 'left',
  className = '',
  children,
}: {
  sortKey: K
  activeSort: SortState<K>
  onToggle: (key: K) => void
  align?: 'left' | 'center' | 'right'
  className?: string
  children: React.ReactNode
}) {
  const isActive = activeSort.key === sortKey
  const arrow = isActive ? (activeSort.direction === 'asc' ? '▲' : '▼') : ''

  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  const flexCls =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <th
      scope="col"
      className={`px-4 py-3 ${alignCls} text-xs font-medium uppercase tracking-wider text-gray-500 ${className}`}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={`group inline-flex items-center gap-1 ${flexCls} uppercase tracking-wider hover:text-gray-700`}
      >
        <span>{children}</span>
        <span
          className={`text-[10px] ${isActive ? 'text-gray-700' : 'text-transparent group-hover:text-gray-300'}`}
          aria-hidden="true"
        >
          {arrow || '▲'}
        </span>
      </button>
    </th>
  )
}
