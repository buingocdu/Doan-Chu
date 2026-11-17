import { ImageOff } from 'lucide-react';
import { useAdminImageSrc } from '../hooks/useAdminImageSrc';
import type { PuzzleImage } from '../../../types/api';

export default function AdminThumb({ image }: { image: PuzzleImage }) {
  const { src, failed, markFailed } = useAdminImageSrc(image);

  if (failed || !src) {
    return (
      <span className="admin-thumb admin-thumb-empty" aria-hidden="true">
        <ImageOff size={22} />
      </span>
    );
  }
  return <img className="admin-thumb" src={src} alt="" loading="lazy" onError={markFailed} />;
}
