import Model, { DataTypes, registerConnection } from './model';
import DataRepository from './DataRepository';


export {
    registerConnection as registerMongoConnection,
    DataTypes as MongoDataTypes,
    Model as MongoModel,
    DataRepository as MongoDataRepository
}