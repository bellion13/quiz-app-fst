import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PracticeMode from './pages/PracticeMode';
import TopicMode from './pages/TopicMode';
import TopicSelect from './pages/TopicSelect';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<PracticeMode />} />
        <Route path="/topic" element={<TopicSelect />} />
        <Route path="/topic/:topicName" element={<TopicMode />} />
      </Routes>
    </div>
  );
}

export default App;
