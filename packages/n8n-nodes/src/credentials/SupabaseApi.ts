/**
 * Supabase API Credentials for n8n
 * Provides authentication for Supabase-based operations
 */

import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SupabaseApi implements ICredentialType {
  name = 'supabaseApi';
  displayName = 'Supabase API';
  properties: INodeProperties[] = [
    {
      displayName: 'Supabase URL',
      name: 'url',
      type: 'string',
      required: true,
      typeOptions: {
        password: false,
      },
      description: 'Your Supabase project URL',
      placeholder: 'https://project.supabase.co',
    },
    {
      displayName: 'API Key',
      name: 'key',
      type: 'string',
      required: true,
      typeOptions: {
        password: true,
      },
      description: 'Your Supabase API key (anon or service role)',
    },
  ];
}
