import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryBody } from './StoryBody';
import { paintHighlights, textOffset, type Highlight } from './highlights';

const HTML =
  '<p>Renee opened a <span data-popover="Budget">Budget</span> book.</p>' +
  '<ul><li>Save first</li><li>Spend with a plan</li></ul>' +
  '<p>Alex asked about <span data-popover="Interest">Interest</span>.</p>';

const hl = (start: number, end: number, id = 'h1'): Highlight => ({
  id,
  chapterId: 'ch-x',
  startOffset: start,
  endOffset: end,
  text: '',
  color: 'gold',
  createdAt: 0,
});

describe('StoryBody', () => {
  it('keeps lists intact and turns money words into buttons', () => {
    const { container } = render(<StoryBody html={HTML} highlights={[]} />);
    const list = container.querySelector('ul')!;
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Interest' })).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('opens a definition from the glossary', async () => {
    render(<StoryBody html={HTML} highlights={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Budget' }));
    expect(await screen.findByText('All money words')).toBeInTheDocument();
  });

  it('paints a saved highlight without changing the text', () => {
    const { container } = render(<StoryBody html={HTML} highlights={[hl(0, 5)]} />);
    const mark = container.querySelector('mark[data-highlight-id="h1"]');
    expect(mark?.textContent).toBe('Renee');
    expect(container.querySelector('.reader-prose')!.textContent).toContain('Renee opened a Budget book.');
  });
});

describe('highlights', () => {
  it('spans across paragraphs and list items, and clears cleanly', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>One two</p><ul><li>three four</li></ul>';
    paintHighlights(root, [hl(4, 12)]);
    const marks = root.querySelectorAll('mark');
    expect(Array.from(marks).map((m) => m.textContent)).toEqual(['two', 'three']);
    paintHighlights(root, []);
    expect(root.querySelectorAll('mark')).toHaveLength(0);
    expect(root.textContent).toBe('One twothree four');
  });

  it('measures offsets in the same text the painter uses', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Alpha <b>beta</b> gamma</p>';
    const beta = root.querySelector('b')!.firstChild!;
    expect(textOffset(root, beta, 0)).toBe(6);
  });
});
