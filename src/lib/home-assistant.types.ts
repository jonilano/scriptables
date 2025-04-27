
export interface BaseEntityState {
  state: string;
  last_changed: string;
}

export interface EntityAttributes {
  state_class?: string;
  unit_of_measurement?: string;
  icon?: string;
  friendly_name?: string;
  [key: string]: unknown;
}

export interface EntityContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}

export interface EntityState extends BaseEntityState {
  entity_id: string;
  attributes?: EntityAttributes;
  last_reported?: string;
  last_updated?: string;
  context?: EntityContext;
}

export type EntityStateHistory = EntityState[][];

export interface EntityNotFound {
  message: "Entity not found.";
}
