export default function Block({ title, type }: { title: string; type?: string }) {
  return (
    <div className="p-2 rounded-md border" data-type={type}>
      <strong>{title}</strong>
    </div>
  )
}