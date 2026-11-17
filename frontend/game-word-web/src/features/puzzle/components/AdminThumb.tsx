import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getAdminPuzzleImageBlob, puzzleImageUrl } from '../../../services/api';
import type { PuzzleImage } from '../../../types/api';

// Ảnh đang ẩn không có địa chỉ công khai: tải bằng token quản trị
export default function AdminThumb({ image }: { image: PuzzleImage }) {
  const [src, setSrc] = useState<string | null>(image.active ? puzzleImageUrl(image.id) : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (image.active) {
      setSrc(puzzleImageUrl(image.id));
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    getAdminPuzzleImageBlob(image.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [image.id, image.active]);

  if (failed || !src) {
    return (
      <span className="admin-thumb admin-thumb-empty" aria-hidden="true">
        <ImageOff size={22} />
      </span>
    );
  }
  return <img className="admin-thumb" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
