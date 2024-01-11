import { QueryMethodTypes, IterResultType } from './types'
import { Moment } from 'moment-timezone'

// =============================================================================
// Results
// =============================================================================

export interface IterArgs {
  inc: boolean
  before: Moment
  after: Moment
  dt: Moment
  _value: Moment | Moment[] | null
}

/**
 * This class helps us to emulate python's generators, sorta.
 */
export default class IterResult<M extends QueryMethodTypes> {
  public readonly method: M
  public readonly args: Partial<IterArgs>
  public readonly minDate: Moment | null = null
  public readonly maxDate: Moment | null = null
  public _result: Moment[] = []
  public total = 0

  constructor(method: M, args: Partial<IterArgs>) {
    this.method = method
    this.args = args

    if (method === 'between') {
      this.maxDate = args.inc
        ? args.before!
        : args.before!.clone().subtract(1, 'millisecond')
      this.minDate = args.inc
        ? args.after!
        : args.after!.clone().subtract(1, 'millisecond')
    } else if (method === 'before') {
      this.maxDate = args.inc ? args.dt! : args.dt!.subtract(1, 'millisecond')
    } else if (method === 'after') {
      this.minDate = args.inc ? args.dt! : args.dt!.add(1, 'millisecond')
    }
  }

  /**
   * Possibly adds a date into the result.
   *
   * @param date - the date isn't necessarly added to the result
   * list (if it is too late/too early)
   * @return true if it makes sense to continue the iteration
   * false if we're done.
   */
  accept(date: Moment) {
    ++this.total
    const tooEarly = this.minDate && date.isBefore(this.minDate)
    const tooLate = this.maxDate && date.isAfter(this.maxDate)

    if (this.method === 'between') {
      if (tooEarly) return true
      if (tooLate) return false
    } else if (this.method === 'before') {
      if (tooLate) return false
    } else if (this.method === 'after') {
      if (tooEarly) return true
      this.add(date)
      return false
    }

    return this.add(date)
  }

  /**
   *
   * @param date that is part of the result.
   * @return whether we are interested in more values.
   */
  add(date: Moment) {
    this._result.push(date)
    return true
  }

  /**
   * 'before' and 'after' return only one date, whereas 'all'
   * and 'between' an array.
   */
  getValue(): IterResultType<M> {
    const res = this._result
    switch (this.method) {
      case 'all':
      case 'between':
        return res as IterResultType<M>
      case 'before':
      case 'after':
      default:
        return (res.length ? res[res.length - 1] : null) as IterResultType<M>
    }
  }

  clone() {
    return new IterResult(this.method, this.args)
  }
}
