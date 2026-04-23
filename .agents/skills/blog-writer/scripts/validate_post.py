import os
import sys
import re
from datetime import datetime

def check_markdown(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    errors = []

    # 1. Frontmatter Check
    frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not frontmatter_match:
        errors.append("Missing or invalid Frontmatter (--- ... ---)")
    else:
        fm_content = frontmatter_match.group(1)
        # title check
        if 'title:' not in fm_content:
            errors.append("Missing 'title' in Frontmatter")
        # tags check
        if 'tags:' not in fm_content:
            errors.append("Missing 'tags' in Frontmatter")
        # date check
        date_match = re.search(r'date:\s*([\d-]{10}T[\d:]{5}\+09:00)', fm_content)
        if not date_match:
            errors.append("Invalid or missing 'date' (ISO 8601 YYYY-MM-DDTHH:mm+09:00 required)")

    # 2. H1 Header Check (Single H1)
    # Exclude Frontmatter for header check
    body_content = content[frontmatter_match.end():] if frontmatter_match else content
    h1_count = len(re.findall(r'^#\s+', body_content, re.MULTILINE))
    if h1_count > 1:
        errors.append(f"Multiple <h1> headers found ({h1_count}). Only one is allowed per page.")
    elif h1_count == 0:
        # Check if title in frontmatter counts as H1? (Usually in VitePress it does)
        # But for strict structure, usually one H1 is expected in body if not handled by theme
        pass

    # 3. Code Block Language Check
    # Match starting backticks with optional language and title
    code_blocks = re.findall(r'```([^\n]*)', body_content)
    
    # In Markdown, code blocks appear in pairs (start/end). 
    # We only care about the starting one (odd indices 0, 2, 4...).
    # However, some snippets might not have closing backticks in view.
    # A better way is to track state or assume the check is only for the opening.
    # Actually, the original script was catching BOTH opening and closing backticks.
    
    # Fixed logic: Find all code block starts that are NOT just closing backticks.
    # We use a state-based approach or simply filter out empty matches that follow a non-empty one.
    
    is_inside_block = False
    block_count = 0
    for line in body_content.splitlines():
        if line.strip().startswith('```'):
            if not is_inside_block:
                # This is a starting block
                is_inside_block = True
                block_count += 1
                lang_part = line.strip()[3:].split('[')[0].strip()
                if not lang_part:
                    errors.append(f"Missing language specification for code block #{block_count}")
            else:
                # This is a closing block
                is_inside_block = False

    if errors:
        print(f"Validation failed for {file_path}:")
        for err in errors:
            print(f"  - {err}")
        return False
    
    print(f"Validation successful for {file_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_post.py <file_path>")
        sys.exit(1)
    
    success = check_markdown(sys.argv[1])
    sys.exit(0 if success else 1)
