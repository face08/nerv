import createVNode from './create-vnode'
import createVText from './create-vtext'
import { createVoid } from './create-void'
import {
  Props,
  VirtualChildren,
  VirtualNode,
  isValidElement,
  EMPTY_CHILDREN,
  VNode
} from 'nerv-shared'
import { isString, isArray, isNumber } from 'nerv-utils'

/**
 * 创建node节点
 */

// 创建node节点：createVNode、createVText、createVoid的综合
function h (type: string, props: Props, children?: VirtualChildren) {
  let childNodes
  if (props.children) {
    if (!children) {
      children = props.children
    }
  }
  if (isArray(children)) {
    // 如果children是数组，添加子组件
    childNodes = []
    addChildren(childNodes, children as any, type)
  } else if (isString(children) || isNumber(children)) {
    children = createVText(String(children))
  } else if (!isValidElement(children)) {
    children = EMPTY_CHILDREN
  }
  // ssshould be a DOM Element
  props.children = childNodes !== undefined ? childNodes : children
  return createVNode(
    type,
    props,
    props.children as any[],
    props.key,
    props.namespace,
    props.owner,
    props.ref
  ) as VNode
}

// 递归添加children到childNodes数组
function addChildren (
  childNodes: VirtualNode[],
  children: VirtualNode | VirtualNode[],
  type: string
) {
  if (isString(children) || isNumber(children)) {
    childNodes.push(createVText(String(children)))
  } else if (isValidElement(children)) {
    childNodes.push(children)
  } else if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      addChildren(childNodes, children[i], type)
    }
  } else {
    childNodes.push(createVoid())
  }
}

export default h
