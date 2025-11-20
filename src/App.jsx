import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [form, setForm] = useState({
    title: '',
    type_code: 'PROJECT',
    department: 'IT',
    cost_centre: 'CC100',
    requester_email: 'alice@example.com',
    urgency: 'Normal',
    description: '',
    business_impact: '',
    alternatives: '',
    cost_estimate: 0,
    required_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState([])
  const [inbox, setInbox] = useState([])
  const [approverEmail, setApproverEmail] = useState('manager@example.com')

  const loadMy = async () => {
    const res = await fetch(`${API_BASE}/api/justifications?requester_email=${encodeURIComponent(form.requester_email)}`)
    const data = await res.json()
    setItems(data)
  }
  const loadInbox = async () => {
    const res = await fetch(`${API_BASE}/api/inbox?approver_email=${encodeURIComponent(approverEmail)}`)
    const data = await res.json()
    setInbox(data)
  }
  useEffect(() => {
    loadMy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    loadInbox()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approverEmail])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/justifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost_estimate: Number(form.cost_estimate) || 0 })
      })
      if (!res.ok) throw new Error('Failed to submit')
      setForm({ ...form, title: '', description: '' })
      await loadMy()
      await loadInbox()
    } finally {
      setSubmitting(false)
    }
  }

  const approve = async (taskId) => {
    await fetch(`${API_BASE}/api/approvals/${taskId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor_email: approverEmail }) })
    await loadInbox()
    await loadMy()
  }
  const reject = async (taskId) => {
    const reason = prompt('Rejection reason?')
    if (!reason) return
    await fetch(`${API_BASE}/api/approvals/${taskId}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor_email: approverEmail, comment: reason }) })
    await loadInbox()
    await loadMy()
  }
  const requestInfo = async (taskId) => {
    const reason = prompt('What more info is needed?')
    if (!reason) return
    await fetch(`${API_BASE}/api/approvals/${taskId}/request-info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor_email: approverEmail, reason }) })
    await loadInbox()
    await loadMy()
  }

  const createSampleRule = async () => {
    await fetch(`${API_BASE}/api/rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'IT Project Default', department: 'IT', type_code: 'PROJECT', approver_emails: ['manager@example.com', 'director@example.com'], spend_threshold: 0 }) })
    await loadInbox()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold">Justifi – MVP</h1>
        <p className="text-slate-400 mb-6">Submit a justification and route to approvers.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">New Justification</h2>
              <button onClick={createSampleRule} className="text-xs px-2 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded">Create Sample Routing Rule</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Type (e.g., PROJECT)" value={form.type_code} onChange={e=>setForm({...form,type_code:e.target.value})} />
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Cost Centre" value={form.cost_centre} onChange={e=>setForm({...form,cost_centre:e.target.value})} />
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Urgency" value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Requester Email" value={form.requester_email} onChange={e=>setForm({...form,requester_email:e.target.value})} />
                <input className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2" placeholder="Cost Estimate" type="number" value={form.cost_estimate} onChange={e=>setForm({...form,cost_estimate:e.target.value})} />
              </div>
              <button disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded px-3 py-2">{submitting ? 'Submitting...' : 'Submit'}</button>
            </form>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Approver Inbox</h2>
              <input className="text-sm bg-slate-800/60 border border-slate-700 rounded px-2 py-1" value={approverEmail} onChange={e=>setApproverEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              {inbox.map(({task, justification}) => (
                <div key={task.id} className="border border-slate-800 rounded p-3">
                  <div className="text-sm text-slate-300">{justification?.title} • {justification?.requester_email}</div>
                  <div className="text-xs text-slate-500">Step {task.step_index+1} • {task.status}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>approve(task.id)} className="px-2 py-1 text-xs rounded bg-emerald-600/20 border border-emerald-500/30">Approve</button>
                    <button onClick={()=>reject(task.id)} className="px-2 py-1 text-xs rounded bg-rose-600/20 border border-rose-500/30">Reject</button>
                    <button onClick={()=>requestInfo(task.id)} className="px-2 py-1 text-xs rounded bg-amber-600/20 border border-amber-500/30">Request Info</button>
                  </div>
                </div>
              ))}
              {inbox.length === 0 && <div className="text-sm text-slate-500">No items</div>}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold mb-2">My Submissions</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {items.map(j => (
              <div key={j.id} className="border border-slate-800 rounded p-3">
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-slate-500">{j.type_code} • {j.department} • {j.status}</div>
              </div>
            ))}
            {items.length===0 && <div className="text-sm text-slate-500">No submissions yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
