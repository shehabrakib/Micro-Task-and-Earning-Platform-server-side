export interface CreateTaskBody {
  task_title: string
  task_detail: string
  required_workers: number
  payable_amount: number
  completion_date: string
  submission_info: string
  task_image_url: string
  buyer_email: string
  buyer_name: string
}

export interface UpdateTaskBody {
  task_title?: string
  task_detail?: string
  submission_info?: string
}

