import { extend, isFunction, clone } from './util'
import nextTick from './util/next-tick'
import CurrentOwner from './current-owner'
import createElement from '#/create-element'
import diff from '#/diff'
import patch from '#/patch'

const readyComponents = []

export function mountVNode (vnode, parentContext) {
  vnode.parentContext = parentContext
  return createElement(vnode)
}

export function mountComponent (vnode) {
  const parentContext = vnode.parentContext
  const componentPrototype = vnode.ComponentType.prototype
  if (componentPrototype && isFunction(componentPrototype.render)) {
    vnode.component = new vnode.ComponentType(vnode.props, vnode.context)
  }
  const component = vnode.component
  if (isFunction(component.componentWillMount)) {
    component.componentWillMount()
  }
  const rendered = renderComponent(component)
  component._rendered = rendered
  if (isFunction(component.componentDidMount)) {
    readyComponents.push(() => component.componentDidMount())
  }
  if (isFunction(vnode.__ref)) {
    readyComponents.push(() => vnode.__ref(component))
  }
  const dom = mountVNode(rendered, getChildContext(component, parentContext))
  component.dom = dom
  return dom
}

export function mountStatelessComponent (vnode) {
  vnode._renderd = vnode.tagName(vnode.props, vnode.parentContext)
  return mountVNode(vnode._renderd, vnode.parentContext)
}

export function getChildContext (component, context) {
  if (component.getChildContext) {
    return extend(extend({}, context), component.getChildContext())
  }
  return context
}

export function renderComponent (component) {
  CurrentOwner.current = component
  const rendered = component.render()
  CurrentOwner.current = null
  return rendered
}

export function flushMount () {
  if (!readyComponents.length) {
    return
  }
  const queue = readyComponents.slice(0)
  readyComponents.length = 0
  queue.forEach(item => {
    item && nextTick(item)
  })
}

export function reRenderComponent (previous, current) {
  const component = current.component = previous.component
  const nextProps = current.props
  const nextContext = current.context
  if (isFunction(component.componentWillReceiveProps)) {
    component.componentWillReceiveProps(nextProps)
  }
  component.prevProps = component.props
  component.prevState = component.state
  component.prevContext = component.context
  component.props = nextProps
  component.context = nextContext
  updateComponent(component)
  return component.dom
}

export function updateComponent (component, isForce) {
  const lastDom = component.dom
  let props = component.props
  let state = component.state
  let context = component.context
  let prevProps = component.prevProps || props
  let prevState = component.prevState || state
  let prevContext = component.prevContext || context
  component.props = prevProps
  component.state = prevState
  component.context = prevContext
  let skip = false
  if (!isForce && isFunction(component.shouldComponentUpdate)
    && component.shouldComponentUpdate(props, state, context) === false) {
    skip = true
  } else if (isFunction(component.componentWillUpdate)) {
    component.componentWillUpdate(props, state, context)
  }
  component.props = props
  component.state = state
  component.context = context
  if (!skip) {
    const lastRendered = component._rendered
    const rendered = renderComponent(component)
    const childContext = getChildContext(component, context)
    component._rendered = rendered
    component.dom = updateVNode(rendered, lastRendered, lastDom, childContext)
    if (component.componentDidUpdate) {
      component.componentDidUpdate(props, state, context)
    }
  }
  component.prevProps = clone(component.props)
  component.prevState = clone(component.state)
  component.prevContext = clone(component.context)
  flushMount()
  if (component._renderCallbacks) {
    while (component._renderCallbacks.length) {
      component._renderCallbacks.pop().call(component)
    }
  }
}

function updateVNode (vnode, lastVNode, lastDom, childContext) {
  vnode.context = childContext
  let domNode
  if (!lastDom) {
    domNode = createElement(vnode)
  } else {
    let patches = diff(lastVNode, vnode)
    domNode = patch(lastDom, patches)
  }
  return domNode
}

export function unmoutComponent (component) {
  if (isFunction(component.componentWillUnmount)) {
    component.componentWillUnmount()
  }
  component.dom = component.lastRendered = component.rendered = null
  if (isFunction(component.__ref)) {
    component.__ref(null)
  }
}