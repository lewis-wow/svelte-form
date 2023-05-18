# type-safe svelte form

```svelte
<Form
	initialValues={{
		firstname: 'John'
	}}
	validationSchema={z.object({
		firstname: z.string().min(2).max(10)
	})}
	onSubmit={async ({ values }) => {
		console.log(values);
		await new Promise((r) => setTimeout(r, 1000)); // simulate fetch
	}}
	let:handleSubmit
	let:isSubmitting
	let:resetForm
	let:form
>
	<form on:submit={handleSubmit}>
		<Field {form} name="firstname" let:field>
			<input type="text" value={field.value} use:field.handleChange />
			{JSON.stringify(field.errors)}
		</Field>
		<button type="submit">
			{#if isSubmitting}
				Submitting...
			{:else}
				Submit
			{/if}
		</button>
		<button type="button" on:click={() => resetForm()}> Reset </button>
	</form>
</Form>
```
