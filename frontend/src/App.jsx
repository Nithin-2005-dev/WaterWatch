import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import DashBoard from './pages/DashBoard';
import Environments from './pages/Environments';
import Analytics from './pages/Analytics';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <main>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />

          <Route path="/dashboard" element={<PrivateRoute><DashBoard /></PrivateRoute>} />
          <Route path="/environments" element={<PrivateRoute><Environments /></PrivateRoute>} />
          <Route path="/analytics/:id" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        </Routes>
      </Router>
    </main>
  );
};

export default App;
