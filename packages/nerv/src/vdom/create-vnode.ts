import {
  Props,
  VType,
  VNode,
  VirtualChildren,
  Component,
  EMPTY_OBJ
} from 'nerv-shared'

/**
 * 创建node节点
 * @param type: div
 * @param props
 * @param children
 * @param key
 * @param namespace
 * @param owner
 * @param ref
 */
function createVNode (
  type: string,
  props: Props,
  children: VirtualChildren,
  key,
  namespace: string,
  owner: Component<any, any>,
  ref: Function | string | null | undefined
): VNode {
  return {
    type,
    key: key || null,
    vtype: VType.Node,
    props: props || EMPTY_OBJ,
    children,
    namespace: namespace || null,
    _owner: owner,
    dom: null,
    ref: ref || null
  }
}

export default createVNode
