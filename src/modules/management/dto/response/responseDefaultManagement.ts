import { NeedItem } from "src/modules/need/entities/needItems.entity";
import { NeedVolunteers } from "src/modules/need/entities/needVolunteers.entity";
import { Management } from "../../entities/management.entity";
import { ResponseAddressDTO } from "./addressResponseDTO";
import { UserResponseDTO } from "./userResponseDTO";

export class ResponseDefaultManagement {

  private id: string;
  private collectionDate: Date;
  private coordinator: UserResponseDTO;
  private shelterName: string;
  private shelterId: string;
  private processed: boolean;
  private collectPoint: ResponseAddressDTO;
  private needItem?: NeedItem[];
  private needVolunteer?: NeedVolunteers[];

  constructor (management: Management){
    this.id = management.id,
    this.collectionDate = management.collectionDate,
    this.shelterName = management.shelter.name,
    this.shelterId = management.shelter.id,
    this.processed = management.processed,
    this.coordinator = new UserResponseDTO(management.coordinator),
    this.collectPoint = new ResponseAddressDTO(management.collectPoint),
    this.needItem = management.needItem,
    this.needVolunteer = management.needVolunteer
  }
  
}