import type { z } from 'zod';

export type Touched<Values> = {
	[K in keyof Values]?: boolean;
};

export type Errors<Values, ZodSchema> = {
	[K in keyof Values]?: z.ZodError<ZodSchema>;
};

export type Field<Values> = keyof Values;

export type ResetFormArgs<Values, ZodSchema> = {
	values?: Values;
	errors?: Errors<Values, ZodSchema>;
	touched?: Touched<Values>;
};
