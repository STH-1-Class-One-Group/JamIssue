import { useEffect, useRef, useState } from 'react';
import { UiReviewImageFrameConfig } from '../../config/uiTokenConfig';

interface ReviewImageFrameProps {
  src: string;
  thumbnailSrc?: string | null;
  alt: string;
}

export function ReviewImageFrame({ src, thumbnailSrc = null, alt }: ReviewImageFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isTall, setIsTall] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [resolvedSrc, setResolvedSrc] = useState(thumbnailSrc || src);

  useEffect(() => {
    setResolvedSrc(thumbnailSrc || src);
    setIsTall(false);
  }, [src, thumbnailSrc]);

  useEffect(() => {
    const updateFrameSize = () => {
      if (frameRef.current) {
        setFrameSize({
          width: frameRef.current.clientWidth || 0,
          height: frameRef.current.clientHeight || 0,
        });
      }
    };

    updateFrameSize();
    window.addEventListener('resize', updateFrameSize);
    return () => {
      window.removeEventListener('resize', updateFrameSize);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className={isTall ? 'review-card__image-frame review-card__image-frame--rotated' : 'review-card__image-frame'}
      style={UiReviewImageFrameConfig.frameStyle}
    >
      {isTall ? (
        <div
          style={{
            ...UiReviewImageFrameConfig.rotatedWrapperStyle,
            width: `${Math.max(frameSize.height, UiReviewImageFrameConfig.minimumRotatedDimensionPx)}px`,
            height: `${Math.max(frameSize.width, UiReviewImageFrameConfig.minimumRotatedDimensionPx)}px`,
          }}
        >
          <img
            className="review-card__image"
            src={resolvedSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (thumbnailSrc && resolvedSrc !== src) {
                setResolvedSrc(src);
              }
            }}
            onLoad={(event) => {
              const target = event.currentTarget;
              setIsTall(target.naturalHeight > target.naturalWidth * UiReviewImageFrameConfig.tallImageAspectRatio);
              if (frameRef.current) {
                setFrameSize({
                  width: frameRef.current.clientWidth || 0,
                  height: frameRef.current.clientHeight || 0,
                });
              }
            }}
            style={UiReviewImageFrameConfig.imageStyle}
          />
        </div>
      ) : (
        <img
          className="review-card__image"
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (thumbnailSrc && resolvedSrc !== src) {
              setResolvedSrc(src);
            }
          }}
          onLoad={(event) => {
            const target = event.currentTarget;
            setIsTall(target.naturalHeight > target.naturalWidth * UiReviewImageFrameConfig.tallImageAspectRatio);
            if (frameRef.current) {
              setFrameSize({
                width: frameRef.current.clientWidth || 0,
                height: frameRef.current.clientHeight || 0,
              });
            }
          }}
          style={UiReviewImageFrameConfig.imageStyle}
        />
      )}
    </div>
  );
}
