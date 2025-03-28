import { User } from 'src/modules/auth/entities/auth.enity';
import { NeedVolunteers } from '../../entities/needVolunteers.entity';
import { Priority } from '../../enums/enumPriority';
import { Status } from '../../enums/enumsStatus';
import { ResponseAddressDTO } from './reponseAddressDTO';

export class ResponseNeedVolunteerUpdateDTO {
  coordinator: string;
  coordinator_phone: string;
  title: string;
  description: string;
  volunteers: User[];
  shelter_id: string;
  shelter_name: string;
  shelter_phone: string;
  shelter_address: ResponseAddressDTO;
  status: Status;
  priority: Priority;
  limitDate: Date;
  specificSkills: string[];
  workHours: number;
  created: Date;
  update: Date;

  constructor(needVolunteer: NeedVolunteers) {
    (this.coordinator = needVolunteer.coordinator.name),
      (this.coordinator_phone = needVolunteer.coordinator.phone),
      (this.title = needVolunteer.title),
      (this.description = needVolunteer.description),
      (this.shelter_id = needVolunteer.shelter.id),
      (this.shelter_name = needVolunteer.shelter.name),
      (this.shelter_phone = needVolunteer.shelter.phone);
    this.shelter_address = new ResponseAddressDTO(
      needVolunteer.shelter.address,
    );
    (this.volunteers = needVolunteer.volunteers),
      (this.status = needVolunteer.status),
      (this.limitDate = needVolunteer.limitDate),
      (this.specificSkills = needVolunteer.specificSkills),
      (this.workHours = needVolunteer.workHours),
      (this.created = needVolunteer.created);
    this.update = needVolunteer.updated;
  }
}
