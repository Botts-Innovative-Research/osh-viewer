export abstract class AbstractDataComponent {
  id?: string
  label: string = ''
  name: string = ''
  description?: string
  type: string = ''
  updatable: boolean = false
  optional: boolean = false
  definition: string = ''

  /**
   * Creates an instance of AbstractDataComponent from a plain object.
   * @param obj
   */
  static fromObject(obj: any): AbstractDataComponent {
    // AbstractDataComponent is abstract, so we can't instantiate it directly
    // Instead, create a plain object and assign properties
    const component: any = Object.create(this.prototype)
    component.id = obj.id
    component.label = obj.label
    component.name = obj.name
    component.description = obj.description
    component.type = obj.type
    component.updatable = obj.updatable ?? false
    component.optional = obj.optional ?? false
    component.definition = obj.definition
    return component as AbstractDataComponent
  }

  propertyNames(): string[] {
    return [this.name]
  }
}

export abstract class AbstractScalarComponent extends AbstractDataComponent {
  referenceFrame?: string
  axisID?: string
  nilValues?: any
  constraint?: any
  value?: any

  static fromObject(obj: any): AbstractScalarComponent {
    const component: any = Object.create(this.prototype)
    // Assign base properties
    Object.assign(component, AbstractDataComponent.fromObject(obj))
    component.referenceFrame = obj.referenceFrame
    component.axisID = obj.axisID
    component.nilValues = obj.nilValues
    component.constraint = obj.constraint
    component.value = obj.value
    return component as AbstractScalarComponent
  }

  getName(): string {
    return this.name
  }

  propertyNames(): string[] {
    return [this.name]
  }
}

export class Boolean extends AbstractScalarComponent {
  type = 'Boolean'
  value?: boolean

  static fromObject(obj: any): Boolean {
    const component: any = Object.create(this.prototype)
    Object.assign(component, AbstractScalarComponent.fromObject(obj))
    component.type = 'Boolean'
    component.value = obj.value
    return component as Boolean
  }
}

export class Count extends AbstractScalarComponent {
  type = 'Count'
  value?: number

  static fromObject(obj: any): Count {
    let component: Count = super.fromObject(obj)
    component.type = 'Count'
    component.value = obj.value
    return component
  }
}

export class Quantity extends AbstractScalarComponent {
  type = 'Quantity'
  uom: any

  static fromObject(obj: any): Quantity {
    let component: Quantity = super.fromObject(obj) as Quantity
    component.type = 'Quantity'
    component.uom = obj.uom
    component.value = obj.value
    return component
  }
}

export class Time extends AbstractScalarComponent {
  type = 'Time'
  referenceTime?: string
  localFrame?: string
  uom: string = ''

  static fromObject(obj: any): Time {
    let component: Time = super.fromObject(obj) as Time
    component.type = 'Time'
    component.referenceTime = obj.referenceTime
    component.localFrame = obj.localFrame
    component.uom = obj.uom
    component.value = obj.value
    return component
  }
}

export class Category extends AbstractScalarComponent {
  type = 'Category'
  codeSpace?: string

  static fromObject(obj: any): Category {
    let component: Category = super.fromObject(obj)
    component.type = 'Category'
    component.codeSpace = obj.codeSpace
    component.value = obj.value
    return component
  }
}

export class Text extends AbstractScalarComponent {
  type = 'Text'

  static fromObject(obj: any): Text {
    let component: Text = super.fromObject(obj)
    component.type = 'Text'
    component.value = obj.value
    return component
  }
}

// ********************************
// Complex Data Types
// ********************************

export abstract class AbstractComplexComponent extends AbstractDataComponent {
  static fromObject(obj: any): AbstractComplexComponent {
    let component: AbstractComplexComponent = super.fromObject(obj)
    return component
  }

  propertyNames(): string[] | any[] {
    // This method should be overridden in subclasses to return specific property names
    return []
  }
}

export class DataRecord extends AbstractComplexComponent {
  type = 'DataRecord'
  fields: AbstractDataComponent[] = []

  static fromObject(obj: any): DataRecord {
    let component: DataRecord = super.fromObject(obj) as DataRecord
    component.type = 'DataRecord'
    component.fields = []

    for (let field of obj.fields) {
      let fieldComponent: AbstractDataComponent
      switch (field.type) {
        case 'Boolean':
          fieldComponent = Boolean.fromObject(field)
          break
        case 'Count':
          fieldComponent = Count.fromObject(field)
          break
        case 'Quantity':
          fieldComponent = Quantity.fromObject(field)
          break
        case 'Time':
          fieldComponent = Time.fromObject(field)
          break
        case 'Category':
          fieldComponent = Category.fromObject(field)
          break
        case 'Text':
          fieldComponent = Text.fromObject(field)
          break
        case 'DataRecord':
          fieldComponent = DataRecord.fromObject(field)
          break
        case 'Vector':
          fieldComponent = Vector.fromObject(field)
          break
        default:
          throw new Error(`Unknown data type: ${field.type}`)
      }
      component.fields.push(fieldComponent)
    }
    return component
  }

  propertyNames(): string[] | any[] {

    const names: any[] = []
    for (const field of this.fields) {
      if (field instanceof AbstractComplexComponent) {
        names.push(...field.propertyNames())
      } else if (field instanceof AbstractScalarComponent) {
        names.push(field.propertyNames())
      }
    }

    return names
  }
}

export class Vector extends AbstractComplexComponent {
  type = 'Vector'
  referenceFrame: string = ''
  localFrame?: string
  coordinates: AbstractScalarComponent[] = []

  static fromObject(obj: any): Vector {
    let component: Vector = super.fromObject(obj) as Vector
    component.type = 'Vector'
    component.referenceFrame = obj.referenceFrame
    component.localFrame = obj.localFrame
    component.coordinates = []

    for (let coord of obj.coordinates) {
      let coordComponent: AbstractScalarComponent
      switch (coord.type) {
        case 'Boolean':
          coordComponent = Boolean.fromObject(coord)
          break
        case 'Count':
          coordComponent = Count.fromObject(coord)
          break
        case 'Quantity':
          coordComponent = Quantity.fromObject(coord)
          break
        case 'Time':
          coordComponent = Time.fromObject(coord)
          break
        case 'Category':
          coordComponent = Category.fromObject(coord)
          break
        case 'Text':
          coordComponent = Text.fromObject(coord)
          break
        default:
          throw new Error(`Unknown coordinate type: ${coord.type}`)
      }
      component.coordinates.push(coordComponent)
    }
    return component
  }

  propertyNames(): string[] | any[] {
    return this.coordinates.map(coord => [this.name, coord.getName()])
  }
}

export class DataArray extends AbstractComplexComponent {
  type = 'DataArray'
  elementCount?: number
  elementType: AbstractDataComponent = undefined as any
  encoding?: string
  values?: any
}

export class Matrix extends AbstractComplexComponent {
  type = 'Matrix'
  elementCount?: number
  elementType: AbstractDataComponent = undefined as any
  encoding?: string
  values?: any
  referenceFrame?: string
  localFrame?: string
}

export class DataChoice extends AbstractComplexComponent {
  type = 'DataChoice'
  choiceValue: any
  items: any[] = []
}

export class Geometry extends AbstractComplexComponent {
  type = 'Geometry'
  constraint?: any
  nilValues?: any
  srs: string = ''
  values: any
}

// ********************************
// Scalar Ranges
// ********************************

export class AbstractRangeComponent extends AbstractDataComponent {
  referenceFrame?: string
  axisID?: string
  nilValues?: any
  constraint?: any
}

export class CountRange extends AbstractRangeComponent {
  type = 'CountRange'
  value?: number[]
}

export class QuantityRange extends AbstractRangeComponent {
  type = 'QuantityRange'
  value?: number[]
  uom: any
}

export class TimeRange extends AbstractRangeComponent {
  type = 'TimeRange'
  value?: string[]
  referenceTime?: string
  localFrame?: string
  uom: string = ''
}

export class CategoryRange extends AbstractRangeComponent {
  type = 'CategoryRange'
  value?: string[]
}