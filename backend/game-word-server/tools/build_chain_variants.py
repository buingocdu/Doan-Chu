"""Bo sung tu cho tro Noi tu (words.chain_only = true) tu 2 nguon:

1. Bien the chinh ta cua tu da co: vi tri dau thanh kieu cu/moi voi oa/oe/uy (hoà <-> hòa, khoẻ <-> khỏe,
   thuỷ <-> thủy) va i/y sau phu am don h/k/l/m/s/t khi co dau thanh (lý <-> lí, kỹ <-> kĩ).
   Nguoi choi go kieu nao cung duoc, khong bi loai oan vi "tu khong co trong tu dien".
2. Tu 2 tieng trong tu dien tong hop cua underthesea (Ho Ngoc Duc + tudientv + Wiktionary, GPL-3.0)
   ma chua co: https://github.com/undertheseanlp/dictionary (dictionary/words.txt, moi dong 1 JSON {"text": ...}).

Cach dung:
  python -I -X utf8 build_chain_variants.py words.txt Viet74K.txt words-vi-all.csv words-chain-extra.csv out.csv
Loc nhu extract_chain_words.py: dung 2 tieng, chu thuong, chi chu cai tieng Viet (bo f/j/w/z), moi tieng co trong
Viet74K, khong co tu tuc. Dau ra CSV: value,part1,part2,phrase,definition (definition de trong).
"""
import csv
import json
import re
import sys
import unicodedata

dict_path, v74_path, *current_paths, out_path = sys.argv[1:]

VI = re.compile(r'^[aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ]+$')
BLOCK = {'đụ', 'địt', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đái', 'ỉa', 'dâm', 'chịch', 'đít'}
TONES = {'\u0300', '\u0301', '\u0303', '\u0309', '\u0323'}
IY_CONSONANTS = set('hklmst')


def nfc(s):
    return unicodedata.normalize('NFC', s.strip())


def base(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D').upper()


def split_tone(syl):
    d = unicodedata.normalize('NFD', syl)
    return nfc(''.join(c for c in d if c not in TONES)), ''.join(c for c in d if c in TONES)


def with_tone(ch, tone):
    return unicodedata.normalize('NFC', ch + tone)


def spelling_variants(syl):
    """Cac cach viet khac cua mot tieng (khong gom chinh no)."""
    out = []
    bare, tone = split_tone(syl)
    if tone:
        for pair in ('oa', 'oe', 'uy'):
            if bare.endswith(pair) and not bare.endswith('qu' + pair[1]):
                stem = bare[:-2]
                out += [stem + with_tone(pair[0], tone) + pair[1], stem + pair[0] + with_tone(pair[1], tone)]
        # tinh vi, ti vi: khong co dau thanh thi i/y khong thay cho nhau
        if len(bare) == 2 and bare[0] in IY_CONSONANTS and bare[1] in 'iy':
            out.append(bare[0] + with_tone('y' if bare[1] == 'i' else 'i', tone))
    return [v for v in dict.fromkeys(out) if v != syl]


def valid(words, syllables=None):
    """syllables = None: bien the cua tu da co, khong doi chieu Viet74K (Viet74K chi dung mot kieu dau: hoá, khoẻ)."""
    return len(words) == 2 and all(VI.match(w) and w not in BLOCK and (syllables is None or w in syllables)
                                   for w in words)


syllables = set()
with open(v74_path, encoding='utf-8') as f:
    for line in f:
        syllables.update(nfc(line).lower().split())

have = set()
for path in current_paths:
    with open(path, encoding='utf-8') as f:
        have.update(nfc(r['phrase']).lower() for r in csv.DictReader(f))

found = {}
for phrase in sorted(have):
    a, b = phrase.split(' ')
    for va in [a] + spelling_variants(a):
        for vb in [b] + spelling_variants(b):
            v = f'{va} {vb}'
            if v not in have and valid([va, vb]):
                found.setdefault(v, 'variant')

with open(dict_path, encoding='utf-8') as f:
    for line in f:
        text = nfc(json.loads(line)['text'])
        if text == text.lower() and text not in have and valid(text.split(' '), syllables):
            found.setdefault(text, 'underthesea')

with open(out_path, 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, lineterminator='\n')
    w.writerow(['value', 'part1', 'part2', 'phrase', 'definition'])
    for phrase in sorted(found):
        p1, p2 = phrase.split(' ')
        w.writerow([base(p1) + base(p2), base(p1), base(p2), phrase, ''])

print(f"variant: {sum(v == 'variant' for v in found.values())}, "
      f"underthesea: {sum(v == 'underthesea' for v in found.values())}, total: {len(found)}")
