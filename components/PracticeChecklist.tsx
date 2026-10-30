"use client";

import { Localize } from "./LanguageProvider";

export function PracticeChecklist({ checks, confirmed, onChange, disabled }: {
  checks: readonly string[];
  confirmed: string[];
  onChange: (checks: string[]) => void;
  disabled: boolean;
}) {
  return <Localize><fieldset id="project-checks" disabled={disabled} aria-describedby="project-checks-help">
    <legend>Your work in the project</legend>
    <p id="project-checks-help" className="fl-note">Confirm only the actions you completed in your own project. These are your observations; this page cannot inspect your external website or accounts.</p>
    {checks.map(check => <label key={check}>
      <input type="checkbox" checked={confirmed.includes(check)} onChange={event => {
        onChange(event.target.checked ? [...confirmed, check] : confirmed.filter(item => item !== check));
      }} />
      <span>{check}</span>
    </label>)}
    <p className="fl-note">{`Practice checks: ${confirmed.length} of ${checks.length} confirmed`}</p>
  </fieldset></Localize>;
}
