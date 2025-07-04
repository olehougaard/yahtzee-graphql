export interface ServerResponse<Value, Error> {
  resolve<T>(onSuccess: (value: Value) => T, onError: (error: Error) => T): T
  process(onSuccess: (value: Value) => void): void
  processError(onError: (error: Error) => void): void

  map<T>(f: (v: Value) => T): ServerResponse<T, Error>
  flatMap<T, E>(f: (v: Value) => ServerResponse<T, E>): ServerResponse<T, Error | E>
  filter<E>(p: (v: Value) => boolean, error: (v: Value) => E): ServerResponse<Value, Error | E>
}

class OkResponse<Value, Error> implements ServerResponse<Value, Error> {
  private value: Value

  constructor(value: Value) {
    this.value = value
  }

  resolve<T>(onSuccess: (value: Value) => T, _onError: (value: Error) => T): T {
    return onSuccess(this.value)
  }
  process(onSuccess: (value: Value) => void): void {
    onSuccess(this.value)
  }

  processError(_onError: (value: Error) => void): void {
  }

  map<T>(f: (v: Value) => T) {
    return new OkResponse<T, Error>(f(this.value))
  }

  flatMap<T, E>(f: (v: Value) => ServerResponse<T, E>): ServerResponse<T, Error | E> {
    return f(this.value)
  }

  filter<E>(p: (v: Value) => boolean, error: (v: Value) => E): ServerResponse<Value, Error | E> {
    if (p(this.value)) return this
    return new ErrorResponse<Value, Error | E>(error(this.value))
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
  process(_onSuccess: (value: Value) => void): void {
  }

  processError(onError: (error: Error) => void): void {
    onError(this.error)
  }

  map<T>(_: (v: Value) => T) {
    return new ErrorResponse<T, Error>(this.error)
  }

  flatMap<T, E>(_: (v: Value) => ServerResponse<T, E>): ServerResponse<T, Error | E> {
    return new ErrorResponse<T, Error>(this.error)
  }

  filter<E>(_p: (v: Value) => boolean, _error: (v: Value) => E) {
    return this
  }
}

export const ServerResponse = {
  ok<Value>(value: Value) {
    return new OkResponse<Value, never>(value)
  },
  error<Error>(error: Error) {
    return new ErrorResponse<never, Error>(error)
  }
} as const
