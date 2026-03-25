export interface CreateSubmissionBody {
  task_id: string
  task_title: string
  payable_amount: number
  worker_email: string
  worker_name: string
  buyer_name: string
  buyer_email: string
  submission_details: string
  current_date: string
}

export interface WorkerSubmissionQuery {
  page?: string
  limit?: string
}

