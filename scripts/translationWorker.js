// Simple translation worker: pulls pending jobs, calls translator service, stores canonical workouts
// Usage: npm run worker:translate

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TRANSLATOR_URL = process.env.TRANSLATOR_SERVICE_URL || 'http://localhost:8000'
const FALLBACK_URL = process.env.FALLBACK_SERVICE_URL || 'http://localhost:3000/api/translator/fallback'
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL or service role key envs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchPendingJobs(limit = 5) {
  const { data, error } = await supabase
    .from('translator_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

async function markJobStatus(id, status, last_error = null) {
  const { error } = await supabase
    .from('translator_jobs')
    .update({ status, last_error, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function incrementAttempts(id) {
  const { data, error } = await supabase
    .from('translator_jobs')
    .select('attempts')
    .eq('id', id)
    .single()
  if (error) throw error
  const attempts = (data?.attempts || 0) + 1
  const { error: updErr } = await supabase
    .from('translator_jobs')
    .update({ attempts, updated_at: new Date().toISOString(), status: 'processing' })
    .eq('id', id)
  if (updErr) throw updErr
  return attempts
}

async function getRawWorkout(raw_workout_id) {
  const { data, error } = await supabase
    .from('raw_workouts')
    .select('*')
    .eq('id', raw_workout_id)
    .single()
  if (error) throw error
  return data
}

async function callTranslator(source, payload) {
  const res = await fetch(`${TRANSLATOR_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, payload }),
  })
  if (!res.ok) throw new Error(`Translator error: ${res.status} ${await res.text()}`)
  return await res.json()
}

async function callFallback(source, payload) {
  const res = await fetch(FALLBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, payload }),
  })
  if (!res.ok) throw new Error(`Fallback error: ${res.status} ${await res.text()}`)
  return await res.json()
}

function isLowConfidence(canonical) {
  const conf = canonical?.metadata?.confidence
  if (!conf) return false
  return Object.values(conf).some(v => typeof v === 'number' && v < CONFIDENCE_THRESHOLD)
}

async function insertCanonical(profile_id, raw_workout_id, canonical) {
  const row = {
    profile_id,
    raw_workout_id,
    source: canonical.source,
    type: canonical.type,
    subtype: canonical.subtype ?? null,
    duration_min: canonical.duration_min ?? null,
    distance_km: canonical.distance_km ?? null,
    intensity: canonical.intensity ?? null,
    structured: Boolean(canonical.structured),
    steps: canonical.steps ?? [],
    notes: canonical.notes ?? null,
    metadata: canonical.metadata ?? { raw_payload: {} },
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('workouts').insert(row).select().single()
  if (error) throw error
  return data
}

async function sendToDLQ(raw_workout_id, job_id, errorText, payload) {
  const { error } = await supabase
    .from('translator_dead_letter')
    .insert({ raw_workout_id, job_id, error: errorText, payload })
  if (error) throw error
}

async function processJob(job) {
  const attempts = await incrementAttempts(job.id)
  try {
    const raw = await getRawWorkout(job.raw_workout_id)
    let canonical = await callTranslator(raw.source, raw.payload)
    
    // Hybrid fallback: if confidence is low, retry with LLM
    if (isLowConfidence(canonical)) {
      console.log(`Job ${job.id}: low confidence, calling LLM fallback`)
      try {
        canonical = await callFallback(raw.source, raw.payload)
      } catch (fallbackErr) {
        console.warn(`Job ${job.id}: fallback failed, using original`, fallbackErr?.message)
      }
    }
    
    await insertCanonical(raw.profile_id, raw.id, canonical)
    await markJobStatus(job.id, 'succeeded')
    console.log(`Job ${job.id} succeeded`)
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err?.message || err)
    const raw = await getRawWorkout(job.raw_workout_id).catch(() => null)
    const payload = raw?.payload || null
    await sendToDLQ(job.raw_workout_id, job.id, err?.message || String(err), payload)
    const nextStatus = attempts >= 3 ? 'dead_letter' : 'failed'
    await markJobStatus(job.id, nextStatus, err?.message || String(err))
  }
}

async function runLoop() {
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 0)
  const once = intervalMs <= 0
  const tick = async () => {
    try {
      const jobs = await fetchPendingJobs(5)
      if (jobs.length === 0) {
        console.log('No pending jobs')
      }
      for (const job of jobs) {
        await processJob(job)
      }
    } catch (e) {
      console.error('Run loop error:', e)
    }
  }
  await tick()
  if (!once) {
    setInterval(tick, intervalMs)
  }
}

runLoop().catch((e) => {
  console.error('Worker error:', e)
  process.exit(1)
})
