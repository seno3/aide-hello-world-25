export interface TeachingCard {
  mode: 'explain' | 'capsule' | 'bug' | 'tradeoff';
  risk: 'low' | 'medium' | 'high';
  concept_tags: string[];
  summary_why: string;
  diff: {
    unified: string;
  };
  callouts: Array<{
    anchor: string;
    note: string;
  }>;
  micro_check: {
    type: 'mcq' | 'fill';
    question: string;
    choices?: string[];
    answer_index?: number;
    answer_fill?: string;
    explain_on_wrong: string;
  };
  actions: {
    apply_requires_confirm: boolean;
    suggest_alternatives: Array<{
      label: string;
      diff: string;
      tradeoff: string;
    }>;
    next_step: string;
  };
  telemetry: {
    confidence: number;
    estimated_read_time_s: number;
    patterns_detected: string[];
  };
}

export interface Context {
  event: string;
  filePath: string;
  before: string;
  after: string;
  unifiedDiff: string;
  frameworksHint: string[];
  terminalTail: string;
  testsTail: string;
  riskHint: string;
  userMode: string;
}

export interface LearningEvent {
  timestamp: string;
  file: string;
  mode: string;
  risk: string;
  concept_tags: string[];
  quiz_correct: boolean | null;
  applied: boolean;
  latency_ms: number;
}

export interface ConceptNode {
  concept: string;
  count: number;
  lastSeen: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}
