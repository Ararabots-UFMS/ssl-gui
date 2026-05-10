import { ref } from 'vue'

export type LogType = 'info' | 'error' | 'referee'
export interface LogEntry { message: string; timestamp: Date; type: LogType }

const generalLogs = ref<LogEntry[]>([])
const refereeLogs = ref<LogEntry[]>([])

export function addGeneralLog(message: string, type: 'info' | 'error' = 'info') {
  generalLogs.value.push({ message, timestamp: new Date(), type })
}

export function addRefereeLog(message: string, timestamp: Date) {
  refereeLogs.value.push({ message: `[REFEREE] Issued: ${message}`, timestamp, type: 'referee' })
}

export function useLogs() {
  return { generalLogs, refereeLogs, addGeneralLog, addRefereeLog }
}
