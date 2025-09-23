export interface Attribute {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
}

export interface Entity {
  id: string;
  name: string;
  order: number;
  attributes: Attribute[];
  states: string[];
  actions: string[];
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface Model {
  entities: Entity[];
  relationships: Relationship[];
}