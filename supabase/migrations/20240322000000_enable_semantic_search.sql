-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add embedding column to crew_knowledge table
-- Using 1536 dimensions for OpenAI text-embedding-3-small compatibility
alter table crew_knowledge
add column if not exists embedding vector(1536);

-- Create an index for faster similarity search
create index if not exists crew_knowledge_embedding_idx
on crew_knowledge
using hnsw (embedding vector_cosine_ops);

-- Create a function to search for crew knowledge
create or replace function search_crew_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  crew_member text,
  topic text,
  content text,
  skills text[],
  source_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ck.id,
    ck.crew_member,
    ck.topic,
    ck.content,
    ck.skills,
    ck.source_url,
    1 - (ck.embedding <=> query_embedding) as similarity
  from crew_knowledge ck
  where 1 - (ck.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;