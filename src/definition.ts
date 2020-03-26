export type Definition = DefinitionV3;

export interface DefinitionV3 {
  __version: '3';
  __lang: 'ja';
  this?: InstanceValue;
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
