import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { CellColor } from '../../../types/api';
import { COLOR_LABELS } from '../utils/gameState';

const ORDER: CellColor[] = ['GREEN', 'BLUE', 'YELLOW', 'BLACK'];
const NAMES: Record<CellColor, string> = { GREEN: 'Xanh lá', YELLOW: 'Vàng', BLUE: 'Xanh dương', BLACK: 'Xám' };
const COLLAPSED_KEY = 'gw.rulesCollapsed';

// Trình duyệt chặn localStorage thì luôn mở luật chơi, không ghi nhớ
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // bỏ qua: chỉ mất ghi nhớ lựa chọn
  }
}

interface GameRulesProps {
  maxAttempts: number;
}

export default function GameRules({ maxAttempts }: GameRulesProps) {
  // Chỉ có tác dụng trên màn hình hẹp (CSS ẩn nút và luôn hiện luật chơi trên desktop)
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = () => {
    setCollapsed((c) => {
      saveCollapsed(!c);
      return !c;
    });
  };

  return (
    <aside className={`rules card${collapsed ? ' is-collapsed' : ''}`} aria-labelledby="rules-title">
      <div className="rules-header">
        <h2 id="rules-title">
          <BookOpen size={20} aria-hidden="true" /> Luật chơi
        </h2>
        <button
          type="button"
          className="btn btn-ghost rules-toggle"
          aria-expanded={!collapsed}
          aria-controls="rules-body"
          onClick={toggle}
        >
          {collapsed ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}
          {collapsed ? 'Mở rộng' : 'Thu gọn'}
        </button>
      </div>
      <ol id="rules-body" className="rules-list">
        <li>
          Đoán một <strong>từ ghép 2 tiếng có dấu</strong>. Mỗi ô là một chữ cái, chữ có dấu là một chữ riêng (Ô, À, Ư…);
          khoảng trống giữa các ô ngăn cách hai tiếng.
          <div className="rules-example" aria-label="Ví dụ NGÔI NHÀ gồm 4 ô rồi 3 ô: N G Ô I, N H À">
            <span className="tile-group">
              {'NGÔI'.split('').map((c, i) => (
                <span key={i} className="tile tile-mini tile-outline">{c}</span>
              ))}
            </span>
            <span className="tile-group">
              {'NHÀ'.split('').map((c, i) => (
                <span key={i} className="tile tile-mini tile-outline">{c}</span>
              ))}
            </span>
            <span className="muted">= NGÔI NHÀ</span>
          </div>
        </li>
        <li>
          Bạn có <strong>{maxAttempts} lượt</strong>. Gõ vào ô nhập liệu bằng bộ gõ tiếng Việt, <strong>nhớ gõ đúng dấu</strong>,
          rồi nhấn <kbd>Enter</kbd>.
        </li>
        <li>
          Sau mỗi lượt, các ô đổi màu:
          <ul className="rules-colors">
            {ORDER.map((color) => (
              <li key={color}>
                <span className={`tile tile-mini tile-${color.toLowerCase()}`} aria-hidden="true">A</span>
                <span>
                  <strong>{NAMES[color]}</strong>: {COLOR_LABELS[color]}
                </span>
              </li>
            ))}
          </ul>
          <p className="rules-note muted">
            <strong>A, Ă, Â</strong> · <strong>E, Ê</strong> · <strong>O, Ô, Ơ</strong> · <strong>U, Ư</strong> ·{' '}
            <strong>D, Đ</strong> là các chữ cái khác nhau. Xanh dương chỉ khi đúng chữ cái và chỉ sai dấu thanh (sắc,
            huyền, hỏi, ngã, nặng): đoán <strong>Ố</strong> khi đáp án là <strong>Ô</strong> được xanh dương, còn đoán{' '}
            <strong>O</strong> hay <strong>Ơ</strong> thì không.
          </p>
        </li>
        <li>
          Thắng khi tất cả các ô đều xanh lá (đúng cả dấu). Điểm tính theo lượt đoán đúng: lần 1 được{' '}
          <strong>100 điểm</strong>, lần 2 được 90, mỗi lượt sau giảm 10 điểm (lần 10 còn 10 điểm). Đăng nhập để được cộng
          điểm và lên bảng xếp hạng.
        </li>
      </ol>
    </aside>
  );
}
