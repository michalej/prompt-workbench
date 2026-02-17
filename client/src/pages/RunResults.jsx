import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import ResultPanel from '../components/ResultPanel';
import ValidationPanel from '../components/ValidationPanel';

export default function RunResults() {
  const { id, runId } = useParams();
  const [run, setRun] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    api.getRun(runId).then(setRun);

    const es = api.streamRun(runId);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.done) {
        es.close();
        api.getRun(runId).then(setRun);
        return;
      }
      // Update individual result
      setRun(prev => {
        if (!prev) return prev;
        const results = [...prev.results];
        if (data.index !== undefined) {
          results[data.index] = { ...results[data.index], ...data };
        }
        return { ...prev, results };
      });
    };
    es.onerror = () => es.close();

    return () => es.close();
  }, [runId]);

  const validate = async () => {
    setValidating(true);
    try {
      const schema = run.models?.[0]?.outputSchema;
      const result = await api.validate({ runId, schema });
      setRun(prev => ({ ...prev, validation: { enabled: true, results: result.results } }));
    } catch (err) {
      alert(err.message);
    }
    setValidating(false);
  };

  if (!run) return <div className="text-center text-gray-500 py-20">Loading results...</div>;

  const allDone = run.results.every(r => r.status === 'completed' || r.status === 'failed');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/prompt/${id}`} className="text-gray-500 hover:text-gray-300 transition-colors">← Back to Editor</Link>
        <h1 className="text-xl font-bold text-gray-200 flex-1">Test Run Results</h1>
        {allDone && (
          <button onClick={validate} disabled={validating} className="btn-secondary">
            {validating ? '⏳ Validating...' : '🔍 Validate All'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
        <span>Variables: {Object.entries(run.variables || {}).map(([k, v]) => `${k}="${v}"`).join(', ') || 'none'}</span>
        <span className="ml-auto">{new Date(run.createdAt).toLocaleString()}</span>
      </div>

      <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${Math.min(run.results.length, 4)}, 1fr)` }}>
        {run.results.map((r, i) => (
          <div key={i} className="min-h-[400px]">
            <ResultPanel result={r} />
          </div>
        ))}
      </div>

      {run.validation?.results?.length > 0 && (
        <div className="card">
          <ValidationPanel validation={run.validation} />
        </div>
      )}
    </div>
  );
}
