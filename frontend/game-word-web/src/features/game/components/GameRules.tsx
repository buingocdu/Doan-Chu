import { BookOpen } from 'lucide-react';
import type { CellColor } from '../../../types/api';
import { COLOR_LABELS } from '../utils/gameState';

const ORDER: CellColor[] = ['GREEN', 'BLUE', 'YELLOW', 'BLACK'];
const NAMES: Record<CellColor, string> = { GREEN: 'Xanh lá', YELLOW: 'Vàng', BLUE: 'Xanh dương', BLACK: 'Xám' };

interface GameRulesProps {
  maxAttempts: number;
}

export default function GameRules({ maxAttempts }: GameRulesProps) {
  return (
    <aside className="rules card" aria-labelledby="rules-title">
      <h2 id="rules-title">
        <BookOpen size={20} aria-hidden="true" /> Luật chơi
      </h2>
      <ol className="rules-list">
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
