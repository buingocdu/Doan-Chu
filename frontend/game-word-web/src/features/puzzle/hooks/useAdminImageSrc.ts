import { useEffect, useState } from 'react';
import { getAdminPuzzleImageBlob, puzzleImageUrl } from '../../../services/api';
import type { PuzzleImage } from '../../../types/api';

/**
 * Địa chỉ để hiển thị ảnh trong khu quản trị. Ảnh đang hiện dùng địa chỉ công khai (kèm ?v= đổi khi ảnh được
 * xoay/cắt nên trình duyệt không dùng bản cũ); ảnh đang ẩn không có địa chỉ công khai nên tải bằng token quản trị.
 */
export function useAdminImageSrc(image: PuzzleImage): { src: string | null; failed: boolean; markFailed: () => void } {
  const publicUrl = puzzleImageUrl(image.id, image.version);
  const [src, setSrc] = useState<string | null>(image.active ? publicUrl : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (image.active) {
      setSrc(publicUrl);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setSrc(null);
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
  }, [image.id, image.active, image.version, publicUrl]);

  return { src, failed, markFailed: () => setFailed(true) };
}
