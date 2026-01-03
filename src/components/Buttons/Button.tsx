export default function Button({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`px-6 py-3 rounded-lg bg-cadenceOrange text-white font-medium hover:opacity-90 transition-opacity ${className}`}>{children}</button>
  )
}