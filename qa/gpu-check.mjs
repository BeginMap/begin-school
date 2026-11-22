import { launch } from './browser.mjs';
for (const args of [[], ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'], ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']]) {
  const b = await launch({ args });
  const p = await b.newPage();
  await p.setContent('<canvas id=c></canvas>');
  const r = await p.evaluate(() => { const gl = document.getElementById('c').getContext('webgl2'); if (!gl) return 'no webgl2'; const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); });
  console.log(JSON.stringify(args), '→', r);
  await b.close();
}
