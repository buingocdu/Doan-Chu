import { useState } from 'react';
import SnapSlider from './SnapSlider';
import type { PuzzleGame } from '../../../types/api';

interface GameSnapEditorProps {
  game: PuzzleGame;
  onSave: (percent: number) => Promise<void>;
}

// Chỉnh độ tự động khớp của game đã tạo (thu gọn để danh sách không rối)
export default function GameSnapEditor({ game, onSave }: GameSnapEditorProps) {
  const [value, setValue] = useState(game.snapPercent);
  const [saving, setSaving] = useState(false);
  const changed = value !== game.snapPercent;

  const save = async () => {
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="admin-snap">
      <summary>Độ tự động khớp: {game.snapPercent}</summary>
      <SnapSlider id={`snap-${game.id}`} value={value} onChange={setValue} disabled={saving} />
      <div className="puzzle-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={!changed || saving} onClick={() => void save()}>
          {saving ? 'Đang lưu…' : 'Lưu độ khớp'}
        </button>
        {changed && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => setValue(game.snapPercent)}>
            Hoàn tác
          </button>
        )}
      </div>
    </details>
  );
}
