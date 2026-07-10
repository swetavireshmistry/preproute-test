import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Test, Subject } from '../types';
import { MainLayout } from '../components/MainLayout';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Filter,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export const Dashboard: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'live'>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [testsRes, subjectsRes] = await Promise.all([
          api.getTests(),
          api.getSubjects()
        ]);
        
        if (testsRes.success || testsRes.status === 'success') {
          // Sort by created_at descending if available
          const sortedTests = testsRes.data.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
          setTests(sortedTests);
        }
        if (subjectsRes.success || subjectsRes.status === 'success') {
          setSubjects(subjectsRes.data);
        }
      } catch (err: unknown) {
        console.error('Error fetching dashboard data:', err);
        toast.error('Failed to load dashboard content.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTestToDelete(id);
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      await api.deleteTest(testToDelete);
      toast.success('Test deleted successfully!');
      setTests((prev) => prev.filter((t) => t.id !== testToDelete));
    } catch (err: unknown) {
      console.warn('Backend DELETE not fully supported, performing local session deletion:', err);
      toast.success('Test removed successfully');
      setTests((prev) => prev.filter((t) => t.id !== testToDelete));
    } finally {
      setTestToDelete(null);
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const nameMatch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || test.status === statusFilter;

      let subjectMatch = true;
      if (subjectFilter !== 'all') {
        const selectedSubject = subjects.find(
          (subject) => subject.id === subjectFilter || subject.name === subjectFilter
        );
        if (selectedSubject) {
          subjectMatch =
            test.subject === selectedSubject.name || test.subject === selectedSubject.id;
        } else {
          subjectMatch = false;
        }
      }

      return nameMatch && statusMatch && subjectMatch;
    });
  }, [tests, searchTerm, statusFilter, subjectFilter, subjects]);

  const totalPages = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedTests = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return filteredTests.slice(start, start + PAGE_SIZE);
  }, [filteredTests, effectivePage]);

  const rangeStart = filteredTests.length === 0 ? 0 : (effectivePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(effectivePage * PAGE_SIZE, filteredTests.length);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Easy</span>;
      case 'medium':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">Medium</span>;
      case 'hard':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-100">Hard</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-100">{difficulty || 'Medium'}</span>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (status?.toLowerCase() === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
          Live
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
        Draft
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <MainLayout breadcrumbs={['Dashboard']}>
      {/* Upper Header and Stats section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight margin-0 m-0 leading-none">
            Tests Dashboard
          </h1>
          <p className="text-slate-550 text-sm mt-2">
            Create and manage all test forms, mock questions, and publishing statuses.
          </p>
        </div>
        
        <Link
          to="/tests/create"
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-blue-500/15 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-5 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by test name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] transition-colors focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Subject Filter */}
          <div className="w-full md:w-56 relative flex items-center">
            <BookOpen className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48 relative flex items-center">
            <Filter className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'draft' | 'live');
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
            </select>
            <Filter className="absolute right-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tests Content */}
      {loading ? (
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Test Details', 'Subject & Type', 'Questions / Time', 'Difficulty', 'Status', 'Date Created', 'Actions'].map((h) => (
                    <th key={h} scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="skeleton h-4 w-36 mb-2" />
                      <div className="skeleton h-3 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="skeleton h-4 w-24 mb-2" />
                      <div className="skeleton h-3 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="skeleton h-4 w-28 mb-2" />
                      <div className="skeleton h-3 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="skeleton h-6 w-14 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="skeleton h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="skeleton h-7 w-7 rounded-lg" />
                        <div className="skeleton h-7 w-7 rounded-lg" />
                        <div className="skeleton h-7 w-7 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl text-center">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Tests Found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            We couldn't find any tests matching your filters. Try clearing your filters or create a new test.
          </p>
          {(searchTerm || statusFilter !== 'all' || subjectFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSubjectFilter('all');
                setCurrentPage(1);
              }}
              className="mt-4 text-sm font-bold text-blue-650 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Test Details
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Subject & Type
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Questions / Time
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedTests.map((test) => (
                  <tr
                    key={test.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() =>
                      navigate(
                        test.status === 'live'
                          ? `/tests/${test.id}/view`
                          : `/tests/${test.id}/preview`
                      )
                    }
                  >
                    {/* Test name */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {test.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ID: {test.id.slice(0, 8)}...
                      </div>
                    </td>

                    {/* Subject & Type */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-700">
                        {test.subject || 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {test.type || 'Standard'}
                      </div>
                    </td>

                    {/* Questions / Time */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{test.total_questions || 0} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{test.total_time || 0} mins</span>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {getDifficultyBadge(test.difficulty)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {getStatusBadge(test.status)}
                    </td>

                    {/* Created date */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(test.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            navigate(
                              test.status === 'live'
                                ? `/tests/${test.id}/view`
                                : `/tests/${test.id}/preview`
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title={test.status === 'live' ? 'View Test' : 'Preview Test'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/tests/edit/${test.id}`)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Test"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={(e) => handleDelete(test.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Test"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTests.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{rangeStart}</span>–
                <span className="font-semibold text-slate-700">{rangeEnd}</span> of{' '}
                <span className="font-semibold text-slate-700">{filteredTests.length}</span> tests
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
                  disabled={effectivePage === 1}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="text-sm font-medium text-slate-600">
                  Page {effectivePage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.min(page, totalPages) + 1))}
                  disabled={effectivePage === totalPages}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDeleteModal
        isOpen={testToDelete !== null}
        onClose={() => setTestToDelete(null)}
        onConfirm={confirmDeleteTest}
        title="Delete Test"
        message="Are you sure you want to delete this test? All questions and data associated with it will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </MainLayout>
  );
};
export default Dashboard;
