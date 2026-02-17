import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import PromptCard from '../components/PromptCard';

export default function Dashboard() {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPrompts();
      setPrompts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createNew = async () => {
    const prompt = await api.createPrompt({ name: 'New Prompt', systemPrompt: 'You are a helpful assistant.', userPrompt: '' });
    navigate(`/prompt/${prompt._id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this prompt?')) return;
    await api.deletePrompt(id);
    load();
  };

  const handleDuplicate = async (id) => {
    const dup = await api.duplicatePrompt(id);
    navigate(`/prompt/${dup._id}`);
  };

  const filtered = prompts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Prompts
          </h1>
          <p className="text-gray-500 mt-1">Build, test, and iterate on your prompts</p>
        </div>
        <button onClick={createNew} className="btn-primary text-base">
          <span>+</span> New Prompt
        </button>
      </div>

      <div className="mb-6">
        <input
          className="w-full max-w-md"
          placeholder="Search prompts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No prompts yet</p>
          <button onClick={createNew} className="btn-primary">Create your first prompt</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <PromptCard key={p._id} prompt={p} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
