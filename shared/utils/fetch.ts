import { object, string } from "zod/mini";

export const FetchErrorData = object({
  message: string(),
});

export const FetchError = object({
  data: FetchErrorData,
});

export const fetchError = (error: unknown) => {
  if (!error) return;
  const result = FetchError.safeParse(error);
  if (!result.success) return;
  const { data } = result.data;
  return data.message;
};
