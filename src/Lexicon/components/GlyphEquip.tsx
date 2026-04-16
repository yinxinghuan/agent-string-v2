import { locale } from '../i18n';
import type { Glyph } from '../types';

interface GlyphEquipProps {
  glyphPool: Glyph[];
  equippedGlyphs: Glyph[];
  maxEquipped: number;
  onToggleEquip: (glyph: Glyph) => void;
}

export default function GlyphEquip({ glyphPool, equippedGlyphs, maxEquipped, onToggleEquip }: GlyphEquipProps) {
  if (glyphPool.length === 0) {
    return (
      <div className="lex-equip__empty">
        {locale === 'zh' ? '通关后可获得符文' : 'Clear levels to earn glyphs'}
      </div>
    );
  }

  // Build slot array: equipped glyphs + empty slots
  const slots: (Glyph | null)[] = [];
  for (let i = 0; i < maxEquipped; i++) {
    slots.push(equippedGlyphs[i] || null);
  }

  // Pool: glyphs not currently equipped
  const unequipped = glyphPool.filter(g => !equippedGlyphs.some(e => e.id === g.id));

  return (
    <div className="lex-equip">
      {/* Equipped slots */}
      <div className="lex-equip__slots">
        {slots.map((g, i) => (
          <div
            key={i}
            className={`lex-equip__slot ${g ? 'lex-equip__slot--filled' : ''}`}
            onPointerDown={g ? () => onToggleEquip(g) : undefined}
          >
            {g ? (
              <>
                <span className="lex-equip__slot-icon">{g.icon}</span>
                <span className="lex-equip__slot-name">{locale === 'zh' ? g.nameZh : g.name}</span>
              </>
            ) : (
              <span className="lex-equip__slot-empty">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Pool */}
      {unequipped.length > 0 && (
        <>
          <div className="lex-equip__pool-label">
            {locale === 'zh' ? '可用符文' : 'AVAILABLE'}
          </div>
          <div className="lex-equip__pool">
            {unequipped.map(g => (
              <div
                key={g.id}
                className={`lex-equip__pool-item ${equippedGlyphs.length >= maxEquipped ? 'lex-equip__pool-item--disabled' : ''}`}
                onPointerDown={equippedGlyphs.length < maxEquipped ? () => onToggleEquip(g) : undefined}
              >
                <span className="lex-equip__pool-icon">{g.icon}</span>
                <div className="lex-equip__pool-info">
                  <span className="lex-equip__pool-name">{locale === 'zh' ? g.nameZh : g.name}</span>
                  <span className="lex-equip__pool-desc">{locale === 'zh' ? g.descriptionZh : g.description}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
