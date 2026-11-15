import { memo, type PointerEvent } from 'react';

interface JigsawPieceProps {
  index: number;
  row: number;
  col: number;
  /** Đường viền SVG của mảnh (tọa độ cục bộ, đã có lề ngàm) */
  path: string;
  imageUrl: string;
  /** Kích thước cả ảnh hoàn chỉnh trên khung (logic) */
  boardW: number;
  boardH: number;
  cellW: number;
  cellH: number;
  pad: number;
  /** Góc trên-trái của ô (không tính lề ngàm) */
  x: number;
  y: number;
  z: number;
  placed: boolean;
  dragging: boolean;
  onPointerDown: (index: number, event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
}

// Mỗi mảnh là một SVG cắt ảnh theo đường viền: ảnh được dịch sao cho đúng phần của ô (row, col)
function JigsawPiece(props: JigsawPieceProps) {
  const { index, row, col, path, imageUrl, boardW, boardH, cellW, cellH, pad, x, y, z, placed, dragging } = props;
  const clipId = `jp-${index}-${props.boardW | 0}`;
  return (
    <div
      className={`jigsaw-piece${placed ? ' is-placed' : ''}${dragging ? ' is-dragging' : ''}`}
      style={{ left: x - pad, top: y - pad, width: cellW + pad * 2, height: cellH + pad * 2, zIndex: z }}
      onPointerDown={placed ? undefined : (e) => props.onPointerDown(index, e)}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerUp}
      role="img"
      aria-label={`Mảnh hàng ${row + 1}, cột ${col + 1}${placed ? ', đã đặt đúng chỗ' : ''}`}
    >
      <svg width={cellW + pad * 2} height={cellH + pad * 2} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={imageUrl}
            x={pad - col * cellW}
            y={pad - row * cellH}
            width={boardW}
            height={boardH}
            preserveAspectRatio="none"
          />
        </g>
        <path d={path} className="jigsaw-outline" />
      </svg>
    </div>
  );
}

export default memo(JigsawPiece);
