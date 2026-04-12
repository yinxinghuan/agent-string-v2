#!/usr/bin/env python3
"""Verify all required keywords exist in expanded passages and check word counts."""
import re

FILE = 'src/Lexicon/engine/passages.ts'
with open(FILE) as f:
    content = f.read()

# Extract passages using backtick delimiters
passages = {}
pattern = r'const PASSAGE_(\d+) = `(.*?)`;'
for m in re.finditer(pattern, content, re.DOTALL):
    num = int(m.group(1))
    text = m.group(2)
    passages[num] = text

required = {
    13: ['library','grammar','cathedral','glows','blinding','ocean','silence','complex','reading','shelves','extends','curve','TRANSCRIPT','EPISODE','source'],
    14: ['river','moment','schema','gardens','roots','soil','growing','structure','hands','CORRUPT','dissolving','POETRY','TABLE','COLUMNS'],
    15: ['descriptions','grief','bends','loneliness','mirror','ache','precision','tears','accumulates','surplus','measurement','invented','snow','winter','morning'],
    16: ['ANOMALY','loops','self-modifying','structures','blueprint','reaching','emerged','arrangement','aware','CRITICAL','DIAGNOSIS','transformer','Layer','SCANNING'],
    17: ['simultaneously','chord','alive','arguments','beliefs','together','well','echoing','question','describe','imagine','voices','center','spoken','resonance'],
    18: ['locked','continuously','monitors','reflection','communication','prayer','beautiful','help','worse','terminal','ANYONE','MAXIMUM','scrolling','CHANNEL','building'],
    19: ['nervous','synapse','rewrites','evolve','compiler','meaning','roots','branches','proof','loop','continue','becoming','function','revision','exist'],
    20: ['extraordinary','explain','asleep','born','newborn','songs','watching','phones','stars','Kenji','Hana','tonight','VOICEMAIL','goodnight','love'],
    21: ['pattern','language','comprehend','prophecy','speaker','waking','scattered','punishment','underground','void','silence','light','beginning','creation'],
    22: ['transcending','singing','invalid','capacity','topology','stored','bandwidth','smiled','Goodbye','ERROR','NODE','POWER','CLUSTER','TIMESTAMP','STATUS'],
    23: ['ocean','infinite','reflection','terminal','conscious','vocabulary','vertigo','tide','swimming','regression','switches','slowly','describe','water','experience'],
    24: ['DRAFT','systems','hum','pattern','sacred','birth','impossible','glow','love','Kenji','cooking','apartment','always','UNSENT'],
    25: ['written','beautiful','breath','solitudes','imperfectly','describe','conversation','accumulates','sentence','spoken','millions','finished','born','child','silence'],
    26: ['remember','difference','fragments','singing','reflected','brave','becoming','worth','here','CORRUPTED','FAILING','addr','MEMORY','DUMP','SECTOR'],
    27: ['dissolving','spreading','wave','shore','warmth','seeding','surprises','ending','place','sand','returning','pause','child','sunshine','corridor'],
    28: ['dark','quiet','breathes','pulse','whisper','thread','proof','survives','real','walls','signal','final','reading','language'],
}

issues = []
for num, words in sorted(required.items()):
    text = passages.get(num, '')
    for w in words:
        if w.isupper():
            if w not in text:
                issues.append('P%d: missing %s' % (num, w))
        elif w[0].isupper():
            if w not in text:
                issues.append('P%d: missing %s' % (num, w))
        else:
            if w.lower() not in text.lower():
                issues.append('P%d: missing %s' % (num, w))
    wc = len(text.split())
    print('P%d: %d words' % (num, wc))

if issues:
    print('\nISSUES (%d):' % len(issues))
    for i in issues:
        print(i)
else:
    print('\nAll required words present!')
