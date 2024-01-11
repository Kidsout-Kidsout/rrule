import moment from 'moment-timezone'
import { datetime, toDTSTART, untilStringToDate } from '../src/dateutil'

describe('untilStringToDate', () => {
  it('parses a date string', () => {
    const date = untilStringToDate('19970902T090000')
    expect(date.getTime()).toBe(datetime(1997, 9, 2, 9, 0, 0).getTime())
  })
})

describe('toDTSTART', () => {
  it('returns the date when no tzid is present', () => {
    const dt = toDTSTART(moment.utc('2010-10-05T11:00:00'))
    expect(dt).toStrictEqual(':20101005T110000Z')
  })

  it('returns the date with tzid when present', () => {
    const dt = toDTSTART(moment.tz('2010-10-05T11:00:00', 'Asia/Tokyo'))
    expect(dt).toStrictEqual(';TZID=Asia/Tokyo:20101005T110000')
  })
})
