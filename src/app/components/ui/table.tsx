import * as React from "react"

export function Table({ className = "", ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm text-left ${className}`} {...props} />
    </div>
  )
}

export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-slate-200 dark:border-white/30 text-xs font-semibold uppercase tracking-wider ${className}`} {...props} />
}

export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-100 dark:divide-white/20 ${className}`} {...props} />
}

export function TableRow({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b border-slate-100 dark:border-white/20 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05] ${className}`} {...props} />
}

export function TableHead({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`h-10 px-4 text-left align-middle font-medium ${className}`} {...props} />
}

export function TableCell({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`p-4 align-middle ${className}`} {...props} />
}
