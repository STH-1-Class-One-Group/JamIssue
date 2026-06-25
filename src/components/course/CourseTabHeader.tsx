import { SectionHeader } from '../ui-kit';

export function CourseTabHeader() {
  return (
    <SectionHeader
      className="panel-header"
      eyebrow="COURSE"
      title="코스"
      description={
        <>
          사용자들이 직접 발행한 공개 코스를 둘러보고,
          <br />
          마음에 드는 동선을 다시 따라가 보세요.
        </>
      }
    />
  );
}
