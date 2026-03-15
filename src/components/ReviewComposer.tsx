import { FormEvent, useState } from 'react';
import type { ReviewMood } from '../types';

interface ReviewComposerProps {
  placeName: string;
  loggedIn: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: { body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  onRequestLogin: () => void;
}

const moodItems: ReviewMood[] = ['설렘', '친구랑', '혼자서', '야경픽'];

export function ReviewComposer({ placeName, loggedIn, submitting, errorMessage, onSubmit, onRequestLogin }: ReviewComposerProps) {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<ReviewMood>('설렘');
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loggedIn) {
      onRequestLogin();
      return;
    }

    await onSubmit({ body, mood, file });
    setBody('');
    setMood('설렘');
    setFile(null);
  }

  return (
    <form className="review-composer" onSubmit={handleSubmit}>
      <div className="section-title-row">
        <div>
          <p className="eyebrow">PLACE FEED</p>
          <h3>{placeName} 후기 남기기</h3>
        </div>
        {!loggedIn && (
          <button type="button" className="text-button" onClick={onRequestLogin}>
            로그인 필요
          </button>
        )}
      </div>
      <div className="chip-row compact-gap">
        {moodItems.map((item) => (
          <button key={item} type="button" className={item === mood ? 'chip is-active' : 'chip'} onClick={() => setMood(item)}>
            {item}
          </button>
        ))}
      </div>
      <textarea
        className="review-composer__textarea"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="길게 쓰지 않아도 돼요. 현장에서 느낀 한 줄이면 충분해요."
        rows={4}
      />
      <label className="file-picker">
        <span>{file ? file.name : '사진 한 장 추가하기'}</span>
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      {errorMessage && <p className="inline-error">{errorMessage}</p>}
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? '저장 중...' : '후기 올리기'}
      </button>
    </form>
  );
}