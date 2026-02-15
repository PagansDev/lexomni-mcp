# Lexomni MCP

MCP (Model Context Protocol) server for local knowledge management with Markdown and PDF indexing using SQLite FTS5.

**Author:** [PagansDev](https://github.com/PagansDev) (Paulo Gabriel Neves Santos) | **Repository:** [github.com/PagansDev/lexomni-mcp](https://github.com/PagansDev/lexomni-mcp)

---

## English

### Installation

```bash
npm install
npm run build
```

### Usage

#### As a local MCP server

Lexomni MCP automatically discovers the `_lexomni` workspace in your project by walking up the directory tree from `cwd`. If not found, it creates the structure automatically.

1. Configure your MCP client (e.g., Cursor):

```json
{
  "mcpServers": {
    "lexomni": {
      "command": "npx",
      "args": ["lexomni-mcp"]
    }
  }
}
```

> **Note:** Usually you don't need to define `cwd`; the MCP client typically uses the current workspace directory. Add `"cwd": "/path/to/your/project"` if needed.

2. Add your documents:
   - `_lexomni/user/` - User markdown (guidelines, architecture, etc.)
   - `_lexomni/agent/` - Agent notes (auto-generated)
   - `_lexomni/books/` - PDFs (books, documentation, etc.)

The folder structure (`_lexomni/user`, `_lexomni/agent`, `_lexomni/books`, `_lexomni/index`) is created automatically on first run.

### Available Tools

#### `lexomni.listSources`
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

#### `lexomni.buildIndex`
Indexes documents into SQLite FTS5 for fast search.

**Parameters:**
- `sources` (optional): array of `["user", "agent", "books"]`

#### `lexomni.searchDocs`
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

#### `lexomni.readDoc`
Reads a specific chunk of an indexed document.

**Parameters:**
- `docId` (required): document ID (e.g. "user:user/file.md")
- `chunkIndex` (optional): chunk index (default 0)
- `maxChars` (optional): character limit (200-20000, default 8000)

#### `lexomni.writeNote`
Creates or updates a markdown file in `_lexomni/agent`.

**Parameters:**
- `filename` (required): file name (e.g. "2026-02-15_summary.md")
- `content` (required): markdown content
- `mode` (optional): "overwrite" or "append" (default "overwrite")

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

Lexomni does not translate text internally. To find docs in PT and EN:

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

## Português (PT-BR)

### Instalação

```bash
npm install
npm run build
```

### Uso

#### Como servidor MCP local

O Lexomni MCP descobre automaticamente o workspace `_lexomni` no projeto do usuário, subindo a árvore de diretórios a partir do `cwd`. Se não encontrar, cria a estrutura automaticamente.

1. Configure no cliente MCP (ex.: Cursor):

```json
{
  "mcpServers": {
    "lexomni": {
      "command": "npx",
      "args": ["lexomni-mcp"]
    }
  }
}
```

> **Nota:** Em geral não é preciso definir `cwd`; o cliente MCP costuma usar o diretório do projeto aberto. Se necessário, adicione `"cwd": "/caminho/para/seu/projeto"`.

2. Adicione seus documentos:
   - `_lexomni/user/` - Markdown do usuário (guidelines, arquitetura, etc.)
   - `_lexomni/agent/` - Notas do agente (geradas automaticamente)
   - `_lexomni/books/` - PDFs (livros, documentação, etc.)

A estrutura de pastas (`_lexomni/user`, `_lexomni/agent`, `_lexomni/books`, `_lexomni/index`) é criada automaticamente na primeira execução.

### Tools Disponíveis

#### `lexomni.listSources`
Lista todos os documentos (MD e PDF) disponíveis no workspace.

**Parâmetros:** nenhum

**Exemplo:**
```json
{
  "workspace": "/path/to/project/_lexomni",
  "count": 5,
  "docs": [...]
}
```

#### `lexomni.buildIndex`
Indexa os documentos no SQLite FTS5 para busca rápida.

**Parâmetros:**
- `sources` (opcional): array de `["user", "agent", "books"]`

#### `lexomni.searchDocs`
Busca por palavra-chave nos documentos indexados.

**Parâmetros:**
- `query` (obrigatório): string mínimo 2 caracteres
- `sources` (opcional): filtrar por fonte
- `limit` (opcional): máximo de resultados (1-50, padrão 10)

**Exemplo:**
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

#### `lexomni.readDoc`
Lê um chunk específico de um documento indexado.

**Parâmetros:**
- `docId` (obrigatório): ID do documento (ex: "user:user/file.md")
- `chunkIndex` (opcional): índice do chunk (padrão 0)
- `maxChars` (opcional): limite de caracteres (200-20000, padrão 8000)

#### `lexomni.writeNote`
Cria ou atualiza um arquivo markdown em `_lexomni/agent`.

**Parâmetros:**
- `filename` (obrigatório): nome do arquivo (ex: "2026-02-15_resumo.md")
- `content` (obrigatório): conteúdo markdown
- `mode` (opcional): "overwrite" ou "append" (padrão "overwrite")

### Segurança

- Path traversal bloqueado (não permite `../`)
- Acesso restrito ao workspace `_lexomni`
- Escrita limitada apenas a `_lexomni/agent/`

### Arquitetura

```
_lexomni/               # No projeto do usuário
  user/                 # Guidelines, arquitetura (leitura)
  agent/                # Notas do agente (escrita)
  books/                # PDFs (leitura)
  index/                # SQLite FTS5 (gerado)
    lexomni.sqlite
```

### Estratégia Multilíngue

O Lexomni não traduz texto internamente. Para encontrar documentação em PT e EN:

1. O agente expande queries antes de buscar:
   - "arquitetura em camadas" → também busca "layered architecture"
   - "fila" → também busca "message queue", "job queue"

2. Glossário vivo em `_lexomni/agent/glossary.md`:
   - O agente aprende novos termos via web search
   - Melhora a busca ao longo do tempo

### Desenvolvimento

```bash
npm run build    # Build production
npm run dev      # Watch mode
npm start        # Run built server
```

---

## License

MIT © [Paulo Gabriel Neves Santos](https://github.com/PagansDev)
