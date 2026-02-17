import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PromptEditor from './pages/PromptEditor';
import RunResults from './pages/RunResults';
import History from './pages/History';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prompt/:id" element={<PromptEditor />} />
        <Route path="/prompt/:id/run/:runId" element={<RunResults />} />
        <Route path="/prompt/:id/history" element={<History />} />
      </Routes>
    </Layout>
  );
}
