/**
 * SFDocs Plugins - Hands-on Demo
 * 
 * Demonstrates the three transformation stages using unified pipeline:
 *   1. Markdown → MDAST (remark-parse)
 *   2. MDAST → HAST (remark-rehype)
 *   3. HAST → HTML (rehype-stringify)
 * 
 * Run: node hands-on-demo.js
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

// ============================================================================
// SIMPLE CALLOUT PLUGIN (same as SFDocs)
// Transforms :::warning, :::tip, :::note, :::important → <doc-content-callout>
// ============================================================================
const calloutPlugin = () => {
    const CALLOUT_TYPES = ['note', 'tip', 'warning', 'important', 'caution'];
    const TITLES = { note: 'Note', tip: 'Tip', warning: 'Warning', important: 'Important', caution: 'Caution' };

    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'containerDirective' && CALLOUT_TYPES.includes(node.name)) {
                const data = node.data || (node.data = {});
                data.hName = 'doc-content-callout';
                data.hProperties = { header: TITLES[node.name], variant: node.name };
            }
        });
    };
};

// ============================================================================
// SIMPLE VIDEO PLUGIN (same as SFDocs)
// Transforms ::video{src="..." title="..." type="..."} → video HTML
// ============================================================================
const videoPlugin = () => {
    return (tree) => {
        visit(tree, (node, index, parent) => {
            if (node.type === 'leafDirective' && node.name === 'video') {
                const { src, title, type } = node.attributes || {};

                let html = '';
                if (type === 'youtube') {
                    html = `<div class="video-plugin-div"><div class="video-plugin-title">${title}</div><iframe src="${src}"></iframe></div>`;
                } else if (type === 'local') {
                    html = `<div class="video-plugin-div"><div class="video-plugin-title">${title}</div><video controls><source src="${src}" type="video/mp4"></video></div>`;
                }

                parent.children[index] = { type: 'html', value: html };
            }
        });
    };
};

// Sample markdown
const sampleMarkdown = `
# Welcome to SFDocs

This is a paragraph with :abbr[HTML]{title="HyperText Markup Language"} abbreviation.

::video{src="https://youtube.com/embed/abc123" title="Demo Video" type="youtube"}

:::warning
Be careful when deleting records. This action cannot be undone.
:::

![Alt Text](https://example.com/image.jpg)
`.trim();

// Stage 1: Markdown → MDAST
const parseToMdast = (markdown) => {
    return unified()
        .use(remarkParse)
        .use(remarkDirective)
        .parse(markdown);
};

// Stage 2: MDAST → HAST (with plugins)
const mdastToHast = (mdast) => {
    return unified()
        .use(videoPlugin)
        .use(calloutPlugin)
        .use(remarkRehype, { allowDangerousHtml: true })
        .runSync(mdast);
};

// Stage 3: HAST → HTML
const hastToHtml = (hast) => {
    return unified()
        .use(rehypeStringify, { allowDangerousHtml: true })
        .stringify(hast);
};

// Run demo
console.log('\n📄 INPUT: Markdown\n');
console.log(sampleMarkdown);

const mdast = parseToMdast(sampleMarkdown);
console.log('\n\n🔄 STAGE 1: Markdown → MDAST\n');
console.log(JSON.stringify(mdast, null, 2));

const hast = mdastToHast(mdast);
console.log('\n\n🔄 STAGE 2: MDAST → HAST (with callout & video plugins)\n');
console.log(JSON.stringify(hast, null, 2));

const html = hastToHtml(hast);
console.log('\n\n🔄 STAGE 3: HAST → HTML\n');
console.log(html);

console.log('\n');
