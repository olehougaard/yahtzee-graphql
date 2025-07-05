export interface ServerResponse<Value, Error> {
  resolve<T>(onSuccess: (value: Value) => Promise<T>, onError: (error: Error) => Promise<T>): Promise<T>
  process(onSuccess: (value: Value) => Promise<unknown>): Promise<void>
  processError(onError: (error: Error) => Promise<unknown>): Promise<void>

  map<T>(f: (v: Value) => Promise<T>): Promise<ServerResponse<T, Error>>
  flatMap<T, E>(f: (v: Value) => Promise<ServerResponse<T, E>>): Promise<ServerResponse<T, Error | E>>
  filter<E>(p: (v: Value) => Promise<boolean>, error: (v: Value) => Promise<E>): Promise<ServerResponse<Value, Error | E>>
}

class OkResponse<Value, Error> implements ServerResponse<Value, Error> {
  private value: Value

  constructor(value: Value) {
    this.value = value
  }

  resolve<T>(onSuccess: (value: Value) => T, _onError: (value: Error) => T): T {
    return onSuccess(this.value)
  }
  async process(onSuccess: (value: Value) => Promise<void>): Promise<void> {
    onSuccess(this.value)
  }

  async processError(_onError: (value: Error) => void): Promise<void> {
  }

  async map<T>(f: (v: Value) => Promise<T>) {
    return new OkResponse<T, Error>(await f(this.value))
  }

  flatMap<T, E>(f: (v: Value) => Promise<ServerResponse<T, E>>) {
    return f(this.value)
  }

  async filter<E>(p: (v: Value) => Promise<boolean>, error: (v: Value) => Promise<E>): Promise<ServerResponse<Value, Error | E>> {
    if (await p(this.value)) return this
    return new ErrorResponse<Value, Error | E>(await error(this.value))
  }

}

class ErrorResponse<Value, Error> implements ServerResponse<Value, Error> {
  private error: Error

  constructor(value: Error) {
    this.error = value
  }

  resolve<T>(_onSuccess: (value: Value) => T, onError: (error: Error) => T): T {
    return onError(this.error)
  }
  async process(_onSuccess: (value: Value) => void) {
  }

  async processError(onError: (error: Error) => void) {
    onError(this.error)
  }

  async map<T>(_: (v: Value) => Promise<T>) {
    return new ErrorResponse<T, Error>(this.error)
  }

  async flatMap<T, E>(_: (v: Value) => Promise<ServerResponse<T, E>>) {
    return new ErrorResponse<T, Error>(this.error)
  }

  async filter<E>(_p: (v: Value) => Promise<boolean>, _error: (v: Value) => Promise<E>) {
    return this
  }
}

export const ServerResponse = {
  async ok<Value>(value: Value) {
    return new OkResponse<Value, never>(value)
  },
  async error<Error>(error: Error) {
    return new ErrorResponse<never, Error>(error)
  }
} as const
