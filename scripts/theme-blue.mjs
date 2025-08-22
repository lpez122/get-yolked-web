import fs from 'fs', path from 'path';

const BLUE = '#003D79';            // your swatch
const MAYBE_PURPLES = [
  '#7C5CFA', '#7c5cfa', '#6C63FF', '#6c63ff', '#8B5CF6', '#8b5cf6', '#7C6CFB', '#7c6cfb'
];

function visit(dir){
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir,f);
    const st = fs.statSync(p);
    if (st.isDirectory()) visit(p);
    else if (/\.(js|jsx|ts|tsx)$/.test(f)) {
      let s = fs.readFileSync(p,'utf8');
      let before = s;
      // replace common purple accents with your blue
      for (const hex of MAYBE_PURPLES) s = s.replace(new RegExp(hex,'g'), BLUE);
      // replace obvious "ACCENT = '#...'"
      s = s.replace(/(const\s+ACCENT\s*=\s*['"])(#[0-9a-fA-F]{3,8})(['"])/g, `$1${BLUE}$3`);
      // try to set theme.accent / theme.primary if defined
      s = s.replace(/(accent\s*:\s*['"])(#[0-9a-fA-F]{3,8})(['"])/g, `$1${BLUE}$3`);
      s = s.replace(/(primary\s*:\s*['"])(#[0-9a-fA-F]{3,8})(['"])/g, `$1${BLUE}$3`);
      if (s !== before) {
        fs.writeFileSync(p, s);
        console.log('blue:', path.relative(process.cwd(), p));
      }
    }
  }
}

visit('.');
console.log('done: theme-blue');
