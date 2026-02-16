# Lexomni MCP

MCP (Model Context Protocol) server for local knowledge management with Markdown and PDF indexing using SQLite FTS5.

**Author:** [PagansDev](https://github.com/PagansDev) (Paulo Gabriel Neves Santos) | **Repository:** [github.com/PagansDev/lexomni-mcp](https://github.com/PagansDev/lexomni-mcp)

---

## English

### Usage

#### As a local MCP server

Lexomni MCP automatically discovers the `_lexomni` workspace in your project by walking up the directory tree from `cwd`. If not found, it creates the structure automatically.

1. Configure your MCP client (e.g., Cursor):

```json
"lexomni": {
      "command": "npx",
      "args": ["-y", "lexomni-mcp"],
      "cwd": "/path/to/your/project", # (optional) only if needed
      "env": {}
    },
```

> **Note:** Usually you don't need to define `cwd`; the MCP client typically uses the current workspace directory. Add `"cwd": "/path/to/your/project"` if needed.

> **Note:** npx downloads and execute the package automatically, you don't need to install anything, but in those earlier releases is recomended to clone the repository and run in locally until I adress the issues.
In that case, after you clone the repository, the configuration would be:

#### wsl:
```json
"lexomni-local": {
      "command": "wsl.exe",
      "args": [
        "-d", "distro-your.version", # e.g. : Ubuntu-24.04 
        "--",
        "bash", "-lc",
        "npx -y /path/to/cloned/repository"
      ]
    }
```

#### Windows:
```json
"lexomni-local": {
  "command": "cmd.exe",
  "args": [
    "/c",
    "npx",
    "-y",
    "C:\\Users\\User\\Your\\Folders\\lexomni-mcp"
  ]
}
```

2. Add your documents:
   - `_lexomni/user/` - User markdown (guidelines, architecture, etc.)
   - `_lexomni/agent/` - Agent notes (auto-generated)
   - `_lexomni/books/` - PDFs (books, documentation, etc.)

The folder structure (`_lexomni/user`, `_lexomni/agent`, `_lexomni/books`, `_lexomni/index`) is created automatically on first run.

### Available Tools
> Agent handles parameters on its own

#### `lexomni_listSources`
Lists all documents (MD and PDF) in the workspace.

**Parameters:** none

**Example:**
```json
{
  "workspace": "/path/to/project/_lexomni",
  "count": 5,
  "docs": [...]
}
```

#### `lexomni_buildIndex`
Indexes documents into SQLite FTS5 for fast search.

**Parameters:**
- `sources` (optional): array of `["user", "agent", "books"]`

#### `lexomni_searchDocs`
Keyword search across indexed documents.

**Parameters:**
- `query` (required): string, min 2 characters
- `sources` (optional): filter by source
- `limit` (optional): max results (1-50, default 10)

**Example:**
```json
{
  "query": "clean architecture",
  "hits": [
    {
      "docId": "user:user/guidelines.md",
      "chunkIndex": 0,
      "snippet": "...about [clean] [architecture]...",
      "source": "user",
      "relPath": "user/guidelines.md"
    }
  ]
}
```
#### `lexomni_readDoc`
- docId (required)
- Type: string
  Purpose: unique identifier of the document in the index.
> Constraint: at least 3 characters.
  Typical source: taken from a hit returned by lexomni_searchDocs.
- chunkIndex (optional)
  Type: integer
  Minimum: 0
  Purpose: which chunk (piece) of the document to read.
  If omitted: usually defaults to the first chunk (0), depending on implementation.
- maxChars (optional)
  Type: integer
  Range: 200–20000
  Purpose: maximum number of characters of text to return for that chunk, useful to limit response size.
  
#### `lexomni_writeNote`
- filename (required)
  Type: string
  Purpose: name of the markdown file to create or update in the agent’s notes area.
> Constraint: at least 1 character.
- content (required)
  Type: string
  Purpose: markdown content to write into the file.
> Constraint: at least 1 character.
- mode (optional)
  Type: string
  Allowed values:
  "overwrite" – replaces the existing file content entirely.
  "append" – appends content to the end of the existing file.
  Default: "overwrite" if not specified.

### Security

- Path traversal blocked (no `../` allowed)
- Access restricted to workspace `_lexomni`
- Write access limited to `_lexomni/agent/`

### Architecture

```
_lexomni/               # In user's project
  user/                 # Guidelines, architecture (read-only)
  agent/                # Agent notes (writable)
  books/                # PDFs (read-only)
  index/                # SQLite FTS5 (generated)
    lexomni.sqlite
```

### Multilingual Strategy

Lexomni does not translate text internally. To find docs in PT and EN for e.g. :

1. Agent expands queries before searching:
   - "arquitetura em camadas" → also searches "layered architecture"
   - "fila" → also searches "message queue", "job queue"

2. Living glossary at `_lexomni/agent/glossary.md`:
   - Agent learns new terms via web search
   - Improves search quality over time

### Development

```bash
npm run build    # Build production
npm run dev      # Watch mode
npm start        # Run built server
```

---

## License

MIT © [Paulo Gabriel Neves Santos](https://github.com/PagansDev)
