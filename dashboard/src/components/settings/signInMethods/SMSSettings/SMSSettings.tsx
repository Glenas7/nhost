import Form from '@/components/common/Form';
import SettingsContainer from '@/components/settings/SettingsContainer';
import { useUI } from '@/context/UIContext';
import {
  GetSignInMethodsDocument,
  useGetSignInMethodsQuery,
  useUpdateConfigMutation,
} from '@/generated/graphql';
import { useCurrentWorkspaceAndApplication } from '@/hooks/useCurrentWorkspaceAndApplication';
import ActivityIndicator from '@/ui/v2/ActivityIndicator';
import Input from '@/ui/v2/Input';
import Option from '@/ui/v2/Option';
import Select from '@/ui/v2/Select';
import Text from '@/ui/v2/Text';
import getServerError from '@/utils/settings/getServerError';
import { getToastStyleProps } from '@/utils/settings/settingsConstants';
import { yupResolver } from '@hookform/resolvers/yup';
import Image from 'next/image';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  accountSid: Yup.string().label('Account SID').when('enabled', {
    is: true,
    then: Yup.string().required(),
  }),
  authToken: Yup.string().label('Auth Token').when('enabled', {
    is: true,
    then: Yup.string().required(),
  }),
  messagingServiceId: Yup.string()
    .label('Messaging Service ID')
    .when('enabled', {
      is: true,
      then: Yup.string().required(),
    }),
  enabled: Yup.boolean().label('Enabled'),
});

export type SMSSettingsFormValues = Yup.InferType<typeof validationSchema>;

export default function SMSSettings() {
  const { maintenanceActive } = useUI();
  const { currentApplication } = useCurrentWorkspaceAndApplication();
  const [updateConfig] = useUpdateConfigMutation({
    refetchQueries: [GetSignInMethodsDocument],
  });

  const { data, error, loading } = useGetSignInMethodsQuery({
    variables: { appId: currentApplication?.id },
    fetchPolicy: 'cache-only',
  });

  const { accountSid, authToken, messagingServiceId } =
    data?.config?.provider?.sms || {};
  const { enabled } = data?.config?.auth?.method?.smsPasswordless || {};

  const form = useForm<SMSSettingsFormValues>({
    reValidateMode: 'onSubmit',
    defaultValues: {
      accountSid: accountSid || '',
      authToken: authToken || '',
      messagingServiceId: messagingServiceId || '',
      enabled: enabled || false,
    },
    resolver: yupResolver(validationSchema),
  });

  if (loading) {
    return (
      <ActivityIndicator
        delay={1000}
        label="Loading settings for the SMS provider..."
        className="justify-center"
      />
    );
  }

  if (error) {
    throw error;
  }

  const { register, formState, watch } = form;
  const authSmsPasswordlessEnabled = watch('enabled');

  const handleSMSSettingsChange = async (values: SMSSettingsFormValues) => {
    const updateConfigPromise = updateConfig({
      variables: {
        appId: currentApplication.id,
        config: {
          provider: {
            sms: {
              accountSid: values.accountSid,
              authToken: values.authToken,
              messagingServiceId: values.messagingServiceId,
            },
          },
          auth: {
            method: {
              smsPasswordless: {
                enabled: values.enabled,
              },
            },
          },
        },
      },
    });

    try {
      await toast.promise(
        updateConfigPromise,
        {
          loading: `SMS settings are being updated...`,
          success: `SMS settings have been updated successfully.`,
          error: getServerError(
            `An error occurred while trying to update SMS settings.`,
          ),
        },
        getToastStyleProps(),
      );

      form.reset(values);
    } catch {
      // Note: The toast will handle the error.
    }
  };

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSMSSettingsChange}>
        <SettingsContainer
          title="Phone Number (SMS)"
          description="Allow users to sign in with Phone Number (SMS)."
          slotProps={{
            submitButton: {
              disabled: !formState.isDirty || maintenanceActive,
              loading: formState.isSubmitting,
            },
          }}
          switchId="enabled"
          showSwitch
          docsLink="https://docs.nhost.io/authentication/sign-in-with-phone-number-sms"
          docsTitle="how to sign in users with a phone number (SMS)"
          className={twMerge(
            'grid grid-flow-col grid-cols-2 grid-rows-4 gap-y-4 gap-x-3 px-4 py-2',
            !authSmsPasswordlessEnabled && 'hidden',
          )}
        >
          <Select
            className="col-span-2 lg:col-span-1"
            variant="normal"
            hideEmptyHelperText
            label="Provider"
            disabled
            value="twilio"
            slotProps={{
              root: {
                slotProps: {
                  buttonLabel: {
                    className: 'grid grid-flow-col items-center gap-1 text-sm+',
                  },
                },
              },
            }}
          >
            <Option value="twilio">
              <Image
                src="/assets/brands/twilio.svg"
                alt="Logo of Twilio"
                width={20}
                height={20}
                layout="fixed"
              />

              <Text>Twilio</Text>
            </Option>
          </Select>
          <Input
            {...register('accountSid')}
            name="accountSid"
            id="accountSid"
            placeholder="Account SID"
            className="col-span-2 lg:col-span-1"
            fullWidth
            hideEmptyHelperText
            label="Account SID"
            error={!!formState.errors?.accountSid}
            helperText={formState.errors?.accountSid?.message}
          />
          <Input
            {...register('authToken')}
            name="authToken"
            id="authToken"
            placeholder="Auth Token"
            className="col-span-2 lg:col-span-1"
            fullWidth
            hideEmptyHelperText
            label="Auth Token"
            error={!!formState.errors?.authToken}
            helperText={formState.errors?.authToken?.message}
          />
          <Input
            {...register('messagingServiceId')}
            name="messagingServiceId"
            id="messagingServiceId"
            placeholder="Messaging Service ID"
            className="col-span-2 lg:col-span-1"
            fullWidth
            hideEmptyHelperText
            label="Messaging Service ID"
            error={!!formState.errors?.messagingServiceId}
            helperText={formState.errors?.messagingServiceId?.message}
          />
        </SettingsContainer>
      </Form>
    </FormProvider>
  );
}
