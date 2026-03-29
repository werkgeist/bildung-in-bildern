export interface LessonImage {
  id: string;
  src: string;
  label: string;
  alt: string;
}

export interface QuizOption {
  id: string;
  imageSrc: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty?: 1 | 2 | 3;
  sequence: LessonImage[];
  questions: QuizQuestion[];
}
