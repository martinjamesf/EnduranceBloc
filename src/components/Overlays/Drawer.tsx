export default function Drawer({ children }: { children: React.ReactNode }) {
  return <aside className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 p-4 shadow-lg">{children}</aside>
}