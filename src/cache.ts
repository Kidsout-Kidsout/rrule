import moment, { Moment } from 'moment-timezone'
import IterResult, { IterArgs } from './iterresult'
import { clone, cloneDates } from './dateutil'
import { isArray } from './helpers'

export type CacheKeys = 'before' | 'after' | 'between'

function argsMatch(
  left: IterArgs[keyof IterArgs] | undefined,
  right: IterArgs[keyof IterArgs] | undefined
) {
  if (Array.isArray(left)) {
    if (!Array.isArray(right)) return false
    if (left.length !== right.length) return false
    return left.every(
      (date, i) => date.toDate().getTime() === right[i].toDate().getTime()
    )
  }

  if (moment.isMoment(left)) {
    return moment.isMoment(right) && left.unix() === right.unix()
  }

  return left === right
}

export class Cache {
  all: Moment[] | Partial<IterArgs> | false = false
  before: IterArgs[] = []
  after: IterArgs[] = []
  between: IterArgs[] = []

  /**
   * @param {String} what - all/before/after/between
   * @param {Array,Date} value - an array of dates, one date, or null
   * @param {Object?} args - _iter arguments
   */
  public _cacheAdd(
    what: CacheKeys | 'all',
    value: Moment[] | Moment | null,
    args?: Partial<IterArgs>
  ) {
    if (value) {
      value = moment.isMoment(value) ? clone(value) : cloneDates(value)
    }

    if (what === 'all') {
      this.all = value as Moment[]
    } else {
      args = args || {}
      args._value = value
      this[what].push(args as IterArgs)
    }
  }

  /**
   * @return false - not in the cache
   * @return null  - cached, but zero occurrences (before/after)
   * @return Date  - cached (before/after)
   * @return []    - cached, but zero occurrences (all/between)
   * @return [Date1, DateN] - cached (all/between)
   */
  public _cacheGet(
    what: CacheKeys | 'all',
    args?: Partial<IterArgs>
  ): Moment | Moment[] | false | null {
    let cached: Moment | Moment[] | false | null = false
    const argsKeys = args ? (Object.keys(args) as (keyof IterArgs)[]) : []
    const findCacheDiff = function (item: IterArgs) {
      for (let i = 0; i < argsKeys.length; i++) {
        const key = argsKeys[i]
        if (!argsMatch(args?.[key], item[key])) {
          return true
        }
      }
      return false
    }

    const cachedObject = this[what]
    if (what === 'all') {
      cached = this.all as Moment[]
    } else if (isArray(cachedObject)) {
      // Let's see whether we've already called the
      // 'what' method with the same 'args'
      for (let i = 0; i < cachedObject.length; i++) {
        const item = cachedObject[i] as IterArgs
        if (argsKeys.length && findCacheDiff(item)) continue
        cached = item._value
        break
      }
    }

    if (!cached && this.all) {
      // Not in the cache, but we already know all the occurrences,
      // so we can find the correct dates from the cached ones.
      const iterResult = new IterResult(what, args ?? {})
      for (let i = 0; i < (this.all as Moment[]).length; i++) {
        if (!iterResult.accept((this.all as Moment[])[i])) break
      }
      cached = iterResult.getValue() as Moment
      this._cacheAdd(what, cached, args)
    }

    return isArray(cached)
      ? cloneDates(cached)
      : moment.isMoment(cached)
      ? clone(cached)
      : cached
  }
}
