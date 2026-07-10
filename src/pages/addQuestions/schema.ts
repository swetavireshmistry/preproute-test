import { z } from 'zod';
import { stripHtml } from '../../utils/string';

export const questionSchema = z.object({
  question: z.string().refine((val) => stripHtml(val).length > 0, 'Question text is required'),
  option1: z.string().min(1, 'Option A is required'),
  option2: z.string().min(1, 'Option B is required'),
  option3: z.string().min(1, 'Option C is required'),
  option4: z.string().min(1, 'Option D is required'),
  correct_option: z.enum(['option1', 'option2', 'option3', 'option4']),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic_id: z.string().optional(),
  sub_topic_id: z.string().optional(),
  media_url: z.string().optional(),
}).refine(
  (data) => {
    const o1 = data.option1.trim().toLowerCase();
    const o2 = data.option2.trim().toLowerCase();
    const o3 = data.option3.trim().toLowerCase();
    const o4 = data.option4.trim().toLowerCase();
    
    if (!o1 || !o2 || !o3 || !o4) return true;
    
    return o1 !== o2 && o1 !== o3 && o1 !== o4 && o2 !== o3 && o2 !== o4 && o3 !== o4;
  },
  {
    message: 'All options must be unique. Duplicate options are not allowed.',
    path: ['option1'],
  }
);

export type QuestionFormData = z.infer<typeof questionSchema>;
