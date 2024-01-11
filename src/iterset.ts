import IterResult from './iterresult'
import { RRule } from './rrule'
import { iter } from './iter'
import { sort } from './dateutil'
import { QueryMethodTypes, IterResultType } from './types'
import moment, { Moment } from 'moment-timezone'

export function iterSet<M extends QueryMethodTypes>(
  iterResult: IterResult<M>,
  _rrule: RRule[],
  _exrule: RRule[],
  _rdate: Moment[],
  _exdate: Moment[],
  tzid: string | undefined
) {
  const _exdateHash: { [k: number]: boolean } = {}
  const _accept = iterResult.accept

  function evalExdate(after: Moment, before: Moment) {
    _exrule.forEach(function (rrule) {
      rrule.between(after, before, true).forEach(function (date) {
        _exdateHash[date.toDate().getTime()] = true
      })
    })
  }

  _exdate.forEach(function (date) {
    _exdateHash[date.toDate().getTime()] = true
  })

  iterResult.accept = function (date) {
    const dt = date.toDate().getTime()
    if (isNaN(dt)) return _accept.call(this, date)
    if (!_exdateHash[dt]) {
      evalExdate(moment(new Date(dt - 1)), moment(new Date(dt + 1)))
      if (!_exdateHash[dt]) {
        _exdateHash[dt] = true
        return _accept.call(this, date)
      }
    }
    return true
  }

  if (iterResult.method === 'between') {
    evalExdate(iterResult.args.after!, iterResult.args.before!)
    iterResult.accept = function (date) {
      const dt = Number(date)
      if (!_exdateHash[dt]) {
        _exdateHash[dt] = true
        return _accept.call(this, date)
      }
      return true
    }
  }

  for (let i = 0; i < _rdate.length; i++) {
    if (!iterResult.accept(_rdate[i])) break
  }

  _rrule.forEach(function (rrule) {
    iter(iterResult, rrule.options)
  })

  const res = iterResult._result
  sort(res)
  switch (iterResult.method) {
    case 'all':
    case 'between':
      return res as IterResultType<M>
    case 'before':
      return ((res.length && res[res.length - 1]) || null) as IterResultType<M>
    case 'after':
    default:
      return ((res.length && res[0]) || null) as IterResultType<M>
  }
}
