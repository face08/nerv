import { nextTick } from 'nerv-utils'
import { updateComponent } from './lifecycle'

let items: any[] = [] // 要更新的队列：组件

// 排队更新
export function enqueueRender (component) {
  // tslint:disable-next-line:no-conditional-assignment
  if (!component._dirty && (component._dirty = true) && items.push(component) === 1) {
    nextTick(rerender)
  }
}

// tick更新函数
export function rerender () {
  let p
  const list = items
  items = []
  // tslint:disable-next-line:no-conditional-assignment
  while ((p = list.pop())) {
    if (p._dirty) {
      // 更新组件
      updateComponent(p)
    }
  }
}
