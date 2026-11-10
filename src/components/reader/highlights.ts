// Highlights are stored as character offsets into the story's text content.
// They are painted by wrapping the matching text nodes in <mark>, so the
// story's own markup (paragraphs, lists, glossary words) is never rewritten.

export type Highlight = {
  id: string;
  chapterId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
};

/** Text nodes that belong to the story (not to glossary popover UI). */
function storyTextNodes(root: Element): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const parent = (n as Text).parentElement;
    if (parent?.closest('[data-popover-panel]')) continue;
    nodes.push(n as Text);
  }
  return nodes;
}

/** Offset of (node, offset) within the root's story text. */
export function textOffset(root: Element, node: Node, offset: number): number {
  let total = 0;
  for (const t of storyTextNodes(root)) {
    if (t === node) return total + offset;
    total += t.data.length;
  }
  // Selection ended on an element boundary: count the text before it.
  if (node.nodeType === Node.ELEMENT_NODE) {
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  }
  return total;
}

export function clearHighlights(root: Element) {
  root.querySelectorAll('mark[data-highlight-id]').forEach((mark) => {
    const parent = mark.parentNode!;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
}

/**
 * Wrap each highlight's text in <mark>. Text inside glossary buttons is
 * counted (so offsets match what the reader selected) but not wrapped,
 * because React owns those nodes.
 */
export function paintHighlights(root: Element, highlights: Highlight[]) {
  clearHighlights(root);
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  for (const h of sorted) {
    // Wrapping never changes the text, so offsets stay valid between passes.
    const hits: { node: Text; from: number; to: number }[] = [];
    let pos = 0;
    for (const node of storyTextNodes(root)) {
      const start = pos;
      pos += node.data.length;
      const from = Math.max(h.startOffset, start);
      const to = Math.min(h.endOffset, pos);
      if (from >= to || node.parentElement?.closest('[data-popover]')) continue;
      hits.push({ node, from: from - start, to: to - start });
    }
    for (const { node, from, to } of hits) {
      const run = from > 0 ? node.splitText(from) : node;
      if (to - from < run.data.length) run.splitText(to - from);
      const mark = document.createElement('mark');
      mark.dataset.highlightId = h.id;
      mark.className = 'mt-highlight';
      if (h.note) mark.title = h.note;
      run.parentNode!.insertBefore(mark, run);
      mark.appendChild(run);
    }
  }
}
