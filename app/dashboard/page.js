'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, FileText, Target, Zap, BarChart3, Calendar as CalIcon, CalendarDays,
  Mail, Briefcase, ArrowRight, Check, Send, Loader2, ChevronRight,
  Bot, Layers, Wand2, Copy, Download, User, LogOut,
  Cloud, GitBranch, Linkedin, Brain, Compass, Plus, X, RefreshCw,
  Building2, Trash2, ExternalLink, MapPin, Award, BookOpen, Settings,
  MessageSquare, Fingerprint, Map, Target as TargetIcon, Bell, Sparkle, GraduationCap,
  Mic, MicOff, Save, Edit3, Eye, Palette, Code2, Users, Sunrise, Play
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
  { key: 'coding', label: 'Coding Interview', icon: Code2 },
  { key: 'cover', label: 'Cover Letter', icon: FileText },
  { key: 'careerdna', label: 'Career DNA', icon: Fingerprint },
  { key: 'roadmap', label: 'Learning Roadmap', icon: Map },
  { key: 'gap', label: 'Skill Gap', icon: TargetIcon },
  { key: 'memory', label: 'AI Memory', icon: Brain },
  { key: 'opportunities', label: 'Opportunities', icon: Compass },
  { key: 'resume', label: 'Resume Studio', icon: FileText },
  { key: 'ats', label: 'ATS Analyzer', icon: Target },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'gmail', label: 'Gmail', icon: Mail },
  { key: 'calendar', label: 'Calendar', icon: CalIcon },
  { key: 'drive', label: 'Drive', icon: Cloud },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'college', label: 'College Portal', icon: GraduationCap, requireRole: ['college_admin'] },
  { key: 'recruit', label: 'Recruit', icon: Users, requireRole: ['recruiter', 'company_admin', 'college_admin'] },
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

        <a
  href="#"
  className="flex items-center gap-3 group select-none"
>
  {/* Veyra AI Icon */}
  <div
    className="
      relative
      w-10 h-10
      rounded-xl
      bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600
      flex items-center justify-center
      shadow-[0_0_30px_rgba(59,130,246,0.25)]
      transition-all duration-300
      group-hover:scale-105
      group-hover:shadow-[0_0_38px_rgba(99,102,241,0.45)]
    "
  >
    {/* soft glow */}
    <div
      className="
        absolute inset-0
        rounded-xl
        bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600
        blur-md
        opacity-40
      "
    />

    {/* V + sparkle */}
    <svg
      viewBox="0 0 48 48"
      className="relative w-7 h-7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sparkle */}
      <path
        d="M24 5.5L25.8 10.2L30.5 12L25.8 13.8L24 18.5L22.2 13.8L17.5 12L22.2 10.2L24 5.5Z"
        fill="white"
      />

      {/* V */}
      <path
        d="M10 17L18.5 17L24 31L29.5 17H38L28.5 38C27.7 39.8 26 41 24 41C22 41 20.3 39.8 19.5 38L10 17Z"
        fill="white"
      />
    </svg>
  </div>

  {/* Wordmark */}
  <span
    className="
      text-[21px]
      font-bold
      tracking-[-0.03em]
      text-white
      leading-none
    "
  >
    Veyra
    <span
      className="
        ml-1
        bg-gradient-to-r
        from-cyan-400
        via-blue-400
        to-violet-500
        bg-clip-text
        text-transparent
      "
    >
      AI
    </span>
  </span>
</a>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.filter(n => !n.requireRole || (me.user.role && n.requireRole.includes(me.user.role))).map(n => (
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
          {active === 'coding' && <CodingTab />}
          {active === 'recruit' && <RecruitTab />}
          {active === 'college' && <CollegePortalTab />}
          {active === 'cover' && <CoverLetterTab />}
          {active === 'careerdna' && <CareerDNATab />}
          {active === 'roadmap' && <RoadmapTab me={me} />}
          {active === 'gap' && <SkillGapTab me={me} />}
          {active === 'memory' && <MemoryTab />}
          {active === 'opportunities' && <OpportunitiesTab me={me} />}
          {active === 'resume' && <ResumeTab me={me} />}
          {active === 'ats' && <ATSTab />}
          {active === 'analytics' && <AnalyticsTab />}
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

      <DailyBriefingCard />

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
    role: me.user.role || 'professional',
    discoverable: !!me.user.discoverable,
    orgName: me.user.orgName || '',
    orgType: me.user.orgType || '',
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
        <div className="text-sm font-semibold text-white/70">Role & Visibility</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Your role in Veyra">
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
              <option value="student">Student</option>
              <option value="professional">Working Professional</option>
              <option value="recruiter">Recruiter</option>
              <option value="company_admin">Company Admin</option>
              <option value="college_admin">College Admin</option>
            </select>
          </Field>
          <Field label="Organization (college/company)">
            <Input value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="e.g. IIT Bombay / Google" className="bg-black/40 border-white/10" />
          </Field>
        </div>
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-black/40 border border-white/10">
          <input type="checkbox" checked={form.discoverable} onChange={e => setForm(f => ({ ...f, discoverable: e.target.checked }))} className="mt-1 accent-emerald-500" />
          <div>
            <div className="text-sm font-medium">Be discoverable by recruiters</div>
            <div className="text-xs text-white/50 mt-0.5">Recruiters and college placement cells on Veyra can find your profile.</div>
          </div>
        </label>
        <Button onClick={saveProfile} disabled={saving} variant="outline" className="border-white/10 bg-white/5 self-start">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save role
        </Button>
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
  const [q, setQ] = useState('')

  const [selected, setSelected] = useState(null)
  const [calendarEvent, setCalendarEvent] = useState(null)
const [calendarLoading, setCalendarLoading] = useState(false)
const [calendarCreating, setCalendarCreating] = useState(false)

  const [draft, setDraft] = useState(null)
  const reviewRef = useRef(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  {/* SUBJECT */}
<div className="space-y-2">
  <label className="text-xs text-white/50">
    Subject
  </label>

  <Input
    value={composeSubject}
    onChange={e => setComposeSubject(e.target.value)}
    placeholder="Email subject"
    className="bg-black/40 border-white/10"
  />
</div>
  const [composeInstruction, setComposeInstruction] = useState('')
  const [composeLoading, setComposeLoading] = useState(false)

  const [draftLoading, setDraftLoading] = useState(false)

  const [sendLoading, setSendLoading] = useState(false)
  const [instruction, setInstruction] = useState('')

  async function load() {
    setLoading(true)

    try {
      const r = await fetch(
      '/api/google/gmail' + (q.trim() ? '?q=' + encodeURIComponent(q.trim()) : '')
      )

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to load Gmail')
      }

      setMessages(data.messages || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }
  async function composeAndSend() {
    if (!composeTo.trim()) {
      toast.error('Recipient is required')
      return
    }

    if (!composeSubject.trim()) {
      toast.error('Subject is required')
      return
    }

    if (!composeInstruction.trim()) {
      toast.error('Tell AI what you want to say')
      return
    }

    setComposeLoading(true)

    try {
      const r = await fetch('/api/google/gmail/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          instruction: composeInstruction.trim(),
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to compose email')
      }

      console.log('AI COMPOSE RESPONSE:', data)

      // IMPORTANT:
      // Do NOT send automatically.
      // Put the generated email into the existing draft/review state.
      setDraft({
        to: data.to || composeTo.trim(),
        subject: data.subject || composeSubject.trim(),
        body: data.body || '',
        threadId: data.threadId || '',
        inReplyTo: '',
        references: '',
        isNewEmail: true,
      })
      console.log('NEW EMAIL REVIEW DRAFT:', {
        to: data.to || composeTo.trim(),
        subject: data.subject || composeSubject.trim(),
        body: data.body || '',
        isNewEmail: true,
      })
      setShowCompose(false)
      setTimeout(() => {
        reviewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)

      toast.success('Email ready for review')

    } catch (e) {
      console.error('AI COMPOSE ERROR:', e)
      toast.error(e.message || 'Failed to compose email')
    } finally {
      setComposeLoading(false)
    }
  }
  useEffect(() => {
    if (connected) load()
  }, [connected])

  async function detectCalendarEvent(message) {
    if (!message) return

    setCalendarLoading(true)
    setCalendarEvent(null)

    try {
      const r = await fetch('/api/ai/calendar-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || '',
          subject: message.subject || '',
          emailText: message.text || message.snippet || '',
          date: message.date || '',
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to detect calendar event')
      }

      console.log('CALENDAR DETECTION:', data)

      if (!data.detected) {
        console.log('CALENDAR EVENT NOT DETECTED:', {
          subject: message.subject,
          from: message.from,
          date: message.date,
          text: message.text,
          snippet: message.snippet,
          detectorResponse: data,
        })

        toast.info('No calendar event found in this email')
        return
      }

      setCalendarEvent(data)
    } catch (error) {
      console.error('CALENDAR DETECTION ERROR:', error)
      toast.error(error.message || 'Failed to detect calendar event')
    } finally {
      setCalendarLoading(false)
    }
  }

  async function addDetectedEventToCalendar() {
    if (!calendarEvent) return

    if (!calendarEvent.date || !calendarEvent.startTime) {
      toast.error('Event date or time is missing')
      return
    }

    setCalendarCreating(true)

    try {
      const duration = calendarEvent.durationMinutes || 60

      const startDate = new Date(
        `${calendarEvent.date}T${calendarEvent.startTime}:00`
      )

      const endDate = new Date(
        startDate.getTime() + duration * 60 * 1000
      )

      const r = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: calendarEvent.title || 'Career Event',
          description: calendarEvent.description || '',
          location: calendarEvent.location || '',
          start: {
            dateTime: startDate.toISOString(),
          },
          end: {
            dateTime: endDate.toISOString(),
          },
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(
          data.error || 'Failed to add event to Google Calendar'
        )
      }

      console.log('GOOGLE CALENDAR EVENT CREATED:', data)

      toast.success('Added to Google Calendar')

      setCalendarEvent({
        ...calendarEvent,
        addedToCalendar: true,
      })

    } catch (error) {
      console.error('ADD TO CALENDAR ERROR:', error)
      toast.error(
        error.message || 'Failed to add event to Google Calendar'
      )
    } finally {
      setCalendarCreating(false)
    }
  }

  async function generateDraft(message) {
    setSelected(message)
    setDraftLoading(true)
    setDraft(null)

    try {
      const r = await fetch('/api/google/gmail/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || '',
          to: message.to || '',
          subject: message.subject || '',
          emailText: message.text || message.snippet || '',
          instruction:
            instruction ||
            'Write a professional and interested reply. Ask for the next steps if appropriate.',
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to generate draft')
      }

      console.log('DRAFT RESPONSE:', data)

      const newDraft = {
        to: message.from || data.to || '',
        subject: data.subject || '',
        body: data.body || '',
        threadId: message.threadId || '',
        inReplyTo: message.messageId || '',
        references: message.messageId || '',
      }

      console.log('SETTING DRAFT:', newDraft)

      setDraft({
        to: newDraft.to,
        subject: newDraft.subject,
        body: newDraft.body,
        threadId: newDraft.threadId,
        inReplyTo: newDraft.inReplyTo,
        references: newDraft.references,
      })


    } catch (e) {
      console.error('GMAIL DRAFT FETCH ERROR:', e)

      toast.error(
        e instanceof TypeError
          ? 'Could not connect to Veyra server. Check that npm run dev is running.'
          : e.message
      )
    } finally {
      setDraftLoading(false)
    }
  }

  async function sendDraft(draftToSend = draft) {
    if (!draftToSend?.to || !draftToSend?.subject || !draftToSend?.body) {
      toast.error('Recipient, subject and body are required')
      return false
    }

    setSendLoading(true)

    try {
      const r = await fetch('/api/google/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: draftToSend.to,
          subject: draftToSend.subject,
          body: draftToSend.body,
          threadId: draftToSend.threadId || '',
          inReplyTo: draftToSend.inReplyTo || '',
          references: draftToSend.references || '',
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      console.log('GMAIL SEND RESPONSE:', data)

      toast.success('Email sent successfully')

      setDraft(null)
      setSelected(null)
      setInstruction('')

      await load()

      return true
    } catch (e) {
      console.error('GMAIL SEND ERROR:', e)
      toast.error(e.message || 'Failed to send email')
      return false
    } finally {
      setSendLoading(false)
    }

  }


if (!connected) {
    return (
      <ConnectGooglePrompt
        title="Connect Gmail"
        desc="Sign in with Google to see recruiter emails, interview invites, and application updates."
      />
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            Gmail · Recruiter Inbox
          </h1>

          <p className="text-white/50 mt-1 text-sm">
            AI-filtered career emails from your Gmail.
          </p>
        </div>

        <Button
  onClick={() => setShowCompose(true)}
  className="bg-white text-black hover:bg-white/90 h-10"
>
  <Plus className="w-4 h-4 mr-2" />
  New Email
</Button>

        <Button
          onClick={load}
          disabled={loading}
          variant="outline"
          className="border-white/10 bg-white/5 text-white h-10"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

            {/* NEW EMAIL */}
            {showCompose && (
        <div className="glass rounded-2xl p-5 space-y-5 border border-white/10">

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />

                <h2 className="text-lg font-semibold">
                  AI New Email
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                Tell Veyra what you want to say and it will compose and send the email.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setShowCompose(false)
                setComposeTo('')
                setComposeInstruction('')
              }}
              className="text-white/50"
            >
              Close
            </Button>
          </div>

          {/* RECIPIENT */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              To
            </label>

            <Input
              value={composeTo}
              onChange={e => setComposeTo(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-black/40 border-white/10"
            />
          </div>

                    {/* SUBJECT */}
                    <div className="space-y-2">
            <label className="text-xs text-white/50">
              Subject
            </label>

            <Input
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              placeholder="e.g. Interview Follow-up"
              className="bg-black/40 border-white/10"
            />
          </div>


          {/* AI INSTRUCTION */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              What should Veyra say?
            </label>

            <textarea
              value={composeInstruction}
              onChange={e => setComposeInstruction(e.target.value)}
              placeholder="Example: Ask Rahul about the status of my interview and politely request an update."
              className="bg-black/40 border-white/10"
              rows={6}


            />
          </div>

          {/* SEND */}
          <div className="flex justify-end">
            <Button
              onClick={composeAndSend}
              disabled={
                composeLoading ||
!composeTo.trim() ||
!composeSubject.trim() ||
!composeInstruction.trim()
              }
              className="bg-white text-black hover:bg-white/90"
            >
              {composeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI Writing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  AI Compose
                </>
              )}
            </Button>
          </div>

        </div>
      )}
      {/* NEW EMAIL REVIEW */}
      {draft?.isNewEmail && (
  <div
    ref={reviewRef}
    className="mt-4 glass rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 space-y-6"
  >

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />

                <h2 className="text-lg font-semibold">
                  Review New Email
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                Veyra composed this email. Review or edit it before sending.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(null)
              }}
              className="text-white/50 hover:text-white"
            >
              Close
            </Button>
          </div>

          {/* TO */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              To
            </label>

            <Input
              value={draft.to || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  to: e.target.value,
                })
              }
              className="bg-black/40 border-white/10 text-white"
            />
          </div>

          {/* SUBJECT */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              Subject
            </label>

            <Input
              value={draft.subject || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  subject: e.target.value,
                })
              }
              className="bg-black/40 border-white/10 text-white"
            />
          </div>

          {/* MESSAGE */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              Message
            </label>

            <textarea
              value={draft.body || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  body: e.target.value,
                })
              }
              rows={12}
              className="
                w-full
                rounded-lg
                border
                border-white/10
                bg-black/40
                px-4
                py-3
                text-sm
                text-white
                outline-none
                resize-y
                focus:border-emerald-400/30
              "
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3">

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(null)
              }}
              disabled={sendLoading}
              className="border-white/10 bg-white/5 text-white"
            >
              Discard
            </Button>

            <Button
              type="button"
              onClick={() => sendDraft(draft)}
              disabled={
                sendLoading ||
                !draft.to?.trim() ||
                !draft.subject?.trim() ||
                !draft.body?.trim()
              }
              className="bg-white text-black hover:bg-white/90"
            >
              {sendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>

          </div>

        </div>
      )}


      {/* SEARCH */}
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Gmail search query"
          className="bg-black/40 border-white/10"
        />

        <Button
          onClick={load}
          className="bg-white text-black"
        >
          Search
        </Button>
      </div>

      {/* AI INSTRUCTION */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div>
          <div className="text-sm font-medium">
            AI reply preference
          </div>

          <div className="text-xs text-white/40 mt-1">
            Optional instruction for how Veyra should write replies.
          </div>
        </div>

        <Input
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="e.g. Keep it short and ask about interview availability"
          className="bg-black/40 border-white/10"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      )}

      {/* EMAIL LIST / EMAIL READER */}

{selected ? (
  <div className="glass rounded-2xl border border-white/10 overflow-hidden">

    {/* READER HEADER */}
    <div className="p-5 border-b border-white/10">

      <div className="flex items-center justify-between gap-3 mb-5">

        <Button
          type="button"
          variant="outline"
          onClick={() => setSelected(null)}
          className="border-white/10 bg-white/5 text-white"
        >
          ← Back to Inbox
        </Button>
        <Button
  type="button"
  onClick={() => detectCalendarEvent(selected)}
  disabled={calendarLoading}
  variant="outline"
  className="border-white/10 bg-white/5 text-white"
>
  {calendarLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Detecting...
    </>
  ) : (
    <>
      <CalendarDays className="w-4 h-4 mr-2" />
      Detect Calendar Event
    </>
  )}
</Button>
        <Button
          type="button"
          onClick={() => generateDraft(selected)}
          disabled={draftLoading}
          className="bg-white text-black hover:bg-white/90"
        >
          {draftLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Drafting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Reply & Send
            </>
          )}
        </Button>

      </div>

      {/* SUBJECT */}
      <h1 className="text-2xl font-semibold leading-tight">
        {selected.subject || '(no subject)'}
      </h1>

      {/* FROM */}
      <div className="mt-5 flex items-start gap-3">

        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold">
            {(selected.from || '?')
              .replace(/<.*?>/g, '')
              .trim()
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>

        <div className="min-w-0">

          <div className="text-sm font-medium break-all">
            {selected.from || 'Unknown sender'}
          </div>

          {selected.to && (
            <div className="text-xs text-white/40 mt-1 break-all">
              To: {selected.to}
            </div>
          )}

          {selected.date && (
            <div className="text-xs text-white/40 mt-1">
              {new Date(selected.date).toLocaleString()}
            </div>
          )}

        </div>

      </div>

    </div>

    {/* EMAIL BODY */}
    <div className="p-6">

      <div className="
        whitespace-pre-wrap
        break-words
        text-sm
        leading-7
        text-white/80
        max-w-4xl
      ">
        {selected.text || selected.snippet || 'No email content available.'}
      </div>

    </div>
    {calendarEvent && (
  <div className="mx-6 mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">

    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />

          <h3 className="font-semibold">
            Calendar event detected
          </h3>
        </div>

        <p className="text-xs text-white/40 mt-1">
          Veyra found a career event in this email.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCalendarEvent(null)}
        className="text-white/40 hover:text-white"
      >
        ×
      </button>
    </div>

    <div className="mt-5 space-y-3">

      <div className="text-lg font-semibold">
        {calendarEvent.title || 'Career Event'}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">

        {calendarEvent.date && (
          <div className="rounded-lg bg-black/20 p-3">
            <div className="text-xs text-white/40">
              Date
            </div>
            <div className="mt-1">
              {new Date(
                `${calendarEvent.date}T00:00:00`
              ).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        )}

        {calendarEvent.startTime && (
          <div className="rounded-lg bg-black/20 p-3">
            <div className="text-xs text-white/40">
              Time
            </div>
            <div className="mt-1">
              {calendarEvent.startTime}
            </div>
          </div>
        )}

        {calendarEvent.location && (
          <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
            <div className="text-xs text-white/40">
              Location
            </div>
            <div className="mt-1">
              {calendarEvent.location}
            </div>
          </div>
        )}

      </div>

      {calendarEvent.description && (
        <p className="text-sm text-white/60 leading-6">
          {calendarEvent.description}
        </p>
      )}

      <div className="flex justify-end pt-2">
      <Button
  type="button"
  onClick={addDetectedEventToCalendar}
  disabled={calendarCreating || calendarEvent.addedToCalendar}
  className="bg-white text-black hover:bg-white/90"
>
  {calendarCreating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Adding...
    </>
  ) : calendarEvent.addedToCalendar ? (
    <>
      <CalendarDays className="w-4 h-4 mr-2" />
      Added to Calendar
    </>
  ) : (
    <>
      <CalendarDays className="w-4 h-4 mr-2" />
      Add to Google Calendar
    </>
  )}
</Button>
      </div>

    </div>
  </div>
)}

  </div>


) : (

  <div className="space-y-2">

    {messages.map(message => (

      <div
        key={message.id}
        onClick={() => {
          setSelected(message)
          detectCalendarEvent(message)
        }}
        className="
          glass
          rounded-xl
          p-4
          hover:bg-white/[0.06]
          transition
          cursor-pointer
          border
          border-transparent
          hover:border-white/10
        "
      >

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <div className="font-medium text-sm truncate">
                {message.subject || '(no subject)'}
              </div>

              {message.threadId && (
                <span className="text-[10px] text-white/30 shrink-0">
                  Thread
                </span>
              )}

            </div>

            <div className="text-xs text-white/50 mt-1 truncate">
              {message.from}
            </div>

            <div className="text-sm text-white/60 mt-2 line-clamp-2">
              {message.snippet}
            </div>

            <div className="text-[11px] text-white/30 mt-2">
              {message.date
                ? new Date(message.date).toLocaleDateString()
                : ''}
            </div>

          </div>

          {/* AI REPLY BUTTON */}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              generateDraft(message)
            }}
            disabled={
              draftLoading &&
              selected?.id === message.id
            }
            className="
              shrink-0
              bg-white
              text-black
              hover:bg-white/90
            "
          >

            {draftLoading &&
            selected?.id === message.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Drafting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Reply & Send
              </>
            )}

          </Button>

        </div>

      </div>

    ))}

    {!loading && messages.length === 0 && (
      <div className="text-sm text-white/40 text-center py-8">
        No emails match this query.
      </div>
    )}

  </div>

)}

                      {/* AI DRAFT / REVIEW */}
                      {draft && !draft.isNewEmail && (
        <div className="mt-4 glass rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">

          {/* HEADER */}
          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />

                <h2 className="text-lg font-semibold">
                  {draft.isNewEmail ? 'Review New Email' : 'AI Reply Draft'}
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                {draft.isNewEmail
                  ? 'Veyra composed this email. Review or edit it before sending.'
                  : 'Veyra generated this reply. Review or edit it before sending.'}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setDraft(null)}
              className="text-white/50 hover:text-white"
            >
              Close Draft
            </Button>

          </div>

          {/* TO */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              To
            </label>

            <Input
              value={draft.to || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  to: e.target.value,
                })
              }
              className="bg-black/40 border-white/10 text-white"
            />
          </div>

          {/* SUBJECT */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              Subject
            </label>

            <Input
              value={draft.subject || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  subject: e.target.value,
                })
              }
              className="bg-black/40 border-white/10 text-white"
            />
          </div>

          {/* MESSAGE */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">
              Message
            </label>

            <textarea
              value={draft.body || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  body: e.target.value,
                })
              }
              rows={12}
              className="
                w-full
                rounded-lg
                border
                border-white/10
                bg-black/40
                px-4
                py-3
                text-sm
                text-white
                outline-none
                resize-y
                focus:border-white/20
              "
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            <Button
              type="button"
              variant="outline"
              disabled={draftLoading || sendLoading}
              onClick={() => {
                if (selected) {
                  generateDraft(selected)
                }
              }}
              className="border-white/10 bg-white/5 text-white"
            >
              {draftLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Drafting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => sendDraft(draft)}
              disabled={
                sendLoading ||
                !draft.to ||
                !draft.subject ||
                !draft.body
              }
              className="bg-white text-black hover:bg-white/90"
            >
              {sendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>

          </div>

        </div>
      )}

    </div>
  )
}

// ---------- CALENDAR ----------
function CalendarTab({ connected }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const [showAI, setShowAI] = useState(false)
  const [aiInstruction, setAIInstruction] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const [aiEvent, setAIEvent] = useState(null)

  const [form, setForm] = useState({
    summary: '',
    description: '',
    start: '',
    end: '',
    location: '',
  })

  async function load() {
    setLoading(true)

    try {
      const r = await fetch('/api/google/calendar')
      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to load Calendar')
      }

      setEvents(data.events || [])
    } catch (e) {
      console.error('CALENDAR LOAD ERROR:', e)
      toast.error(e.message || 'Failed to load Calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected) {
      load()
    }
  }, [connected])

  async function addEvent(e) {
    e.preventDefault()

    if (!form.summary.trim()) {
      return toast.error('Enter event title')
    }

    if (!form.start || !form.end) {
      return toast.error('Select start and end time')
    }

    const startDate = new Date(form.start)
    const endDate = new Date(form.end)

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return toast.error('Invalid date or time')
    }

    if (endDate <= startDate) {
      return toast.error('End time must be after start time')
    }

    setLoading(true)

    try {
      const body = {
        summary: form.summary.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        start: {
          dateTime: startDate.toISOString(),
        },
        end: {
          dateTime: endDate.toISOString(),
        },
      }

      const r = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await r.json()

      if (!r.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      toast.success('Event created in Google Calendar')

      setShowAdd(false)

      setForm({
        summary: '',
        description: '',
        start: '',
        end: '',
        location: '',
      })

      await load()
    } catch (error) {
      console.error('CALENDAR CREATE ERROR:', error)
      toast.error(error.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  async function createAIEvent() {
    if (!aiInstruction.trim()) {
      return toast.error('Tell Veyra what event to create')
    }

    setAILoading(true)

    try {
      // STEP 1: Ask AI to understand the instruction
      const aiResponse = await fetch('/api/ai/calendar-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: aiInstruction.trim(),
        }),
      })

      const data = await aiResponse.json()

      if (!aiResponse.ok) {
        throw new Error(
          data.error || 'Failed to understand the event'
        )
      }

      console.log('AI CALENDAR EVENT:', data)

      // STEP 2: Validate AI result
      if (!data.title || !data.date || !data.startTime) {
        throw new Error(
          'Veyra could not determine the event title, date, or time'
        )
      }

      // STEP 3: Calculate start time
      const startDate = new Date(
        `${data.date}T${data.startTime}:00`
      )

      if (Number.isNaN(startDate.getTime())) {
        throw new Error('Veyra generated an invalid date or time')
      }

      // STEP 4: Calculate end time
      const durationMinutes =
        Number(data.durationMinutes) > 0
          ? Number(data.durationMinutes)
          : 60

      const endDate = new Date(
        startDate.getTime() +
          durationMinutes * 60 * 1000
      )

      // STEP 5: Send the AI-generated event to Google Calendar
      const calendarResponse = await fetch(
        '/api/google/calendar/events',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: data.title,
            description: data.description || '',
            location: data.location || '',
            start: {
              dateTime: startDate.toISOString(),
            },
            end: {
              dateTime: endDate.toISOString(),
            },
          }),
        }
      )

      const calendarData = await calendarResponse.json()

      if (!calendarResponse.ok) {
        throw new Error(
          calendarData.error ||
            'Failed to save event to Google Calendar'
        )
      }

      console.log(
        'GOOGLE CALENDAR EVENT CREATED:',
        calendarData.event
      )

      // STEP 6: Update UI
      setAIEvent({
        ...data,
        googleEvent: calendarData.event,
      })

      setAIInstruction('')
      setShowAI(false)

      toast.success(
        'AI event added to Google Calendar'
      )

      // STEP 7: Refresh Calendar
      await load()

    } catch (error) {
      console.error(
        'AI CALENDAR ERROR:',
        error
      )

      toast.error(
        error.message ||
          'Failed to create event with AI'
      )
    } finally {
      setAILoading(false)
    }
  }

  if (!connected) {
    return (
      <ConnectGooglePrompt
        title="Connect Calendar"
        desc="See interviews, meetings, and deadlines. Create events straight from Veyra."
      />
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">

        <div>
          <h1 className="text-3xl font-bold">
            Calendar
          </h1>

          <p className="text-white/50 mt-1 text-sm">
            Your upcoming events from Google Calendar.
          </p>
        </div>

        <div className="flex gap-2">

          <Button
            type="button"
            onClick={() => setShowAI(v => !v)}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI Create Event
          </Button>

          <Button
            type="button"
            onClick={() => setShowAdd(v => !v)}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            New event
          </Button>

          <Button
            type="button"
            onClick={load}
            disabled={loading}
            variant="outline"
            className="border-white/10 bg-white/5 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>

        </div>
      </div>

      {/* AI CREATE EVENT */}
      {showAI && (
        <div className="glass rounded-2xl p-5 space-y-4 border border-white/10">

          <div className="flex items-start justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />

                <h2 className="text-lg font-semibold">
                  AI Create Event
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                Tell Veyra what you want to schedule in natural language.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAI(false)}
              className="text-white/50"
            >
              Close
            </Button>

          </div>

          <Textarea
            rows={4}
            value={aiInstruction}
            onChange={e => setAIInstruction(e.target.value)}
            placeholder="Example: Tomorrow at 3 PM interview with Rahul for 45 minutes on Google Meet."
            className="bg-black/40 border-white/10 resize-none"
          />

          <div className="flex justify-end">

            <Button
              type="button"
              onClick={createAIEvent}
              disabled={aiLoading || !aiInstruction.trim()}
              className="bg-white text-black hover:bg-white/90"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Veyra is creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Event
                </>
              )}
            </Button>

          </div>

          {/* AI EVENT PREVIEW */}
          {aiEvent && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 space-y-3">

              <div className="flex items-start justify-between gap-3">

                <div>
                  <div className="text-lg font-semibold">
                    {aiEvent.title}
                  </div>

                  <div className="text-sm text-white/50 mt-1">
                    {aiEvent.date} · {aiEvent.startTime}
                  </div>
                </div>

                <Sparkles className="w-5 h-5 text-emerald-300" />

              </div>

              {aiEvent.location && (
                <div className="text-sm text-white/60">
                  📍 {aiEvent.location}
                </div>
              )}

              {aiEvent.description && (
                <div className="text-sm text-white/60">
                  {aiEvent.description}
                </div>
              )}

              <div className="flex justify-end gap-2">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAIEvent(null)}
                  className="border-white/10 bg-white/5 text-white"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={saveAIEventToCalendar}
                  disabled={aiLoading}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Add to Google Calendar
                    </>
                  )}
                </Button>

              </div>

            </div>
          )}

        </div>
      )}

      {/* CREATE EVENT */}
      {showAdd && (
        <form
          onSubmit={addEvent}
          className="glass rounded-2xl p-5 space-y-4 border border-white/10"
        >

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                New Calendar Event
              </h2>

              <p className="text-xs text-white/40 mt-1">
                Create an event directly in Google Calendar.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdd(false)}
              className="text-white/50"
            >
              Close
            </Button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <Field label="Title">
              <Input
                value={form.summary}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    summary: e.target.value,
                  }))
                }
                placeholder="Interview with Google"
                className="bg-black/40 border-white/10"
              />
            </Field>

            <Field label="Location">
              <Input
                value={form.location}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    location: e.target.value,
                  }))
                }
                placeholder="Google Meet / Office"
                className="bg-black/40 border-white/10"
              />
            </Field>

            <Field label="Start">
              <Input
                type="datetime-local"
                value={form.start}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    start: e.target.value,
                    end:
                      f.end &&
                      e.target.value &&
                      f.end < e.target.value
                        ? ''
                        : f.end,
                  }))
                }
                className="bg-black/40 border-white/10"
              />
            </Field>

            <Field label="End">
              <Input
                type="datetime-local"
                value={form.end}
                min={form.start || undefined}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    end: e.target.value,
                  }))
                }
                className="bg-black/40 border-white/10"
              />
            </Field>

          </div>

          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              placeholder="Interview details, preparation notes, meeting agenda..."
              className="bg-black/40 border-white/10 resize-none"
            />
          </Field>

          <div className="flex justify-end gap-2">

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdd(false)}
              className="border-white/10 bg-white/5 text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                !form.summary.trim() ||
                !form.start ||
                !form.end
              }
              className="bg-white text-black hover:bg-white/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Google Calendar
                </>
              )}
            </Button>

          </div>

        </form>
      )}

      {/* LOADING */}
      {loading && !showAdd && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      )}

      {/* EVENTS */}
      {!loading && events.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <div className="text-4xl mb-3">📅</div>

          <div className="font-medium">
            No upcoming events
          </div>

          <div className="text-sm text-white/40 mt-1">
            Your upcoming Google Calendar events will appear here.
          </div>
        </div>
      )}

      <div className="space-y-2">

        {events.map(ev => {
          const start = ev.start?.dateTime || ev.start?.date
          const end = ev.end?.dateTime || ev.end?.date

          const startDate = start ? new Date(start) : null
          const endDate = end ? new Date(end) : null

          return (
            <div
              key={ev.id}
              className="glass rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.04] transition border border-transparent hover:border-white/10"
            >

              <div className="w-16 shrink-0 text-center">

                <div className="text-xs text-white/50 uppercase">
                  {startDate
                    ? startDate.toLocaleDateString('en', {
                        month: 'short',
                      })
                    : ''}
                </div>

                <div className="text-2xl font-bold">
                  {startDate ? startDate.getDate() : '?'}
                </div>

                <div className="text-[10px] text-white/40">
                  {startDate
                    ? startDate.toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>

              </div>

              <div className="flex-1 min-w-0">

                <div className="font-medium">
                  {ev.summary || '(no title)'}
                </div>

                {ev.location && (
                  <div className="text-xs text-white/50 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ev.location}
                  </div>
                )}

                {startDate && endDate && (
                  <div className="text-xs text-white/40 mt-1">
                    {startDate.toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {' → '}
                    {endDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {ev.description && (
                  <div className="text-xs text-white/60 mt-2 line-clamp-2">
                    {ev.description}
                  </div>
                )}

              </div>

              {ev.htmlLink && (
                <a
                  href={ev.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white transition"
                  title="Open in Google Calendar"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

            </div>
          )
        })}

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

      <h2 className="text-xl font-bold mb-2">
        {title}
      </h2>

      <p className="text-sm text-white/50 mb-6">
        {desc}
      </p>

      <a
        href="/api/auth/google"
        className="
          inline-flex
          items-center
          justify-center
          h-10
          px-5
          rounded-lg
          bg-white
          text-black
          font-medium
          cursor-pointer
          hover:bg-white/90
          transition
        "
      >
        Connect Google
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
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)

  async function load() {
    setLoading(true)

    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch('/api/public/jobs'),
        fetch('/api/applications/student'),
      ])

      const jobsData = await jobsRes.json()
      const appsData = await appsRes.json()

      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setApplications(Array.isArray(appsData) ? appsData : [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load jobs')
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function apply(job) {
    if (applying) return

    setApplying(job.id)

    try {
      const r = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
        }),
      })

      const data = await r.json()

      if (!r.ok) {
        toast.error(data.error || 'Application failed')
        return
      }

      toast.success('Application submitted')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Application failed')
    } finally {
      setApplying(null)
    }
  }

  function applicationFor(jobId) {
    return applications.find(a => a.jobId === jobId)
  }

  function trackerStatus(status) {
    const map = {
      Applied: 'applied',
      Screening: 'assessment',
      Shortlisted: 'assessment',
      Interview: 'interview',
      Offer: 'offer',
      Hired: 'accepted',
      Rejected: 'rejected',
      Withdrawn: 'rejected',
    }

    return map[status] || 'applied'
  }

  const appliedJobIds = new Set(
    applications.map(a => a.jobId)
  )

  const availableJobs = jobs.filter(
    job => !appliedJobIds.has(job.id)
  )

  const trackedJobs = applications.map(app => {
    const job = jobs.find(j => j.id === app.jobId)

    return {
      ...job,
      id: app.id,
      jobId: app.jobId,
      company: job?.companyName || app.companyName || 'Company',
      role: job?.title || app.jobTitle || 'Job',
      location: job?.location || '',
      description: job?.description || '',
      matchScore: app.matchScore ?? null,
      status: trackerStatus(app.status),
      applicationStatus: app.status,
    }
  })

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Job Tracker</h1>
          <p className="text-white/50 mt-1 text-sm">
            Discover company jobs and track your real applications.
          </p>
        </div>

        <Button
          onClick={load}
          variant="outline"
          className="border-white/10 bg-white/5"
        >
          Refresh
        </Button>
      </div>

      {/* COMPANY JOBS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Jobs from companies</h2>
          <p className="text-xs text-white/40 mt-1">
            Jobs published directly by companies on ProCareerAI.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/50" />
          </div>
        )}

        {!loading && availableJobs.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-sm text-white/50">
              No new company jobs available right now.
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {availableJobs.map(job => (
            <div
              key={job.id}
              className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">
                    {job.title}
                  </div>

                  <div className="text-sm text-white/60 mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.companyName || 'Company'}
                  </div>
                </div>

                <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Hiring
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {job.location && (
                  <span className="text-[11px] text-white/45 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                )}

                {job.employmentType && (
                  <span className="text-[11px] text-white/45">
                    {job.employmentType.replace('_', ' ')}
                  </span>
                )}

                {job.experience && (
                  <span className="text-[11px] text-white/45">
                    {job.experience}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="text-xs text-white/45 mt-3 line-clamp-3">
                  {job.description}
                </p>
              )}

              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.skills.slice(0, 5).map(skill => (
                    <span
                      key={skill}
                      className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/55 border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="text-[10px] text-white/35">
                  {job.salaryMin || job.salaryMax
                    ? `₹${job.salaryMin || 0} - ₹${job.salaryMax || 0}`
                    : 'Salary not disclosed'}
                </div>

                <Button
                  onClick={() => apply(job)}
                  disabled={applying === job.id}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                >
                  {applying === job.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* APPLICATION PIPELINE */}
      <div className="space-y-3 pt-4">
        <div>
          <h2 className="text-lg font-semibold">My applications</h2>
          <p className="text-xs text-white/40 mt-1">
            Applications submitted to companies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-4">

            {JOB_STAGES.map(stage => {
              const stageJobs = trackedJobs.filter(
                j => j.status === stage.key
              )

              return (
                <div
                  key={stage.key}
                  className="w-72 shrink-0"
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
                      {stage.label}
                    </div>

                    <Badge
                      className={`bg-gradient-to-r ${stage.color} text-white border-0 text-[10px]`}
                    >
                      {stageJobs.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {stageJobs.map(j => (
                      <div
                        key={j.id}
                        className="glass rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-sm font-semibold truncate">
                            {j.role}
                          </div>

                          {j.matchScore != null && (
                            <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] shrink-0">
                              {j.matchScore}%
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-white/60 flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" />
                          {j.company}
                        </div>

                        {j.location && (
                          <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {j.location}
                          </div>
                        )}

                        <div className="mt-3 pt-2 border-t border-white/5">
                          <div className="text-[10px] text-white/40">
                            Application status
                          </div>

                          <div className="text-xs font-medium text-white/75 mt-1">
                            {j.applicationStatus}
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageJobs.length === 0 && !loading && (
                      <div className="text-[11px] text-white/25 text-center py-6 border border-dashed border-white/10 rounded-xl">
                        No applications
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
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
  const [voiceMode, setVoiceMode] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const scrollRef = useRef(null)
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  // TTS: speak assistant messages when in voice mode
  useEffect(() => {
    if (!voiceMode || messages.length === 0 || typeof window === 'undefined') return
    const last = messages[messages.length - 1]
    if (last.role !== 'assistant') return
    try {
      const utter = new SpeechSynthesisUtterance(last.content.replace(/[📝🎯•\-]/g, ' ').slice(0, 800))
      utter.rate = 1.0; utter.pitch = 1.0
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch {}
  }, [messages, voiceMode])

  function toggleListen() {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Voice recognition not supported in this browser (try Chrome)')
    if (listening) { recognitionRef.current?.stop(); return }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript
      setInput(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

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
  function reset() {
    setStarted(false); setMessages([]); setSessionId(''); setInput('')
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }

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
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70">
            <input type="checkbox" checked={voiceMode} onChange={e => setVoiceMode(e.target.checked)} className="accent-emerald-500" />
            <Mic className="w-4 h-4 text-emerald-400" /> Voice mode (AI speaks + you can dictate your answers)
          </label>
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
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? 'Listening...' : voiceMode ? 'Tap mic to speak or type...' : 'Type your answer...'} disabled={loading} className="bg-black/40 border-white/10 h-11" />
              {voiceMode && (
                <Button type="button" onClick={toggleListen} className={`h-11 px-4 ${listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
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

// ---------- RESUME STUDIO (full builder + templates + PDF + versions) ----------
const RESUME_TEMPLATES = [
  { key: 'modern', label: 'Modern', accent: '#10B981' },
  { key: 'minimal', label: 'Minimal', accent: '#111827' },
  { key: 'executive', label: 'Executive', accent: '#1E40AF' },
  { key: 'creative', label: 'Creative', accent: '#8B5CF6' },
]

function ResumeTab({ me }) {
  const [tab, setTab] = useState('builder') // builder | versions
  const [sections, setSections] = useState(() => ({
    name: me.user.name || '',
    headline: me.user.headline || '',
    email: me.user.email || '',
    phone: '',
    location: me.user.location || '',
    linkedinUrl: me.user.linkedinUrl || '',
    githubUrl: me.user.githubUrl || '',
    portfolioUrl: me.user.portfolioUrl || '',
    summary: me.user.bio || '',
    experience: [{ company: '', role: '', location: '', startDate: '', endDate: '', bullets: [''] }],
    education: [{ school: '', degree: '', field: '', startDate: '', endDate: '' }],
    projects: (me.projects || []).map(p => ({ name: p.name, description: p.description || '', tech: (p.tech || []).join(', '), url: p.url || '' })),
    skills: (me.skills || []).map(s => s.name),
    certifications: [],
    languages: [],
  }))
  const [template, setTemplate] = useState('modern')
  const [versions, setVersions] = useState([])
  const [saving, setSaving] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const previewRef = useRef(null)

  async function loadVersions() {
    const r = await fetch('/api/resume-versions')
    if (r.ok) setVersions(await r.json())
  }
  useEffect(() => { loadVersions() }, [])

  function updateSection(key, value) { setSections(s => ({ ...s, [key]: value })) }
  function updateExp(i, field, value) {
    setSections(s => ({ ...s, experience: s.experience.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }))
  }
  function updateExpBullet(i, j, value) {
    setSections(s => ({ ...s, experience: s.experience.map((e, idx) => idx === i ? { ...e, bullets: e.bullets.map((b, bi) => bi === j ? value : b) } : e) }))
  }
  function addExp() { setSections(s => ({ ...s, experience: [...s.experience, { company: '', role: '', location: '', startDate: '', endDate: '', bullets: [''] }] })) }
  function removeExp(i) { setSections(s => ({ ...s, experience: s.experience.filter((_, idx) => idx !== i) })) }
  function addBullet(i) { setSections(s => ({ ...s, experience: s.experience.map((e, idx) => idx === i ? { ...e, bullets: [...e.bullets, ''] } : e) })) }
  function updateEdu(i, field, value) { setSections(s => ({ ...s, education: s.education.map((e, idx) => idx === i ? { ...e, [field]: value } : e) })) }
  function addEdu() { setSections(s => ({ ...s, education: [...s.education, { school: '', degree: '', field: '', startDate: '', endDate: '' }] })) }
  function removeEdu(i) { setSections(s => ({ ...s, education: s.education.filter((_, idx) => idx !== i) })) }
  function updateProj(i, field, value) { setSections(s => ({ ...s, projects: s.projects.map((p, idx) => idx === i ? { ...p, [field]: value } : p) })) }
  function addProj() { setSections(s => ({ ...s, projects: [...s.projects, { name: '', description: '', tech: '', url: '' }] })) }
  function removeProj(i) { setSections(s => ({ ...s, projects: s.projects.filter((_, idx) => idx !== i) })) }

  async function aiImproveSummary() {
    setGenLoading(true)
    try {
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        sessionId: 'improve-summary-' + Date.now(),
        message: `Improve this professional summary line for a resume. Keep it 2 sentences max, no fluff, focused, ATS-friendly. Return only the improved summary text, nothing else.\n\nCurrent: "${sections.summary || 'None yet'}"\n\nContext: ${sections.name}, ${sections.headline}, target role ${me.user.targetRole || 'unspecified'}.`
      }) })
      const data = await r.json()
      if (r.ok) { setSections(s => ({ ...s, summary: data.answer.trim().replace(/^["']|["']$/g, '') })); toast.success('Summary improved') }
    } catch (e) { toast.error('AI improve failed') }
    finally { setGenLoading(false) }
  }

  async function saveVersion() {
    const name = prompt('Name this version:', 'Resume — ' + new Date().toLocaleDateString())
    if (!name) return
    setSaving(true)
    try {
      const r = await fetch('/api/resume-versions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, template, sections, content: JSON.stringify(sections) }) })
      if (r.ok) { toast.success('Version saved'); loadVersions() }
    } catch (e) { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  async function loadVersion(v) {
    if (v.sections) { setSections(v.sections); setTemplate(v.template || 'modern'); setTab('builder'); toast.success(`Loaded: ${v.name}`) }
  }
  async function deleteVersion(id) {
    if (!confirm('Delete this resume version?')) return
    await fetch(`/api/resume-versions/${id}`, { method: 'DELETE' }); loadVersions()
  }

  async function downloadPDF() {
    if (!previewRef.current) return
    toast.info('Generating PDF...')
    try {
      // Force white background for capture
      const el = previewRef.current
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`${(sections.name || 'resume').replace(/\s+/g, '_')}_veyra.pdf`)
      toast.success('PDF downloaded')
    } catch (e) {
      console.error(e); toast.error('PDF generation failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Resume Studio</h1>
          <p className="text-white/50 mt-1 text-sm">Build. Style. Save versions. Export beautiful PDFs.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
            <button onClick={() => setTab('builder')} className={`px-3 py-1 text-sm rounded ${tab === 'builder' ? 'bg-white text-black' : 'text-white/60'}`}><Edit3 className="w-3.5 h-3.5 inline mr-1" /> Builder</button>
            <button onClick={() => setTab('versions')} className={`px-3 py-1 text-sm rounded ${tab === 'versions' ? 'bg-white text-black' : 'text-white/60'}`}><Save className="w-3.5 h-3.5 inline mr-1" /> Versions ({versions.length})</button>
          </div>
        </div>
      </div>

      {tab === 'builder' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Editor */}
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-white/70">Header</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Full name" value={sections.name} onChange={e => updateSection('name', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="Headline" value={sections.headline} onChange={e => updateSection('headline', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="Email" value={sections.email} onChange={e => updateSection('email', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="Phone" value={sections.phone} onChange={e => updateSection('phone', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="Location" value={sections.location} onChange={e => updateSection('location', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="LinkedIn URL" value={sections.linkedinUrl} onChange={e => updateSection('linkedinUrl', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="GitHub URL" value={sections.githubUrl} onChange={e => updateSection('githubUrl', e.target.value)} className="bg-black/40 border-white/10" />
                <Input placeholder="Portfolio URL" value={sections.portfolioUrl} onChange={e => updateSection('portfolioUrl', e.target.value)} className="bg-black/40 border-white/10" />
              </div>
            </div>
            {/* Summary */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/70">Professional Summary</div>
                <Button size="sm" onClick={aiImproveSummary} disabled={genLoading} variant="ghost" className="h-7 text-emerald-300 hover:bg-emerald-500/10">
                  {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" /> AI improve</>}
                </Button>
              </div>
              <Textarea rows={3} value={sections.summary} onChange={e => updateSection('summary', e.target.value)} placeholder="A short, punchy 2-sentence summary..." className="bg-black/40 border-white/10 resize-none text-sm" />
            </div>
            {/* Experience */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/70">Experience</div>
                <Button size="sm" onClick={addExp} variant="ghost" className="h-7 text-white/70"><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {sections.experience.map((exp, i) => (
                <div key={i} className="border border-white/5 rounded-lg p-3 space-y-2 bg-black/20">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Company" value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <Input placeholder="Role" value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <Input placeholder="Location" value={exp.location} onChange={e => updateExp(i, 'location', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <div className="grid grid-cols-2 gap-1">
                      <Input placeholder="Start" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                      <Input placeholder="End" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {exp.bullets.map((b, j) => (
                      <Input key={j} placeholder="• Achievement (start with action verb, include metrics)" value={b} onChange={e => updateExpBullet(i, j, e.target.value)} className="bg-black/40 border-white/10 h-9 text-xs" />
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => addBullet(i)} className="h-6 text-white/50 text-xs"><Plus className="w-3 h-3 mr-1" /> Bullet</Button>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeExp(i)} className="h-7 text-red-300 hover:bg-red-500/10 text-xs"><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                </div>
              ))}
            </div>
            {/* Education */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/70">Education</div>
                <Button size="sm" onClick={addEdu} variant="ghost" className="h-7 text-white/70"><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {sections.education.map((edu, i) => (
                <div key={i} className="border border-white/5 rounded-lg p-3 space-y-2 bg-black/20">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="School" value={edu.school} onChange={e => updateEdu(i, 'school', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <Input placeholder="Degree" value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <Input placeholder="Field of study" value={edu.field} onChange={e => updateEdu(i, 'field', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <div className="grid grid-cols-2 gap-1">
                      <Input placeholder="Start" value={edu.startDate} onChange={e => updateEdu(i, 'startDate', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                      <Input placeholder="End" value={edu.endDate} onChange={e => updateEdu(i, 'endDate', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeEdu(i)} className="h-7 text-red-300 hover:bg-red-500/10 text-xs"><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                </div>
              ))}
            </div>
            {/* Projects */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/70">Projects</div>
                <Button size="sm" onClick={addProj} variant="ghost" className="h-7 text-white/70"><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {sections.projects.map((p, i) => (
                <div key={i} className="border border-white/5 rounded-lg p-3 space-y-2 bg-black/20">
                  <Input placeholder="Project name" value={p.name} onChange={e => updateProj(i, 'name', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                  <Textarea rows={2} placeholder="Description" value={p.description} onChange={e => updateProj(i, 'description', e.target.value)} className="bg-black/40 border-white/10 text-sm resize-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Tech (comma-separated)" value={p.tech} onChange={e => updateProj(i, 'tech', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                    <Input placeholder="URL" value={p.url} onChange={e => updateProj(i, 'url', e.target.value)} className="bg-black/40 border-white/10 h-9 text-sm" />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeProj(i)} className="h-7 text-red-300 hover:bg-red-500/10 text-xs"><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                </div>
              ))}
            </div>
            {/* Skills */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-white/70">Skills (comma-separated)</div>
              <Textarea rows={2} value={sections.skills.join(', ')} onChange={e => updateSection('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="bg-black/40 border-white/10 text-sm resize-none" />
            </div>
            {/* Certifications */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-white/70">Certifications (one per line)</div>
              <Textarea rows={3} value={sections.certifications.join('\n')} onChange={e => updateSection('certifications', e.target.value.split('\n').filter(Boolean))} className="bg-black/40 border-white/10 text-sm resize-none" />
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
              <div className="text-xs uppercase text-white/50 flex items-center gap-1 shrink-0"><Palette className="w-3.5 h-3.5" /> Template</div>
              <div className="flex flex-wrap gap-2 flex-1">
                {RESUME_TEMPLATES.map(t => (
                  <button key={t.key} onClick={() => setTemplate(t.key)} className={`px-3 py-1.5 rounded-lg text-xs border transition ${template === t.key ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={saveVersion} disabled={saving} variant="outline" className="border-white/10 bg-white/5 text-white h-9">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" /> Save</>}
                </Button>
                <Button size="sm" onClick={downloadPDF} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white h-9">
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/10">
              <div className="max-h-[80vh] overflow-y-auto rounded-lg">
                <div ref={previewRef} className="mx-auto bg-white text-gray-900 shadow-xl" style={{ width: '794px', minHeight: '1123px', padding: '48px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <ResumePreview sections={sections} template={template} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <FileText className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <div className="text-sm text-white/50">No saved versions yet. Build a resume, then hit Save.</div>
            </div>
          ) : (
            versions.map(v => (
              <div key={v.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><FileText className="w-5 h-5 text-white/70" /></div>
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-white/50">Template: {v.template} · {new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => loadVersion(v)} variant="outline" className="border-white/10 bg-white/5"><Eye className="w-3.5 h-3.5 mr-1" /> Load</Button>
                  <Button size="sm" onClick={() => deleteVersion(v.id)} variant="ghost" className="text-red-300 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ResumePreview({ sections, template }) {
  const accent = RESUME_TEMPLATES.find(t => t.key === template)?.accent || '#10B981'
  if (template === 'modern') {
    return (
      <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#1f2937' }}>
        <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: '12px', marginBottom: '18px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#111827' }}>{sections.name || 'Your Name'}</h1>
          <div style={{ fontSize: '13px', color: accent, fontWeight: 600, marginTop: '2px' }}>{sections.headline || 'Your Headline'}</div>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#4b5563' }}>
            {[sections.email, sections.phone, sections.location, sections.linkedinUrl, sections.githubUrl].filter(Boolean).join(' · ')}
          </div>
        </div>
        {sections.summary && <Section title="SUMMARY" accent={accent}><p>{sections.summary}</p></Section>}
        {sections.experience?.some(e => e.company || e.role) && (
          <Section title="EXPERIENCE" accent={accent}>
            {sections.experience.filter(e => e.company || e.role).map((e, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div><b>{e.role}</b> · {e.company}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{e.startDate} — {e.endDate || 'Present'}</div>
                </div>
                {e.location && <div style={{ color: '#6b7280', fontSize: '10px', marginBottom: '3px' }}>{e.location}</div>}
                <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                  {e.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Section>
        )}
        {sections.projects?.some(p => p.name) && (
          <Section title="PROJECTS" accent={accent}>
            {sections.projects.filter(p => p.name).map((p, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div><b>{p.name}</b>{p.tech && ` · ${p.tech}`}</div>
                {p.description && <div style={{ marginTop: '2px' }}>{p.description}</div>}
                {p.url && <div style={{ color: accent, fontSize: '10px' }}>{p.url}</div>}
              </div>
            ))}
          </Section>
        )}
        {sections.education?.some(e => e.school) && (
          <Section title="EDUCATION" accent={accent}>
            {sections.education.filter(e => e.school).map((e, i) => (
              <div key={i} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <div><b>{e.school}</b>{e.degree && ` · ${e.degree}`}{e.field && `, ${e.field}`}</div>
                <div style={{ color: '#6b7280', fontSize: '10px' }}>{e.startDate} — {e.endDate}</div>
              </div>
            ))}
          </Section>
        )}
        {sections.skills?.length > 0 && (
          <Section title="SKILLS" accent={accent}><div>{sections.skills.join(' · ')}</div></Section>
        )}
        {sections.certifications?.length > 0 && (
          <Section title="CERTIFICATIONS" accent={accent}>
            {sections.certifications.map((c, i) => <div key={i}>{c}</div>)}
          </Section>
        )}
      </div>
    )
  }
  if (template === 'minimal') {
    return (
      <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#111827', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 400, margin: 0, letterSpacing: '3px' }}>{(sections.name || 'YOUR NAME').toUpperCase()}</h1>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>{sections.headline}</div>
          <div style={{ marginTop: '6px', fontSize: '10px' }}>
            {[sections.email, sections.phone, sections.location].filter(Boolean).join(' | ')}
          </div>
        </div>
        {sections.summary && <MinSection title="Summary">{sections.summary}</MinSection>}
        {sections.experience?.some(e => e.company || e.role) && (
          <MinSection title="Experience">
            {sections.experience.filter(e => e.company || e.role).map((e, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{e.role} — {e.company}</b>
                  <span style={{ fontStyle: 'italic', color: '#6b7280' }}>{e.startDate} to {e.endDate || 'Present'}</span>
                </div>
                <ul style={{ margin: '3px 0 0 16px' }}>{e.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </MinSection>
        )}
        {sections.projects?.some(p => p.name) && (
          <MinSection title="Projects">
            {sections.projects.filter(p => p.name).map((p, i) => (
              <div key={i} style={{ marginBottom: '6px' }}><b>{p.name}</b> — {p.description} <i style={{ color: '#6b7280' }}>{p.tech}</i></div>
            ))}
          </MinSection>
        )}
        {sections.education?.some(e => e.school) && (
          <MinSection title="Education">
            {sections.education.filter(e => e.school).map((e, i) => (
              <div key={i}><b>{e.school}</b>, {e.degree} in {e.field} <i style={{ color: '#6b7280' }}>({e.endDate})</i></div>
            ))}
          </MinSection>
        )}
        {sections.skills?.length > 0 && <MinSection title="Skills">{sections.skills.join(' · ')}</MinSection>}
      </div>
    )
  }
  if (template === 'executive') {
    return (
      <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#111827' }}>
        <div style={{ background: accent, color: 'white', padding: '20px 24px', margin: '-48px -48px 20px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0 }}>{sections.name || 'Your Name'}</h1>
          <div style={{ fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>{sections.headline}</div>
          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.85 }}>
            {[sections.email, sections.phone, sections.location, sections.linkedinUrl].filter(Boolean).join(' · ')}
          </div>
        </div>
        {sections.summary && <ExecSection title="EXECUTIVE SUMMARY" accent={accent}>{sections.summary}</ExecSection>}
        {sections.experience?.some(e => e.company || e.role) && (
          <ExecSection title="PROFESSIONAL EXPERIENCE" accent={accent}>
            {sections.experience.filter(e => e.company || e.role).map((e, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px' }}>
                  <div><b>{e.company}</b> — <span style={{ color: accent }}>{e.role}</span></div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{e.startDate} – {e.endDate || 'Present'} · {e.location}</div>
                </div>
                <ul style={{ margin: '4px 0 0 18px' }}>{e.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </ExecSection>
        )}
        {sections.education?.some(e => e.school) && (
          <ExecSection title="EDUCATION" accent={accent}>
            {sections.education.filter(e => e.school).map((e, i) => (
              <div key={i}><b>{e.degree} in {e.field}</b>, {e.school} <span style={{ color: '#6b7280' }}>({e.endDate})</span></div>
            ))}
          </ExecSection>
        )}
        {sections.skills?.length > 0 && <ExecSection title="CORE COMPETENCIES" accent={accent}>{sections.skills.join(' · ')}</ExecSection>}
      </div>
    )
  }
  // creative
  return (
    <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#111827', display: 'grid', gridTemplateColumns: '35% 65%', gap: '20px' }}>
      <div style={{ background: accent, color: 'white', padding: '20px', margin: '-48px 0 -48px -48px', minHeight: '1123px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{sections.name}</h1>
        <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9 }}>{sections.headline}</div>
        <div style={{ marginTop: '20px', fontSize: '10px' }}>
          {sections.email && <div style={{ marginBottom: '4px' }}>📧 {sections.email}</div>}
          {sections.phone && <div style={{ marginBottom: '4px' }}>📱 {sections.phone}</div>}
          {sections.location && <div style={{ marginBottom: '4px' }}>📍 {sections.location}</div>}
          {sections.linkedinUrl && <div style={{ marginBottom: '4px', wordBreak: 'break-all' }}>💼 {sections.linkedinUrl}</div>}
          {sections.githubUrl && <div style={{ marginBottom: '4px', wordBreak: 'break-all' }}>⚙️ {sections.githubUrl}</div>}
        </div>
        {sections.skills?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', borderBottom: '2px solid white', paddingBottom: '2px' }}>SKILLS</div>
            {sections.skills.map((s, i) => <div key={i} style={{ marginBottom: '3px', fontSize: '10px' }}>· {s}</div>)}
          </div>
        )}
        {sections.certifications?.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', borderBottom: '2px solid white', paddingBottom: '2px' }}>CERTIFICATIONS</div>
            {sections.certifications.map((c, i) => <div key={i} style={{ marginBottom: '3px', fontSize: '10px' }}>{c}</div>)}
          </div>
        )}
      </div>
      <div style={{ padding: '4px 0' }}>
        {sections.summary && (<>
          <div style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '4px' }}>ABOUT</div>
          <p style={{ marginBottom: '14px' }}>{sections.summary}</p>
        </>)}
        {sections.experience?.some(e => e.company || e.role) && (<>
          <div style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '4px' }}>EXPERIENCE</div>
          {sections.experience.filter(e => e.company || e.role).map((e, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div><b>{e.role}</b> at {e.company}</div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>{e.startDate} – {e.endDate || 'Present'}</div>
              <ul style={{ margin: '3px 0 0 16px' }}>{e.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </>)}
        {sections.education?.some(e => e.school) && (<>
          <div style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '4px' }}>EDUCATION</div>
          {sections.education.filter(e => e.school).map((e, i) => (
            <div key={i}><b>{e.school}</b> — {e.degree}, {e.field} <span style={{ color: '#6b7280' }}>({e.endDate})</span></div>
          ))}
        </>)}
      </div>
    </div>
  )
}
function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: accent, borderBottom: `1px solid ${accent}`, paddingBottom: '2px', marginBottom: '6px' }}>{title}</div>
      {children}
    </div>
  )
}
function MinSection({ title, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '13px', fontStyle: 'italic', textAlign: 'center', margin: '0 0 6px', color: '#374151' }}>~ {title} ~</div>
      {children}
    </div>
  )
}
function ExecSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: accent, marginBottom: '4px' }}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

// ---------- ANALYTICS ----------
function AnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/analytics')
      if (r.ok) setData(await r.json())
      setLoading(false)
    })()
  }, [])
  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
  if (!data) return null
  const pipeColors = { wishlist: '#64748b', saved: '#64748b', applied: '#3B82F6', assessment: '#06B6D4', interview: '#8B5CF6', offer: '#10B981', accepted: '#10B981', rejected: '#EF4444' }
  const activePipe = data.pipeline.filter(p => p.count > 0)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-white/50 mt-1 text-sm">Track applications, interview rate, offer rate, and career activity.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total jobs" value={data.totals.jobs} color="from-emerald-500 to-emerald-700" />
        <Stat label="Applications" value={data.totals.applied} color="from-blue-500 to-blue-700" />
        <Stat label="Interview rate" value={data.interviewRate + '%'} color="from-violet-500 to-violet-700" />
        <Stat label="Offer rate" value={data.offerRate + '%'} color="from-amber-500 to-amber-700" />
        <Stat label="Mock interviews" value={data.totals.mockInterviews} color="from-cyan-500 to-cyan-700" />
        <Stat label="Cover letters" value={data.totals.coverLetters} color="from-pink-500 to-pink-700" />
        <Stat label="AI chats" value={data.totals.conversations} color="from-rose-500 to-rose-700" />
        <Stat label="Memories" value={data.totals.memories} color="from-slate-500 to-slate-700" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Applications over time</div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Pipeline breakdown</div>
          <div style={{ width: '100%', height: 240 }}>
            {activePipe.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-white/40">Add jobs to see the pipeline</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.pipeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.pipeline.map((p, i) => <Cell key={i} fill={pipeColors[p.stage] || '#10B981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      {data.avgMatch != null && (
        <div className="glass rounded-2xl p-5 flex items-center gap-6">
          <div>
            <div className="text-xs uppercase text-white/50">Average AI match</div>
            <div className="text-4xl font-bold text-gradient-brand">{data.avgMatch}<span className="text-lg text-white/40">%</span></div>
          </div>
          <div className="text-sm text-white/60 flex-1">Your average AI-computed match score across all jobs. Aim for &gt;75% before applying.</div>
        </div>
      )}
    </div>
  )
}
function Stat({ label, value, color }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs text-white/40 mb-2">{label}</div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</div>
    </div>
  )
}

// ---------- DAILY BRIEFING CARD (home) ----------
function DailyBriefingCard() {
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(false)
  async function fetchBriefing() {
    setLoading(true)
    try {
      const r = await fetch('/api/daily-briefing')
      const data = await r.json()
      if (r.ok) setBriefing(data)
      else toast.error(data.error || 'Briefing failed')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sunrise className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-sm font-semibold">Your Daily Briefing</div>
            <div className="text-[11px] text-white/40">AI-curated for you</div>
          </div>
        </div>
        <Button size="sm" onClick={fetchBriefing} disabled={loading} className="bg-white text-black hover:bg-white/90 h-8">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : briefing ? <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Get today's briefing</>}
        </Button>
      </div>
      {briefing?.briefing ? (
        <div className="space-y-3 mt-4">
          <div className="text-lg font-semibold text-gradient">{briefing.briefing.greeting}</div>
          <div className="glass rounded-xl p-4 border border-amber-500/20">
            <div className="text-[10px] uppercase text-amber-400 mb-1">Focus of the day</div>
            <div className="text-sm text-white/90">{briefing.briefing.focusOfDay}</div>
          </div>
          {briefing.briefing.todoList?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase text-white/50 mb-2">Today's plan</div>
              <ul className="space-y-1.5">
                {briefing.briefing.todoList.map((t, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                    <div className="w-4 h-4 rounded border border-white/20 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {briefing.briefing.opportunityHint && (
            <div className="glass rounded-xl p-3 border border-blue-500/20 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-white/80">{briefing.briefing.opportunityHint}</div>
            </div>
          )}
          {briefing.briefing.motivationalNote && (
            <div className="text-xs text-white/60 italic text-center pt-2">"{briefing.briefing.motivationalNote}"</div>
          )}
        </div>
      ) : !loading && (
        <div className="text-xs text-white/40 mt-2">Tap the button to get your personalized morning briefing.</div>
      )}
    </div>
  )
}

// ---------- CODING INTERVIEW ----------
const CODE_TOPICS = ['arrays', 'strings', 'linked lists', 'trees', 'graphs', 'dynamic programming', 'system design (mini)', 'hash tables', 'sorting', 'recursion']
const CODE_LANGS = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'TypeScript']

function CodingTab() {
  const [config, setConfig] = useState({ topic: 'arrays', difficulty: 'medium', language: 'JavaScript' })
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState(null)
  const [hintsShown, setHintsShown] = useState(0)

  async function newChallenge() {
    setLoading(true); setChallenge(null); setGrade(null); setCode(''); setHintsShown(0)
    try {
      const r = await fetch('/api/ai/coding-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setChallenge(data); setCode(data.starterCode || '')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  async function submitCode() {
    if (!challenge || !code.trim()) return toast.error('Write some code first')
    setGrading(true); setGrade(null)
    try {
      const r = await fetch('/api/ai/coding-grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem: challenge.prompt, code, language: config.language }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setGrade(data); toast.success('Graded!')
    } catch (e) { toast.error(e.message) }
    finally { setGrading(false) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coding Interview</h1>
        <p className="text-white/50 mt-1 text-sm">AI generates a problem. You write code. AI grades correctness, complexity, code quality.</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Topic">
            <select value={config.topic} onChange={e => setConfig(c => ({ ...c, topic: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
              {CODE_TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
          <Field label="Language">
            <select value={config.language} onChange={e => setConfig(c => ({ ...c, language: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm">
              {CODE_LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <Button onClick={newChallenge} disabled={loading} className="w-full h-10 bg-gradient-to-r from-violet-500 to-blue-500 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Code2 className="w-4 h-4 mr-1" /> New problem</>}
            </Button>
          </div>
        </div>
      </div>

      {challenge && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="glass-strong rounded-2xl p-5 border border-violet-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-bold">{challenge.title}</div>
                  <Badge className={`text-[10px] mt-1 ${challenge.difficulty === 'hard' ? 'bg-red-500/20 text-red-300 border-red-500/30' : challenge.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'} border`}>{challenge.difficulty}</Badge>
                </div>
              </div>
              <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{challenge.prompt}</p>
              {challenge.constraints?.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase text-white/50 mb-1">Constraints</div>
                  <ul className="text-xs text-white/70 space-y-0.5">{challenge.constraints.map((c, i) => <li key={i}>· {c}</li>)}</ul>
                </div>
              )}
              {challenge.examples?.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] uppercase text-white/50">Examples</div>
                  {challenge.examples.map((e, i) => (
                    <div key={i} className="bg-black/40 rounded p-2 font-mono text-xs">
                      <div><span className="text-white/40">Input:</span> {e.input}</div>
                      <div><span className="text-white/40">Output:</span> {e.output}</div>
                      {e.explanation && <div className="text-white/60 mt-1">{e.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}
              {challenge.hints?.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] uppercase text-white/50">Hints ({hintsShown}/{challenge.hints.length})</div>
                    {hintsShown < challenge.hints.length && (
                      <Button size="sm" variant="ghost" onClick={() => setHintsShown(h => h + 1)} className="h-6 text-[10px] text-amber-300 hover:bg-amber-500/10">Reveal next hint</Button>
                    )}
                  </div>
                  {challenge.hints.slice(0, hintsShown).map((h, i) => (
                    <div key={i} className="text-xs text-white/70 mt-1 pl-3 border-l-2 border-amber-500/30">💡 {h}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
                <div className="text-xs font-mono text-white/60">solution.{config.language.toLowerCase().slice(0, 3)}</div>
                <Button size="sm" onClick={submitCode} disabled={grading || !code.trim()} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white h-8">
                  {grading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Grading...</> : <><Play className="w-3.5 h-3.5 mr-1" /> Submit</>}
                </Button>
              </div>
              <Textarea value={code} onChange={e => setCode(e.target.value)} rows={18} spellCheck={false}
                className="bg-black/60 border-0 rounded-none font-mono text-xs resize-none focus-visible:ring-0" />
            </div>
            {grade && (
              <div className="space-y-3">
                <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs uppercase text-white/50">Overall Score</div>
                      <div className="text-4xl font-bold text-gradient-brand">{grade.overallScore}<span className="text-lg text-white/40">/100</span></div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-white/50">Correctness: <b className="text-emerald-300">{grade.correctness}/100</b></div>
                      <div className="text-white/50">Quality: <b className="text-blue-300">{grade.codeQuality}/100</b></div>
                      {grade.complexity && <div className="text-white/50">⏱ {grade.complexity.time} · 💾 {grade.complexity.space}</div>}
                    </div>
                  </div>
                  <p className="text-sm text-white/80">{grade.verdict}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs font-semibold text-emerald-400 mb-2">Strengths</div>
                    <ul className="space-y-1">{grade.strengths?.map((s, i) => <li key={i} className="text-xs text-white/75 flex gap-1"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />{s}</li>)}</ul>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs font-semibold text-amber-400 mb-2">Improvements</div>
                    <ul className="space-y-1">{grade.improvements?.map((s, i) => <li key={i} className="text-xs text-white/75 flex gap-1"><ChevronRight className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />{s}</li>)}</ul>
                  </div>
                </div>
                {grade.improvedSolution && (
                  <div className="glass-strong rounded-2xl overflow-hidden border border-blue-500/20">
                    <div className="px-4 py-2 border-b border-white/5 bg-black/40 text-xs font-semibold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI-improved solution
                    </div>
                    <pre className="p-4 font-mono text-xs whitespace-pre-wrap text-white/85 overflow-auto max-h-64">{grade.improvedSolution}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- RECRUIT (Recruiter / College portal) ----------
function RecruitTab() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [skill, setSkill] = useState('')
  const [selected, setSelected] = useState(null)
  async function search() {
    setLoading(true)
    try {
      const url = `/api/candidates?q=${encodeURIComponent(q)}&skill=${encodeURIComponent(skill)}`
      const r = await fetch(url); const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setCandidates(data.candidates || [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  async function view(id) {
    const r = await fetch(`/api/candidates/${id}`); const data = await r.json()
    if (r.ok) setSelected(data.candidate)
  }
  useEffect(() => { search() }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recruit</h1>
        <p className="text-white/50 mt-1 text-sm">Discover discoverable candidates on Veyra.</p>
      </div>
      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / headline / location" className="bg-black/40 border-white/10 flex-1" />
        <Input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Filter by skill" className="bg-black/40 border-white/10 flex-1" />
        <Button onClick={search} disabled={loading} className="bg-white text-black"><Compass className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div> :
        candidates.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <div className="text-sm text-white/50">No discoverable candidates yet.</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {candidates.map(c => (
              <button key={c.id} onClick={() => view(c.id)} className="glass rounded-xl p-4 text-left hover:bg-white/[0.04] transition">
                <div className="flex items-start gap-3">
                  {c.picture ? <img src={c.picture} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{c.name?.[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-white/60 truncate">{c.headline}</div>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1">
                      {c.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{c.location}</span>}
                      {c.yearsExperience != null && <span>{c.yearsExperience}y exp</span>}
                      {c.projectsCount > 0 && <span>{c.projectsCount} projects</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.skills.slice(0, 5).map((s, i) => <Badge key={i} className="bg-white/5 border border-white/10 text-white/60 text-[9px]">{s}</Badge>)}
                      {c.skills.length > 5 && <span className="text-[10px] text-white/40">+{c.skills.length - 5}</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      }
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="glass-strong rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                {selected.picture ? <img src={selected.picture} alt="" className="w-14 h-14 rounded-full" /> : <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl">{selected.name?.[0]}</div>}
                <div>
                  <div className="text-lg font-bold">{selected.name}</div>
                  <div className="text-sm text-white/60">{selected.headline}</div>
                  <div className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                    {selected.location && <><MapPin className="w-3 h-3" />{selected.location}</>}
                    {selected.yearsExperience != null && <span>· {selected.yearsExperience}y experience</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {selected.bio && <p className="text-sm text-white/75 mb-4">{selected.bio}</p>}
            <div className="flex gap-2 mb-4">
              {selected.linkedinUrl && <a href={selected.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:underline flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</a>}
              {selected.githubUrl && <a href={selected.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-white/70 hover:underline flex items-center gap-1"><GitBranch className="w-3 h-3" /> GitHub</a>}
              {selected.portfolioUrl && <a href={selected.portfolioUrl} target="_blank" rel="noreferrer" className="text-xs text-white/70 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Portfolio</a>}
            </div>
            {selected.skills?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs uppercase text-white/50 mb-2">Skills</div>
                <div className="flex flex-wrap gap-1.5">{selected.skills.map((s, i) => <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</Badge>)}</div>
              </div>
            )}
            {selected.projects?.length > 0 && (
              <div>
                <div className="text-xs uppercase text-white/50 mb-2">Projects</div>
                <div className="space-y-2">
                  {selected.projects.map((p, i) => (
                    <div key={i} className="glass rounded-lg p-3">
                      <div className="font-medium text-sm">{p.name}</div>
                      {p.description && <div className="text-xs text-white/60 mt-1">{p.description}</div>}
                      {p.tech?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{p.tech.map((t, j) => <Badge key={j} className="bg-white/5 border border-white/10 text-white/70 text-[10px]">{t}</Badge>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ---------- COLLEGE PORTAL ----------
function CollegePortalTab() {
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [students, setStudents] = useState([])
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadCollegeData(refresh = false) {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [profileRes, studentsRes, drivesRes] = await Promise.all([
        fetch('/api/college/profile'),
        fetch('/api/college/students'),
        fetch('/api/college/drives'),
      ])

      const profileData = await profileRes.json()
      const studentsData = await studentsRes.json()
      const drivesData = await drivesRes.json()

      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to load college profile')
      if (!studentsRes.ok) throw new Error(studentsData.error || 'Failed to load students')
      if (!drivesRes.ok) throw new Error(drivesData.error || 'Failed to load placement drives')

      setProfile(profileData)
      setStudents(studentsData.students || [])
      setDrives(drivesData.drives || [])
    } catch (error) {
      toast.error(error.message || 'Failed to load college portal')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCollegeData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
      </div>
    )
  }

  const approved = students.filter(
    s => s.resumeStatus === 'Approved' || s.resumeApproved === true
  ).length

  const searching = students.filter(
    s => (s.placementStatus || '').toLowerCase() === 'searching'
  ).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-400" />
            <h1 className="text-3xl font-bold">College Portal</h1>
          </div>
          <p className="text-white/50 mt-1 text-sm">
            Manage students and campus placement.
          </p>
        </div>

        <Button
          onClick={() => loadCollegeData(true)}
          disabled={refreshing}
          variant="outline"
          className="border-white/10 bg-white/5"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* College header */}
      {profile && (
        <div className="glass-strong rounded-2xl p-5 border border-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="min-w-0">
              <div className="text-lg font-semibold">
                {profile.collegeName}
              </div>
              <div className="text-sm text-white/50">
                {profile.email}
              </div>
              {profile.address && (
                <div className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.address}
                </div>
              )}
            </div>

            <div className="ml-auto">
              {profile.isVerified ? (
                <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Verification Pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          ['overview', 'Overview', Layers],
          ['students', 'Students', Users],
          ['drives', 'Placement Drives', Briefcase],
          ['profile', 'College Profile', GraduationCap],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap ${
              tab === key
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-5">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass rounded-2xl p-5">
              <Users className="w-5 h-5 text-blue-400" />
              <div className="text-3xl font-bold mt-3">{students.length}</div>
              <div className="text-xs text-white/50">Total Students</div>
            </div>

            <div className="glass rounded-2xl p-5">
              <Check className="w-5 h-5 text-emerald-400" />
              <div className="text-3xl font-bold mt-3">{approved}</div>
              <div className="text-xs text-white/50">Resume Approved</div>
            </div>

            <div className="glass rounded-2xl p-5">
              <Target className="w-5 h-5 text-amber-400" />
              <div className="text-3xl font-bold mt-3">{searching}</div>
              <div className="text-xs text-white/50">Seeking Placement</div>
            </div>

            <div className="glass rounded-2xl p-5">
              <Briefcase className="w-5 h-5 text-violet-400" />
              <div className="text-3xl font-bold mt-3">
                {drives.filter(d => d.status === 'published').length}
              </div>
              <div className="text-xs text-white/50">Active Drives</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">

            <div className="glass rounded-2xl p-5">
              <div className="font-semibold">Latest Placement Drives</div>

              {drives.length === 0 ? (
                <div className="text-sm text-white/40 py-8 text-center">
                  No placement drives yet.
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  {drives.slice(0, 3).map(drive => (
                    <div
                      key={drive.id || drive._id}
                      className="glass rounded-xl p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm">
                            {drive.jobTitle}
                          </div>
                          <div className="text-xs text-white/50 mt-1">
                            {drive.companyName}
                          </div>
                        </div>

                        <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          {drive.status}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-white/40 mt-2">
                        {drive.location || 'Location not specified'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="font-semibold">Student Readiness</div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">Resume Approved</span>
                    <span>
                      {students.length
                        ? Math.round((approved / students.length) * 100)
                        : 0}%
                    </span>
                  </div>

                  <Progress
                    value={
                      students.length
                        ? (approved / students.length) * 100
                        : 0
                    }
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">Seeking Placement</span>
                    <span>
                      {students.length
                        ? Math.round((searching / students.length) * 100)
                        : 0}%
                    </span>
                  </div>

                  <Progress
                    value={
                      students.length
                        ? (searching / students.length) * 100
                        : 0
                    }
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Students */}
      {tab === 'students' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="text-lg font-semibold">Students</div>
            <div className="text-xs text-white/40 mt-1">
              {students.length} students linked to this college
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {students.map((student, index) => (
              <div
                key={student.userId || student._id || index}
                className="p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">

                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/50" />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">
                      {student.fullName || 'Unnamed Student'}
                    </div>

                    <div className="text-xs text-white/40 mt-1">
                      {student.department ||
                        student.branch ||
                        student.degree ||
                        'Profile details not added'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {student.cgpa > 0 && (
                      <Badge className="bg-white/5 border-white/10 text-white/60">
                        CGPA {student.cgpa}
                      </Badge>
                    )}

                    <Badge className={
                      student.resumeStatus === 'Approved' ||
                      student.resumeApproved
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }>
                      {student.resumeStatus === 'Approved' ||
                      student.resumeApproved
                        ? 'Resume Approved'
                        : 'Resume Pending'}
                    </Badge>

                    <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                      {student.placementStatus || 'Searching'}
                    </Badge>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placement Drives */}
      {tab === 'drives' && (
        <div className="space-y-4">
          {drives.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Briefcase className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <div className="font-medium">No placement drives</div>
            </div>
          ) : (
            drives.map(drive => (
              <div
                key={drive.id || drive._id}
                className="glass rounded-2xl p-5"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold">
                        {drive.jobTitle}
                      </div>

                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                        {drive.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-white/60 mt-1">
                      {drive.companyName}
                    </div>
                  </div>

                  <div className="text-xs text-white/40">
                    {drive.driveDate && (
                      <div>
                        Drive: {new Date(drive.driveDate).toLocaleDateString()}
                      </div>
                    )}

                    {drive.applicationDeadline && (
                      <div className="mt-1">
                        Deadline: {new Date(
                          drive.applicationDeadline
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {drive.description && (
                  <p className="text-sm text-white/65 mt-4">
                    {drive.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {drive.location && (
                    <Badge className="bg-white/5 border-white/10 text-white/60">
                      <MapPin className="w-3 h-3 mr-1" />
                      {drive.location}
                    </Badge>
                  )}

                  {drive.eligibility?.minCGPA != null && (
                    <Badge className="bg-white/5 border-white/10 text-white/60">
                      Min CGPA {drive.eligibility.minCGPA}
                    </Badge>
                  )}

                  {drive.eligibility?.maxBacklogs != null && (
                    <Badge className="bg-white/5 border-white/10 text-white/60">
                      Max Backlogs {drive.eligibility.maxBacklogs}
                    </Badge>
                  )}

                  {drive.eligibility?.branches?.length > 0 && (
                    <Badge className="bg-white/5 border-white/10 text-white/60">
                      {drive.eligibility.branches.join(', ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* College Profile */}
      {tab === 'profile' && (
        <div className="glass rounded-2xl p-6">
          <div className="text-lg font-semibold mb-5">
            College Profile
          </div>

          {profile && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['College Name', profile.collegeName],
                ['Email', profile.email],
                ['Phone', profile.phone],
                ['Website', profile.website],
                ['Address', profile.address],
                ['Verification', profile.isVerified ? 'Verified' : 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="glass rounded-xl p-4">
                  <div className="text-[11px] uppercase text-white/40">
                    {label}
                  </div>
                  <div className="text-sm mt-1 break-words">
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default Dashboard
