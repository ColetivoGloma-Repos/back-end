import { UserResponseDTO } from './userResponseDTO';
import { ResponseAddressDTO } from './responseAddressDTO';
import { DistributionPoint } from 'src/modules/distribution-points/entities';

export class ResponseDistributionPointDTO {
  id: string;
  title: string;
  phone: string;
  description: string;
  owner: UserResponseDTO;
  address: ResponseAddressDTO;

  constructor(distributionPoint: DistributionPoint) {
    ((this.id = distributionPoint.id),
      (this.title = distributionPoint.title),
      (this.phone = distributionPoint.phone),
      (this.description = distributionPoint.description),
      (this.owner = new UserResponseDTO(distributionPoint.owner)),
      (this.address = new ResponseAddressDTO(distributionPoint.address)));
  }
}
