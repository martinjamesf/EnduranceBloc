export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block px-2 py-1 rounded text-sm bg-slate-100 dark:bg-slate-700">{children}</span>
}