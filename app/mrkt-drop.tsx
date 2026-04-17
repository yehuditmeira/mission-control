import Link from 'next/link';
import { 
  LayoutGrid, 
  CheckCircle2, 
  Calendar, 
  Settings, 
  MessageSquare,
  TrendingUp,
  Bot,
  ArrowRight,
  Pin,
  FileText,
  Share2,
  Video
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Mission Control</h1>
              <p className="text-xs text-slate-500">Autonomous Marketing System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">7 Platforms · 4 Phases · Zero API Cost</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-3">The Mrkt Drop · Platform Automation</h2>
          <p className="text-purple-100 text-lg mb-6 max-w-2xl">
            Autonomous marketing agents for 7 social platforms using local Ollama models (qwen3:8b, gemma3:12b). 
            Zero API costs. Full GSD framework integration.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/platforms"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              <LayoutGrid size={18} />
              View Platforms
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="https://github.com/yomy/themrktdrop"
              target="_blank"
              className="inline-flex items-center gap-2 bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-800 transition-colors"
            >
              <Bot size={18} />
              Autonomous Jobs
            </Link>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              Platform Timeline
            </h2>
            <Link href="/platforms" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Timeline visualization */}
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                {['Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19', 'May 26', 'Jun 2'].map((date, i) => (
                  <div key={date} className="text-center">
                    <div className="text-xs font-medium text-slate-500">{date}</div>
                    <div className="w-3 h-3 rounded-full bg-slate-300 mx-auto mt-1"></div>
                  </div>
                ))}
              </div>
              
              {/* Platform bars */}
              <div className="space-y-3">
                {[
                  { name: 'Pinterest', start: 0, duration: 4, color: 'bg-red-500', icon: Pin },
                  { name: 'SEO/Blog', start: 1, duration: 4, color: 'bg-green-500', icon: FileText },
                  { name: 'Instagram', start: 2, duration: 4, color: 'bg-pink-500', icon: Share2 },
                  { name: 'WhatsApp', start: 3, duration: 4, color: 'bg-green-600', icon: MessageSquare },
                  { name: 'Facebook', start: 4, duration: 4, color: 'bg-blue-600', icon: Share2 },
                  { name: 'TikTok', start: 5, duration: 4, color: 'bg-black', icon: Video },
                  { name: 'Twitter/X', start: 6, duration: 4, color: 'bg-slate-800', icon: Share2 },
                ].map((platform, i) => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.name} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Icon size={14} />
                        {platform.name}
                      </div>
                      <div className="flex-1 relative h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute h-full ${platform.color} rounded-full flex items-center px-2 text-white text-xs font-medium`}
                          style={{
                            left: `${(platform.start / 7) * 100}%`,
                            width: `${(platform.duration / 7) * 100}%`
                          }}
                        >
                          {platform.start === i ? 'Setup → Autonomous' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/platforms?view=gantt">
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
              <TrendingUp size={24} className="text-purple-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Gantt Chart</h3>
              <p className="text-sm text-slate-500 mt-1">Visual timeline view</p>
            </div>
          </Link>
          
          <Link href="/platforms?view=kanban">
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
              <LayoutGrid size={24} className="text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Kanban Board</h3>
              <p className="text-sm text-slate-500 mt-1">Task management</p>
            </div>
          </Link>
          
          <Link href="/calendar">
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all">
              <Calendar size={24} className="text-green-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Calendar</h3>
              <p className="text-sm text-slate-500 mt-1">Events & deadlines</p>
            </div>
          </Link>
          
          <Link href="/settings">
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <Settings size={24} className="text-slate-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Settings</h3>
              <p className="text-sm text-slate-500 mt-1">Jobs & automation</p>
            </div>
          </Link>
        </div>

        {/* Status Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bot size={18} className="text-purple-600" />
              Autonomous Jobs
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Daily Pin Generator</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Weekly Analytics</span>
                <span className="text-slate-400">Scheduled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Keyword Tracker</span>
                <span className="text-slate-400">Scheduled</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              Upcoming Milestones
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div>
                  <div className="text-slate-900 font-medium">Apr 21 — Pinterest Phase 1</div>
                  <div className="text-slate-500">Foundation setup begins</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div>
                  <div className="text-slate-900 font-medium">Apr 28 — SEO/Blog Phase 1</div>
                  <div className="text-slate-500">Content engine foundation</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                <div>
                  <div className="text-slate-900 font-medium">May 19 — Pinterest Autonomous</div>
                  <div className="text-slate-500">First platform self-running</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Pin size={18} className="text-red-500" />
              Pinterest Priority
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Pinterest is the foundation platform for The Mrkt Drop. It drives traffic while other platforms build.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                10 boards planned
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                50 pins target (Phase 2)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                10-15 pins/day (Phase 3)
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
