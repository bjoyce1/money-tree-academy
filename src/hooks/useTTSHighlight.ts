import { useCallback, useEffect, useRef } from 'react';

/**
 * Walks all text nodes inside a container and highlights the first occurrence
 * of `sentenceText` by wrapping matching text nodes with a <mark>.
 */
export function useTTSHighlight(contentRef: React.RefObject<HTMLDivElement | null>) {
  const marksRef = useRef<HTMLElement[]>([]);

  const clearHighlights = useCallback(() => {
    marksRef.current.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        // Replace mark with its text content
        const textNode = document.createTextNode(mark.textContent || '');
        parent.replaceChild(textNode, mark);
        parent.normalize(); // merge adjacent text nodes
      }
    });
    marksRef.current = [];
  }, []);

  const highlightSentence = useCallback((sentenceText: string | null) => {
    clearHighlights();

    if (!sentenceText || !contentRef.current) return;

    // Normalize whitespace for matching
    const needle = sentenceText.replace(/\s+/g, ' ').trim();
    if (!needle) return;

    // Collect all text nodes
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    // Build a concatenated string with node boundaries
    let fullText = '';
    const nodeMap: { node: Text; start: number; end: number }[] = [];
    for (const tn of textNodes) {
      const text = tn.textContent || '';
      nodeMap.push({ node: tn, start: fullText.length, end: fullText.length + text.length });
      fullText += text;
    }

    // Find the needle (first few words are enough for a match)
    const normalizedFull = fullText.replace(/\s+/g, ' ');
    
    // Try matching with progressively shorter prefixes
    let matchStart = -1;
    let matchEnd = -1;
    const words = needle.split(' ');
    
    // Try full match first, then shorter
    for (let wordCount = words.length; wordCount >= Math.min(4, words.length); wordCount--) {
      const partial = words.slice(0, wordCount).join(' ');
      const idx = normalizedFull.indexOf(partial);
      if (idx !== -1) {
        matchStart = idx;
        // For full match, use full length; for partial, extend to sentence end
        if (wordCount === words.length) {
          matchEnd = idx + needle.length;
        } else {
          // Find end of sentence from this point
          const sentenceEnd = normalizedFull.indexOf('.', idx + partial.length);
          matchEnd = sentenceEnd !== -1 ? sentenceEnd + 1 : idx + partial.length;
        }
        break;
      }
    }

    if (matchStart === -1) return;

    // Map match range back to text nodes and wrap with <mark>
    for (const entry of nodeMap) {
      const overlapStart = Math.max(matchStart, entry.start);
      const overlapEnd = Math.min(matchEnd, entry.end);

      if (overlapStart >= overlapEnd) continue;

      const localStart = overlapStart - entry.start;
      const localEnd = overlapEnd - entry.start;
      const textContent = entry.node.textContent || '';

      // Split the text node
      const before = textContent.slice(0, localStart);
      const highlighted = textContent.slice(localStart, localEnd);
      const after = textContent.slice(localEnd);

      const parent = entry.node.parentNode;
      if (!parent) continue;

      const mark = document.createElement('mark');
      mark.textContent = highlighted;
      mark.className = 'tts-highlight';
      marksRef.current.push(mark);

      const fragment = document.createDocumentFragment();
      if (before) fragment.appendChild(document.createTextNode(before));
      fragment.appendChild(mark);
      if (after) fragment.appendChild(document.createTextNode(after));

      parent.replaceChild(fragment, entry.node);

      // Scroll the first mark into view
      if (marksRef.current.length === 1) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [contentRef, clearHighlights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearHighlights();
  }, [clearHighlights]);

  return { highlightSentence, clearHighlights };
}
