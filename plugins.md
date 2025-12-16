# SFDocs Markdown Plugins

## Table of Contents

1. [Why Plugins?](#1-why-plugins)
2. [The Ecosystem](#2-the-ecosystem)
3. [Directive Types](#3-directive-types)
4. [Callout Plugin Deep Dive](#4-callout-plugin-deep-dive)
5. [Video Plugin Overview](#5-video-plugin-overview)
6. [SFDocs Integration](#6-sfdocs-integration)
7. [Creating a New Plugin](#7-creating-a-new-plugin)
8. [Debugging](#8-debugging)
9. [Publishing Alpha Packages](#9-publishing-alpha-packages)
10. [References](#10-references)

---

## 1. Why Plugins?

### What Works Out of the Box?

Standard markdown elements are converted automatically:

| Markdown       | HTML     |
| -------------- | -------- |
| `# Heading`    | `<h1>`   |
| `paragraph`    | `<p>`    |
| `![](img.png)` | `<img>`  |
| `` `code` ``   | `<code>` |

### Why Do We Need Plugins?

**Two reasons:**

1. **Enhance standard elements** — Some plugins modify standard nodes:

   - `imageTransformer` — transforms image URLs to CDN paths
   - `anchorHeading` — adds anchor links to headings

2. **Custom elements** — Callouts, video embeds, includes, tabs don't exist in standard markdown. We need:
   - A special syntax to write them (see [Directive Types](#3-directive-types))
   - `remark-directive` to parse that syntax into MDAST nodes
   - Custom plugins to transform those nodes into meaningful HTML (without plugins, they become `<div>`s)

---

## 2. The Ecosystem

| Term        | What it is                                                    |
| ----------- | ------------------------------------------------------------- |
| **Unified** | Processing pipeline framework (parse → transform → stringify) |
| **Remark**  | Markdown processor built on Unified                           |
| **MDAST**   | Markdown Abstract Syntax Tree                                 |
| **HAST**    | HTML Abstract Syntax Tree                                     |

### The Pipeline

```
Markdown → MDAST → (plugins transform) → HAST → HTML
         ↑              ↑                 ↑        ↑
    remark-parse   our plugins     remark-rehype  rehype-stringify
```

### Run the Demo

```bash
git clone https://github.com/sunnymsf/remark-plugins-demo.git
cd remark-plugins-demo
yarn install
yarn demo
```

---

## 3. Directive Types

Based on the [CommonMark Generic Directives Proposal](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444).

| Type          | Colons    | HTML Analogy     | Example                    |
| ------------- | --------- | ---------------- | -------------------------- |
| **Inline**    | `:name`   | `<span>`         | `:abbr[HTML]{title="..."}` |
| **Leaf**      | `::name`  | `<div/>` (empty) | `::video{src="..."}`       |
| **Container** | `:::name` | `<div>...</div>` | `:::warning ... :::`       |

### Nesting (More colons = outer container)

```markdown
::::::tabset{tabs='["Tab1", "Tab2"]'}
:::::tab
:::tip
Content inside tab
:::
:::::
::::::
```

---

## 4. Callout Plugin Deep Dive

### Supported Types

`:::note`, `:::tip`, `:::warning`, `:::important`, `:::caution`

### Input → Output

```markdown
:::warning
Be careful!
:::
```

↓

```html
<doc-content-callout header="Warning" variant="warning">
  <p>Be careful!</p>
</doc-content-callout>
```

### How It Works

1. `visit()` traverses all nodes in the tree
2. Finds `containerDirective` nodes named `warning`, `tip`, etc.
3. Sets `hName` → output element name
4. Sets `hProperties` → output element attributes
5. Children are automatically processed

_(See actual code in demo)_

---

## 5. Video Plugin Overview

### Input → Output

```markdown
::video{src="https://youtube.com/embed/abc" title="Demo" type="youtube"}
```

↓

```html
<div class="video-plugin-div">
  <div class="video-plugin-title">Demo</div>
  <iframe src="https://youtube.com/embed/abc"></iframe>
</div>
```

### Plugin Approaches

| Approach              | When to use                   |
| --------------------- | ----------------------------- |
| `hName`/`hProperties` | Simple single element output  |
| Raw HTML replacement  | Complex nested HTML structure |

### Leaf vs Container

| Type                     | Has Children | Approach                   |
| ------------------------ | ------------ | -------------------------- |
| Leaf (`::video`)         | No           | Either approach works      |
| Container (`:::warning`) | Yes          | Must use hName/hProperties |

---

## 6. SFDocs Integration

### Where Plugins are Registered

`packages/@salesforcedocs/doc-framework/src/server/index.ts`

### Plugin Order Rules

| Run Order | Plugin Type          | Example                                    |
| --------- | -------------------- | ------------------------------------------ |
| FIRST     | Tree-modifying       | `::include` (inlines content)              |
| MIDDLE    | Content-transforming | `imageTransformer` (changes URLs)          |
| LAST      | Metadata-adding      | `callout`, `tabs` (sets hName/hProperties) |

**Why order matters:**

- `remark_directive` must run first (parses `:::` syntax)
- Image transformer before callout (so images inside callouts get transformed)
- Metadata-adding plugins can be flexible among themselves

---

## 7. Creating a New Plugin

### Basic Structure

1. Create a function that returns a transformer
2. Use `visit()` to traverse the tree
3. Find nodes matching your directive
4. Set `hName` and `hProperties` (or replace with raw HTML)
5. Export the plugin function

### Register in SFDocs

Add to `doc-framework/src/server/index.ts` in the `markdownPlugins` array.

---

## 8. Debugging

### Using Jest Runner Extension

1. Install **Jest Runner** extension in Cursor/VSCode
2. Write a simple test case for your plugin
3. Click "Run" or "Debug" above the test to debug with breakpoints

### Using AST Explorer

1. Go to https://astexplorer.net/
2. Select "Markdown" → "remark" parser
3. Paste your markdown to see the AST structure

### Debugging After Integration

If debugging after integrating alpha/latest package with doc-framework:

1. Start the server in doc-framework
   ```bash
   cd doc-framework
   yarn start
   ```
2. Add breakpoints or console.log in `node_modules/@salesforcedevs/your-plugin`

---

## 9. Publishing Alpha Packages

### Steps

1. Go to the respective plugin package

   ```bash
   cd sfdocs-remark-callout-plugin
   ```

2. Build the package

   ```bash
   yarn build
   ```

3. Publish with alpha tag
   ```bash
   yarn publish 1.0.1-example-v1 alpha
   ```

### Integrating Alpha in doc-framework

1. Update dependency in `doc-framework/package.json`

   ```json
   "@salesforcedevs/sfdocs-remark-callout-plugin": "1.0.1-example-v1"
   ```

2. Install and test
   ```bash
   yarn install
   yarn start
   ```

### Local Development using symlinking (without publishing)

1. In your plugin folder

   ```bash
   yarn link
   ```

2. In doc-framework folder

   ```bash
   yarn link @salesforcedevs/sfdocs-my-plugin
   ```

3. Rebuild plugin after changes
   ```bash
   yarn build
   ```

---

## 10. References

### Directive Syntax

- [Generic Directives Proposal (CommonMark)](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444)

### Unified Ecosystem

- [Unified](https://unifiedjs.com/)
- [Introduction to Unified and Remark](https://braincoke.fr/blog/2020/03/an-introduction-to-unified-and-remark/)

### Remark

- [Remark](https://remark.js.org/)
- [remark-directive](https://github.com/remarkjs/remark-directive)

### Syntax Trees

- [MDAST Specification](https://github.com/syntax-tree/mdast)
- [HAST Specification](https://github.com/syntax-tree/hast)

### Tools

- [AST Explorer](https://astexplorer.net/)
