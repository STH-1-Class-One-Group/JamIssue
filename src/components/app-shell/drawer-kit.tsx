import type { ReactNode } from 'react';

export function DrawerStack({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`drawer-kit-stack ${className}`.trim()}>{children}</div>;
}

export function DrawerSection({
  children,
  className = '',
  eyebrow,
  title,
  description,
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`drawer-kit-section ${className}`.trim()} {...rest}>
      {(eyebrow || title || description) ? (
        <div className="drawer-kit-section__heading">
          {eyebrow ? <p className="drawer-kit-section__eyebrow">{eyebrow}</p> : null}
          {title ? <h3>{title}</h3> : null}
          {description ? <p className="drawer-kit-section__description">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DrawerCard({
  as: Component = 'div',
  children,
  className = '',
}: {
  as?: 'article' | 'div' | 'p' | 'section';
  children: ReactNode;
  className?: string;
}) {
  return <Component className={`drawer-kit-card ${className}`.trim()}>{children}</Component>;
}

export function DrawerActionRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`drawer-kit-action-row ${className}`.trim()}>{children}</div>;
}

export function DrawerFormGroup({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  className?: string;
  label: ReactNode;
}) {
  return (
    <label className={`drawer-kit-form-group ${className}`.trim()}>
      <span className="drawer-kit-section__eyebrow">{label}</span>
      {children}
    </label>
  );
}

export function DrawerSegmentControl({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="drawer-kit-segment-control" role="menu" aria-label={label}>
      {children}
    </div>
  );
}

export function DrawerListItem({
  action,
  body,
  className = '',
  meta,
  onOpen,
  tag,
  title,
}: {
  action?: ReactNode;
  body: ReactNode;
  className?: string;
  meta?: ReactNode;
  onOpen?: () => void;
  tag?: ReactNode;
  title: ReactNode;
}) {
  const top = (
    <div className="drawer-kit-list-item__top">
      {tag ? <span className="drawer-kit-list-item__tag">{tag}</span> : null}
      {meta ? <span className="drawer-kit-list-item__meta">{meta}</span> : null}
      {action ? <span className="drawer-kit-list-item__action">{action}</span> : null}
    </div>
  );
  const bodyContent = (
    <>
      <div className="drawer-kit-list-item__body">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </>
  );

  if (!onOpen) {
    return (
      <DrawerCard as="article" className={`drawer-kit-list-item ${className}`.trim()}>
        {top}
        {bodyContent}
      </DrawerCard>
    );
  }

  return (
    <DrawerCard as="article" className={`drawer-kit-list-item ${className}`.trim()}>
      {top}
      <button type="button" className="drawer-kit-list-item__open" onClick={onOpen}>
        {bodyContent}
      </button>
    </DrawerCard>
  );
}
