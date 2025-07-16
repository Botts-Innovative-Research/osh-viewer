import { Boolean, Count, Quantity, Time, Category, Text, DataRecord, AbstractDataComponent } from '../SweDataTypes'

export class SWEBuilder {
  // sweObject: AbstractDataComponent

  /**
   * Creates an AbstractDataComponent from a given DataStream schema
   * @param obj
   */
  static createFromObject(obj: any): AbstractDataComponent {
    if (!obj.recordSchema) {
      throw new Error('Object must have a recordSchema property, check the schema type');
    }

    const schema = obj.recordSchema;
    console.log('SWEBuilder.createFromObject', schema)
    switch (schema.type) {
      case 'Boolean':
        return SWEBuilder.createBoolean(schema)
      case 'Count':
        return SWEBuilder.createCount(schema)
      case 'Quantity':
        return SWEBuilder.createQuantity(schema)
      case 'Time':
        return SWEBuilder.createTime(schema)
      case 'Category':
        return SWEBuilder.createCategory(schema)
      case 'Text':
        return SWEBuilder.createText(schema)
      case 'DataRecord':
        return SWEBuilder.createDataRecord(schema)
      default:
        throw new Error(`Unknown SWE type: ${schema.type}`)
    }
  }

  static createBoolean(obj: any): Boolean {
    return Object.assign(new Boolean(), obj)
  }

  static createCount(obj: any): Count {
    return Object.assign(new Count(), obj)
  }

  static createQuantity(obj: any): Quantity {
    return Object.assign(new Quantity(), obj)
  }

  static createTime(obj: any): Time {
    return Object.assign(new Time(), obj)
  }

  static createCategory(obj: any): Category {
    return Object.assign(new Category(), obj)
  }

  static createText(obj: any): Text {
    return Object.assign(new Text(), obj)
  }

  static createDataRecord(obj: any): DataRecord {
    return DataRecord.fromObject(obj)
  }
}