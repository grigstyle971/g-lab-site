import russian from "./public-ru.json";

export type Locale="en"|"ru";
const dictionary: Record<string,string>={...russian};
export const normalize=(s:string)=>s.replace(/\s+/g," ").trim();
export function translate(text:string,locale:Locale,extra:Record<string,string>={}):string {
 if(locale==="en" || !/[A-Za-z]/.test(text))return text;
 const key=normalize(text), result=extra[key]||dictionary[key];
 if(result)return text.replace(text.trim(),result);
 const patterns:[RegExp,(m:RegExpMatchArray)=>string][]=[
 [/^(\d+\.\s+)(.+)$/,m=>m[1]+translate(m[2],locale,extra)],
 [/^Practice checks: (\d+) of (\d+) confirmed$/,m=>`Практика: подтверждено ${m[1]} из ${m[2]}`],
 [/^(\d+) still to confirm after doing the work\.$/,m=>`Осталось подтвердить после выполнения: ${m[1]}.`],
 [/^Project note: (\d+) \/ 20 characters minimum$/,m=>`Заметка о проекте: ${m[1]} символов, минимум 20`],
 [/^Knowledge check: (\d+) of (\d+) correct$/,m=>`Верных ответов: ${m[1]} из ${m[2]}`],
 [/^Knowledge check: (\d+) of (\d+) answered$/,m=>`Дано ответов: ${m[1]} из ${m[2]}`],
 [/^(\d+) steps? left to mark this lesson as completed$/,m=>`До завершения урока осталось шагов: ${m[1]}`],
 [/^(\d+)–(\d+) min with practice$/,m=>`${m[1]}–${m[2]} мин с практикой`],
 [/^Enlarge: (.+)$/,m=>`Увеличить: ${translate(m[1],locale,extra)}`],
 [/^Area (\d+): (.+)$/,m=>`Область ${m[1]}: ${translate(m[2],locale,extra)}`],
 [/^(.+) beginner walkthrough$/,m=>`${m[1]}: инструкция для начинающих`],
 [/^(.+) setup steps$/,m=>`${m[1]}: шаги настройки`],
 ];
 for(const [regex,render]of patterns){const m=key.match(regex);if(m)return render(m);}
 // Preserve separators and numbers in headings assembled from several values.
 for(const separator of [" → "," / "," · "," /",": "]){if(key.includes(separator)){const parts=key.split(separator);const translated=parts.map(p=>translate(p,locale,extra));if(translated.some((p,i)=>p!==parts[i]))return translated.join(separator);}}
 return text;
}
export function localizedHref(href:string,locale:Locale){
 if(!href.startsWith("/")||href.startsWith("//")||/\.[a-z0-9]+(?:[?#]|$)/i.test(href))return href;
 const base=href.replace(/^\/ru(?=\/|[?#]|$)/,"")||"/";
 return locale==="ru"?`/ru${base==="/"?"":base}`:base;
}
export function translateDownload(text:string,locale:Locale,verbatim:string[]=[]){
 if(locale==="en")return text;
 const saved=verbatim.filter(Boolean);
 saved.forEach((value,i)=>{text=text.split(value).join(`⟦${i}⟧`);});
 return text.split("\n").map(line=>{
  const match=line.match(/^(\s*(?:[-•]|\[[ x]\]|\d+\.)\s+)(.*)$/);
  return match?match[1]+translate(match[2],locale):translate(line,locale);
 }).join("\n").replace(/⟦(\d+)⟧/g,(_,index)=>saved[Number(index)]);
}
