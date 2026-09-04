import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-slate-900">
    <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you're looking for doesn't exist or you don't have access to it.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
