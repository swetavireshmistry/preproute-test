import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Test, Question, Topic, SubTopic } from '../types';
import { isApiSuccess } from '../utils/api';
import { parseStringList } from '../utils/string';
import { MainLayout } from '../components/MainLayout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  FileText,
  BookOpen,
  Activity,
  CheckCircle2,
  Edit,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TestView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicNames, setTopicNames] = useState<string[]>([]);
  const [subTopicNames, setSubTopicNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadTestData = async () => {
      setLoading(true);
      try {
        const testRes = await api.getTestById(id);
        if (isApiSuccess(testRes)) {
          const testData = testRes.data;
          setTest(testData);

          // Resolve topic names
          const parsedTopics = parseStringList(testData.topics);
          const parsedSubTopics = parseStringList(testData.sub_topics);
          
          let resolvedTopicNames: string[] = [];
          let resolvedSubTopicNames: string[] = [];

          const subjectsRes = await api.getSubjects();
          if (isApiSuccess(subjectsRes)) {
            const matchedSubject = subjectsRes.data.find(
              (subject) => subject.name === testData.subject || subject.id === testData.subject
            );

            if (matchedSubject) {
              const topicsRes = await api.getTopicsBySubject(matchedSubject.id);
              if (isApiSuccess(topicsRes)) {
                const matchedTopics = topicsRes.data.filter(
                  (topic: Topic) => parsedTopics.includes(topic.name) || parsedTopics.includes(topic.id)
                );
                resolvedTopicNames = matchedTopics.map((topic) => topic.name);

                const matchedTopicIds = matchedTopics.map((topic) => topic.id);
                if (matchedTopicIds.length > 0) {
                  const subTopicsRes = await api.getSubTopicsByMultiTopics(matchedTopicIds);
                  if (isApiSuccess(subTopicsRes)) {
                    const matchedSubTopics = subTopicsRes.data.filter(
                      (subTopic: SubTopic) =>
                        parsedSubTopics.includes(subTopic.name) || parsedSubTopics.includes(subTopic.id)
                    );
                    resolvedSubTopicNames = matchedSubTopics.map((subTopic) => subTopic.name);
                  }
                }
              }
            }
          }

          if (resolvedTopicNames.length === 0 && parsedTopics.length > 0) {
            resolvedTopicNames = parsedTopics;
          }
          if (resolvedSubTopicNames.length === 0 && parsedSubTopics.length > 0) {
            resolvedSubTopicNames = parsedSubTopics;
          }

          setTopicNames(resolvedTopicNames);
          setSubTopicNames(resolvedSubTopicNames);

          // Fetch full questions detail
          if (testData.questions && testData.questions.length > 0) {
            const questionsRes = await api.fetchBulkQuestions(testData.questions);
            if (isApiSuccess(questionsRes)) {
              const sortedQuestions = [...questionsRes.data].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
              });
              setQuestions(sortedQuestions);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching test view data:', err);
        toast.error('Failed to load test details.');
      } finally {
        setLoading(false);
      }
    };

    void loadTestData();
  }, [id]);

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 uppercase tracking-wide">Easy</span>;
      case 'medium':
        return <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/10 uppercase tracking-wide">Medium</span>;
      case 'hard':
        return <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10 uppercase tracking-wide">Difficult</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10 uppercase tracking-wide">Medium</span>;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const isLive = status?.toLowerCase() === 'live';
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold leading-5 tracking-wide uppercase ${
          isLive
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        {status || 'Draft'}
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
      return dateStr;
    }
  };

  if (loading) {
    return (
      <MainLayout breadcrumbs={['Dashboard', 'View Test']}>
        <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col space-y-8 pb-12">
          {/* Header skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-6 w-56" />
                <div className="skeleton h-3 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-28 rounded-lg" />
              <div className="skeleton h-10 w-36 rounded-lg" />
            </div>
          </div>

          {/* Meta stat cards skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 text-center space-y-3">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-4 w-20" />
              </div>
            ))}
          </div>

          {/* Topics skeleton */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
            <div className="skeleton h-3 w-16 mb-2" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-24 rounded-full" />
              ))}
            </div>
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>

          {/* Question cards skeleton */}
          <div className="space-y-6">
            <div className="skeleton h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-50">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
                <div className="skeleton h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }


  if (!test) {
    return (
      <MainLayout breadcrumbs={['Dashboard', 'View Test']}>
        <div className="flex flex-col items-center justify-center py-20 bg-white">
          <p className="text-rose-500 font-bold">Test details not found.</p>
          <Link to="/" className="text-sm font-bold text-blue-600 hover:underline mt-4">
            Return to Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isDraft = test.status !== 'live';

  return (
    <MainLayout breadcrumbs={['Dashboard', 'View Test']}>
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col space-y-8 pb-12">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight m-0">
                  {test.name}
                </h2>
                {getStatusBadge(test.status)}
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5 select-none">
                <Calendar className="h-3.5 w-3.5" />
                Created on {formatDate(test.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {isDraft && (
              <>
                <button
                  onClick={() => navigate(`/tests/edit/${test.id}`)}
                  className="inline-flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Edit className="h-4 w-4 text-slate-500" />
                  Edit Test
                </button>
                <button
                  onClick={() => navigate(`/tests/${test.id}/preview`)}
                  className="inline-flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-lg bg-[#7489FF] px-4 py-2.5 text-sm font-bold text-[#FAFAFA] transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="h-4 w-4 text-white" />
                  Preview & Publish
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta Grid Section */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 select-none">
          {[
            { label: 'Subject', val: test.subject || 'Unassigned', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
            { label: 'Test Type', val: test.type || 'Standard', icon: Activity, color: 'text-indigo-500 bg-indigo-50', capitalize: true },
            { label: 'Difficulty', val: test.difficulty, icon: TrendingUp, color: 'text-orange-500 bg-orange-50', isDiff: true },
            { label: 'Questions', val: `${questions.length} Qs`, icon: FileText, color: 'text-emerald-500 bg-emerald-50' },
            { label: 'Duration', val: `${test.total_time} mins`, icon: Clock, color: 'text-sky-500 bg-sky-50' },
            { label: 'Total Marks', val: `${test.total_marks} Marks`, icon: Award, color: 'text-amber-500 bg-amber-50' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-xs">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                {item.isDiff ? (
                  <span className="mt-1">{getDifficultyBadge(item.val)}</span>
                ) : (
                  <span className={`mt-1.5 text-sm font-bold text-slate-800 ${item.capitalize ? 'capitalize' : ''}`}>{item.val}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Topics & Subtopics Badge Row */}
        {(topicNames.length > 0 || subTopicNames.length > 0) && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            {topicNames.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {topicNames.map((name, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {subTopicNames.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Sub-topics</h4>
                <div className="flex flex-wrap gap-2">
                  {subTopicNames.map((name, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight select-none">
              Questions ({questions.length})
            </h3>
            {isDraft && (
              <Link
                to={`/tests/${test.id}/questions`}
                className="text-sm font-bold text-[#384EC7] hover:underline flex items-center gap-1"
              >
                Manage Questions
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No questions added yet.</p>
              {isDraft && (
                <Link
                  to={`/tests/${test.id}/questions`}
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#7489FF] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  Add Questions Now
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-5 hover:border-slate-200 transition-colors"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 select-none">
                    <span className="text-sm font-bold text-slate-800">
                      Question {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {q.difficulty && getDifficultyBadge(q.difficulty)}
                      {q.topic && (
                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          {q.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div>
                    <div
                      className="text-base font-medium text-slate-800 leading-relaxed wysiwyg-content"
                      dangerouslySetInnerHTML={{ __html: q.question }}
                    />
                    {q.media_url && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 max-w-md">
                        <img src={q.media_url} alt="Question Media" className="h-auto w-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Option Grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: 'A', key: 'option1' as const, text: q.option1 },
                      { label: 'B', key: 'option2' as const, text: q.option2 },
                      { label: 'C', key: 'option3' as const, text: q.option3 },
                      { label: 'D', key: 'option4' as const, text: q.option4 },
                    ].map((opt) => {
                      const isCorrect = q.correct_option === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`flex items-center gap-3.5 rounded-xl border p-4.5 transition-colors ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                              : 'border-slate-100 bg-slate-50/30 text-slate-700'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200/80 text-slate-600'
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : opt.label}
                          </span>
                          <span className="text-sm font-semibold">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {q.explanation && (
                    <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 select-none">
                        Explanation / Solution
                      </h5>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed m-0 whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TestView;
