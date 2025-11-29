# nheer.io - Personal Website
# Run `just` to see all available commands

# Default recipe - show help
default:
    @just --list

# Development server with hot reload
dev:
    bun run astro dev

# Build for production
build:
    bun run astro build

# Preview production build locally
preview:
    bun run astro preview

# Type check
check:
    bun run astro check

# Install dependencies
install:
    bun install

# Update dependencies
update:
    bun update

# Clean build artifacts
clean:
    rm -rf dist .astro

# Format code with Prettier (if installed)
format:
    bunx prettier --write "src/**/*.{astro,ts,tsx,js,jsx,css,md}"

# Lint code
lint:
    bun run astro check

# Build and preview
serve: build preview

# Add a new blog post (usage: just new-post "my-post-title")
new-post title:
    @echo "---" > src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "title: \"{{title}}\"" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "date: $(date -Iseconds)" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "description: \"\"" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "author: Niklas Heer" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "tags: []" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "lang: en" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "draft: true" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "---" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "" >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "Write your post here..." >> src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md
    @echo "Created: src/content/posts/$(date +%Y)/$(date +%Y-%m-%d)_{{title}}.md"

# Sync content from Hugo backup (for migration)
sync-assets:
    cp -r _hugo_backup/static/assets/images public/assets/

# Deploy to production (builds and lets Netlify handle the rest via git push)
deploy:
    just build
    git add -A
    git commit -m "Deploy: $(date +%Y-%m-%d)"
    git push
