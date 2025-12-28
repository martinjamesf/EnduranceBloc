export default function Button({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`px-4 py-2 rounded bg-cadenceOrange text-white ${className}`}>{children}</button>
  )
}