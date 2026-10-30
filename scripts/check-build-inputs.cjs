const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const problems=[];
for(const name of ['next','react','react-dom']){
 const expected=lock.packages['node_modules/'+name]?.version;
 let actual;try{actual=require(path.join(root,'node_modules',name,'package.json')).version;}catch{}
 if(!actual||actual!==expected)problems.push(`${name}: installed ${actual||'missing'}, lock file requires ${expected}. Run npm ci.`);
}
const obsolete=['app/page.tsx','app/layout.tsx','app/not-found.tsx','app/learn/page.tsx','app/learn/[lesson]/page.tsx','app/course-checkout/page.tsx','app/courses/build-with-codex/page.tsx','middleware.ts'];
for(const file of obsolete)if(fs.existsSync(path.join(root,file)))problems.push(`Old route remains: ${file}. Remove this file from GitHub; retain app/(en) and app/ru.`);
if(problems.length){console.error('\nBuild inputs do not match this project:\n'+problems.map(x=>'- '+x).join('\n'));process.exit(1);}
console.log('Build inputs verified: dependencies match package-lock.json; no obsolete locale routes.');
