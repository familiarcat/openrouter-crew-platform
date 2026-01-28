'use client'

import Link from 'next/link'
import { FolderKanban, ArrowLeft, ExternalLink } from 'lucide-react'

const DOMAINS = [
  {
    id: 'dj-booking',
    name: 'DJ-Booking',
    description: 'Event management, venue coordination, and artist bookings',
    color: 'from-purple-500 to-pink-500',
    port: 3001,
    features: ['Venue Management', 'Artist Booking', 'Event Coordination', '6 MCP Agents'],
    workflows: 12,
    status: 'development' as const
  },
  {
    id: 'product-factory',
    name: 'Product Factory',
    description: 'Sprint planning, RAG workflows, and product development',
    color: 'from-blue-500 to-cyan-500',
    port: 3002,
    features: ['Sprint Planning', 'RAG Automation', 'Cost Optimization', '54+ Workflows'],
    workflows: 54,
    status: 'development' as const
  },
  {
    id: 'alex-ai-universal',
    name: 'Alex-AI-Universal',
    description: 'CLI tools, VSCode integration, and universal platform features',
    color: 'from-green-500 to-teal-500',
    port: 3003,
    features: ['CLI Tools', 'VSCode Extension', 'Theme System', '36+ Workflows'],
    workflows: 36,
    status: 'development' as const
  }
]

export default function DomainsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Unified Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Domain Architecture</h1>
          <p className="text-xl text-gray-600">
            Explore individual domains within the unified platform
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Domain-Driven Design</h2>
          <p className="text-gray-700 mb-4">
            Each domain represents a bounded context with its own dashboard, workflows, and features.
            Successful features can be promoted from domain → shared → global.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">3</div>
              <div className="text-sm text-gray-600">Active Domains</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">102+</div>
              <div className="text-sm text-gray-600">Total Workflows</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">10</div>
              <div className="text-sm text-gray-600">Crew Members</div>
            </div>
          </div>
        </div>

        {/* Domains Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain) => (
            <Link
              key={domain.id}
              href={`/domains/${domain.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden h-full">
                {/* Gradient Header */}
                <div className={`h-32 bg-gradient-to-br ${domain.color} flex items-center justify-center`}>
                  <FolderKanban className="w-16 h-16 text-white opacity-80" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {domain.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded capitalize">
                      {domain.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm">
                    {domain.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {domain.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{domain.workflows}+</div>
                      <div className="text-xs text-gray-600">Workflows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">:{domain.port}</div>
                      <div className="text-xs text-gray-600">Port</div>
                    </div>
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">View Details</span>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Feature Federation Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Feature Federation
          </h3>
          <p className="text-blue-800 mb-4">
            Promote successful features from individual domains to shared infrastructure:
          </p>
          <div className="flex items-center gap-4 text-sm font-mono bg-white rounded px-4 py-3">
            <span className="text-purple-600">Domain</span>
            <span className="text-gray-400">→</span>
            <span className="text-blue-600">Shared</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600">Global</span>
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Learn More
          </h3>
          <p className="text-gray-700 mb-4">
            Explore the complete DDD architecture documentation
          </p>
          <Link
            href="/docs/architecture"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Architecture Docs
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
