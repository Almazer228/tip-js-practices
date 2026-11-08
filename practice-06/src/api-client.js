export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });

    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Создаёт URL и добавляет query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new TypeError("baseUrl должен быть непустой строкой");
  }

  if (typeof path !== "string" || !path.trim()) {
    throw new TypeError("path должен быть непустой строкой");
  }

  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть объектом");
  }

  let base;

  try {
    base = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.search ||
    base.hash ||
    baseUrl.includes("?") ||
    baseUrl.includes("#")
  ) {
    throw new TypeError("Некорректный baseUrl");
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(path.trim())) {
    throw new TypeError("path должен быть относительным");
  }

  const normalizedBase = base.href.replace(/\/+$/, "");
  const normalizedPath = path.trim().replace(/^\/+/, "");

  if (!normalizedPath) {
    throw new TypeError("path не должен быть пустым");
  }

  const url = new URL(`${normalizedBase}/${normalizedPath}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

// Создаёт общий HTTP-клиент.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new TypeError("Укажите корректный baseUrl");
  }

  let base;

  try {
    base = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.search ||
    base.hash ||
    baseUrl.includes("?") ||
    baseUrl.includes("#")
  ) {
    throw new TypeError("Некорректный baseUrl");
  }

  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должна быть функцией");
  }

  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > 2147483647
  ) {
    throw new TypeError("timeoutMs должен быть положительным целым числом");
  }

  const normalizedBaseUrl = base.href.replace(/\/+$/, "");

  async function requestJson(
    path,
    {
      method = "GET",
      query = {},
      body,
      signal,
      timeoutMs: requestTimeoutMs = timeoutMs,
    } = {},
  ) {
    if (typeof method !== "string") {
      throw new TypeError("Метод запроса должен быть строкой");
    }

    method = method.toUpperCase();

    const allowedMethods = ["GET", "POST", "PATCH", "DELETE"];

    if (!allowedMethods.includes(method)) {
      throw new TypeError("Недопустимый HTTP-метод");
    }

    if (method === "GET" && body !== undefined) {
      throw new TypeError("GET-запрос не должен содержать body");
    }

    if (
      !Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs <= 0 ||
      requestTimeoutMs > 2147483647
    ) {
      throw new TypeError("Некорректный timeoutMs");
    }

    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("signal должен быть AbortSignal");
    }

    const url = buildUrl(normalizedBaseUrl, path, query);

    if (signal?.aborted) {
      throw new ApiError("Запрос был отменён.", {
        kind: "aborted",
        url,
        cause: signal.reason,
      });
    }

    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);

    const requestSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const headers = {
      Accept: "application/json",
    };

    const options = {
      method,
      headers,
      signal: requestSignal,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    let response;

    // Выполнение HTTP-запроса.
    try {
      response = await fetchFn(url, options);
    } catch (error) {
      if (signal?.aborted) {
        throw new ApiError("Запрос был отменён.", {
          kind: "aborted",
          url,
          cause: error,
        });
      }

      if (timeoutSignal.aborted) {
        throw new ApiError("Истекло время ожидания ответа.", {
          kind: "timeout",
          url,
          cause: error,
        });
      }

      throw new ApiError("Ошибка сети при выполнении запроса.", {
        kind: "network",
        url,
        cause: error,
      });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("Получен некорректный HTTP-ответ.", {
        kind: "invalid-response",
        url,
      });
    }

    // Сначала проверяем HTTP-ошибку.
    if (!response.ok) {
      let payload = null;

      const contentType = response.headers.get("content-type") ?? "";

      if (/application\/(?:[\w.+-]+\+)?json/i.test(contentType)) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      }

      const apiError = payload?.error;

      throw new ApiError(
        typeof apiError?.message === "string"
          ? apiError.message
          : `HTTP ${response.status}`,
        {
          kind: "http",
          status: response.status,
          code: apiError?.code ?? null,
          details: apiError?.details ?? null,
          url,
        },
      );
    }

    // Ответ 204 не содержит тела.
    if (response.status === 204) {
      return null;
    }

    // Проверяем формат успешного ответа.
    const contentType = response.headers.get("content-type") ?? "";

    if (!/application\/(?:[\w.+-]+\+)?json/i.test(contentType)) {
      throw new ApiError("Сервер вернул ответ не в формате JSON.", {
        kind: "invalid-response",
        url,
      });
    }

    // Читаем JSON.
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Не удалось разобрать JSON ответа.", {
        kind: "invalid-response",
        url,
        cause: error,
      });
    }
  }

  return { requestJson };
}