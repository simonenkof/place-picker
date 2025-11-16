export class TimeSlot {
  dateFrom: Date = new Date();
  dateTo: Date = new Date();

  constructor(from: string, to: string) {
    this.dateFrom = new Date(from);
    this.dateTo = new Date(to);
  }
}
