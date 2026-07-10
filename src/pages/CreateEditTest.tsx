import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import type { Subject, Topic, SubTopic } from '../types';
import { MainLayout } from '../components/MainLayout';
import { MultiSelect } from '../components/MultiSelect';
import { ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/api';

const testFormSchema = z.object({
  name: z.string().min(1, 'Test Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  type: z.string().min(1, 'Test Type is required'),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  sub_topics: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  correct_marks: z.number().min(0, 'Must be 0 or more'),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  total_time: z.number().min(1, 'Must be at least 1 minute'),
  total_marks: z.number().min(1, 'Must be at least 1 mark'),
  total_questions: z.number().min(1, 'Must be at least 1 question'),
});

type TestFormData = z.infer<typeof testFormSchema>;

export const CreateEditTest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);

  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [subTopicsLoading, setSubTopicsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previousSubjectRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: '',
      subject: '',
      type: 'chapterwise',
      topics: [],
      sub_topics: [],
      difficulty: 'easy',
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
      total_time: 60,
      total_marks: 250,
      total_questions: 50,
    },
  });

  const selectedSubject = watch('subject');
  const selectedTopics = watch('topics');
  const selectedSubTopics = watch('sub_topics');
  const selectedType = watch('type');
  
  const wrongMarks = watch('wrong_marks');
  const unattemptMarks = watch('unattempt_marks');
  const correctMarks = watch('correct_marks');
  
  const totalQuestions = watch('total_questions');

  // Compute total marks dynamically: totalQuestions * correctMarks
  useEffect(() => {
    if (totalQuestions && correctMarks) {
      setValue('total_marks', totalQuestions * correctMarks);
    }
  }, [totalQuestions, correctMarks, setValue]);

  // Load subjects initially
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const subjectsRes = await api.getSubjects();
        if (subjectsRes.success || subjectsRes.status === 'success') {
          setSubjects(subjectsRes.data);
        }

        if (isEditMode && id) {
          const testRes = await api.getTestById(id);
          if (testRes.success || testRes.status === 'success') {
            const test = testRes.data;

            // Map data
            setValue('name', test.name);
            setValue('type', test.type || 'chapterwise');
            setValue('difficulty', test.difficulty || 'easy');
            setValue('correct_marks', test.correct_marks);
            setValue('wrong_marks', test.wrong_marks);
            setValue('unattempt_marks', test.unattempt_marks);
            setValue('total_time', test.total_time);
            setValue('total_marks', test.total_marks);
            setValue('total_questions', test.total_questions);

            // Match subject name/ID to subjects list
            const matchedSubject = subjectsRes.data.find(
              (s) => s.name === test.subject || s.id === test.subject
            );

            if (matchedSubject) {
              setValue('subject', matchedSubject.id);

              // Load topics for matched subject
              const topicsRes = await api.getTopicsBySubject(matchedSubject.id);
              if (topicsRes.success || topicsRes.status === 'success') {
                setTopics(topicsRes.data);

                // Map topic names/IDs to UUIDs
                let testTopics: string[] = [];
                if (Array.isArray(test.topics)) {
                  testTopics = test.topics;
                } else if (typeof test.topics === 'string' && test.topics) {
                  testTopics = (test.topics as string).split(',').map((t) => t.trim());
                }

                const matchedTopicIds = topicsRes.data
                  .filter((t) => testTopics.includes(t.name) || testTopics.includes(t.id))
                  .map((t) => t.id);

                setValue('topics', matchedTopicIds);

                if (matchedTopicIds.length > 0) {
                  // Load subtopics for topic ids
                  const subTopicsRes = await api.getSubTopicsByMultiTopics(matchedTopicIds);
                  if (subTopicsRes.success || subTopicsRes.status === 'success') {
                    setSubTopics(subTopicsRes.data);

                    // Map subtopic names/IDs to UUIDs
                    let testSubTopics: string[] = [];
                    if (Array.isArray(test.sub_topics)) {
                      testSubTopics = test.sub_topics;
                    } else if (typeof test.sub_topics === 'string' && test.sub_topics) {
                      testSubTopics = (test.sub_topics as string).split(',').map((t) => t.trim());
                    }

                    const matchedSubTopicIds = subTopicsRes.data
                      .filter((st) => testSubTopics.includes(st.name) || testSubTopics.includes(st.id))
                      .map((st) => st.id);

                    setValue('sub_topics', matchedSubTopicIds);
                  }
                }
              }
            }
          }
        }
      } catch (err: unknown) {
        console.error('Initialization error:', err);
        toast.error('Failed to load test details.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [id, isEditMode, setValue]);

  // Handle subject change to load topics
  useEffect(() => {
    if (!selectedSubject || loading) return;

    const previousSubject = previousSubjectRef.current;
    if (previousSubject === selectedSubject) return;

    const shouldResetSelections = previousSubject !== null;
    previousSubjectRef.current = selectedSubject;

    if (shouldResetSelections) {
      setValue('topics', []);
      setValue('sub_topics', []);
      setTopics([]);
      setSubTopics([]);
    }

    const loadTopics = async () => {
      setTopicsLoading(true);
      try {
        const res = await api.getTopicsBySubject(selectedSubject);
        if (res.success || res.status === 'success') {
          setTopics(res.data);
        }
      } catch (err) {
        console.error('Error loading topics:', err);
        toast.error('Failed to load topics for subject.');
      } finally {
        setTopicsLoading(false);
      }
    };

    loadTopics();
  }, [selectedSubject, setValue, loading]);

  // Handle topics change to load subtopics
  useEffect(() => {
    if (!selectedTopics || selectedTopics.length === 0 || loading) {
      setSubTopics([]);
      setValue('sub_topics', []);
      return;
    }

    const loadSubTopics = async () => {
      setSubTopicsLoading(true);
      try {
        const res = await api.getSubTopicsByMultiTopics(selectedTopics);
        if (res.success || res.status === 'success') {
          setSubTopics(res.data);
          const availableIds = res.data.map((st) => st.id);
          const currentSubTopics = watch('sub_topics') || [];
          const validSubTopics = currentSubTopics.filter((id) => availableIds.includes(id));
          setValue('sub_topics', validSubTopics);
        }
      } catch (err) {
        console.error('Error loading subtopics:', err);
        toast.error('Failed to load sub-topics.');
      } finally {
        setSubTopicsLoading(false);
      }
    };

    loadSubTopics();
  }, [selectedTopics, setValue, loading]);

  const saveTest = async (data: TestFormData, makeLiveRedirect = false) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        type: data.type,
        subject: data.subject,
        topics: data.topics,
        sub_topics: data.sub_topics,
        correct_marks: data.correct_marks,
        wrong_marks: data.wrong_marks,
        unattempt_marks: data.unattempt_marks,
        difficulty: data.difficulty,
        total_time: data.total_time,
        total_marks: data.total_marks,
        total_questions: data.total_questions,
        status: 'draft' as const,
      };

      let testId = id;

      if (isEditMode && id) {
        await api.updateTest(id, payload);
        toast.success('Test details updated as draft.');
      } else {
        const res = await api.createTest(payload);
        if ((res.success || res.status === 'success') && res.data) {
          testId = res.data.id;
          toast.success('Test details saved as draft.');
        }
      }

      if (makeLiveRedirect && testId) {
        navigate(`/tests/${testId}/questions`);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      console.error('Error saving test details:', err);
      toast.error(getApiErrorMessage(err, 'Failed to save test details. Please fill all fields.'));
    } finally {
      setSaving(false);
    }
  };

  const typePills = [
    { label: 'Chapterwise', value: 'chapterwise' },
    { label: 'PYQ', value: 'pyq' },
    { label: 'Mock Test', value: 'mock' },
  ];

  const typeLabel = selectedType === 'chapterwise' ? 'Chapter Wise' : selectedType === 'pyq' ? 'PYQ' : 'Mock Test';

  const fieldLabelClass = 'mb-2 block text-[16px] font-medium leading-[150%] tracking-normal text-[#374151]';
  const baseFieldClass =
    'h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] focus:border-[#3D4FCB] focus:outline-none';

  return (
    <MainLayout breadcrumbs={['Test Creation', 'Create Test', typeLabel]}>
      <div className="w-full bg-white px-1">
        <form onSubmit={(e) => e.preventDefault()} className="w-full space-y-8">
          
          {/* Top Pill Selector for Test Type */}
          <div className="flex w-fit select-none gap-1 rounded-xl border border-[#EEF2F7] bg-white p-1">
            {typePills.map((pill) => {
              const isActive = selectedType === pill.value;
              return (
                <button
                  type="button"
                  key={pill.value}
                  onClick={() => setValue('type', pill.value)}
                  className={`cursor-pointer rounded-lg px-6 py-2 font-medium text-sm leading-[150%] tracking-normal transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F5F7FF] text-[#384EC7]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Form Fields Grid */}
          <div className="grid w-full grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
            
            {/* Subject */}
            <div>
              <label className={fieldLabelClass}>Subject</label>
              <select
                {...register('subject')}
                className={`${baseFieldClass} ${
                  errors.subject ? 'border-red-300' : 'border-[#E5E7EB]'
                }`}
              >
                <option value="">Choose from Drop-down</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.subject.message}</p>
              )}
            </div>

            {/* Test Name */}
            <div>
              <label className={fieldLabelClass}>Name of Test</label>
              <input
                type="text"
                placeholder="Enter name of Test"
                {...register('name')}
                className={`${baseFieldClass} ${
                  errors.name ? 'border-red-300' : 'border-[#E5E7EB]'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Topic multi-select */}
            <div>
              <MultiSelect
                label="Topic"
                placeholder={topicsLoading ? 'Loading topics...' : 'Choose from Drop-down'}
                options={topics.map((t) => ({ id: t.id, name: t.name }))}
                selectedValues={selectedTopics || []}
                onChange={(values) => setValue('topics', values, { shouldValidate: true })}
                disabled={!selectedSubject || topicsLoading}
                error={errors.topics?.message}
              />
            </div>

            {/* Sub Topic multi-select */}
            <div>
              <MultiSelect
                label="Sub Topic"
                placeholder={subTopicsLoading ? 'Loading sub-topics...' : 'Choose from Drop-down'}
                options={subTopics.map((st) => ({ id: st.id, name: st.name }))}
                selectedValues={selectedSubTopics || []}
                onChange={(values) => setValue('sub_topics', values, { shouldValidate: true })}
                disabled={!selectedTopics || selectedTopics.length === 0 || subTopicsLoading}
              />
            </div>

            {/* Duration */}
            <div>
              <label className={fieldLabelClass}>Duration (Minutes)</label>
              <input
                type="number"
                placeholder="Enter the time"
                {...register('total_time', { valueAsNumber: true })}
                className={`${baseFieldClass} ${
                  errors.total_time ? 'border-red-300' : 'border-[#E5E7EB]'
                }`}
              />
              {errors.total_time && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.total_time.message}</p>
              )}
            </div>

            {/* Difficulty Level Radio Buttons matching Figma screenshot exactly */}
            <div>
              <label className={fieldLabelClass}>Test Difficulty Level</label>
              <div className="flex h-12 select-none items-center gap-10">
                {[
                  { label: 'Easy', value: 'easy' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Difficult', value: 'hard' },
                ].map((diff) => (
                  <label
                    key={diff.value}
                    className="flex cursor-pointer items-center gap-2.5 text-[16px] font-medium leading-[150%] tracking-normal text-[#374151]"
                  >
                    <input
                      type="radio"
                      value={diff.value}
                      {...register('difficulty')}
                      className="difficulty-radio"
                    />
                    <span>{diff.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Marking Scheme exactly aligned with Figma */}
          <div className="mt-8 w-full pt-2">
            <h3 className="mb-4 text-[16px] font-medium leading-[150%] tracking-normal text-[#374151]">Marking Scheme:</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              {/* Wrong Answer */}
              <div>
                <label className={fieldLabelClass}>Wrong Answer</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={wrongMarks >= 0 ? `+${wrongMarks}` : wrongMarks}
                    className="h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-sm font-medium text-[#374151] focus:outline-none"
                  />
                  <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center text-slate-400">
                    <ChevronUp
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-650"
                      onClick={() => setValue('wrong_marks', wrongMarks + 1)}
                    />
                    <ChevronDown
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-655 mt-0.5"
                      onClick={() => setValue('wrong_marks', wrongMarks - 1)}
                    />
                  </div>
                </div>
              </div>

              {/* Unattempted */}
              <div>
                <label className={fieldLabelClass}>Unattempted</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={unattemptMarks >= 0 ? `+${unattemptMarks}` : unattemptMarks}
                    className="h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-sm font-medium text-[#374151] focus:outline-none"
                  />
                  <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center text-slate-400">
                    <ChevronUp
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-650"
                      onClick={() => setValue('unattempt_marks', unattemptMarks + 1)}
                    />
                    <ChevronDown
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-655 mt-0.5"
                      onClick={() => setValue('unattempt_marks', unattemptMarks - 1)}
                    />
                  </div>
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className={fieldLabelClass}>Correct Answer</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={correctMarks >= 0 ? `+${correctMarks}` : correctMarks}
                    className="h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-sm font-medium text-[#374151] focus:outline-none"
                  />
                  <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center text-slate-400">
                    <ChevronUp
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-650"
                      onClick={() => setValue('correct_marks', correctMarks + 1)}
                    />
                    <ChevronDown
                      className="h-3.5 w-3.5 cursor-pointer hover:text-slate-655 mt-0.5"
                      onClick={() => setValue('correct_marks', correctMarks - 1)}
                    />
                  </div>
                </div>
              </div>

              {/* No of Questions */}
              <div>
                <label className={fieldLabelClass}>No of Questions</label>
                <input
                  type="number"
                  placeholder="Ex:250 Marks"
                  {...register('total_questions', { valueAsNumber: true })}
                  className={`h-12 w-full rounded-[10px] border px-4 text-base font-medium leading-[150%] tracking-normal text-[#374151] focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.total_questions ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.total_questions && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.total_questions.message}</p>
                )}
              </div>

              {/* Total Marks */}
              <div>
                <label className={fieldLabelClass}>Total Marks</label>
                <input
                  type="text"
                  disabled
                  placeholder="Ex:250 Marks"
                  value={watch('total_marks') ? `${watch('total_marks')} Marks` : ''}
                  className="h-12 w-full cursor-not-allowed select-none rounded-[10px] border border-[#EEF2F7] bg-[#F8FAFC] px-4 text-sm font-medium text-[#98A2B3]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons exactly matching design buttons style */}
          <div className="flex w-full items-center justify-end gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cursor-pointer rounded-lg bg-[#F8FAFC] px-8 py-2.5 text-sm font-semibold text-[#3D4FCB] transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit((data: TestFormData) => saveTest(data, true))}
              className="cursor-pointer rounded-lg bg-blue-600 px-9 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-colors hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
export default CreateEditTest;
