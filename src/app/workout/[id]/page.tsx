export default function WorkoutDetail({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <section className="p-6">
      <h2 className="text-xl font-semibold">Workout Detail (placeholder) — {id}</h2>
      <div className="mt-4">Drawer or detail view for a workout.</div>
    </section>
  )
}
