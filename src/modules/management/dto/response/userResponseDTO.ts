import { User } from "src/modules/auth/entities/auth.enity";

export class UserResponseDTO {

  private id: string;
  private name: string;
  private contact: string;  
  

  constructor(user: User){
    this.id = user.id
    this.name = user.name,
    this.contact = user.phone
  }
}