// Static-hosting calculator calls (web/api.js). Run with: node --test
// api.js is a classic browser script; it is loaded into a sandbox with a stand-in Worker that records
// what the page sends, so each test decides how and in what order the engine replies.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load() {
  const workers = [];
  class Worker {
    constructor(url, options) { Object.assign(this, {url, options, sent: []}); workers.push(this); }
    postMessage(message) { this.sent.push(message); }
    reply(data) { this.onmessage({data}); }
    crash() { this.onerror({preventDefault() {}}); }
  }
  const context = vm.createContext({Worker, location: {hostname: 'example.github.io'}, JSON, Map, Promise, Error});
  vm.runInContext(readFileSync(new URL('web/api.js', import.meta.url), 'utf8'), context);
  return {api: vm.runInContext('api', context), workers};
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('replies reach the call that asked, even out of order, through one module worker', async () => {
  const {api, workers} = load();
  const first = api('/calculate', {a: 1}), second = api('/salary', {salary: '1'});
  await tick();
  assert.equal(workers.length, 1);
  assert.equal(workers[0].url, 'engine-worker.js');
  assert.equal(workers[0].options.type, 'module');
  const [one, two] = workers[0].sent;
  assert.deepEqual([one.path, JSON.parse(one.body)], ['/calculate', {a: 1}]);
  workers[0].reply({id: two.id, status: 400, text: '{"error":"bad salary"}'});
  workers[0].reply({id: one.id, status: 200, text: '{"months":3}'});
  assert.deepEqual(JSON.parse(JSON.stringify(await first)), {ok: true, data: {months: 3}});
  assert.deepEqual(JSON.parse(JSON.stringify(await second)), {ok: false, data: {error: 'bad salary'}});
});

test('an engine error rejects only its own call', async () => {
  const {api, workers} = load();
  const failing = api('/calculate', {}), other = api('/calculate', {});
  await tick();
  const [bad, good] = workers[0].sent;
  workers[0].reply({id: bad.id, error: 'Calculator unavailable. Please refresh.'});
  await assert.rejects(failing, {message: 'Calculator unavailable. Please refresh.'});
  workers[0].reply({id: good.id, status: 200, text: '{}'});
  assert.equal((await other).ok, true);
});

test('a crashed worker fails every waiting call and the next call starts a new worker', async () => {
  const {api, workers} = load();
  const waiting = [api('/calculate', {}), api('/rrsp', {})];
  await tick();
  workers[0].crash();
  for (const call of waiting) await assert.rejects(call, {message: 'Calculator unavailable. Please refresh.'});
  const retry = api('/calculate', {});
  await tick();
  assert.equal(workers.length, 2);
  workers[1].reply({id: workers[1].sent[0].id, status: 200, text: '{"months":1}'});
  assert.equal((await retry).data.months, 1);
});
