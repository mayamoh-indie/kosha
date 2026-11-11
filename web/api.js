// Locally, app/dashboard.py answers API calls. On static hosting (GitHub Pages, served straight
// from the repository with pages under web/), the same Python engine runs in the browser
// through Pyodide, so inputs never leave the page. Pyodide runs in engine-worker.js, off the
// main thread, because loading and compiling it would otherwise freeze the page for seconds.
const LOCAL = ['127.0.0.1', 'localhost'].includes(location.hostname);
// Repository root: the local server serves it at /; Pages keeps web/ one level below.
const REPO_ROOT = LOCAL ? '/' : '../';
let worker, nextId = 0;
const pending = new Map();  // request id -> {resolve, reject}; replies can arrive in any order

function startWorker() {
  worker = new Worker('engine-worker.js', {type: 'module'});
  worker.onmessage = ({data}) => {
    const request = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error)); else request.resolve(data);
  };
  // The worker script itself failed (for example the engine download was blocked): fail every
  // waiting call, and start a fresh worker on the next call.
  worker.onerror = event => {
    event.preventDefault();
    for (const request of pending.values()) request.reject(new Error('Calculator unavailable. Please refresh.'));
    pending.clear();
    worker = null;
  };
}

async function api(path, payload) {
  const body = JSON.stringify(payload);
  if (LOCAL) {
    const response = await fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body});
    return {ok: response.ok, data: await response.json()};
  }
  if (!worker) startWorker();
  const id = nextId++;
  const {status, text} = await new Promise((resolve, reject) => {
    pending.set(id, {resolve, reject});
    worker.postMessage({id, path, body});
  });
  return {ok: status === 200, data: JSON.parse(text)};
}
