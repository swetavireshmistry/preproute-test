import React from 'react';
import { BarChart3, Brain, Clock, Edit2, FileQuestionMark } from 'lucide-react';
import arStickersIcon from '../assets/images/ar_stickers.svg';

interface TestSummaryCardProps {
  type: string;
  name: string;
  difficulty: string;
  subject: string;
  topics: string[];
  subTopics: string[];
  totalTime: number;
  totalQuestions: number;
  totalMarks: number;
  onEdit?: () => void;
}

const formatTypeLabel = (type: string) => {
  if (type === 'chapterwise') return 'Chapter Wise';
  if (type === 'pyq') return 'PYQ';
  if (type === 'mock') return 'Mock Test';
  return type;
};

const difficultyColors: Record<string, string> = {
  easy: '#2AB7A9',
  medium: '#F59E0B',
  hard: '#EF4444',
};

const getDifficultyLabel = (value: string) => {
  if (value === 'hard') return 'Difficult';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getDifficultyBadge = (difficulty: string) => {
  const value = difficulty?.toLowerCase() || 'easy';
  const label = getDifficultyLabel(value);
  const backgroundColor = difficultyColors[value] || difficultyColors.easy;

  return (
    <span
      className="inline-flex box-border items-center justify-center text-xs font-medium text-white"
      style={{
        backgroundColor,
        minWidth: '100px',
        height: '24px',
        gap: '8px',
        paddingLeft: '10px',
        paddingRight: '10px',
        borderRadius: '12px',
      }}
    >
      <Brain className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
};

const labelClass = 'align-bottom text-xs font-normal leading-[150%] tracking-normal text-[#6B7180]';
const answerClass = 'align-bottom text-base font-medium leading-[150%] tracking-normal text-[#6B7280]';

const topicTagStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  minWidth: '81px',
  minHeight: '24px',
  paddingTop: '3px',
  paddingRight: '10px',
  paddingBottom: '3px',
  paddingLeft: '10px',
  borderWidth: '0.5px',
  borderStyle: 'solid',
  borderColor: '#E9B406',
  borderRadius: '8px',
};

const TopicTag: React.FC<{ label: string }> = ({ label }) => (
  <span
    className="inline-flex items-center justify-center whitespace-nowrap bg-white text-center text-xs font-normal leading-none tracking-normal text-[#E9B406]"
    style={topicTagStyle}
  >
    {label}
  </span>
);

export const TestSummaryCard: React.FC<TestSummaryCardProps> = ({
  type,
  name,
  difficulty,
  subject,
  topics,
  subTopics,
  totalTime,
  totalQuestions,
  totalMarks,
  onEdit,
}) => {
  return (
    <div className="relative rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <span
          className="inline-flex items-end rounded-full px-3.5 py-1 align-bottom text-sm font-normal leading-[150%] tracking-normal text-white"
          style={{ background: 'linear-gradient(104.9deg, #07013C 0%, #000A3A 102.39%)' }}
        >
          {formatTypeLabel(type)}
        </span>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer rounded-lg p-1.5 text-[#384EC7] transition-colors hover:bg-[#F5F7FF]"
            title="Edit Test Settings"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-5 flex items-end gap-2">
        <img src={arStickersIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
        <h3 className="align-bottom text-base font-bold leading-[150%] tracking-normal text-[#000000]">{name}</h3>
        {getDifficultyBadge(difficulty)}
      </div>

      <div className="flex items-end justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex items-end gap-2">
            <span className={`w-20 ${labelClass}`}>Subject</span>
            <span className={labelClass}>:</span>
            <span className={answerClass}>{subject || 'Unassigned'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-20 shrink-0 ${labelClass}`}>Topic</span>
            <span className={labelClass}>:</span>
            <div className="flex flex-wrap items-center gap-[10px]">
              {topics.length > 0 ? (
                topics.map((topic) => <TopicTag key={topic} label={topic} />)
              ) : (
                <span className={answerClass}>Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-20 shrink-0 ${labelClass}`}>Sub Topic</span>
            <span className={labelClass}>:</span>
            <div className="flex flex-wrap items-center gap-[10px]">
              {subTopics.length > 0 ? (
                subTopics.map((subTopic) => <TopicTag key={subTopic} label={subTopic} />)
              ) : (
                <span className={answerClass}>Unassigned</span>
              )}
            </div>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium leading-[150%] text-[#6B7280]">
          <div className="flex items-center gap-2 pr-4">
            <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{totalTime} Min</span>
          </div>
          <div className="h-4 w-px bg-[#E5E7EB]" />
          <div className="flex items-center gap-2 px-4">
            <FileQuestionMark className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{totalQuestions} Q&apos;s</span>
          </div>
          <div className="h-4 w-px bg-[#E5E7EB]" />
          <div className="flex items-center gap-2 pl-4">
            <BarChart3 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{totalMarks} Marks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSummaryCard;
