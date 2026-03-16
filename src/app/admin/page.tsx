'use client';

import React from 'react';
import { useUser } from '@/firebase';
import Login from './login';
import Dashboard from './dashboard';

export default function AdminPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}
