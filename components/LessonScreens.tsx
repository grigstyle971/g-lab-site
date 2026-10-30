"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Localize, useLocale } from "./LanguageProvider";
import { ArrowIcon } from "./ArrowIcon";
import { chapterScreens, lessonScreens, screenRefreshers, type LessonScreen } from "../lib/lesson-screens";
const officialDarkScreenshotIds = new Set([
 "vercel-deployments",
 "vercel-redeploy",
 "vercel-environment",
 "vercel-import",
 "vercel-new",
 "vercel-domain-add",
 "vercel-domain-name",
 "vercel-domain-dns",
 "vercel-domain-ready",
]);
// These Supabase references were already captured in dark mode. Inverting them
// would turn their dark canvas white, which is what caused the remaining mismatch.
const nativeDarkScreenshotIds = new Set([
 "supabase-project",
 "supabase-keys",
 "supabase-redirect",
 "supabase-tables",
]);
// Reserve the exact source proportions before an image loads. Without these
// values the old 1100×820 fallback briefly squeezed panoramic screenshots.
const rasterScreenshotDimensions: Record<string,{width:number;height:number}> = {
 "github-login":{width:1100,height:820},
 "github-new":{width:732,height:516},
 "github-owner":{width:1528,height:304},
 "github-name":{width:1528,height:350},
 "github-history":{width:628,height:58},
 "vercel-login":{width:1100,height:820},
 "vercel-deployments":{width:1146,height:660},
 "vercel-redeploy":{width:982,height:984},
 "vercel-environment":{width:1886,height:1124},
 "vercel-import":{width:1766,height:1404},
 "vercel-new":{width:1652,height:486},
 "vercel-domain-add":{width:622,height:170},
 "vercel-domain-name":{width:1856,height:572},
 "vercel-domain-dns":{width:1890,height:726},
 "vercel-domain-ready":{width:1110,height:594},
 "supabase-login":{width:1100,height:820},
 "supabase-signup":{width:1100,height:820},
 "supabase-project":{width:688,height:654},
 "supabase-keys":{width:2352,height:1060},
 "supabase-redirect":{width:2668,height:834},
 "supabase-smtp":{width:2378,height:956},
 "supabase-editor":{width:2421,height:1365},
 "supabase-tables":{width:1600,height:1145},
};
export function ScreenCard({screen,compact=false}:{screen:LessonScreen;compact?:boolean}){
 const locale=useLocale();
 const dialog=useRef<HTMLDialogElement>(null);
 const [active,setActive]=useState(0);
 const initialSize=screen.image ?? rasterScreenshotDimensions[screen.id] ?? {width:1100,height:820};
 const [size,setSize]=useState(initialSize);
 const marks=screen.highlights||[],area=marks[active];
 const hasOfficialDarkScreenshot=officialDarkScreenshotIds.has(screen.id);
 const adaptRasterForDarkTheme=!screen.image&&!hasOfficialDarkScreenshot&&!nativeDarkScreenshotIds.has(screen.id);
 const src=screen.image ? (locale==="ru" ? screen.image.srcRu : screen.image.src) : `/lesson-screens/${screen.id}${hasOfficialDarkScreenshot?"-dark":""}.png`;
 const move=(index:number)=>setActive(index);
 return <Localize><figure className="fl-screen fl-screen-clean" data-screen-id={screen.id} data-image-treatment={adaptRasterForDarkTheme?"dark-filter":"native"}>
  <figcaption className="screen-heading"><div><p className="fl-kicker">{screen.tool} / SCREEN GUIDE</p><h3>{screen.title}</h3></div><button className="screen-expand" type="button" onClick={()=>dialog.current?.showModal()} aria-label={`Enlarge: ${screen.title}`}><ArrowIcon /> <span>Expand</span></button></figcaption>
  <div className="screen-canvas">
   <div className="fl-screen-stage" style={{aspectRatio:`${size.width} / ${size.height}`}}>
    <img src={src} alt={screen.alt} loading="lazy" width={initialSize.width} height={initialSize.height} onLoad={e=>setSize({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})} style={{width:"100%",height:"100%",left:0,top:0,objectFit:"contain"}}/>
    {area&&<span className="screen-outline" aria-hidden="true" style={{borderRadius:area.shape==="circle"?"50%":undefined,left:`${area.x}%`,top:`${area.y}%`,width:`${area.width}%`,height:`${area.height}%`}}/>}
   </div>
  </div>
  {area&&<div className="screen-detail">{marks.length>1&&<div className="screen-choices">{marks.map((mark,i)=><button key={mark.label} type="button" className="screen-choice" aria-pressed={i===active} onClick={()=>move(i)}>{mark.label}</button>)}</div>}<div className="screen-detail-copy" aria-live="polite"><h4>{area.label}</h4><p>{area.detail}</p></div></div>}
  {!compact&&<div className="screen-practice"><div><strong>Your action</strong><p>{screen.action}</p></div><div><strong>Expected result</strong><p>{screen.verify}</p></div></div>}
  <footer className="screen-caption"><span>{screen.kind||"Official screenshot"} · <span>Example interface</span></span><a href={screen.source} target="_blank" rel="noreferrer">{screen.image ? "Documentation" : "Source"} <ArrowIcon /></a></footer>
  <dialog ref={dialog} className="fl-screen-dialog" aria-label={screen.title} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><div className="fl-screen-dialog-head"><strong>{screen.title}</strong><button type="button" onClick={()=>dialog.current?.close()} autoFocus>Close image ×</button></div><p>{screen.image ? "Teaching diagram with example content. Scroll to inspect; press Escape to close." : "Reference screenshot adapted for the dark theme. Scroll to inspect; press Escape to close."}</p><div className="fl-screen-zoom"><img src={src} alt={screen.alt}/></div><a href={screen.source} target="_blank" rel="noreferrer">Open official source <ArrowIcon /></a></dialog>
 </figure></Localize>;
}
export function LessonScreens({slug,chapter}:{slug:string;chapter:number}){const ids=chapterScreens[slug]?.[chapter];return ids?<div className="fl-screen-guides">{ids.map(id=><ScreenCard key={id} screen={lessonScreens[id]}/>)}</div>:null;}
export function ScreenRefresher({slug}:{slug:string}){const ref=screenRefreshers[slug];return ref?<Localize><aside className="fl-screen-refresher"><strong>Need to find your way around the tool?</strong><p><Link href={ref.href}>{ref.title} →</Link></p><small>Return to the original walkthrough with screenshots. Continue this lesson when you have found the right screen.</small></aside></Localize>:null;}
