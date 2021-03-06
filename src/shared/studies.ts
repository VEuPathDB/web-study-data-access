import { WdkService } from '@veupathdb/wdk-client/lib/Core';
import { RecordInstance } from '@veupathdb/wdk-client/lib/Utils/WdkModel';

export type Study = RecordInstance;

export async function fetchStudies(wdkService: WdkService) {
  return await wdkService.getAnswerJson(
    {
      searchName: 'AllDatasets',
      searchConfig: { parameters: {} },
    },
    {
      attributes: [
        'display_name',
        'dataset_id',
        'study_access',
        'email',
        'policy_url',
        'request_needs_approval',
        'bulk_download_url',
      ],
      tables: []
    }
  );
}

export function getStudyId(record: RecordInstance) {
  return getStringAttributeValue(record, 'dataset_id');
}

export function getStudyName(record: RecordInstance) {
  return getStringAttributeValue(record, 'display_name');
}

export function getStudyAccess(record: RecordInstance) {
  return getStringAttributeValue(record, 'study_access')?.toLowerCase();
}

export function getStudyEmail(record: RecordInstance) {
  return getStringAttributeValue(record, 'email');
}

export function getStudyPolicyUrl(record: RecordInstance) {
  return getStringAttributeValue(record, 'policy_url');
}

export function getStudyRequestNeedsApproval(record: RecordInstance) {
  return getStringAttributeValue(record, 'request_needs_approval');
}

function getStringAttributeValue(record: RecordInstance, attributeName: string) {
  const attributeValue = record.attributes[attributeName];
  if (typeof attributeValue === 'string') return attributeValue;
  return null;
}
