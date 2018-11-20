import { isFunction, isString } from 'nerv-utils'
import { isComposite } from 'nerv-shared'

export default {

  // 更新ref
  update (lastVnode, nextVnode, domNode?) {
    const prevRef = lastVnode != null && lastVnode.ref
    const nextRef = nextVnode != null && nextVnode.ref

    if (prevRef !== nextRef) {
      this.detach(lastVnode, prevRef, lastVnode.dom)
      this.attach(nextVnode, nextRef, domNode)
    }
  },

  // 添加ref
  attach (vnode, ref, domNode: Element) {
    const node = isComposite(vnode) ? vnode.component : domNode
    if (isFunction(ref)) {
      // 如果是函数
      ref(node)
    } else if (isString(ref)) {
      // 如果是字符串
      const inst = vnode._owner
      if (inst && isFunction(inst.render)) {
        inst.refs[ref] = node
      }
    }
  },

  // 移除ref
  detach (vnode, ref, domNode: Element) {
    const node = isComposite(vnode) ? vnode.component : domNode
    if (isFunction(ref)) {
      ref(null)
    } else if (isString(ref)) {
      const inst = vnode._owner
      if (inst.refs[ref] === node && isFunction(inst.render)) {
        delete inst.refs[ref]
      }
    }
  }
}
