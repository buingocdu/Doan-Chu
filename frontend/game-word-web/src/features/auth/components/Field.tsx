import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

// Ô mật khẩu có nút con mắt để hiện/ẩn nội dung đang gõ
export default function Field({ id, label, type, autoComplete, value, error, onChange }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={isPassword ? 'field-password' : undefined}>
        <input
          id={id}
          name={id}
          type={isPassword && visible ? 'text' : type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            aria-controls={id}
          >
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
