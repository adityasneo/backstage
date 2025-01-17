## API Report File for "@backstage/plugin-scaffolder-common"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { Entity } from '@backstage/catalog-model';
import type { EntityMeta } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';
import type { JsonValue } from '@backstage/types';
import { KindValidator } from '@backstage/catalog-model';
import type { UserEntity } from '@backstage/catalog-model';

// @public
export const isTemplateEntityV1beta3: (
  entity: Entity,
) => entity is TemplateEntityV1beta3;

// @public
export type TaskSpec = TaskSpecV1beta3;

// @public
export interface TaskSpecV1beta3 {
  apiVersion: 'scaffolder.backstage.io/v1beta3';
  output: {
    [name: string]: JsonValue;
  };
  parameters: JsonObject;
  steps: TaskStep[];
  templateInfo?: TemplateInfo;
  user?: {
    entity?: UserEntity;
    ref?: string;
  };
}

// @public
export interface TaskStep {
  action: string;
  id: string;
  if?: string | boolean;
  input?: JsonObject;
  name: string;
}

// @public
export interface TemplateEntityV1beta3 extends Entity {
  apiVersion: 'scaffolder.backstage.io/v1beta3';
  kind: 'Template';
  spec: {
    type: string;
    parameters?: JsonObject | JsonObject[];
    steps: Array<{
      id?: string;
      name?: string;
      action: string;
      input?: JsonObject;
      if?: string | boolean;
    }>;
    output?: {
      [name: string]: string;
    };
    owner?: string;
  };
}

// @public
export const templateEntityV1beta3Validator: KindValidator;

// @public
export type TemplateInfo = {
  entityRef: string;
  baseUrl?: string;
  entity?: {
    metadata: EntityMeta;
  };
};
```
