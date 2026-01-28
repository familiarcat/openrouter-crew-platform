export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          🎧 DJ Studio AI
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Multi-agent platform for professional DJs
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2">Booking Agent</h3>
            <p className="text-gray-400 mb-2">Port 3001</p>
            <p className="text-sm text-gray-500">Event scheduling & conflict detection</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Finance Agent</h3>
            <p className="text-gray-400 mb-2">Port 3002</p>
            <p className="text-sm text-gray-500">Payment tracking & budget analysis</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold mb-2">Music Agent</h3>
            <p className="text-gray-400 mb-2">Port 3003</p>
            <p className="text-sm text-gray-500">Playlist curation & recommendations</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-all">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Marketing Agent</h3>
            <p className="text-gray-400 mb-2">Port 3004</p>
            <p className="text-sm text-gray-500">Social media & promotional content</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-indigo-500/50 transition-all">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-2">Venue Agent</h3>
            <p className="text-gray-400 mb-2">Port 3005</p>
            <p className="text-sm text-gray-500">Venue discovery & networking</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">Gateway</h3>
            <p className="text-gray-400 mb-2">Port 3000</p>
            <p className="text-sm text-gray-500">Agent coordination & routing</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">🚀 System Status</h2>
          <p className="text-gray-300">All agents operational and ready to coordinate.</p>
        </div>
      </div>
    </div>
  )
}
