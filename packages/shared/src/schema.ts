import { z } from 'zod';

export const MonthlyValuesSchema = z.array(z.number().int().nonnegative()).length(12);

export const ChannelSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  values: MonthlyValuesSchema,
});

export const EmployeeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  values: MonthlyValuesSchema,
  channels: z.array(ChannelSchema).optional(),
});

export const BranchSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  values: MonthlyValuesSchema,
  employees: z.array(EmployeeSchema).optional(),
});

export const CompanySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  values: MonthlyValuesSchema,
  branches: z.array(BranchSchema),
});

export type Channel = z.infer<typeof ChannelSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type Company = z.infer<typeof CompanySchema>;
