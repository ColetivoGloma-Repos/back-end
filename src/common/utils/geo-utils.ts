import axios from 'axios';
import { CreateAddressDto } from 'src/modules/auth/dto/adress.dto';

export async function getCoordinates(
  address: CreateAddressDto,
): Promise<{ latitude: number; longitude: number } | null> {
  const context = 'GeocodingService';
  const cleanCep = address.cep.replace(/\D/g, '');
  const searchStrategies = [
    {
      street: `${address.logradouro}, ${address.numero}`,
      city: address.municipio,
      postalcode: cleanCep,
      country: address.pais,
    },
    { postalcode: cleanCep, country: address.pais },
    {
      street: address.logradouro,
      city: address.municipio,
      state: address.estado,
    },
  ];

  for (const params of searchStrategies) {
    try {
      const queryParams = new URLSearchParams({
        ...params,
        format: 'json',
        limit: '1',
        addressdetails: '1',
      }).toString();

      const url = `https://nominatim.openstreetmap.org/search?${queryParams}`;

      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'SuaApp/1.0 (seuemail@dominio.com)' },
      });

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }

      await new Promise((res) => setTimeout(res, 1000));
    } catch (error) {
      console.error(`[${context}] Erro na estratégia:`, error.message);
    }
  }

  return null;
}
