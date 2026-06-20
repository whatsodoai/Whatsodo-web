import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  MessageCircle,
  Bot,
  TrendingUp,
  Shield,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react';
import DemoCredentials from '@/components/landing/DemoCredentials';

export const metadata: Metadata = {
  title: 'Whatsodo — AI WhatsApp CRM for Growing Businesses',
  description:
    'Turn every WhatsApp inquiry into a paying customer. Whatsodo captures leads, replies instantly with AI, books appointments, and gives you a full sales dashboard — all from WhatsApp.',
  keywords: [
    'WhatsApp CRM',
    'AI WhatsApp automation',
    'WhatsApp lead management',
    'WhatsApp business tools',
    'AI chatbot WhatsApp',
    'WhatsApp sales automation',
  ],
  openGraph: {
    type: 'website',
    title: 'Whatsodo — AI WhatsApp CRM',
    description:
      'Capture leads, reply with AI, book appointments, and track your pipeline — all through WhatsApp.',
    siteName: 'Whatsodo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whatsodo — AI WhatsApp CRM',
    description:
      'Turn WhatsApp conversations into paying customers with AI-powered automation.',
  },
  robots: { index: true, follow: true },
};

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Auto Lead Capture',
    desc: 'Every WhatsApp message is captured as a lead automatically — no manual entry, zero drop-off.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Replies',
    desc: 'Your AI assistant answers questions 24/7 using your knowledge base, so you never miss a hot lead.',
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    desc: 'Customers book slots directly over WhatsApp. Availability syncs in real time.',
  },
  {
    icon: TrendingUp,
    title: 'Sales Pipeline',
    desc: 'Track every lead from first message to closed deal with a visual Kanban board.',
  },
  {
    icon: Users,
    title: 'Unified Inbox',
    desc: 'All your WhatsApp conversations in one place. Reply, tag, and follow up without switching apps.',
  },
  {
    icon: BarChart3,
    title: 'Live Dashboard',
    desc: 'See revenue, conversion rates, and lead volume at a glance — updated in real time.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect your WhatsApp',
    desc: 'Link your WhatsApp Business number in under 2 minutes.',
  },
  {
    step: '02',
    title: 'Add your knowledge base',
    desc: 'Tell the AI about your business — products, pricing, FAQs, hours.',
  },
  {
    step: '03',
    title: 'Go live',
    desc: 'AI starts capturing and qualifying leads instantly. You focus on closing.',
  },
];

const STATS = [
  { value: '10×', label: 'Faster response time' },
  { value: '3×', label: 'More conversions' },
  { value: '100%', label: 'Lead capture rate' },
  { value: '24/7', label: 'AI availability' },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Whatsodo',
            applicationCategory: 'BusinessApplication',
            description:
              'AI-powered WhatsApp CRM that captures leads, replies automatically, and tracks your sales pipeline.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="min-h-screen bg-white font-sans">
        {/* ── Nav ── */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 text-lg">Whatsodo</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
              <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
              <a href="#demo" className="hover:text-gray-900 transition-colors">Demo</a>
            </nav>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/20"
            >
              Sign in <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 pt-24 pb-32 px-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-sm font-medium">AI WhatsApp CRM</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Turn WhatsApp chats into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                paying customers
              </span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Whatsodo captures every lead, replies instantly with AI, books appointments,
              and tracks your entire sales pipeline — all through WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-xl shadow-green-500/30 text-sm"
              >
                Get started free <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="flex items-center gap-2 text-gray-300 border border-white/10 hover:border-white/25 px-8 py-3.5 rounded-xl text-sm font-medium transition-all"
              >
                Try the demo
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {STATS.map(({ value, label }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-gray-400 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to sell on WhatsApp
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                One platform replaces your CRM, chatbot, booking tool, and inbox.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Up and running in minutes
              </h2>
              <p className="text-gray-500 text-lg">No technical setup needed.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/25">
                    <span className="text-white font-bold text-lg">{step}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Value props ── */}
        <section className="py-16 px-6 bg-gradient-to-r from-green-50 to-emerald-50 border-y border-green-100">
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'No lead falls through the cracks',
                'AI replies while you sleep',
                'Full conversation history',
                'Appointment reminders via WhatsApp',
                'Real-time pipeline visibility',
                'Works with any business type',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Demo credentials ── */}
        <section id="demo" className="py-24 px-6 bg-white">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-700 text-sm font-medium">Live demo available</span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Explore a real account
            </h2>
            <p className="text-gray-500 mb-10">
              Use the credentials below to log in and explore actual leads, conversations,
              and the AI dashboard.
            </p>

            <DemoCredentials email="ragavendar@test.com" password="Loshini@21" />

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 text-sm"
            >
              Open login page <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 px-6 bg-gradient-to-br from-gray-950 via-gray-900 to-green-950">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to grow with WhatsApp?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join businesses already using Whatsodo to convert more leads on autopilot.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-xl shadow-green-500/30 text-sm"
            >
              Start for free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-gray-950 border-t border-white/5 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-gray-300 font-semibold">Whatsodo</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Whatsodo. AI WhatsApp CRM for growing businesses.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
              <Shield className="w-4 h-4 text-gray-600" />
              <span>Privacy-first</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
