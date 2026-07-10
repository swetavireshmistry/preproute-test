import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import type { Test, Question, Topic, SubTopic } from '../types';
import { isApiSuccess, getApiErrorMessage } from '../utils/api';
import { parseStringList } from '../utils/string';
import { MainLayout } from '../components/MainLayout';
import { TestSummaryCard } from '../components/TestSummaryCard';
import { WysiwygEditor } from '../components/WysiwygEditor';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import {
  Trash2,
  Download,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileUp,
  ChevronsRight,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { questionSchema, type QuestionFormData } from './addQuestions/schema';
import {
  EMPTY_FORM_VALUES,
  OPTION_FIELDS,
  buildQuestionFromForm,
  hasQuestionInput,
  isFilledQuestion,
  questionToFormValues,
} from './addQuestions/helpers';
import {
  FIELD_CLASS,
  SETTINGS_LABEL_CLASS,
  OPTION_INPUT_CLASS,
  HEADER_ACTION_BUTTON_STYLE,
  PRIMARY_BUTTON_STYLE,
  EXIT_BUTTON_STYLE,
} from './addQuestions/constants';

const DEFAULT_QUESTION_COUNT = 10;

export const AddQuestions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [availableSubTopics, setAvailableSubTopics] = useState<SubTopic[]>([]);
  const [questionsList, setQuestionsList] = useState<(Question | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // skip \n
        row.push(currentVal.trim());
        lines.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      lines.push(row);
    }
    return lines;
  };

  const mapCSVToQuestions = (
    lines: string[][],
    testId: string,
    subject: string,
    topicsList: Topic[],
    subTopicsList: SubTopic[]
  ): Question[] => {
    if (lines.length < 2) return [];
    const headers = lines[0].map((h) => h.toLowerCase().trim());

    const questionIdx = headers.findIndex((h) => h.includes('question'));
    const opt1Idx = headers.findIndex((h) => h.includes('option1') || h === 'option a' || h === 'a');
    const opt2Idx = headers.findIndex((h) => h.includes('option2') || h === 'option b' || h === 'b');
    const opt3Idx = headers.findIndex((h) => h.includes('option3') || h === 'option c' || h === 'c');
    const opt4Idx = headers.findIndex((h) => h.includes('option4') || h === 'option d' || h === 'd');
    const correctIdx = headers.findIndex((h) => h.includes('correct') || h === 'answer');
    const expIdx = headers.findIndex((h) => h.includes('explanation') || h === 'solution');
    const diffIdx = headers.findIndex((h) => h === 'difficulty');
    const topicIdx = headers.findIndex((h) => h === 'topic');
    const subTopicIdx = headers.findIndex((h) => h.includes('sub_topic') || h.includes('subtopic'));

    const result: Question[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

      const questionText = row[questionIdx] || '';
      const option1 = row[opt1Idx] || '';
      const option2 = row[opt2Idx] || '';
      const option3 = row[opt3Idx] || '';
      const option4 = row[opt4Idx] || '';

      const correctRaw = (row[correctIdx] || '').toLowerCase().trim();
      let correct_option: 'option1' | 'option2' | 'option3' | 'option4' = 'option1';
      if (correctRaw === 'option2' || correctRaw === 'option_2' || correctRaw === 'b' || correctRaw === '2') {
        correct_option = 'option2';
      } else if (correctRaw === 'option3' || correctRaw === 'option_3' || correctRaw === 'c' || correctRaw === '3') {
        correct_option = 'option3';
      } else if (correctRaw === 'option4' || correctRaw === 'option_4' || correctRaw === 'd' || correctRaw === '4') {
        correct_option = 'option4';
      }

      const explanation = row[expIdx] || '';

      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      const diffRaw = (row[diffIdx] || '').toLowerCase().trim();
      if (diffRaw === 'easy') difficulty = 'easy';
      else if (diffRaw === 'hard' || diffRaw === 'difficult') difficulty = 'hard';

      const topicName = row[topicIdx] || '';
      const subTopicName = row[subTopicIdx] || '';

      const matchedTopic = topicsList.find((t) => t.name.toLowerCase() === topicName.toLowerCase());
      const matchedSubTopic = subTopicsList.find((st) => st.name.toLowerCase() === subTopicName.toLowerCase());

      result.push({
        type: 'mcq',
        question: questionText,
        option1,
        option2,
        option3,
        option4,
        correct_option,
        explanation,
        difficulty,
        test_id: testId,
        subject,
        topic: matchedTopic?.name || topicName || undefined,
        sub_topic: matchedSubTopic?.name || subTopicName || undefined,
        topic_id: matchedTopic?.id || undefined,
        sub_topic_id: matchedSubTopic?.id || undefined,
      });
    }

    return result;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = parseCSV(text);
        if (lines.length < 2) {
          toast.error('Invalid CSV format. Please make sure the CSV has headers and content.');
          return;
        }

        const parsed = mapCSVToQuestions(lines, id || '', test?.subject || '', availableTopics, availableSubTopics);
        if (parsed.length === 0) {
          toast.error('No questions found in the CSV.');
          return;
        }

        setQuestionsList((prev) => {
          const updated = [...prev];
          for (let i = 0; i < parsed.length; i++) {
            if (i < updated.length) {
              updated[i] = parsed[i];
            } else {
              updated.push(parsed[i]);
            }
          }
          return updated;
        });

        if (parsed.length > currentIdx) {
          reset(questionToFormValues(parsed[currentIdx], availableTopics, availableSubTopics));
        }

        toast.success(`Successfully imported ${parsed.length} questions from CSV!`);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        toast.error('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadSampleCSV = () => {
    const rows = [
      ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation', 'Difficulty', 'Topic', 'Sub-topic'],
      ['What is 2 + 2?', '3', '4', '5', '6', 'Option B', 'Basic arithmetic: 2 added to 2 equals 4.', 'easy', 'Arithmetic', 'Addition'],
      ['Which planet is closest to the Sun?', 'Venus', 'Mars', 'Mercury', 'Jupiter', 'Option C', 'Mercury is the innermost planet in the Solar System.', 'easy', 'Solar System', 'Planets'],
      ['What is the chemical formula of water?', 'CO2', 'H2O2', 'H2O', 'NaCl', 'Option C', 'Water is composed of 2 hydrogen atoms and 1 oxygen atom.', 'easy', 'Chemistry', 'Chemical Formulas'],
      ['Who wrote the play "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'Option B', 'Romeo and Juliet is a tragedy written by William Shakespeare around 1594–1596.', 'easy', 'Literature', 'English Drama'],
      ['What is the powerhouse of the cell?', 'Nucleus', 'Ribosome', 'Golgi Apparatus', 'Mitochondria', 'Option D', 'Mitochondria produce ATP through cellular respiration, earning the title powerhouse of the cell.', 'easy', 'Biology', 'Cell Biology'],
      ['Which gas is most abundant in Earth\'s atmosphere?', 'Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon', 'Option C', 'Nitrogen makes up approximately 78% of Earth\'s atmosphere.', 'medium', 'Environment', 'Atmosphere'],
      ['If a train travels 300 km in 3 hours, what is its average speed?', '90 km/h', '100 km/h', '120 km/h', '150 km/h', 'Option B', 'Speed = Distance / Time = 300 / 3 = 100 km/h.', 'medium', 'Arithmetic', 'Speed and Distance'],
      ['What is the value of Pi (π) up to two decimal places?', '3.12', '3.41', '3.14', '3.16', 'Option C', 'Pi is an irrational number approximately equal to 3.14159...', 'medium', 'Mathematics', 'Geometry'],
      ['In which year did World War II end?', '1940', '1943', '1945', '1947', 'Option C', 'World War II ended in 1945 with the surrender of Germany in May and Japan in September.', 'medium', 'History', 'World War II'],
      ['What is the derivative of sin(x)?', '-cos(x)', 'cos(x)', 'tan(x)', '-sin(x)', 'Option B', 'The derivative of sin(x) with respect to x is cos(x), a fundamental result in calculus.', 'hard', 'Mathematics', 'Calculus'],
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'preproute_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const handleAddMCQ = () => {
    saveActiveQuestionToState();
    
    // Add a new empty question slot
    setQuestionsList((prev) => [...prev, null]);
    
    // Navigate to the newly added slot
    const newIdx = questionsList.length;
    setCurrentIdx(newIdx);
    
    // Reset form to empty values
    reset(EMPTY_FORM_VALUES);
    
    toast.success('Added new MCQ question slot!');
  };

  const {
    register,
    setValue,
    reset,
    getValues,
    control,
    trigger,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadTopicsAndSubTopics = async (testData: Test) => {
      const subjectsRes = await api.getSubjects();
      if (cancelled || !isApiSuccess(subjectsRes)) return;

      const matchedSubject = subjectsRes.data.find(
        (subject) => subject.name === testData.subject || subject.id === testData.subject
      );
      if (!matchedSubject) return;

      const topicsRes = await api.getTopicsBySubject(matchedSubject.id);
      if (cancelled || !isApiSuccess(topicsRes)) return;

      const testTopics = parseStringList(testData.topics);
      const filteredTopics = topicsRes.data.filter(
        (topic) => testTopics.includes(topic.name) || testTopics.includes(topic.id)
      );
      setAvailableTopics(filteredTopics);

      const filteredTopicIds = filteredTopics.map((topic) => topic.id);
      if (filteredTopicIds.length === 0) return;

      const subTopicsRes = await api.getSubTopicsByMultiTopics(filteredTopicIds);
      if (cancelled || !isApiSuccess(subTopicsRes)) return;

      const testSubTopics = parseStringList(testData.sub_topics);
      setAvailableSubTopics(
        subTopicsRes.data.filter(
          (subTopic) => testSubTopics.includes(subTopic.name) || testSubTopics.includes(subTopic.id)
        )
      );
    };

    const loadExistingQuestions = async (testData: Test, totalQuestionsCount: number) => {
      if (!testData.questions?.length) return;

      const questionsRes = await api.fetchBulkQuestions(testData.questions);
      if (cancelled || !isApiSuccess(questionsRes)) return;

      setQuestionsList((prev) => {
        const updated = [...prev];
        questionsRes.data.forEach((question, index) => {
          if (index < totalQuestionsCount) updated[index] = question;
        });
        return updated;
      });
    };

    const loadData = async () => {
      setLoading(true);
      try {
        const testRes = await api.getTestById(id);
        if (cancelled) return;

        if (!isApiSuccess(testRes)) {
          setLoading(false);
          return;
        }

        const testData = testRes.data;
        const totalQuestionsCount = testData.total_questions || DEFAULT_QUESTION_COUNT;

        setTest(testData);
        setQuestionsList(Array(totalQuestionsCount).fill(null));
        setLoading(false);

        void Promise.all([
          loadTopicsAndSubTopics(testData),
          loadExistingQuestions(testData, totalQuestionsCount),
        ]);
      } catch (err: unknown) {
        console.error('Error loading questions page data:', err);
        toast.error('Failed to load test questions data.');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (loading) return;

    const question = questionsList[currentIdx];
    if (question) {
      reset(questionToFormValues(question, availableTopics, availableSubTopics));
    } else {
      reset(EMPTY_FORM_VALUES);
    }
    // availableTopics/availableSubTopics load async; omit to avoid resetting user input mid-edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, loading, questionsList]);

  const getQuestionContext = useCallback(
    (existingId?: string) => ({
      existingId,
      testId: id || '',
      subject: test?.subject || '',
      availableTopics,
      availableSubTopics,
    }),
    [id, test?.subject, availableTopics, availableSubTopics]
  );

  const saveActiveQuestionToState = useCallback(() => {
    const values = getValues();
    setQuestionsList((prev) => {
      const updated = [...prev];
      updated[currentIdx] = hasQuestionInput(values)
        ? buildQuestionFromForm(values, getQuestionContext(prev[currentIdx]?.id))
        : null;
      return updated;
    });
  }, [currentIdx, getValues, getQuestionContext]);

  const handleClearCurrent = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmClearCurrent = () => {
    setQuestionsList((prev) => {
      const updated = [...prev];
      updated[currentIdx] = null;
      return updated;
    });
    reset(EMPTY_FORM_VALUES);
    toast.success('Question edits cleared.');
  };

  const handleSaveAndSubmitFlow = async () => {
    // 1. Validate the active/current question form fields
    const isCurrentValid = await trigger();
    if (!isCurrentValid) {
      toast.error('Please complete all required fields for the current question.');
      return;
    }

    const values = getValues();
    const finalQuestionsList = [...questionsList];
    finalQuestionsList[currentIdx] = hasQuestionInput(values)
      ? buildQuestionFromForm(values, getQuestionContext(questionsList[currentIdx]?.id))
      : null;

    // Save active changes to react state so they are not lost on redirect
    setQuestionsList(finalQuestionsList);

    // 2. Validate that all question slots in the test are complete
    const incompleteIdx = finalQuestionsList.findIndex((q) => !isFilledQuestion(q));
    if (incompleteIdx !== -1) {
      toast.error(`Question ${incompleteIdx + 1} is empty or incomplete. All questions must be completed before saving.`);
      setCurrentIdx(incompleteIdx);
      return;
    }

    // 3. Validate that no question has duplicate options
    const duplicateIdx = finalQuestionsList.findIndex((q) => {
      if (!q) return false;
      const o1 = q.option1.trim().toLowerCase();
      const o2 = q.option2.trim().toLowerCase();
      const o3 = q.option3.trim().toLowerCase();
      const o4 = q.option4.trim().toLowerCase();
      return o1 === o2 || o1 === o3 || o1 === o4 || o2 === o3 || o2 === o4 || o3 === o4;
    });

    if (duplicateIdx !== -1) {
      toast.error(`Question ${duplicateIdx + 1} has duplicate options. Each option must be unique.`);
      setCurrentIdx(duplicateIdx);
      return;
    }

    const filledQuestions = finalQuestionsList.filter(isFilledQuestion);

    setSaving(true);
    try {
      let finalQuestionIds: string[] = [];

      if (filledQuestions.length > 0) {
        const preparedQuestions = filledQuestions.map((q) => {
          const result = { ...q };
          delete result.id;
          delete result.topic_id;
          delete result.sub_topic_id;
          return result;
        });
        const createRes = await api.bulkCreateQuestions(preparedQuestions);
        if (isApiSuccess(createRes)) {
          finalQuestionIds = createRes.data.map((question) => question.id || '');
        }
      }

      if (id && test) {
        await api.updateTest(id, {
          name: test.name,
          questions: finalQuestionIds,
          total_questions: finalQuestionIds.length,
          total_marks: finalQuestionIds.length * (test.correct_marks || 4),
        });

        toast.success('Questions saved successfully!');
        navigate(`/tests/${id}/preview`);
      }
    } catch (err: unknown) {
      console.error('Error saving questions:', err);
      toast.error(getApiErrorMessage(err, 'Failed to save questions. Check network fields.'));
    } finally {
      setSaving(false);
    }
  };

  const handleNextButton = async () => {
    saveActiveQuestionToState();
    if (currentIdx < questionsList.length - 1) {
      setCurrentIdx(currentIdx + 1);
      return;
    }
    await handleSaveAndSubmitFlow();
  };

  const handlePrevQuestion = () => {
    if (currentIdx <= 0) return;
    saveActiveQuestionToState();
    setCurrentIdx(currentIdx - 1);
  };

  const handleNextQuestion = () => {
    if (currentIdx >= questionsList.length - 1) return;
    saveActiveQuestionToState();
    setCurrentIdx(currentIdx + 1);
  };

  const navigateToQuestion = (index: number) => {
    saveActiveQuestionToState();
    setCurrentIdx(index);
  };

  const sidebarContent = (
    <>
      <p className="text-sm font-medium leading-[150%] tracking-normal text-[#6B7180] select-none">
        Total Questions . {questionsList.length}
      </p>

      <div className="flex flex-col gap-[10px]">
        {questionsList.map((question, index) => {
          const isSelected = index === currentIdx;
          const hasContent = isFilledQuestion(question);

          return (
            <button
              key={index}
              type="button"
              onClick={() => navigateToQuestion(index)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-all ${
                hasContent
                  ? isSelected
                    ? 'border-[#0C9D61] bg-emerald-50'
                    : 'border-[#0C9D61] bg-white hover:bg-emerald-50/50'
                  : isSelected
                    ? 'border-[#D1D5DB] bg-slate-50'
                    : 'border-[#D1D5DB] bg-white hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                {hasContent ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 fill-[#0C9D61] text-white" />
                ) : (
                  <MinusCircle className="h-4 w-4 shrink-0 fill-[#D1D5DB] text-white" />
                )}
                <span
                  className={`text-xs font-normal leading-[150%] tracking-normal ${
                    hasContent ? 'text-[#0C9D61]' : 'text-[#D1D5DB]'
                  }`}
                >
                  Question {index + 1}
                </span>
              </span>
              <ChevronsRight
                className={`h-3.5 w-3.5 shrink-0 ${hasContent ? 'text-[#0C9D61]' : 'text-[#D1D5DB]'}`}
              />
            </button>
          );
        })}
      </div>
    </>
  );

  if (loading) {
    return (
      <MainLayout breadcrumbs={['Test creation']}>
        {/* TestSummaryCard skeleton */}
        <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
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
          <div className="flex flex-wrap gap-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Question header skeleton */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div className="skeleton h-5 w-32" />
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-24 rounded-lg" />
              <div className="skeleton h-9 w-24 rounded-lg" />
            </div>
          </div>

          {/* WYSIWYG editor skeleton */}
          <div className="skeleton h-40 w-full rounded-xl" />

          {/* Options skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-5 w-5 rounded-full" />
                <div className="skeleton h-12 flex-1 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Explanation skeleton */}
          <div className="skeleton h-28 w-full rounded-lg" />

          {/* Navigation skeleton */}
          <div className="flex items-center justify-between pt-4">
            <div className="skeleton h-12 w-40 rounded-lg" />
            <div className="skeleton h-12 w-32 rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }


  if (!test) {
    return (
      <MainLayout breadcrumbs={['Test creation']}>
        <div className="flex flex-col items-center justify-center bg-white py-20">
          <p className="font-medium text-red-500">Test details not found.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 text-sm font-bold text-[#384EC7] hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      breadcrumbs={['Test creation']}
      sidebarContent={sidebarContent}
      headerActions={
        <button
          type="button"
          onClick={handleSaveAndSubmitFlow}
          disabled={saving}
          className="inline-flex cursor-pointer select-none items-center justify-center rounded-[8px] bg-[#7489FF] align-bottom text-center text-base font-medium leading-[150%] tracking-normal text-[#FAFAFA] transition-opacity hover:opacity-90 disabled:opacity-60"
          style={PRIMARY_BUTTON_STYLE}
        >
          {saving ? 'Saving...' : 'Publish'}
        </button>
      }
    >
      <div className="mb-8">
        <TestSummaryCard
          type={test.type || 'chapterwise'}
          name={test.name}
          difficulty={test.difficulty || 'easy'}
          subject={test.subject || 'Unassigned'}
          topics={
            availableTopics.length > 0
              ? availableTopics.map((topic) => topic.name)
              : parseStringList(test.topics)
          }
          subTopics={
            availableSubTopics.length > 0
              ? availableSubTopics.map((subTopic) => subTopic.name)
              : parseStringList(test.sub_topics)
          }
          totalTime={test.total_time || 0}
          totalQuestions={test.total_questions || 0}
          totalMarks={test.total_marks || 0}
          onEdit={() => navigate(`/tests/edit/${id}`)}
        />
      </div>

      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium leading-[150%] tracking-normal text-[#07013C]">
            Question {currentIdx + 1}
            <span className="font-medium text-[#97BCF0]">/{questionsList.length}</span>
          </h3>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#384EC7] hover:underline cursor-pointer select-none"
            >
              <Download className="h-3.5 w-3.5" />
              Template
            </button>
            <button
              type="button"
              onClick={handleAddMCQ}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold leading-[150%] tracking-normal text-[#384EC7] transition-colors hover:bg-indigo-100 hover:text-indigo-800"
              style={HEADER_ACTION_BUTTON_STYLE}
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
              MCQ
            </button>
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-blue-200 bg-blue-50 px-3 text-xs font-bold leading-[150%] tracking-normal text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
              style={HEADER_ACTION_BUTTON_STYLE}
            >
              <FileUp className="h-4 w-4 shrink-0" strokeWidth={2} />
              CSV
            </button>
            <input
              type="file"
              accept=".csv"
              ref={csvInputRef}
              onChange={handleCSVUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* CSV Import Tip Banner */}
        {questionsList.every((q) => !q) && (
          <div className="rounded-xl border border-[#7489FF]/20 bg-[#F8FAFF] p-4 text-xs font-semibold text-[#384EC7] flex items-center gap-2 select-none shadow-xs">
            <Download className="h-4 w-4 text-[#7489FF] shrink-0" />
            <span>
              Quick Tip: Save time by importing questions in bulk! Download our{' '}
              <button
                onClick={downloadSampleCSV}
                type="button"
                className="text-[#7489FF] underline font-bold cursor-pointer hover:text-blue-700"
              >
                CSV Template
              </button>
              , fill in your questions, and click the **CSV** button in the top-right to upload.
            </span>
          </div>
        )}


        <button
          type="button"
          onClick={handleClearCurrent}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-normal leading-[150%] tracking-normal text-[#FF7F7F] transition-opacity hover:opacity-80"
        >
          <Trash2 className="h-[16.25px] w-[13.75px] shrink-0 text-[#FF7F7F]" strokeWidth={1.5} />
          <span>Delete All Edits</span>
        </button>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <Controller
            name="question"
            control={control}
            render={({ field }) => (
              <WysiwygEditor
                value={field.value}
                onChange={field.onChange}
                onClear={() => field.onChange('')}
                placeholder="Type here"
              />
            )}
          />
          {errors.question && (
            <p className="text-xs font-medium text-red-500">{errors.question.message}</p>
          )}



          <div className="space-y-4">
            <label className="block text-base font-medium leading-[150%] tracking-normal text-[#000000]">
              Type the options below
            </label>

            <div className="space-y-3">
              {OPTION_FIELDS.map((opt) => (
                <div key={opt.key} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      value={opt.key}
                      {...register('correct_option')}
                      className="difficulty-radio"
                    />
                    <div className="relative flex flex-1 items-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2.5 focus-within:border-[#384EC7]">
                      <input
                        type="text"
                        placeholder="Type Option here"
                        {...register(opt.field)}
                        className={OPTION_INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => setValue(opt.field, '')}
                        className="ml-2 cursor-pointer text-[#9CA3AF] transition-colors hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {errors[opt.field] && (
                    <p className="ml-8 text-xs font-medium text-red-500">{errors[opt.field]?.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#111827]">Add Solution</label>
            <div className="relative rounded-[8px] border border-[#E5E7EB] bg-white focus-within:border-[#384EC7]">
              <textarea
                rows={4}
                placeholder="Type here"
                {...register('explanation')}
                className="w-full resize-none bg-white px-4 py-3 text-base font-medium leading-[150%] tracking-normal text-[#374151] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setValue('explanation', '')}
                className="absolute right-3 top-3 cursor-pointer text-[#9CA3AF] transition-colors hover:text-[#EF4444]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mx-auto flex h-[28px] w-[306px] items-center justify-between py-6">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentIdx === 0}
              className="inline-flex h-[28px] w-[28px] cursor-pointer items-center justify-center text-[#9CA3AF] transition-colors hover:text-[#6B7180] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous question"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={currentIdx >= questionsList.length - 1}
              className="inline-flex h-[28px] w-[28px] cursor-pointer items-center justify-center text-[#9CA3AF] transition-colors hover:text-[#6B7180] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next question"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 pt-2">
            <h4 className="text-sm font-bold text-[#111827]">Question settings</h4>

            <div className="grid max-w-4xl grid-cols-1 gap-4">
              <div>
                <label className={SETTINGS_LABEL_CLASS}>Level of Difficulty</label>
                <div className="relative">
                  <select {...register('difficulty')} className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10`}>
                    <option value="">Select from Drop-down</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Difficult</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>

              <div>
                <label className={SETTINGS_LABEL_CLASS}>Topic</label>
                <div className="relative">
                  <select {...register('topic_id')} className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10`}>
                    <option value="">Select from Drop-down</option>
                    {availableTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>

              <div>
                <label className={SETTINGS_LABEL_CLASS}>Sub-topic</label>
                <div className="relative">
                  <select {...register('sub_topic_id')} className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10`}>
                    <option value="">Select from Drop-down</option>
                    {availableSubTopics.map((subTopic) => (
                      <option key={subTopic.id} value={subTopic.id}>
                        {subTopic.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex cursor-pointer items-center justify-center rounded-[8px] bg-[#FF7F7F] text-center text-base font-medium leading-[150%] tracking-normal text-white transition-opacity hover:opacity-90"
              style={EXIT_BUTTON_STYLE}
            >
              Exit Test Creation
            </button>

            <button
              type="button"
              onClick={handleNextButton}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center rounded-[8px] bg-[#7489FF] text-center text-base font-medium leading-[150%] tracking-normal text-[#FAFAFA] transition-opacity hover:opacity-90 disabled:opacity-60"
              style={PRIMARY_BUTTON_STYLE}
            >
              {saving ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmClearCurrent}
        title="Delete Question Edit"
        message="Are you sure you want to delete all edits for this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </MainLayout>
  );
};
