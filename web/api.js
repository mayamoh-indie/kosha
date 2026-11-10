// Locally, dashboard.py answers API calls. On static hosting (GitHub Pages, served straight
// from the repository with pages under web/), the same Python engine runs in the browser
// through Pyodide, so inputs never leave the page.
const LOCAL = ['127.0.0.1', 'localhost'].includes(location.hostname);
// Repository-root files (engine and sample data): dashboard.py serves them at /, Pages one level up.
const REPO_ROOT = LOCAL ? '/' : '../';
let engine;

async function loadEngine() {
  const {loadPyodide} = await import('https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs');
  const pyodide = await loadPyodide();
  for (const name of ['payoff.py', 'tax_tools.py', 'api.py']) {
    const response = await fetch(REPO_ROOT + name);
    if (!response.ok) throw new Error('Calculator unavailable. Please refresh.');
    pyodide.FS.writeFile(`/home/pyodide/${name}`, await response.text());
  }
  return pyodide.pyimport('api').respond;
}

async function api(path, payload) {
  const body = JSON.stringify(payload);
  if (LOCAL) {
    const response = await fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body});
    return {ok: response.ok, data: await response.json()};
  }
  engine ??= loadEngine();
  const [status, text] = (await engine)(path, body).toJs();
  return {ok: status === 200, data: JSON.parse(text)};
}
