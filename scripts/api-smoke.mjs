import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
let cookie='';
async function call(action,body,auth=true){const r=await fetch(base+'/api/'+action,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(auth?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();return{r,data};}
assert.equal((await call('state',undefined,false)).r.status,401);
const login=await call('demo',{});assert.equal(login.r.status,200);cookie=login.r.headers.get('set-cookie').split(';')[0];
assert.equal((await call('me')).data.demo,true);
assert.equal((await call('question',{unit:'m1d',difficulty:1,demo:false})).r.status,503);
const {data:q,r}=await call('question',{unit:'m1d',difficulty:1,demo:true});assert.equal(r.status,200);assert.ok(q.id&&q.prompt);assert.ok(!('answer'in q)&&!('solution'in q)&&!('steps'in q));
const first=await call('answer',{id:q.id,answer:'0'});assert.equal(first.data.verdict,'incorrect');
const duplicate=await call('answer',{id:q.id,answer:'3'});assert.equal(duplicate.data.id,first.data.id);assert.equal(duplicate.data.answer,'0');
const state=(await call('state')).data;assert.equal(state.attempts.filter(a=>a.question.id===q.id).length,1);const review=state.reviews.find(r=>(r.question.originId||r.question.id)===(q.originId||q.id));assert.ok(review);
const retry=(await call('review',{id:review.id,operation:'retry'})).data;assert.equal(retry.originId,q.originId||q.id);assert.ok(!retry.solution);
const correct=(await call('answer',{id:retry.id,answer:'6/2'})).data;assert.equal(correct.verdict,'correct');assert.ok(correct.solution.steps.length>=2);
await call('feedback',{id:q.id,kind:'report'});const after=(await call('state')).data;assert.ok(after.attempts.find(a=>a.id===first.data.id).revoked);assert.ok(!after.reviews.some(r=>(r.question.originId||r.question.id)===(q.originId||q.id)));
assert.equal((await call('question',{unit:'chi',difficulty:1,demo:true})).r.status,400);
assert.equal((await call('answer',{id:crypto.randomUUID(),answer:'1'})).r.status,404);
console.log('PASS: 11 API checks (unauthenticated access, missing Gemini, solution isolation, grading, idempotency, review, equivalent answer, correction, invalid unit/ownership). Test questions marked reported.');
