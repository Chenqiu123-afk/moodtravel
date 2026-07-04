import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmotionSelect from '@/pages/EmotionSelect';
import ItineraryPlan from '@/pages/ItineraryPlan';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EmotionSelect />} />
        <Route path="/plan" element={<ItineraryPlan />} />
      </Routes>
    </Router>
  );
}