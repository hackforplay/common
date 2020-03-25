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

export type AnyValue =
  | PrimitiveValue
  | FunctionValue
  | ObjectValue
  | InstanceValue;

export interface PrimitiveValue {
  type: 'primitive';
  name: string;
}

export interface FunctionValue {
  type: 'function';
  name: string;
}

export interface ObjectValue {
  type: 'object';
  name: string;
  properties: {
    [property: string]: PrimitiveValue | FunctionValue; // TODO: InstanceValue を含める
  };
}

export interface InstanceValue {
  type: 'instance';
  class: string;
  name: string;
}
