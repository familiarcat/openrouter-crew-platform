'use client';

import { useState } from 'react';

export default function YoutubeIngestForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setFeedback('');

    try {
      // Pointing to the Alex AI Universal Dashboard API (Port 3003)
      // In production, configure NEXT_PUBLIC_ALEX_AI_URL in .env.local
      const apiBase = process.env.NEXT_PUBLIC_ALEX_AI_URL || 'http://localhost:3003';
      const endpoint = `${apiBase}/api/ingest/youtube`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ensure NEXT_PUBLIC_CREW_KEY matches CREW_KEY in alex-ai-universal/.env
          'x-crew-key': process.env.NEXT_PUBLIC_CREW_KEY || '',
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ingestion failed');
      }

      setStatus('success');
      setFeedback(`Ingested successfully. Payload: ${data.payload}`);
      setUrl('');
    } catch (error) {
      console.error('Ingestion error:', error);
      setStatus('error');
      const message = error instanceof Error ? error.message : 'An error occurred during ingestion.';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        New Knowledge Source
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Ingest a YouTube video transcript into the RAG memory system.
      </p>
      
      <form onSubmit={handleIngest} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            YouTube URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded text-white font-semibold transition-colors ${
            loading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Processing...' : 'Ingest to Memory'}
        </button>
      </form>

      {feedback && (
        <div
          className={`mt-4 p-3 rounded text-sm ${
            status === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}