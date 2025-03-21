import { Status } from 'src/modules/need/enums/enumsStatus';
import { ResponseAddressDTO } from './responseAddressDTO';
import { Priority } from 'src/modules/need/enums/enumPriority';
import { NeedItem } from 'src/modules/need/entities/needItems.entity';

export class ResponseNeedItemUpdateDTO {
  id: string;
  title: string;
  coordinator: string;
  description: string;
  shelter_id: string;
  shelter_name: string;
  shelter_phone: string;
  shelter_address: ResponseAddressDTO;
  status: Status;
  priority: Priority;
  limitDate: Date;
  item: { [key: string]: number };

  constructor(needItem: NeedItem) {
    this.id = needItem.id;
    this.coordinator = needItem.coordinator.name;
    this.title = needItem.title;
    this.description = needItem.description;
    this.shelter_id = needItem.shelter.id;
    this.shelter_name = needItem.shelter.name;
    this.shelter_phone = needItem.shelter.phone;
    this.item = needItem.item;
    this.status = needItem.status;
    this.limitDate = needItem.limitDate;
  }
}
