"""Chon 2000 tu 2 tieng pho bien tu Viet22K.
Xep hang: trung binh nhan tan suat 2 tieng (vi_50k), x3 neu co trong Viet11K (danh sach thong dung hon),
x0.1 neu 1 tieng la hu tu/dai tu; bo tu ma ca 2 tieng deu la hu tu/dai tu."""
import csv, math, re, sys, unicodedata

dict_path, common_path, freq_path, out_path = sys.argv[1:5]
N = 2000

def base(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D').upper()

VI = re.compile(r'^[a-zàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ]+$')
STOP = set('''không có là và của những các một được cho này đó thì mà với đã sẽ đang như khi sao gì ai đâu nào rồi lại ra vào
đi đến tới lên xuống qua nữa cũng vẫn còn chỉ rất quá lắm thế vậy nếu nhưng hay hoặc vì bởi nên để từ trong ngoài trên dưới
sau trước bị phải hãy đừng chưa chẳng đây kia ấy nhé à ạ ơi ừ mình tôi tao mày nó họ chúng ta bạn cậu hắn em anh chị ông bà
cô chú con thằng cái chiếc lúc nhiều ít mọi mỗi cả hết luôn đều thôi điều việc'''.split())
BLOCK = {'đụ', 'địt', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đái', 'ỉa', 'dâm', 'chịch', 'đít'}

freq = {}
with open(freq_path, encoding='utf-8') as f:
    for line in f:
        parts = line.split()
        if len(parts) == 2:
            freq[unicodedata.normalize('NFC', parts[0])] = int(parts[1])

common = {unicodedata.normalize('NFC', l.strip()) for l in open(common_path, encoding='utf-8')}

best = {}
with open(dict_path, encoding='utf-8') as f:
    for line in f:
        w = unicodedata.normalize('NFC', line.strip())
        if w != w.lower():
            continue
        syl = w.split(' ')
        if len(syl) != 2 or syl[0] == syl[1]:
            continue
        if not all(VI.match(s) for s in syl) or any(c in w for c in 'fjwz') or any(s in BLOCK for s in syl):
            continue
        if not all(s in freq for s in syl):
            continue
        p1, p2 = base(syl[0]), base(syl[1])
        if not re.fullmatch(r'[A-Z]+', p1 + p2) or not 4 <= len(p1 + p2) <= 10:
            continue
        stops = sum(x in STOP for x in syl)
        if stops == 2:
            continue
        score = math.sqrt(freq[syl[0]] * freq[syl[1]])
        score *= 3 if w in common else 1
        score *= 0.1 if stops == 1 else 1
        value = p1 + p2
        if value not in best or score > best[value][0]:
            best[value] = (score, p1, p2, w)

ranked = sorted(best.items(), key=lambda kv: -kv[1][0])[:N]
with open(out_path, 'w', encoding='utf-8', newline='') as f:
    out = csv.writer(f, lineterminator='\n')
    out.writerow(['value', 'part1', 'part2', 'phrase', 'level', 'active'])
    for i, (value, (_, p1, p2, w)) in enumerate(ranked):
        out.writerow([value, p1, p2, w, 1 + i * 3 // len(ranked), 'true'])
print('candidates', len(best), 'written', len(ranked))
