import { noop, CompositeComponent, StatelessComponent, VirtualNode } from 'nerv-shared'

export type optionsHook = (vnode: CompositeComponent | StatelessComponent) => void

// ???什么作用
const options: {
  afterMount: optionsHook
  afterUpdate: optionsHook
  beforeUnmount: optionsHook
  roots: VirtualNode[],
  debug: boolean
} = {
    afterMount: noop,
    afterUpdate: noop,
    beforeUnmount: noop,
    roots: [],
    debug: false
  }

export default options
