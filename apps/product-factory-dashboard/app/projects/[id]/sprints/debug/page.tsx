'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SprintDebugPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/sprints?project_id=${projectId}&status=active&include_stories=true`)
      .then(res => res.json())
      .then(setData);
  }, [projectId]);

  if (!data) return <div className="p-8">Loading...</div>;

  const sprint = data.sprints?.[0];
  if (!sprint) return <div className="p-8">No sprint found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Sprint Debug Page</h1>

      {/* Test 1: Basic Flexbox */}
      <div className="mb-8 p-4 border border-gray-300 rounded">
        <h2 className="font-bold mb-4">Test 1: Horizontal Flexbox</h2>
        <div className="flex gap-4 bg-yellow-100 p-4">
          <div className="bg-red-200 p-4">Box 1</div>
          <div className="bg-blue-200 p-4">Box 2</div>
          <div className="bg-green-200 p-4">Box 3</div>
        </div>
        <p className="text-sm mt-2">✅ If boxes are horizontal, Tailwind flex is working</p>
      </div>

      {/* Test 2: Sprint Data */}
      <div className="mb-8 p-4 border border-gray-300 rounded">
        <h2 className="font-bold mb-4">Test 2: Sprint Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(sprint, null, 2)}
        </pre>
      </div>

      {/* Test 3: Simple Timeline */}
      <div className="mb-8 p-4 border border-gray-300 rounded">
        <h2 className="font-bold mb-4">Test 3: Simple Horizontal Timeline</h2>
        <div className="overflow-x-auto">
          <div className="flex border border-gray-300">
            {/* Crew header */}
            <div className="w-40 flex-shrink-0 bg-gray-200 p-4 font-bold border-r">
              Crew
            </div>
            {/* Day columns */}
            {[1,2,3,4,5,6,7,8,9,10].map(day => (
              <div key={day} className="w-24 flex-shrink-0 border-r p-2 text-center bg-blue-50">
                <div className="font-bold">Day {day}</div>
                <div className="text-xs">Dec {27+day}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm mt-2">✅ If days are horizontal, layout is working</p>
      </div>

      {/* Test 4: Stories */}
      <div className="mb-8 p-4 border border-gray-300 rounded">
        <h2 className="font-bold mb-4">Test 4: Stories ({sprint.stories?.length || 0})</h2>
        <div className="space-y-2">
          {sprint.stories?.map((story: any) => (
            <div key={story.id} className="p-3 bg-blue-100 rounded border border-blue-300">
              <div className="font-semibold">{story.title}</div>
              <div className="text-sm text-gray-600">
                Crew: {story.assigned_crew_member} | Points: {story.story_points} | Priority: {story.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
