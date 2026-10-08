export interface CandidateProfile {
  id: string;
  fullName: string;
  title: string;
  summary: string;
  yearsOfExperience: number;
  skills: string[];
  experiences: ExperienceItem[];
  education?: string[];
  rawText?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string[];
  technologies: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  sourceUrl?: string;
  rawDescription: string;
  requirements?: string[];
  createdAt: string;
}

export type MatchRecommendation = 'strong_match' | 'good_match' | 'partial_match' | 'low_match';

export interface SkillMatchItem {
  skill: string;
  detectedInCV: boolean;
  yearsExperience?: number;
  importance: 'critical' | 'nice_to_have';
}

export interface MatchAnalysisResult {
  jobId: string;
  profileId: string;
  score: number; // 0 - 100
  recommendation: MatchRecommendation;
  summary: string;
  strengths: string[];
  missingSkills: string[];
  experienceGaps: string[];
  tailoringTips: string[];
  interviewTips: string[];
  calculatedAt: string;
}

export interface TailoredCVResult {
  jobId: string;
  tailoredSummary: string;
  highlightedSkills: string[];
  optimizedExperiences: {
    company: string;
    position: string;
    period?: string;
    bullets: string[];
  }[];
  atsKeywordsAdded: string[];
}

export type CoverLetterLength = 'short' | 'standard' | 'full';

export interface CoverLetterResult {
  jobId: string;
  content: string;
  subjectLine: string;
  length?: CoverLetterLength;
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationTrackerItem {
  id: string;
  job: JobListing;
  status: ApplicationStatus;
  appliedDate?: string;
  matchScore?: number;
  notes?: string;
  updatedAt: string;
}

