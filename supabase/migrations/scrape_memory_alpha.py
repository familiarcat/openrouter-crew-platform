#!/usr/bin/env python3
import requests
import json
import os
import sys

# Try to import bs4, handle if missing
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Please run: pip install beautifulsoup4 requests")
    sys.exit(1)

# Try to import openai, handle if missing
try:
    from openai import OpenAI
except ImportError:
    print("Error: OpenAI SDK is required. Please run: pip install openai")
    sys.exit(1)

CREW_MEMBERS = [
    {"name": "Jean-Luc Picard", "url_suffix": "Jean-Luc_Picard"},
    {"name": "William T. Riker", "url_suffix": "William_T._Riker"},
    {"name": "Data", "url_suffix": "Data"},
    {"name": "Geordi La Forge", "url_suffix": "Geordi_La_Forge"},
    {"name": "Worf", "url_suffix": "Worf"},
    {"name": "Beverly Crusher", "url_suffix": "Beverly_Crusher"},
    {"name": "Deanna Troi", "url_suffix": "Deanna_Troi"},
    {"name": "Quark", "url_suffix": "Quark"},
    {"name": "Nyota Uhura", "url_suffix": "Nyota_Uhura"},
    {"name": "Miles O'Brien", "url_suffix": "Miles_O'Brien"}
]

BASE_URL = "https://memory-alpha.fandom.com/wiki"

# Initialize OpenAI Client
if not os.environ.get("OPENAI_API_KEY"):
    print("Warning: OPENAI_API_KEY not found in environment. Embeddings will be skipped.")
    client = None
else:
    client = OpenAI()

def scrape_crew_member(member):
    url = f"{BASE_URL}/{member['url_suffix']}"
    print(f"Scraping {member['name']} from {url}...")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract Biography (First few paragraphs of the main content)
        # Memory Alpha structure: #mw-content-text > div > p
        content_div = soup.select_one('#mw-content-text > div.mw-parser-output')
        if not content_div:
            return None
            
        paragraphs = []
        for p in content_div.find_all('p', recursive=False):
            text = p.get_text(strip=True)
            if text and len(text) > 50: # Filter out small captions
                paragraphs.append(text)
                if len(paragraphs) >= 5: # Limit to first 5 meaningful paragraphs
                    break
        
        bio = "\n\n".join(paragraphs)
        
        # Inferred skills based on keywords in the text (Simulated NLP)
        keywords = {
            "Leadership": ["command", "captain", "lead", "officer"],
            "Diplomacy": ["negotiation", "peace", "treaty", "ambassador"],
            "Engineering": ["warp", "engine", "technical", "system", "repair"],
            "Security": ["tactical", "weapons", "defense", "combat", "klingon"],
            "Medical": ["doctor", "medicine", "health", "virus", "cures"],
            "Science": ["physics", "biology", "analysis", "scan", "sensor"],
            "Business": ["profit", "trade", "bar", "latinum", "negotiate"]
        }
        
        skills = []
        full_text = soup.get_text().lower()
        for skill, words in keywords.items():
            if any(word in full_text for word in words):
                skills.append(skill)
        
        # Generate embedding for semantic search
        # We construct a string that emphasizes their business role/utility over just narrative
        embedding = []
        if client:
            try:
                # "Role: [Name]. Skills: [List]. Context: [Bio]"
                embedding_input = f"Role: {member['name']}. Skills: {', '.join(skills)}. Context: {bio}".replace("\n", " ")
                response = client.embeddings.create(input=embedding_input, model="text-embedding-3-small")
                embedding = response.data[0].embedding
            except Exception as err:
                print(f"  ⚠️  Failed to generate embedding: {err}")

        return {
            "crew_member": member['name'],
            "topic": "Biography",
            "content": bio,
            "skills": skills,
            "source_url": url,
            "embedding": embedding
        }
        
    except Exception as e:
        print(f"Error scraping {member['name']}: {e}")
        return None

def main():
    results = [data for m in CREW_MEMBERS if (data := scrape_crew_member(m)) is not None]
    
    os.makedirs("data/knowledge", exist_ok=True)
    with open("data/knowledge/crew_memory_alpha.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"✅ Scraping complete. {len(results)} records saved to data/knowledge/crew_memory_alpha.json")

if __name__ == "__main__":
    main()