import sys, pathlib, zipfile, json
root=pathlib.Path('.translation-work').resolve()
sys.path.insert(0,str(root/'python'))
with zipfile.ZipFile(root/'en-ru.argosmodel') as z:
    z.extractall(root/'model')
print(list((root/'model').glob('*')))
for f in (root/'model').rglob('metadata.json'): print(f.read_text())
import ctranslate2, sentencepiece as spm
folder=next((root/'model').glob('*'))
print([str(p.relative_to(folder)) for p in folder.iterdir()])
sp=spm.SentencePieceProcessor(model_file=str(folder/'sentencepiece.model'))
translator=ctranslate2.Translator(str(folder/'model'),device='cpu',compute_type='int8',inter_threads=2,intra_threads=4)
sentences=['Open the Owner selector. Choose your personal account for this course project.','Open the ZXQ0 selector. Choose your personal account for this course project.','Confirm the project URL and publishable key. Never use a secret key in browser configuration.']
for s in sentences:
 out=translator.translate_batch([sp.encode(s,out_type=str)],beam_size=4)
 print(s, '=>',sp.decode(out[0].hypotheses[0]))
