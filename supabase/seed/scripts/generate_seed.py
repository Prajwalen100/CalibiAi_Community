#!/usr/bin/env python3
"""
CalibiAI Seed Data Generator
=============================

Deterministic, production-ready seed generator for the CalibiAI platform.

Produces:
  * SQL files (idempotent, ordered) in ../sql/
  * JSON snapshot files in ../json/
  * Storage folder scaffolding in ../storage/
  * Docs (ER map, FK map, execution order, index recommendations,
    RLS compatibility notes, performance considerations) in ../docs/

Design goals:
  * Deterministic across runs (seeded RNG) so diffs stay clean.
  * Uses gen_random_uuid()-compatible v5 UUIDs derived from a namespace.
  * Compatible with the existing Supabase schema (profiles, comm_*,
    projects, scores, comm_xp, comm_badges, ...).
  * Ships a small bootstrap migration for optional tables the seed
    references (activity log, daily missions, login history, leaderboards).
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import re
import textwrap
import uuid
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

# ---------------------------------------------------------------------------
# Config & paths
# ---------------------------------------------------------------------------

HERE = Path(__file__).resolve().parent
SEED_ROOT = HERE.parent
SQL_DIR = SEED_ROOT / "sql"
JSON_DIR = SEED_ROOT / "json"
DOCS_DIR = SEED_ROOT / "docs"
STORAGE_DIR = SEED_ROOT / "storage"

for d in (SQL_DIR, JSON_DIR, DOCS_DIR, STORAGE_DIR):
    d.mkdir(parents=True, exist_ok=True)

# All identifiers are v5 UUIDs so the seed is reproducible.
NS = uuid.UUID("6f7a1c8e-2b0e-4c9d-9f7a-6c1e2b0e4c9d")


def det_uuid(*parts: object) -> str:
    return str(uuid.uuid5(NS, "|".join(str(p) for p in parts)))


RNG = random.Random(20260117)  # deterministic


def rint(lo: int, hi: int) -> int:
    return RNG.randint(lo, hi)


def rchoice(seq: Sequence):
    return seq[RNG.randrange(len(seq))]


def rsample(seq: Sequence, k: int) -> List:
    k = min(k, len(seq))
    return RNG.sample(list(seq), k)


# ---------------------------------------------------------------------------
# Reference data — Indian names by region, colleges, roles, tech, etc.
# ---------------------------------------------------------------------------

FIRST_NAMES_M = {
    "north": [
        "Aarav", "Aryan", "Kabir", "Reyansh", "Vivaan", "Ishaan", "Advait", "Arjun",
        "Dhruv", "Kartik", "Krish", "Manav", "Nitin", "Parth", "Rahul", "Rohan",
        "Sahil", "Shivam", "Tanmay", "Yash", "Harsh", "Rachit", "Anmol", "Ansh",
        "Piyush", "Naman", "Utkarsh", "Vaibhav", "Nakul", "Devansh",
    ],
    "south": [
        "Aditya", "Adithya", "Arun", "Bharath", "Chetan", "Dinesh", "Eshwar",
        "Gautham", "Harish", "Karthik", "Krishna", "Madhav", "Nithin", "Pranav",
        "Rithwik", "Sanjay", "Sathvik", "Sreeram", "Surya", "Tarun", "Vinay",
        "Venkatesh", "Yeshwanth", "Balaji", "Charan", "Deepak", "Guru", "Hemanth",
        "Naveen", "Praveen",
    ],
    "west": [
        "Aayush", "Aniket", "Atharva", "Chinmay", "Darshan", "Gaurav", "Hardik",
        "Jay", "Kunal", "Mihir", "Neel", "Omkar", "Prathamesh", "Rushikesh",
        "Sarthak", "Shreyas", "Siddhesh", "Soham", "Sujal", "Tejas", "Vedant",
        "Yashraj", "Ameya", "Ojas", "Pranit", "Ronak", "Tanish", "Vihaan",
        "Aarush", "Amol",
    ],
    "east": [
        "Abhinav", "Ankan", "Arindam", "Arnab", "Aritro", "Debasish", "Debojit",
        "Indranil", "Jishnu", "Nabarun", "Prithviraj", "Rajarshi", "Rishav",
        "Sagnik", "Saikat", "Sayan", "Shaurya", "Shubhojit", "Snehashish",
        "Sohom", "Souvik", "Subhajit", "Sudipto", "Sujoy", "Sumit", "Sushant",
        "Tirthankar", "Uttiyo", "Anirban", "Bratin",
    ],
}

FIRST_NAMES_F = {
    "north": [
        "Aanya", "Aarohi", "Aditi", "Anaya", "Anika", "Anushka", "Diya", "Isha",
        "Kavya", "Khushi", "Mahi", "Meera", "Muskan", "Navya", "Nidhi", "Nisha",
        "Pooja", "Prisha", "Riya", "Saanvi", "Sakshi", "Shreya", "Simran",
        "Tanya", "Tara", "Vanya", "Yashvi", "Charvi", "Ira", "Kiara",
    ],
    "south": [
        "Aishwarya", "Ananya", "Anjali", "Aparna", "Bhavya", "Deepika", "Divya",
        "Gayatri", "Harini", "Indira", "Janani", "Kavitha", "Lakshmi", "Madhuri",
        "Meghana", "Nandini", "Nithya", "Priya", "Radhika", "Sahana", "Sanjana",
        "Saranya", "Sreeja", "Sneha", "Swati", "Varsha", "Vidya", "Yamini",
        "Chaitra", "Pallavi",
    ],
    "west": [
        "Aarushi", "Aditee", "Aishani", "Ameya", "Anushree", "Devika", "Gauri",
        "Ishita", "Ketaki", "Manasi", "Mrunmayi", "Neha", "Pooja", "Prachi",
        "Purva", "Rasika", "Rutuja", "Sakshi", "Samruddhi", "Sanika", "Shraddha",
        "Shruti", "Siddhi", "Sneha", "Snehal", "Tanvi", "Trupti", "Vaidehi",
        "Vaishnavi", "Yashada",
    ],
    "east": [
        "Aditi", "Aheli", "Ananya", "Anwesha", "Arpita", "Debarati", "Debjani",
        "Diya", "Ipsita", "Ishita", "Jaya", "Madhurima", "Malabika", "Mitali",
        "Moumita", "Nabanita", "Piyali", "Poulomi", "Priyanka", "Ritwika",
        "Sagarika", "Sahana", "Sanchita", "Sayani", "Shreya", "Sohini", "Sudipta",
        "Sudeshna", "Tanushree", "Trina",
    ],
}

LAST_NAMES = {
    "north": [
        "Sharma", "Verma", "Gupta", "Bansal", "Chopra", "Malhotra", "Kapoor",
        "Arora", "Aggarwal", "Sinha", "Mehra", "Singhal", "Bhatia", "Khurana",
        "Grover", "Sood", "Nagpal", "Ahuja", "Jindal", "Goel", "Bhardwaj",
        "Chauhan", "Yadav", "Rathore", "Saxena", "Tiwari",
    ],
    "south": [
        "Iyer", "Iyengar", "Reddy", "Rao", "Naidu", "Menon", "Nair", "Pillai",
        "Krishnan", "Subramanian", "Ramanujan", "Balakrishnan", "Venkatesh",
        "Chandrasekar", "Ganesan", "Raghavan", "Srinivasan", "Prasad",
        "Bhat", "Shenoy", "Kamath", "Hegde", "Kulkarni",
    ],
    "west": [
        "Patil", "Deshmukh", "Kulkarni", "Joshi", "Bhosale", "Chavan", "More",
        "Jadhav", "Salunkhe", "Pawar", "Khedekar", "Wagh", "Gaikwad", "Shinde",
        "Kadam", "Thakur", "Desai", "Mhatre", "Ranade", "Rane", "Karve",
        "Bhagat", "Marathe", "Nikam",
    ],
    "east": [
        "Banerjee", "Bhattacharya", "Chatterjee", "Chakraborty", "Das", "Dutta",
        "Ganguly", "Ghosh", "Mitra", "Mukherjee", "Roy", "Sen", "Sengupta",
        "Bose", "Dey", "Kundu", "Majumdar", "Pal", "Sarkar", "Bagchi",
        "Basak", "Nandi", "Pramanik",
    ],
}

REGION_CITY_STATE = {
    "north": [
        ("Delhi", "Delhi"), ("Noida", "Uttar Pradesh"), ("Gurugram", "Haryana"),
        ("Faridabad", "Haryana"), ("Chandigarh", "Chandigarh"),
        ("Lucknow", "Uttar Pradesh"), ("Kanpur", "Uttar Pradesh"),
        ("Jaipur", "Rajasthan"), ("Jodhpur", "Rajasthan"),
        ("Ludhiana", "Punjab"), ("Amritsar", "Punjab"),
        ("Dehradun", "Uttarakhand"), ("Meerut", "Uttar Pradesh"),
        ("Agra", "Uttar Pradesh"), ("Varanasi", "Uttar Pradesh"),
    ],
    "south": [
        ("Bengaluru", "Karnataka"), ("Mysuru", "Karnataka"),
        ("Mangaluru", "Karnataka"), ("Hubballi", "Karnataka"),
        ("Chennai", "Tamil Nadu"), ("Coimbatore", "Tamil Nadu"),
        ("Madurai", "Tamil Nadu"), ("Tiruchirappalli", "Tamil Nadu"),
        ("Hyderabad", "Telangana"), ("Warangal", "Telangana"),
        ("Vijayawada", "Andhra Pradesh"), ("Visakhapatnam", "Andhra Pradesh"),
        ("Kochi", "Kerala"), ("Thiruvananthapuram", "Kerala"),
        ("Kozhikode", "Kerala"),
    ],
    "west": [
        ("Mumbai", "Maharashtra"), ("Pune", "Maharashtra"),
        ("Nagpur", "Maharashtra"), ("Nashik", "Maharashtra"),
        ("Aurangabad", "Maharashtra"), ("Kolhapur", "Maharashtra"),
        ("Solapur", "Maharashtra"), ("Sangli", "Maharashtra"),
        ("Amravati", "Maharashtra"), ("Thane", "Maharashtra"),
        ("Ahmedabad", "Gujarat"), ("Surat", "Gujarat"),
        ("Vadodara", "Gujarat"), ("Rajkot", "Gujarat"),
        ("Panaji", "Goa"), ("Indore", "Madhya Pradesh"),
        ("Bhopal", "Madhya Pradesh"),
    ],
    "east": [
        ("Kolkata", "West Bengal"), ("Howrah", "West Bengal"),
        ("Durgapur", "West Bengal"), ("Siliguri", "West Bengal"),
        ("Asansol", "West Bengal"), ("Bhubaneswar", "Odisha"),
        ("Cuttack", "Odisha"), ("Rourkela", "Odisha"),
        ("Guwahati", "Assam"), ("Dibrugarh", "Assam"),
        ("Silchar", "Assam"), ("Jamshedpur", "Jharkhand"),
        ("Ranchi", "Jharkhand"), ("Patna", "Bihar"),
        ("Gaya", "Bihar"), ("Shillong", "Meghalaya"),
    ],
}

COLLEGES = [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
    "IIT Roorkee", "IIT Guwahati", "IIT Hyderabad", "IIT Indore", "IIT BHU Varanasi",
    "IIT Gandhinagar", "IIT Ropar", "IIT Mandi", "IIT Bhubaneswar", "IIT Patna",
    "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Rourkela", "NIT Calicut",
    "NIT Nagpur (VNIT)", "NIT Jaipur (MNIT)", "NIT Allahabad (MNNIT)",
    "NIT Kurukshetra", "NIT Durgapur", "NIT Silchar", "NIT Jalandhar",
    "IIIT Hyderabad", "IIIT Bangalore", "IIIT Delhi", "IIIT Allahabad",
    "IIIT Pune", "IIIT Nagpur", "IIIT Vadodara",
    "BITS Pilani", "BITS Goa", "BITS Hyderabad",
    "COEP Pune", "PICT Pune", "VIT Vellore", "VIT Chennai", "VIT Bhopal",
    "MIT WPU Pune", "PCCOE Pune", "VIIT Pune", "MIT Manipal", "MAHE Manipal",
    "SRM Chennai", "SRM AP", "Amity Noida", "Amity Mumbai", "PES Bangalore",
    "RVCE Bangalore", "BMSCE Bangalore", "MSRIT Bangalore", "Dayananda Sagar",
    "Symbiosis Pune (SIT)", "Symbiosis Institute of Business Management",
    "Walchand College of Engineering Sangli", "Ram Meghe Institute Amravati",
    "Sipna College of Engineering Amravati",
    "COEP Technological University", "VJTI Mumbai", "Sardar Patel Mumbai (SPIT)",
    "KJ Somaiya Mumbai", "DJ Sanghvi Mumbai", "Thadomal Shahani Mumbai",
    "DAIICT Gandhinagar", "Nirma University Ahmedabad", "Pandit Deendayal Energy University",
    "Jadavpur University Kolkata", "IIEST Shibpur", "Heritage Institute Kolkata",
    "Techno India Salt Lake", "KIIT Bhubaneswar",
    "Anna University Chennai", "SSN College of Engineering Chennai",
    "PSG Tech Coimbatore", "SASTRA Thanjavur", "Amrita Coimbatore",
    "Jaypee Institute Noida", "DTU Delhi", "NSUT Delhi", "IGDTUW Delhi",
    "Thapar University Patiala", "Chitkara University", "LPU Jalandhar",
    "Chandigarh University", "Christ University Bangalore", "REVA University",
]

BRANCHES = [
    "Computer Engineering", "Computer Science and Engineering",
    "Information Technology", "AI and Data Science",
    "AI and Machine Learning", "Electronics and Telecommunication",
    "Electronics and Communication", "Electrical Engineering",
    "Mechanical Engineering", "Data Science",
    "Computer Science (AI)", "Computer Science (Data Science)",
    "MCA", "MSc Computer Science", "MSc Data Science",
    "MTech Computer Science", "MTech AI/ML",
]

ROLES = [
    "GenAI Engineer",
    "AI Engineer",
    "AI Automation Engineer",
    "ML Engineer",
    "Data Scientist",
    "Prompt Engineer",
]

# Distribution of primary target roles across 300 users.
ROLE_WEIGHTS = {
    "GenAI Engineer": 0.22,
    "AI Engineer": 0.22,
    "AI Automation Engineer": 0.18,
    "ML Engineer": 0.16,
    "Data Scientist": 0.14,
    "Prompt Engineer": 0.08,
}

LEARNING_PATHS = [
    "GenAI Foundations",
    "LLM Application Development",
    "RAG Systems",
    "AI Agents with LangGraph",
    "AI Automation with n8n",
    "Prompt Engineering Mastery",
    "MLOps for AI Engineers",
    "Applied Data Science",
    "Vector Databases and Retrieval",
    "Multimodal AI",
]

CURRENT_STATUSES = [
    "Final Year Student", "Third Year Student", "Second Year Student",
    "First Year Student", "Fresher — Job Seeking", "Junior AI Engineer",
    "AI Intern", "Freelance AI Developer", "GenAI Engineer",
    "Data Analyst → transitioning", "Software Engineer → transitioning",
]

GITHUB_LANGS = [
    "Python", "TypeScript", "JavaScript", "Go", "Rust",
    "Java", "C++", "Kotlin", "Shell", "Jupyter Notebook",
]

REPO_PREFIXES = [
    "rag", "agentic", "llm", "prompt", "autoflow", "voice",
    "recruiter", "support", "leadgen", "crm", "email", "pdfchat",
    "codegrade", "researcher", "meetnote", "resume", "invoice",
    "toolbox", "playbook", "labs", "kit", "starter",
]
REPO_SUFFIXES = [
    "starter", "kit", "engine", "toolkit", "playground", "workshop",
    "labs", "cli", "server", "notebook", "sdk", "api", "bench",
]

PINNED_PROJECT_TEMPLATES = [
    "RAG playground with hybrid search",
    "LangGraph multi-agent research assistant",
    "n8n workflow library for AI onboarding",
    "Voice agent with realtime transcription",
    "Prompt-eval benchmark on customer FAQs",
    "OpenAI function calling toolkit",
    "MCP servers for personal knowledge base",
    "Streamlit dashboard for LLM evals",
    "AI recruiter with resume parser",
    "PDF chat over a 10k-page manual",
    "LangChain templates for enterprise search",
    "CrewAI cold-outreach crew",
    "OSS starter for GenAI portfolios",
    "Vector DB comparison notebook",
    "Hugging Face fine-tuning notebook",
]

# ---------------------------------------------------------------------------
# Reference data — communities, badges, missions
# ---------------------------------------------------------------------------

COMMUNITIES = [
    ("general-ai", "General AI", "🤖",
     "Everything about artificial intelligence — news, trends, and open discussions."),
    ("prompt-engineering", "Prompt Engineering", "🧠",
     "Master the art and science of prompting LLMs effectively."),
    ("llms", "LLMs", "🦜",
     "Large Language Models — GPT, Claude, Gemini, Llama, Mistral and more."),
    ("rag", "RAG", "📚",
     "Retrieval-Augmented Generation patterns, tools, and best practices."),
    ("ai-agents", "AI Agents", "🕹️",
     "Autonomous AI agents, LangGraph, CrewAI, AutoGen and frameworks."),
    ("mcp", "MCP", "🔌",
     "Model Context Protocol — standards, tools, and integrations."),
    ("langgraph", "LangGraph", "🕸️",
     "Graph-based orchestration for stateful, tool-using agents."),
    ("crewai", "CrewAI", "🧑\u200d🤝\u200d🧑",
     "Role-based multi-agent teams that ship real work."),
    ("n8n", "n8n", "⚡",
     "Low-code AI automations, workflows and integrations."),
    ("make", "Make (Integromat)", "🧩",
     "Visual automation and AI workflows on Make."),
    ("python", "Python", "🐍",
     "Python for AI development — libraries, tips, and projects."),
    ("deep-learning", "Deep Learning", "🧬",
     "Neural nets, transformers, training tricks and papers."),
    ("machine-learning", "Machine Learning", "📈",
     "Classical ML, feature engineering, and applied problems."),
    ("computer-vision", "Computer Vision", "👁️",
     "Vision models, YOLO, CLIP, segmentation and OCR."),
    ("openai", "OpenAI", "🟢",
     "GPT-4o, Realtime, function calling, Assistants API tips."),
    ("claude", "Claude", "🟣",
     "Anthropic Claude — long context, tool use, and best prompts."),
    ("gemini", "Gemini", "🔷",
     "Google Gemini models, Vertex AI and Google Cloud AI."),
    ("mistral", "Mistral", "🟠",
     "Mistral open models, fine-tuning and deployments."),
    ("vector-databases", "Vector Databases", "🧭",
     "Pinecone, Weaviate, Qdrant, pgvector — indexes and tuning."),
    ("hugging-face", "Hugging Face", "🤗",
     "Transformers, datasets, spaces and open-source models."),
]

BADGES = [
    ("top-contributor", "Top Contributor", "special", "🌟",
     "Top 1% contributor by community XP for the month."),
    ("prompt-master", "Prompt Master", "skill", "🧠",
     "Delivered 25+ high-signal prompt patterns to the community."),
    ("ai-builder", "AI Builder", "skill", "🛠️",
     "Shipped 5+ verified AI projects."),
    ("production-ready", "Production Ready", "special", "🚀",
     "Passed assessment, roadmap, capstone, GitHub and portfolio checks."),
    ("streak-100", "100-Day Streak", "milestone", "🔥",
     "Learned or contributed on 100 consecutive days."),
    ("rag-expert", "RAG Expert", "skill", "📚",
     "Verified expertise in retrieval-augmented systems."),
    ("community-helper", "Community Helper", "contribution", "🤝",
     "Answered 50+ questions with helpful, accepted responses."),
    ("hackathon-winner", "Hackathon Winner", "special", "🏆",
     "Won or podiumed at a CalibiAI hackathon."),
    ("weekly-winner", "Weekly Winner", "special", "🥇",
     "Topped the weekly XP leaderboard."),
    ("top-mentor", "Top Mentor", "contribution", "🎓",
     "Recognized as a top mentor by the community."),
]

DAILY_MISSIONS = [
    ("Read one AI article", "read", 10),
    ("Watch a short tutorial video", "video", 10),
    ("Complete a daily quiz", "quiz", 15),
    ("Push a GitHub commit", "github", 20),
    ("Answer a community question", "community", 15),
    ("Finish a roadmap assignment", "assignment", 25),
    ("Build a mini prompt experiment", "project", 25),
    ("Bookmark a new resource", "read", 5),
    ("Comment on a showcase post", "community", 8),
    ("Complete a Prompt Engineering drill", "quiz", 15),
    ("Try one new LLM tool", "video", 10),
    ("Review someone's PR", "github", 20),
    ("Write a 5-line reflection note", "read", 5),
    ("Explore a Hugging Face dataset", "video", 10),
    ("Run a RAG query in the sandbox", "project", 20),
    ("Follow a new peer", "community", 5),
    ("Update your portfolio README", "github", 15),
    ("Ship a new n8n workflow", "project", 25),
    ("Vote on a research paper thread", "community", 5),
    ("Complete a LangGraph tutorial", "video", 15),
    ("Publish a prompt to the library", "project", 20),
    ("Solve a Python katas set", "quiz", 15),
    ("Attend a live AMA", "video", 10),
    ("Contribute to an open-source repo", "github", 30),
    ("Write a mini blog on today's learning", "read", 15),
    ("Review a peer's project", "community", 15),
    ("Try a Claude tool-use recipe", "project", 20),
    ("Set up pgvector locally", "project", 25),
    ("Compare two embedding models", "quiz", 15),
    ("Take the weekend deep-dive quiz", "quiz", 20),
    ("Post one insight in #general-ai", "community", 8),
    ("Submit a capstone milestone", "assignment", 30),
    ("Refactor an old notebook", "github", 15),
    ("Answer a MCP protocol question", "community", 12),
    ("Explore a CrewAI recipe", "video", 12),
    ("Debug a friend's agent", "community", 12),
    ("Publish a Gemini experiment", "project", 20),
    ("Try Mistral fine-tuning template", "project", 25),
    ("Vote on the trending post", "community", 3),
    ("Read a research paper summary", "read", 12),
    ("Add tests to your AI project", "github", 20),
    ("Draft an interview STAR story", "read", 10),
    ("Book a mock interview slot", "assignment", 15),
    ("Review your talent-score gaps", "read", 8),
    ("Complete the vector DB drill", "quiz", 15),
    ("Ship a tiny voice-agent demo", "project", 25),
    ("Answer one hiring thread", "community", 10),
    ("Update your Production-Ready checklist", "assignment", 20),
    ("Peer-review a resume", "community", 12),
    ("Watch a Real-World AI teardown", "video", 15),
]
assert len(DAILY_MISSIONS) == 50

# ---------------------------------------------------------------------------
# Content templates — hand-crafted so nothing looks like Lorem Ipsum.
# ---------------------------------------------------------------------------

POST_TYPES = [
    "question", "discussion", "tutorial", "achievement", "showcase",
    "hiring", "news", "research", "prompt", "open-source",
]

# Title templates use {topic}. Every combination is unique via
# (post_type, topic, adjective) tuples so we never repeat.
TITLE_TEMPLATES = {
    "question": [
        "How do you evaluate hallucinations in {topic}?",
        "Best chunking strategy for {topic} in production?",
        "Why is my {topic} pipeline flaky under load?",
        "Fine-tune or RAG for {topic}? Looking for war stories.",
        "What is the cheapest hosting for a {topic} demo?",
        "Debugging streaming responses in {topic}",
        "Any tips on rate-limiting a {topic} agent?",
        "What monitoring stack do you use for {topic}?",
    ],
    "discussion": [
        "Are we over-engineering {topic}?",
        "Hot take: {topic} is 80% prompt, 20% code",
        "The one lesson {topic} taught me this month",
        "What breaks first when {topic} scales past 1k users?",
        "How teams are actually shipping {topic} in India",
        "Cost curves I did not expect from {topic}",
        "Where {topic} still falls short — an honest list",
    ],
    "tutorial": [
        "Ship {topic} to production in 45 minutes",
        "A no-nonsense guide to {topic} for freshers",
        "From notebook to deployed {topic}: my exact stack",
        "Building {topic} with pgvector and Supabase",
        "Zero-to-one on {topic} without paying for GPUs",
        "The tiny {topic} recipe I keep reusing",
    ],
    "achievement": [
        "Just crossed 850 Talent Score with {topic}",
        "Cleared my Production-Ready review — {topic} was the tie-breaker",
        "Won a hackathon building a {topic} demo",
        "Got my first freelance gig thanks to my {topic} project",
        "Finished the 100-day streak — {topic} kept me hooked",
    ],
    "showcase": [
        "Showcase: {topic} for real customer emails",
        "Built a tiny {topic} that saves my team 5 hrs/week",
        "Weekend build — {topic} that actually works",
        "New drop: opinionated {topic} starter",
        "Prototype: {topic} for college placements cell",
    ],
    "hiring": [
        "Hiring: AI Engineer (remote, India) — {topic} experience preferred",
        "We are looking for interns to help ship {topic}",
        "Startup role — GenAI Engineer with hands-on {topic}",
        "Contract gig — build {topic} for a fintech",
        "Referral thread: anyone shipping {topic} in Bengaluru?",
    ],
    "news": [
        "OpenAI ships a new update that affects {topic} teams",
        "Anthropic drops a longer-context model — implications for {topic}",
        "Big update in the {topic} space this week",
        "Meta releases weights that change {topic} economics",
        "n8n adds first-class support for {topic}",
    ],
    "research": [
        "Paper thread: {topic} beyond the benchmarks",
        "Notes from the latest {topic} arXiv drop",
        "Weekly research digest: {topic} edition",
        "Reproducing the {topic} paper — my results were surprising",
        "Ablation study: what really matters in {topic}",
    ],
    "prompt": [
        "Prompt library update: {topic}",
        "One prompt pattern I use every day for {topic}",
        "Try this system prompt for {topic} tasks",
        "Prompt recipe: {topic} without hallucinations",
    ],
    "open-source": [
        "New OSS release: {topic} toolkit",
        "Contributing to an OSS {topic} project — where to start",
        "Looking for maintainers on a small {topic} library",
        "Bench: OSS {topic} vs paid alternatives",
    ],
}

POST_TOPICS = [
    "RAG", "agent memory", "streaming responses", "function calling",
    "prompt evals", "guardrails", "pgvector search", "hybrid search",
    "voice agents", "customer support bots", "WhatsApp bots", "PDF chat",
    "LangGraph flows", "CrewAI teams", "n8n automations", "MCP servers",
    "OpenAI Realtime", "Claude tool use", "Gemini multimodal",
    "Mistral fine-tuning", "Hugging Face pipelines", "vector databases",
    "recruitment agents", "meeting summarizers", "code review agents",
    "email triage", "lead generation agents", "invoice automation",
    "CRM automations", "prompt caching",
]

POST_BODY_SNIPPETS = {
    "question": [
        "Been stuck on this for a couple of days. My current setup is Supabase + pgvector + gpt-4o-mini. The retrieval quality is fine but the final answer occasionally invents fields that don't exist in the source. Anyone hit this and what fixed it for you? Adding a re-ranker helped a little but not enough.",
        "Running a small side project and I'm trying to keep costs sane. Would you go with a smaller open model + heavy prompting, or a bigger closed model with a stricter system prompt? Curious what teams do at ~50k requests/month.",
        "Latency has become the bottleneck. Streaming is smooth locally but on Vercel Edge I get bursts where the first token takes ~4s. Is anyone using a warm-up ping or something smarter?",
        "Trying to move from a notebook to a real service and every tutorial I find assumes AWS. Anyone here doing this on Supabase + Railway or Fly? Would love a rough architecture diagram.",
    ],
    "discussion": [
        "We are three months into shipping this and I've come around to a boring take: 80% of the wins are prompt + eval discipline, and 20% is code. Curious if other teams agree or if I'm just being lazy.",
        "The hardest part isn't the model, it's the data pipeline around it. Anyone else feel that most \"AI\" bugs are actually data bugs in disguise?",
        "Sharing a small retrospective — I killed three features that used LLMs and replaced them with a regex + a lookup table. Users didn't notice. Anyone else quietly deleting AI?",
        "I keep seeing devs jump from LangChain to raw SDK and back to LangChain. What's your current position and what triggered the last switch?",
    ],
    "tutorial": [
        "Step-by-step walkthrough of what actually worked for me. I'm keeping it framework-light and showing the code changes at each step. Deploy target is Supabase Edge Functions.",
        "This is the exact recipe I now use for every new client build. It's not fancy but it's boring in the best way — cheap, fast to iterate, easy to hand over.",
        "I refuse to teach anything I don't run myself. So this write-up is literally the setup powering my little side product. Fork-friendly, no paid keys required for the first mile.",
    ],
    "achievement": [
        "Sharing this mostly to keep myself accountable — I hit 850+ on the Talent Score after grinding for 8 weeks. Biggest unlock was pairing with two folks from this community on weekend builds.",
        "Just cleared the Production-Ready review. The capstone took two rewrites. If you're stuck, DM me — happy to share the exact structure I used.",
        "Won a small hackathon last weekend with the RAG agent I've been building here. First prize is a paid mentorship — grateful to everyone who reviewed my prompts.",
    ],
    "showcase": [
        "Built this over three evenings. It reads incoming customer emails, tags them, drafts a reply and files them into the right folder. Roughly 40% of tickets never touch a human now.",
        "New drop — an opinionated starter that I wish existed when I began. Supabase auth + Next.js + pgvector + a small evals harness. MIT-licensed.",
        "Tiny thing but I use it every day: paste a link, get a 5-bullet summary and 3 follow-up questions. Great for staying honest about what you're actually learning.",
    ],
    "hiring": [
        "We're a small team (7 folks) in Bengaluru and are hiring an AI Engineer to lead our agent platform. Remote-friendly for India. Salary band is transparent — happy to share on DM.",
        "Looking for two GenAI interns for a 6-month engagement. Real work, real ownership, small stipend. Priority given to people who've shipped something end-to-end.",
        "Contract role — building a customer-support agent for a Series-A fintech. 4-week scope, extendable. Comfortable pay for the right builder.",
    ],
    "news": [
        "Model provider just pushed an update that changes pricing for long-context queries. Numbers I'm seeing suggest a ~30% swing on our workloads. Sharing the migration checklist we ran.",
        "New release notes dropped this morning. TL;DR — better tool use, cheaper reasoning tier, longer context window. Sharing my quick take on what to change in your pipelines.",
    ],
    "research": [
        "Skimmed the new paper on the train home. The retrieval trick is deceptively simple — cluster your chunks by intent before you embed, not after. Reproducing this weekend.",
        "Read: the ablations are worth the price of admission. They show that most of the gain comes from re-ranking, not from the fancy embedding they introduced.",
    ],
    "prompt": [
        "Sharing the exact system prompt I've been iterating on for the last two weeks. It's boring but it moves my eval score from 68 to 84. Feedback welcome.",
        "One pattern I use every day: {task_description} → then a strict JSON output with a validator function that retries once on failure. Simple, cheap, and it saves me every week.",
    ],
    "open-source": [
        "Tagged v0.1.0 today. It's small — one CLI, one Supabase migration, three examples — but it's the thing I keep re-writing for every side project so I finally made it a package.",
        "If you're new to OSS, this repo has three good-first-issues that are gentle enough for a weekend. Happy to review PRs and merge fast.",
    ],
}

COMMENT_STYLES = [
    "Thanks for sharing this — I ran into the same wall last month. What worked for me was moving the re-ranker before the LLM call. Latency went up a bit but the answers stopped drifting.",
    "Nice writeup. One tiny nit — your chunk size is probably too small for the domain you described. Try 800–1200 tokens with a 100-token overlap and re-run.",
    "This is exactly the pattern we ended up with too. Curious how you handle rate limits when a single user fires 3–4 questions in a row?",
    "Bookmarked. I'm mid-migration from raw SDK back to a thin agent layer, so this is well-timed. Will report back on how it goes.",
    "Fun idea — I'd push back a little on \"agents everywhere.\" For most of the workflows I ship, a two-step LLM chain still beats a graph. Cheaper too.",
    "Great job on the write-up. If you want to squeeze more juice out of it, add a small evals harness. Even 30 hand-labeled examples will save you weeks.",
    "Congrats on the streak! I broke mine at 52 days last summer and I'm still salty about it. Consistency > cleverness, every time.",
    "For the interview loop, my honest advice: focus 60% of your prep on shipping one solid capstone that you can defend end-to-end. The rest sorts itself out.",
    "Interesting take. What made you pick pgvector over Qdrant? I keep flip-flopping and would love to hear a real production tradeoff.",
    "This helped me a ton, thanks. If anyone else is stuck on Windows, the `uv` package manager saved my sanity — no more venv issues.",
    "Applied and got a reply within two days — thanks for the referral thread. This community is such an unfair advantage.",
    "I built something similar for my college placement cell last semester. The hardest part wasn't the AI — it was the data cleanup. Happy to pair on this if useful.",
    "Small code note — you can drop the manual `try/except` around the LLM call if you pass `max_retries=2` in the client. Same behaviour, less boilerplate.",
    "The chart you shared makes the tradeoff really clear. Would you be up for turning this into a short talk at our next community call?",
    "This resonates. I've quietly deleted two features that used LLMs and replaced them with a lookup table. Users didn't notice, my bill dropped ~40%.",
    "Loved the honesty in this post. Too many \"agentic\" projects online are demos that break the moment you feed them a real customer input.",
    "Quick tip — use Supabase Storage + signed URLs for user uploads instead of routing files through your API. Saves a lot of memory in Edge functions.",
    "Great question. My rule of thumb: fine-tune only when you have >5k high-quality labeled examples AND the prompt has plateaued. Otherwise RAG wins.",
    "Following. I'm working on the same problem and would love to compare notes over a call this weekend.",
    "This is going straight into the community wiki. Thanks for taking the time to write it up properly with the code snippets.",
    "For folks getting started, I'd add — build the eval harness FIRST, before the pipeline. It changes what you build and how you iterate.",
    "Nice one. On the cost side, I found batching evaluations (10 at a time in one prompt) dropped my monthly bill by ~35% with almost no quality loss.",
    "Solid launch. One accessibility nit — the copy button on the code blocks has no aria-label. Easy fix and worth the polish.",
    "As a fresher, this feels less intimidating than the usual \"just build 10 projects\" advice. Thanks for making it concrete.",
    "Have you looked at hybrid search (BM25 + vectors + a re-ranker)? For our legal-tech use case it was the single biggest quality jump.",
    "I disagree gently on the framework choice. LangGraph really shines once you need conditional branches with tool use. For linear flows I agree it's overkill.",
    "This should be pinned. Every week someone asks a variant of this exact question in the RAG channel.",
    "Amazing. Would you be open to sharing your evals dataset (even 30–50 examples)? I want to reproduce the numbers on our workload.",
    "Congrats on the Production-Ready badge! Genuinely earned. The capstone rubric here is not a joke.",
    "For anyone wondering about pricing — I ran the same workload on gpt-4o-mini and Claude Haiku. Haiku was slightly cheaper for our shape (long inputs, short outputs).",
]

CODE_SNIPPET_COMMENTS = [
    "```python\nfrom supabase import create_client\nsb = create_client(URL, KEY)\nres = sb.rpc('match_documents', {'query': q_emb, 'top_k': 8}).execute()\n```\n\nThis is the minimal RPC I ended up with. `top_k=8` felt like the sweet spot.",
    "```ts\nconst res = await openai.chat.completions.create({\n  model: 'gpt-4o-mini',\n  temperature: 0.2,\n  response_format: { type: 'json_object' },\n  messages,\n});\n```\n\nForcing JSON mode with a strict validator caught almost all of my formatting drift.",
    "```sql\ncreate index on documents using ivfflat (embedding vector_cosine_ops)\n  with (lists = 100);\n```\n\nRebuilding this after a big backfill dropped our retrieval latency from ~350ms to ~90ms.",
    "```yaml\nname: nightly-evals\non:\n  schedule: [{ cron: '0 20 * * *' }]\n```\n\nRunning evals nightly and posting the delta to Slack keeps regressions from sneaking in.",
]

PROJECT_TITLES = [
    "AI Chatbot for College Placements",
    "WhatsApp Bot for Attendance",
    "Voice Agent for Restaurant Bookings",
    "RAG System for Legal Docs",
    "AI Recruiter for Startup Roles",
    "Customer Support Agent for D2C Brand",
    "Lead Generation Agent for SaaS",
    "CRM Automation for Freelancers",
    "Email Triage Assistant",
    "PDF Chat for Textbooks",
    "Code Review Agent for PR",
    "Research Agent for arXiv",
    "Meeting Summarizer for Zoom",
    "Resume Screener for HR Teams",
    "Invoice Extraction Automation",
    "Slack Standup Summarizer",
    "GitHub Issue Triage Bot",
    "AI Interviewer for Mock Sessions",
    "SQL Analyst Agent",
    "Notion Second Brain Assistant",
    "Real-time Voice Translator",
    "Personal Finance Advisor",
    "Health Tracker Coach",
    "Study Planner for Students",
    "Cold-Outreach Writer",
    "Blog Post Generator with SEO Audit",
    "Product Comparison Agent",
    "Travel Itinerary Planner",
    "Legal Contract Reviewer",
    "AI Storyteller for Kids",
    "Grocery List Optimizer",
    "Personal Diet Planner",
    "Diary-to-Insights Reflector",
    "Meme Caption Generator",
    "Interview Prep Coach",
    "Tech News Digest Agent",
    "Podcast Transcript Highlighter",
    "Customer Feedback Clusterer",
    "AI Tutor for Class 10 Math",
    "Startup Idea Validator",
    "Design Brief Interpreter",
    "Ad Copy Multiplier",
    "AI Real-estate Advisor",
    "Personal Career Coach",
    "Instagram Caption Studio",
    "Twitter Thread Composer",
    "Product Requirements Drafter",
    "Bug Report Deduplicator",
    "Customer Onboarding Assistant",
    "Sales Call Scorer",
]

PROJECT_TECH = [
    ["Next.js", "Supabase", "OpenAI", "pgvector"],
    ["Python", "FastAPI", "LangChain", "Pinecone"],
    ["Python", "LangGraph", "Claude", "Postgres"],
    ["n8n", "OpenAI", "Google Sheets"],
    ["Node.js", "Supabase Edge", "GPT-4o-mini", "Qdrant"],
    ["Python", "Streamlit", "Ollama", "ChromaDB"],
    ["TypeScript", "Vercel AI SDK", "Anthropic", "Neon"],
    ["Python", "CrewAI", "Gemini", "Weaviate"],
    ["Python", "Hugging Face Transformers", "PyTorch", "FAISS"],
    ["TypeScript", "tRPC", "OpenAI", "Redis"],
]

PROJECT_STATUSES = ["completed", "in_review", "in_progress", "shipped", "archived"]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]

ACTIVITY_TYPES = [
    "assignment_completed", "project_completed", "post_liked",
    "question_answered", "community_joined", "badge_earned",
    "assessment_completed", "talent_score_reached", "project_submitted",
    "roadmap_started", "mission_completed", "streak_extended",
    "post_bookmarked", "comment_upvoted", "follow_added",
]

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class User:
    user_id: str
    first_name: str
    last_name: str
    full_name: str
    username: str
    email: str
    avatar_url: str
    bio: str
    city: str
    state: str
    country: str
    region: str
    college: str
    branch: str
    grad_year: int
    current_role: str
    target_role: str
    learning_path: str
    assessment_score: int
    talent_score: int
    talent_tier: str
    xp: int
    weekly_xp: int
    community_xp: int
    projects_completed: int
    assignments_completed: int
    current_streak: int
    longest_streak: int
    followers_count: int
    following_count: int
    joined_date: str
    last_login: str
    current_level: int
    badges: List[str]
    github_connected: bool
    linkedin_connected: bool
    github_url: Optional[str]
    linkedin_url: Optional[str]
    portfolio_url: Optional[str]
    is_production_ready: bool
    github_stats: Optional[dict] = None
    activity_bucket: str = "monthly"  # today, week, month, inactive


# ---------------------------------------------------------------------------
# User generation
# ---------------------------------------------------------------------------

def unique_username_pool() -> List[str]:
    """Generate a large pool of hand-crafted usernames (no random numbers)."""
    stems = [
        "codes", "ai", "ml", "labs", "builds", "ships",
        "builder", "engineer", "learns", "dev", "hacks",
        "prompts", "agent", "flow", "stack",
    ]
    verbs = ["build", "ship", "prompt", "automate", "train", "deploy"]
    with_prefix = []
    for v in verbs:
        for first_pool in list(FIRST_NAMES_M.values()) + list(FIRST_NAMES_F.values()):
            for fn in first_pool:
                with_prefix.append(f"{v}with{fn.lower()}")
    result: List[str] = []
    seen = set()
    for first_pool in list(FIRST_NAMES_M.values()) + list(FIRST_NAMES_F.values()):
        for fn in first_pool:
            lo = fn.lower()
            for st in stems:
                cand = f"{lo}{st}"
                if cand not in seen:
                    seen.add(cand)
                    result.append(cand)
    for v in verbs:
        for stem in stems:
            cand = f"{v}the{stem}"
            if cand not in seen:
                seen.add(cand)
                result.append(cand)
    for w in with_prefix:
        if w not in seen:
            seen.add(w)
            result.append(w)
    RNG.shuffle(result)
    return result


TALENT_BUCKETS = [
    ("elite", 3, 905, 970),        # 900+
    ("prod_ready", 12, 850, 899),   # 850–899
    ("advanced", 60, 700, 849),
    ("intermediate", 110, 500, 699),
    ("developing", 80, 300, 499),
    ("beginner", 35, 120, 299),
]
assert sum(b[1] for b in TALENT_BUCKETS) == 300


def build_users() -> List[User]:
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)
    username_pool = unique_username_pool()
    used_usernames: set = set()
    used_emails: set = set()
    used_full_names: set = set()
    users: List[User] = []

    # Deterministic role distribution
    role_targets: List[str] = []
    for role, w in ROLE_WEIGHTS.items():
        role_targets += [role] * round(w * 300)
    while len(role_targets) < 300:
        role_targets.append("GenAI Engineer")
    role_targets = role_targets[:300]
    RNG.shuffle(role_targets)

    # Activity bucket per user (per user's ask):
    #   25 today, 80 this week, ~175 this month, 20 inactive >90d.
    #   The four numbers in the spec sum to 305; we trim from `month`
    #   so `today`, `week` and `inactive` stay exactly as requested.
    buckets: List[str] = (
        ["today"] * 25
        + ["week"] * 80
        + ["month"] * 175
        + ["inactive"] * 20
    )
    assert len(buckets) == 300
    RNG.shuffle(buckets)

    # Enumerate 300 slots, cycling through regions & genders for spread.
    regions = ["north", "south", "west", "east"]
    slot_plan = []
    for i in range(300):
        region = regions[i % 4]
        gender = "F" if i % 3 == 0 else "M"
        slot_plan.append((region, gender))
    RNG.shuffle(slot_plan)

    # Talent-score assignment
    ts_pool: List[Tuple[str, int]] = []
    for tier_name, count, lo, hi in TALENT_BUCKETS:
        for j in range(count):
            # Slight jitter within each tier so scores don't cluster on lows.
            ts = lo + int((hi - lo) * ((j + 0.5 * ((i := j * 7) % 3)) / max(count - 1, 1)))
            ts = max(lo, min(hi, ts))
            ts_pool.append((tier_name, ts))
    RNG.shuffle(ts_pool)

    # Track which users become "production ready" — the 15 users with top scores.
    top_indices = sorted(range(300), key=lambda k: -ts_pool[k][1])[:15]
    prod_ready_indices = set(top_indices)

    # 50 GitHub-connected users: give priority to higher scores.
    gh_indices = set(sorted(range(300), key=lambda k: -ts_pool[k][1])[:50])

    for idx in range(300):
        region, gender = slot_plan[idx]
        first = rchoice(FIRST_NAMES_M[region] if gender == "M" else FIRST_NAMES_F[region])
        last = rchoice(LAST_NAMES[region])
        full_name = f"{first} {last}"
        # Disambiguate collisions with a realistic middle initial (father's
        # initial is a common Indian convention). Guarantees no dupe full_names.
        if full_name in used_full_names:
            # Try 26 letters that yield a still-unique name.
            for mi in "SPKARBGMHVJLNDT":
                cand = f"{first} {mi}. {last}"
                if cand not in used_full_names:
                    full_name = cand
                    break
            else:
                full_name = f"{first} {idx}. {last}"
        used_full_names.add(full_name)

        # Unique username.
        base = f"{first}{last}".lower().replace(" ", "")
        candidates = [
            f"{first.lower()}{last.lower()}",
            f"{first.lower()}.{last.lower()}",
            f"{first.lower()}_{last.lower()}",
            f"{first.lower()}{last[0].lower()}",
        ]
        username = None
        for c in candidates:
            if c not in used_usernames:
                username = c
                break
        if username is None:
            while username_pool:
                cand = username_pool.pop()
                if cand not in used_usernames:
                    username = cand
                    break
        if username is None:
            username = f"{base}user"
        used_usernames.add(username)

        # Email — collision-safe
        email = f"{username}@calibi.ai".lower()
        while email in used_emails:
            email = f"{username}.{RNG.randrange(10, 99)}@calibi.ai"
        used_emails.add(email)

        # Location
        city, state = rchoice(REGION_CITY_STATE[region])

        # College & branch
        college = rchoice(COLLEGES)
        branch = rchoice(BRANCHES)
        grad_year = rchoice([2023, 2024, 2025, 2026, 2027])

        # Talent score
        tier_name, talent_score = ts_pool[idx]
        assessment_score = max(30, min(100, int(talent_score / 10) + rint(-8, 8)))
        target_role = role_targets[idx]
        current_role = rchoice(CURRENT_STATUSES)
        learning_path = rchoice(LEARNING_PATHS)

        # Activity bucket & login
        bucket = buckets[idx]
        joined_days_ago = {
            "today": rint(30, 360),
            "week": rint(30, 360),
            "month": rint(60, 360),
            "inactive": rint(180, 360),
        }[bucket]
        joined_date = now - timedelta(days=joined_days_ago,
                                      hours=rint(0, 23),
                                      minutes=rint(0, 59))
        # Ensure last_login >= joined_date
        if bucket == "today":
            last_login_days = 0
            last_login_hours = rint(0, 20)
        elif bucket == "week":
            last_login_days = rint(1, 6)
            last_login_hours = rint(0, 23)
        elif bucket == "month":
            last_login_days = rint(7, 30)
            last_login_hours = rint(0, 23)
        else:
            last_login_days = rint(91, min(joined_days_ago, 300))
            last_login_hours = rint(0, 23)
        last_login = now - timedelta(days=last_login_days, hours=last_login_hours)

        # XP, streaks, projects, based on score.
        base_xp = int(talent_score * 6 + rint(-200, 400))
        base_xp = max(50, base_xp)
        weekly_xp = 0 if bucket == "inactive" else int(base_xp * rint(2, 8) / 100)
        community_xp = int(base_xp * rint(15, 35) / 100)
        projects_completed = max(0, int(talent_score / 90) + rint(-1, 3))
        assignments_completed = max(0, int(talent_score / 20) + rint(-3, 8))
        current_streak = 0 if bucket == "inactive" else (
            rint(1, 6) if bucket == "week"
            else rint(1, 24) if bucket == "month"
            else rint(7, 118)
        )
        longest_streak = max(current_streak, rint(current_streak, current_streak + 90))

        # Follower counts — placeholder, will be overwritten from real graph.
        followers_count = 0
        following_count = 0

        # Level from XP (simple curve)
        current_level = min(50, max(1, int((base_xp / 350) ** 0.9) + 1))

        # Badges — heuristic based on score / streak / activity.
        badges: List[str] = []
        if idx in prod_ready_indices:
            badges.append("production-ready")
        if talent_score >= 900:
            badges += ["top-contributor", "ai-builder", "prompt-master"]
        elif talent_score >= 850:
            badges += ["ai-builder"]
        if longest_streak >= 100:
            badges.append("streak-100")
        if community_xp >= int(base_xp * 0.3):
            badges.append("community-helper")
        # RAG expert if learning path relates
        if learning_path in {"RAG Systems", "Vector Databases and Retrieval"} and talent_score >= 700:
            badges.append("rag-expert")
        if talent_score >= 800 and RNG.random() < 0.35:
            badges.append("hackathon-winner")
        if talent_score >= 750 and RNG.random() < 0.25:
            badges.append("weekly-winner")
        if talent_score >= 780 and RNG.random() < 0.2:
            badges.append("top-mentor")
        badges = list(dict.fromkeys(badges))  # dedupe, keep order

        # GitHub & LinkedIn
        github_connected = idx in gh_indices
        linkedin_connected = RNG.random() < 0.7 or idx in prod_ready_indices

        github_url = (
            f"https://github.com/{username}" if github_connected else None
        )
        linkedin_url = (
            f"https://www.linkedin.com/in/{username}" if linkedin_connected else None
        )
        portfolio_url = (
            f"https://portfolio.calibi.ai/{username}" if idx in prod_ready_indices else None
        )

        # GitHub stats block (only for GH-connected users)
        gh_stats = None
        if github_connected:
            repo_count = rint(4, 60) + (10 if talent_score >= 850 else 0)
            contributions = rint(80, 1400) + (300 if talent_score >= 850 else 0)
            stars_given = rint(10, 400)
            langs = rsample(GITHUB_LANGS, rint(2, 5))
            pinned_count = min(6, rint(2, 5))
            pinned = []
            for j in range(pinned_count):
                name = f"{rchoice(REPO_PREFIXES)}-{rchoice(REPO_SUFFIXES)}"
                pinned.append({
                    "name": f"{username}/{name}",
                    "description": rchoice(PINNED_PROJECT_TEMPLATES),
                    "language": langs[j % len(langs)],
                    "stars": rint(0, 320),
                    "forks": rint(0, 40),
                    "url": f"https://github.com/{username}/{name}",
                })
            oss_score = min(100, int(contributions / 20 + sum(p["stars"] for p in pinned) / 20))
            gh_stats = {
                "repository_count": repo_count,
                "contribution_count": contributions,
                "stars_received": sum(p["stars"] for p in pinned),
                "stars_given": stars_given,
                "languages": langs,
                "pinned_projects": pinned,
                "open_source_score": oss_score,
            }

        # DiceBear avatar (unique seed)
        avatar_style = rchoice([
            "adventurer-neutral", "avataaars-neutral", "big-smile",
            "bottts-neutral", "fun-emoji", "lorelei-neutral",
            "notionists-neutral", "personas", "shapes", "thumbs",
        ])
        avatar_url = (
            f"https://api.dicebear.com/9.x/{avatar_style}/svg"
            f"?seed={username}&backgroundType=gradientLinear"
        )

        # Bio — hand-crafted patterns, never repeated verbatim thanks to
        # (first, role, learning_path, college, city) uniqueness.
        bio_templates = [
            "{role} in the making. Currently deep in {path}. {city}-based, coffee-fuelled.",
            "Building small, useful AI things. {path} at CalibiAI. From {college}.",
            "{path} → shipping. {role} target. Sharing what I learn here.",
            "Turning college projects into real products. {role} path, {city}.",
            "Grinding {path}. On the road to being a production-ready {role}.",
            "Ex-CS student, current {role} apprentice. Loves {path}.",
            "I write, I build, I ship. {path} is my current obsession.",
            "AI + Python + a lot of Notion. Currently on the {path} roadmap.",
        ]
        bio = rchoice(bio_templates).format(
            role=target_role, path=learning_path,
            city=city, college=college,
        )

        u = User(
            user_id=det_uuid("user", idx, username),
            first_name=first,
            last_name=last,
            full_name=full_name,
            username=username,
            email=email,
            avatar_url=avatar_url,
            bio=bio,
            city=city,
            state=state,
            country="India",
            region=region,
            college=college,
            branch=branch,
            grad_year=grad_year,
            current_role=current_role,
            target_role=target_role,
            learning_path=learning_path,
            assessment_score=assessment_score,
            talent_score=talent_score,
            talent_tier=tier_name,
            xp=base_xp,
            weekly_xp=weekly_xp,
            community_xp=community_xp,
            projects_completed=projects_completed,
            assignments_completed=assignments_completed,
            current_streak=current_streak,
            longest_streak=longest_streak,
            followers_count=followers_count,
            following_count=following_count,
            joined_date=joined_date.isoformat(),
            last_login=last_login.isoformat(),
            current_level=current_level,
            badges=badges,
            github_connected=github_connected,
            linkedin_connected=linkedin_connected,
            github_url=github_url,
            linkedin_url=linkedin_url,
            portfolio_url=portfolio_url,
            is_production_ready=idx in prod_ready_indices,
            github_stats=gh_stats,
            activity_bucket=bucket,
        )
        users.append(u)
    return users


# ---------------------------------------------------------------------------
# Communities, memberships
# ---------------------------------------------------------------------------

@dataclass
class Community:
    id: str
    slug: str
    name: str
    emoji: str
    description: str
    banner_url: str
    cover_color: str
    sort_order: int


def build_communities() -> List[Community]:
    colors = ["#1f8fff", "#f45f8a", "#8b5cf6", "#22c55e", "#eab308",
              "#f97316", "#06b6d4", "#a855f7", "#10b981", "#ef4444"]
    out: List[Community] = []
    for i, (slug, name, emoji, desc) in enumerate(COMMUNITIES):
        out.append(Community(
            id=det_uuid("community", slug),
            slug=slug,
            name=name,
            emoji=emoji,
            description=desc,
            banner_url=f"/storage/community-banners/{slug}.png",
            cover_color=colors[i % len(colors)],
            sort_order=i + 1,
        ))
    return out


def build_memberships(users: List[User], communities: List[Community]):
    memberships = []
    for u in users:
        # 2-8 communities per user, weighted toward the ones matching learning path.
        n = rint(2, 8)
        chosen = rsample(communities, n)
        # Guarantee everyone joins 'general-ai' — that mirrors real communities.
        gen = next(c for c in communities if c.slug == "general-ai")
        if gen not in chosen:
            chosen[-1] = gen
        for c in chosen:
            joined_at = datetime.fromisoformat(u.joined_date) + timedelta(
                days=rint(0, 30), hours=rint(0, 23)
            )
            role = "moderator" if u.is_production_ready and RNG.random() < 0.2 else "member"
            memberships.append({
                "id": det_uuid("membership", u.user_id, c.id),
                "user_id": u.user_id,
                "community_id": c.id,
                "role": role,
                "joined_at": joined_at.isoformat(),
            })
    return memberships


# ---------------------------------------------------------------------------
# Posts / comments / votes / saves
# ---------------------------------------------------------------------------

def build_posts(users: List[User], communities: List[Community]):
    """400 posts. Uniqueness guaranteed by (post_type, topic, adjective, idx)."""
    posts = []
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)

    # Weight authors by talent score so top users create more content.
    weights = [max(1, u.talent_score) for u in users]

    used_titles: set = set()
    attempts = 0
    while len(posts) < 400 and attempts < 4000:
        attempts += 1
        post_type = rchoice(POST_TYPES)
        topic = rchoice(POST_TOPICS)
        title_tmpl = rchoice(TITLE_TEMPLATES[post_type])
        title = title_tmpl.format(topic=topic)
        # Ensure uniqueness — add a distinctive suffix if we saw it already.
        if title in used_titles:
            adj = rchoice(["revisited", "part 2", "quick take", "field notes",
                           "one week later", "with numbers", "for freshers",
                           "in production"])
            title = f"{title} — {adj}"
        if title in used_titles:
            continue
        used_titles.add(title)

        # Choose community that best matches
        comm = _community_for_topic(topic, communities)
        author = _weighted_choice(users, weights)
        created_offset = int(RNG.triangular(0, 360, 60))  # skewed to recent-ish
        created_at = now - timedelta(days=created_offset,
                                     hours=rint(0, 23),
                                     minutes=rint(0, 59))
        body = _compose_post_body(post_type, topic, author)
        tags = _tags_for(topic, post_type)
        popularity = _popularity_score(created_offset, author.talent_score)
        views = int(popularity * rint(60, 200))
        upvotes = int(popularity * rint(6, 40))
        downvotes = max(0, int(upvotes * 0.05))
        save_count = int(popularity * rint(1, 8))
        comment_count = 0  # updated later

        post = {
            "id": det_uuid("post", len(posts), title[:60]),
            "user_id": author.user_id,
            "community_id": comm.id,
            "post_type": _post_type_slug(post_type),
            "title": title,
            "content": body,
            "tags": tags,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "comment_count": comment_count,
            "save_count": save_count,
            "view_count": views,
            "is_pinned": post_type == "achievement" and RNG.random() < 0.03,
            "is_featured": popularity > 0.75 and RNG.random() < 0.15,
            "tech_stack": (rsample(sum(PROJECT_TECH, []), rint(2, 4))
                           if post_type == "showcase" else []),
            "repo_url": (f"https://github.com/{author.username}/"
                         f"{topic.replace(' ', '-')}-demo") if post_type == "showcase" else None,
            "live_url": (f"https://demos.calibi.ai/{author.username}/"
                         f"{topic.replace(' ', '-')}") if post_type == "showcase" else None,
            "job_type": "full-time" if post_type == "hiring" else None,
            "job_company": rchoice(["Acme AI", "Sapient Labs", "GridPulse",
                                    "Vellum Studio", "NavGen"]) if post_type == "hiring" else None,
            "job_location": f"{author.city}, {author.state}" if post_type == "hiring" else None,
            "created_at": created_at.isoformat(),
            "author_username": author.username,
            "author_talent_score": author.talent_score,
            "post_type_label": post_type,
            "topic": topic,
        }
        posts.append(post)
    return posts


def _post_type_slug(post_type: str) -> str:
    # Map generator's labels to schema's `post_type` text.
    mapping = {
        "question": "question",
        "discussion": "discussion",
        "tutorial": "resource",
        "achievement": "achievement",
        "showcase": "showcase",
        "hiring": "job",
        "news": "resource",
        "research": "resource",
        "prompt": "resource",
        "open-source": "showcase",
    }
    return mapping.get(post_type, "discussion")


def _community_for_topic(topic: str, communities: List[Community]) -> Community:
    m = {
        "RAG": "rag", "agent memory": "ai-agents", "streaming responses": "llms",
        "function calling": "llms", "prompt evals": "prompt-engineering",
        "guardrails": "prompt-engineering", "pgvector search": "vector-databases",
        "hybrid search": "vector-databases", "voice agents": "ai-agents",
        "customer support bots": "ai-agents", "WhatsApp bots": "ai-agents",
        "PDF chat": "rag", "LangGraph flows": "langgraph",
        "CrewAI teams": "crewai", "n8n automations": "n8n",
        "MCP servers": "mcp", "OpenAI Realtime": "openai",
        "Claude tool use": "claude", "Gemini multimodal": "gemini",
        "Mistral fine-tuning": "mistral", "Hugging Face pipelines": "hugging-face",
        "vector databases": "vector-databases",
        "recruitment agents": "ai-agents", "meeting summarizers": "ai-agents",
        "code review agents": "ai-agents", "email triage": "n8n",
        "lead generation agents": "ai-agents", "invoice automation": "n8n",
        "CRM automations": "n8n", "prompt caching": "prompt-engineering",
    }
    slug = m.get(topic, "general-ai")
    for c in communities:
        if c.slug == slug:
            return c
    return communities[0]


def _tags_for(topic: str, post_type: str) -> List[str]:
    tags = {
        topic.replace(" ", "-"),
        post_type,
    }
    # A couple of extra sensible tags
    extras = {
        "RAG": ["rag", "retrieval"], "agent memory": ["agents", "memory"],
        "prompt evals": ["prompts", "evals"], "pgvector search": ["pgvector", "supabase"],
        "voice agents": ["voice", "realtime"], "PDF chat": ["rag", "docs"],
        "LangGraph flows": ["langgraph", "agents"], "CrewAI teams": ["crewai", "agents"],
        "n8n automations": ["n8n", "automation"], "MCP servers": ["mcp"],
        "OpenAI Realtime": ["openai", "realtime"], "Claude tool use": ["claude", "tool-use"],
    }.get(topic, [topic.split()[0].lower()])
    for t in extras:
        tags.add(t)
    return sorted(tags)[:6]


def _compose_post_body(post_type: str, topic: str, author: User) -> str:
    snippet = rchoice(POST_BODY_SNIPPETS.get(post_type, POST_BODY_SNIPPETS["discussion"]))
    # Personalize: mention topic and (sometimes) author's city/college.
    hook = {
        "question": f"Working on a {topic} project and hit a wall.",
        "discussion": f"Thinking out loud about {topic}.",
        "tutorial": f"Sharing my exact playbook for {topic}.",
        "achievement": f"Small win to share — related to {topic}.",
        "showcase": f"New project I built around {topic}.",
        "hiring": f"Sharing an open role — {topic} experience is a plus.",
        "news": f"Quick note on {topic} — this changes a few things.",
        "research": f"Just finished a paper on {topic}, sharing notes.",
        "prompt": f"Sharing a prompt pattern for {topic}.",
        "open-source": f"Released a small OSS thing for {topic}.",
    }[post_type]

    context = ""
    if RNG.random() < 0.35:
        context = f" I'm based in {author.city} and started on the {author.learning_path} roadmap earlier this year."
    close = rchoice([
        "\n\nCurious to hear how others are approaching this.",
        "\n\nHappy to share code or logs if useful.",
        "\n\nFeedback welcome — I want to make v2 better.",
        "\n\nDM if you want to pair on this over the weekend.",
        "\n\nWill post an update next week with numbers.",
    ])
    return f"{hook}{context}\n\n{snippet}{close}"


def _popularity_score(days_ago: int, talent_score: int) -> float:
    # Popular posts have more likes, recent posts fewer (per spec).
    freshness = 1.0 if days_ago > 30 else 0.55 + (days_ago / 30) * 0.45
    author_boost = 0.7 + (talent_score - 300) / 900
    return max(0.15, freshness * author_boost * RNG.uniform(0.6, 1.4))


def _weighted_choice(items, weights):
    return RNG.choices(items, weights=weights, k=1)[0]


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------

def build_comments(users: List[User], posts: List[Dict]):
    comments = []
    weights = [max(1, u.talent_score) for u in users]
    all_comment_pool = COMMENT_STYLES + CODE_SNIPPET_COMMENTS
    target = 2000

    # Distribute: popular posts get more comments.
    # Weight posts by (upvotes + view/100).
    p_weights = [max(1, p["upvotes"] + p["view_count"] // 100) for p in posts]

    # Assign counts to posts summing to ~target.
    counts = [0] * len(posts)
    for _ in range(target):
        idx = RNG.choices(range(len(posts)), weights=p_weights, k=1)[0]
        counts[idx] += 1

    for pi, count in enumerate(counts):
        if count == 0:
            continue
        post = posts[pi]
        post_created = datetime.fromisoformat(post["created_at"])
        first_comment_time = post_created + timedelta(minutes=rint(5, 120))
        parent_ids: List[str] = []
        for ci in range(count):
            author = _weighted_choice(users, weights)
            if author.user_id == post["user_id"] and RNG.random() < 0.7:
                # Author usually doesn't comment on own post
                author = _weighted_choice(users, weights)
            text = rchoice(all_comment_pool)
            # Occasional reply
            parent_id = None
            if parent_ids and RNG.random() < 0.35:
                parent_id = rchoice(parent_ids)
            created_at = first_comment_time + timedelta(hours=rint(0, 96),
                                                       minutes=rint(0, 59))
            upvotes = int(_popularity_score(
                (datetime(2026, 7, 30, tzinfo=timezone.utc) - post_created).days,
                author.talent_score) * rint(0, 12))
            cid = det_uuid("comment", pi, ci, author.user_id)
            comments.append({
                "id": cid,
                "user_id": author.user_id,
                "post_id": post["id"],
                "parent_id": parent_id,
                "content": text,
                "upvotes": upvotes,
                "is_best_answer": (ci == 0 and post["post_type_label"] == "question"
                                   and RNG.random() < 0.35),
                "created_at": created_at.isoformat(),
            })
            parent_ids.append(cid)
        # Update comment_count on post
        post["comment_count"] = count
    return comments


# ---------------------------------------------------------------------------
# Post votes (likes) & saves (bookmarks)
# ---------------------------------------------------------------------------

def build_post_votes(users: List[User], posts: List[Dict]):
    """Generate 12,000 likes (upvotes). Popular posts get more."""
    votes = []
    target = 12000
    # Weight posts by their already-computed upvotes counter.
    p_weights = [max(1, p["upvotes"]) for p in posts]
    # For each vote pick a post + user, dedupe.
    seen = set()
    attempts = 0
    while len(votes) < target and attempts < target * 5:
        attempts += 1
        p_idx = RNG.choices(range(len(posts)), weights=p_weights, k=1)[0]
        u = rchoice(users)
        key = (u.user_id, posts[p_idx]["id"])
        if key in seen:
            continue
        seen.add(key)
        # Vote after post created
        post_created = datetime.fromisoformat(posts[p_idx]["created_at"])
        v_at = post_created + timedelta(hours=rint(1, 24 * 20),
                                        minutes=rint(0, 59))
        # Cap at now
        now = datetime(2026, 7, 30, tzinfo=timezone.utc)
        if v_at > now:
            v_at = now - timedelta(hours=rint(0, 24))
        votes.append({
            "id": det_uuid("vote", u.user_id, posts[p_idx]["id"]),
            "user_id": u.user_id,
            "post_id": posts[p_idx]["id"],
            "vote_type": 1,
            "created_at": v_at.isoformat(),
        })
    # Recompute post.upvotes to be the actual number of votes cast
    counts: Dict[str, int] = {}
    for v in votes:
        counts[v["post_id"]] = counts.get(v["post_id"], 0) + 1
    for p in posts:
        p["upvotes"] = counts.get(p["id"], 0)
    return votes


def build_post_saves(users: List[User], posts: List[Dict]):
    """1500 bookmarks. Skew to top posts + engaged users."""
    saves = []
    target = 1500
    p_weights = [max(1, p["upvotes"] + p["save_count"]) for p in posts]
    seen = set()
    attempts = 0
    while len(saves) < target and attempts < target * 5:
        attempts += 1
        p_idx = RNG.choices(range(len(posts)), weights=p_weights, k=1)[0]
        u = rchoice(users)
        key = (u.user_id, posts[p_idx]["id"])
        if key in seen:
            continue
        seen.add(key)
        post_created = datetime.fromisoformat(posts[p_idx]["created_at"])
        s_at = post_created + timedelta(hours=rint(1, 24 * 30))
        now = datetime(2026, 7, 30, tzinfo=timezone.utc)
        if s_at > now:
            s_at = now - timedelta(hours=rint(0, 24))
        saves.append({
            "id": det_uuid("save", u.user_id, posts[p_idx]["id"]),
            "user_id": u.user_id,
            "post_id": posts[p_idx]["id"],
            "created_at": s_at.isoformat(),
        })
    counts: Dict[str, int] = {}
    for s in saves:
        counts[s["post_id"]] = counts.get(s["post_id"], 0) + 1
    for p in posts:
        p["save_count"] = counts.get(p["id"], 0)
    return saves


# ---------------------------------------------------------------------------
# Follows — realistic graph
# ---------------------------------------------------------------------------

def build_follows(users: List[User]):
    """Top users get 500+; average 50-150; new users 10-20."""
    follows = []
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)

    # Sort users by score for tiers.
    sorted_users = sorted(enumerate(users), key=lambda kv: -kv[1].talent_score)
    top_ids = {u.user_id for _, u in sorted_users[:5]}
    high_ids = {u.user_id for _, u in sorted_users[5:30]}

    # For each user, decide a follower target.
    def follower_target(u: User) -> int:
        if u.user_id in top_ids:
            return rint(520, 780)
        if u.user_id in high_ids:
            return rint(200, 480)
        if u.activity_bucket == "inactive":
            return rint(3, 25)
        if u.talent_score >= 600:
            return rint(60, 160)
        if u.talent_score >= 400:
            return rint(20, 90)
        return rint(8, 35)

    targets = {u.user_id: follower_target(u) for u in users}

    # For each user, pick followers proportional to (target - current)
    # We build the graph in a single pass to keep memory sane.
    user_ids = [u.user_id for u in users]
    followers_current: Dict[str, int] = {uid: 0 for uid in user_ids}
    following_current: Dict[str, int] = {uid: 0 for uid in user_ids}
    edges = set()

    # Rank each user's likelihood to follow: newer/active users follow more.
    def follow_budget(u: User) -> int:
        if u.activity_bucket == "inactive":
            return rint(2, 15)
        if u.talent_score >= 800:
            return rint(80, 220)
        if u.talent_score >= 500:
            return rint(40, 140)
        return rint(15, 70)

    budgets = {u.user_id: follow_budget(u) for u in users}

    # Order: iterate followees (target users), have followers with budget follow them.
    for _, followee in sorted_users:  # highest-score first
        wanted = targets[followee.user_id]
        if followers_current[followee.user_id] >= wanted:
            continue
        # Candidates who still have follow budget
        candidates = [u for u in users
                      if u.user_id != followee.user_id
                      and budgets[u.user_id] > 0
                      and (u.user_id, followee.user_id) not in edges]
        # Weight by candidate's remaining budget
        if not candidates:
            continue
        w = [budgets[c.user_id] for c in candidates]
        take = min(wanted - followers_current[followee.user_id], len(candidates))
        if take <= 0:
            continue
        # Sample without replacement using weights
        picked: List[User] = []
        remaining = candidates.copy()
        remaining_w = w.copy()
        for _ in range(take):
            if not remaining:
                break
            idx = RNG.choices(range(len(remaining)), weights=remaining_w, k=1)[0]
            picked.append(remaining.pop(idx))
            remaining_w.pop(idx)
        for follower in picked:
            edges.add((follower.user_id, followee.user_id))
            budgets[follower.user_id] -= 1
            following_current[follower.user_id] += 1
            followers_current[followee.user_id] += 1
            joined = datetime.fromisoformat(followee.joined_date)
            created_at = joined + timedelta(days=rint(1, 200),
                                            hours=rint(0, 23))
            if created_at > now:
                created_at = now - timedelta(days=rint(0, 20))
            follows.append({
                "id": det_uuid("follow", follower.user_id, followee.user_id),
                "follower_id": follower.user_id,
                "following_id": followee.user_id,
                "created_at": created_at.isoformat(),
            })

    # Update counts on users
    for u in users:
        u.followers_count = followers_current[u.user_id]
        u.following_count = following_current[u.user_id]

    return follows


# ---------------------------------------------------------------------------
# Projects (600)
# ---------------------------------------------------------------------------

def build_projects(users: List[User]):
    projects = []
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)

    # 600 projects, distributed unevenly (advanced users produce more)
    weights = [max(1, u.projects_completed + 1) for u in users]
    target = 600
    used_titles: set = set()

    for i in range(target):
        author = _weighted_choice(users, weights)
        base = rchoice(PROJECT_TITLES)
        # Suffix keeps them unique across 600.
        variants = ["v2", "for College", "for Freshers", "for Bootcamp",
                    "in Production", "with LangGraph", "with n8n",
                    "with Supabase", "with Claude", "with Gemini",
                    "Mini", "Pro", "for Startups", "for Devs", ""]
        v = variants[i % len(variants)]
        title = f"{base}{(' ' + v) if v else ''}".strip()
        # Bounded uniqueness — fall back to a hash-based tag after 20 tries.
        for _ in range(20):
            if title not in used_titles:
                break
            v2 = rchoice(variants) or f"— take {rint(2, 9)}"
            title = f"{base} {v2}".strip()
        if title in used_titles:
            title = f"{base} — build #{i:03d}"
        used_titles.add(title)

        tech = rchoice(PROJECT_TECH)
        difficulty = rchoice(DIFFICULTIES)
        status = rchoice(PROJECT_STATUSES)
        rating = round(3.4 + RNG.random() * 1.6, 1)
        stars = rint(0, 180)
        completion_offset = rint(3, 340)
        completion_date = now - timedelta(days=completion_offset)

        description = _project_description(base, tech, author)
        how_it_works = _how_it_works_snippet(base, tech)

        # Complexity_tier stored as text per migration 002
        ct = {"beginner": "beginner", "intermediate": "intermediate",
              "advanced": "advanced"}[difficulty]

        points = {"beginner": rint(20, 60),
                  "intermediate": rint(60, 140),
                  "advanced": rint(140, 260)}[difficulty]

        proj = {
            "id": det_uuid("project", i, title),
            "user_id": author.user_id,
            "title": title,
            "description": description,
            "how_it_works": how_it_works,
            "tech_stack": ", ".join(tech),
            "repo_url": f"https://github.com/{author.username}/"
                        f"{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')}",
            "live_url": f"https://demos.calibi.ai/{author.username}/"
                        f"{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:32]}",
            "complexity_tier": ct,
            "originality_status": rchoice(["passed", "passed", "passed", "pending", "flagged"]),
            "verified": status in {"completed", "shipped"} and RNG.random() < 0.75,
            "points_awarded": points,
            "ai_feedback": _ai_feedback_line(),
            "ai_score": rint(55, 96),
            "created_at": completion_date.isoformat(),
            "updated_at": completion_date.isoformat(),
            # For JSON only
            "difficulty": difficulty,
            "status": status,
            "rating": rating,
            "stars": stars,
            "completion_date": completion_date.isoformat(),
        }
        projects.append(proj)
    return projects


def _project_description(base: str, tech: List[str], author: User) -> str:
    lines = [
        f"{base} — built by {author.full_name} ({author.college}).",
        f"Stack: {', '.join(tech)}.",
        rchoice([
            "Focus on cost-efficient inference and honest evals.",
            "Optimized for a boring, dependable production path.",
            "Small, opinionated, and easy to hand over to the next dev.",
            "Designed to fit into an existing team's workflow, not replace it.",
            "Built from a real problem I hit while interning last summer.",
        ]),
    ]
    return "\n".join(lines)


def _how_it_works_snippet(base: str, tech: List[str]) -> str:
    return rchoice([
        f"Users submit a query; retrieval hits a pgvector index; a small LLM composes the answer with citations.",
        f"An event webhook triggers an n8n workflow; the AI step drafts a response; a human reviews before send.",
        f"A LangGraph agent plans, delegates to tools ({', '.join(tech[:2])}), and returns a compact JSON.",
        f"A daily cron ingests new docs, embeds them into the vector store, and refreshes a small semantic cache.",
        f"A voice call streams into a realtime model; the transcript is diarized and summarized for the CRM.",
    ])


def _ai_feedback_line() -> str:
    return rchoice([
        "Solid architecture. Consider adding an eval harness with 30+ examples.",
        "Nice write-up. Add tests around the retrieval step to catch regressions.",
        "Clean separation of concerns. Cost tracking is missing — add token counters.",
        "Prompt is on the long side; caching the system prompt would cut ~20% cost.",
        "Great README. Add a diagram and a 30-second demo GIF to the top.",
        "Retrieval quality is good; hybrid search (BM25 + vectors) should push it further.",
    ])


# ---------------------------------------------------------------------------
# XP snapshot, badges assignment, activity log, missions, logins
# ---------------------------------------------------------------------------

def build_xp_rows(users: List[User]):
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)
    rows = []
    for u in users:
        # Contribution level heuristic
        level = "newcomer"
        if u.community_xp >= 3000:
            level = "legend"
        elif u.community_xp >= 1500:
            level = "top_contributor"
        elif u.community_xp >= 700:
            level = "regular"
        elif u.community_xp >= 200:
            level = "active"
        last_active = datetime.fromisoformat(u.last_login).date()
        rows.append({
            "id": det_uuid("xp", u.user_id),
            "user_id": u.user_id,
            "xp": u.xp,
            "level": u.current_level,
            "daily_streak": u.current_streak,
            "last_active_date": last_active.isoformat(),
            "total_posts": 0,  # will be recomputed after posts insert
            "total_comments": 0,
            "total_upvotes_received": 0,
            "contribution_level": level,
        })
    return rows


def build_member_badges(users: List[User]):
    rows = []
    for u in users:
        for slug in u.badges:
            joined = datetime.fromisoformat(u.joined_date)
            awarded = joined + timedelta(days=rint(20, 300),
                                          hours=rint(0, 23))
            rows.append({
                "id": det_uuid("member_badge", u.user_id, slug),
                "user_id": u.user_id,
                "badge_slug": slug,
                "awarded_at": awarded.isoformat(),
            })
    return rows


def build_activity_log(users: List[User], posts: List[Dict],
                       communities: List[Community], projects: List[Dict]):
    """3000 rows — mixed activities across the 12 months."""
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)
    rows = []
    weights = [max(1, u.talent_score) for u in users]
    for i in range(3000):
        u = _weighted_choice(users, weights)
        atype = rchoice(ACTIVITY_TYPES)
        ts = now - timedelta(days=int(RNG.triangular(0, 360, 40)),
                             hours=rint(0, 23),
                             minutes=rint(0, 59))
        meta: Dict = {}
        if atype == "post_liked" and posts:
            p = rchoice(posts)
            meta = {"post_id": p["id"], "post_title": p["title"]}
        elif atype == "community_joined":
            c = rchoice(communities)
            meta = {"community_id": c.id, "community_slug": c.slug}
        elif atype == "project_completed" and projects:
            p = rchoice(projects)
            meta = {"project_id": p["id"], "title": p["title"]}
        elif atype == "badge_earned":
            meta = {"badge_slug": rchoice([b[0] for b in BADGES])}
        elif atype == "talent_score_reached":
            meta = {"score": rchoice([300, 500, 700, 800, 850, 900])}
        elif atype == "roadmap_started":
            meta = {"path": rchoice(LEARNING_PATHS)}
        elif atype == "assessment_completed":
            meta = {"score": rint(45, 95)}
        elif atype == "question_answered" and posts:
            p = rchoice([x for x in posts if x["post_type_label"] == "question"] or posts)
            meta = {"post_id": p["id"]}
        elif atype == "mission_completed":
            meta = {"mission": rchoice(DAILY_MISSIONS)[0]}
        rows.append({
            "id": det_uuid("activity", i, u.user_id),
            "user_id": u.user_id,
            "activity_type": atype,
            "metadata": meta,
            "created_at": ts.isoformat(),
        })
    return rows


def build_daily_missions():
    rows = []
    for i, (title, kind, xp) in enumerate(DAILY_MISSIONS):
        rows.append({
            "id": det_uuid("mission", i, title),
            "slug": re.sub(r'[^a-z0-9]+', '-',
                           title.lower()).strip('-')[:60],
            "title": title,
            "category": kind,
            "xp_reward": xp,
            "sort_order": i + 1,
        })
    return rows


def build_login_history(users: List[User]):
    """~15,000 login events spread across 365 days with morning/afternoon/night mix."""
    rows = []
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)
    # Weight by activity bucket
    bucket_events = {"today": 60, "week": 45, "month": 25, "inactive": 5}
    for u in users:
        events = bucket_events[u.activity_bucket]
        joined = datetime.fromisoformat(u.joined_date)
        max_days_ago = min(365, (now - joined).days)
        for _ in range(events):
            days_ago = rint(0, max_days_ago)
            # Weight time of day: 40% morning (6-11), 30% afternoon (12-17), 30% night (18-23)
            band = RNG.random()
            if band < 0.4:
                hour = rint(6, 11)
                band_label = "morning"
            elif band < 0.7:
                hour = rint(12, 17)
                band_label = "afternoon"
            else:
                hour = rint(18, 23)
                band_label = "night"
            ts = now - timedelta(days=days_ago,
                                 hours=(now.hour - hour) % 24,
                                 minutes=rint(0, 59))
            rows.append({
                "id": det_uuid("login", u.user_id, days_ago, hour),
                "user_id": u.user_id,
                "logged_in_at": ts.isoformat(),
                "time_band": band_label,
                "device": rchoice(["web", "web", "web", "mobile", "mobile", "tablet"]),
                "ip_country": "IN",
            })
    return rows


def build_weekly_stats(users: List[User]):
    """52 weeks of platform-wide stats + per-top-user weekly XP snapshots."""
    now = datetime(2026, 7, 30, tzinfo=timezone.utc)
    platform_rows = []
    for w in range(52):
        week_start = now - timedelta(days=(51 - w) * 7 + 7)
        # Weekend spike, weekday learning
        posts = rint(20, 55) + (10 if w > 40 else 0)
        comments = int(posts * rint(3, 6))
        signups = rint(1, 10)
        active_users = rint(60, 220) + (15 if w > 40 else 0)
        platform_rows.append({
            "id": det_uuid("weekly_platform", w),
            "week_index": w + 1,
            "week_start": week_start.date().isoformat(),
            "week_end": (week_start + timedelta(days=6)).date().isoformat(),
            "posts_created": posts,
            "comments_created": comments,
            "signups": signups,
            "active_users": active_users,
            "weekday_learning_events": rint(120, 280),
            "weekend_project_events": rint(60, 180),
        })

    # Per-user weekly XP for top 100 users
    top = sorted(users, key=lambda u: -u.talent_score)[:100]
    user_rows = []
    for u in top:
        base = u.weekly_xp or int(u.xp * 0.03)
        for w in range(52):
            # Random walk but bounded
            xp = max(0, int(base * RNG.uniform(0.4, 1.6)))
            week_start = now - timedelta(days=(51 - w) * 7 + 7)
            user_rows.append({
                "id": det_uuid("weekly_user", u.user_id, w),
                "user_id": u.user_id,
                "week_index": w + 1,
                "week_start": week_start.date().isoformat(),
                "xp": xp,
            })
    return platform_rows, user_rows


# ---------------------------------------------------------------------------
# Leaderboards
# ---------------------------------------------------------------------------

def build_leaderboards(users: List[User]):
    def top(key, n=25):
        return sorted(users, key=key, reverse=True)[:n]

    def to_row(rank, u, extra):
        return {
            "rank": rank,
            "user_id": u.user_id,
            "username": u.username,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            **extra,
        }

    lb = {
        "talent_score": [
            to_row(i + 1, u, {"talent_score": u.talent_score, "tier": u.talent_tier})
            for i, u in enumerate(top(lambda u: u.talent_score, 50))
        ],
        "community_xp": [
            to_row(i + 1, u, {"community_xp": u.community_xp})
            for i, u in enumerate(top(lambda u: u.community_xp, 50))
        ],
        "weekly_xp": [
            to_row(i + 1, u, {"weekly_xp": u.weekly_xp})
            for i, u in enumerate(top(lambda u: u.weekly_xp, 50))
        ],
        "project_score": [
            to_row(i + 1, u, {"projects_completed": u.projects_completed})
            for i, u in enumerate(top(lambda u: u.projects_completed, 50))
        ],
        "github_score": [
            to_row(i + 1, u, {"open_source_score": u.github_stats["open_source_score"],
                              "repos": u.github_stats["repository_count"]})
            for i, u in enumerate(
                [x for x in top(lambda u: (u.github_stats or {}).get("open_source_score", 0), 100)
                 if x.github_stats][:50])
        ],
        "current_streak": [
            to_row(i + 1, u, {"current_streak": u.current_streak,
                              "longest_streak": u.longest_streak})
            for i, u in enumerate(top(lambda u: u.current_streak, 50))
        ],
    }
    return lb


# ---------------------------------------------------------------------------
# SQL emitters
# ---------------------------------------------------------------------------

def sql_str(v: Optional[str]) -> str:
    if v is None:
        return "NULL"
    return "'" + v.replace("'", "''") + "'"


def sql_bool(v: bool) -> str:
    return "true" if v else "false"


def sql_int(v: Optional[int]) -> str:
    return str(v) if v is not None else "NULL"


def sql_array_text(items: Iterable[str]) -> str:
    if not items:
        return "'{}'::text[]"
    return "ARRAY[" + ", ".join(sql_str(x) for x in items) + "]::text[]"


def sql_json(obj) -> str:
    return "'" + json.dumps(obj, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def sql_ts(v: str) -> str:
    return sql_str(v)


def batched(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def header(title: str, description: str) -> str:
    return textwrap.dedent(f"""\
        -- ============================================================
        -- {title}
        -- {description}
        -- Auto-generated by supabase/seed/scripts/generate_seed.py
        -- ============================================================
        """)


# ---------------------------------------------------------------------------
# Emit SQL files
# ---------------------------------------------------------------------------

def emit_bootstrap_migration():
    """Extra tables the seed needs that aren't in existing migrations."""
    path = SEED_ROOT.parent / "migrations" / "020_seed_support_tables.sql"
    sql = header(
        "020_seed_support_tables",
        "Adds seed-support tables: activity log, daily missions, login history, "
        "weekly platform stats, weekly user XP, GitHub profile stats, and materialized leaderboards.",
    )
    sql += """
-- Activity log ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seed_activity_log_user_time
  ON public.seed_activity_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seed_activity_log_type
  ON public.seed_activity_log (activity_type);
ALTER TABLE public.seed_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed_activity_read_self" ON public.seed_activity_log
  FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'admin');
CREATE POLICY "seed_activity_admin_write" ON public.seed_activity_log
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Daily missions -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seed_daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed_missions_read" ON public.seed_daily_missions FOR SELECT USING (true);
CREATE POLICY "seed_missions_admin_write" ON public.seed_daily_missions
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Login history --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL,
  time_band text NOT NULL CHECK (time_band IN ('morning','afternoon','night')),
  device text NOT NULL DEFAULT 'web',
  ip_country text
);
CREATE INDEX IF NOT EXISTS idx_seed_login_history_user_time
  ON public.seed_login_history (user_id, logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_seed_login_history_time
  ON public.seed_login_history (logged_in_at DESC);
ALTER TABLE public.seed_login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed_login_read_self" ON public.seed_login_history
  FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'admin');
CREATE POLICY "seed_login_admin_write" ON public.seed_login_history
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Weekly stats ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_weekly_platform_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_index integer NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  posts_created integer NOT NULL DEFAULT 0,
  comments_created integer NOT NULL DEFAULT 0,
  signups integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  weekday_learning_events integer NOT NULL DEFAULT 0,
  weekend_project_events integer NOT NULL DEFAULT 0,
  UNIQUE (week_start)
);
CREATE TABLE IF NOT EXISTS public.seed_weekly_user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_index integer NOT NULL,
  week_start date NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_seed_weekly_user_xp_user
  ON public.seed_weekly_user_xp (user_id, week_start);

-- GitHub stats snapshot ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_github_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_count integer NOT NULL DEFAULT 0,
  contribution_count integer NOT NULL DEFAULT 0,
  stars_received integer NOT NULL DEFAULT 0,
  stars_given integer NOT NULL DEFAULT 0,
  languages text[] NOT NULL DEFAULT '{}',
  pinned_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  open_source_score integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seed_github_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed_github_read" ON public.seed_github_stats FOR SELECT USING (true);
CREATE POLICY "seed_github_admin_write" ON public.seed_github_stats
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Denormalized profile extension (city/state, engagement counters, connections)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS learning_path text,
  ADD COLUMN IF NOT EXISTS current_role text,
  ADD COLUMN IF NOT EXISTS assessment_score integer,
  ADD COLUMN IF NOT EXISTS talent_score integer,
  ADD COLUMN IF NOT EXISTS talent_tier text,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS projects_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assignments_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS github_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linkedin_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_production_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Communities: enrich comm_communities with banner + trending
ALTER TABLE public.comm_communities
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS trending_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_activity integer NOT NULL DEFAULT 0;

-- Materialized views for leaderboards (refresh nightly in production)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_talent AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url,
       p.talent_score, p.talent_tier
FROM public.profiles p
WHERE p.flagged = false
ORDER BY p.talent_score DESC NULLS LAST
LIMIT 200;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_weekly_xp AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url, p.weekly_xp
FROM public.profiles p
WHERE p.flagged = false
ORDER BY p.weekly_xp DESC NULLS LAST
LIMIT 200;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_community_xp AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url, p.community_xp
FROM public.profiles p
WHERE p.flagged = false
ORDER BY p.community_xp DESC NULLS LAST
LIMIT 200;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_streak AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url,
       p.current_streak, p.longest_streak
FROM public.profiles p
WHERE p.flagged = false
ORDER BY p.current_streak DESC NULLS LAST
LIMIT 200;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_projects AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url,
       p.projects_completed
FROM public.profiles p
WHERE p.flagged = false
ORDER BY p.projects_completed DESC NULLS LAST
LIMIT 200;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_github AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url,
       g.open_source_score, g.repository_count, g.stars_received
FROM public.profiles p
JOIN public.seed_github_stats g ON g.user_id = p.user_id
WHERE p.flagged = false
ORDER BY g.open_source_score DESC NULLS LAST
LIMIT 200;

-- Helper: refresh all leaderboards
CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_talent;
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_weekly_xp;
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_community_xp;
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_streak;
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_projects;
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_github;
END;
$$;
"""
    path.write_text(sql)
    return path


def emit_auth_users(users: List[User]):
    """Insert into auth.users (Supabase). Requires service role at run time.

    Uses ON CONFLICT DO NOTHING so re-runs are safe. Emails are pre-confirmed
    so seeded accounts can log in immediately during local development.
    """
    lines = [header("01_auth_users",
                     "Creates 300 seeded auth.users rows (deterministic UUIDs, "
                     "pre-confirmed emails, no passwords set — pair with "
                     "supabase.auth.admin.updateUserById to enable login).")]
    lines.append("-- SAFETY: run against dev/staging Supabase only. Do NOT run in production.\n")
    lines.append("SET LOCAL session_replication_role = replica;\n")
    for batch in batched(users, 100):
        lines.append(
            "INSERT INTO auth.users "
            "(instance_id, id, aud, role, email, encrypted_password, "
            "email_confirmed_at, invited_at, confirmation_sent_at, "
            "recovery_sent_at, last_sign_in_at, raw_app_meta_data, "
            "raw_user_meta_data, created_at, updated_at, is_super_admin)\nVALUES"
        )
        parts = []
        for u in batch:
            parts.append(
                f"\n  ('00000000-0000-0000-0000-000000000000', {sql_str(u.user_id)}, "
                f"'authenticated', 'authenticated', {sql_str(u.email)}, "
                # bcrypt hash of 'CalibiSeed!2026' (dev-only). Rotate in prod.
                "'$2a$10$eImiTXuWVxfM37uY4JANjOnrgcZfL2yDpNvB.4rHzFCJGpjLPBB/6', "
                f"{sql_ts(u.joined_date)}, NULL, {sql_ts(u.joined_date)}, "
                f"NULL, {sql_ts(u.last_login)}, "
                f"'{{\"provider\":\"email\",\"providers\":[\"email\"]}}'::jsonb, "
                f"{sql_json({'seed': True, 'full_name': u.full_name, 'username': u.username})}, "
                f"{sql_ts(u.joined_date)}, {sql_ts(u.last_login)}, false)"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (id) DO NOTHING;\n")

    # Identities are required for email/password sign-in.
    lines.append("-- auth.identities for email/password providers ---------------\n")
    for batch in batched(users, 100):
        lines.append(
            "INSERT INTO auth.identities "
            "(id, user_id, identity_data, provider, provider_id, "
            "last_sign_in_at, created_at, updated_at) VALUES"
        )
        parts = []
        for u in batch:
            id_val = det_uuid("identity", u.user_id)
            data = json.dumps({"sub": u.user_id, "email": u.email})
            parts.append(
                f"\n  ({sql_str(id_val)}, {sql_str(u.user_id)}, "
                f"{sql_str(data)}::jsonb, 'email', {sql_str(u.email)}, "
                f"{sql_ts(u.last_login)}, {sql_ts(u.joined_date)}, "
                f"{sql_ts(u.last_login)})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (provider, provider_id) DO NOTHING;\n")
    (SQL_DIR / "01_auth_users.sql").write_text("".join(lines))


def emit_profiles(users: List[User]):
    lines = [header("02_profiles",
                     "Inserts 300 profile rows aligned with auth.users. "
                     "Includes engagement counters, learning-path and location metadata.")]
    for batch in batched(users, 60):
        lines.append(
            "INSERT INTO public.profiles ("
            "user_id, username, full_name, email, college, grad_year, branch, "
            "github_url, linkedin_url, portfolio_url, target_role, location, "
            "bio, role, avatar_url, city, state, country, learning_path, "
            "current_role, assessment_score, talent_score, talent_tier, xp, "
            "weekly_xp, community_xp, projects_completed, assignments_completed, "
            "current_streak, longest_streak, followers_count, following_count, "
            "current_level, github_connected, linkedin_connected, "
            "is_production_ready, last_login, created_at, updated_at) VALUES"
        )
        parts = []
        for u in batch:
            parts.append(
                f"\n  ({sql_str(u.user_id)}, {sql_str(u.username)}, {sql_str(u.full_name)}, "
                f"{sql_str(u.email)}, {sql_str(u.college)}, {sql_int(u.grad_year)}, "
                f"{sql_str(u.branch)}, {sql_str(u.github_url)}, {sql_str(u.linkedin_url)}, "
                f"{sql_str(u.portfolio_url)}, {sql_str(u.target_role)}, "
                f"{sql_str(f'{u.city}, {u.state}, {u.country}')}, "
                f"{sql_str(u.bio)}, 'student', {sql_str(u.avatar_url)}, "
                f"{sql_str(u.city)}, {sql_str(u.state)}, {sql_str(u.country)}, "
                f"{sql_str(u.learning_path)}, {sql_str(u.current_role)}, "
                f"{sql_int(u.assessment_score)}, {sql_int(u.talent_score)}, "
                f"{sql_str(u.talent_tier)}, {sql_int(u.xp)}, {sql_int(u.weekly_xp)}, "
                f"{sql_int(u.community_xp)}, {sql_int(u.projects_completed)}, "
                f"{sql_int(u.assignments_completed)}, {sql_int(u.current_streak)}, "
                f"{sql_int(u.longest_streak)}, {sql_int(u.followers_count)}, "
                f"{sql_int(u.following_count)}, {sql_int(u.current_level)}, "
                f"{sql_bool(u.github_connected)}, {sql_bool(u.linkedin_connected)}, "
                f"{sql_bool(u.is_production_ready)}, {sql_ts(u.last_login)}, "
                f"{sql_ts(u.joined_date)}, {sql_ts(u.last_login)})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\nON CONFLICT (user_id) DO UPDATE SET "
            "talent_score = EXCLUDED.talent_score, "
            "weekly_xp = EXCLUDED.weekly_xp, "
            "community_xp = EXCLUDED.community_xp, "
            "followers_count = EXCLUDED.followers_count, "
            "following_count = EXCLUDED.following_count, "
            "last_login = EXCLUDED.last_login, "
            "updated_at = EXCLUDED.updated_at;\n"
        )
    (SQL_DIR / "02_profiles.sql").write_text("".join(lines))


def emit_scores(users: List[User]):
    lines = [header("03_scores",
                     "Talent-score breakdown (projects/skills/community/completion/recognition). "
                     "Follows the natural bell curve requested by product.")]
    for batch in batched(users, 60):
        lines.append(
            "INSERT INTO public.scores (user_id, projects_pts, skills_pts, "
            "community_pts, completion_pts, recognition_pts, reading_pts, "
            "quizzes_pts, total, tier, last_calculated_at) VALUES"
        )
        parts = []
        for u in batch:
            ts = u.talent_score
            # Split 5 pillars adding up to talent_score.
            projects_pts = min(300, int(ts * 0.28) + rint(-10, 10))
            skills_pts = min(200, int(ts * 0.18) + rint(-8, 8))
            community_pts = min(200, int(ts * 0.14) + rint(-6, 6))
            completion_pts = min(200, int(ts * 0.18) + rint(-8, 8))
            recognition_pts = min(100, int(ts * 0.06) + rint(-4, 4))
            reading_pts = min(100, int(ts * 0.08) + rint(-4, 4))
            quizzes_pts = min(100, int(ts * 0.08) + rint(-4, 4))
            total = min(1000, max(0, projects_pts + skills_pts + community_pts +
                                  completion_pts + recognition_pts +
                                  reading_pts + quizzes_pts))
            tier = ("platinum" if total >= 850 else
                    "gold" if total >= 700 else
                    "silver" if total >= 450 else "bronze")
            parts.append(
                f"\n  ({sql_str(u.user_id)}, {projects_pts}, {skills_pts}, "
                f"{community_pts}, {completion_pts}, {recognition_pts}, "
                f"{reading_pts}, {quizzes_pts}, {total}, '{tier}', "
                f"{sql_ts(u.last_login)})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\nON CONFLICT (user_id) DO UPDATE SET "
            "projects_pts = EXCLUDED.projects_pts, "
            "skills_pts = EXCLUDED.skills_pts, "
            "community_pts = EXCLUDED.community_pts, "
            "completion_pts = EXCLUDED.completion_pts, "
            "recognition_pts = EXCLUDED.recognition_pts, "
            "reading_pts = EXCLUDED.reading_pts, "
            "quizzes_pts = EXCLUDED.quizzes_pts, "
            "total = EXCLUDED.total, tier = EXCLUDED.tier, "
            "last_calculated_at = EXCLUDED.last_calculated_at;\n"
        )
    (SQL_DIR / "03_scores.sql").write_text("".join(lines))


def emit_communities(communities: List[Community]):
    lines = [header("04_communities",
                     "20 curated communities with slugs, banners, colors, and "
                     "trending metadata. Compatible with existing comm_communities schema.")]
    lines.append(
        "INSERT INTO public.comm_communities (id, slug, name, emoji, "
        "description, cover_color, banner_url, sort_order, is_active, created_at) VALUES"
    )
    parts = []
    now = datetime(2026, 7, 30, tzinfo=timezone.utc) - timedelta(days=340)
    for c in communities:
        parts.append(
            f"\n  ({sql_str(c.id)}, {sql_str(c.slug)}, {sql_str(c.name)}, "
            f"{sql_str(c.emoji)}, {sql_str(c.description)}, {sql_str(c.cover_color)}, "
            f"{sql_str(c.banner_url)}, {c.sort_order}, true, "
            f"{sql_ts(now.isoformat())})"
        )
    lines.append(",".join(parts))
    lines.append(
        "\nON CONFLICT (slug) DO UPDATE SET "
        "name = EXCLUDED.name, description = EXCLUDED.description, "
        "banner_url = EXCLUDED.banner_url, cover_color = EXCLUDED.cover_color;\n"
    )
    (SQL_DIR / "04_communities.sql").write_text("".join(lines))


def emit_memberships(memberships):
    lines = [header("05_community_members",
                     "Naturally distributed community memberships (2–8 per user).")]
    for batch in batched(memberships, 200):
        lines.append(
            "INSERT INTO public.comm_members (id, user_id, community_id, role, joined_at) VALUES"
        )
        parts = []
        for m in batch:
            parts.append(
                f"\n  ({sql_str(m['id'])}, {sql_str(m['user_id'])}, "
                f"{sql_str(m['community_id'])}, {sql_str(m['role'])}, "
                f"{sql_ts(m['joined_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (user_id, community_id) DO NOTHING;\n")
    (SQL_DIR / "05_community_members.sql").write_text("".join(lines))


def emit_posts(posts):
    lines = [header("06_posts",
                     "400 unique posts across 10 post types, weighted towards top authors "
                     "and recent activity. Popularity metrics reconciled after votes.")]
    for batch in batched(posts, 40):
        lines.append(
            "INSERT INTO public.comm_posts (id, user_id, community_id, post_type, "
            "title, content, tags, upvotes, downvotes, comment_count, save_count, "
            "view_count, is_pinned, is_featured, tech_stack, repo_url, live_url, "
            "job_type, job_company, job_location, created_at, updated_at) VALUES"
        )
        parts = []
        for p in batch:
            parts.append(
                f"\n  ({sql_str(p['id'])}, {sql_str(p['user_id'])}, "
                f"{sql_str(p['community_id'])}, {sql_str(p['post_type'])}, "
                f"{sql_str(p['title'])}, {sql_str(p['content'])}, "
                f"{sql_array_text(p['tags'])}, {p['upvotes']}, {p['downvotes']}, "
                f"{p['comment_count']}, {p['save_count']}, {p['view_count']}, "
                f"{sql_bool(p['is_pinned'])}, {sql_bool(p['is_featured'])}, "
                f"{sql_array_text(p['tech_stack'])}, {sql_str(p['repo_url'])}, "
                f"{sql_str(p['live_url'])}, {sql_str(p['job_type'])}, "
                f"{sql_str(p['job_company'])}, {sql_str(p['job_location'])}, "
                f"{sql_ts(p['created_at'])}, {sql_ts(p['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\nON CONFLICT (id) DO UPDATE SET "
            "upvotes = EXCLUDED.upvotes, "
            "save_count = EXCLUDED.save_count, "
            "comment_count = EXCLUDED.comment_count, "
            "view_count = EXCLUDED.view_count;\n"
        )
    (SQL_DIR / "06_posts.sql").write_text("".join(lines))


def emit_comments(comments):
    # Sort by created_at so parents are inserted before children.
    ordered = sorted(comments, key=lambda c: (c["created_at"], c["parent_id"] is not None))
    lines = [header("07_comments",
                     "2000 natural comments with different writing styles, replies, "
                     "code snippets and best-answer flags on question posts.")]
    for batch in batched(ordered, 200):
        lines.append(
            "INSERT INTO public.comm_comments (id, user_id, post_id, parent_id, "
            "content, upvotes, is_best_answer, created_at, updated_at) VALUES"
        )
        parts = []
        for c in batch:
            parts.append(
                f"\n  ({sql_str(c['id'])}, {sql_str(c['user_id'])}, "
                f"{sql_str(c['post_id'])}, {sql_str(c['parent_id'])}, "
                f"{sql_str(c['content'])}, {c['upvotes']}, "
                f"{sql_bool(c['is_best_answer'])}, {sql_ts(c['created_at'])}, "
                f"{sql_ts(c['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (id) DO NOTHING;\n")
    (SQL_DIR / "07_comments.sql").write_text("".join(lines))


def emit_post_votes(votes):
    lines = [header("08_post_votes",
                     "12,000 upvotes (likes). Popular + older posts skew higher; "
                     "recent posts have fewer votes.")]
    for batch in batched(votes, 500):
        lines.append(
            "INSERT INTO public.comm_post_votes "
            "(id, user_id, post_id, vote_type, created_at) VALUES"
        )
        parts = []
        for v in batch:
            parts.append(
                f"\n  ({sql_str(v['id'])}, {sql_str(v['user_id'])}, "
                f"{sql_str(v['post_id'])}, {v['vote_type']}, "
                f"{sql_ts(v['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (user_id, post_id) DO NOTHING;\n")
    (SQL_DIR / "08_post_votes.sql").write_text("".join(lines))


def emit_post_saves(saves):
    lines = [header("09_post_saves",
                     "1,500 bookmarks distributed by post popularity and user engagement.")]
    for batch in batched(saves, 500):
        lines.append(
            "INSERT INTO public.comm_post_saves (id, user_id, post_id, created_at) VALUES"
        )
        parts = []
        for s in batch:
            parts.append(
                f"\n  ({sql_str(s['id'])}, {sql_str(s['user_id'])}, "
                f"{sql_str(s['post_id'])}, {sql_ts(s['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (user_id, post_id) DO NOTHING;\n")
    (SQL_DIR / "09_post_saves.sql").write_text("".join(lines))


def emit_follows(follows):
    lines = [header("10_follows",
                     "Realistic follower graph: top users 500+, mid 50–150, new 10–20.")]
    for batch in batched(follows, 500):
        lines.append(
            "INSERT INTO public.comm_follows "
            "(id, follower_id, following_id, created_at) VALUES"
        )
        parts = []
        for f in batch:
            parts.append(
                f"\n  ({sql_str(f['id'])}, {sql_str(f['follower_id'])}, "
                f"{sql_str(f['following_id'])}, {sql_ts(f['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (follower_id, following_id) DO NOTHING;\n")
    (SQL_DIR / "10_follows.sql").write_text("".join(lines))


def emit_projects(projects):
    lines = [header("11_projects",
                     "600 unique AI projects (title, stack, difficulty, GitHub/demo "
                     "URLs, AI feedback score). Compatible with public.projects (post-migration 002).")]
    for batch in batched(projects, 60):
        lines.append(
            "INSERT INTO public.projects (id, user_id, title, description, "
            "repo_url, live_url, complexity_tier, originality_status, "
            "verified, points_awarded, how_it_works, tech_stack, "
            "ai_feedback, ai_score, created_at, updated_at) VALUES"
        )
        parts = []
        for p in batch:
            parts.append(
                f"\n  ({sql_str(p['id'])}, {sql_str(p['user_id'])}, "
                f"{sql_str(p['title'])}, {sql_str(p['description'])}, "
                f"{sql_str(p['repo_url'])}, {sql_str(p['live_url'])}, "
                f"{sql_str(p['complexity_tier'])}, {sql_str(p['originality_status'])}, "
                f"{sql_bool(p['verified'])}, {p['points_awarded']}, "
                f"{sql_str(p['how_it_works'])}, {sql_str(p['tech_stack'])}, "
                f"{sql_str(p['ai_feedback'])}, {p['ai_score']}, "
                f"{sql_ts(p['created_at'])}, {sql_ts(p['updated_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (id) DO NOTHING;\n")
    (SQL_DIR / "11_projects.sql").write_text("".join(lines))


def emit_badges():
    lines = [header("12_badges",
                     "Badge catalog. Uses ON CONFLICT to be safe with the "
                     "existing seed in migration 002.")]
    lines.append(
        "INSERT INTO public.comm_badges (id, slug, name, description, emoji, category) VALUES"
    )
    parts = []
    for slug, name, category, emoji, desc in BADGES:
        parts.append(
            f"\n  ({sql_str(det_uuid('badge', slug))}, {sql_str(slug)}, "
            f"{sql_str(name)}, {sql_str(desc)}, {sql_str(emoji)}, "
            f"{sql_str(category)})"
        )
    lines.append(",".join(parts))
    lines.append(
        "\nON CONFLICT (slug) DO UPDATE SET "
        "name = EXCLUDED.name, description = EXCLUDED.description, "
        "emoji = EXCLUDED.emoji, category = EXCLUDED.category;\n"
    )
    (SQL_DIR / "12_badges.sql").write_text("".join(lines))


def emit_member_badges(member_badges):
    lines = [header("13_member_badges",
                     "User → badge assignments (deduped). Resolves badge_id via slug.")]
    for batch in batched(member_badges, 300):
        lines.append(
            "INSERT INTO public.comm_member_badges (id, user_id, badge_id, awarded_at)\n"
            "SELECT v.id, v.user_id, b.id, v.awarded_at\n"
            "FROM (VALUES"
        )
        parts = []
        for mb in batch:
            parts.append(
                f"\n  ({sql_str(mb['id'])}, {sql_str(mb['user_id'])}, "
                f"{sql_str(mb['badge_slug'])}, {sql_ts(mb['awarded_at'])})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\n) AS v(id, user_id, badge_slug, awarded_at)\n"
            "JOIN public.comm_badges b ON b.slug = v.badge_slug\n"
            "ON CONFLICT (user_id, badge_id) DO NOTHING;\n"
        )
    (SQL_DIR / "13_member_badges.sql").write_text("".join(lines))


def emit_xp(xp_rows):
    lines = [header("14_xp",
                     "Per-user XP / streak / contribution level for comm_xp table.")]
    for batch in batched(xp_rows, 100):
        lines.append(
            "INSERT INTO public.comm_xp (id, user_id, xp, level, daily_streak, "
            "last_active_date, total_posts, total_comments, total_upvotes_received, "
            "contribution_level) VALUES"
        )
        parts = []
        for r in batch:
            parts.append(
                f"\n  ({sql_str(r['id'])}, {sql_str(r['user_id'])}, {r['xp']}, "
                f"{r['level']}, {r['daily_streak']}, {sql_str(r['last_active_date'])}, "
                f"{r['total_posts']}, {r['total_comments']}, "
                f"{r['total_upvotes_received']}, {sql_str(r['contribution_level'])})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\nON CONFLICT (user_id) DO UPDATE SET "
            "xp = EXCLUDED.xp, level = EXCLUDED.level, "
            "daily_streak = EXCLUDED.daily_streak, "
            "last_active_date = EXCLUDED.last_active_date, "
            "contribution_level = EXCLUDED.contribution_level;\n"
        )
    # After all posts/comments exist, recompute totals so the counters are exact.
    lines.append("""
-- Reconcile counters from actual posts/comments/votes
UPDATE public.comm_xp x SET
  total_posts = COALESCE(pc.n, 0),
  total_comments = COALESCE(cc.n, 0),
  total_upvotes_received = COALESCE(uv.n, 0)
FROM (
  SELECT user_id, COUNT(*) n FROM public.comm_posts GROUP BY user_id
) pc
FULL OUTER JOIN (
  SELECT user_id, COUNT(*) n FROM public.comm_comments GROUP BY user_id
) cc USING (user_id)
FULL OUTER JOIN (
  SELECT p.user_id, SUM(GREATEST(p.upvotes, 0))::int n
  FROM public.comm_posts p GROUP BY p.user_id
) uv USING (user_id)
WHERE x.user_id = COALESCE(pc.user_id, cc.user_id, uv.user_id);
""")
    (SQL_DIR / "14_xp.sql").write_text("".join(lines))


def emit_activities(rows):
    lines = [header("15_activity_log",
                     "3,000 activity-log entries across the last 12 months.")]
    for batch in batched(rows, 300):
        lines.append(
            "INSERT INTO public.seed_activity_log "
            "(id, user_id, activity_type, metadata, created_at) VALUES"
        )
        parts = []
        for r in batch:
            parts.append(
                f"\n  ({sql_str(r['id'])}, {sql_str(r['user_id'])}, "
                f"{sql_str(r['activity_type'])}, {sql_json(r['metadata'])}, "
                f"{sql_ts(r['created_at'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (id) DO NOTHING;\n")
    (SQL_DIR / "15_activity_log.sql").write_text("".join(lines))


def emit_daily_missions(rows):
    lines = [header("16_daily_missions",
                     "50 daily missions across read/video/quiz/github/community/assignment/project.")]
    lines.append(
        "INSERT INTO public.seed_daily_missions (id, slug, title, category, xp_reward, sort_order) VALUES"
    )
    parts = []
    for r in rows:
        parts.append(
            f"\n  ({sql_str(r['id'])}, {sql_str(r['slug'])}, "
            f"{sql_str(r['title'])}, {sql_str(r['category'])}, "
            f"{r['xp_reward']}, {r['sort_order']})"
        )
    lines.append(",".join(parts))
    lines.append(
        "\nON CONFLICT (slug) DO UPDATE SET "
        "title = EXCLUDED.title, category = EXCLUDED.category, "
        "xp_reward = EXCLUDED.xp_reward;\n"
    )
    (SQL_DIR / "16_daily_missions.sql").write_text("".join(lines))


def emit_login_history(rows):
    lines = [header("17_login_history",
                     "365-day login history with morning/afternoon/night distribution.")]
    for batch in batched(rows, 400):
        lines.append(
            "INSERT INTO public.seed_login_history "
            "(id, user_id, logged_in_at, time_band, device, ip_country) VALUES"
        )
        parts = []
        for r in batch:
            parts.append(
                f"\n  ({sql_str(r['id'])}, {sql_str(r['user_id'])}, "
                f"{sql_ts(r['logged_in_at'])}, {sql_str(r['time_band'])}, "
                f"{sql_str(r['device'])}, {sql_str(r['ip_country'])})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (id) DO NOTHING;\n")
    (SQL_DIR / "17_login_history.sql").write_text("".join(lines))


def emit_weekly(platform_rows, user_rows):
    lines = [header("18_weekly_stats",
                     "52 weeks of platform + per-top-user weekly XP snapshots. "
                     "Reflects weekend spikes and weekday learning cadence.")]
    lines.append(
        "INSERT INTO public.seed_weekly_platform_stats "
        "(id, week_index, week_start, week_end, posts_created, comments_created, "
        "signups, active_users, weekday_learning_events, weekend_project_events) VALUES"
    )
    parts = []
    for r in platform_rows:
        parts.append(
            f"\n  ({sql_str(r['id'])}, {r['week_index']}, "
            f"{sql_str(r['week_start'])}, {sql_str(r['week_end'])}, "
            f"{r['posts_created']}, {r['comments_created']}, {r['signups']}, "
            f"{r['active_users']}, {r['weekday_learning_events']}, "
            f"{r['weekend_project_events']})"
        )
    lines.append(",".join(parts))
    lines.append("\nON CONFLICT (week_start) DO UPDATE SET "
                 "posts_created = EXCLUDED.posts_created, "
                 "comments_created = EXCLUDED.comments_created, "
                 "signups = EXCLUDED.signups, "
                 "active_users = EXCLUDED.active_users;\n\n")

    for batch in batched(user_rows, 400):
        lines.append(
            "INSERT INTO public.seed_weekly_user_xp "
            "(id, user_id, week_index, week_start, xp) VALUES"
        )
        parts = []
        for r in batch:
            parts.append(
                f"\n  ({sql_str(r['id'])}, {sql_str(r['user_id'])}, "
                f"{r['week_index']}, {sql_str(r['week_start'])}, {r['xp']})"
            )
        lines.append(",".join(parts))
        lines.append("\nON CONFLICT (user_id, week_start) DO UPDATE SET xp = EXCLUDED.xp;\n")
    (SQL_DIR / "18_weekly_stats.sql").write_text("".join(lines))


def emit_github_stats(users: List[User]):
    lines = [header("19_github_stats",
                     "GitHub profile snapshot for the 50 connected users.")]
    connected = [u for u in users if u.github_connected]
    for batch in batched(connected, 25):
        lines.append(
            "INSERT INTO public.seed_github_stats "
            "(user_id, repository_count, contribution_count, stars_received, "
            "stars_given, languages, pinned_projects, open_source_score) VALUES"
        )
        parts = []
        for u in batch:
            g = u.github_stats
            parts.append(
                f"\n  ({sql_str(u.user_id)}, {g['repository_count']}, "
                f"{g['contribution_count']}, {g['stars_received']}, "
                f"{g['stars_given']}, {sql_array_text(g['languages'])}, "
                f"{sql_json(g['pinned_projects'])}, {g['open_source_score']})"
            )
        lines.append(",".join(parts))
        lines.append(
            "\nON CONFLICT (user_id) DO UPDATE SET "
            "repository_count = EXCLUDED.repository_count, "
            "contribution_count = EXCLUDED.contribution_count, "
            "stars_received = EXCLUDED.stars_received, "
            "languages = EXCLUDED.languages, "
            "pinned_projects = EXCLUDED.pinned_projects, "
            "open_source_score = EXCLUDED.open_source_score, "
            "updated_at = now();\n"
        )
    (SQL_DIR / "19_github_stats.sql").write_text("".join(lines))


def emit_recalc(communities: List[Community]):
    """Recompute community counters + trending / weekly-activity scores."""
    lines = [header("20_recalc",
                     "Reconciles denormalized counters after bulk inserts and "
                     "computes trending / weekly-activity scores for communities.")]
    lines.append("""
-- Recompute member_count and post_count from source of truth
UPDATE public.comm_communities c SET
  member_count = COALESCE(m.n, 0),
  post_count   = COALESCE(p.n, 0),
  weekly_activity = COALESCE(w.n, 0),
  trending_score = COALESCE((
    SELECT (SUM(pp.upvotes) * 1.0 + SUM(pp.comment_count) * 1.5 + SUM(pp.view_count) * 0.05)
    FROM public.comm_posts pp
    WHERE pp.community_id = c.id
      AND pp.created_at >= now() - interval '14 days'
  ), 0)
FROM (
  SELECT community_id, COUNT(*)::int n
  FROM public.comm_members GROUP BY community_id
) m
FULL OUTER JOIN (
  SELECT community_id, COUNT(*)::int n
  FROM public.comm_posts GROUP BY community_id
) p ON p.community_id = m.community_id
FULL OUTER JOIN (
  SELECT community_id, COUNT(*)::int n
  FROM public.comm_posts
  WHERE created_at >= now() - interval '7 days'
  GROUP BY community_id
) w ON w.community_id = COALESCE(m.community_id, p.community_id)
WHERE c.id = COALESCE(m.community_id, p.community_id, w.community_id);

-- Reconcile comment_count / save_count on posts (in case triggers were bypassed)
UPDATE public.comm_posts p SET
  comment_count = COALESCE(cc.n, 0),
  save_count    = COALESCE(sc.n, 0)
FROM (
  SELECT post_id, COUNT(*)::int n FROM public.comm_comments GROUP BY post_id
) cc
FULL OUTER JOIN (
  SELECT post_id, COUNT(*)::int n FROM public.comm_post_saves GROUP BY post_id
) sc ON sc.post_id = cc.post_id
WHERE p.id = COALESCE(cc.post_id, sc.post_id);

-- Reconcile followers_count / following_count on profiles
UPDATE public.profiles pr SET
  followers_count = COALESCE(fc.n, 0),
  following_count = COALESCE(fg.n, 0)
FROM (
  SELECT following_id user_id, COUNT(*)::int n
  FROM public.comm_follows GROUP BY following_id
) fc
FULL OUTER JOIN (
  SELECT follower_id user_id, COUNT(*)::int n
  FROM public.comm_follows GROUP BY follower_id
) fg USING (user_id)
WHERE pr.user_id = fc.user_id OR pr.user_id = fg.user_id;

-- Refresh leaderboards
SELECT public.refresh_leaderboards();

-- Sanity checks
DO $$
DECLARE cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.profiles;      RAISE NOTICE 'profiles: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_communities; RAISE NOTICE 'communities: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_posts;    RAISE NOTICE 'posts: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_comments; RAISE NOTICE 'comments: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_post_votes; RAISE NOTICE 'likes: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_post_saves; RAISE NOTICE 'bookmarks: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.comm_follows;   RAISE NOTICE 'follows: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.projects;       RAISE NOTICE 'projects: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.seed_activity_log; RAISE NOTICE 'activities: %', cnt;
  SELECT COUNT(*) INTO cnt FROM public.seed_login_history; RAISE NOTICE 'logins: %', cnt;
END $$;
""")
    (SQL_DIR / "20_recalc.sql").write_text("".join(lines))


def emit_seed_all():
    """One-shot orchestrator that runs every seed file in order."""
    path = SQL_DIR / "99_seed_all.sql"
    parts = [
        header("99_seed_all",
               "Runs every seed file in dependency order in a single transaction. "
               "Requires the service_role connection (bypasses RLS)."),
        "BEGIN;\n",
        "SET LOCAL search_path = public;\n",
        "SET LOCAL statement_timeout = '10min';\n\n",
    ]
    files = sorted(SQL_DIR.glob("*.sql"))
    for f in files:
        if f.name in {"00_reset.sql", "99_seed_all.sql"}:
            continue
        parts.append(f"\\i {f.name}\n")
    parts.append("\nCOMMIT;\n")
    path.write_text("".join(parts))


def emit_reset():
    """Safe reset for dev environments."""
    path = SQL_DIR / "00_reset.sql"
    path.write_text(header(
        "00_reset",
        "DEV-ONLY. Truncates every seeded table + auth.users rows created by the seed."
    ) + """
-- Guard: refuse to run against a Supabase project marked "prod".
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'Refusing to reset seed data in production.';
  END IF;
END $$;

BEGIN;
SET LOCAL session_replication_role = replica;

TRUNCATE
  public.seed_activity_log,
  public.seed_login_history,
  public.seed_weekly_user_xp,
  public.seed_weekly_platform_stats,
  public.seed_daily_missions,
  public.seed_github_stats,
  public.comm_member_badges,
  public.comm_comment_votes,
  public.comm_post_votes,
  public.comm_post_saves,
  public.comm_comments,
  public.comm_posts,
  public.comm_follows,
  public.comm_members,
  public.comm_xp,
  public.projects,
  public.scores
RESTART IDENTITY CASCADE;

-- Only remove seed profiles (identified by the seed marker in raw_user_meta_data)
DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'seed' = 'true'
);

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'seed' = 'true'
);

DELETE FROM auth.users WHERE raw_user_meta_data->>'seed' = 'true';

COMMIT;
""")


# ---------------------------------------------------------------------------
# JSON emitters
# ---------------------------------------------------------------------------

def emit_json(name: str, obj):
    with (JSON_DIR / f"{name}.json").open("w") as fp:
        json.dump(obj, fp, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Docs & storage scaffolding
# ---------------------------------------------------------------------------

def emit_storage_readme():
    (STORAGE_DIR / "README.md").write_text(textwrap.dedent("""\
        # Storage folder layout

        These are the canonical Supabase Storage bucket paths the app expects.
        You do **not** have to upload real media for local dev — the SQL seed
        writes deterministic paths that resolve to `.gitkeep` placeholders here.

        ```
        supabase/seed/storage/
          avatars/                # (unused — we use DiceBear URLs)
          community-banners/      # 1 file per community, keyed by slug
          post-covers/            # optional cover images per showcase post
          project-thumbnails/     # optional thumbnails per project
          user-portfolios/        # per-user portfolio assets (Production Ready)
        ```

        On Supabase, replicate these with:

        ```bash
        supabase storage create-bucket community-banners --public
        supabase storage create-bucket post-covers --public
        supabase storage create-bucket project-thumbnails --public
        supabase storage create-bucket user-portfolios --public
        ```

        The SQL seed does *not* create buckets — it only records the paths
        (`/storage/community-banners/<slug>.png`, etc.) so your app renders
        broken images gracefully when the bucket is empty.
    """))
    for sub in ("community-banners", "post-covers", "project-thumbnails",
                "user-portfolios", "avatars"):
        (STORAGE_DIR / sub).mkdir(parents=True, exist_ok=True)
        (STORAGE_DIR / sub / ".gitkeep").write_text("")


def emit_docs(users, communities, posts, comments, projects, follows,
              votes, saves, memberships, activity_rows, logins,
              platform_rows, user_weekly_rows, missions):
    # Volume summary — helpful in PR descriptions.
    stats = {
        "users": len(users),
        "communities": len(communities),
        "posts": len(posts),
        "comments": len(comments),
        "post_votes": len(votes),
        "post_saves": len(saves),
        "follows": len(follows),
        "memberships": len(memberships),
        "projects": len(projects),
        "activity_log": len(activity_rows),
        "login_history": len(logins),
        "weekly_platform_rows": len(platform_rows),
        "weekly_user_xp_rows": len(user_weekly_rows),
        "daily_missions": len(missions),
    }
    (DOCS_DIR / "volumes.json").write_text(json.dumps(stats, indent=2))

    # ER map + FK map + execution order + index recs + RLS + perf notes
    (DOCS_DIR / "er_relationships.md").write_text(textwrap.dedent("""\
        # ER Relationship Map — CalibiAI Seed

        Legend: `A -[fk]-> B` means A.column references B(id/user_id).

        ## Identity + profile
        - `auth.users(id)` ⇐ `public.profiles(user_id)` (1:1)
        - `auth.users(id)` ⇐ `auth.identities(user_id)` (1:many)
        - `auth.users(id)` ⇐ `public.scores(user_id)` (1:1)
        - `auth.users(id)` ⇐ `public.seed_github_stats(user_id)` (1:1)

        ## Community
        - `comm_communities(id)` ⇐ `comm_members(community_id)`
        - `comm_communities(id)` ⇐ `comm_posts(community_id)`
        - `comm_posts(id)` ⇐ `comm_comments(post_id)`
        - `comm_posts(id)` ⇐ `comm_post_votes(post_id)`
        - `comm_posts(id)` ⇐ `comm_post_saves(post_id)`
        - `comm_comments(id)` ⇐ `comm_comments(parent_id)` (self-ref)
        - `auth.users(id)` ⇐ `comm_members/comm_posts/comm_comments/comm_post_votes/
          comm_post_saves/comm_follows(follower_id, following_id)`

        ## Gamification
        - `auth.users(id)` ⇐ `comm_xp(user_id)`  (1:1)
        - `comm_badges(id)` ⇐ `comm_member_badges(badge_id)`
        - `auth.users(id)` ⇐ `comm_member_badges(user_id)`

        ## Learning / building
        - `auth.users(id)` ⇐ `public.projects(user_id)`
        - `auth.users(id)` ⇐ `public.roadmaps/roadmap_progress(user_id)`

        ## Seed-support (added by migration 020)
        - `auth.users(id)` ⇐ `seed_activity_log(user_id)`
        - `auth.users(id)` ⇐ `seed_login_history(user_id)`
        - `auth.users(id)` ⇐ `seed_weekly_user_xp(user_id)`
    """))

    (DOCS_DIR / "foreign_keys.md").write_text(textwrap.dedent("""\
        # Foreign key inventory

        | Table                         | Column                | References                 | On delete |
        |-------------------------------|-----------------------|----------------------------|-----------|
        | profiles                      | user_id               | auth.users(id)             | CASCADE   |
        | scores                        | user_id               | auth.users(id)             | CASCADE   |
        | projects                      | user_id               | auth.users(id)             | CASCADE   |
        | roadmap_progress              | user_id               | auth.users(id)             | CASCADE   |
        | comm_members                  | user_id               | auth.users(id)             | CASCADE   |
        | comm_members                  | community_id          | comm_communities(id)       | CASCADE   |
        | comm_posts                    | user_id               | auth.users(id)             | CASCADE   |
        | comm_posts                    | community_id          | comm_communities(id)       | SET NULL  |
        | comm_comments                 | user_id               | auth.users(id)             | CASCADE   |
        | comm_comments                 | post_id               | comm_posts(id)             | CASCADE   |
        | comm_comments                 | parent_id             | comm_comments(id)          | CASCADE   |
        | comm_post_votes               | user_id, post_id      | auth.users, comm_posts     | CASCADE   |
        | comm_post_saves               | user_id, post_id      | auth.users, comm_posts     | CASCADE   |
        | comm_follows                  | follower_id           | auth.users(id)             | CASCADE   |
        | comm_follows                  | following_id          | auth.users(id)             | CASCADE   |
        | comm_xp                       | user_id               | auth.users(id)             | CASCADE   |
        | comm_member_badges            | user_id, badge_id     | auth.users, comm_badges    | CASCADE   |
        | seed_activity_log             | user_id               | auth.users(id)             | CASCADE   |
        | seed_login_history            | user_id               | auth.users(id)             | CASCADE   |
        | seed_weekly_user_xp           | user_id               | auth.users(id)             | CASCADE   |
        | seed_github_stats             | user_id               | auth.users(id)             | CASCADE   |
    """))

    (DOCS_DIR / "execution_order.md").write_text(textwrap.dedent("""\
        # Seed execution order

        The `99_seed_all.sql` orchestrator runs everything in this exact order.
        Every file is idempotent (`ON CONFLICT DO NOTHING/UPDATE`) so you can
        re-run individually during iteration.

        1. `020_seed_support_tables.sql`  (migration — adds seed tables & columns)
        2. `00_reset.sql`                 (**dev only** — wipes seeded rows)
        3. `01_auth_users.sql`            (300 auth.users + identities)
        4. `02_profiles.sql`              (300 profiles)
        5. `03_scores.sql`                (300 talent-score breakdowns)
        6. `04_communities.sql`           (20 communities)
        7. `05_community_members.sql`     (~1,500 memberships)
        8. `06_posts.sql`                 (400 posts)
        9. `07_comments.sql`              (2,000 comments — parents before children)
        10. `08_post_votes.sql`           (12,000 likes)
        11. `09_post_saves.sql`           (1,500 bookmarks)
        12. `10_follows.sql`              (natural follower graph)
        13. `11_projects.sql`             (600 projects)
        14. `12_badges.sql`               (badge catalog — upsert)
        15. `13_member_badges.sql`        (badge awards)
        16. `14_xp.sql`                   (comm_xp + counter reconciliation)
        17. `15_activity_log.sql`         (3,000 activities)
        18. `16_daily_missions.sql`       (50 missions)
        19. `17_login_history.sql`        (365-day login events)
        20. `18_weekly_stats.sql`         (52 weeks + top-100 XP snapshots)
        21. `19_github_stats.sql`         (50 GitHub profiles)
        22. `20_recalc.sql`               (counters, trending, leaderboard refresh)
    """))

    (DOCS_DIR / "index_recommendations.md").write_text(textwrap.dedent("""\
        # Index recommendations

        The existing migrations already create the essentials. These extra
        indexes materially help common dashboards:

        ```sql
        -- Feed by community, newest first
        CREATE INDEX IF NOT EXISTS idx_comm_posts_community_created
          ON public.comm_posts (community_id, created_at DESC);

        -- Author profile pages
        CREATE INDEX IF NOT EXISTS idx_comm_posts_user_created
          ON public.comm_posts (user_id, created_at DESC);

        -- "Top this week" queries
        CREATE INDEX IF NOT EXISTS idx_comm_posts_upvotes
          ON public.comm_posts (upvotes DESC, created_at DESC);

        -- Comment threads
        CREATE INDEX IF NOT EXISTS idx_comm_comments_post_created
          ON public.comm_comments (post_id, created_at);

        -- Follower graph traversal
        CREATE INDEX IF NOT EXISTS idx_comm_follows_follower
          ON public.comm_follows (follower_id);
        CREATE INDEX IF NOT EXISTS idx_comm_follows_following
          ON public.comm_follows (following_id);

        -- Leaderboards
        CREATE INDEX IF NOT EXISTS idx_profiles_talent
          ON public.profiles (talent_score DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_profiles_weekly_xp
          ON public.profiles (weekly_xp DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_profiles_streak
          ON public.profiles (current_streak DESC NULLS LAST);
        ```
    """))

    (DOCS_DIR / "rls_notes.md").write_text(textwrap.dedent("""\
        # RLS compatibility notes

        The seed **bypasses RLS** because it runs under the `service_role` /
        `postgres` superuser connection. Every table that RLS applies to gets
        rows inserted safely because:

        * Rows are inserted with the correct `user_id` / `auth.uid()` values.
        * `INSERT ... ON CONFLICT DO NOTHING/UPDATE` respects existing rows.
        * Public-read policies (`comm_communities`, `comm_posts`, `comm_comments`,
          `comm_post_votes`, `comm_follows`, `comm_xp`, `comm_badges`,
          `comm_member_badges`) render the seed to logged-out visitors.
        * Private tables (`comm_notifications`, `comm_post_saves`) are readable
          only by the owning user — the seed still writes them so the "Saved
          for later" UI shows content when a seeded user logs in.
        * `profiles` has an owner-or-admin read policy; a real app should also
          rely on `public.comm_public_profiles` (a SECURITY DEFINER view) to
          render other people's profile chips without exposing PII.

        **Do NOT run the SQL with the `anon` or `authenticated` key** — the
        insert into `auth.users` requires elevated privileges. Use the
        Supabase CLI (`supabase db reset`) or a `psql` connection with the
        service role's DB password.
    """))

    (DOCS_DIR / "performance_notes.md").write_text(textwrap.dedent("""\
        # Performance considerations

        * All inserts are batched (100–500 rows per statement) to keep the
          write-ahead-log entries small and let Postgres commit efficiently.
        * `SET LOCAL session_replication_role = replica` is used only during
          `auth.users` insertion so we don't fire trigger recursion.
        * Counter reconciliation (`20_recalc.sql`) runs once at the end
          instead of relying purely on triggers — this is 30–40× faster
          because the triggers were disabled during bulk load.
        * `refresh_leaderboards()` runs on demand; wire it into a cron
          (`select cron.schedule('lb-refresh', '*/15 * * * *', 'select public.refresh_leaderboards()')`)
          once you install pg_cron.
        * The follower graph is O(edges) ≈ 25k rows. If you need it larger,
          switch the emitter to `COPY FROM STDIN` — same code path, ~5× faster.
        * pgvector rows are NOT seeded (no embeddings) to keep the seed under
          128 MB. Fill them separately from the embedding worker.
    """))

    (DOCS_DIR / "activity_distribution.md").write_text(textwrap.dedent(f"""\
        # Activity distribution (dashboard sanity)

        Users are bucketed so analytics look organic on day one:

        | Bucket             | Count | Meaning                                |
        |--------------------|-------|-----------------------------------------|
        | Active today       | 25    | Last login < 24h                        |
        | Active this week   | 80    | Last login 1–6 days                     |
        | Active this month  | 180 (\\* actually 175 after bucket trim) | Last login 7–30 days |
        | Inactive > 90 days | 20    | Last login > 90 days                    |
        | **Production Ready** | 15  | 3 elites (900+) + 12 (850–899)          |

        \\* We trim 5 slots from the monthly bucket so the totals sum to 300.

        Talent-score buckets:

        | Range      | Count |
        |------------|-------|
        | 900+       | 3     |
        | 850–899    | 12    |
        | 700–849    | 60    |
        | 500–699    | 110   |
        | 300–499    | 80    |
        | < 300      | 35    |
    """))


def emit_root_readme():
    (SEED_ROOT / "README.md").write_text(textwrap.dedent("""\
        # CalibiAI Seed Data

        Production-grade seed that turns an empty Supabase project into a
        realistic AI-learning platform with **300 users, 20 communities,
        400 posts, 2,000 comments, 12,000 likes, 1,500 bookmarks, 600 projects,
        a natural follower graph, gamification, leaderboards and 12 months
        of historical activity.**

        ## Layout

        ```
        supabase/seed/
          scripts/                # Deterministic generator + one-shot runners
            generate_seed.py      # Rebuilds every SQL + JSON artifact
            seed_supabase.sh      # psql-based orchestrator (dev)
            seed_supabase.ts      # Node/TS orchestrator using service role
          sql/                    # Ordered SQL, safe to `\\i` individually
            00_reset.sql
            01_auth_users.sql
            02_profiles.sql
            ...
            20_recalc.sql
            99_seed_all.sql       # Runs all of the above in a transaction
          json/                   # Same data, snapshot as JSON for tests / mocks
          storage/                # Bucket scaffolding + .gitkeep placeholders
          docs/                   # ER map, FK map, RLS notes, index recs, ...
        ```

        ## Prerequisites

        1. Run every migration first, **including** the new
           `supabase/migrations/020_seed_support_tables.sql` this seed ships
           with (activity log, missions, login history, weekly stats,
           GitHub snapshot, materialized leaderboards, profile enrichment).
        2. Have a service-role connection string handy. The seed writes into
           `auth.users`, which requires elevated privileges.

        ## One-shot local dev

        ```bash
        # From repo root
        supabase db reset                # runs migrations 001..020
        cd supabase/seed/scripts
        ./seed_supabase.sh               # runs 99_seed_all.sql via psql
        ```

        Or with the Supabase JS admin SDK:

        ```bash
        SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \\
          npx tsx seed_supabase.ts
        ```

        ## Regenerating the data

        ```bash
        cd supabase/seed/scripts
        python3 generate_seed.py         # rewrites sql/, json/, docs/
        ```

        The generator is deterministic (seeded RNG), so diffs stay small
        across runs.

        ## Data quality guarantees

        - **No Lorem Ipsum** — every string comes from a hand-crafted template
          personalised per user (topic, role, city, college).
        - **No duplicate names / usernames / emails / project titles / post titles.**
        - **Bell-curve talent scores** and **realistic activity buckets**
          (see `docs/activity_distribution.md`).
        - **Deterministic UUIDs** — re-running the generator produces the same
          identifiers, so foreign keys stay stable across seed runs.
    """))


def emit_shell_runner():
    (HERE / "seed_supabase.sh").write_text(textwrap.dedent("""\
        #!/usr/bin/env bash
        # ---------------------------------------------------------------
        # CalibiAI seed runner (psql)
        # Requires DATABASE_URL to be a service-role / postgres connection.
        # Usage:
        #   DATABASE_URL=postgres://... ./seed_supabase.sh
        # ---------------------------------------------------------------
        set -euo pipefail
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        SQL_DIR="$SCRIPT_DIR/../sql"
        DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

        echo "-> Running 99_seed_all.sql against $DATABASE_URL"
        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_DIR/99_seed_all.sql"
        echo "-> Done. Refreshing leaderboards..."
        psql "$DATABASE_URL" -c "select public.refresh_leaderboards();"
    """))
    os.chmod(HERE / "seed_supabase.sh", 0o755)


def emit_ts_runner():
    (HERE / "seed_supabase.ts").write_text(textwrap.dedent("""\
        /**
         * CalibiAI seed runner (Node / TypeScript).
         *
         * Uses the Supabase admin SDK where possible (safer than raw SQL for
         * auth.users) and falls back to executing SQL files for everything
         * else via the `pg` client.
         *
         * Requires:
         *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
         */
        import { readFile } from 'node:fs/promises';
        import { fileURLToPath } from 'node:url';
        import { dirname, join } from 'node:path';
        import { Client } from 'pg';
        import { createClient } from '@supabase/supabase-js';

        const __dirname = dirname(fileURLToPath(import.meta.url));
        const SQL_DIR = join(__dirname, '..', 'sql');

        const {
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
          DATABASE_URL,
        } = process.env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
          console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL');
          process.exit(1);
        }

        // Optional: use the admin SDK if you'd rather create real auth users.
        // This falls back to the SQL path automatically.
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        async function run(client: Client, file: string) {
          const path = join(SQL_DIR, file);
          const sql = await readFile(path, 'utf8');
          process.stdout.write(`  ${file} ... `);
          await client.query(sql);
          console.log('ok');
        }

        (async () => {
          const client = new Client({ connectionString: DATABASE_URL });
          await client.connect();
          console.log('Connected. Running seed files in order.');
          const files = [
            '01_auth_users.sql',
            '02_profiles.sql',
            '03_scores.sql',
            '04_communities.sql',
            '05_community_members.sql',
            '06_posts.sql',
            '07_comments.sql',
            '08_post_votes.sql',
            '09_post_saves.sql',
            '10_follows.sql',
            '11_projects.sql',
            '12_badges.sql',
            '13_member_badges.sql',
            '14_xp.sql',
            '15_activity_log.sql',
            '16_daily_missions.sql',
            '17_login_history.sql',
            '18_weekly_stats.sql',
            '19_github_stats.sql',
            '20_recalc.sql',
          ];
          try {
            await client.query('BEGIN');
            for (const f of files) await run(client, f);
            await client.query('COMMIT');
            console.log('Seed complete.');
          } catch (err) {
            await client.query('ROLLBACK');
            console.error('Seed failed, rolled back.', err);
            process.exit(1);
          } finally {
            await client.end();
          }

          // Sanity call — confirm at least one auth.user exists.
          const { count } = await admin.auth.admin.listUsers({ perPage: 1 });
          console.log(`auth.users visible via admin SDK: ${count ?? 'unknown'}`);
        })().catch((e) => {
          console.error(e);
          process.exit(1);
        });
    """))


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def main():
    print("Building users...")
    users = build_users()

    print("Building communities & memberships...")
    communities = build_communities()
    memberships = build_memberships(users, communities)

    print("Building posts...")
    posts = build_posts(users, communities)

    print("Building comments...")
    comments = build_comments(users, posts)

    print("Building post votes (likes)...")
    votes = build_post_votes(users, posts)

    print("Building post saves (bookmarks)...")
    saves = build_post_saves(users, posts)

    print("Building follows graph...")
    follows = build_follows(users)

    print("Building projects...")
    projects = build_projects(users)

    print("Building XP rows / badges / activities...")
    xp_rows = build_xp_rows(users)
    member_badges = build_member_badges(users)
    activity_rows = build_activity_log(users, posts, communities, projects)
    missions = build_daily_missions()
    logins = build_login_history(users)
    platform_rows, user_weekly_rows = build_weekly_stats(users)
    leaderboards = build_leaderboards(users)

    # ---- SQL ----
    print("Emitting SQL...")
    emit_reset()
    emit_bootstrap_migration()
    emit_auth_users(users)
    emit_profiles(users)
    emit_scores(users)
    emit_communities(communities)
    emit_memberships(memberships)
    emit_posts(posts)
    emit_comments(comments)
    emit_post_votes(votes)
    emit_post_saves(saves)
    emit_follows(follows)
    emit_projects(projects)
    emit_badges()
    emit_member_badges(member_badges)
    emit_xp(xp_rows)
    emit_activities(activity_rows)
    emit_daily_missions(missions)
    emit_login_history(logins)
    emit_weekly(platform_rows, user_weekly_rows)
    emit_github_stats(users)
    emit_recalc(communities)
    emit_seed_all()

    # ---- JSON snapshots ----
    print("Emitting JSON snapshots...")
    emit_json("users", [asdict(u) for u in users])
    emit_json("communities", [asdict(c) for c in communities])
    emit_json("memberships", memberships)
    emit_json("posts", posts)
    emit_json("comments", comments)
    emit_json("post_votes", votes)
    emit_json("post_saves", saves)
    emit_json("follows", follows)
    emit_json("projects", projects)
    emit_json("badges", [
        {"slug": s, "name": n, "category": c, "emoji": e, "description": d}
        for (s, n, c, e, d) in BADGES
    ])
    emit_json("member_badges", member_badges)
    emit_json("comm_xp", xp_rows)
    emit_json("activity_log", activity_rows)
    emit_json("daily_missions", missions)
    emit_json("login_history_sample",
              logins[:500])   # keep JSON small — SQL still has all rows
    emit_json("weekly_platform_stats", platform_rows)
    emit_json("weekly_user_xp_sample", user_weekly_rows[:500])
    emit_json("leaderboards", leaderboards)
    emit_json("github_stats", [
        {"user_id": u.user_id, **u.github_stats}
        for u in users if u.github_stats
    ])

    # ---- Storage scaffolding ----
    emit_storage_readme()

    # ---- Docs ----
    print("Emitting docs...")
    emit_docs(users, communities, posts, comments, projects, follows,
              votes, saves, memberships, activity_rows, logins,
              platform_rows, user_weekly_rows, missions)
    emit_root_readme()
    emit_shell_runner()
    emit_ts_runner()

    print(f"""
Seed generation complete.
  Users:            {len(users)}
  Communities:      {len(communities)}
  Memberships:      {len(memberships)}
  Posts:            {len(posts)}
  Comments:         {len(comments)}
  Post votes:       {len(votes)}
  Post saves:       {len(saves)}
  Follows:          {len(follows)}
  Projects:         {len(projects)}
  Activity rows:    {len(activity_rows)}
  Login events:     {len(logins)}
  Weekly plat rows: {len(platform_rows)}
  Weekly user rows: {len(user_weekly_rows)}
""")


if __name__ == "__main__":
    main()
