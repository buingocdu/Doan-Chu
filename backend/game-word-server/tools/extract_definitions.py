"""Trich giai nghia tieng Viet tu ban dump vi.wiktionary cho cac tu co trong danh sach.

Cach dung:
  python -I extract_definitions.py viwiktionary-latest-pages-articles.xml.bz2 words-vi-all.csv definitions-vi.csv

- Chi lay phan tieng Viet cua moi trang ({{-vie-}}, =={{langname|vi}}==, ==Tiếng Việt==).
- Lay toi da 3 dong dinh nghia "# ..." (bo vi du "#:", trich dan "#*"), bo cu phap wiki.
- Dau ra: CSV phrase,definition; cac nghia cach nhau boi xuong dong.
Nguon: Wiktionary tieng Viet, giay phep CC BY-SA 4.0 (can ghi nguon khi hien thi).
"""
import bz2
import csv
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET

dump_path, words_path, out_path = sys.argv[1:4]
MAX_SENSES = 3
MAX_LEN = 1000

with open(words_path, encoding='utf-8') as f:
    wanted = {unicodedata.normalize('NFC', r['phrase']) for r in csv.DictReader(f)}

# Tieu de ngon ngu: {{-vie-}} (ma 3 chu cai), =={{langname|vi}}==, ==Tiếng Việt==.
# {{-noun-}}, {{-pron-}}, {{-ref-}}, ... la tieu de muc trong cung ngon ngu, khong phai ngon ngu moi.
LANG_HEADER = re.compile(r'^(\{\{-([a-z]{3})-\}\}|==\s*(\{\{langname\|([a-z-]+)\}\}|[^=]+?)\s*==)\s*$')
SECTION_CODES = {'ref', 'adj', 'adv', 'ant', 'syn', 'dfn', 'num', 'drv', 'see', 'abr', 'alt', 'art', 'det', 'pro',
                 'suf', 'pre', 'prp', 'phr', 'cog', 'rel', 'var', 'abb', 'def', 'obs', 'hom'}
DEF_LINE = re.compile(r'^#(?![:*#])\s*(.+)$')


def vietnamese_block(text):
    """Cac dong thuoc phan tieng Viet; trang khong co tieu de ngon ngu thi coi ca trang la tieng Viet."""
    lines = text.splitlines()
    blocks, current, has_header = [], None, False
    for line in lines:
        m = LANG_HEADER.match(line.strip())
        if m and m.group(2) not in SECTION_CODES:
            code = m.group(2) or m.group(4) or (m.group(3) or '').strip()
            is_lang = m.group(2) is not None or m.group(4) is not None or code.startswith('Tiếng ')
            if is_lang:
                has_header = True
                current = code in ('vie', 'vi', 'Tiếng Việt')
                continue
        if current or not has_header:
            blocks.append(line)
    return blocks


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


def clean(s):
    s = re.sub(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    for _ in range(5):  # template long nhau: thay tu trong ra ngoai
        s, n = re.subn(r'\{\{([^{}]*)\}\}', template, s)
        if n == 0:
            break
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = s.replace("'''", '').replace("''", '')
    s = re.sub(r'\s+', ' ', s).strip(' ;,')
    s = re.sub(r'\(\s*\)', '', s).strip()
    return s.lstrip('.,;:- ').strip()


def definitions(text, title):
    senses = []
    for line in vietnamese_block(text):
        m = DEF_LINE.match(line.strip())
        if not m:
            continue
        d = clean(m.group(1))
        # Bo nghia rong hoac chi lap lai chinh tu do (vd "Bàn tay.")
        if len(d) >= 2 and d not in senses and d.rstrip('. ').lower() != title.lower():
            senses.append(d[0].upper() + d[1:])
        if len(senses) == MAX_SENSES:
            break
    return '\n'.join(senses)[:MAX_LEN]


found = {}
title = ns = None
with bz2.open(dump_path, 'rb') as f:
    for _, el in ET.iterparse(f, events=('end',)):
        tag = el.tag.rsplit('}', 1)[-1]
        if tag == 'title':
            title = unicodedata.normalize('NFC', el.text or '')
        elif tag == 'ns':
            ns = el.text
        elif tag == 'text':
            if ns == '0' and title in wanted and el.text:
                d = definitions(el.text, title)
                if d:
                    found[title] = d
        elif tag == 'page':
            el.clear()

with open(out_path, 'w', encoding='utf-8', newline='') as f:
    out = csv.writer(f, lineterminator='\n')
    out.writerow(['phrase', 'definition'])
    for phrase in sorted(found):
        out.writerow([phrase, found[phrase]])
print('wanted', len(wanted), 'with definition', len(found))
