// Public course catalogue. Keep detailed lessons in server-only modules.
export type Lesson = {slug:string;number:string;title:string;duration:string;module:string;moduleNumber:string;summary:string;objective:string;steps:string[]};
export const lessons: Lesson[] = [
  {
    "slug": "welcome",
    "number": "01",
    "moduleNumber": "01",
    "module": "Build with Codex",
    "title": "Build your first website with Codex",
    "duration": "45–60 min with practice",
    "summary": "Direct Codex, open your first website, test it in the browser and improve it through clear feedback.",
    "objective": "Build a first local website with Codex, test its main action and verify one requested improvement.",
    "steps": [
      "Open your project in Codex.",
      "Build from a clear brief.",
      "Open and test the preview.",
      "Request and verify one improvement.",
      "Save a project handoff."
    ]
  },
  {
    "slug": "codex-workflow",
    "number": "02",
    "moduleNumber": "01",
    "module": "Build with Codex",
    "title": "Turn a first page into a useful website",
    "duration": "45–60 min with practice",
    "summary": "Help visitors understand your service and find the next step. You will turn your first draft into a page that answers their questions.",
    "objective": "A visitor can understand Anna’s service, decide whether it fits and reach a clear next step through a complete page.",
    "steps": [
      "I reopened the original project.",
      "I mapped four visitor questions to sections.",
      "I reviewed the implemented page order.",
      "I tested every navigation item and main action.",
      "I saved the page map and applied it to my own service."
    ]
  },
  {
    "slug": "project-context",
    "number": "03",
    "moduleNumber": "01",
    "module": "Build with Codex",
    "title": "Give Codex content and a visual direction",
    "duration": "45–75 min with practice",
    "summary": "Give your site its own voice and look. Bring your text and images, make a few clear design choices and see how they work on a small screen.",
    "objective": "A consistent website using intentional copy and imagery, with a narrow layout you have reviewed yourself.",
    "steps": [
      "I provided accurate or labelled sample content.",
      "I defined three observable design decisions.",
      "I verified the intended image or text-first layout.",
      "I checked narrow width and keyboard navigation.",
      "I saved the direction and completed an independent refinement."
    ]
  },
  {
    "slug": "editing-with-codex",
    "number": "04",
    "moduleNumber": "01",
    "module": "Build with Codex",
    "title": "Fix problems and continue the same project",
    "duration": "40–60 min with practice",
    "summary": "Something does not work as expected? Learn to show Codex the problem, check the fix and pick up where you left off next time.",
    "objective": "You can report a problem precisely, assess a repair and reopen the project in a later session.",
    "steps": [
      "I distinguished startup from an interaction problem.",
      "I wrote reproducible steps and an expected result.",
      "I reviewed a focused repair or improvement.",
      "I repeated the relevant browser checks.",
      "I saved and tested a project handoff."
    ]
  },
  {
    "slug": "github-account",
    "number": "05",
    "moduleNumber": "02",
    "module": "Save and recover with GitHub",
    "title": "Set up GitHub and understand saved versions",
    "duration": "30–45 min with practice",
    "summary": "Set up a place to keep your website’s history. We will untangle what stays on your computer, what a commit saves and what reaches GitHub.",
    "objective": "You can access the correct GitHub account and explain how the next lesson will connect your local project to an online repository.",
    "steps": [
      "I identified the existing local project.",
      "I verified the GitHub username.",
      "I enabled and checked two-factor authentication and recovery.",
      "I can distinguish commit from push.",
      "I recorded the intended repository and checked for duplicates."
    ]
  },
  {
    "slug": "github-repository",
    "number": "06",
    "moduleNumber": "02",
    "module": "Save and recover with GitHub",
    "title": "Put your existing website on GitHub",
    "duration": "40–60 min with practice",
    "summary": "Your website already exists. Now put that same project on GitHub and check that its files arrived in the right place.",
    "objective": "The correct private GitHub repository contains a verified first version of your website.",
    "steps": [
      "I verified the local folder and remote owner.",
      "I created or reused the intended repository.",
      "I checked exclusions before upload.",
      "I compared the uploaded commit on GitHub.",
      "I recorded the repository, branch and version."
    ]
  },
  {
    "slug": "git-push",
    "number": "07",
    "moduleNumber": "02",
    "module": "Save and recover with GitHub",
    "title": "Save and upload one purposeful change",
    "duration": "35–55 min with practice",
    "summary": "Make one useful change, try it in the browser and save it on GitHub. By the end, you will know where to find that exact version.",
    "objective": "One tested improvement is saved with a meaningful description and appears in the expected GitHub branch.",
    "steps": [
      "I chose one purposeful change.",
      "I tested it locally before upload.",
      "I reviewed the commit scope and description.",
      "I pushed to the intended branch.",
      "I verified the online commit and repeated the workflow."
    ]
  },
  {
    "slug": "computer-workspace",
    "number": "08",
    "moduleNumber": "02",
    "module": "Save and recover with GitHub",
    "title": "Use history to recover a known result",
    "duration": "40–60 min with practice",
    "summary": "Changed your mind about an edit? Practise bringing back the part you liked while keeping the improvements you still want.",
    "objective": "You can identify a known version, practise a narrow reversal and verify a new recovery checkpoint.",
    "steps": [
      "I chose a narrow recovery target.",
      "I found its saved identifier.",
      "I reviewed a preserving recovery approach.",
      "I checked restored and retained behaviour.",
      "I verified the new recovery checkpoint on GitHub."
    ]
  },
  {
    "slug": "vercel-first-deploy",
    "number": "09",
    "moduleNumber": "03",
    "module": "Publish and improve with Vercel",
    "title": "Publish the website from GitHub with Vercel",
    "duration": "40–65 min with practice",
    "summary": "Give your website an address you can open away from your computer. Connect GitHub to Vercel, publish and try the real link.",
    "objective": "A Vercel deployment is connected to the intended repository and its generated website address opens.",
    "steps": [
      "I verified the uploaded version and publishable content.",
      "I imported the correct repository.",
      "I confirmed project settings.",
      "I verified the build and opened the site.",
      "I recorded the environment and three addresses."
    ]
  },
  {
    "slug": "responsive-hero",
    "number": "10",
    "moduleNumber": "03",
    "module": "Publish and improve with Vercel",
    "title": "Test the hosted site like a real visitor",
    "duration": "40–60 min with practice",
    "summary": "See your website as a visitor sees it. Open it on a phone, try it without your usual sign-in and fix one thing that gets in the way.",
    "objective": "A documented visitor test, with issues resolved or clearly recorded as outstanding.",
    "steps": [
      "I tested without my normal sign-in.",
      "I checked the complete public journey.",
      "I recorded phone evidence or its limitation.",
      "I verified repairs on the right deployment.",
      "I saved a visitor checklist."
    ]
  },
  {
    "slug": "nextjs-foundation",
    "number": "11",
    "moduleNumber": "03",
    "module": "Publish and improve with Vercel",
    "title": "Review an update before releasing it",
    "duration": "45–65 min with practice",
    "summary": "Try a change before your visitors see it. Review a separate preview, then publish the version you have actually checked.",
    "objective": "One change is reviewed in preview and verified in production, with the previous version recorded.",
    "steps": [
      "I identified production and its live version.",
      "I used a separate branch.",
      "I reviewed the matching preview.",
      "I released and verified production.",
      "I saved the recovery reference."
    ]
  },
  {
    "slug": "environment-variables",
    "number": "12",
    "moduleNumber": "03",
    "module": "Publish and improve with Vercel",
    "title": "Set up your address and environment settings",
    "duration": "40–70 min with practice",
    "summary": "Choose the address people will use and organise the settings your site needs. You can keep the address Vercel gave you for this course.",
    "objective": "A verified canonical website address and a non-secret configuration checklist for the upcoming Supabase connection.",
    "steps": [
      "I chose and tested the canonical address.",
      "I completed or deliberately skipped the domain step.",
      "I can distinguish content and configuration.",
      "I recorded names and environments without secrets.",
      "I saved the integration handoff."
    ]
  },
  {
    "slug": "supabase-project",
    "number": "13",
    "moduleNumber": "04",
    "module": "Connect accounts and data with Supabase",
    "title": "Connect the website to the right Supabase project",
    "duration": "45–70 min with practice",
    "summary": "Prepare your site for client accounts and saved requests. Create a Supabase project and ask Codex to connect it to the website you already built.",
    "objective": "The existing website uses the intended Supabase project configuration and is ready for sign-in, without pretending a database connection alone is a finished feature.",
    "steps": [
      "I defined the client-area purpose.",
      "I created or selected the dedicated learning project.",
      "I distinguished public configuration and secrets.",
      "I verified the local connection setup and public site.",
      "I recorded hosted configuration destinations without credentials."
    ]
  },
  {
    "slug": "supabase-auth",
    "number": "14",
    "moduleNumber": "04",
    "module": "Connect accounts and data with Supabase",
    "title": "Build and test the complete sign-in journey",
    "duration": "60–90 min with practice",
    "summary": "Let a client sign in, sign out and recover a forgotten password. Try each path yourself, including what happens when someone opens a private page without signing in.",
    "objective": "A test visitor can create an account, confirm it when required, sign in, recover access and sign out; a signed-out visitor cannot open the private page.",
    "steps": [
      "I mapped the full account flow.",
      "I configured the intended provider and return URLs.",
      "I verified actual email delivery.",
      "I tested registration, sign-in, error and recovery.",
      "I verified sign-out and direct private-page denial."
    ]
  },
  {
    "slug": "data-model",
    "number": "15",
    "moduleNumber": "04",
    "module": "Connect accounts and data with Supabase",
    "title": "Save a client request and keep it private",
    "duration": "60–90 min with practice",
    "summary": "Let clients save a request and find it when they return. Use two test accounts to check that each person’s requests stay private.",
    "objective": "A signed-in visitor can save and reopen a session request, while another account and a signed-out visitor cannot access it.",
    "steps": [
      "I defined a minimal useful record and owner rule.",
      "I verified the database setup in the intended project.",
      "I tested save, refresh and invalid input.",
      "I used separate sessions for accounts A and B.",
      "I verified forbidden operations at the data boundary.",
      "I checked truthful empty, saving and failure states."
    ]
  },
  {
    "slug": "client-space",
    "number": "16",
    "moduleNumber": "04",
    "module": "Connect accounts and data with Supabase",
    "title": "Launch and verify the complete website",
    "duration": "60–90 min with practice",
    "summary": "Bring the whole website together. Publish it, walk through the client experience and leave yourself a clear guide for the next update.",
    "objective": "A hosted website with verified public pages, account access and private persistent requests, plus a clear record of what is ready and any remaining limitations.",
    "steps": [
      "I reviewed the release scope and sample content.",
      "I verified the production service mapping.",
      "I published and identified the intended version.",
      "I completed the hosted public-to-private journey.",
      "I verified recovery and private-data boundaries online.",
      "I recorded mobile checks and resolved required release blockers.",
      "I saved the handover and a next-task brief."
    ]
  }
];
const courseModules = [{"number":"01","title":"Build with Codex"},{"number":"02","title":"Save and recover with GitHub"},{"number":"03","title":"Publish and improve with Vercel"},{"number":"04","title":"Connect accounts and data with Supabase"}];
export const modules=courseModules.map(module=>({...module,lessons:lessons.filter(lesson=>lesson.moduleNumber===module.number)}));
export const findLesson=(slug:string)=>lessons.find(lesson=>lesson.slug===slug);
