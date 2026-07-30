#!/usr/bin/env python3
"""
Split large seed SQL files into smaller parts for Supabase.

Usage: python split_seed_sql.py <file> <num_parts>
"""

import re
import sys
import os

def split_sql_file(filepath, num_parts):
    """Split a large INSERT-heavy SQL file into num_parts smaller files."""
    
    with open(filepath, 'r') as f:
        content = f.read()

    basename = os.path.basename(filepath)
    name, ext = os.path.splitext(basename)
    outdir = os.path.dirname(filepath)

    # Extract the header comment (everything before the first INSERT)
    header_match = re.match(r'^(.*?)(INSERT\s+INTO)', content, re.DOTALL | re.IGNORECASE)
    if not header_match:
        print(f"Error: Could not find INSERT statement in {filepath}")
        return
    
    header = header_match.group(1)
    rest = content[len(header):]

    # Split into individual INSERT blocks (each ends with ON CONFLICT ... DO NOTHING;)
    insert_blocks = re.split(r'(?<=DO NOTHING;)\s*\n', rest)
    insert_blocks = [b.strip() for b in insert_blocks if b.strip()]

    print(f"  Found {len(insert_blocks)} INSERT blocks in {basename}")

    # Distribute blocks across parts
    blocks_per_part = len(insert_blocks) // num_parts
    remainder = len(insert_blocks) % num_parts

    start = 0
    for part in range(num_parts):
        count = blocks_per_part + (1 if part < remainder else 0)
        part_blocks = insert_blocks[start:start + count]
        start += count

        part_filename = f"{name}_part{part+1:02d}{ext}"
        part_filepath = os.path.join(outdir, part_filename)

        with open(part_filepath, 'w') as out:
            out.write(header)
            out.write('\n\n'.join(part_blocks))
            # Ensure trailing newline
            if not part_blocks[-1].endswith('\n'):
                out.write('\n')

        print(f"  Created {part_filename} ({count} blocks)")


def main():
    configs = [
        ("supabase/seed/sql/08_post_votes.sql", 5),
        ("supabase/seed/sql/10_follows.sql", 8),
        ("supabase/seed/sql/17_login_history.sql", 3),
    ]

    repo_root = os.path.join(os.path.dirname(__file__), '..')

    for rel_path, num_parts in configs:
        full_path = os.path.join(repo_root, rel_path)
        if not os.path.exists(full_path):
            print(f"Warning: {full_path} not found, skipping")
            continue
        print(f"\nSplitting {rel_path} into {num_parts} parts...")
        split_sql_file(full_path, num_parts)


if __name__ == "__main__":
    main()
