export interface CreateWithdrawalBody {
  worker_email: string
  worker_name: string
  withdrawal_coin: number
  withdrawal_amount: number
  payment_system: string
  account_number: string
  withdraw_date: string
}

