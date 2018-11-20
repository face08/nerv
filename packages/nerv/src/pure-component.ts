import Component from './component'
import { shallowEqual } from 'nerv-utils'

// 纯组件
class PureComponent<P, S> extends Component<P, S> {
  isPureComponent = true

  // 浅对比
  shouldComponentUpdate (nextProps: P, nextState: S) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState)
  }
}

export default PureComponent
