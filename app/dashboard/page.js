'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, FileText, Target, Zap, BarChart3, Calendar as CalIcon,
  Mail, Briefcase, ArrowRight, Check, Send, Loader2, ChevronRight,
  Bot, Layers, Wand2, Copy, Download, User, LogOut,
  Cloud, GitBranch, Linkedin, Brain, Compass, Plus, X, RefreshCw,
  Building2, Trash2, ExternalLink, MapPin, Award, BookOpen, Settings,
  MessageSquare, Fingerprint, Map, Target as TargetIcon, Bell, Sparkle, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast, Toaster } from 'sonner'

const NAV = [
  { key: 'home', label: 'Dashboard', icon: Layers },
  { key: 'chat', label: 'AI Copilot', icon: Bot },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'jobs', label: 'Job Tracker', icon: Briefcase },
  { key: 'interview', label: 'Mock Interview', icon: MessageSquare },
  { key: 'cover', label: 'Cover Letter', icon: FileText },
  { key: 'careerdna', label: 'Career DNA', icon: Fingerprint },
  { key: 'roadmap', label: 'Learning Roadmap', icon: Map },
  { key: 'gap', label: 'Skill Gap', icon: TargetIcon },
  { key: 'memory', label: 'AI Memory', icon: Brain },
  { key: 'opportunities', label: 'Opportunities', icon: Compass },
  { key: 'resume', label: 'Resume Studio', icon: FileText },
  { key: 'ats', label: 'ATS Analyzer', icon: Target },
  { key: 'gmail', label: 'Gmail', icon: Mail },
  { key: 'calendar', label: 'Calendar', icon: CalIcon },
  { key: 'drive', label: 'Drive', icon: Cloud },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
]

function Dashboard() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('home')

  async function loadMe() {
    try {
      const r = await fetch('/api/me')
      const data = await r.json()
      if (!data.user) {
        window.location.href = '/'
        return
      }
      setMe(data)
    } catch {
      window.location.href = '/'
    } finally { setLoading(false) }
  }

  useEffect(() => { loadMe() }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }
  if (!me) return null

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Toaster theme="dark" position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Veyra</span>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">Beta</Badge>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setActive(n.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active === n.key ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.03] hover:text-white'}`}>
              <n.icon className="w-4 h-4" />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
            {me.user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.user.picture} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">{me.user.name?.[0]}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{me.user.name}</div>
              <div className="text-[11px] text-white/40 truncate">{me.user.email}</div>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-white p-1"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {active === 'home' && <HomeTab me={me} setActive={setActive} />}
          {active === 'chat' && <ChatTab me={me} />}
          {active === 'profile' && <ProfileTab me={me} reload={loadMe} />}
          {active === 'jobs' && <JobsTab />}
          {active === 'interview' && <InterviewTab />}
          {active === 'cover' && <CoverLetterTab />}
          {active === 'careerdna' && <CareerDNATab />}
          {active === 'roadmap' && <RoadmapTab me={me} />}
          {active === 'gap' && <SkillGapTab me={me} />}
          {active === 'memory' && <MemoryTab />}
          {active === 'opportunities' && <OpportunitiesTab me={me} />}
          {active === 'resume' && <ResumeTab me={me} />}
          {active === 'ats' && <ATSTab />}
          {active === 'gmail' && <GmailTab connected={me.connected.google} />}
          {active === 'calendar' && <CalendarTab connected={me.connected.google} />}
          {active === 'drive' && <DriveTab connected={me.connected.google} />}
          {active === 'notifications' && <NotificationsTab setActive={setActive} />}
          {active === 'settings' && <SettingsTab me={me} />}
        </div>
      </main>
    </div>
  )
}

// ---------- HOME ----------
function HomeTab({ me, setActive }) {
  const stats = [
    { label: 'Memories', value: me.memoriesCount || 0, icon: Brain, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Skills', value: me.skills?.length || 0, icon: Award, color: 'from-blue-500 to-blue-700' },
    { label: 'Projects', value: me.projects?.length || 0, icon: Briefcase, color: 'from-violet-500 to-violet-700' },
    { label: 'Google', value: me.connected.google ? 'Linked' : 'Not linked', icon: Cloud, color: 'from-amber-500 to-amber-700' },
  ]
  const quickActions = [
    { key: 'chat', label: 'Ask AI coach', icon: Bot, desc: 'Get personalized career advice' },
    { key: 'opportunities', label: 'Find opportunities', icon: Compass, desc: 'AI-matched roles for you' },
    { key: 'resume', label: 'Generate resume', icon: FileText, desc: 'AI-built from your profile' },
    { key: 'ats', label: 'Score my resume', icon: Target, desc: 'Instant ATS analysis' },
  ]
  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm text-white/50">Welcome back</div>
        <h1 className="text-3xl font-bold mt-1">Hi, {me.user.name?.split(' ')[0]} 👋</h1>
        <p className="text-white/50 mt-1 text-sm">Here's your career at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-sm font-semibold mb-3 text-white/70">Quick actions</div>
        <div className="grid md:grid-cols-2 gap-3">
          {quickActions.map(q => (
            <button key={q.key} onClick={() => setActive(q.key)} className="glass rounded-xl p-5 text-left hover:bg-white/[0.04] transition group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition">
                  <q.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{q.label}</div>
                  <div className="text-xs text-white/50 mt-0.5">{q.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- CHAT ----------
function ChatTab({ me }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${me.user.name?.split(' ')[0]}, I'm Veyra — your AI career coach. I remember what we discuss. Tell me what you're working on.` },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => (typeof window !== 'undefined' && window.crypto?.randomUUID) ? window.crypto.randomUUID() : 'sess-' + Date.now())
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Chat failed')
      setMessages(m => [...m, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally { setLoading(false) }
  }

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[75vh]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Veyra Career Coach</div>
            <div className="text-[11px] text-white/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" /> Online · knows your profile
            </div>
          </div>
        </div>
        <Badge className="bg-white/5 border border-white/10 text-white/70 text-[10px]">{me.memoriesCount || 0} memories</Badge>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white' : 'bg-white/[0.04] border border-white/5 text-white/85'}`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-white/80" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/[0.04] border border-white/5 px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/5">
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your career, interviews, next moves..." disabled={loading}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-5 bg-white text-black hover:bg-white/90"><Send className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  )
}

// ---------- PROFILE ----------
function ProfileTab({ me, reload }) {
  const [form, setForm] = useState({
    name: me.user.name || '',
    headline: me.user.headline || '',
    bio: me.user.bio || '',
    location: me.user.location || '',
    targetRole: me.user.targetRole || '',
    yearsExperience: me.user.yearsExperience ?? '',
    linkedinUrl: me.user.linkedinUrl || '',
    githubUrl: me.user.githubUrl || '',
    portfolioUrl: me.user.portfolioUrl || '',
  })
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [projectForm, setProjectForm] = useState({ name: '', description: '', tech: '' })

  async function saveProfile() {
    setSaving(true)
    try {
      const body = { ...form, yearsExperience: form.yearsExperience === '' ? null : Number(form.yearsExperience) }
      const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error('Save failed')
      toast.success('Profile saved')
      reload()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function addSkill() {
    const name = skillInput.trim()
    if (!name) return
    const r = await fetch('/api/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (r.ok) { setSkillInput(''); reload(); toast.success('Skill added') }
  }
  async function removeSkill(id) {
    await fetch(`/api/skills/${id}`, { method: 'DELETE' })
    reload()
  }
  async function addProject() {
    if (!projectForm.name.trim()) return
    const tech = projectForm.tech.split(',').map(t => t.trim()).filter(Boolean)
    const r = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...projectForm, tech }) })
    if (r.ok) { setProjectForm({ name: '', description: '', tech: '' }); reload(); toast.success('Project added') }
  }
  async function removeProject(id) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Professional Identity</h1>
        <p className="text-white/50 mt-1 text-sm">This shapes every AI recommendation Veyra gives you.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="text-sm font-semibold text-white/70">About</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Full name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Headline"><Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="e.g. Senior Full-Stack Engineer" className="bg-black/40 border-white/10" /></Field>
          <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Years of experience"><Input type="number" value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Target role"><Input value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} placeholder="e.g. Staff Engineer at a Series B startup" className="bg-black/40 border-white/10" /></Field>
          <Field label="LinkedIn URL"><Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="GitHub URL"><Input value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Portfolio URL"><Input value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
        </div>
        <Field label="Bio">
          <Textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="A short professional summary about you." className="bg-black/40 border-white/10 resize-none" />
        </Field>
        <Button onClick={saveProfile} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save profile
        </Button>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="text-sm font-semibold text-white/70">Skills</div>
        <div className="flex gap-2">
          <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add a skill (e.g. TypeScript)" className="bg-black/40 border-white/10" />
          <Button onClick={addSkill} className="bg-white text-black hover:bg-white/90"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {me.skills?.length ? me.skills.map(s => (
            <Badge key={s.id} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 pl-3 pr-1 py-1 gap-1">
              {s.name}
              <button onClick={() => removeSkill(s.id)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
            </Badge>
          )) : <div className="text-sm text-white/40">No skills yet.</div>}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="text-sm font-semibold text-white/70">Projects</div>
        <div className="grid gap-2">
          <Input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" className="bg-black/40 border-white/10" />
          <Textarea rows={2} value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of what it does & your role" className="bg-black/40 border-white/10 resize-none" />
          <Input value={projectForm.tech} onChange={e => setProjectForm(f => ({ ...f, tech: e.target.value }))} placeholder="Tech stack, comma-separated (React, Node.js, MongoDB)" className="bg-black/40 border-white/10" />
          <Button onClick={addProject} className="bg-white text-black hover:bg-white/90 self-start"><Plus className="w-4 h-4 mr-1" /> Add project</Button>
        </div>
        <div className="space-y-2">
          {me.projects?.length ? me.projects.map(p => (
            <div key={p.id} className="glass rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-xs text-white/60 mt-1">{p.description}</div>}
                {p.tech?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tech.map((t, i) => <Badge key={i} className="bg-white/5 border border-white/10 text-white/70 text-[10px]">{t}</Badge>)}
                  </div>
                )}
              </div>
              <button onClick={() => removeProject(p.id)} className="text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          )) : <div className="text-sm text-white/40">No projects yet.</div>}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-white/50 mb-1.5">{label}</div>
      {children}
    </label>
  )
}

// ---------- MEMORY ----------
function MemoryTab() {
  const [memories, setMemories] = useState([])
  const [fact, setFact] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    const r = await fetch('/api/memories'); const data = await r.json()
    setMemories(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  async function add() {
    if (!fact.trim()) return
    const r = await fetch('/api/memories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fact }) })
    if (r.ok) { setFact(''); load(); toast.success('Memory saved') }
  }
  async function remove(id) {
    await fetch(`/api/memories/${id}`, { method: 'DELETE' }); load()
  }
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">AI Memory · Knowledge Graph</h1>
        <p className="text-white/50 mt-1 text-sm">Facts Veyra remembers about you across every conversation. Automatically extracted, always editable.</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="flex gap-2">
          <Input value={fact} onChange={e => setFact(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="e.g. Wants to become a Staff Engineer at a Series-B startup by 2027" className="bg-black/40 border-white/10" />
          <Button onClick={add} className="bg-white text-black hover:bg-white/90"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
      ) : memories.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Brain className="w-10 h-10 mx-auto text-white/30 mb-3" />
          <div className="text-sm text-white/50">Nothing yet. Chat with the coach — memories get extracted automatically.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map(m => (
            <div key={m.id} className="glass rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Brain className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                <div className="text-sm text-white/85">{m.fact}</div>
              </div>
              <button onClick={() => remove(m.id)} className="text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- OPPORTUNITIES ----------
function OpportunitiesTab({ me }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [filter, setFilter] = useState('')
  async function run() {
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filter }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Opportunity Engine</h1>
        <p className="text-white/50 mt-1 text-sm">AI-matched roles based on your profile, skills, and memories.</p>
      </div>
      <div className="glass rounded-2xl p-5 flex flex-col md:flex-row gap-3">
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Optional filter: e.g. 'remote, US, seed startups'" className="bg-black/40 border-white/10" />
        <Button onClick={run} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white h-10">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding matches...</> : <><Compass className="w-4 h-4 mr-2" /> Find opportunities</>}
        </Button>
      </div>
      {loading && (
        <div className="glass rounded-2xl p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      )}
      {result && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {result.opportunities?.map((o, i) => (
              <div key={i} className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-lg font-semibold">{o.role}</div>
                    <div className="text-sm text-white/60 flex items-center gap-1"><Building2 className="w-3 h-3" /> {o.company}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gradient-brand">{o.matchScore}<span className="text-sm text-white/40">%</span></div>
                    <div className="text-[10px] text-white/40 uppercase">match</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-white/60 mb-3">
                  {o.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.location}</span>}
                  {o.level && <Badge className="bg-white/5 border border-white/10 text-white/70">{o.level}</Badge>}
                  {o.salaryRange && <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{o.salaryRange}</Badge>}
                </div>
                <p className="text-sm text-white/70 mb-3">{o.why}</p>
                {o.skillGap?.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase text-white/40 mb-1">Skills to strengthen</div>
                    <div className="flex flex-wrap gap-1">
                      {o.skillGap.map((k, j) => <Badge key={j} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">{k}</Badge>)}
                    </div>
                  </div>
                )}
                <div className="text-xs text-white/70 flex items-start gap-2 pt-3 border-t border-white/5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5" /> <span>{o.nextStep}</span>
                </div>
              </div>
            ))}
          </div>
          {result.topSkillsToLearn?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Top skills to invest in</div>
              <div className="flex flex-wrap gap-2">
                {result.topSkillsToLearn.map((s, i) => <Badge key={i} className="bg-blue-500/10 text-blue-300 border border-blue-500/20">{s}</Badge>)}
              </div>
            </div>
          )}
          {result.careerNextMoves?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Compass className="w-4 h-4 text-violet-400" /> Recommended next moves</div>
              <ul className="space-y-2">
                {result.careerNextMoves.map((m, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> {m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- RESUME (generate from profile) ----------
function ResumeTab({ me }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  async function generate() {
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/resume/generate', { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setResult(data)
      toast.success('Resume generated')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  function download() {
    if (!result?.resume) return
    const blob = new Blob([result.resume], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${(me.user.name || 'resume').replace(/\s+/g, '_')}_veyra_resume.txt`; a.click()
    URL.revokeObjectURL(url)
  }
  async function copy() {
    await navigator.clipboard.writeText(result.resume); toast.success('Copied')
  }
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">AI Resume Generator</h1>
          <p className="text-white/50 mt-1 text-sm">One click. AI builds a resume from your Veyra profile.</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-violet-500 to-blue-500 text-white h-11 px-5">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Resume</>}
        </Button>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="glass-strong rounded-2xl border border-violet-500/20 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/40">
              <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400" /> Your resume</div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={copy} className="h-8 text-white/70 hover:text-white hover:bg-white/5"><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                <Button size="sm" variant="ghost" onClick={download} className="h-8 text-white/70 hover:text-white hover:bg-white/5"><Download className="w-3.5 h-3.5 mr-1" /> Download</Button>
              </div>
            </div>
            <pre className="p-6 text-xs font-mono whitespace-pre-wrap text-white/90 max-h-[600px] overflow-auto leading-relaxed">{result.resume}</pre>
          </div>
          {result.highlights?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3">Key highlights</div>
              <ul className="space-y-2">
                {result.highlights.map((h, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />{h}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      {!result && !loading && (
        <div className="glass rounded-2xl p-10 text-center">
          <FileText className="w-12 h-12 mx-auto text-white/30 mb-3" />
          <div className="text-sm text-white/50">Fill your Profile first, then hit Generate. AI turns it into a polished resume.</div>
        </div>
      )}
    </div>
  )
}

// ---------- ATS ----------
function ATSTab() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  async function run() {
    if (resume.length < 30) return toast.error('Paste your resume')
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/ats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume, jobDescription: jd }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setResult(data); toast.success('Analysis complete')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ATS Analyzer</h1>
        <p className="text-white/50 mt-1 text-sm">Score any resume against any job description.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Resume"><Textarea rows={12} value={resume} onChange={e => setResume(e.target.value)} className="bg-black/40 border-white/10 font-mono text-sm resize-none" /></Field>
          <Field label="Job description (optional)"><Textarea rows={6} value={jd} onChange={e => setJd(e.target.value)} className="bg-black/40 border-white/10 text-sm resize-none" /></Field>
          <Button onClick={run} disabled={loading} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4 mr-2" /> Run ATS Analysis</>}
          </Button>
        </div>
        <div>
          {!result && !loading && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[420px]">
              <Target className="w-10 h-10 text-emerald-400 mb-3" />
              <div className="font-semibold">Instant ATS scoring</div>
              <div className="text-sm text-white/50 mt-2 max-w-sm">Score, matched vs. missing keywords, and 5 concrete improvements.</div>
            </div>
          )}
          {loading && <div className="glass rounded-2xl p-10 flex justify-center min-h-[420px] items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>}
          {result && (
            <div className="space-y-3">
              <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20">
                <div className="text-xs uppercase text-white/50 mb-1">ATS Score</div>
                <div className="text-5xl font-bold text-gradient-brand">{result.atsScore}<span className="text-xl text-white/40">/100</span></div>
                <Progress value={result.atsScore || 0} className="h-1.5 bg-white/10 mt-3" />
                <p className="mt-3 text-sm text-white/70">{result.summary}</p>
              </div>
              {result.recommendations?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="text-sm font-semibold mb-2">Top recommendations</div>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{r}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {result.matchedKeywords?.length > 0 && (
                  <div className="glass rounded-2xl p-4">
                    <div className="text-xs uppercase text-white/50 mb-2">Matched</div>
                    <div className="flex flex-wrap gap-1.5">{result.matchedKeywords.map((k, i) => <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">{k}</Badge>)}</div>
                  </div>
                )}
                {result.missingKeywords?.length > 0 && (
                  <div className="glass rounded-2xl p-4">
                    <div className="text-xs uppercase text-white/50 mb-2">Missing</div>
                    <div className="flex flex-wrap gap-1.5">{result.missingKeywords.map((k, i) => <Badge key={i} className="bg-red-500/10 text-red-300 border border-red-500/20 text-[10px]">{k}</Badge>)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- GMAIL ----------
function GmailTab({ connected }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('recruiter OR interview OR opportunity')
  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/google/gmail?q=' + encodeURIComponent(q))
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setMessages(data.messages || [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (connected) load() }, [connected])
  if (!connected) return <ConnectGooglePrompt title="Connect Gmail" desc="Sign in with Google to see recruiter emails, interview invites, and application updates." />
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Gmail · Recruiter Inbox</h1>
          <p className="text-white/50 mt-1 text-sm">AI-filtered career emails from your Gmail.</p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="border-white/10 bg-white/5 text-white h-10">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Gmail search query" className="bg-black/40 border-white/10" />
        <Button onClick={load} className="bg-white text-black">Search</Button>
      </div>
      {loading && <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}
      <div className="space-y-2">
        {messages.map(m => (
          <div key={m.id} className="glass rounded-lg p-4 hover:bg-white/[0.04] transition">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="font-medium text-sm truncate flex-1">{m.subject || '(no subject)'}</div>
              <div className="text-[11px] text-white/40 shrink-0">{m.date ? new Date(m.date).toLocaleDateString() : ''}</div>
            </div>
            <div className="text-xs text-white/50 mb-2 truncate">{m.from}</div>
            <div className="text-sm text-white/70 line-clamp-3">{m.snippet}</div>
          </div>
        ))}
        {!loading && messages.length === 0 && <div className="text-sm text-white/40 text-center py-8">No emails match this query.</div>}
      </div>
    </div>
  )
}

// ---------- CALENDAR ----------
function CalendarTab({ connected }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ summary: '', description: '', start: '', end: '', location: '' })
  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/google/calendar')
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setEvents(data.events || [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (connected) load() }, [connected])
  async function addEvent(e) {
    e.preventDefault()
    if (!form.summary || !form.start || !form.end) return toast.error('Fill title, start, end')
    const body = {
      summary: form.summary, description: form.description, location: form.location,
      start: { dateTime: new Date(form.start).toISOString() },
      end: { dateTime: new Date(form.end).toISOString() },
    }
    const r = await fetch('/api/google/calendar/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { toast.success('Event created'); setShowAdd(false); setForm({ summary: '', description: '', start: '', end: '', location: '' }); load() }
    else { toast.error('Failed to create event') }
  }
  if (!connected) return <ConnectGooglePrompt title="Connect Calendar" desc="See interviews, meetings, and deadlines. Create events straight from Veyra." />
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-white/50 mt-1 text-sm">Your upcoming events from Google Calendar.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(v => !v)} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
            <Plus className="w-4 h-4 mr-1" /> New event
          </Button>
          <Button onClick={load} variant="outline" className="border-white/10 bg-white/5 text-white"><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>
      {showAdd && (
        <form onSubmit={addEvent} className="glass rounded-2xl p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Title"><Input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Start"><Input type="datetime-local" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="End"><Input type="datetime-local" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-black/40 border-white/10 resize-none" /></Field>
          <Button type="submit" className="bg-white text-black hover:bg-white/90"><Plus className="w-4 h-4 mr-1" /> Add to Google Calendar</Button>
        </form>
      )}
      {loading && <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}
      <div className="space-y-2">
        {events.map(ev => {
          const start = ev.start?.dateTime || ev.start?.date
          const d = start ? new Date(start) : null
          return (
            <div key={ev.id} className="glass rounded-lg p-4 flex items-start gap-4 hover:bg-white/[0.04] transition">
              <div className="w-16 shrink-0 text-center">
                <div className="text-xs text-white/50 uppercase">{d ? d.toLocaleDateString('en', { month: 'short' }) : ''}</div>
                <div className="text-2xl font-bold">{d ? d.getDate() : '?'}</div>
                <div className="text-[10px] text-white/40">{d ? d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{ev.summary || '(no title)'}</div>
                {ev.location && <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</div>}
                {ev.description && <div className="text-xs text-white/60 mt-1 line-clamp-2">{ev.description}</div>}
              </div>
              {ev.htmlLink && <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
            </div>
          )
        })}
        {!loading && events.length === 0 && <div className="text-sm text-white/40 text-center py-8">No upcoming events.</div>}
      </div>
    </div>
  )
}

// ---------- DRIVE ----------
function DriveTab({ connected }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/google/drive')
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setFiles(data.files || [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (connected) load() }, [connected])
  if (!connected) return <ConnectGooglePrompt title="Connect Drive" desc="See your files, resumes, and career docs directly in Veyra." />
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Google Drive</h1>
          <p className="text-white/50 mt-1 text-sm">Your recent files.</p>
        </div>
        <Button onClick={load} variant="outline" className="border-white/10 bg-white/5 text-white h-10"><RefreshCw className="w-4 h-4" /></Button>
      </div>
      {loading && <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}
      <div className="grid md:grid-cols-2 gap-2">
        {files.map(f => (
          <a key={f.id} href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="glass rounded-lg p-3 flex items-center gap-3 hover:bg-white/[0.04] transition">
            {f.iconLink ? <img src={f.iconLink} alt="" className="w-6 h-6" /> : <FileText className="w-6 h-6 text-white/50" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{f.name}</div>
              <div className="text-[10px] text-white/40">{new Date(f.modifiedTime).toLocaleDateString()}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30" />
          </a>
        ))}
        {!loading && files.length === 0 && <div className="col-span-full text-sm text-white/40 text-center py-8">No files found.</div>}
      </div>
    </div>
  )
}

function ConnectGooglePrompt({ title, desc }) {
  return (
    <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto mt-16">
      <Cloud className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-white/50 mb-6">{desc}</p>
      <a href="/api/auth/google">
        <Button className="bg-white text-black hover:bg-white/90">Connect Google</Button>
      </a>
    </div>
  )
}

// ---------- SETTINGS ----------
function SettingsTab({ me }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/50 mt-1 text-sm">Connections and integrations.</p>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="text-sm font-semibold text-white/70">Integrations</div>
        <div className="space-y-3">
          <IntegrationRow name="Google (Gmail, Calendar, Drive)" connected={me.connected.google} icon={Cloud} description="Signed in via Google" href="/api/auth/google" />
          <IntegrationRow name="GitHub" connected={false} icon={GitBranch} description="Coming soon — pull repos as projects" />
          <IntegrationRow name="LinkedIn" connected={false} icon={Linkedin} description="Coming soon — manual import supported" />
        </div>
      </div>
    </div>
  )
}
function IntegrationRow({ name, connected, icon: Icon, description, href }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"><Icon className="w-4 h-4 text-white/70" /></div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-white/40">{description}</div>
        </div>
      </div>
      {connected ? (
        <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"><Check className="w-3 h-3 mr-1" /> Connected</Badge>
      ) : href ? (
        <a href={href}><Button size="sm" variant="outline" className="border-white/10 bg-white/5">Connect</Button></a>
      ) : (
        <Badge className="bg-white/5 border border-white/10 text-white/50">Soon</Badge>
      )}
    </div>
  )
}

// ============ JOBS (Kanban) ============
const JOB_STAGES = [
  { key: 'wishlist', label: 'Wishlist', color: 'from-slate-500 to-slate-700' },
  { key: 'saved', label: 'Saved', color: 'from-slate-500 to-slate-700' },
  { key: 'applied', label: 'Applied', color: 'from-blue-500 to-blue-700' },
  { key: 'assessment', label: 'Assessment', color: 'from-cyan-500 to-cyan-700' },
  { key: 'interview', label: 'Interview', color: 'from-violet-500 to-violet-700' },
  { key: 'offer', label: 'Offer', color: 'from-emerald-500 to-emerald-700' },
  { key: 'accepted', label: 'Accepted', color: 'from-emerald-500 to-emerald-700' },
  { key: 'rejected', label: 'Rejected', color: 'from-rose-500 to-rose-700' },
]

function JobsTab() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ company: '', role: '', location: '', salary: '', jobUrl: '', description: '', notes: '', referral: '', status: 'wishlist' })

  async function load() {
    setLoading(true)
    const r = await fetch('/api/jobs'); const data = await r.json()
    setJobs(Array.isArray(data) ? data : []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.company || !form.role) return toast.error('Company and role required')
    const url = editing ? `/api/jobs/${editing}` : '/api/jobs'
    const method = editing ? 'PUT' : 'POST'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { toast.success(editing ? 'Job updated' : 'Job added'); setShowAdd(false); setEditing(null); resetForm(); load() }
    else toast.error('Save failed')
  }
  function resetForm() { setForm({ company: '', role: '', location: '', salary: '', jobUrl: '', description: '', notes: '', referral: '', status: 'wishlist' }) }
  function openEdit(j) { setEditing(j.id); setForm({ company: j.company, role: j.role, location: j.location, salary: j.salary, jobUrl: j.jobUrl, description: j.description, notes: j.notes, referral: j.referral, status: j.status }); setShowAdd(true) }
  async function move(j, newStatus) {
    await fetch(`/api/jobs/${j.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    load()
  }
  async function remove(id) {
    if (!confirm('Delete this job?')) return
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' }); load()
  }
  async function computeMatch(j) {
    toast.info('Computing AI match...')
    const r = await fetch('/api/ai/job-match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: j.id, company: j.company, role: j.role, description: j.description }) })
    if (r.ok) { toast.success('Match computed'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Job Tracker</h1>
          <p className="text-white/50 mt-1 text-sm">Every application, one board. AI computes match scores automatically.</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setShowAdd(v => !v) }} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
          <Plus className="w-4 h-4 mr-1" /> New job
        </Button>
      </div>
      {showAdd && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Company"><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Role"><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Salary range"><Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Job URL"><Input value={form.jobUrl} onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Referral"><Input value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
                {JOB_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Job description"><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-black/40 border-white/10 resize-none" /></Field>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-black/40 border-white/10 resize-none" /></Field>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-white text-black hover:bg-white/90">{editing ? 'Update' : 'Add job'}</Button>
            <Button onClick={() => { setShowAdd(false); setEditing(null); resetForm() }} variant="outline" className="border-white/10 bg-white/5">Cancel</Button>
          </div>
        </div>
      )}
      {loading && <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}
      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {JOB_STAGES.map(stage => {
            const stageJobs = jobs.filter(j => j.status === stage.key)
            return (
              <div key={stage.key} className="w-72 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">{stage.label}</div>
                  <Badge className={`bg-gradient-to-r ${stage.color} text-white border-0 text-[10px]`}>{stageJobs.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageJobs.map(j => (
                    <div key={j.id} className="glass rounded-xl p-3 hover:bg-white/[0.04] transition group">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-semibold truncate">{j.role}</div>
                        {j.matchScore != null && (
                          <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] shrink-0">{j.matchScore}%</Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/60 flex items-center gap-1 truncate"><Building2 className="w-3 h-3" />{j.company}</div>
                      {j.location && <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{j.location}</div>}
                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                        <select value={j.status} onChange={e => move(j, e.target.value)} className="text-[10px] bg-transparent border border-white/10 rounded px-1.5 py-0.5 flex-1 text-white/70">
                          {JOB_STAGES.map(s => <option key={s.key} value={s.key} className="bg-black">{s.label}</option>)}
                        </select>
                        <button onClick={() => computeMatch(j)} title="AI Match" className="p-1 text-white/40 hover:text-emerald-400"><Sparkle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(j)} title="Edit" className="p-1 text-white/40 hover:text-white"><Wand2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(j.id)} title="Delete" className="p-1 text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {stageJobs.length === 0 && !loading && (
                    <div className="text-[11px] text-white/25 text-center py-6 border border-dashed border-white/10 rounded-xl">No jobs</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============ MOCK INTERVIEW ============
function InterviewTab() {
  const [config, setConfig] = useState({ mode: 'behavioral', role: 'Software Engineer', company: '' })
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  async function start() {
    setStarted(true); setLoading(true); setMessages([])
    const newId = (typeof window !== 'undefined' && window.crypto?.randomUUID) ? window.crypto.randomUUID() : 'iv-' + Date.now()
    setSessionId(newId)
    const r = await fetch('/api/ai/mock-interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: newId, mode: config.mode, role: config.role, company: config.company }) })
    const data = await r.json()
    setLoading(false)
    if (r.ok) setMessages([{ role: 'assistant', content: data.answer }])
    else toast.error(data.error || 'Failed')
  }
  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text }])
    setLoading(true)
    const r = await fetch('/api/ai/mock-interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, message: text, mode: config.mode, role: config.role, company: config.company }) })
    const data = await r.json(); setLoading(false)
    if (r.ok) setMessages(m => [...m, { role: 'assistant', content: data.answer }])
    else setMessages(m => [...m, { role: 'assistant', content: `⚠️ ${data.error || 'failed'}` }])
  }
  function reset() { setStarted(false); setMessages([]); setSessionId(''); setInput('') }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mock Interview</h1>
        <p className="text-white/50 mt-1 text-sm">AI role-plays a recruiter. Realistic questions. Instant feedback + scores.</p>
      </div>
      {!started ? (
        <div className="glass rounded-2xl p-6 max-w-2xl space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Type">
              <select value={config.mode} onChange={e => setConfig(c => ({ ...c, mode: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
                <option value="behavioral">Behavioral</option>
                <option value="technical">Technical</option>
                <option value="hr">HR / Culture Fit</option>
              </select>
            </Field>
            <Field label="Target role"><Input value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
            <Field label="Company (optional)"><Input value={config.company} onChange={e => setConfig(c => ({ ...c, company: e.target.value }))} placeholder="e.g. Google" className="bg-black/40 border-white/10" /></Field>
          </div>
          <Button onClick={start} className="bg-gradient-to-r from-violet-500 to-blue-500 text-white h-11 px-5">
            <Zap className="w-4 h-4 mr-2" /> Start mock interview
          </Button>
        </div>
      ) : (
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[70vh]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/40">
            <div className="text-sm font-semibold">{config.mode} · {config.role}{config.company ? ' · ' + config.company : ''}</div>
            <Button size="sm" variant="ghost" onClick={reset} className="text-white/60 hover:text-white"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Restart</Button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shrink-0 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div>}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white' : 'bg-white/[0.04] border border-white/5 text-white/85'}`}>{m.content}</div>
                {m.role === 'user' && <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center"><User className="w-4 h-4" /></div>}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shrink-0 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div>
                <div className="bg-white/[0.04] border border-white/5 px-4 py-3 rounded-2xl"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" /><span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} /></div></div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/5">
            <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your answer..." disabled={loading} className="bg-black/40 border-white/10 h-11" />
              <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-5 bg-white text-black"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ COVER LETTER ============
function CoverLetterTab() {
  const [form, setForm] = useState({ company: '', role: '', description: '', tone: 'professional and warm' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  async function loadHistory() {
    const r = await fetch('/api/cover-letters')
    if (r.ok) setHistory(await r.json())
  }
  useEffect(() => { loadHistory() }, [])
  async function gen() {
    if (!form.company || !form.role) return toast.error('Company and role required')
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/cover-letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setResult(data); loadHistory(); toast.success('Cover letter generated')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  async function copy() { await navigator.clipboard.writeText(result.letter); toast.success('Copied') }
  function download() {
    const blob = new Blob([result.letter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `cover_letter_${(form.company || 'veyra').replace(/\s+/g, '_')}.txt`; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cover Letter Studio</h1>
        <p className="text-white/50 mt-1 text-sm">Personalized cover letters generated from your profile.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 space-y-3">
          <Field label="Company"><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Role"><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="bg-black/40 border-white/10" /></Field>
          <Field label="Tone">
            <select value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
              <option>professional and warm</option>
              <option>formal and concise</option>
              <option>enthusiastic and personal</option>
              <option>confident and direct</option>
              <option>creative and bold</option>
            </select>
          </Field>
          <Field label="Job description (optional)"><Textarea rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-black/40 border-white/10 resize-none" /></Field>
          <Button onClick={gen} disabled={loading} className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white h-11">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate cover letter</>}
          </Button>
        </div>
        <div>
          {result ? (
            <div className="glass-strong rounded-2xl border border-violet-500/20 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/40">
                <div className="text-sm font-semibold">Your cover letter</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={copy} className="h-8 text-white/70"><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  <Button size="sm" variant="ghost" onClick={download} className="h-8 text-white/70"><Download className="w-3.5 h-3.5 mr-1" /></Button>
                </div>
              </div>
              <pre className="p-5 text-sm whitespace-pre-wrap text-white/90 max-h-[500px] overflow-auto leading-relaxed">{result.letter}</pre>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-white/30 mb-3" />
              <div className="text-sm text-white/50">Fill the form and hit Generate.</div>
            </div>
          )}
        </div>
      </div>
      {history.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-white/70 mb-2">Recent letters</div>
          <div className="grid md:grid-cols-2 gap-2">
            {history.map(h => (
              <button key={h.id} onClick={() => setResult({ letter: h.letter, highlights: h.highlights })} className="glass rounded-lg p-3 text-left hover:bg-white/[0.04]">
                <div className="text-sm font-medium truncate">{h.company} — {h.role}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{new Date(h.createdAt).toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CAREER DNA ============
const DNA_QUESTIONS = [
  { key: 'personality', label: 'How would people describe you at work?', placeholder: 'e.g. curious, analytical, hands-on, calm under pressure' },
  { key: 'values', label: 'What matters most in your work?', placeholder: 'e.g. impact, autonomy, learning, money, stability, mission' },
  { key: 'goal5yr', label: 'Where do you want to be in 5 years?', placeholder: 'e.g. Staff Engineer at a Series-B startup, or founder' },
  { key: 'energizes', label: 'What kinds of tasks energize you?', placeholder: 'e.g. deep coding, whiteboarding architecture, mentoring' },
  { key: 'drains', label: 'What kinds of work drain you?', placeholder: 'e.g. long meetings, ambiguous specs, on-call' },
  { key: 'learningStyle', label: 'How do you learn best?', placeholder: 'e.g. by building, reading, from mentors, structured courses' },
  { key: 'riskTolerance', label: 'How much risk are you comfortable with?', placeholder: 'e.g. love ambiguity, prefer stability, or somewhere in between' },
]
function CareerDNATab() {
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/career-dna')
      const data = await r.json()
      if (data.report) { setReport(data.report); setAnswers(data.answers || {}) }
    })()
  }, [])
  async function analyze() {
    setLoading(true); setReport(null)
    try {
      const r = await fetch('/api/ai/career-dna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setReport(data); toast.success('Career DNA analyzed')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Career DNA</h1>
        <p className="text-white/50 mt-1 text-sm">A deep AI analysis of who you are professionally — personality, strengths, values, career matches.</p>
      </div>
      <div className="glass rounded-2xl p-5 space-y-3 max-w-3xl">
        {DNA_QUESTIONS.map(q => (
          <Field key={q.key} label={q.label}>
            <Textarea rows={2} value={answers[q.key] || ''} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))} placeholder={q.placeholder} className="bg-black/40 border-white/10 resize-none" />
          </Field>
        ))}
        <Button onClick={analyze} disabled={loading} className="bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 text-white h-11 px-5">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing your DNA...</> : <><Fingerprint className="w-4 h-4 mr-2" /> Analyze my Career DNA</>}
        </Button>
      </div>
      {report && (
        <div className="space-y-4">
          <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20">
            <div className="text-xs uppercase text-white/50 mb-1">Personality Type</div>
            <div className="text-2xl font-bold text-gradient-brand">{report.personality?.type}</div>
            <p className="text-sm text-white/70 mt-2">{report.personality?.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {report.personality?.traits?.map((t, i) => <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{t}</Badge>)}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-emerald-400" /> Strengths</div>
              <ul className="space-y-1.5">{report.strengths?.map((s, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" />{s}</li>)}</ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Growth areas</div>
              <ul className="space-y-1.5">{report.growthAreas?.map((s, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-1" />{s}</li>)}</ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2">Core values</div>
              <div className="flex flex-wrap gap-1.5">{report.topCoreValues?.map((s, i) => <Badge key={i} className="bg-violet-500/10 text-violet-300 border border-violet-500/20">{s}</Badge>)}</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2">Energy drivers</div>
              <ul className="space-y-1.5">{report.energyDrivers?.map((s, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-1" />{s}</li>)}</ul>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Compass className="w-4 h-4 text-violet-400" /> Best-fit careers</div>
            <div className="space-y-2">
              {report.careerMatches?.map((c, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-2xl font-bold text-gradient-brand shrink-0">{c.matchScore}%</div>
                  <div className="flex-1">
                    <div className="font-semibold">{c.role}</div>
                    <div className="text-xs text-white/60 mt-0.5">{c.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-semibold mb-2">Ideal work environment</div>
            <p className="text-sm text-white/75">{report.idealEnvironment}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-blue-500/20">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-400" /> Your 12-month recommendation</div>
            <p className="text-sm text-white/80">{report.twelveMonthRecommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ ROADMAP ============
function RoadmapTab({ me }) {
  const [config, setConfig] = useState({ horizon: '90d', targetRole: me.user.targetRole || '' })
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  async function generate() {
    setLoading(true); setPlan(null)
    try {
      const r = await fetch('/api/ai/roadmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setPlan(data); toast.success('Roadmap generated')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Roadmap</h1>
        <p className="text-white/50 mt-1 text-sm">AI-generated learning plan with milestones and resources.</p>
      </div>
      <div className="glass rounded-2xl p-5 flex flex-col md:flex-row gap-3">
        <select value={config.horizon} onChange={e => setConfig(c => ({ ...c, horizon: e.target.value }))} className="h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
          <option value="90d">90-Day Plan</option>
          <option value="6mo">6-Month Plan</option>
          <option value="1yr">1-Year Plan</option>
        </select>
        <Input value={config.targetRole} onChange={e => setConfig(c => ({ ...c, targetRole: e.target.value }))} placeholder="Target role (or leave blank to use profile)" className="bg-black/40 border-white/10 flex-1" />
        <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white h-10">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building...</> : <><Map className="w-4 h-4 mr-2" /> Generate roadmap</>}
        </Button>
      </div>
      {plan && (
        <div className="space-y-4">
          <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20">
            <div className="text-xs uppercase text-white/50 mb-1">{plan.horizon} Goal</div>
            <div className="text-xl font-bold text-gradient">{plan.goal}</div>
          </div>
          <div className="space-y-3">
            {plan.milestones?.map((m, i) => (
              <div key={i} className="glass rounded-2xl p-5 relative">
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <div className="ml-4">
                  <div className="text-xs uppercase text-emerald-400 mb-1">{m.week}</div>
                  <div className="font-semibold mb-2">{m.focus}</div>
                  {m.deliverables?.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {m.deliverables.map((d, j) => <div key={j} className="text-sm text-white/70 flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" />{d}</div>)}
                    </div>
                  )}
                  {m.resources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.resources.map((r, k) => (
                        <Badge key={k} className="bg-white/5 border border-white/10 text-white/70 text-[10px]">
                          <BookOpen className="w-2.5 h-2.5 mr-1" />{r.type}: {r.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {plan.skillsToLearn?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-400" /> Skills to learn</div>
                <div className="flex flex-wrap gap-1.5">{plan.skillsToLearn.map((s, i) => <Badge key={i} className="bg-blue-500/10 text-blue-300 border border-blue-500/20">{s}</Badge>)}</div>
              </div>
            )}
            {plan.projectsToBuild?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-violet-400" /> Projects to build</div>
                <ul className="space-y-1">{plan.projectsToBuild.map((p, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />{p}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ SKILL GAP ============
function SkillGapTab({ me }) {
  const [form, setForm] = useState({ targetRole: me.user.targetRole || '', jobDescription: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  async function analyze() {
    if (!form.targetRole && !form.jobDescription) return toast.error('Enter a target role or paste a JD')
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/skill-gap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <p className="text-white/50 mt-1 text-sm">See exactly what you're missing for your target role — and how to close each gap.</p>
      </div>
      <div className="glass rounded-2xl p-5 space-y-3 max-w-3xl">
        <Field label="Target role"><Input value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} placeholder="e.g. Senior AI Engineer" className="bg-black/40 border-white/10" /></Field>
        <Field label="Job description (optional)"><Textarea rows={5} value={form.jobDescription} onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))} className="bg-black/40 border-white/10 resize-none" /></Field>
        <Button onClick={analyze} disabled={loading} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white h-11 px-5">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><TargetIcon className="w-4 h-4 mr-2" /> Analyze skill gap</>}
        </Button>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="glass-strong rounded-2xl p-6 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-white/50 mb-1">Readiness for {result.targetRole}</div>
              <div className="text-5xl font-bold text-gradient-brand">{result.readinessScore}<span className="text-2xl text-white/40">/100</span></div>
              <div className="text-sm text-white/60 mt-2">Estimated time to ready: <b className="text-white/85">{result.estimatedTimeToReady}</b></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2 text-emerald-400">You already have</div>
              <div className="flex flex-wrap gap-1.5">{result.haveSkills?.map((s, i) => <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</Badge>)}</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-2 text-amber-400">Quick wins</div>
              <ul className="space-y-1">{result.quickWins?.map((s, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-1 shrink-0" />{s}</li>)}</ul>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-semibold mb-3 text-red-400">Skills to close</div>
            <div className="space-y-2">
              {result.missingSkills?.map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">{s.skill}</div>
                    <Badge className={`text-[10px] ${s.importance === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' : s.importance === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/10 text-white/60'} border`}>{s.importance}</Badge>
                  </div>
                  <div className="text-xs text-white/60">{s.howToLearn}</div>
                  <div className="text-[10px] text-white/40 mt-1">⏱ {s.timeEstimate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ NOTIFICATIONS ============
function NotificationsTab({ setActive }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/notifications')
      const data = await r.json()
      setItems(data.notifications || []); setLoading(false)
    })()
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-white/50 mt-1 text-sm">Smart alerts derived from your jobs, calendar, and profile.</p>
      </div>
      {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div> :
        items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Bell className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <div className="text-sm text-white/50">You're all caught up.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(n => (
              <div key={n.id} className="glass rounded-lg p-4 flex items-start gap-3 hover:bg-white/[0.04]">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'follow-up' ? 'bg-blue-500/20 text-blue-300' : n.type === 'prep' ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {n.type === 'follow-up' ? <Mail className="w-4 h-4" /> : n.type === 'prep' ? <MessageSquare className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-white/60 mt-0.5">{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default Dashboard
