import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from 'src/modules/auth/entities/auth.enity';
import { Address } from 'src/modules/auth/entities/adress.enity';
import { Shelter } from 'src/modules/shelter/entities/shelter.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { FileEntity } from 'src/modules/company/entities/file.entity';
import { NeedItem } from 'src/modules/need/entities/needItems.entity';
import { NeedVolunteers } from 'src/modules/need/entities/needVolunteers.entity';
import { EnvConfig } from 'src/config';
import { DistribuitionPoints } from 'src/modules/distriuition-points/entities/distribuition-point.entity';
import { Products } from 'src/modules/products/entities/product.entity';
import { Management } from 'src/modules/management/entities/management.entity';
import { FileUploadEntity } from 'src/modules/upload/entities/file.entity';

export const dataSourceConfig = (): DataSourceOptions => { 
  return {
    type: 'postgres',
    ...(EnvConfig.ENV === 'production'
      ? {
          host: EnvConfig.database.HOST_DB,
          port: EnvConfig.database.PORT_DB,
          username: EnvConfig.database.USER_DB,
          password: EnvConfig.database.PASSWORD_DB,
          database: EnvConfig.database.NAME_DB,
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {
          host: EnvConfig.database.HOST_DB,
          port: EnvConfig.database.PORT_DB,
          username: EnvConfig.database.USER_DB,
          password: EnvConfig.database.PASSWORD_DB,
          database: EnvConfig.database.NAME_DB,
          synchronize: true,
          ssl: false,
         
        }),
    entities: [
      User,
      Address,
      Shelter,
      DistribuitionPoints,
      Products,
      NeedItem,
      NeedVolunteers,
      Company,
      FileEntity,
      FileUploadEntity,
      Management,
    ],
  };
};

const datasource = new DataSource(dataSourceConfig());

export default datasource;