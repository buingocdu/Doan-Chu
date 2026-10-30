"""Bo sung tu 2 tieng cho tro Noi tu tu Wiktionary tieng Viet (cac tu chua co trong words-vi-all.csv).

Cach dung:
  python -I -X utf8 extract_chain_words.py viwiktionary-latest-pages-articles.xml.bz2 Viet74K.txt \
      words-vi-all.csv words-chain-extra.csv

Chi nhan mot tu khi:
- Tieu de dung 2 tieng, chu thuong (bo ten rieng), khong co f/j/w/z (tu muon), moi tieng la am tiet tieng Viet
  co that (co mat trong Viet74K) -> loai tu tieng Tay, Muong, Nung... ma vi.wiktionary cung co.
- Trang co tieu de ngon ngu TIENG VIET ro rang ({{-vie-}}, =={{langname|vi}}==, ==Tieng Viet==) va it nhat 1 dinh nghia.
  (Khac extract_definitions.py: trang khong co tieu de ngon ngu bi bo qua vi khong chac la tieng Viet.)
- Khong thuoc danh sach tu tuc / khong co nhan "thô tục", "tục tĩu".
Dau ra CSV: value,part1,part2,phrase,definition. Tu bo sung chi dung cho Noi tu (words.chain_only = true),
khong dung lam dap an Doan chu vi nhieu tu it gap.
Nguon: Wiktionary tieng Viet, giay phep CC BY-SA 4.0.
"""
import bz2
import csv
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET

dump_path, v74_path, current_path, out_path = sys.argv[1:5]
MAX_SENSES = 3
MAX_LEN = 1000

VI = re.compile(r'^[aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ]+$')
BLOCK = {'đụ', 'địt', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đái', 'ỉa', 'dâm', 'chịch', 'đít'}
VULGAR_LABEL = re.compile(r'thô tục|tục tĩu|chửi tục', re.I)
LANG_HEADER = re.compile(r'^(\{\{-([a-z]{3})-\}\}|==\s*(\{\{langname\|([a-z-]+)\}\}|[^=]+?)\s*==)\s*$')
SECTION_CODES = {'ref', 'adj', 'adv', 'ant', 'syn', 'dfn', 'num', 'drv', 'see', 'abr', 'alt', 'art', 'det', 'pro',
                 'suf', 'pre', 'prp', 'phr', 'cog', 'rel', 'var', 'abb', 'def', 'obs', 'hom'}
DEF_LINE = re.compile(r'^#(?![:*#])\s*(.+)$')


def nfc(s):
    return unicodedata.normalize('NFC', s.strip())


def base(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D').upper()


def vietnamese_lines(text):
    """Cac dong thuoc phan Tieng Viet; trang khong co tieu de ngon ngu -> rong (khong chac la tieng Viet)."""
    lines, current = [], False
    for line in text.splitlines():
        m = LANG_HEADER.match(line.strip())
        if m and m.group(2) not in SECTION_CODES:
            code = m.group(2) or m.group(4) or (m.group(3) or '').strip()
            if m.group(2) is not None or m.group(4) is not None or code.startswith('Tiếng '):
                current = code in ('vie', 'vi', 'Tiếng Việt')
                continue
        if current:
            lines.append(line)
    return lines


def clean(s):
    s = re.sub(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    for _ in range(5):
        s, n = re.subn(r'\{\{([^{}]*)\}\}', template, s)
        if n == 0:
            break
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = s.replace("'''", '').replace("''", '')
    s = re.sub(r'\s+', ' ', s).strip(' ;,')
    s = re.sub(r'\(\s*\)', '', s).strip()
    return s.lstrip('.,;:- ').strip()


def template(match):
    parts = [p.strip() for p in match.group(1).split('|')]
    name, args = parts[0].lower(), [p for p in parts[1:] if '=' not in p]
    if name in ('synonym of', 'syn of'):
        return f'Đồng nghĩa với {args[-1]}' if args else ''
    if name in ('gloss', 'gl'):
        return f'({args[0]})' if args else ''
    if name in ('lb', 'label', 'lbl'):
        labels = [a for a in args[1:] if a not in ('_', 'vi')]
        return f'({", ".join(labels)})' if labels else ''
    if name in ('l', 'm', 'll'):
        return args[-1] if args else ''
    return ''


def definitions(lines, title):
    senses = []
    for line in lines:
        m = DEF_LINE.match(line.strip())
        if not m:
            continue
        d = clean(m.group(1))
        if len(d) >= 2 and d not in senses and d.rstrip('. ').lower() != title.lower():
            senses.append(d[0].upper() + d[1:])
        if len(senses) == MAX_SENSES:
            break
    return senses


with open(v74_path, encoding='utf-8') as f:
    syllables = {s for line in f for s in nfc(line).lower().split(' ') if VI.match(s)}
with open(current_path, encoding='utf-8') as f:
    current = {nfc(r['phrase']) for r in csv.DictReader(f)}


def candidate(title):
    syl = title.split(' ')
    return (len(syl) == 2 and title == title.lower() and title not in current
            and all(s in syllables for s in syl) and not any(s in BLOCK for s in syl)
            and not any(c in title for c in 'fjwz'))


found = {}
skipped_no_vi = skipped_vulgar = 0
title = ns = None
with bz2.open(dump_path, 'rb') as f:
    for _, el in ET.iterparse(f, events=('end',)):
        tag = el.tag.rsplit('}', 1)[-1]
        if tag == 'title':
            title = nfc(el.text or '')
        elif tag == 'ns':
            ns = el.text
        elif tag == 'text':
            if ns == '0' and el.text and candidate(title):
                lines = vietnamese_lines(el.text)
                senses = definitions(lines, title)
                if not senses:
                    skipped_no_vi += 1
                elif any(VULGAR_LABEL.search(line) for line in lines):
                    skipped_vulgar += 1
                else:
                    found[title] = '\n'.join(senses)[:MAX_LEN]
        elif tag == 'page':
            el.clear()

with open(out_path, 'w', encoding='utf-8', newline='') as f:
    out = csv.writer(f, lineterminator='\n')
    out.writerow(['value', 'part1', 'part2', 'phrase', 'definition'])
    for phrase in sorted(found):
        p1, p2 = (base(s) for s in phrase.split(' '))
        out.writerow([p1 + p2, p1, p2, phrase, found[phrase]])
print('them', len(found), '| bo vi khong co muc Tieng Viet/dinh nghia', skipped_no_vi, '| bo vi tuc', skipped_vulgar)
