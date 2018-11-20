import { VirtualNode, VType, Portal } from 'nerv-shared'

// 容器
export function createPortal (children: VirtualNode, container: Element): Portal {
  return {
    type: container,
    vtype: VType.Portal,
    children,
    dom: null
  }
}
