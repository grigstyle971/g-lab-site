"use client";
import { translate } from "../lib/i18n/translate";
import { Localize, useLocale, useTranslations } from "./LanguageProvider";

import { useState } from "react";
export function PromptCard({ title = "Use this request in Codex", text }: {
    title?: string;
    text: string;
}) {
    const locale=useLocale();
    const prompt=translate(text,locale,useTranslations());
    const [status, setStatus] = useState("");
    return <Localize>{<div className="fl-prompt"><div><strong>{title}</strong><button type="button" onClick={async () => {
            try {
                await navigator.clipboard.writeText(prompt);
                setStatus("Copied. Replace any bracketed details before sending in your project.");
            }
            catch {
                setStatus("Clipboard unavailable. Select and copy the request below.");
            }
        }}>Copy request</button></div><pre tabIndex={0}>{prompt}</pre><p role="status">{status}</p></div>}</Localize>;
}
