"""Sinh danh sach TAT CA tu 2 tieng hop le tu Viet74K, gan cap do theo do pho bien.

Cach dung: python -I build_dictionary.py Viet74K.txt Viet22K.txt Viet11K.txt vi_50k.txt words-vi-all.csv
- Hop le: dung 2 tieng, chu thuong (bo ten rieng), chi chu cai tieng Viet (bo f/j/w/z), toi da 12 chu cai, khong chua tu tuc.
- Xep hang: trung binh nhan tan suat 2 tieng (vi_50k; tieng khong co trong danh sach = 1), x3 neu co trong Viet11K,
  x0.1 neu 1 tieng la hu tu/dai tu, x0.01 neu ca 2 tieng deu la hu tu/dai tu.
- Cap do: 2000 tu dau bang xep hang -> level 1/2/3 (chia deu); con lai co trong Viet22K -> 4; chi co trong Viet74K -> 5.
- Khoa: phrase (tu co dau); value/part1/part2 la dang khong dau.
"""
import csv, math, re, sys, unicodedata

all_path, mid_path, common_path, freq_path, out_path = sys.argv[1:6]
TOP = 2000
MAX_LETTERS = 12

def nfc_lines(path):
    with open(path, encoding='utf-8') as f:
        return [unicodedata.normalize('NFC', l.strip()) for l in f]

def base(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D').upper()

VI = re.compile(r'^[a-zàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ]+$')
BLOCK = {'đụ', 'địt', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đái', 'ỉa', 'dâm', 'chịch', 'đít'}
STOP = set('''không có là và của những các một được cho này đó thì mà với đã sẽ đang như khi sao gì ai đâu nào rồi lại ra vào
đi đến tới lên xuống qua nữa cũng vẫn còn chỉ rất quá lắm thế vậy nếu nhưng hay hoặc vì bởi nên để từ trong ngoài trên dưới
sau trước bị phải hãy đừng chưa chẳng đây kia ấy nhé à ạ ơi ừ mình tôi tao mày nó họ chúng ta bạn cậu hắn em anh chị ông bà
cô chú con thằng cái chiếc lúc nhiều ít mọi mỗi cả hết luôn đều thôi điều việc'''.split())

freq = {}
for line in nfc_lines(freq_path):
    parts = line.split()
    if len(parts) == 2:
        freq[parts[0]] = int(parts[1])
mid = set(nfc_lines(mid_path))
common = set(nfc_lines(common_path))

rows = {}
for w in nfc_lines(all_path):
    syl = w.split(' ')
    if len(syl) != 2 or w != w.lower() or not all(VI.match(s) for s in syl):
        continue
    if any(c in w for c in 'fjwz') or any(s in BLOCK for s in syl):
        continue
    p1, p2 = base(syl[0]), base(syl[1])
    if not re.fullmatch(r'[A-Z]+', p1 + p2) or len(p1 + p2) > MAX_LETTERS:
        continue
    stops = sum(s in STOP for s in syl)
    score = math.sqrt(freq.get(syl[0], 1) * freq.get(syl[1], 1))
    score *= 3 if w in common else 1
    score *= (1, 0.1, 0.01)[stops]
    rows[w] = (score, p1, p2)

ranked = sorted(rows.items(), key=lambda kv: (-kv[1][0], kv[0]))
with open(out_path, 'w', encoding='utf-8', newline='') as f:
    out = csv.writer(f, lineterminator='\n')
    out.writerow(['value', 'part1', 'part2', 'phrase', 'level'])
    for i, (w, (_, p1, p2)) in enumerate(ranked):
        level = 1 + i * 3 // TOP if i < TOP else (4 if w in mid else 5)
        out.writerow([p1 + p2, p1, p2, w, level])
print('written', len(ranked))
