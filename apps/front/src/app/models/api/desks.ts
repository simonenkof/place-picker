export class Desk {
  id = '';
  name = '';
  reserved = false;
  createdAt = '';
  updatedAt = '';
  reservedSlots: string[] = [];

  constructor(data: Partial<Desk>) {
    Object.assign(this, data);
  }
}
