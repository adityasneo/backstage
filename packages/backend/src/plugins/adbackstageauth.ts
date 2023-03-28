// File: packages/backend/src/plugins/auth.ts
import {
  createRouter,
  providers,
  defaultAuthProviderFactories,
} from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    ...env,
    providerFactories: {
      ...defaultAuthProviderFactories,
      
      github: providers.github.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const id = fullProfile.username;
            if (!id) {
              throw new Error(
                `GitHub user profile does not contain a username`,
              );
            }
            const entityRef = {
              kind: 'User',
              namespace: DEFAULT_NAMESPACE,
              name: id.toLocaleLowerCase('en-US'),
            };
            try {
              await ctx.findCatalogUser({ entityRef });
            } catch (error) {
              if (error instanceof NotFoundError) {
                // findCatalogUser will throw a NotFoundError if the User is not found in the Catalog
                const userEntityRef = stringifyEntityRef(entityRef);
                return ctx.issueToken({
                  claims: {
                    sub: userEntityRef,
                    ent: [userEntityRef],
                  },
                });
              }
            }
            // User exists sign them in with their Catalog User
            return ctx.signInWithCatalogUser({ entityRef });
          },
        },
      }),
