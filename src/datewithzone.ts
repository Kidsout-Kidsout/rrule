import moment, { Moment } from 'moment-timezone'

export class DateWithZone {
  private date: Moment
  private tzid?: string

  constructor(date: string, tzid?: string | null) {
    this.date = moment.tz(date, tzid)
    if (this.date.isValid()) {
      throw new RangeError('Invalid date passed to DateWithZone')
    }
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
    return this.date.clone().toDate()
  }

  /** Treats given date string local time */
  public static fromStringAndTimezone(date: string, tzid: string) {
    const d = new DateWithZone(new Date(), tzid)
    d.date = moment.utc(date).tz(tzid, true)
    return d
  }
}
