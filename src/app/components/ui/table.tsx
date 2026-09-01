import * as React from "react"

export function Table({ className = "", ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm text-left ${className}`} {...props} />
    </div>
  )
}

export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-[#1e293b] text-xs font-semibold uppercase tracking-wider text-gray-400 ${className}`} {...props} />
}

export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-[#1e293b]/50 ${className}`} {...props} />
}

export function TableRow({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`transition-colors hover:bg-[#1e293b]/40 ${className}`} {...props} />
}

export function TableHead({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`h-10 px-4 text-left align-middle font-medium text-gray-400 ${className}`} {...props} />
}

export function TableCell({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`p-4 align-middle text-gray-300 ${className}`} {...props} />
}
