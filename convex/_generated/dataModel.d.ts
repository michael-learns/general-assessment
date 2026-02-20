/* eslint-disable */
/**
 * Generated data model stub - run `bunx convex dev` to regenerate
 */
import type { DataModelFromSchemaDefinition } from 'convex/server'
import schema from '../schema'

export type DataModel = DataModelFromSchemaDefinition<typeof schema>
export type Id<T extends string> = string & { __tableName: T }
export type Doc<T extends string> = DataModel[T extends keyof DataModel ? T : never]
