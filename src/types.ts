export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string or formatted string
  urgency: 'high' | 'medium' | 'low';
  urgencyReason: string;
  status: 'pending' | 'done';
  actionable?: boolean; // whether it requires outbound communication or a prompt draft
  actionType?: string; // type of action, e.g. "email", "notification", "none"
  subTasks?: string[]; // exactly 3 micro-tasks if complex, or empty array
  completedSubTasks?: string[]; // tracking completed micro-tasks on the frontend
}

export interface TimelineItem {
  startTime: string; // e.g. "13:00"
  endTime: string;   // e.g. "14:00"
  title: string;
  description: string;
  associatedTaskId: string | null;
}

export interface ParseTasksRequest {
  inputText: string;
  referenceTime: string; // client's local time context for resolving relative dates
}

export interface ParseTasksResponse {
  tasks: Omit<Task, 'id' | 'status'>[];
  isFallback?: boolean;
}

export interface PlanDayRequest {
  tasks: Task[];
  currentTime: string; // Current time of user to plan from
}

export interface PlanDayResponse {
  schedule: TimelineItem[];
  coachingMessage: string; // A motivating sentence from Gemini
  isFallback?: boolean;
}
