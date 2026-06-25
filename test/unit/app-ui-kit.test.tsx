import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionButton,
  AppSurface,
  ContentCard,
  EmptyState,
  FilterChip,
  FormField,
  InlineMeta,
  ListItem,
  MediaFrame,
  MetricTile,
  SectionHeader,
} from '../../src/components/ui-kit';

describe('app UI kit primitives', () => {
  it('renders section rhythm primitives without owning domain behavior', () => {
    render(
      <AppSurface aria-label="surface" variant="section">
        <SectionHeader
          actions={<ActionButton variant="secondary">Act</ActionButton>}
          description="Description"
          eyebrow="Eyebrow"
          title="Title"
        />
        <ContentCard>
          <ListItem
            actions={<ActionButton size="sm">Open</ActionButton>}
            badges={<FilterChip selected>Selected</FilterChip>}
            description="Body"
            media={<MediaFrame alt="Sample" src="/sample.png" />}
            meta={<InlineMeta items={['A', 'B']} />}
            title="Item"
          />
        </ContentCard>
      </AppSurface>,
    );

    const surface = screen.getByLabelText('surface');
    expect(surface).toHaveClass('ui-app-surface--section');
    expect(screen.getByText('Eyebrow')).toHaveClass('ui-section-header__eyebrow');
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sample' })).toHaveClass('ui-media-frame__image');
    expect(screen.getByRole('button', { name: 'Selected' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('ui-action-button--sm');
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('forwards button interactions and disabled state through ActionButton', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <>
        <ActionButton onClick={onClick} variant="primary">
          Save
        </ActionButton>
        <ActionButton disabled variant="danger">
          Delete
        </ActionButton>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('renders empty, metric, form, and media fallback states', () => {
    render(
      <>
        <EmptyState actions={<ActionButton>Retry</ActionButton>} description="No rows" title="Empty" />
        <MetricTile detail="Detail" label="Label" value="42" />
        <FormField helper="Helper" htmlFor="field" label="Name">
          <input id="field" />
        </FormField>
        <MediaFrame fallback={<span>No image</span>} ratio="square" />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Empty' })).toBeInTheDocument();
    expect(screen.getByText('42')).toHaveClass('ui-metric-tile__value');
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('allows section headers to preserve nested heading hierarchy', () => {
    render(<SectionHeader headingLevel={3} title="Nested section" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Nested section' })).toBeInTheDocument();
  });

  it('supports semantic card variants and custom element rendering', () => {
    render(
      <ContentCard aria-label="card" as="section" interactive variant="outlined">
        <AppSurface as="div" variant="subtle">
          nested content
        </AppSurface>
      </ContentCard>,
    );

    const card = screen.getByLabelText('card');
    expect(card.tagName).toBe('SECTION');
    expect(card).toHaveClass('ui-content-card--outlined');
    expect(card).toHaveClass('ui-content-card--interactive');
    expect(within(card).getByText('nested content')).toHaveClass('ui-app-surface--subtle');
  });
});
