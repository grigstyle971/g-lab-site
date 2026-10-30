import sys,pathlib,json,re,time
sys.stdout.reconfigure(encoding='utf-8')
root=pathlib.Path('.translation-work').resolve();sys.path.insert(0,str(root/'python'))
import ctranslate2,sentencepiece as spm
folder=root/'model/translate-en_ru-1_9';sp=spm.SentencePieceProcessor(model_file=str(folder/'sentencepiece.model'))
engine=ctranslate2.Translator(str(folder/'model'),device='cpu',compute_type='int8',inter_threads=2,intra_threads=4)
texts=json.loads((root/'source-strings.json').read_text(encoding='utf-8'))
terms=['Codex','GitHub','Vercel','Supabase','Next.js','ChatGPT','New repository','Create repository','Create a new repository','Repository name','Add New','Import Git Repository','Configure GitHub App','Root Directory','Project Name','Environment Variables','Add Domain','New project','Database Password','API Keys','Publishable key','Secret keys','URL Configuration','Site URL','Redirect URLs','Add URL','Table Editor','SQL Editor','Password and authentication','Your profile','Continue with GitHub','Create an account','Continue with Email','Sign Up','Sign up','Sign in','Work mode','File Explorer','Finder','New Folder','Open original image','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEYS','CLIENT_KEY','SMTP','HTTPS','HTTP','DNS','SQL','API','Git']
regex=re.compile(r'https?://[^\s)]+|\b(?:[A-Z][A-Z_]{2,}|localhost|anna-first-site|service_role)\b|\b(?:'+ '|'.join(re.escape(t) for t in sorted(terms,key=len,reverse=True))+r')\b')
ambiguous=['Owner','Private','Production','Preview','Ready','Building','Queued','Error','Project','Projects','Import','Deploy','Deployments','Connect','Settings','Authentication','Users','Code','Run','Build','Save','Key','Value','Domains','Organization','Region','Environments','Visit']
amb=re.compile(r'\b(?:'+'|'.join(ambiguous)+r')\b')
def protect(text):
 found=[]
 def save(m):
  found.append(m.group());return 'ZXQ'+str(len(found)-1)
 text=regex.sub(save,text)
 def label(m):
  before=text[max(0,m.start()-25):m.start()];after=text[m.end():]
  if text==m.group() or re.search(r'(?:the |click |choose |select |labelled |labeled |→ |"|“)$',before,re.I) or re.match(r'(?: button| selector| field| menu| tab| →|"|”)',after):return save(m)
  return m.group()
 return amb.sub(label,text),found

def run(batch):
 enc=[sp.encode(x,out_type=str) for x in batch]
 out=engine.translate_batch(enc,beam_size=4,max_decoding_length=1024,max_batch_size=4096,batch_type='tokens')
 return [sp.decode(x.hypotheses[0]) for x in out]
output={};issues=[];start=time.time()
for pos in range(0,len(texts),32):
 batch=texts[pos:pos+32];protected=[protect(x) for x in batch]
 translated=run([p[0] for p in protected])
 for original,result,(_,names) in zip(batch,translated,protected):
  missing=[]
  for i,name in enumerate(names):
   pat=re.compile(r'ZXQ\s*'+str(i)+r'(?!\d)',re.I)
   if not pat.search(result):missing.append(name)
   result=pat.sub(lambda m:name,result)
  if missing:issues.append({'source':original,'translation':result,'missing':missing})
  output[original]=result
 pathlib.Path('lib/i18n/ru.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
 (root/'translation-issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2),encoding='utf-8')
 print(f'{min(pos+32,len(texts))}/{len(texts)} translated; {len(issues)} terminology checks; {round(time.time()-start)}s',flush=True)
print('COMPLETE',flush=True)
