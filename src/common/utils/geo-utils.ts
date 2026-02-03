import axios from 'axios';
import { CreateAddressDto } from 'src/modules/auth/dto/adress.dto';

export async function getCoordinates(
  address: CreateAddressDto,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const queryParts = [
      address.logradouro,
      address.numero,
      address.bairro,
      address.municipio,
      address.estado,
      address.pais,
    ].filter((part) => part);

    const query = queryParts.join(', ');
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'GeminiCLI-Project/1.0',
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
    }
  } catch (error) {
    console.error('Error fetching coordinates from Nominatim:', error);
  }
  return null;
}
