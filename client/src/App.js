import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import GroupScreen from './pages/GroupScreen';
import Home from './pages/Home';
import './styles/index.css';
import './styles/components.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/main" element={<MainScreen />} />
        <Route path="/group/:groupId" element={<GroupScreen />} />
        <Route path="/group" element={<GroupScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 