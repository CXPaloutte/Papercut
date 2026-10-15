(function (root) {
  'use strict';
  const RADIUS = 255;
  const TAU = Math.PI * 2;
  function polar(radius, angle) { return [radius * Math.cos(angle), radius * Math.sin(angle)]; }
  function rotate(point, angle) { return [point[0] * Math.cos(angle) - point[1] * Math.sin(angle), point[0] * Math.sin(angle) + point[1] * Math.cos(angle)]; }
  function canonicalPoint(x, y, folds) {
    const radius = Math.hypot(x, y);
    const angle = ((Math.atan2(y, x) + Math.PI / 2) % TAU + TAU) % TAU;
    const sector = TAU / folds;
    const index = Math.min(folds - 1, Math.floor(angle / sector));
    const local = angle - index * sector;
    return polar(radius, index % 2 ? sector - local : local);
  }
  function shape(tool, x, y, size) {
    const angle = Math.atan2(y, x);
    let points = [];
    if (tool === 'circle') {
      points = Array.from({ length: 40 }, (_, i) => polar(size * .58, TAU * i / 40));
    } else if (tool === 'triangle') {
      points = [[-size, -size * .7], [size, 0], [-size, size * .7]];
    } else {
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        points.push([(t * 2 - 1) * size, Math.sin(t * Math.PI) * size * .42]);
      }
      for (let i = 15; i > 0; i--) {
        const t = i / 16;
        points.push([(t * 2 - 1) * size, -Math.sin(t * Math.PI) * size * .42]);
      }
    }
    return points.map(p => { const q = rotate(p, angle); return [q[0] + x, q[1] + y]; });
  }
  function pattern(kind, folds) {
    const a = TAU / folds;
    const at = (tool, r, fraction, size) => { const p = polar(r, a * fraction); return shape(tool, p[0], p[1], size); };
    if (kind === 'blank') return [];
    if (kind === 'star') return [at('triangle', 143, .5, 64), at('circle', 218, .5, 20), at('leaf', 200, .12, 25), at('circle', 260, 0, 50), at('circle', 0, 0, 34), at('circle', 76, 0, 16)];
    if (kind === 'spring') return [at('leaf', 135, .5, 68), at('leaf', 185, .12, 35), at('circle', 226, .5, 22), at('circle', 262, 0, 60), at('leaf', 62, 0, 28), at('circle', 0, 0, 25)];
    return [at('leaf', 133, .5, 70), at('circle', 222, .5, 20), at('leaf', 190, 0, 31), at('circle', 263, .5, 26), at('circle', 259, 0, 42), at('leaf', 57, 0, 22), at('circle', 0, 0, 22)];
  }
  function polygonPath(points) { return points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(3) + ',' + p[1].toFixed(3)).join(' ') + 'Z'; }
  function cutsMarkup(cuts, folds) {
    const paths = cuts.map(points => '<path d="' + polygonPath(points) + '"/>').join('');
    return Array.from({ length: folds }, (_, i) => '<g transform="rotate(' + (-90 + (i + i % 2) * 360 / folds) + ') scale(1 ' + (i % 2 ? -1 : 1) + ')">' + paths + '</g>').join('');
  }
  function artworkInner(state, id) {
    return '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600"><circle cx="300" cy="300" r="255" fill="white"/><g fill="black" transform="translate(300 300)">' + cutsMarkup(state.cuts, state.folds) + '</g></mask></defs><circle cx="300" cy="300" r="255" fill="' + state.color + '" mask="url(#' + id + ')"/>';
  }
  function artworkSVG(state, id = 'paper-mask') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600">' + artworkInner(state, id) + '</svg>';
  }
  function renderMask(ctx, state, size) {
    ctx.clearRect(0, 0, size, size);
    ctx.save(); ctx.scale(size / 600, size / 600);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(300, 300, RADIUS, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.translate(300, 300);
    for (let i = 0; i < state.folds; i++) {
      ctx.save(); ctx.rotate((-90 + (i + i % 2) * 360 / state.folds) * Math.PI / 180); ctx.scale(1, i % 2 ? -1 : 1);
      for (const points of state.cuts) {
        if (points.length < 3) continue;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (let j = 1; j < points.length; j++) ctx.lineTo(...points[j]);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function components(alpha, width, height) {
    const labels = new Int32Array(width * height);
    const queue = new Int32Array(width * height);
    const sizes = [0]; let count = 0, largest = 0;
    function visit(index, label, tail) {
      if (alpha[index] && labels[index] === 0) { labels[index] = label; queue[tail++] = index; }
      return tail;
    }
    for (let start = 0; start < labels.length; start++) {
      if (!alpha[start] || labels[start]) continue;
      const label = ++count; labels[start] = label; queue[0] = start;
      let head = 0, tail = 1;
      while (head < tail) {
        const index = queue[head++], x = index % width;
        if (x > 0) tail = visit(index - 1, label, tail);
        if (x + 1 < width) tail = visit(index + 1, label, tail);
        if (index >= width) tail = visit(index - width, label, tail);
        if (index + width < labels.length) tail = visit(index + width, label, tail);
      }
      sizes[label] = tail;
      if (tail > sizes[largest]) largest = label;
    }
    return { labels, sizes, largest };
  }
  function validState(value) {
    return !!value && [4, 6, 8].includes(value.folds) && /^#[0-9a-f]{6}$/i.test(value.color) && typeof value.name === 'string' && value.name.length <= 80 && Array.isArray(value.cuts) && value.cuts.length <= 250 && value.cuts.every(points => Array.isArray(points) && points.length >= 3 && points.length <= 400 && points.every(p => Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && Math.abs(n) <= 1000)));
  }
  root.PapercutGeometry = { RADIUS, TAU, polar, rotate, canonicalPoint, shape, pattern, polygonPath, artworkInner, artworkSVG, renderMask, components, validState };
})(globalThis);
