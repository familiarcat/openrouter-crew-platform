#!/usr/bin/env python3
"""
Wrapper: delegates to the canonical scraper in supabase/migrations/.
Source of truth: supabase/migrations/scrape_memory_alpha.py
"""
import os, sys, subprocess
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
real = os.path.join(root, "supabase", "migrations", "scrape_memory_alpha.py")
sys.exit(subprocess.call([sys.executable, real] + sys.argv[1:]))
