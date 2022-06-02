/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  LocationSpec,
} from '@backstage/plugin-catalog-backend';
import { Credentials, EKS } from 'aws-sdk';
import { AWSCredentialFactory } from '../types';

const ACCOUNTID_ANNOTATION: string = 'amazonaws.com/account-id';
const ARN_ANNOTATION: string = 'amazonaws.com/arn';
const KUBERNETES_API_SERVER_ANNOTATION = 'kubernetes.io/api-server';
const KUBERNETES_API_SERVER_CA_ANNOTATION =
  'kubernetes.io/api-server-certificate-authority';
const KUBERNETES_AUTH_METHOD_ANNOTATION = 'kubernetes.io/auth-provider';

export class AwsEKSClusterProcessor implements CatalogProcessor {
  private credentialsFactory?: AWSCredentialFactory;

  constructor(credentialsFactory?: AWSCredentialFactory) {
    this.credentialsFactory = credentialsFactory;
  }

  getProcessorName(): string {
    return 'aws-eks';
  }

  normalizeName(name: string): string {
    return name
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-zA-Z0-9\-]/g, '-');
  }

  async readLocation(
    location: LocationSpec,
    _optional: boolean,
    emit: CatalogProcessorEmit,
  ): Promise<boolean> {
    if (location.type !== 'aws-eks') {
      return false;
    }

    // location target is of format "account-id/region"
    const [accountId, region] = location.target.split('/');

    let credentials: Credentials | undefined;

    if (this.credentialsFactory) {
      credentials = await this.credentialsFactory(accountId);
    }

    const eksClient = new EKS({ credentials, region });
    const clusters = await eksClient.listClusters({}).promise();
    if (clusters.clusters === undefined) {
      return true;
    }

    const results = clusters.clusters
      .map(cluster => eksClient.describeCluster({ name: cluster }).promise())
      .map(async describedClusterPromise => {
        const describedCluster = await describedClusterPromise;
        if (describedCluster.cluster) {
          const entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Resource',
            metadata: {
              annotations: {
                [ACCOUNTID_ANNOTATION]: accountId,
                [ARN_ANNOTATION]: describedCluster.cluster.arn || '',
                [KUBERNETES_API_SERVER_ANNOTATION]:
                  describedCluster.cluster.endpoint || '',
                [KUBERNETES_API_SERVER_CA_ANNOTATION]:
                  describedCluster.cluster.certificateAuthority?.data || '',
                [KUBERNETES_AUTH_METHOD_ANNOTATION]: 'aws',
              },
              name: this.normalizeName(describedCluster.cluster.name as string),
              namespace: 'default',
            },
            spec: {
              type: 'kubernetes-cluster',
              owner: 'unknown',
            },
          };
          emit({
            type: 'entity',
            entity,
            location,
          });
        }
      });
    await Promise.all(results);
    return true;
  }
}
