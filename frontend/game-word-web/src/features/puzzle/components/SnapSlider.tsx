import { DEFAULT_SNAP_PERCENT, MAX_SNAP_PERCENT, MIN_SNAP_PERCENT } from '../utils/jigsaw';

interface SnapSliderProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Thanh chỉnh độ tự động khớp: nhỏ = chặt (phải đặt rất sát), lớn = dễ ăn. Điện thoại được cộng thêm 20% tự động.
export default function SnapSlider({ id, value, onChange, disabled }: SnapSliderProps) {
  return (
    <div className="snap-slider">
      <div className="snap-slider-head">
        <label htmlFor={id}>Độ tự động khớp</label>
        <output htmlFor={id}>
          {value}
          {value === DEFAULT_SNAP_PERCENT ? ' (mặc định)' : ''}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={MIN_SNAP_PERCENT}
        max={MAX_SNAP_PERCENT}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="snap-slider-scale" aria-hidden="true">
        <span>Chặt</span>
        <span>Dễ</span>
      </div>
      <p className="muted snap-slider-hint">
        Mảnh chỉ tự nhảy vào chỗ khi thả đủ sát. Trên điện thoại hệ số này tự tăng thêm 20% vì màn hình nhỏ khó chơi hơn.
      </p>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || value === DEFAULT_SNAP_PERCENT}
        onClick={() => onChange(DEFAULT_SNAP_PERCENT)}
      >
        Về mặc định ({DEFAULT_SNAP_PERCENT})
      </button>
    </div>
  );
}
