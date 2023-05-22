import type { z } from 'zod';
import type { Errors, Field, ResetFormArgs, Touched } from './types.js';
import { derived, get, writable, type Readable, type Writable } from 'svelte/store';
import isDeeplyEqual from 'deep-equal';
import type { ActionReturn } from 'svelte/action';
import { getContext } from 'svelte';

export type CreateFormArgs<Values extends Record<string, unknown>> = {
	initialValues: Values;
	validationSchema?: z.Schema<Values>;
	validate?: (values: Values) => Errors<Values> | Promise<Errors<Values>>;
	initialTouched?: Touched<Values> | null | undefined;
	initialErrors?: Errors<Values> | null | undefined;
	onSubmit: (bag: Bag<Values, true>) => void | Promise<void>;
	validateOnChange?: boolean;
	validateOnBlur?: boolean;
};

export interface Bag<Values extends Record<string, unknown>, isSubscribed extends boolean = false> {
	values: isSubscribed extends true ? Values : Writable<Values>;
	errors: isSubscribed extends true ? Errors<Values> : Writable<Errors<Values>>;
	touched: isSubscribed extends true ? Touched<Values> : Writable<Touched<Values>>;
	isSubmitting: isSubscribed extends true ? boolean : Writable<boolean>;
	isValidating: isSubscribed extends true ? boolean : Writable<boolean>;
	submitAttemptCount: isSubscribed extends true ? number : Writable<number>;
	submitFailureCount: isSubscribed extends true ? number : Writable<number>;
	submitSuccessCount: isSubscribed extends true ? number : Writable<number>;
	isValid: isSubscribed extends true ? boolean : Readable<boolean>;
	isDirty: isSubscribed extends true ? boolean : Readable<boolean>;
	resetForm: (nextInitialState?: ResetFormArgs<Values>) => void;
	setFieldTouched: (field: Field<Values>, isTouched: boolean, shouldValidate?: boolean) => void;
	setFieldValue: (field: Field<Values>, value: unknown, shouldValidate?: boolean) => void;
	setFieldError: (field: Field<Values>, error: string[]) => void;
	setTouched: (fields: Touched<Values>, shouldValidate?: boolean) => void;
	setValues: (fields: Values, shouldValidate?: boolean) => void;
	setErrors: (fields: Errors<Values>) => void;
	validate: () => Promise<Writable<Errors<Values>>>;
	validateField: (field: Field<Values>) => Promise<Writable<Errors<Values>>>;
	submitForm: () => Promise<void>;
	handleChange: (node: HTMLInputElement, name: Field<Values>) => ActionReturn;
	handleSubmit: (e?: SubmitEvent) => void;
}

export const createForm = <Values extends Record<string, unknown>>({
	initialValues,
	initialErrors,
	initialTouched,
	validationSchema,
	onSubmit,
	validate: validationFunction,
	validateOnChange = true,
	validateOnBlur = true
}: CreateFormArgs<Values>) => {
	const _initialTouched: Touched<Values> =
		initialTouched ??
		Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: false }), {});

	const _initialErrors: Errors<Values> =
		initialErrors ?? Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: null }), {});

	const values = writable(initialValues);
	const errors = writable(_initialErrors);
	const touched = writable(_initialTouched);

	const isSubmitting = writable(false);
	const isValidating = writable(false);
	const submitAttemptCount = writable(0);
	const submitFailureCount = writable(0);
	const submitSuccessCount = writable(0);

	const isValid = derived([errors], ([$errors]) =>
		Object.keys($errors).some((key: Field<Values>) => $errors[key] !== null)
	);

	const isDirty = derived([values], ([$values]) => isDeeplyEqual($values, initialValues));

	const resetForm = (nextInitialState?: ResetFormArgs<Values>) => {
		const nextValues = nextInitialState ? nextInitialState?.values ?? initialValues : initialValues;
		const nextErrors = nextInitialState
			? nextInitialState?.errors ?? _initialErrors
			: _initialErrors;
		const nextTouched = nextInitialState
			? nextInitialState?.touched ?? _initialTouched
			: _initialTouched;

		values.set(nextValues);
		errors.set(nextErrors);
		touched.set(nextTouched);
	};

	const setFieldTouched = (
		field: Field<Values>,
		isTouched: boolean,
		shouldValidate = validateOnBlur
	) => {
		touched.update((t) => ({ ...t, [field]: isTouched }));

		if (isTouched && shouldValidate) validateField(field);
	};

	const setFieldValue = (
		field: Field<Values>,
		value: unknown,
		shouldValidate = validateOnChange
	) => {
		values.update((v) => ({ ...v, [field]: value }));

		if (shouldValidate) validateField(field);
	};

	const setTouched = (fields: Touched<Values>, shouldValidate = validateOnBlur) => {
		touched.update((t) => ({ ...t, ...fields }));

		if (shouldValidate) validate();
	};

	const setValues = (fields: Values, shouldValidate = validateOnChange) => {
		values.update((v) => ({ ...v, ...fields }));

		if (shouldValidate) validate();
	};

	const setErrors = (fields: Errors<Values>) => {
		errors.update((e) => ({ ...e, ...fields }));
	};

	const setFieldError = (field: Field<Values>, _errors: string[]) => {
		errors.update((e) => ({ ...e, [field]: _errors }));
	};

	const submitForm = () => {
		if (isValid) {
			const result = handleSubmit();
			return Promise.resolve(result);
		} else {
			return Promise.reject();
		}
	};

	const handleSubmit = async (e?: SubmitEvent) => {
		e?.preventDefault();

		submitAttemptCount.update((currentSubmitAttemptCount) => currentSubmitAttemptCount + 1);
		isSubmitting.set(true);
		isValidating.set(true);

		validate();
		isValidating.set(false);

		// isValid hasn't updated yet
		if (Object.keys(get(errors)).some((key: Field<Values>) => get(errors)[key] !== null)) {
			submitFailureCount.update((currentSubmitFailureCount) => currentSubmitFailureCount + 1);
			isSubmitting.set(false);

			return;
		}

		await onSubmit(getBag());
		setTouched(
			Object.keys(get(values)).reduce((acc, key: Field<Values>) => ({ ...acc, [key]: false }), {})
		);
		isSubmitting.set(false);
	};

	const validateField = async (field?: Field<Values>): Promise<Writable<Errors<Values>>> => {
		if (validationFunction) {
			errors.set(await validationFunction(get(values)));
			return errors;
		}

		if (!validationSchema) return errors;

		const result = await validationSchema.safeParseAsync(get(values));

		if (field) {
			errors.update((errors) => ({
				...errors,
				[field]: result.success ? null : result.error.errors.map((e) => e.message)
			}));

			return errors;
		}

		errors.update((errors) => ({
			...errors,
			...(result.success
				? Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: null }), {})
				: result.error.flatten().fieldErrors)
		}));

		return errors;
	};

	const validate = async () => await validateField();

	const handleChange = (node: HTMLInputElement, name: Field<Values>) => {
		const handleInput = async (e: Event) => {
			const { value } = e.target as HTMLInputElement;

			values.update((v) => ({ ...v, [name]: value }));
			await validateField(name);
		};

		const handleBlur = (e: Event) => {
			touched.update((t) => ({ ...t, [name]: true }));
			handleInput(e);
		};

		node.addEventListener('input', handleInput);
		node.addEventListener('blur', handleBlur);

		return {
			destroy() {
				node.removeEventListener('input', handleInput);
				node.removeEventListener('blur', handleBlur);
			}
		};
	};

	const bag: Bag<Values> = {
		resetForm,
		setErrors,
		setFieldError,
		setFieldTouched,
		setFieldValue,
		setTouched,
		setValues,
		submitForm,
		validateField,
		validate,
		handleChange,
		handleSubmit,
		values,
		errors,
		touched,
		isValid,
		isDirty,
		isSubmitting,
		isValidating,
		submitAttemptCount,
		submitFailureCount,
		submitSuccessCount
	};

	const getBag = () => ({
		...bag,
		values: get(values),
		errors: get(errors),
		touched: get(touched),
		isValid: get(isValid),
		isDirty: get(isDirty),
		isSubmitting: get(isSubmitting),
		isValidating: get(isValidating),
		submitAttemptCount: get(submitAttemptCount),
		submitFailureCount: get(submitFailureCount),
		submitSuccessCount: get(submitSuccessCount)
	});

	return bag;
};

export const getFormContext = <Values extends Record<string, unknown>>() =>
	getContext<Bag<Values>>('__svelte-form');
