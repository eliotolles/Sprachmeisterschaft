import test from 'node:test';
import assert from 'node:assert/strict';
import { createElioClient } from '../src/core/elio/client.js';
const user = { id: 'alice', email: 'alice@example.invalid', role: 'user' };
test('compatibility client stores no credentials and serializes optimistic progress writes', async () => {
  const requests = []; let revision = 0;
  const client = createElioClient({ fetcher: async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/auth/login')) return Response.json({ user });
    assert.equal(options.credentials, 'same-origin'); assert.equal(options.headers['X-Elio-User'], 'alice');
    if (options.method === 'GET') return Response.json({ userId: 'alice', records: {} });
    const data = JSON.parse(options.body); assert.equal(data.version, revision); revision++;
    return Response.json({ userId: 'alice', version: revision });
  } });
  await client.login(user.email, 'fixture-password');
  const value = { repetitions: 1 }; const first = client.saveState('srs', value); value.repetitions = 99;
  await Promise.all([first, client.saveState('srs', { repetitions: 2 })]);
  const bodies = requests.filter(x => x.options.method === 'PUT').map(x => JSON.parse(x.options.body));
  assert.deepEqual(bodies.map(x => x.value.repetitions), [1, 2]);
  assert(!JSON.stringify(client.getUser()).includes('fixture-password'));
});
test('version conflict is exposed without retrying or overwriting newer progress', async () => {
  let puts = 0;
  const client = createElioClient({ fetcher: async (url, options) => {
    if (url.endsWith('/auth/login')) return Response.json({ user });
    if (options.method === 'GET') return Response.json({ userId: 'alice', records: { srs: { value: {}, version: 3 } } });
    puts++; return Response.json({ code: 'VERSION_CONFLICT', error: 'Conflict', latest: { version: 4, value: { newer: true } } }, { status: 409 });
  } });
  await client.login(user.email, 'fixture-password');
  await assert.rejects(client.saveState('srs', { old: true }), error => error.code === 'VERSION_CONFLICT' && error.latest.version === 4);
  assert.equal(puts, 1);
});
test('late previous-account response never overwrites a newer login', async () => {
  let finish;
  const client = createElioClient({ fetcher: async (url, options) => {
    const email = JSON.parse(options.body).email;
    if (email.startsWith('slow')) return new Promise(resolve => { finish = () => resolve(Response.json({ user: { ...user, id: 'old' } })); });
    return Response.json({ user: { ...user, id: 'new' } });
  } });
  const old = client.login('slow@example.invalid', 'fixture-password');
  await client.login('new@example.invalid', 'fixture-password'); finish();
  await assert.rejects(old, error => error.code === 'ACCOUNT_CHANGED');
  assert.equal(client.getUser().id, 'new');
});
test('review client serializes grades and advances only confirmed server revisions',async()=>{
  let revision=0;const grades=[];
  const client=createElioClient({fetcher:async(url,options)=>{
    if(url.endsWith('/auth/login'))return Response.json({user});
    if(options.method==='GET')return Response.json({userId:'alice',records:{}});
    const data=JSON.parse(options.body);assert.equal(data.version,revision);revision++;grades.push(data.rating);
    return Response.json({userId:'alice',sourceId:data.sourceId,version:revision,review:{repetitions:revision}});
  }});
  await client.login(user.email,'fixture-password');
  await Promise.all([client.reviewVocabulary('source','good'),client.reviewVocabulary('source','easy')]);
  assert.deepEqual(grades,['good','easy']);assert.equal(revision,2);
});
test('grammar client sends source fingerprints and serializes confirmed attempt revisions',async()=>{
  let revision=0;const answers=[];
  const client=createElioClient({fetcher:async(url,options)=>{
    if(url.endsWith('/auth/login'))return Response.json({user});
    if(options.method==='GET')return Response.json({userId:'alice',records:{}});
    const data=JSON.parse(options.body);assert.equal(data.version,revision);assert.equal(data.revision,'source-revision');revision++;answers.push(data.answer);
    return Response.json({userId:'alice',lessonId:data.lessonId,version:revision,feedback:{correct:false}});
  }});
  await client.login(user.email,'fixture-password');
  const common={collectionId:'collection',lessonId:'lesson',exerciseId:'exercise',revision:'source-revision'};
  await Promise.all([client.submitGrammar({...common,answer:'first'}),client.submitGrammar({...common,answer:'second'})]);
  assert.deepEqual(answers,['first','second']);assert.equal(revision,2);
});
