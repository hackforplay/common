export interface Definition {
  __version: string;
  __lang: 'ja';
  this: AnyValue;
  classes: {
    [name: string]: ObjectValue;
  };
  globals: {
    [property: string]: AnyValue;
  };
}

export type AnyValue = PrimitiveValue | ObjectValue | InstanceValue;

export interface PrimitiveValue {
  type: 'primitive';
}

export interface ObjectValue {
  type: 'object';
  properties: {
    [property: string]: AnyValue;
  };
}

export interface InstanceValue {
  type: 'instance';
  class: string;
}
