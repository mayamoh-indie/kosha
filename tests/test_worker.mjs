// Offline check of static-hosting paths and the package loaded by the browser worker.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load(missing = false) {
  const files = new Map(), urls = [], replies = [];
  const workerUrl = new URL('https://example.github.io/kosha_wellness/web/engine-worker.js');
  const context = vm.createContext({
    URL,
    self: {location: workerUrl, postMessage: value => replies.push(value)},
    fetch: async url => {
      urls.push(url.pathname);
      const path = url.pathname.replace('/kosha_wellness/', '../');
      return {ok: !missing, text: async () => readFileSync(new URL(path, import.meta.url), 'utf8')};
    },
    fakeLoadPyodide: async () => ({
      FS: {mkdir: path => files.set(path, null), writeFile: (path, body) => files.set(path, body)},
      pyimport: name => {
        assert.equal(name, 'app.api');
        for (const file of ['__init__.py', 'payoff.py', 'tax_tools.py', 'api.py']) {
          assert.ok(files.has('/home/pyodide/app/' + file), file);
        }
        return {respond: (path, body) => ({toJs: () => [200, JSON.stringify({path, body})]})};
      },
    }),
  });
  // Replace only the external Pyodide import with the offline stand-in above.
  const source = readFileSync(new URL('../web/engine-worker.js', import.meta.url), 'utf8')
    .replace("import('https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs')", '({loadPyodide:fakeLoadPyodide})');
  vm.runInContext(source, context);
  return {context, urls, replies};
}

test('static worker loads the relocated package and routes a response', async () => {
  const {context, urls, replies} = load();
  await context.self.onmessage({data: {id: 7, path: '/calculate', body: '{}'}});
  assert.deepEqual(urls, ['__init__.py', 'payoff.py', 'tax_tools.py', 'api.py']
    .map(file => '/kosha_wellness/app/' + file));
  assert.equal(replies[0].id, 7);
  assert.equal(replies[0].status, 200);
  assert.deepEqual(JSON.parse(replies[0].text), {path: '/calculate', body: '{}'});
});

test('a missing engine file reports an error to the waiting request', async () => {
  const {context, replies} = load(true);
  await context.self.onmessage({data: {id: 8, path: '/salary', body: '{}'}});
  assert.equal(replies[0].id, 8);
  assert.match(replies[0].error, /Calculator unavailable/);
});
