import * as vscode from 'vscode';
import { ToolDefinition } from '../services/types.js';

export const searchTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'searchWeb',
                description: 'Search the web for up-to-date information, news, or data on a given topic.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'The search query.' }
                    },
                    required: ['query']
                }
            }
        },
        execute: async (args, agent) => {
            const config = vscode.workspace.getConfiguration('openrouterCrew');
            const apiKey = config.get<string>('serperApiKey');

            if (!apiKey) {
                return "Error: Serper API key is not configured. Please set 'openrouterCrew.serperApiKey' in your settings.";
            }

            try {
                const response = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ q: args.query })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    return `Error searching web: ${response.status} - ${errorText}`;
                }

                const data = await response.json() as any;

                if (!data.organic || data.organic.length === 0) {
                    return "No search results found.";
                }

                // Format results into a concise string for the agent
                const formattedResults = data.organic.slice(0, 5).map((item: any, index: number) => 
                    `${index + 1}. ${item.title}\n   Link: ${item.link}\n   Snippet: ${item.snippet}`
                ).join('\n\n');

                return `Search results for "${args.query}":\n\n${formattedResults}`;

            } catch (e: any) {
                return `Error during web search: ${e.message}`;
            }
        }
    }
];