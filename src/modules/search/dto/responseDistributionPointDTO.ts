import { UserResponseDTO } from './userResponseDTO';
import { ResponseAddressDTO } from './responseAddressDTO';
import { DistributionPoint } from 'src/modules/distribution-points/entities';

export class ResponseDistributionPointDTO {
  id: string;
  title: string;
  phone: string;
  description: string;
  url: string | null;
  owner: UserResponseDTO;
  address: ResponseAddressDTO;

  constructor(distributionPoint: DistributionPoint) {
    const latestFile =
      distributionPoint.files && distributionPoint.files.length > 0
        ? [...distributionPoint.files].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0]
        : null;

    ((this.id = distributionPoint.id),
      (this.title = distributionPoint.title),
      (this.phone = distributionPoint.phone),
      (this.description = distributionPoint.description),
      (this.url = latestFile?.url ?? null),
      (this.owner = new UserResponseDTO(distributionPoint.owner)),
      (this.address = new ResponseAddressDTO(distributionPoint.address)));
  }
}
