import fs from 'fs';
const p = './App.js';
if (!fs.existsSync(p)) { console.error('App.js not found'); process.exit(1); }
let s = fs.readFileSync(p,'utf8');

function ensure(prop, snippet){
  if (!new RegExp(prop.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(s)) {
    // insert after tabBarInactiveTintColor if present, else at start of screenOptions
    if (/tabBarInactiveTintColor\s*:/.test(s)) {
      s = s.replace(/tabBarInactiveTintColor\s*:\s*[^,}]+,/, m => m + ' ' + snippet + ',');
    } else {
      s = s.replace(/screenOptions\s*=\s*\(\{\s*route\s*\}\)\s*=>\s*\(\{/, m => m + snippet + ', ');
      s = s.replace(/screenOptions\s*=\s*\{\s*\{/, m => m + snippet + ', ');
    }
  }
}

// 1) Even spacing per item (works regardless of internal layout)
ensure('tabBarItemStyle', "tabBarItemStyle:{flex:1,width:'20%'}");

// 2) Remove left/right padding and default inner margins
if (/tabBarStyle\s*:\s*\{[^}]*\}/.test(s)) {
  s = s.replace(/tabBarStyle\s*:\s*\{([^}]*)\}/, (m, inner) => {
    let upd = inner;
    if (!/paddingHorizontal\s*:/.test(upd)) upd += ',paddingHorizontal:0';
    if (!/marginHorizontal\s*:/.test(upd)) upd += ',marginHorizontal:0';
    if (!/justifyContent\s*:/.test(upd)) upd += ',justifyContent:"space-between"';
    return `tabBarStyle:{${upd}}`;
  });
} else {
  s = s.replace(/screenOptions\s*=\s*\(\{\s*route\s*\}\)\s*=>\s*\(\{/, m => m + 'tabBarStyle:{paddingHorizontal:0,marginHorizontal:0,justifyContent:"space-between"}, ');
  s = s.replace(/screenOptions\s*=\s*\{\s*\{/, m => m + 'tabBarStyle:{paddingHorizontal:0,marginHorizontal:0,justifyContent:"space-between"}, ');
}

// 3) Tidy icon/label margins (prevents indent illusions)
ensure('tabBarIconStyle', 'tabBarIconStyle:{margin:0}');
ensure('tabBarLabelStyle', 'tabBarLabelStyle:{marginBottom:4}');

fs.writeFileSync(p,s);
console.log('✓ App.js patched for evenly spaced tab items');
