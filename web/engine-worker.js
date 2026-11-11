// Runs the Python engine (Pyodide) off the page's main thread, so loading and compiling it
// never freezes the page. Only api.js talks to this worker, and only on static hosting.
// The app/ package sits alongside web/ in the static site.
// The import is dynamic so a failed engine download reaches the page as a normal error reply.
const ready = (async () => {
  const {loadPyodide} = await import('https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs');
  const pyodide = await loadPyodide();
  pyodide.FS.mkdir('/home/pyodide/app');
  for (const name of ['__init__.py', 'payoff.py', 'tax_tools.py', 'api.py']) {
    const response = await fetch(new URL(`../app/${name}`, self.location));
    if (!response.ok) throw new Error('Calculator unavailable. Please refresh.');
    pyodide.FS.writeFile(`/home/pyodide/app/${name}`, await response.text());
  }
  return pyodide.pyimport('app.api').respond;
})();

self.onmessage = async ({data: {id, path, body}}) => {
  try {
    const [status, text] = (await ready)(path, body).toJs();
    self.postMessage({id, status, text});
  } catch (error) {
    self.postMessage({id, error: error.message});
  }
};
