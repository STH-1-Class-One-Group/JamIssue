interface PlaceDetailHeaderProps {
  name: string;
  summary: string;
}

export function PlaceDetailHeader({ name, summary }: PlaceDetailHeaderProps) {
  return (
    <div className="place-drawer__header">
      <div>
        <p className="eyebrow">PLACE</p>
        <h2>{name}</h2>
        <p className="place-drawer__summary">{summary}</p>
      </div>
    </div>
  );
}
