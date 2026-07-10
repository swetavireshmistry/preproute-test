import React from 'react';
import { MainLayout } from '../components/MainLayout';
import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TestTracking: React.FC = () => {
  return (
    <MainLayout breadcrumbs={['Test Tracking']}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl p-8 text-center">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-6 animate-pulse">
          <Construction className="h-12 w-12" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
          Test Tracking Coming Soon
        </h1>
        
        <p className="text-slate-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
          We are currently building the performance analytics and attempt tracking system. 
          Soon, you will be able to monitor student progress, pass rates, and individual submissions here.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
        >
          <span>Back to Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </MainLayout>
  );
};

export default TestTracking;
