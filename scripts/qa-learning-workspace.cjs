const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema auth,public to anon,authenticated,service_role;`);
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',owner='33333333-3333-4333-8333-333333333333';
await db.query('insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())',[a,'a@example.com',b,'b@example.com',owner,'grigstyle971@gmail.com']);
for(const file of ['202609050001_course_accounts.sql','202609060001_manual_course_access.sql','202609060002_owner_access_panel.sql','202609060003_learning_workspace.sql','202609240001_gumroad_course_payments.sql','202609240002_gumroad_pay_after_signup.sql']){
await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
if(file==='202609060003_learning_workspace.sql'){
await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
assert.equal((await db.query("select course_can_study('welcome') as allowed")).rows[0].allowed,false,'The original workspace migration must not expose a free lesson');
await assert.rejects(db.query("select send_course_feedback('welcome','Step 1','Not enrolled')"),e=>e.code==='42501');
await db.exec('reset role');
}
}
async function login(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
const note={notes:'My own project',url:'https://example.com',answers:{0:1},practiceChecks:['I checked the main action and refreshed the page.']};
await login(a);assert.equal((await db.query("select course_can_study('welcome') as allowed")).rows[0].allowed,false);await assert.rejects(db.query('select save_course_notebook($1,$2,$3)',['welcome',JSON.stringify(note),0]),e=>e.code==='42501');await db.exec('reset role');await db.query("insert into course_enrollments(user_id,course_id,active) values($1,'build-with-codex',true)",[a]);
await login(a);
assert.equal((await db.query('select save_course_notebook($1,$2,$3) as revision',['welcome',JSON.stringify(note),0])).rows[0].revision,1);
await assert.rejects(db.query('select save_course_notebook($1,$2,$3)',['welcome',JSON.stringify({...note,notes:'stale'}),0]),e=>e.code==='40001');
assert.equal((await db.query('select content from course_notebooks')).rows[0].content.notes,note.notes);
assert.deepEqual((await db.query('select content from course_notebooks')).rows[0].content.practiceChecks,note.practiceChecks);
assert.equal((await db.query("select course_can_study('client-space') as allowed")).rows[0].allowed,true);
await assert.rejects(db.query("select owner_course_students('',null)"),e=>e.code==='42501');
await assert.rejects(db.query('select owner_course_feedback(false)'),e=>e.code==='42501');
await login(b);assert.equal((await db.query('select * from course_notebooks')).rows.length,0);await assert.rejects(db.query('select save_course_notebook($1,$2,$3)',['welcome',JSON.stringify(note),0]),e=>e.code==='42501');
await assert.rejects(db.query("insert into course_notebooks(user_id,lesson_slug,content) values($1,'welcome','{}')",[a]),e=>e.code==='42501');
await assert.rejects(db.query('select save_course_notebook($1,$2,$3)',['welcome',JSON.stringify({...note,notes:'B only'}),0]),e=>e.code==='42501');
await login(a);assert.equal((await db.query('select content from course_notebooks')).rows[0].content.notes,'My own project');
await db.query('select send_course_feedback($1,$2,$3)',['welcome','Step 1','The button label is unclear']);
await assert.rejects(db.query('select * from course_feedback'),e=>e.code==='42501');
await db.query('select send_course_feedback($1,$2,$3)',['client-space','Step 1','Enrolled access works']);
for(let i=0;i<8;i++)await db.query('select send_course_feedback($1,$2,$3)',['welcome','Step 2','Question '+i]);
await assert.rejects(db.query('select send_course_feedback($1,$2,$3)',['welcome','Step 2','Too many']),e=>e.code==='P0001');
await login(owner);
const students=(await db.query("select owner_course_students('a@example.com',null) as rows")).rows[0].rows;assert.equal(students.length,1);assert.equal(students[0].id,a);
assert.equal((await db.query("select owner_course_students('%',null) as rows")).rows[0].rows.length,0);
const feedback=(await db.query('select owner_course_feedback(false) as rows')).rows[0].rows;assert.equal(feedback.length,10);
await db.query('select owner_resolve_feedback($1,true)',[feedback[0].id]);assert.equal((await db.query('select owner_course_feedback(true) as rows')).rows[0].rows.length,1);
await db.query("select owner_set_course_access('a@example.com',true,'Test')");await login(a);await db.query('select save_course_notebook($1,$2,$3)',['client-space',JSON.stringify(note),0]);
await login(owner);await db.query("select owner_set_course_access('a@example.com',false,'Test revoked')");await login(a);assert.equal((await db.query("select * from course_notebooks where lesson_slug='client-space'")).rows.length,0);
await assert.rejects(db.query('select owner_resolve_feedback($1,false)',[feedback[0].id]),e=>e.code==='42501');
await db.exec('reset role;set role anon');await assert.rejects(db.query("select owner_course_students('',null)"));await assert.rejects(db.query('select * from course_notebooks'));
console.log('PASS: all migrations, private notebooks, revision conflicts, course access, feedback limits, owner search and feedback resolution, revoked and anonymous access.');
}finally{await db.close()}})();
