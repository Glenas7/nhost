import { useDialog } from '@/components/common/DialogProvider';
import Form from '@/components/common/Form';
import Button from '@/ui/v2/Button';
import Input from '@/ui/v2/Input';
import Text from '@/ui/v2/Text';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as Yup from 'yup';

export interface CreateUserFormValues {
  /**
   * The name of the role.
   */
  name: string;
}

export interface CreateUserFormProps {
  /**
   * Function to be called when the form is submitted.
   */
  onSubmit: (values: CreateUserFormValues) => void;
  /**
   * Function to be called when the operation is cancelled.
   */
  onCancel?: VoidFunction;
  /**
   * Submit button text.
   *
   * @default 'Save'
   */
  submitButtonText?: string;
}

export const CreateUserFormValidationSchema = Yup.object({
  name: Yup.string().required('This field is required.'),
});

export default function CreateUserForm({
  onSubmit,
  onCancel,
  submitButtonText = 'Save',
}: CreateUserFormProps) {
  const { onDirtyStateChange } = useDialog();

  const form = useForm<CreateUserFormValues>({
    defaultValues: {},
    reValidateMode: 'onSubmit',
    resolver: yupResolver(CreateUserFormValidationSchema),
  });

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting },
  } = form;

  const isDirty = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    onDirtyStateChange(isDirty, 'dialog');
  }, [isDirty, onDirtyStateChange]);

  return (
    <FormProvider {...form}>
      <div className="grid grid-flow-row gap-2 px-6 pb-6">
        <Text variant="subtitle1" component="span">
          Enter the name for the role below.
        </Text>

        <Form onSubmit={onSubmit} className="grid grid-flow-row gap-4">
          <Input
            {...register('name')}
            inputProps={{ maxLength: 100 }}
            id="name"
            label="Name"
            placeholder="Enter value"
            hideEmptyHelperText
            error={!!errors.name}
            helperText={errors?.name?.message}
            fullWidth
            autoComplete="off"
            autoFocus
          />

          <div className="grid grid-flow-row gap-2">
            <Button type="submit" loading={isSubmitting}>
              {submitButtonText}
            </Button>

            <Button variant="outlined" color="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </FormProvider>
  );
}
