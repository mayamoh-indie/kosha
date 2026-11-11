// Runs the Python engine (Pyodide) off the page's main thread, so loading and compiling it
// never freezes the page. Only api.js talks to this worker, and only on static hosting.
// Repository-root files (engine): on GitHub Pages they sit one level above web/, where this worker lives.
// The import is dynamic so a failed engine download reaches the page as a normal error reply.
const ready = (async () => {
  const {loadPyodide} = await import('https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs');
  const pyodide = await loadPyodide();
  for (const name of ['payoff.py', 'tax_tools.py', 'api.py']) {
    const response = await fetch(new URL(`../${name}`, self.location));
    if (!response.ok) throw new Error('Calculator unavailable. Please refresh.');
    pyodide.FS.writeFile(`/home/pyodide/${name}`, await response.text());
  }
  return pyodide.pyimport('api').respond;
})();

self.onmessage = async ({data: {id, path, body}}) => {
  try {
    const [status, text] = (await ready)(path, body).toJs();
    self.postMessage({id, status, text});
  } catch (error) {
    self.postMessage({id, error: error.message});
  }
};
