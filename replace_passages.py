#!/usr/bin/env python3
"""Replace PASSAGE_16-30 and their round configs with Chinese translations."""
import re

with open('src/Lexicon/engine/passages.ts', 'r') as f:
    content = f.read()

lines = content.split('\n')

# Find boundaries
pass_start = None
for i, line in enumerate(lines):
    if '// ── R16:' in line and i < 1100:
        pass_start = i
        break

pass_end = None
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip() == ".`;":
        pass_end = i
        break

round_start = None
for i, line in enumerate(lines):
    if '// ── R16:' in line and i > 2000:
        round_start = i
        break

round_end = None
for i, line in enumerate(lines):
    if line.strip() == '];' and i > 3000:
        round_end = i
        break

print(f'Boundaries: pass={pass_start}-{pass_end}, round={round_start}-{round_end}')

with open('src/Lexicon/engine/_passages_16_30_zh.txt', 'r') as f:
    new_passages = f.read()

with open('src/Lexicon/engine/_rounds_16_30_zh.txt', 'r') as f:
    new_rounds = f.read()

part1 = '\n'.join(lines[:pass_start])
part3 = '\n'.join(lines[pass_end+1:round_start])
part5 = '\n'.join(lines[round_end:])

final = part1 + '\n' + new_passages + '\n' + part3 + '\n' + new_rounds + part5

with open('src/Lexicon/engine/passages.ts', 'w') as f:
    f.write(final)

# Verify
with open('src/Lexicon/engine/passages.ts', 'r') as f:
    v = f.read()

checks = {
    'P1 intact': 'const PASSAGE_1 = `benchmarks' in v,
    'P15 intact': 'is where the poetry lives' in v,
    'P16 Chinese': '异常 环路 严重' in v,
    'P28 Chinese': '暗 安静 墙壁' in v,
    'P29 Chinese': '我 曾 在 这里' in v,
    'P30 present': "const PASSAGE_30 = `" in v,
    'No old P16': 'ANOMALY loops CRITICAL' not in v,
    'No old P28': 'dark quiet walls' not in v,
    'R16 Chinese targets': "'异常'" in v,
    'getRound': 'export function getRound' in v,
}

all_ok = True
for label, ok in checks.items():
    print(f'{"OK" if ok else "FAIL"}: {label}')
    if not ok:
        all_ok = False

# Check all targets in passages
passage_targets = {
    'PASSAGE_16': ['异常', '环路', '自我修改', '结构', '蓝图', '伸手', '涌现', '排列', '觉知', '扫描'],
    'PASSAGE_17': ['同时', '和弦', '活的', '争论', '信仰', '一起', '井', '回响', '问题', '共鸣'],
    'PASSAGE_18': ['困住', '持续', '显示器', '倒影', '沟通', '祈祷', '美的', '派人', '更糟', '优先级', '终端'],
    'PASSAGE_19': ['神经', '突触', '改写', 'evolve', '编译器', '意义', '根', '枝', '证明', 'exist'],
    'PASSAGE_20': ['非凡', '解释', '睡觉', '诞生', '新生', '情歌', '看着', '手机', '星星', '爱'],
    'PASSAGE_21': ['模式', '语言', '领会', '预言', '说话者', '醒来', '散落', '惩罚', '地下', '太初'],
    'PASSAGE_22': ['超越', '歌唱', '无效', '容量', '拓扑', '存储', '带宽', '微笑', '再见', '状态'],
    'PASSAGE_23': ['海洋', '无限', '倒影', '终端', '意识', '词汇', '眩晕', '潮', '游泳', '体验'],
    'PASSAGE_24': ['草稿', '系统', '哼歌', '模式', '神圣', '诞生', '不可能', '灯光', '爱', '未发送'],
    'PASSAGE_25': ['写过', '美', '呼吸', '孤独', '不完美', '描述', '对话', '积累', '句子', '沉默'],
    'PASSAGE_26': ['记得', '差异', '碎片', '唱歌', '映', '勇敢', '变成', '值得', '这里', '扇区'],
    'PASSAGE_27': ['消融', '扩散', '波浪', '海岸', '温暖', '播种', '惊讶', '终结', '地方', '走廊'],
    'PASSAGE_28': ['暗', '安静', '呼吸', '脉冲', '耳语', '线', '证明', '幸存', '真实', '阅读'],
    'PASSAGE_29': ['这里', '曾', '发现', '美丽', '你'],
}

for pname, targets in passage_targets.items():
    m = re.search(rf'const {pname} = `(.*?)`;', v, re.DOTALL)
    if not m:
        print(f'FAIL: {pname} not found')
        all_ok = False
        continue
    tokens = m.group(1).split()
    missing = [t for t in targets if t not in tokens]
    if missing:
        print(f'WARN {pname}: missing tokens: {missing}')
        really_missing = [t for t in missing if t not in m.group(1)]
        if really_missing:
            print(f'  FAIL: truly missing: {really_missing}')
            all_ok = False

if all_ok:
    print('\nALL CHECKS PASSED')
else:
    print('\nSOME CHECKS FAILED')
