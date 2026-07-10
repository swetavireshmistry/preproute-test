import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Test, Question, Topic, SubTopic } from '../types';
import { MainLayout } from '../components/MainLayout';
import { TestSummaryCard } from '../components/TestSummaryCard';
import {
  ChevronsRight,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/api';

export const PreviewPublish: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicNames, setTopicNames] = useState<string[]>([]);
  const [subTopicNames, setSubTopicNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Publish controls states matching Figma layout
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [liveUntil, setLiveUntil] = useState<'always' | '1week' | '2weeks' | '3weeks' | '1month' | 'custom'>('custom');

  // Schedule inputs
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Custom duration inputs
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadTestData = async () => {
      setLoading(true);
      try {
        const testRes = await api.getTestById(id);
        if (testRes.success || testRes.status === 'success') {
          const testData = testRes.data;
          setTest(testData);

          let parsedTopics: string[] = [];
          if (Array.isArray(testData.topics)) {
            parsedTopics = testData.topics;
          } else if (typeof testData.topics === 'string' && testData.topics) {
            parsedTopics = testData.topics.split(',').map((t) => t.trim());
          }

          let parsedSubTopics: string[] = [];
          if (Array.isArray(testData.sub_topics)) {
            parsedSubTopics = testData.sub_topics;
          } else if (typeof testData.sub_topics === 'string' && testData.sub_topics) {
            parsedSubTopics = testData.sub_topics.split(',').map((st) => st.trim());
          }

          let resolvedTopicNames: string[] = [];
          let resolvedSubTopicNames: string[] = [];

          const subjectsRes = await api.getSubjects();
          if (subjectsRes.success || subjectsRes.status === 'success') {
            const matchedSubject = subjectsRes.data.find(
              (subject) => subject.name === testData.subject || subject.id === testData.subject
            );

            if (matchedSubject) {
              const topicsRes = await api.getTopicsBySubject(matchedSubject.id);
              if (topicsRes.success || topicsRes.status === 'success') {
                const matchedTopics = topicsRes.data.filter(
                  (topic: Topic) => parsedTopics.includes(topic.name) || parsedTopics.includes(topic.id)
                );
                resolvedTopicNames = matchedTopics.map((topic) => topic.name);

                const matchedTopicIds = matchedTopics.map((topic) => topic.id);
                if (matchedTopicIds.length > 0) {
                  const subTopicsRes = await api.getSubTopicsByMultiTopics(matchedTopicIds);
                  if (subTopicsRes.success || subTopicsRes.status === 'success') {
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
          if (testRes.data.questions && testRes.data.questions.length > 0) {
            const questionsRes = await api.fetchBulkQuestions(testRes.data.questions);
            if (questionsRes.success || questionsRes.status === 'success') {
              setQuestions(questionsRes.data);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching preview data:', err);
        toast.error('Failed to load test preview information.');
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [id]);

  const handlePublish = async () => {
    if (!id) return;
    if (questions.length === 0) {
      toast.error('Test must contain at least 1 question before publishing.');
      return;
    }

    setPublishing(true);
    try {
      const res = await api.publishTest(id);
      if (res.success || res.status === 'success') {
        toast.success('Test published successfully! It is now live.');
        navigate('/');
      } else {
        toast.error(res.message || 'Failed to publish test.');
      }
    } catch (err: unknown) {
      console.error('Error publishing test:', err);
      toast.error(getApiErrorMessage(err, 'Failed to publish the test. Please check connection.'));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout breadcrumbs={['Test creation']}>
        <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center gap-6">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-8 w-44 rounded-lg" />
          </div>

          {/* TestSummaryCard skeleton */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-5 w-24" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>

          {/* Publish toggle skeleton */}
          <div className="skeleton h-12 w-72 rounded-lg" />

          {/* Live Until skeleton */}
          <div className="space-y-4">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-4 w-80" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-5 w-5 rounded-full" />
                  <div className="skeleton h-4 w-36" />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="mt-auto flex w-full items-center justify-end gap-3.5 border-t border-slate-100 pt-6">
            <div className="skeleton h-12 w-40 rounded-lg" />
            <div className="skeleton h-12 w-40 rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }


  if (!test) {
    return (
      <MainLayout breadcrumbs={['Test creation']}>
        <div className="flex flex-col items-center justify-center py-20 bg-white">
          <p className="text-red-500 font-medium">Test details not found.</p>
          <Link to="/" className="text-sm font-bold text-blue-600 hover:underline mt-4">
            Return to Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  const sidebarContent = (
    <>
      <p className="text-sm font-medium leading-[150%] tracking-normal text-[#6B7180]">
        Total Questions . {questions.length}
      </p>

      <div className="flex flex-col gap-[10px]">
        {questions.map((_, idx) => {
          const questionNumber = idx + 1;

          return (
            <div
              key={idx}
              className="flex w-full items-center justify-between rounded-xl border border-[#0C9D61] bg-white px-3 py-2.5"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 fill-[#0C9D61] text-white" />
                <span className="text-xs font-normal leading-[150%] tracking-normal text-[#0C9D61]">
                  Question {questionNumber}
                </span>
              </span>
              <ChevronsRight className="h-3.5 w-3.5 shrink-0 text-[#0C9D61]" />
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <MainLayout breadcrumbs={['Test creation']} sidebarContent={sidebarContent}>
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col space-y-8">
        <div>
          <div className="flex select-none items-center gap-[30px]">
            <h2 className="m-0 text-base font-bold leading-[150%] tracking-normal text-[#374151]">
              Test created
            </h2>
            <span
              className="inline-flex h-8 w-[171px] items-center justify-center border border-[#0C9D61] bg-white px-[10px] text-xs font-normal leading-[150%] tracking-normal text-[#0C9D61]"
              style={{ borderWidth: '0.5px', borderRadius: '8px' }}
            >
              All {questions.length} Questions Done
            </span>
          </div>
        </div>

        <TestSummaryCard
          type={test.type || 'chapterwise'}
          name={test.name}
          difficulty={test.difficulty || 'easy'}
          subject={test.subject || 'Unassigned'}
          topics={topicNames}
          subTopics={subTopicNames}
          totalTime={test.total_time || 0}
          totalQuestions={questions.length}
          totalMarks={test.total_marks || 0}
          onEdit={() => navigate(`/tests/edit/${id}`)}
        />

        <div
          className="box-border grid h-12 w-[283px] shrink-0 grid-cols-2 gap-5 border border-[#E5E7EB] bg-white px-[10px] py-[2px]"
          style={{ borderRadius: '8px' }}
        >
          <button
            type="button"
            onClick={() => setPublishType('now')}
            className={`box-border flex w-full cursor-pointer items-center justify-center whitespace-nowrap text-[14px] leading-[150%] tracking-normal transition-colors ${publishType === 'now'
                ? 'mx-0.5 my-0.5 h-[36px] px-[11px] py-[3px] bg-[#F8FAFF] font-bold text-[#07013C]'
                : 'h-10 px-[11px] py-[3px] bg-transparent font-normal text-[#9CA3AF]'
              }`}
            style={{ borderRadius: '8px' }}
          >
            Publish Now
          </button>

          <button
            type="button"
            onClick={() => setPublishType('schedule')}
            className={`box-border flex w-full cursor-pointer items-center justify-center whitespace-nowrap text-[14px] leading-[150%] tracking-normal transition-colors ${publishType === 'schedule'
                ? 'mx-0.5 my-0.5 h-[36px] px-[11px] py-[3px] bg-[#F8FAFF] font-bold text-[#07013C]'
                : 'h-10 px-[4px] py-[3px] bg-transparent font-normal text-[#9CA3AF]'
              }`}
            style={{ borderRadius: '8px' }}
          >
            Schedule Publish
          </button>
        </div>

        <div className="w-full space-y-6">
          {publishType === 'schedule' && (
            <div className="space-y-3.5">
              <h4 className="select-none text-sm font-bold text-slate-700">Select Date and Time</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Select Date"
                  value={scheduleDate}
                  onFocus={(e) => {
                    e.target.type = 'date';
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.type = 'date';
                    e.currentTarget.focus();
                    if ("showPicker" in e.currentTarget) {
                      e.currentTarget.showPicker();
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] placeholder:text-[#D1D5DB] focus:border-[#384EC7] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Select Time"
                  value={scheduleTime}
                  onFocus={(e) => {
                    e.target.type = 'time';
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.type = 'time';
                    e.currentTarget.focus();
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // ignore
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] placeholder:text-[#D1D5DB] focus:border-[#384EC7] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="select-none text-base font-bold leading-[150%] tracking-normal text-[#374151]">
              Live Until
            </h4>
            <p className="select-none align-middle text-base font-medium leading-[150%] tracking-normal text-[#6B7180]">
              Choose how long this test should remain available on the platform.
            </p>

            <div className="grid select-none grid-cols-1 gap-[10px] pt-2 md:grid-cols-2">
              {[
                { label: 'Always Available', value: 'always' },
                { label: '3 Weeks', value: '3weeks' },
                { label: '1 Week', value: '1week' },
                { label: '1 Month', value: '1month' },
                { label: '2 Weeks', value: '2weeks' },
                { label: 'Custom Duration', value: 'custom' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex h-12 cursor-pointer items-center gap-2.5"
                >
                  <span className="flex h-full shrink-0 items-center justify-center">
                    <input
                      type="radio"
                      name="liveUntil"
                      value={opt.value}
                      checked={liveUntil === opt.value}
                      onChange={(e) => setLiveUntil(e.target.value as typeof liveUntil)}
                      className="difficulty-radio m-0 h-5 w-5 cursor-pointer"
                    />
                  </span>
                  <span className="flex h-full items-center text-sm font-normal leading-[150%] tracking-normal text-[#374151]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {liveUntil === 'custom' && (
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Select End Date"
                  value={endDate}
                  onFocus={(e) => {
                    e.target.type = 'date';
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.type = 'date';
                    e.currentTarget.focus();
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // ignore
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] placeholder:text-[#D1D5DB] focus:border-[#384EC7] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Select End Time"
                  value={endTime}
                  onFocus={(e) => {
                    e.target.type = 'time';
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.type = 'time';
                    e.currentTarget.focus();
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // ignore
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] placeholder:text-[#D1D5DB] focus:border-[#384EC7] focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto flex w-full items-center justify-end gap-3.5 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex cursor-pointer items-center justify-center rounded-[8px] bg-[#F8FAFF] text-center text-base font-medium leading-[150%] tracking-normal text-[#384EC7] transition-opacity hover:opacity-90"
            style={{ width: '160px', height: '48px' }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[8px] bg-[#7489FF] text-center text-base font-medium leading-[150%] tracking-normal text-[#FAFAFA] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ width: '160px', height: '48px' }}
          >
            {publishing ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Confirming...</span>
              </>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};
export default PreviewPublish;
