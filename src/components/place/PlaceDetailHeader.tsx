import { SectionHeader } from '../ui-kit';

interface PlaceDetailHeaderProps {
  name: string;
  summary: string;
}

export function PlaceDetailHeader({ name, summary }: PlaceDetailHeaderProps) {
  return (
    <SectionHeader className="place-drawer__header" eyebrow="PLACE" title={name} description={summary} />
  );
}
