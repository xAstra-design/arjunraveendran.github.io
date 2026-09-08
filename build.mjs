import { copyFile, cp, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = new URL('./', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const script = await readFile(new URL('script.js', root), 'utf8');
new vm.Script(script, { filename: 'script.js' });
for (const filename of ['portfolio-motion.js', 'game.js', 'game-core.js', 'game-world.js', 'game-motion.js', 'game-fx.js']) new vm.Script(await readFile(new URL(filename, root), 'utf8'), { filename });
const sandbox = { window: {} };
vm.runInNewContext(await readFile(new URL('content.js', root), 'utf8'), sandbox);
const projects = new Set(sandbox.window.PORTFOLIO.nodes.map(node => node.id));
for (const match of html.matchAll(/data-project="([^"]+)"/g)) {
  if (!projects.has(match[1])) throw new Error(`Missing project content: ${match[1]}`);
}
for (const document of ['index.html', 'play.html']) {
const page = await readFile(new URL(document, root), 'utf8');
const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const link = match[1];
  if (link.startsWith('#')) {
    if (!ids.includes(link.slice(1))) throw new Error(`Broken anchor: ${link}`);
  } else if (!/^(?:https?:|data:|mailto:)/.test(link)) {
    await stat(new URL(link, root));
  }
}
}
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'art-direction.css', 'portfolio.css', 'portfolio-motion.js', 'script.js', 'content.js', 'play.html', 'game-ui.css', 'game.js', 'game-core.js', 'game-world.js', 'game-motion.js', 'game-fx.js', 'resume.pdf', '.nojekyll']) {
  await copyFile(new URL(file, root), new URL(file, output));
}
for (const directory of ['assets', 'vendor']) await cp(new URL(directory, root), new URL(directory, output), { recursive: true });
console.log('Built portfolio and game: JavaScript syntax, project references, local assets, both pages, and section links validated.');
console.log(`Output: ${resolve('dist')}`);
