'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FolderKanban, ArrowLeft } from 'lucide-react'

interface DomainInfo {
  name: string
  title: string
  description: string
  port: number
  status: 'active' | 'development' | 'planned'
  features: string[]
  workflows: number
}

const DOMAINS: Record<string, DomainInfo> = {
  'dj-booking': {
    name: 'dj-booking',
    title: 'DJ-Booking Domain',
    description: 'Event management, venue coordination, and artist bookings',
    port: 3001,
    status: 'development',
    features: ['Venue Management', 'Artist Booking', 'Event Coordination', '6 MCP Agents'],
    workflows: 12
  },
  'product-factory': {
    name: 'product-factory',
    title: 'Product Factory Domain',
    description: 'Sprint planning, RAG workflows, and product development',
    port: 3002,
    status: 'development',
    features: ['Sprint Planning', 'RAG Automation', 'Cost Optimization', '54+ Workflows'],
    workflows: 54
  },
  'alex-ai-universal': {
    name: 'alex-ai-universal',
    title: 'Alex-AI-Universal Domain',
    description: 'CLI tools, VSCode integration, and universal platform features',
    port: 3003,
    status: 'development',
    features: ['CLI Tools', 'VSCode Extension', 'Theme System', '36+ Workflows'],
    workflows: 36
  }
}

export default function DomainPage() {
  const params = useParams()
  const domainName = params.domain as string
  const domain = DOMAINS[domainName]

  const [isDomainRunning, setIsDomainRunning] = useState(false)

  useEffect(() => {
    if (domain) {
      // Check if domain dashboard is running
      fetch(`http://localhost:${domain.port}/api/health`)
        .then(() => setIsDomainRunning(true))
        .catch(() => setIsDomainRunning(false))
    }
  }, [domain])

  if (!domain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain Not Found</h1>
          <p className="text-gray-600 mb-6">
            The domain "{domainName}" does not exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Unified Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{domain.title}</h1>
              <p className="text-gray-600">{domain.description}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isDomainRunning
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isDomainRunning ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            {isDomainRunning ? 'Running' : 'Not Running'}
          </span>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 mb-8">
          {/* Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-2 gap-4">
              {domain.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflows */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">N8N Workflows</h2>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {domain.workflows}+
            </div>
            <p className="text-gray-600">
              Automated workflows for domain-specific operations
            </p>
          </div>

          {/* Development Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Development Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Status</span>
                  <span className="font-medium capitalize">{domain.status}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Port</span>
                  <span className="font-mono">{domain.port}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>

          {isDomainRunning ? (
            <div className="space-y-4">
              <a
                href={`http://localhost:${domain.port}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Open {domain.title} Dashboard →
              </a>
              <p className="text-sm text-gray-600 text-center">
                Opens in new window at localhost:{domain.port}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium mb-2">
                  Domain dashboard is not running
                </p>
                <p className="text-yellow-700 text-sm mb-4">
                  Start the domain dashboard to access its features:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                  cd domains/{domain.name}/dashboard{'\n'}
                  pnpm dev
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Domain Documentation
          </h3>
          <p className="text-blue-800 mb-4">
            Learn more about this domain's architecture, workflows, and features.
          </p>
          <Link
            href={`/domains/${domain.name}/docs`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Documentation →
          </Link>
        </div>
      </div>
    </div>
  )
}
