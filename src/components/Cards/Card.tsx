export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="p-4 rounded shadow-sm bg-white dark:bg-slate-800">{children}</div>
}