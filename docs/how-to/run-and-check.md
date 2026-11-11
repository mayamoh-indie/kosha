# Run and check Kosha

Run commands from the repository root. Python 3.9 or newer is required; the Python engine has no external runtime dependencies. Node 18 or newer runs the JavaScript tests.

## Local dashboard

```sh
python -m app.dashboard
```

The root `dashboard.py` is kept as a small compatibility launcher for existing local launch configurations.

Open http://127.0.0.1:8765. Stop with Ctrl+C. The server binds only to loopback, rejects untrusted hosts and origins, and is for local development. The dashboard calls the local Python API.

## Command-line calculator

```sh
python -m app.payoff data/sample-debts.json
python -m app.payoff data/sample-debts.json --budget 800 --strategy avalanche
python -m app.payoff data/sample-debts.json --json
```

The sample is fictional. See the [input format, calculation rules and exit codes](../reference/debt-calculations.md). The command line does not read the dashboard's one-time extra payments.

## Tests and lint

```sh
python -m unittest -v
node --test tests/*.mjs
python -m pip install ruff==0.17.4
python -m ruff check .
```

For a focused check, use `python -m unittest tests.test_dashboard -v` or `node --test tests/test_finance.mjs`. Python discovers the tests package from the repository root. The pipeline also checks each `web/*.js` file with `node --check`.

## Static hosting

The root `index.html` forwards to `web/`. The browser downloads Pyodide and the calculation package under `app/`; calculations run in a Web Worker. The first visit requires network access to download Pyodide (about 10 MB). Keep `app/`, `data/` and `web/` together when publishing.

## Pipeline

[`.github/workflows/pipeline.yml`](../../.github/workflows/pipeline.yml) runs on every push and pull request. See each run as a stage graph in the Actions tab:

1. **Test**: the Python and JavaScript regression tests.
2. **Code review**, two jobs in parallel: Ruff lint for Python (settings in `ruff.toml`) plus a JavaScript syntax check, and a CodeQL security scan that fails on any finding.
3. **Build**: collects the site files (`web/`, the engine modules, sample data).
4. **Deploy**: on `main` only, after every stage passes, publishes to the `gh-pages` branch. GitHub Pages serves that branch (Settings → Pages → Deploy from a branch → `gh-pages`, `/ (root)`).

Pull requests stop after Build, so problems show before merging. To lint locally: `pip install ruff==0.17.4 && ruff check .`


## Folder map

| Folder | Contents |
| --- | --- |
| `app/` | Python calculations, request handling and local dashboard server |
| `web/` | Browser pages, styles, scripts and calculation worker |
| `data/` | Fictional sample input |
| `tests/` | Python and JavaScript regression tests |
| `docs/how-to/` | App walkthroughs and development commands |
| `docs/reference/` | Calculation assumptions, tax sources and project notes |
| `reviews/` | Recorded model reviews and their verification limits |
| `.github/` | CI workflow and pull-request template |

Project rules remain in [AGENTS.md](../../AGENTS.md). Historical review reports retain paths and commands from their reviewed commits.
