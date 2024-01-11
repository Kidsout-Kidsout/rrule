import moment, { Moment } from 'moment-timezone'

export class DateWithZone {
  private date: Moment
  private tzid?: string

  constructor(date: Date, tzid?: string | null) {
    if (isNaN(date.getTime())) {
      throw new RangeError('Invalid date passed to DateWithZone')
    }
    this.date = moment.utc(date)
    if (tzid) {
      this.date.tz(tzid, true)
    }
    this.tzid = tzid ?? undefined
  }

  private get isUTC() {
    return !this.tzid || this.tzid.toUpperCase() === 'UTC'
  }

  public toString() {
    console.log('sjs', this.isUTC, this.date)
    const datestr =
      this.date.format('YYYYMMDDTHHmmss') + (this.isUTC ? 'Z' : '')
    if (!this.isUTC) {
      return `;TZID=${this.tzid}:${datestr}`
    }

    return `:${datestr}`
  }

  public getTime() {
    return this.date.toDate().getTime()
  }

  public rezonedDate() {
    return this.date.toDate()
  }

  /** Treats given date string local time */
  public static fromStringAndTimezone(date: string, tzid: string) {
    const d = new DateWithZone(new Date(), tzid)
    d.date = moment.utc(date).tz(tzid, true)
    return d
  }
}
