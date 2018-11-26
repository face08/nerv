// import { extend, isFunction, isNumber, isString } from 'nerv-utils'
import { extend, isFunction, isNumber, isString, clone } from 'nerv-utils'
import CurrentOwner from './current-owner'
import createElement from './vdom/create-element'
import createVText from './vdom/create-vtext'
import { createVoid } from './vdom/create-void'
import patch from './vdom/patch'
import {
  Component,
  isNullOrUndef,
  CompositeComponent,
  isComponent,
  isInvalid,
  VText,
  VVoid,
  VNode,
  VType,
  EMPTY_OBJ
} from 'nerv-shared'
import FullComponent from './full-component'
import Stateless from './stateless-component'
import { unmount } from './vdom/unmount'
import Ref from './vdom/ref'

const readyComponents: any[] = []

// catch执行函数
function errorCatcher (fn: Function, component: Component<any, any>) {
  try {
    return fn()
  } catch (error) {
    errorHandler(component, error)
  }
}

// 组件错误处理
function errorHandler (component: Component<any, any>, error) {
  let boundary

  while (true) {
    if (isFunction(component.componentDidCatch)) {
      boundary = component
      break
    } else if (component._parentComponent) {
      component = component._parentComponent
    } else {
      break
    }
  }

  if (boundary) {
    const _disable = boundary._disable
    boundary._disable = false
    boundary.componentDidCatch(error) // 错误处理
    boundary._disable = _disable
  } else {
    throw error
  }
}

// 确认节点
function ensureVirtualNode (rendered: any): VText | VVoid | VNode {
  if (isNumber(rendered) || isString(rendered)) {
    return createVText(rendered)
  } else if (isInvalid(rendered)) {
    return createVoid()
  }
  return rendered
}

// 安装节点
export function mountVNode (vnode, parentContext: any, parentComponent?) {
  return createElement(vnode, false, parentContext, parentComponent)
}

/**
 * 安装组件：生命周期
 * @param vnode:  包装组件
 * @param parentContext
 * @param parentComponent
 */
export function mountComponent (
  vnode: FullComponent,
  parentContext: object,
  parentComponent
) {
  const ref = vnode.ref
  vnode.component = new vnode.type(vnode.props, parentContext) // 实例化tsx
  const component = vnode.component
  component.vnode = vnode
  if (isComponent(parentComponent)) {
    component._parentComponent = parentComponent
  }

  // 生命周期：安装前
  if (isFunction(component.componentWillMount)) {
    errorCatcher(() => {
      (component as any).componentWillMount()
    }, component)
    component.state = component.getState(true)
  }

  // 渲染
  component._dirty = false
  const rendered = renderComponent(component) // VNode 纯obj对象
  rendered.parentVNode = vnode
  component._rendered = rendered

  // 生命周期：安装后
  if (isFunction(component.componentDidMount)) {
    readyComponents.push(component)
  }

  // 添加ref
  if (!isNullOrUndef(ref)) {
    Ref.attach(vnode, ref, vnode.dom as Element)
  }

  // 虚拟节点--->dom节点
  const dom = (vnode.dom = mountVNode(
    rendered,
    getChildContext(component, parentContext),
    component
  ) as Element)
  component._disable = false
  return dom
}

// 安装无state组件？
export function mountStatelessComponent (vnode: Stateless, parentContext) {
  const rendered = vnode.type(vnode.props, parentContext)
  vnode._rendered = ensureVirtualNode(rendered)
  vnode._rendered.parentVNode = vnode
  return (vnode.dom = mountVNode(vnode._rendered, parentContext) as Element)
}

export function getChildContext (component, context = EMPTY_OBJ) {
  if (component.getChildContext) {
    return extend(clone(context), component.getChildContext())
  }
  return clone(context)
}

// 渲染组件
export function renderComponent (component: Component<any, any>) {
  CurrentOwner.current = component
  let rendered // 纯obj类型VNode

  // 生命周期：render
  errorCatcher(() => {
    rendered = component.render()
  }, component)
  rendered = ensureVirtualNode(rendered)
  CurrentOwner.current = null
  return rendered
}

// 批量安装
export function flushMount () {
  if (!readyComponents.length) {
    return
  }
  // @TODO: perf
  const queue = readyComponents.slice(0)
  readyComponents.length = 0
  queue.forEach((item) => {
    if (isFunction(item)) {
      item()
    } else if (item.componentDidMount) {
      // 生命周期：componentDidMount
      errorCatcher(() => {
        item.componentDidMount()
      }, item)
    }
  })
}

// 重新渲染
export function reRenderComponent (
  prev: CompositeComponent,
  current: CompositeComponent
) {
  const component = (current.component = prev.component)
  const nextProps = current.props
  const nextContext = current.context
  component._disable = true

  // 生命周期：componentWillReceiveProps
  if (isFunction(component.componentWillReceiveProps)) {
    errorCatcher(() => {
      (component as any).componentWillReceiveProps(nextProps, nextContext)
    }, component)
  }
  component._disable = false
  component.prevProps = component.props
  component.prevState = component.state
  component.prevContext = component.context
  component.props = nextProps
  component.context = nextContext
  if (!isNullOrUndef(current.ref)) {
    Ref.update(prev, current)
  }
  return updateComponent(component)
}

// 更新无state组件
export function reRenderStatelessComponent (
  prev: Stateless,
  current: Stateless,
  parentContext: Object,
  domNode: Element
) {
  const lastRendered = prev._rendered
  const rendered = current.type(current.props, parentContext)
  rendered.parentVNode = current
  current._rendered = rendered
  return (current.dom = patch(lastRendered, rendered, lastRendered && lastRendered.dom || domNode, parentContext))
}

// tick：更新组件
export function updateComponent (component, isForce = false) {
  let vnode = component.vnode
  let dom = vnode.dom
  const props = component.props
  const state = component.getState()
  const context = component.context
  const prevProps = component.prevProps || props
  const prevState = component.prevState || component.state
  const prevContext = component.prevContext || context
  component.props = prevProps
  component.context = prevContext
  let skip = false
  if (
    // 生命周期：shouldComponentUpdate
    !isForce &&
    isFunction(component.shouldComponentUpdate) &&
    component.shouldComponentUpdate(props, state, context) === false
  ) {
    skip = true
  } else if (isFunction(component.componentWillUpdate)) {
    // 生命周期：componentWillUpdate
    errorCatcher(() => {
      component.componentWillUpdate(props, state, context)
    }, component)
  }
  component.props = props
  component.state = state
  component.context = context
  component._dirty = false
  if (!skip) {
    const lastRendered = component._rendered
    const rendered = renderComponent(component)
    rendered.parentVNode = vnode
    const childContext = getChildContext(component, context)
    const parentDom = lastRendered.dom && lastRendered.dom.parentNode
    dom = vnode.dom = patch(lastRendered, rendered, parentDom || null, childContext)
    component._rendered = rendered

    // 生命周期：componentDidUpdate
    if (isFunction(component.componentDidUpdate)) {
      errorCatcher(() => {
        component.componentDidUpdate(prevProps, prevState, context)
      }, component)
    }
    while (vnode = vnode.parentVNode) {
      if ((vnode.vtype & (VType.Composite | VType.Stateless)) > 0) {
        vnode.dom = dom
      }
    }
  }
  component.prevProps = component.props
  component.prevState = component.state
  component.prevContext = component.context
  if (component._pendingCallbacks) {
    while (component._pendingCallbacks.length) {
      component._pendingCallbacks.pop().call(component) // 处理回调函数
    }
  }
  flushMount()
  return dom
}

// 卸载
export function unmountComponent (vnode: FullComponent) {
  const component = vnode.component

  // 生命周期：componentWillUnmount
  if (isFunction(component.componentWillUnmount)) {
    errorCatcher(() => {
      (component as any).componentWillUnmount()
    }, component)
  }
  component._disable = true
  unmount(component._rendered)
  if (!isNullOrUndef(vnode.ref)) {
    Ref.detach(vnode, vnode.ref, vnode.dom as any)
  }
}

export function unmountStatelessComponent (vnode: Stateless) {
  unmount(vnode._rendered)
}
