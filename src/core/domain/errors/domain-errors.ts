export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string) {
    super(`${entity} no encontrado`, "NOT_FOUND");
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "No autorizado") {
    super(message, "UNAUTHORIZED");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class ClockError extends DomainError {
  constructor(message: string) {
    super(message, "CLOCK_ERROR");
  }
}
