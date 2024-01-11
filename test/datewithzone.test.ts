import { DateWithZone } from '../src/datewithzone'
import { datetime, formatDate } from './lib/utils'

it('returns the time of the date', () => {
  const d = datetime(2010, 10, 5, 11, 0, 0)
  const dt = new DateWithZone(d)
  expect(dt.getTime()).toBe(d.getTime())
})

it('rejects invalid dates', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(() => new DateWithZone(new Date(undefined as any))).toThrow(
    'Invalid date passed to DateWithZone'
  )
})

describe('rezonedDate', () => {
  it('returns the original date when no zone is given', () => {
    const d = datetime(2010, 10, 5, 11, 0, 0)
    const dt = new DateWithZone(d, true)
    expect(dt.rezonedDate().getTime()).toStrictEqual(d.getTime())
  })

  it('returns the date in the correct zone when given', () => {
    const dt = new DateWithZone('2010-10-05T11:00:00', 'America/New_York')
    expect(formatDate(dt.rezonedDate(), 'America/New_York')).toStrictEqual(
      '2010-10-05 11:00:00 GMT−4'
    )
  })
})

describe('fromStringAndTimezone', () => {
  it('Creates correct instance', () => {
    const dt = DateWithZone.fromStringAndTimezone(
      '2010-10-05T11:00:00',
      'America/New_York'
    )
    expect(formatDate(dt.rezonedDate(), 'America/New_York')).toStrictEqual(
      '2010-10-05 11:00:00 GMT−4'
    )
  })
  it('Creates correct instance 2', () => {
    const dt = DateWithZone.fromStringAndTimezone(
      '2023-11-26T09:00:00',
      'America/New_York'
    )
    expect(formatDate(dt.rezonedDate(), 'America/New_York')).toStrictEqual(
      '2023-11-26 09:00:00 GMT−5'
    )
  })
})
