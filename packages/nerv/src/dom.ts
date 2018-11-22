import { isValidElement as isValidNervElement, VType, isComponent, isInvalid } from 'nerv-shared'
import { nextTick } from 'nerv-utils'
import { getChildContext } from './lifecycle'
import { render } from './render'
import { unmount } from './vdom/unmount'
import createElement from './create-element'
import Component from './component'

// 卸载节点
export function unmountComponentAtNode (dom) {
  const component = dom._component
  if (isValidNervElement(component)) {
    unmount(component, dom)
    delete dom._component
    return true
  }
  return false
}

// 查找？？
export function findDOMNode (component) {
  if (isInvalid(component)) {
    return null
  }
  return isComponent(component)
    ? component.vnode.dom
    : isValidNervElement(component)
      ? component.dom : component
}

// 创建工厂函数
export function createFactory (type) {
  return createElement.bind(null, type)
}

// 包裹组件
class WrapperComponent<P, S> extends Component<P, S> {
  getChildContext () {
    // tslint:disable-next-line
    return this.props.context
  }

  render () {
    return this.props.children
  }
}

export function unstable_renderSubtreeIntoContainer (
  parentComponent,
  vnode,
  container,
  callback
) {
  // @TODO: should handle props.context?
  const wrapper = createElement(
    WrapperComponent,
    { context: getChildContext(parentComponent, parentComponent.context) },
    vnode
  )
  const rendered = render(wrapper as any, container)
  if (callback) {
    callback.call(rendered)
  }
  return rendered
}

export function isValidElement (element) {
  return (
    isValidNervElement(element) && (element.vtype & (VType.Composite | VType.Node)) > 0
  )
}

// 更新tick函数
export const unstable_batchedUpdates = nextTick
