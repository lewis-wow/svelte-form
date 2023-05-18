<script lang="ts">
	import type { Bag } from './form.js';
	import type { Field } from './types.js';

	type Values = $$Generic<Record<string, unknown>>;
	export let form: Bag<Values>;

	const { values, errors, touched } = form;
	export let name: Field<Values>;

	const handleChange = (node: HTMLInputElement) => form.handleChange(node, name);
	const setFieldValue = (value: any, shouldValidate = true) =>
		form.setFieldValue(name, value, shouldValidate);
	const setFieldTouched = (isTouched: boolean, shouldValidate = true) =>
		form.setFieldTouched(name, isTouched, shouldValidate);
	const setFieldError = (errors: string[]) => form.setFieldError(name, errors);
</script>

<slot
	{form}
	value={$values[name]}
	touched={$touched[name]}
	errors={$errors[name]}
	{handleChange}
	{setFieldValue}
	{setFieldTouched}
	{setFieldError}
	field={{
		name,
		form,
		value: $values[name],
		touched: $touched[name],
		errors: $errors[name],
		handleChange,
		setFieldValue,
		setFieldTouched,
		setFieldError
	}}
/>
