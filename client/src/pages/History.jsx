import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function History() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [selected, setSelected] = useState(null);
  const [diffA, setDiffA] = useState(null);
  const [diffB, setDiffB] = useState(null);

  useEffect(() => {
    api.getPrompt(id).then(p => {
      setPrompt(p);
      if (p.versions?.length) setSelected(p.versions[p.versions.length - 1]);
    });
  }, [id]);

  if (!prompt) return <div className="text-center text-gray-500 py-20">Loading...</div>;

  const versions = [...(prompt.versions || [])].reverse();
  const showDiff = diffA && diffB;

  const renderDiff = (textA, textB) => {
    const linesA = (textA || '').split('\n');
    const linesB = (textB || '').split('\n');
    const maxLen = Math.max(linesA.length, linesB.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const a = linesA[i] || '';
      const b = linesB[i] || '';
      if (a !== b) {
        if (a) result.push({ type: 'removed', text: a });
        if (b) result.push({ type: 'added', text: b });
      } else {
        result.push({ type: 'same', text: a });
      }
    }
    return result;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/prompt/${id}`} className="text-gray-500 hover:text-gray-300 transition-colors">← Back to Editor</Link>
        <h1 className="text-xl font-bold text-gray-200">Version History — {prompt.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Versions</h3>
          {versions.map(v => (
            <div
              key={v.version}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selected?.version === v.version
                  ? 'border-indigo-500/50 bg-indigo-600/10'
                  : 'border-transparent hover:bg-navy-800'
              }`}
              onClick={() => { setSelected(v); setDiffA(null); setDiffB(null); }}
            >
              <div className="flex items-center gap-2">
                <span className="badge bg-indigo-600/20 text-indigo-400">v{v.version}</span>
                <span className="text-sm text-gray-300 flex-1">{v.note}</span>
                <input
                  type="checkbox"
                  className="accent-indigo-500"
                  checked={diffA?.version === v.version || diffB?.version === v.version}
                  onChange={e => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      if (!diffA) setDiffA(v);
                      else if (!diffB) setDiffB(v);
                    } else {
                      if (diffA?.version === v.version) setDiffA(null);
                      if (diffB?.version === v.version) setDiffB(null);
                    }
                  }}
                  title="Select for diff"
                />
              </div>
              <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          {showDiff ? (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-gray-400">
                Diff: v{diffA.version} → v{diffB.version}
              </h3>
              {['systemPrompt', 'userPrompt'].map(field => {
                const lines = renderDiff(diffA[field], diffB[field]);
                return (
                  <div key={field}>
                    <h4 className="text-xs uppercase text-gray-500 mb-2">{field === 'systemPrompt' ? 'System Prompt' : 'User Prompt'}</h4>
                    <div className="font-mono text-xs space-y-0.5">
                      {lines.map((l, i) => (
                        <div key={i} className={`px-2 py-0.5 rounded ${
                          l.type === 'added' ? 'bg-emerald-900/30 text-emerald-400' :
                          l.type === 'removed' ? 'bg-red-900/30 text-red-400 line-through' :
                          'text-gray-400'
                        }`}>
                          {l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  '}{l.text}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : selected ? (
            <div className="card space-y-4">
              <div className="flex items-center gap-3">
                <span className="badge bg-indigo-600/20 text-indigo-400 text-sm">v{selected.version}</span>
                <span className="text-gray-400 text-sm">{selected.note}</span>
                <span className="text-gray-500 text-xs ml-auto">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <h4 className="text-xs uppercase text-gray-500 mb-2">System Prompt</h4>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-navy-950 p-3 rounded-lg">{selected.systemPrompt || '(empty)'}</pre>
              </div>
              <div>
                <h4 className="text-xs uppercase text-gray-500 mb-2">User Prompt</h4>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-navy-950 p-3 rounded-lg">{selected.userPrompt || '(empty)'}</pre>
              </div>
              {selected.outputSchema && (
                <div>
                  <h4 className="text-xs uppercase text-gray-500 mb-2">Output Schema</h4>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-navy-950 p-3 rounded-lg">{JSON.stringify(selected.outputSchema, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20">Select a version to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
