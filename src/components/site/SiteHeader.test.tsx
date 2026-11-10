import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { SiteHeader, isCurrent } from './SiteHeader';

function renderAt(path: string) {
  const { hook } = memoryLocation({ path });
  return render(
    <Router hook={hook}>
      <SiteHeader />
    </Router>,
  );
}

describe('isCurrent', () => {
  it('treats chapter pages as part of Read, but not glossary or search', () => {
    expect(isCurrent('/read', '/read')).toBe(true);
    expect(isCurrent('/read', '/read/the-day-the-tree-chose-them')).toBe(true);
    expect(isCurrent('/read', '/read/glossary')).toBe(false);
    expect(isCurrent('/read/glossary', '/read/glossary')).toBe(true);
    expect(isCurrent('/characters', '/characters/renee')).toBe(true);
    expect(isCurrent('/dashboard', '/')).toBe(false);
  });
});

describe('SiteHeader', () => {
  it('marks the current page', () => {
    renderAt('/read/glossary');
    expect(screen.getByRole('link', { name: 'Glossary' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Read' })).not.toHaveAttribute('aria-current');
  });

  it('opens the menu as a dialog and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute('aria-current', 'page');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
