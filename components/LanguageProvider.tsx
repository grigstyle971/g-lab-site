"use client";
import { Children, createContext, useContext, type ReactNode, isValidElement, cloneElement, type ReactElement } from "react";
import { translate, localizedHref, type Locale } from "../lib/i18n/translate";
const TranslationContext=createContext<Record<string,string>>({});
export const useTranslations=()=>useContext(TranslationContext);
export function LessonTranslations({translations,children}:{translations:Record<string,string>;children:ReactNode}){return <TranslationContext.Provider value={translations}>{children}</TranslationContext.Provider>;}
const LanguageContext=createContext<Locale>("en");
export const useLocale=()=>useContext(LanguageContext);
export function LanguageProvider({locale,children}:{locale:Locale;children:ReactNode}){return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;}
function visit(node:ReactNode,locale:Locale,extra:Record<string,string>):ReactNode {
 if(typeof node==="string")return translate(node,locale,extra);
 if(Array.isArray(node))return Children.map(node,child=>visit(child,locale,extra));
 if(!isValidElement(node))return node;
 const element=node as ReactElement<Record<string,unknown>>;const props=element.props;
 if(props.translate==="no"||element.type==="pre"||element.type==="code")return node;
 const updates:Record<string,unknown>={};
 if(props.children!==undefined)updates.children=visit(props.children as ReactNode,locale,extra);
 for(const key of ["placeholder","title","alt","aria-label"]){if(typeof props[key]==="string")updates[key]=translate(props[key] as string,locale,extra);}
 if(typeof props.href==="string")updates.href=localizedHref(props.href,locale);
 if(props.lang==="en")updates.lang=locale;
 return cloneElement(element,updates);
}
export function Localize({children}:{children:ReactNode}){const locale=useLocale(),extra=useTranslations();return locale==="en"?children:visit(children,locale,extra);}
