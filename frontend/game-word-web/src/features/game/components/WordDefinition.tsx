import { BookText, ExternalLink } from 'lucide-react';

interface WordDefinitionProps {
  /** Đáp án in hoa, ví dụ "MÁY TÍNH" */
  answer: string;
  /** Các nghĩa cách nhau bởi xuống dòng; null nếu từ điển chưa có */
  definition: string | null;
}

// Giải nghĩa lấy từ Wiktionary tiếng Việt (CC BY-SA 4.0): bắt buộc ghi nguồn kèm link
export default function WordDefinition({ answer, definition }: WordDefinitionProps) {
  const word = answer.toLocaleLowerCase('vi');
  const url = `https://vi.wiktionary.org/wiki/${encodeURIComponent(word.replace(/ /g, '_'))}`;
  const senses = (definition ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="definition">
      <h3>
        <BookText size={18} aria-hidden="true" /> Giải nghĩa: <span className="definition-word">{word}</span>
      </h3>
      {senses.length > 0 ? (
        <>
          <ol className="definition-list">
            {senses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="definition-source">
            Nguồn:{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              Wiktionary tiếng Việt <ExternalLink size={12} aria-hidden="true" />
            </a>{' '}
            (CC BY-SA 4.0)
          </p>
        </>
      ) : (
        <p className="muted">
          Chưa có giải nghĩa cho từ này.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Tra cứu trên Wiktionary <ExternalLink size={12} aria-hidden="true" />
          </a>
        </p>
      )}
    </div>
  );
}
