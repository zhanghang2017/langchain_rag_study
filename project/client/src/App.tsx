import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./routes/ChatPage";
import KnowledgeBasePage from "./routes/KnowledgeBasePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
    </Routes>
  );
};

export default App;
