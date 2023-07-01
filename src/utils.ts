import { TimeoutError } from "./error";

export function withTimeout<T>(
  task: Promise<T> | (() => Promise<T>),
  message?: string,
  timeout = 1000
): Promise<T> {
  return Promise.race([
    typeof task === "function" ? task() : task,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(message)), timeout)
    ),
  ]);
}
