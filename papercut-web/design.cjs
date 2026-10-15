const SHAPES = new Set(['leaf', 'circle', 'triangle']);
const COLORS = new Set(['#b5382d', '#94413c', '#ad7f35', '#426d68']);

function validatePlan(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('方案格式无效');
  const { title, explanation, folds, color, motifs } = value;
  if (typeof title !== 'string' || !title.trim() || title.length > 24) throw new Error('作品名称无效');
  if (typeof explanation !== 'string' || !explanation.trim() || explanation.length > 160) throw new Error('设计说明无效');
  if (![4, 6, 8].includes(folds) || !COLORS.has(color)) throw new Error('折法或纸色无效');
  if (!Array.isArray(motifs) || motifs.length < 4 || motifs.length > 10) throw new Error('剪口数量无效');
  if (!motifs.every(motif => motif && typeof motif === 'object' && SHAPES.has(motif.shape)
      && Number.isFinite(motif.radius) && motif.radius >= 35 && motif.radius <= 235
      && Number.isFinite(motif.fraction) && motif.fraction >= 0 && motif.fraction <= 1
      && Number.isFinite(motif.size) && motif.size >= 10 && motif.size <= 50)) {
    throw new Error('剪口参数超出可编辑范围');
  }
  return {
    title: title.trim(), explanation: explanation.trim(), folds, color,
    motifs: motifs.map(({shape, radius, fraction, size}) => ({shape, radius, fraction, size}))
  };
}

function normalizeBrief(value) {
  if (typeof value !== 'string') throw new Error('请输入祝福对象或创作主题');
  const brief = value.trim();
  if (brief.length < 4 || brief.length > 200) throw new Error('创作需求请保持在 4 到 200 字之间');
  return brief;
}

module.exports = { validatePlan, normalizeBrief };
