const POPULAR_MODELS = [
  { id: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', color: 'text-orange-400' },
  { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', color: 'text-orange-300' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', color: 'text-green-400' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', color: 'text-green-300' },
  { id: 'google/gemini-2.5-pro-preview-06-05', label: 'Gemini 2.5 Pro', color: 'text-blue-400' },
  { id: 'google/gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash', color: 'text-blue-300' },
  { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', color: 'text-purple-400' },
  { id: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3', color: 'text-cyan-400' },
];

export default function ModelSelector({ selected, onChange, temperature, onTemperatureChange }) {
  const toggle = (modelId) => {
    const existing = selected.find(m => m.model === modelId);
    if (existing) {
      onChange(selected.filter(m => m.model !== modelId));
    } else {
      onChange([...selected, { model: modelId, webSearch: false, temperature: temperature ?? 0.7 }]);
    }
  };

  const toggleWebSearch = (modelId) => {
    onChange(selected.map(m => m.model === modelId ? { ...m, webSearch: !m.webSearch } : m));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Models</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Temp:</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature ?? 0.7}
            onChange={e => onTemperatureChange(parseFloat(e.target.value))}
            className="w-20 accent-indigo-500 bg-transparent border-none p-0"
          />
          <span className="w-8 text-indigo-400 font-mono">{(temperature ?? 0.7).toFixed(1)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {POPULAR_MODELS.map(m => {
          const isSelected = selected.some(s => s.model === m.id);
          const sel = selected.find(s => s.model === m.id);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                isSelected 
                  ? 'bg-indigo-600/15 border border-indigo-500/30' 
                  : 'hover:bg-navy-800 border border-transparent'
              }`}
              onClick={() => toggle(m.id)}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-gray-600'
              }`}>
                {isSelected && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`flex-1 ${m.color}`}>{m.label}</span>
              {isSelected && (
                <button
                  onClick={e => { e.stopPropagation(); toggleWebSearch(m.id); }}
                  className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                    sel?.webSearch 
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                      : 'bg-navy-800 text-gray-500 hover:text-gray-400'
                  }`}
                  title="Web Search"
                >
                  🌐
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
