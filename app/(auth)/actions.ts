"use server";

// Auth is handled by FastAPI backend

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  _formData: FormData
): Promise<LoginActionState> => {
  return { status: "success" };
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  _formData: FormData
): Promise<RegisterActionState> => {
  return { status: "success" };
};
