export default function ValidationPanel({ validation }) {
  if (!validation?.results?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Validation Results</h3>
      {validation.results.map((v, i) => (
        <div key={i} className={`p-4 rounded-lg border ${v.passed ? 'border-emerald-600/30 bg-emerald-900/10' : 'border-red-600/30 bg-red-900/10'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-lg ${v.passed ? '✅' : '❌'}`}>{v.passed ? '✅' : '❌'}</span>
            <span className="font-medium text-sm text-gray-200">{v.targetModel?.split('/').pop()}</span>
            <span className={`ml-auto badge ${v.score >= 7 ? 'bg-emerald-600/20 text-emerald-400' : v.score >= 4 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'}`}>
              Score: {v.score}/10
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{v.feedback}</p>
          {v.suggestions?.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-1">
              {v.suggestions.map((s, j) => <li key={j}>• {s}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
