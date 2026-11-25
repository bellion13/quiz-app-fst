const { z } = require('zod');

const normalizeKey = (str) => {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
};

const questionSchema = z.object({
  topic: z.enum(['html', 'css', 'js', 'react'], {
    errorMap: () => ({ message: 'Chủ đề phải là một trong: html, css, js, react' }),
  }),
  question: z.string().trim().min(1, 'Nội dung câu hỏi không được để trống'),
  options: z.array(z.string().trim().min(1, 'Lựa chọn đáp án không được để trống'))
    .min(2, 'Câu hỏi phải có ít nhất 2 đáp án lựa chọn'),
  answer: z.number().int('Vị trí đáp án đúng phải là số nguyên'),
  explanation: z.string().optional().default(''),
}).refine((data) => data.answer >= 0 && data.answer < data.options.length, {
  message: 'Vị trí đáp án đúng (answer) phải nằm trong phạm vi các lựa chọn (0 đến số lựa chọn - 1)',
  path: ['answer'],
});

module.exports = {
  questionSchema,
  normalizeKey,
};
