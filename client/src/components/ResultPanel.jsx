export default function ResultPanel({ result }) {
  const statusColors = {
    pending: 'text-gray-500',
    running: 'text-yellow-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
  };

  const modelShort = result.model.split('/').pop();

  return (
    <div className="panel flex flex-col h-full">
      <div className="px-4 py-3 border-b border-navy-700/50 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm text-gray-200">{modelShort}</h4>
          <span className="text-xs text-gray-500">{result.model}</span>
        </div>
        <span className={`badge ${statusColors[result.status]} bg-navy-800`}>
          {result.status === 'running' ? '⏳' : result.status === 'completed' ? '✓' : result.status === 'failed' ? '✕' : '○'} {result.status}
        </span>
      </div>
      
      {result.status === 'completed' && (
        <div className="px-4 py-2 border-b border-navy-700/30 flex gap-4 text-xs text-gray-400">
          <span>⏱ {(result.latencyMs / 1000).toFixed(1)}s</span>
          <span>📥 {result.tokensIn}</span>
          <span>📤 {result.tokensOut}</span>
          {result.cost != null && <span>💰 ${result.cost.toFixed(4)}</span>}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {result.status === 'running' && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <span className="animate-spin">⚙️</span> Generating...
          </div>
        )}
        {result.status === 'failed' && (
          <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
            {result.error}
          </div>
        )}
        {result.status === 'completed' && (
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {result.structuredOutput
              ? JSON.stringify(result.structuredOutput, null, 2)
              : result.output}
          </pre>
        )}
      </div>
    </div>
  );
}
