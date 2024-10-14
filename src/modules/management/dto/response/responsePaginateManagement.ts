import { ResponseDefaultManagement } from './responseDefaultManagement';
import { NeedItem } from "src/modules/need/entities/needItems.entity";
import { NeedVolunteers } from "src/modules/need/entities/needVolunteers.entity";
import { Management } from "../../entities/management.entity";
import { ResponseAddressDTO } from "./addressResponseDTO";
import { UserResponseDTO } from "./userResponseDTO";

// Adicionando suporte à paginação
export class ResponsePaginateManagement {

  private data: ResponseDefaultManagement[];
  private total: number;


  constructor(managements: Management[], total: number) {
   
    this.data = managements.map(management => new ResponseDefaultManagement(management));
    this.total = total;
    
  }
}

