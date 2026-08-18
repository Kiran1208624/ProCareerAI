'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, FileText, Target, MessageSquare, Zap, BarChart3, Calendar,
  Mail, Briefcase, ArrowRight, Check, Send, Loader2, ChevronRight,
  Bot, Star, Rocket, Shield, Layers, Cpu, Wand2, Copy, Download,
  TrendingUp, User, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast, Toaster } from 'sonner'

const SAMPLE_RESUME = `John Doe
Software Engineer | john@example.com | linkedin.com/in/johndoe

EXPERIENCE
Software Engineer, Acme Corp (2022-Present)
- Worked on backend services in Node.js
- Helped migrate database from MySQL to Postgres
- Fixed bugs and did code reviews

Junior Developer, StartupXYZ (2020-2022)
- Built frontend features in React
- Worked with team on new features

EDUCATION
B.S. Computer Science, State University, 2020

SKILLS
JavaScript, React, Node.js, SQL, Git`

const SAMPLE_JD = `We're hiring a Senior Full-Stack Engineer to build scalable web applications.
Required: 4+ years experience with React, TypeScript, Node.js, and PostgreSQL.
Nice to have: AWS, Docker, Kubernetes, GraphQL, CI/CD, system design.
You'll own features end-to-end, mentor juniors, and improve engineering standards.`

const brands = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Netflix', 'Meta', 'OpenAI', 'Adobe', 'Stripe']

const featureList = [
  { icon: FileText, title: 'AI Resume Builder', desc: 'Craft ATS-optimized resumes with AI in seconds.', color: 'text-emerald-400' },
  { icon: Target, title: 'ATS Score Analyzer', desc: 'Instant scoring against real ATS logic + job descriptions.', color: 'text-blue-400' },
  { icon: Wand2, title: 'Resume Tailoring', desc: 'Rewrite your resume for any job — truthful, keyword-aligned.', color: 'text-violet-400' },
  { icon: Bot, title: 'AI Career Coach', desc: '24/7 personalized coaching for direction, growth & interviews.', color: 'text-amber-400' },
  { icon: Briefcase, title: 'Job Tracker', desc: 'Wishlist → Applied → Interview → Offer, all in one board.', color: 'text-pink-400' },
  { icon: MessageSquare, title: 'Interview Prep', desc: 'Mock interviews and feedback powered by GPT-4o.', color: 'text-cyan-400' },
  { icon: Calendar, title: 'Calendar Sync', desc: 'Google Calendar integration for interviews & deadlines.', color: 'text-emerald-400' },
  { icon: Mail, title: 'Gmail Insights', desc: 'AI reads recruiter emails and drafts perfect replies.', color: 'text-blue-400' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track applications, interviews, and career growth trends.', color: 'text-violet-400' },
]

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="glass-strong border-b border-white/5">
        <div className="container flex items-center justify-between h-16">
        <a
  href="#"
  className="flex items-center gap-3 group select-none"
>
  {/* Veyra AI logo mark */}
  <div
    className="
      relative flex items-center justify-center
      w-10 h-10 rounded-xl
      bg-gradient-to-br from-emerald-400 via-blue-500 to-violet-600
      shadow-[0_0_28px_rgba(59,130,246,0.28)]
      transition-all duration-300
      group-hover:scale-105
      group-hover:shadow-[0_0_38px_rgba(99,102,241,0.45)]
    "
  >
    <svg
      viewBox="0 0 48 48"
      className="relative w-7 h-7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* AI sparkle */}
      <path
        d="M34 7L35.7 11.3L40 13L35.7 14.7L34 19L32.3 14.7L28 13L32.3 11.3L34 7Z"
        fill="white"
      />

      {/* Veyra V */}
      <path
        d="M8 17H16L24 34L32 17H40L28.5 39C27.7 40.6 26.1 41.5 24 41.5C21.9 41.5 20.3 40.6 19.5 39L8 17Z"
        fill="white"
      />
    </svg>
  </div>

  {/* Veyra AI wordmark */}
  <span className="text-[21px] font-bold tracking-[-0.03em] text-white leading-none">
    Veyra
    <span className="ml-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">
      AI
    </span>
  </span>
</a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workspace" className="hover:text-white transition">Products</a>
            <a href="#integrations" className="hover:text-white transition">Integrations</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/api/auth/google" className="hidden md:inline-flex">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5">Log in</Button>
            </a>
            <a href="/api/auth/google">
              <Button className="bg-white text-black hover:bg-white/90 rounded-full font-medium">Sign in with Google <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </a>
            <button className="md:hidden ml-1 text-white" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-white/5 px-6 py-4 flex flex-col gap-3 text-sm">
            <a href="#features" onClick={() => setOpen(false)} className="text-white/80">Features</a>
            <a href="#workspace" onClick={() => setOpen(false)} className="text-white/80">Products</a>
            <a href="#integrations" onClick={() => setOpen(false)} className="text-white/80">Integrations</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-white/80">Pricing</a>
          </div>
        )}
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <div className="aurora" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge className="mb-6 bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 rounded-full px-4 py-1.5">
            <Sparkles className="w-3 h-3 mr-1.5 text-emerald-400" /> Powered by GPT-4o · Now in Beta
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="text-gradient">Your AI</span>
            <br />
            <span className="text-gradient-brand">Career Operating System</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Build resumes, land interviews, and manage your entire career from one intelligent workspace. Veyra learns you, coaches you, and moves you forward — every day.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <a href="/api/auth/google">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-7 h-12 font-semibold">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Button>
            </a>
            <a href="#workspace">
              <Button size="lg" variant="outline" className="rounded-full px-7 h-12 border-white/15 bg-white/5 hover:bg-white/10 text-white">
                Try Free (no signup)
              </Button>
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
            <span className="mx-2">·</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Free forever plan
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
          className="mt-24"
        >
          <p className="text-center text-xs uppercase tracking-widest text-white/40 mb-6">Trusted by professionals hired at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-white/40">
            {brands.map(b => (
              <span key={b} className="text-lg font-semibold tracking-tight hover:text-white/70 transition">{b}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-violet-500/20 blur-3xl opacity-40 -z-10" />
          <div className="glass-strong rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 text-center text-xs text-white/40">veyra.ai / workspace</div>
            </div>
            <DashboardMock />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function DashboardMock() {
  const sidebar = [
    { icon: Layers, label: 'Dashboard', active: true },
    { icon: FileText, label: 'Resume' },
    { icon: Briefcase, label: 'Jobs' },
    { icon: Target, label: 'Applications' },
    { icon: Calendar, label: 'Calendar' },
    { icon: Mail, label: 'Gmail' },
    { icon: Bot, label: 'AI Assistant' },
    { icon: BarChart3, label: 'Analytics' },
  ]
  const stats = [
    { label: 'Resume Score', value: '92', delta: '+8', color: 'from-emerald-500 to-emerald-700' },
    { label: 'Applications', value: '24', delta: '+3', color: 'from-blue-500 to-blue-700' },
    { label: 'Interviews', value: '6', delta: '+2', color: 'from-violet-500 to-violet-700' },
    { label: 'Offers', value: '2', delta: '+1', color: 'from-amber-500 to-amber-700' },
  ]
  return (
    <div className="grid grid-cols-12 min-h-[420px]">
      <div className="col-span-3 border-r border-white/5 p-4 space-y-1 bg-black/20 hidden md:block">
        {sidebar.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${item.active ? 'bg-white/5 text-white' : 'text-white/50 hover:bg-white/[0.02]'}`}>
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="col-span-12 md:col-span-9 p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="text-xs text-white/40 mb-1">{s.label}</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{s.value}</div>
                <Badge className={`bg-gradient-to-r ${s.color} text-white border-0 text-[10px]`}>{s.delta}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 glass rounded-xl p-4">
            <div className="text-xs text-white/40 mb-3">Career Growth</div>
            <div className="flex items-end gap-1.5 h-24">
              {[30, 45, 38, 60, 55, 72, 68, 85, 78, 92, 88, 95].map((v, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-400 rounded-t" style={{ height: `${v}%` }} />
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="text-xs text-white/40">AI Suggestions</div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />
              <div className="text-xs text-white/70">Add 2 quantified metrics to your bullet points</div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-blue-400" />
              <div className="text-xs text-white/70">Practice system design for Meta interview</div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-violet-400" />
              <div className="text-xs text-white/70">Follow up on Google application (day 5)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 border-t border-white/5">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-white/10 text-white/60">Everything you need</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">One platform. Every career stage.</h2>
          <p className="mt-4 text-white/50">Nine AI-native modules working together as your personal career operating system.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureList.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:bg-white/[0.04] transition group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScoreRing({ value }) {
  const pct = Math.max(0, Math.min(100, value))
  const stroke = pct >= 80 ? '#10B981' : pct >= 60 ? '#3B82F6' : pct >= 40 ? '#F59E0B' : '#EF4444'
  const c = 2 * Math.PI * 32
  return (
    <svg width="80" height="80" className="-rotate-90">
      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="40" cy="40" r="32" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-xl font-semibold mt-1">{value ?? '—'}<span className="text-xs text-white/40">/100</span></div>
    </div>
  )
}

function ATSAnalyzer() {
  const [resume, setResume] = useState(SAMPLE_RESUME)
  const [jd, setJd] = useState(SAMPLE_JD)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function analyze() {
    if (!resume.trim()) return toast.error('Paste your resume first')
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/ats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      toast.success('ATS analysis complete')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Your Resume</label>
          <Textarea value={resume} onChange={e => setResume(e.target.value)} rows={10} className="bg-black/40 border-white/10 text-white/90 font-mono text-sm resize-none" placeholder="Paste your resume text..." />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Job Description (optional)</label>
          <Textarea value={jd} onChange={e => setJd(e.target.value)} rows={6} className="bg-black/40 border-white/10 text-white/90 text-sm resize-none" placeholder="Paste the job description..." />
        </div>
        <Button onClick={analyze} disabled={loading} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 text-white font-medium rounded-lg">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with GPT-4o...</> : <><Zap className="w-4 h-4 mr-2" /> Run ATS Analysis</>}
        </Button>
      </div>
      <div>
        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Get your ATS score in seconds</h3>
              <p className="text-sm text-white/50 max-w-sm">Real-time scoring, missing keywords, quantified impact analysis and 5 concrete improvements — every time.</p>
            </motion.div>
          )}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
              <div className="text-sm text-white/60">GPT-4o is scoring your resume...</div>
            </motion.div>
          )}
          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">ATS Score</div>
                    <div className="text-5xl font-bold text-gradient-brand">{result.atsScore}<span className="text-2xl text-white/40">/100</span></div>
                  </div>
                  <ScoreRing value={result.atsScore || 0} />
                </div>
                <Progress value={result.atsScore || 0} className="h-1.5 bg-white/10" />
                <p className="mt-4 text-sm text-white/70 leading-relaxed">{result.summary}</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <MiniStat label="Impact" value={result.impactScore} />
                  <MiniStat label="Clarity" value={result.clarityScore} />
                </div>
              </div>
              {result.recommendations?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-400" /> Top Recommendations</div>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-white/70 flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {result.matchedKeywords?.length > 0 && (
                  <div className="glass rounded-2xl p-4">
                    <div className="text-xs uppercase text-white/50 mb-2">Matched Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedKeywords.map((k, i) => (
                        <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.missingKeywords?.length > 0 && (
                  <div className="glass rounded-2xl p-4">
                    <div className="text-xs uppercase text-white/50 mb-2">Missing Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingKeywords.map((k, i) => (
                        <Badge key={i} className="bg-red-500/10 text-red-300 border border-red-500/20 text-[11px]">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ResumeTailor() {
  const [resume, setResume] = useState(SAMPLE_RESUME)
  const [jd, setJd] = useState(SAMPLE_JD)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function tailor() {
    if (!resume.trim()) return toast.error('Paste your resume first')
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/ai/tailor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Tailor failed')
      setResult(data)
      toast.success('Resume tailored')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function copy() {
    if (!result?.tailoredResume) return
    await navigator.clipboard.writeText(result.tailoredResume)
    toast.success('Copied to clipboard')
  }

  function download() {
    if (!result?.tailoredResume) return
    const blob = new Blob([result.tailoredResume], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tailored-resume.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Your Resume</label>
          <Textarea value={resume} onChange={e => setResume(e.target.value)} rows={10} className="bg-black/40 border-white/10 text-white/90 font-mono text-sm resize-none" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Target Job Description</label>
          <Textarea value={jd} onChange={e => setJd(e.target.value)} rows={6} className="bg-black/40 border-white/10 text-white/90 text-sm resize-none" />
        </div>
        <Button onClick={tailor} disabled={loading} className="w-full h-11 bg-gradient-to-r from-violet-500 to-blue-500 hover:opacity-90 text-white font-medium rounded-lg">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rewriting with GPT-4o...</> : <><Wand2 className="w-4 h-4 mr-2" /> Tailor My Resume</>}
        </Button>
      </div>
      <div>
        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Rewrite your resume for any job</h3>
              <p className="text-sm text-white/50 max-w-sm">Truthful, keyword-optimized, action-verb driven. Never invents anything you didn't do.</p>
            </motion.div>
          )}
          {loading && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400 mb-4" />
              <div className="text-sm text-white/60">Crafting your tailored resume...</div>
            </motion.div>
          )}
          {result && (
            <motion.div key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-strong rounded-2xl border border-violet-500/20 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/40">
                  <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400" /> Tailored Resume</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={copy} className="h-8 text-white/70 hover:text-white hover:bg-white/5"><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                    <Button size="sm" variant="ghost" onClick={download} className="h-8 text-white/70 hover:text-white hover:bg-white/5"><Download className="w-3.5 h-3.5 mr-1" /> .txt</Button>
                  </div>
                </div>
                <pre className="p-5 text-xs font-mono whitespace-pre-wrap text-white/85 max-h-[380px] overflow-auto leading-relaxed">{result.tailoredResume}</pre>
              </div>
              {result.changesExplained?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-400" /> What changed & why</div>
                  <ul className="space-y-2">
                    {result.changesExplained.map((c, i) => (
                      <li key={i} className="text-sm text-white/70 flex gap-2"><ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.keywordsAdded?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="text-xs uppercase text-white/50 mb-2">Keywords woven in</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordsAdded.map((k, i) => (
                      <Badge key={i} className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[11px]">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CareerCoach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm Veyra — your AI career coach. Tell me about your career goals, current role, or the challenge you want to solve. I'll give you honest, actionable next steps." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) return window.crypto.randomUUID()
    return 'sess-' + Math.random().toString(36).slice(2, 12)
  })
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

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

  const suggestions = [
    "How do I transition from frontend to full-stack?",
    "What should I do in my first 90 days at a new job?",
    "Help me prepare for a system design interview",
    "How do I negotiate a higher salary?",
  ]

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Veyra Career Coach</div>
            <div className="text-[11px] text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" /> Online · GPT-4o</div>
          </div>
        </div>
        <Badge className="bg-white/5 border border-white/10 text-white/70 text-[10px]">Session · {sessionId.slice(0, 6)}</Badge>
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
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="p-4 border-t border-white/5 bg-black/40">
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about resumes, interviews, career direction..."
            disabled={loading}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30 h-11"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-5 bg-white text-black hover:bg-white/90">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function Workspace() {
  return (
    <section id="workspace" className="relative py-24 border-t border-white/5">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Live · Try it now</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">Your AI workspace</h2>
          <p className="mt-4 text-white/50">All three flagship AI tools — free, right here, no signup. Powered by GPT-4o.</p>
        </div>
        <Tabs defaultValue="ats" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-xl mx-auto bg-black/40 border border-white/10 rounded-full p-1 h-12 mb-8">
            <TabsTrigger value="ats" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-white/70 gap-1.5">
              <Target className="w-3.5 h-3.5" /> ATS Score
            </TabsTrigger>
            <TabsTrigger value="tailor" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-white/70 gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Tailor
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-white/70 gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Coach
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ats"><ATSAnalyzer /></TabsContent>
          <TabsContent value="tailor"><ResumeTailor /></TabsContent>
          <TabsContent value="chat"><div className="max-w-3xl mx-auto"><CareerCoach /></div></TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function Integrations() {
  const integrations = ['Google', 'Gmail', 'Calendar', 'Drive', 'LinkedIn', 'GitHub', 'Notion', 'Slack', 'Zoom', 'OpenAI']
  return (
    <section id="integrations" className="py-24 border-t border-white/5">
      <div className="container text-center">
        <Badge variant="outline" className="mb-4 border-white/10 text-white/60">Integrations</Badge>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-4">Connects to your world</h2>
        <p className="text-white/50 max-w-xl mx-auto">Veyra plugs into the tools you already use so your career runs on autopilot.</p>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
          {integrations.map(name => (
            <div key={name} className="glass rounded-xl px-4 py-6 hover:bg-white/5 transition text-sm font-medium text-white/70">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!email.includes('@')) return toast.error('Enter a valid email')
    setLoading(true)
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!r.ok) throw new Error('Failed')
      setDone(true); toast.success("You're on the list — welcome to Veyra")
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }
  return (
    <section id="pricing" className="py-28 border-t border-white/5 relative overflow-hidden">
      <div className="aurora opacity-50" />
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center glass-strong rounded-3xl p-10 border border-white/10">
          <Rocket className="w-10 h-10 mx-auto text-emerald-400 mb-4" />
          <h2 className="text-4xl font-bold tracking-tight text-gradient">Ready to run your career on AI?</h2>
          <p className="mt-3 text-white/60">Join the Veyra waitlist. Be first to get full workspace access.</p>
          {!done ? (
            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@work.com" type="email" className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30" />
              <Button type="submit" disabled={loading} className="h-12 px-6 bg-white text-black hover:bg-white/90 font-semibold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join Waitlist <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </form>
          ) : (
            <div className="mt-8 flex items-center justify-center gap-2 text-emerald-300">
              <Check className="w-5 h-5" /> You're on the list. See you inside.
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/40 flex-wrap">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SOC 2 ready</span>
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> GPT-4o powered</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Free forever plan</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold">Veyra</span>
          <span className="text-white/40 text-sm">· Your AI Career OS</span>
        </div>
        <div className="text-xs text-white/40">© {new Date().getFullYear()} Veyra AI · Built with GPT-4o</div>
      </div>
    </footer>
  )
}

function App() {
  const [authError, setAuthError] = useState(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('auth_error')
    if (err) {
      setAuthError(err)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
  }, [])
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Toaster theme="dark" position="top-right" />
      {authError && (
        <div className="fixed top-20 inset-x-0 z-40 flex justify-center px-4">
          <div className="glass-strong border border-red-500/30 rounded-xl px-4 py-3 max-w-2xl flex items-start gap-3">
            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-red-300 mb-1">Google sign-in failed</div>
              <div className="text-white/70 mb-2">Reason: <code className="text-white/90 bg-white/5 px-1.5 py-0.5 rounded text-xs">{authError}</code></div>
              <div className="text-white/60 text-xs leading-relaxed">
                Common fixes: (1) In Google Cloud Console → <b>OAuth consent screen</b>, add your email under <b>Test users</b>. (2) Ensure the app's <b>Publishing status</b> is set correctly. (3) Confirm the redirect URI <code className="text-white/80 bg-white/5 px-1 rounded">/api/auth/google/callback</code> is authorized.
              </div>
            </div>
            <button onClick={() => setAuthError(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <Nav />
      <Hero />
      <FeaturesSection />
      <Workspace />
      <Integrations />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
