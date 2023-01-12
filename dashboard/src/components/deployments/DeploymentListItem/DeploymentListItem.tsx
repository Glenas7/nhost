import NavLink from '@/components/common/NavLink';
import AppDeploymentDuration from '@/components/deployments/AppDeploymentDuration';
import { useCurrentWorkspaceAndApplication } from '@/hooks/useCurrentWorkspaceAndApplication';
import { Avatar } from '@/ui/Avatar';
import Status, { StatusEnum } from '@/ui/Status';
import type { DeploymentStatus } from '@/ui/StatusCircle';
import { StatusCircle } from '@/ui/StatusCircle';
import Button from '@/ui/v2/Button';
import { Dropdown } from '@/ui/v2/Dropdown';
import IconButton from '@/ui/v2/IconButton';
import ArrowCounterclockwiseIcon from '@/ui/v2/icons/ArrowCounterclockwiseIcon';
import DotsHorizontalIcon from '@/ui/v2/icons/DotsHorizontalIcon';
import { ListItem } from '@/ui/v2/ListItem';
import Tooltip from '@/ui/v2/Tooltip';
import { toastStyleProps } from '@/utils/settings/settingsConstants';
import type { DeploymentRowFragment } from '@/utils/__generated__/graphql';
import { useInsertDeploymentMutation } from '@/utils/__generated__/graphql';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { toast } from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';

export interface DeploymentListItemProps {
  /**
   * Deployment data.
   */
  deployment: DeploymentRowFragment;
  /**
   * Determines whether or not the deployment is live.
   */
  isLive?: boolean;
  /**
   * Determines whether or not the redeploy button should be shown for the
   * deployment.
   */
  showRedeploy?: boolean;
  /**
   * Determines whether or not the redeploy button is disabled.
   */
  disableRedeploy?: boolean;
}

export default function DeploymentListItem({
  deployment,
  isLive,
  showRedeploy,
  disableRedeploy,
}: DeploymentListItemProps) {
  const router = useRouter();
  const { currentWorkspace, currentApplication } =
    useCurrentWorkspaceAndApplication();

  const showTime =
    !['SCHEDULED', 'PENDING'].includes(deployment.deploymentStatus) &&
    deployment.deploymentStartedAt;

  const relativeDateOfDeployment = showTime
    ? formatDistanceToNowStrict(parseISO(deployment.deploymentStartedAt), {
        addSuffix: true,
      })
    : '';

  const [insertDeployment, { loading }] = useInsertDeploymentMutation();
  const { commitMessage } = deployment;

  async function handleRedeployment(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    const insertDeploymentPromise = insertDeployment({
      variables: {
        object: {
          appId: currentApplication?.id,
          commitMessage: deployment.commitMessage,
          commitSHA: deployment.commitSHA,
          commitUserAvatarUrl: deployment.commitUserAvatarUrl,
          commitUserName: deployment.commitUserName,
          deploymentStatus: 'SCHEDULED',
        },
      },
    });

    await toast.promise(
      insertDeploymentPromise,
      {
        loading: 'Scheduling deployment...',
        success: 'Deployment has been scheduled successfully.',
        error: 'An error occurred when scheduling deployment.',
      },
      toastStyleProps,
    );
  }

  return (
    <ListItem.Root
      secondaryAction={
        <Dropdown.Root id="deployment-management-menu">
          <Dropdown.Trigger asChild hideChevron>
            <IconButton variant="borderless" color="secondary">
              <DotsHorizontalIcon />
            </IconButton>
          </Dropdown.Trigger>

          <Dropdown.Content
            menu
            PaperProps={{ className: 'w-52' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <Dropdown.Item
              onClick={() =>
                router.push(
                  `/${currentWorkspace.slug}/${currentApplication.slug}/deployments/${deployment.id}`,
                )
              }
            >
              <span>View Deployment Details</span>
            </Dropdown.Item>

            <Dropdown.Item>
              <ArrowCounterclockwiseIcon
                className={twMerge(
                  'w-4 h-4',
                  disableRedeploy && 'animate-spin-reverse',
                )}
              />

              <span>Redeploy</span>
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
      }
    >
      <ListItem.Button
        className="grid grid-flow-col items-center justify-between gap-2 px-2 py-2"
        component={NavLink}
        href={`/${currentWorkspace.slug}/${currentApplication.slug}/deployments/${deployment.id}`}
      >
        <div className="flex cursor-pointer flex-row items-center justify-center space-x-2 self-center">
          <ListItem.Avatar>
            <Avatar
              name={deployment.commitUserName}
              avatarUrl={deployment.commitUserAvatarUrl}
              className="h-8 w-8 shrink-0"
            />
          </ListItem.Avatar>

          <ListItem.Text
            primary={
              commitMessage?.trim() || (
                <span className="truncate pr-1 font-normal italic">
                  No commit message
                </span>
              )
            }
            secondary={relativeDateOfDeployment}
          />
        </div>

        <div className="grid grid-flow-col gap-2 items-center">
          {showRedeploy && (
            <Tooltip
              title="An active deployment cannot be re-triggered"
              hasDisabledChildren={disableRedeploy || loading}
              disableHoverListener={!disableRedeploy}
            >
              <Button
                disabled={disableRedeploy || loading}
                size="small"
                color="secondary"
                variant="outlined"
                onClick={handleRedeployment}
                startIcon={
                  <ArrowCounterclockwiseIcon
                    className={twMerge(
                      'w-4 h-4',
                      disableRedeploy && 'animate-spin-reverse',
                    )}
                  />
                }
                className="rounded-full py-1 px-2 text-xs"
              >
                {disableRedeploy ? 'Redeploying...' : 'Redeploy'}
              </Button>
            </Tooltip>
          )}

          {isLive && (
            <div className="w-12 flex justify-end">
              <Status status={StatusEnum.Live}>Live</Status>
            </div>
          )}

          <div className="w-16 text-right font-mono text-sm- font-medium">
            {deployment.commitSHA.substring(0, 7)}
          </div>

          {showTime && (
            <div className="w-[80px] text-right font-mono text-sm- font-medium">
              <AppDeploymentDuration
                startedAt={deployment.deploymentStartedAt}
                endedAt={deployment.deploymentEndedAt}
              />
            </div>
          )}

          <StatusCircle
            status={deployment.deploymentStatus as DeploymentStatus}
          />
        </div>
      </ListItem.Button>
    </ListItem.Root>
  );
}
