export type Touched<Values> = {
	[K in keyof Values]?: boolean;
};

export type Errors<Values> = {
	[K in keyof Values]?: string[];
};

export type Field<Values> = keyof Values;

export type ResetFormArgs<Values> = {
	values?: Values;
	errors?: Errors<Values>;
	touched?: Touched<Values>;
};
