import type { Question, Topic, SubTopic } from '../../types';
import type { QuestionFormData } from './schema';
import { stripHtml } from '../../utils/string';

export const EMPTY_FORM_VALUES: QuestionFormData = {
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correct_option: 'option1',
  explanation: '',
  difficulty: 'medium',
  topic_id: '',
  sub_topic_id: '',
  media_url: '',
};

export const OPTION_FIELDS = [
  { key: 'option1' as const, field: 'option1' as const },
  { key: 'option2' as const, field: 'option2' as const },
  { key: 'option3' as const, field: 'option3' as const },
  { key: 'option4' as const, field: 'option4' as const },
];

export const hasQuestionInput = (values: QuestionFormData): boolean =>
  stripHtml(values.question).length > 0 ||
  values.option1.trim().length > 0 ||
  values.option2.trim().length > 0 ||
  values.option3.trim().length > 0 ||
  values.option4.trim().length > 0 ||
  (values.explanation || '').trim().length > 0;

export const isFilledQuestion = (question: Question | null): question is Question =>
  question !== null &&
  stripHtml(question.question).trim().length > 0 &&
  !!question.option1?.trim() &&
  !!question.option2?.trim() &&
  !!question.option3?.trim() &&
  !!question.option4?.trim() &&
  !!question.correct_option;

const resolveTopicId = (question: Question, topics: Topic[]): string => {
  if (question.topic_id) return question.topic_id;
  if (question.topic) {
    return topics.find((topic) => topic.name === question.topic)?.id ?? '';
  }
  return '';
};

const resolveSubTopicId = (question: Question, subTopics: SubTopic[]): string => {
  if (question.sub_topic_id) return question.sub_topic_id;
  if (question.sub_topic) {
    return subTopics.find((subTopic) => subTopic.name === question.sub_topic)?.id ?? '';
  }
  return '';
};

export const questionToFormValues = (
  question: Question,
  availableTopics: Topic[],
  availableSubTopics: SubTopic[]
): QuestionFormData => ({
  question: question.question,
  option1: question.option1,
  option2: question.option2,
  option3: question.option3,
  option4: question.option4,
  correct_option: question.correct_option,
  explanation: question.explanation || '',
  difficulty: question.difficulty || 'medium',
  media_url: question.media_url || '',
  topic_id: resolveTopicId(question, availableTopics),
  sub_topic_id: resolveSubTopicId(question, availableSubTopics),
});

interface BuildQuestionContext {
  existingId?: string;
  testId: string;
  subject: string;
  availableTopics: Topic[];
  availableSubTopics: SubTopic[];
}

export const buildQuestionFromForm = (
  values: QuestionFormData,
  context: BuildQuestionContext
): Question => {
  const topic = context.availableTopics.find((item) => item.id === values.topic_id);
  const subTopic = context.availableSubTopics.find((item) => item.id === values.sub_topic_id);

  return {
    id: context.existingId,
    type: 'mcq',
    question: values.question,
    option1: values.option1,
    option2: values.option2,
    option3: values.option3,
    option4: values.option4,
    correct_option: values.correct_option,
    explanation: values.explanation || '',
    difficulty: values.difficulty || 'medium',
    test_id: context.testId,
    subject: context.subject,
    topic: topic?.name,
    sub_topic: subTopic?.name,
    topic_id: values.topic_id || undefined,
    sub_topic_id: values.sub_topic_id || undefined,
    media_url: values.media_url || undefined,
  };
};

export const stripTopicIdsForCreate = (
  question: Question
): Omit<Question, 'topic_id' | 'sub_topic_id'> => {
  const result = { ...question };
  delete result.topic_id;
  delete result.sub_topic_id;
  return result;
};
