import { Moment } from 'moment-timezone'
import IterResult, { IterArgs } from './iterresult'

type Iterator = (d: Moment, len: number) => boolean

/**
 * IterResult subclass that calls a callback function on each add,
 * and stops iterating when the callback returns false.
 */
export default class CallbackIterResult extends IterResult<'all' | 'between'> {
  private iterator: Iterator

  constructor(
    method: 'all' | 'between',
    args: Partial<IterArgs>,
    iterator: Iterator
  ) {
    super(method, args)

    this.iterator = iterator
  }

  add(date: Moment) {
    if (this.iterator(date, this._result.length)) {
      this._result.push(date)
      return true
    }
    return false
  }
}
