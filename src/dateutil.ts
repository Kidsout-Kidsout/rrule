import { padStart } from './helpers'
import { Time } from './datetime'
import moment, { Moment } from 'moment-timezone'
import { Frequency, ParsedOptions } from './types'

type Datelike = Pick<Date, 'getTime'>

export const datetime = function (
  y: number,
  m: number,
  d: number,
  h = 0,
  i = 0,
  s = 0
) {
  return moment(new Date(Date.UTC(y, m - 1, d, h, i, s)))
}

/**
 * General date-related utilities.
 * Also handles several incompatibilities between JavaScript and Python
 *
 */
export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Number of milliseconds of one day
 */
export const ONE_DAY = 1000 * 60 * 60 * 24

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.MAXYEAR>
 */
export const MAXYEAR = 9999

/**
 * Python uses 1-Jan-1 as the base for calculating ordinals but we don't
 * want to confuse the JS engine with milliseconds > Number.MAX_NUMBER,
 * therefore we use 1-Jan-1970 instead
 */
export const ORDINAL_BASE = moment.utc('1970-01-01T00:00:00')

/**
 * Python: MO-SU: 0 - 6
 * JS: SU-SAT 0 - 6
 */
export const PY_WEEKDAYS = [6, 0, 1, 2, 3, 4, 5]

/**
 * py_date.timetuple()[7]
 */
export const getYearDay = function (date: Date) {
  const dateNoTime = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )
  return (
    Math.ceil(
      (dateNoTime.valueOf() - new Date(date.getUTCFullYear(), 0, 1).valueOf()) /
        ONE_DAY
    ) + 1
  )
}

export const isLeapYear = function (year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export const isDate = function (value: unknown): value is Date {
  return value instanceof Date
}

export const isValidDate = function (value: unknown): value is Date {
  return isDate(value) && !isNaN(value.getTime())
}

/**
 * @return {Number} the date's timezone offset in ms
 */
export const tzOffset = function (date: Date) {
  return date.getTimezoneOffset() * 60 * 1000
}

/**
 * @see: <http://www.mcfedries.com/JavaScript/DaysBetween.asp>
 */
export const daysBetween = function (date1: Moment, date2: Moment) {
  return moment.duration(date1.diff(date2)).asDays()
}

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.date.toordinal>
 */
export const toOrdinal = function (date: Moment) {
  return daysBetween(date, ORDINAL_BASE)
}

/**
 * @see - <http://docs.python.org/library/datetime.html#datetime.date.fromordinal>
 */
export const fromOrdinal = function (ordinal: number) {
  return ORDINAL_BASE.clone().add(ordinal + 1, 'days')
}

export const getMonthDays = function (date: Moment) {
  const month = date.toDate().getUTCMonth()
  return month === 1 && isLeapYear(date.toDate().getUTCFullYear())
    ? 29
    : MONTH_DAYS[month]
}

/**
 * @return {Number} python-like weekday
 */
export const getWeekday = function (date: Moment) {
  return PY_WEEKDAYS[date.toDate().getUTCDay()]
}

/**
 * @see: <http://docs.python.org/library/calendar.html#calendar.monthrange>
 */
export const monthRange = function (year: number, month: number) {
  const date = datetime(year, month + 1, 1)
  return [getWeekday(date), getMonthDays(date)]
}

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.datetime.combine>
 */
export const combine = function (date: Moment, time: Moment | Time) {
  time = time || date
  return date
    .clone()
    .hour(time instanceof Time ? time.getHours() : time.hours())
    .minute(time instanceof Time ? time.getMinutes() : time.minutes())
    .second(time instanceof Time ? time.getSeconds() : time.seconds())
    .millisecond(
      time instanceof Time ? time.getMilliseconds() : time.milliseconds()
    )
}

export const clone = function (date: Moment | Time) {
  if (moment.isMoment(date)) return date.clone()
  const dolly = moment(new Date(date.getTime()))
  return dolly
}

export const cloneDates = function (dates: Moment[] | Time[]) {
  const clones: Moment[] = []
  for (let i = 0; i < dates.length; i++) {
    clones.push(clone(dates[i]))
  }
  return clones
}

/**
 * Sorts an array of Date or Time objects
 */
export const sort = function (dates: (Moment | Datelike)[]) {
  dates.sort(function (a, b) {
    return getTime(a) - getTime(b)
  })
}

const getTime = (m: Moment | Datelike) => {
  if (moment.isMoment(m)) {
    return m.toDate().getTime()
  }
  return m.getTime()
}

export const timeToUntilString = function (time: number, utc = true) {
  const date = new Date(time)
  return [
    padStart(date.getUTCFullYear().toString(), 4, '0'),
    padStart(date.getUTCMonth() + 1, 2, '0'),
    padStart(date.getUTCDate(), 2, '0'),
    'T',
    padStart(date.getUTCHours(), 2, '0'),
    padStart(date.getUTCMinutes(), 2, '0'),
    padStart(date.getUTCSeconds(), 2, '0'),
    utc ? 'Z' : '',
  ].join('')
}

export const untilStringToMoment = function (until: string) {
  const re = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/
  const bits = re.exec(until)

  if (!bits) throw new Error(`Invalid UNTIL value: ${until}`)

  return moment(
    new Date(
      Date.UTC(
        parseInt(bits[1], 10),
        parseInt(bits[2], 10) - 1,
        parseInt(bits[3], 10),
        parseInt(bits[5], 10) || 0,
        parseInt(bits[6], 10) || 0,
        parseInt(bits[7], 10) || 0
      )
    )
  )
}

export const dateInTimeZone = function (date: Moment, timeZone = 'UTC') {
  return date.clone().tz(timeZone, false)
}

export function toDTSTART(date: Moment) {
  if (date.isUTC()) {
    return date.format(':YYYYMMDDTHHmmss') + 'Z'
  }

  return `;TZID=${date.tz()}:${date.format('YYYYMMDDTHHmmss')}`
}

export function add(date: Moment, options: ParsedOptions, filtered: boolean) {
  const { freq, interval, wkst, byhour, byminute, bysecond } = options

  switch (freq) {
    case Frequency.YEARLY:
      return date.add(interval, 'year')
    case Frequency.MONTHLY:
      return date.add(interval, 'month')
    case Frequency.WEEKLY:
      return this.addWeekly(interval, wkst)
    case Frequency.DAILY:
      return date.add(interval, 'day')
    case Frequency.HOURLY:
      return this.addHours(interval, filtered, byhour)
    case Frequency.MINUTELY:
      return this.addMinutes(interval, filtered, byhour, byminute)
    case Frequency.SECONDLY:
      return this.addSeconds(interval, filtered, byhour, byminute, bysecond)
  }
}
