import type {TaskKind} from './world';
export type TaskStatus='not_started'|'in_progress'|'completed';
export interface TaskProgress {status:TaskStatus; data:Record<string,unknown>}
const key='altweb-task-progress-v1';
let tasks:Partial<Record<TaskKind,TaskProgress>>={};
try{const raw=JSON.parse(localStorage.getItem(key)||'{}');for(const kind of ['design','backend','qa'] as const){const v=raw?.[kind];if(v&&['not_started','in_progress','completed'].includes(v.status)&&v.data&&typeof v.data==='object'&&!Array.isArray(v.data))tasks[kind]={status:v.status,data:v.data};}}catch{}
export function taskProgress(kind:TaskKind):TaskProgress{return tasks[kind]??{status:'not_started',data:{}};}
export function saveTask(kind:TaskKind,status:TaskStatus,data:Record<string,unknown>){tasks[kind]={status,data};try{localStorage.setItem(key,JSON.stringify(tasks));}catch{}}
export function clearTasks(){tasks={};try{localStorage.removeItem(key);}catch{}}
