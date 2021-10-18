import { ActionCreatorServices } from '@veupathdb/wdk-client/lib/Core/WdkMiddleware';
import { makeActionCreator, InferAction } from '@veupathdb/wdk-client/lib/Utils/ActionCreatorUtils';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import { checkPermissions, UserPermissions } from 'ebrc-client/StudyAccess/permission';

import { isAllowedAccess } from './DataRestrictionUtils';

export type Action =
  | InferAction<typeof restricted>
  | InferAction<typeof unrestricted>
  | InferAction<typeof clearRestrictions>;

// FIXME: Retire this type once the study entities derived by fetchStudies
// have been properly typed
export type Study = any;

// FIXME: Retire this type once DataRestrictionUtils has been properly typed
export type DataRestrictionActionType = string;

export interface ActionAttemptDetails {
  studyId: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export function attemptAction(action: DataRestrictionActionType, details: ActionAttemptDetails) {
  return function run({ wdkService }: ActionCreatorServices) {
    const user$ = wdkService.getCurrentUser();
    const studies$ = fetchStudies(wdkService);

    return Promise.all([ user$, studies$ ]).then(([ user, studies ]) => {
      return checkPermissions(user).then(permissions => {
        return handleAction(
          permissions,
          // FIXME: Either properly type the approvedStudies property, or retire it
          user.properties.approvedStudies as unknown as string[] | undefined,
          studies[0],
          action,
          details
        );
      });
    })
  }
}

export const restricted = makeActionCreator(
  'data-restriction/restricted',
  (study: Study, action: DataRestrictionActionType) => ({
    study,
    action
  })
);

export const unrestricted = makeActionCreator(
  'data-restriction/unrestricted',
  (study: Study, action: DataRestrictionActionType) => ({
    study,
    action
  })
);

export const clearRestrictions = makeActionCreator('data-restriction/cleared');

// Create restriction action
function handleAction(
  permissions: UserPermissions,
  approvedStudies: string[] | undefined,
  studies: Study[],
  action: DataRestrictionActionType,
  { studyId, onAllow, onDeny }: Partial<ActionAttemptDetails> = {}
): Action {
  console.info(label('Restriction Encountered:'), { action, studyId });
  const study = studies.find(study => studyId === study.id);

  if (study == null) {
    const error = new Error(label(`Invalid reference: couldn't find study with id "${studyId}"`));
    console.warn('Allowing action `%s` for unknown study `%s`.', action, study);
    console.error(error);
    if (typeof onAllow === 'function') onAllow();
    return clearRestrictions();
  }

  if (isAllowedAccess({ permissions, approvedStudies, action, study })) {
    if (typeof onAllow === 'function') onAllow();
    return unrestricted(study, action);
  }

  if (typeof onDeny === 'function') onDeny();
  return restricted(study, action);
}

export function label(str: string) {
  return `[DataRestriction] ${str}`;
}