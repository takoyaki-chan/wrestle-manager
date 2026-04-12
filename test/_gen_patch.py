#!/usr/bin/env python3
"""Generate JS patch code from dialogue-expansion-worksheet.xlsx"""
import pandas as pd
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

XLSX = os.path.join(os.path.dirname(__file__), '..', 'docs', 'dialogue-expansion-worksheet.xlsx')

PERSONALITY_MAP = {
    'ノーマル (normal)': 'normal', '強気 (bold)': 'bold', '寡黙 (quiet)': 'quiet',
    'シャイ (shy)': 'shy', 'お気楽 (easygoing)': 'easygoing', '真面目 (earnest)': 'earnest',
    '感情的 (emotional)': 'emotional',
}
ARCHETYPE_MAP = {
    '丁寧 (polite)': 'polite', 'クール (cool)': 'cool', 'お嬢様 (ojousama)': 'ojousama',
    '蠱惑 (seductive)': 'seductive', '不良 (delinquent)': 'delinquent', '鷹揚 (composed)': 'composed',
}

def esc(s):
    """Escape for JS single-quoted strings"""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

def read_sheet(name):
    return pd.read_excel(XLSX, sheet_name=name, dtype=str).fillna('')

def gen_simple_patch(source_name, df):
    """Generate patch for NOTIF/CARE/CHOICE/LARGE style sources"""
    lines = []
    for _, row in df.iterrows():
        eid = row['event_id']
        p = PERSONALITY_MAP.get(row['personality'], '')
        a = ARCHETYPE_MAP.get(row['archetype'], '')
        text = esc(row['dialogue_text'])
        if not p or not a or not text:
            continue
        # Ensure path exists
        lines.append(f"if (!{source_name}['{eid}']) {source_name}['{eid}'] = {{}};")
        lines.append(f"if (!{source_name}['{eid}'].{p}) {source_name}['{eid}'].{p} = {{}};")
        lines.append(f"if (!{source_name}['{eid}'].{p}.{a}) {source_name}['{eid}'].{p}.{a} = [];")
        lines.append(f"{source_name}['{eid}'].{p}.{a}.push('{text}');")
    return lines

def gen_glimpse_b_patch(df):
    """Generate patch for GLIMPSE_B_LINES (dialogue + scene)"""
    lines = []
    for _, row in df.iterrows():
        eid = row['event_id']
        p = PERSONALITY_MAP.get(row['personality'], '')
        a = ARCHETYPE_MAP.get(row['archetype'], '')
        outcome = row.get('outcome', '')
        dial = esc(row['dialogue_text'])
        scene = esc(row.get('scene_text', ''))
        if not p or not a or not dial:
            continue

        if eid == 'GL-01' and outcome:
            # GL-01 has outcome sub-keys: win/loss/goodLoss/greatWin
            base = f"GLIMPSE_B_LINES['{eid}']"
            lines.append(f"if (!{base}['{outcome}']) {base}['{outcome}'] = {{}};")
            lines.append(f"if (!{base}['{outcome}'].{p}) {base}['{outcome}'].{p} = {{}};")
            lines.append(f"if (!{base}['{outcome}'].{p}.{a}) {base}['{outcome}'].{p}.{a} = [];")
            lines.append(f"{base}['{outcome}'].{p}.{a}.push('{dial}');")
            if scene:
                lines.append(f"if (!{base}._scene) {base}._scene = {{}};")
                lines.append(f"if (!{base}._scene['{outcome}']) {base}._scene['{outcome}'] = {{}};")
                lines.append(f"if (!{base}._scene['{outcome}'].{p}) {base}._scene['{outcome}'].{p} = {{}};")
                lines.append(f"if (!{base}._scene['{outcome}'].{p}.{a}) {base}._scene['{outcome}'].{p}.{a} = [];")
                lines.append(f"{base}._scene['{outcome}'].{p}.{a}.push('{scene}');")
        else:
            # GL-02 through GL-10: flat
            base = f"GLIMPSE_B_LINES['{eid}']"
            lines.append(f"if (!{base}.{p}) {base}.{p} = {{}};")
            lines.append(f"if (!{base}.{p}.{a}) {base}.{p}.{a} = [];")
            lines.append(f"{base}.{p}.{a}.push('{dial}');")
            if scene:
                lines.append(f"if (!{base}._scene) {base}._scene = {{}};")
                lines.append(f"if (!{base}._scene.{p}) {base}._scene.{p} = {{}};")
                lines.append(f"if (!{base}._scene.{p}.{a}) {base}._scene.{p}.{a} = [];")
                lines.append(f"{base}._scene.{p}.{a}.push('{scene}');")
    return lines

def gen_snapshot_patch(df):
    """Generate patch for SNAPSHOT_TEXTS (voice + scene deduped per event)"""
    lines = []
    # Collect unique scene texts per event_id
    scene_by_event = {}
    for _, row in df.iterrows():
        eid = row['event_id']
        scene = esc(row.get('scene_text', ''))
        if scene:
            if eid not in scene_by_event:
                scene_by_event[eid] = set()
            scene_by_event[eid].add(scene)

    # Add scene texts (deduped)
    for eid, scenes in scene_by_event.items():
        base = f"SNAPSHOT_TEXTS.{eid}"
        lines.append(f"if (!{base}.scene) {base}.scene = [];")
        for s in sorted(scenes):
            lines.append(f"{base}.scene.push('{s}');")

    # Add voice texts
    for _, row in df.iterrows():
        eid = row['event_id']
        p = PERSONALITY_MAP.get(row['personality'], '')
        a = ARCHETYPE_MAP.get(row['archetype'], '')
        dial = esc(row['dialogue_text'])
        if not p or not a or not dial:
            continue
        base = f"SNAPSHOT_TEXTS.{eid}"
        lines.append(f"if (!{base}.voice) {base}.voice = {{}};")
        lines.append(f"if (!{base}.voice.{p}) {base}.voice.{p} = {{}};")
        lines.append(f"if (!{base}.voice.{p}.{a}) {base}.voice.{p}.{a} = [];")
        lines.append(f"{base}.voice.{p}.{a}.push('{dial}');")
    return lines


# ── Main ──
all_lines = []

all_lines.append('// ─── Session F nested: ワークシート反映パッチ（394行） ───')
all_lines.append('')

all_lines.append('// ── NOTIF_DIALOGUES 拡張 ──')
all_lines.extend(gen_simple_patch('NOTIF_DIALOGUES', read_sheet('NOTIF_DIALOGUES')))
all_lines.append('')

all_lines.append('// ── CARE_REACTION_DIALOGUES 拡張 ──')
all_lines.extend(gen_simple_patch('CARE_REACTION_DIALOGUES', read_sheet('CARE_REACTION_DIALOGUES')))
all_lines.append('')

all_lines.append('// ── CHOICE_EVENT_DIALOGUES 拡張 ──')
all_lines.extend(gen_simple_patch('CHOICE_EVENT_DIALOGUES', read_sheet('CHOICE_EVENT_DIALOGUES')))
all_lines.append('')

all_lines.append('// ── LARGE_EVENT_DIALOGUES 拡張 ──')
all_lines.extend(gen_simple_patch('LARGE_EVENT_DIALOGUES', read_sheet('LARGE_EVENT_DIALOGUES')))
all_lines.append('')

all_lines.append('// ── GLIMPSE_B_LINES 拡張 (dialogue + scene) ──')
all_lines.extend(gen_glimpse_b_patch(read_sheet('GLIMPSE_B_LINES')))
all_lines.append('')

all_lines.append('// ── SNAPSHOT_TEXTS 拡張 (voice + scene deduped) ──')
all_lines.extend(gen_snapshot_patch(read_sheet('SNAPSHOT_TEXTS')))
all_lines.append('')

print('\n'.join(all_lines))
print(f'// Total patch lines: {len(all_lines)}', file=sys.stderr)
