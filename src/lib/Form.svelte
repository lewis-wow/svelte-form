<script lang="ts">
	import type { Errors, Touched } from './types.js';

	import { createForm, type Bag } from './form.js';
	import type { z } from 'zod';
	import { onMount, setContext } from 'svelte';

	type Values = $$Generic<Record<string, unknown>>;
	export let initialValues: Values;
	export let validationSchema: z.Schema<Values> | undefined = undefined;
	export let validate: ((values: Values) => Errors<Values> | Promise<Errors<Values>>) | undefined;
	export let initialTouched: Touched<Values> | undefined = undefined;
	export let initialErrors: Errors<Values> | undefined = undefined;
	export let onSubmit: (bag: Bag<Values, true>) => Promise<void>;
	export let validateOnBlur = true;
	export let validateOnChange = true;

	export let validateOnMount = false;

	const form = createForm({
		initialValues,
		validationSchema,
		initialTouched,
		initialErrors,
		validateOnBlur,
		validateOnChange,
		validate,
		onSubmit
	});

	export const context = form;

	const {
		values,
		errors,
		touched,
		isDirty,
		isSubmitting,
		isValid,
		isValidating,
		submitAttemptCount,
		submitFailureCount,
		submitSuccessCount,
		submitForm,
		handleChange,
		handleSubmit,
		resetForm,
		validate: validationFunction
	} = form;

	setContext('__svelte-form', form);

	onMount(() => {
		if (validateOnMount) validationFunction();
	});
</script>

<slot
	errors={$errors}
	touched={$touched}
	values={$values}
	isDirty={$isDirty}
	isSubmitting={$isSubmitting}
	isValid={$isValid}
	isValidating={$isValidating}
	submitAttemptCount={$submitAttemptCount}
	submitFailureCount={$submitFailureCount}
	submitSuccessCount={$submitSuccessCount}
	{resetForm}
	{handleChange}
	{handleSubmit}
	{submitForm}
	{form}
/>
