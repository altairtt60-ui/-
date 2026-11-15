import {npcWorkers} from '../content/world';

export type WorkerId=typeof npcWorkers[number]['id'];
const workers=new Map(npcWorkers.map((definition,index)=>[definition.id,{definition,index,period:7600+(index%5)*870}]));
const stages:Record<WorkerId,readonly string[]>={
 guide:['изучает маршрут','показывает цеха','проверяет карту','приветствует гостя'],
 dispatcher:['открывает бриф','заполняет план','проверяет детали','готовит карточку обсуждения'],
 mechanic:['берёт ключ','настраивает привод','проверяет давление','запускает конвейер'],
 designer:['выбирает заголовок','двигает текст на макете','выравнивает блоки','передаёт макет'],
 layout:['выбирает текстовый блок','переносит заголовок','проверяет сетку','закрепляет положение'],
 palette:['выбирает цвет','меняет цвета сайта','сравнивает версии','сохраняет палитру'],
 coder:['открывает файл','печатает TypeScript','собирает модуль','отправляет сборку'],
 reviewer:['переключает файл','читает ответ API','проверяет данные','подтверждает ответ'],
 cable:['берёт коннектор','подключает сервер','проверяет сигнал','фиксирует кабель'],
 courier:['забирает модуль','несёт сборку','ставит модуль на приёмник','возвращается'],
 inspector:['ставит экран на сканер','запускает проверку','находит ошибку','передаёт замечание'],
 finder:['выбирает замечание','исправляет кнопку','выравнивает интерфейс','отправляет на повторный тест'],
 retest:['загружает исправление','проверяет размеры','повторяет тест','ставит отметку готовности'],
 'archive-courier':['забирает экран','несёт проект','передаёт экран на полку','возвращается'],
 curator:['выбирает проект','открывает крупный экран','сравнивает версии','публикует карточку'],
 sorter:['читает статус','сортирует экраны','ставит экран в ячейку','проверяет порядок'],
 'lift-operator':['принимает экран','поднимает полку','ставит экран на стенд','возвращает подъёмник'],
};

/** One clock drives a worker's hands and the result on that worker's equipment. */
export function workCycle(id:WorkerId,time:number){
 const worker=workers.get(id)!;
 const elapsed=time+worker.definition.phase,phase=(elapsed%worker.period)/worker.period;
 const stage=Math.min(3,Math.floor(phase*4));
 return {...worker,phase,stage,stageProgress:phase*4-stage,cycle:Math.floor(elapsed/worker.period),action:stages[id][stage]!};
}
