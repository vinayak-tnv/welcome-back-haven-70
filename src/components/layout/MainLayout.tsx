
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Index from '../../pages/Index';
import Tasks from '../../pages/Tasks';
import Focus from '../../pages/Focus';
import Settings from '../../pages/Settings';
import Notifications from '../../pages/Notifications';
import NotFound from '../../pages/NotFound';
import Login from '../../pages/Login';

const MainLayout: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:time" element={<Tasks />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default MainLayout;
