import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import ModelSelector from '../components/ModelSelector';
import VariableEditor from '../components/VariableEditor';
import SchemaEditor from '../components/SchemaEditor';

export default function PromptEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [prompt, setPrompt] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [variables, setVariables] = useState([]);
  const [varValues, setVarValues] = useState({});
  const [schemaEnabled, setSchemaEnabled] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [temperature, setTemperature] = useState(0.7);
  const [versionNote, setVersionNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!isNew) {
      api.getPrompt(id).then(p => {
        setPrompt(p);
        setName(p.name);
        setDescription(p.description || '');
        setSystemPrompt(p.systemPrompt);
        setUserPrompt(p.userPrompt);
        setVariables(p.variables || []);
        setSchemaEnabled(!!p.outputSchema);
        setSchemaText(p.outputSchema ? JSON.stringify(p.outputSchema, null, 2) : '');
        setTagsText((p.tags || []).join(', '));
        const vals = {};
        (p.variables || []).forEach(v => { vals[v.name] = v.default || ''; });
        setVarValues(vals);
      });
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      let schema = null;
      if (schemaEnabled && schemaText) {
        try { schema = JSON.parse(schemaText); } catch { alert('Invalid JSON schema'); setSaving(false); return; }
      }
      const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
      const data = { name, description, systemPrompt, userPrompt, variables, outputSchema: schema, tags, versionNote };

      if (isNew) {
        const created = await api.createPrompt(data);
        navigate(`/prompt/${created._id}`, { replace: true });
      } else {
        await api.updatePrompt(id, data);
      }
      setVersionNote('');
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const run = async () => {
    if (selectedModels.length === 0) { alert('Select at least one model'); return; }
    setRunning(true);
    try {
      let schema = null;
      if (schemaEnabled && schemaText) {
        try { schema = JSON.parse(schemaText); } catch {}
      }
      const models = selectedModels.map(m => ({ ...m, temperature }));
      const result = await api.createRun({
        promptId: isNew ? null : id,
        promptVersion: prompt?.versions?.length || 1,
        variables: varValues,
        models,
        systemPrompt,
        userPrompt,
        outputSchema: schema,
      });
      navigate(`/prompt/${id}/run/${result._id}`);
    } catch (err) {
      alert(err.message);
    }
    setRunning(false);
  };

  if (!isNew && !prompt) return <div className="text-center text-gray-500 py-20">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors">←</Link>
        <input
          className="text-2xl font-bold bg-transparent border-none !ring-0 !outline-none text-gray-100 flex-1 !p-0"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Prompt name..."
        />
        <div className="flex gap-2">
          {!isNew && (
            <Link to={`/prompt/${id}/history`} className="btn-secondary text-xs">
              📜 History
            </Link>
          )}
          <button onClick={save} disabled={saving} className="btn-secondary">
            {saving ? '...' : '💾 Save'}
          </button>
          <button onClick={run} disabled={running} className="btn-primary">
            {running ? '⏳ Running...' : '▶ Run Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <input
              className="w-full text-sm mb-3"
              placeholder="Description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input
              className="w-full text-xs mb-4"
              placeholder="Tags (comma separated)"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
            />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System Prompt</label>
                <textarea
                  rows={6}
                  className="w-full"
                  placeholder="You are a helpful assistant..."
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">User Prompt</label>
                <textarea
                  rows={10}
                  className="w-full"
                  placeholder="Use {{variables}} for dynamic content..."
                  value={userPrompt}
                  onChange={e => setUserPrompt(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Version note */}
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm"
              placeholder="Version note (optional)..."
              value={versionNote}
              onChange={e => setVersionNote(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Config */}
        <div className="space-y-4">
          <div className="card">
            <ModelSelector
              selected={selectedModels}
              onChange={setSelectedModels}
              temperature={temperature}
              onTemperatureChange={setTemperature}
            />
          </div>
          <div className="card">
            <VariableEditor
              variables={variables}
              onChange={setVariables}
              values={varValues}
              onValuesChange={setVarValues}
            />
          </div>
          <div className="card">
            <SchemaEditor
              schema={schemaText}
              onChange={setSchemaText}
              enabled={schemaEnabled}
              onToggle={() => setSchemaEnabled(!schemaEnabled)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
